import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// ---- formatting helpers ----
const fmtDuration = (min) => {
  if (!min || min < 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (s) => (s ? s.split(' ')[1]?.slice(0, 5) : '—');
const fmtDate = (s) => (s ? s.split(' ')[0] : '—');

const timeSince = (startStr) => {
  if (!startStr) return '';
  const start = new Date(startStr.replace(' ', 'T'));
  const diffMin = Math.floor((Date.now() - start.getTime()) / 60000);
  return fmtDuration(diffMin);
};

export default function Clock() {
  const [client, setClient]     = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [, setTick]             = useState(0); // rerender every 30s for live timer

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // ---- load own client + history ----
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // 1) Figure out who is logged in — try every possible field
      const rawUser    = localStorage.getItem('user');
      const parsedUser = rawUser ? JSON.parse(rawUser) : {};

      let jwtPayload = {};
      try {
        const tok = localStorage.getItem('token');
        if (tok) jwtPayload = JSON.parse(atob(tok.split('.')[1]));
      } catch {}

      const identifier =
        parsedUser.UserID ||
        parsedUser.username ||
        jwtPayload.username ;
       // jwtPayload.UserID;

      if (!identifier) throw new Error('No user info — please log in again');

      // 2) Look up the client record by username
      let me = null;
      try {
        const { data } = await axios.post(
          `${API_URL}/api/clients/get-by-userid`,
          { UserID: identifier.toLowerCase() },
          authHeader()
        );
        me = data.client;
      } catch (lookupErr) {
        // 404 = this account isn't a member (e.g. admin)
        if (lookupErr.response?.status === 404) {
          setClient(null);
          setSessions([]);
          return;
        }
        throw lookupErr;
      }

      setClient(me);

      // 3) Load recent check-in history
      const { data: histRes } = await axios.post(
        `${API_URL}/api/clients/history`,
        { id: me._id, limit: 30 },
        authHeader()
      );
      setSessions(histRes.logs || []);
    } catch (err) {
      console.error('Clock load error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // live timer while inside
  useEffect(() => {
    if (!client?.currentlyInGym) return;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [client?.currentlyInGym]);

  // ---- clock in ----
  const handleClockIn = async () => {
    setBusy(true);
    try {
      await axios.post(
        `${API_URL}/api/clients/checkin`,
        { id: client._id },
        authHeader()
      );
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Clock-in failed');
    } finally {
      setBusy(false);
    }
  };

  // ---- clock out ----
  const handleClockOut = async () => {
    setBusy(true);
    try {
      await axios.post(
        `${API_URL}/api/clients/checkout`,
        { id: client._id },
        authHeader()
      );
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Clock-out failed');
    } finally {
      setBusy(false);
    }
  };

  // ---- this week's sessions (Mon–today) ----
  const thisWeek = useMemo(() => {
    const now    = new Date();
    const day    = now.getDay();               // 0 Sun .. 6 Sat
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    return sessions.filter(s => {
      const d = new Date(s.checkInTime.replace(' ', 'T'));
      return d >= monday;
    });
  }, [sessions]);

  const weekTotalMinutes = thisWeek.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  // ---- render states ----
  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)   return <p className="p-6 text-red-500">{error}</p>;

  // Not a member (admin/staff)
  if (!client) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Not a member account</h2>
            <p className="text-sm text-gray-600">
              The Clock In / Out page is for gym members. Your account is a
              staff / admin account, so it doesn't have a client record.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              To test the clock, log in as a member (e.g.{' '}
              <code>thabo.mokoena</code>).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inside = client.currentlyInGym;
  const started = client.lastCheckIn;
  const unpaid  = client.payment?.status === 'Unpaid';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Clock In / Out</h1>
        <p className="text-sm text-gray-500">
          {client.FirstName} {client.LastName} · @{client.UserID}
        </p>
      </div>

      {/* Big action card */}
      <div
        className={`card shadow-lg ${
          inside
            ? 'bg-success/10 border border-success'
            : 'bg-base-100 border border-base-300'
        }`}
      >
        <div className="card-body items-center text-center space-y-4">
          <div className="text-6xl">{inside ? '🏋️' : '🚪'}</div>

          {inside ? (
            <>
              <h2 className="text-xl font-bold text-success">You're in the gym</h2>
              <p className="text-sm text-gray-600">
                Since <b>{fmtTime(started)}</b> · {timeSince(started)} ago
              </p>
              <button
                className="btn btn-error btn-lg mt-2"
                onClick={handleClockOut}
                disabled={busy}
              >
                {busy ? 'Checking out…' : 'Clock Out'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Ready to train?</h2>
              <p className="text-sm text-gray-600">
                {unpaid
                  ? '⚠ Your membership is unpaid — payment required before clocking in.'
                  : 'Tap below to start your session.'}
              </p>
              <button
                className="btn btn-primary btn-lg mt-2"
                onClick={handleClockIn}
                disabled={busy || unpaid}
              >
                {busy ? 'Checking in…' : 'Clock In'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week summary stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">This week</div>
          <div className="stat-value text-2xl">{thisWeek.length}</div>
          <div className="stat-desc">sessions</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total time</div>
          <div className="stat-value text-2xl">{fmtDuration(weekTotalMinutes)}</div>
          <div className="stat-desc">Mon – today</div>
        </div>
        <div className="stat">
          <div className="stat-title">Visits this month</div>
          <div className="stat-value text-2xl">{client.totalVisitsThisMonth || 0}</div>
          <div className="stat-desc">{client.payment?.currentMonth}</div>
        </div>
      </div>

      {/* This week's sessions */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">This Week</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {thisWeek.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No sessions this week yet.
                    </td>
                  </tr>
                )}
                {thisWeek.map((s) => (
                  <tr key={s._id}>
                    <td>{fmtDate(s.checkInTime)}</td>
                    <td>{fmtTime(s.checkInTime)}</td>
                    <td>
                      {s.checkOutTime
                        ? fmtTime(s.checkOutTime)
                        : <span className="badge badge-success">Inside</span>}
                    </td>
                    <td>{s.durationMinutes > 0 ? fmtDuration(s.durationMinutes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Recent Sessions</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No sessions yet.
                    </td>
                  </tr>
                )}
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>{fmtDate(s.checkInTime)}</td>
                    <td>{fmtTime(s.checkInTime)}</td>
                    <td>
                      {s.checkOutTime
                        ? fmtTime(s.checkOutTime)
                        : <span className="badge badge-success">Inside</span>}
                    </td>
                    <td>{s.durationMinutes > 0 ? fmtDuration(s.durationMinutes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}