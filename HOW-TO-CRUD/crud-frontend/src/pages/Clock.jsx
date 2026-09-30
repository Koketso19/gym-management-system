import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

// ---- helpers ----
const fmtDuration = (min) => {
  if (!min || min < 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime  = (s) => (s ? s.split(' ')[1]?.slice(0, 5) : '—');
const fmtDate  = (s) => (s ? s.split(' ')[0] : '—');
const fmtDayLong = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day    : 'numeric',
    month  : 'short'
  });
};

const timeSince = (startStr) => {
  if (!startStr) return '';
  const start = new Date(startStr.replace(' ', 'T'));
  const diffMin = Math.floor((Date.now() - start.getTime()) / 60000);
  return fmtDuration(diffMin);
};

export default function Clock() {
  const [client, setClient]     = useState(null);
  const [sessions, setSessions] = useState([]);
  const [today, setToday]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [, setTick]             = useState(0);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rawUser = localStorage.getItem('user');
      const user    = rawUser ? JSON.parse(rawUser) : {};

      const identifier = user.UserID || user.username || null;
      if (!identifier) throw new Error('No user info — please log in again');

      // 1) find my client record
      const { data: whoRes } = await axios.post(
        `${API_URL}/api/clients/get-by-userid`,
        { UserID: identifier.toLowerCase() },
        authHeader()
      );
      const me = whoRes.client;
      setClient(me);

      // 2) full recent sessions
      const { data: hist } = await axios.post(
        `${API_URL}/api/clients/history`,
        { id: me._id, limit: 60 },
        authHeader()
      );
      setSessions(hist.logs || []);

      // 3) today's sessions
      const { data: day } = await axios.post(
        `${API_URL}/api/clients/my-day`,
        { id: me._id },
        authHeader()
      );
      setToday(day);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!client?.currentlyInGym) return;
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, [client?.currentlyInGym]);

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

  const thisWeek = useMemo(() => {
    const now    = new Date();
    const day    = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const week = sessions.filter(
      s => new Date(s.checkInTime.replace(' ', 'T')) >= monday
    );

    const byDay = {};
    for (const s of week) {
      if (!byDay[s.date]) byDay[s.date] = [];
      byDay[s.date].push(s);
    }
    Object.values(byDay).forEach(list =>
      list.sort((a, b) => a.checkInTime.localeCompare(b.checkInTime))
    );

    return Object.entries(byDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({
        date,
        sessions : list,
        minutes  : list.reduce((s, l) => s + (l.durationMinutes || 0), 0),
        visits   : list.length,
      }));
  }, [sessions]);

  const weekTotalMinutes = thisWeek.reduce((s, d) => s + d.minutes, 0);
  const weekTotalVisits  = thisWeek.reduce((s, d) => s + d.visits, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="alert alert-error"><span>{error}</span></div>
      </div>
    );
  }
  if (!client) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Not a member account</h2>
            <p className="text-sm text-gray-600">
              The Clock In / Out page is for gym members. Your account is a staff
              / admin account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inside    = client.currentlyInGym;
  const started   = client.lastCheckIn;
  const unpaid    = client.payment?.status === 'Unpaid';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Clock In / Out</h1>
        <p className="text-sm text-base-content/60">
          {client.FirstName} {client.LastName} · @{client.UserID}
        </p>
      </div>

      {/* Big action card */}
      <div className={`card shadow-sm border ${
        inside
          ? 'bg-success/5 border-success/40'
          : 'bg-base-100 border-base-300'
      }`}>
        <div className="card-body items-center text-center space-y-4 py-8">
          <div className={`rounded-full p-5 ${
            inside ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/60'
          }`}>
            {inside
              ? <ArrowRightOnRectangleIcon className="w-12 h-12" />
              : <ArrowLeftOnRectangleIcon className="w-12 h-12" />}
          </div>

          {inside ? (
            <>
              <h2 className="text-xl font-bold text-success">You're in the gym</h2>
              <p className="text-sm text-base-content/70">
                Checked in at <b>{fmtTime(started)}</b> · {timeSince(started)} ago
              </p>
              <button
                className="btn btn-error btn-lg mt-2 gap-2"
                onClick={handleClockOut}
                disabled={busy}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {busy ? 'Clocking out…' : 'Clock Out'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Ready to train?</h2>
              <p className="text-sm text-base-content/70">
                {today?.count > 0
                  ? `You've had ${today.count} session${today.count === 1 ? '' : 's'} today. Tap to start another.`
                  : 'Tap below to start your session.'}
              </p>

              {unpaid && (
                <p className="text-xs text-warning">
                  Heads up: your membership shows as unpaid.
                </p>
              )}

              <button
                className="btn btn-primary btn-lg mt-2 gap-2"
                onClick={handleClockIn}
                disabled={busy}
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                {busy ? 'Clocking in…' : 'Clock In'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today's sessions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h2 className="card-title text-base">
              <ClockIcon className="w-5 h-5" />
              Today · {fmtDayLong(new Date().toISOString().slice(0, 10))}
            </h2>
            <span className="text-xs text-base-content/60">
              {today?.count || 0} session{today?.count === 1 ? '' : 's'}
              {today?.totalMinutes > 0 && ` · ${fmtDuration(today.totalMinutes)}`}
            </span>
          </div>

          {!today || today.sessions.length === 0 ? (
            <p className="text-sm text-base-content/60 py-6 text-center">
              No sessions today yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {today.sessions.map((s, i) => (
                    <tr key={s._id}>
                      <td className="opacity-60">{i + 1}</td>
                      <td>{fmtTime(s.checkInTime)}</td>
                      <td>
                        {s.checkOutTime
                          ? fmtTime(s.checkOutTime)
                          : <span className="badge badge-sm badge-outline badge-info gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                              Inside
                            </span>}
                      </td>
                      <td>
                        {s.durationMinutes > 0
                          ? fmtDuration(s.durationMinutes)
                          : (s.checkOutTime ? '—' : <span className="text-xs opacity-60">running…</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Week summary */}
      <div className="stats shadow w-full bg-base-100 border border-base-300">
        <div className="stat">
          <div className="stat-title text-xs">Visits this week</div>
          <div className="stat-value text-2xl">{weekTotalVisits}</div>
          <div className="stat-desc">Mon – today</div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs">Time this week</div>
          <div className="stat-value text-2xl">{fmtDuration(weekTotalMinutes)}</div>
          <div className="stat-desc">Total across all sessions</div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs">Visits this month</div>
          <div className="stat-value text-2xl">{client.totalVisitsThisMonth || 0}</div>
          <div className="stat-desc">{client.payment?.currentMonth}</div>
        </div>
      </div>

      {/* This week grouped by day */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">This Week</h2>

          {thisWeek.length === 0 ? (
            <p className="text-sm text-base-content/60 py-6 text-center">
              No sessions this week yet.
            </p>
          ) : (
            <div className="space-y-4">
              {thisWeek.map((d) => (
                <div key={d.date} className="rounded-lg border border-base-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-base-200">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-success" />
                      <span className="font-medium text-sm">{fmtDayLong(d.date)}</span>
                    </div>
                    <span className="text-xs opacity-70">
                      {d.visits} session{d.visits === 1 ? '' : 's'} · {fmtDuration(d.minutes)}
                    </span>
                  </div>

                  <table className="table table-sm w-full">
                    <tbody>
                      {d.sessions.map((s) => (
                        <tr key={s._id}>
                          <td className="w-24 text-xs opacity-60">{fmtTime(s.checkInTime)}</td>
                          <td className="text-xs opacity-40">→</td>
                          <td className="text-xs">
                            {s.checkOutTime ? fmtTime(s.checkOutTime) : 'inside'}
                          </td>
                          <td className="text-xs text-right">
                            {s.durationMinutes > 0 ? fmtDuration(s.durationMinutes) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-base-content/60 py-6 text-center">
              No sessions yet.
            </p>
          ) : (
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
                  {sessions.map((s) => (
                    <tr key={s._id}>
                      <td className="whitespace-nowrap">{fmtDate(s.checkInTime)}</td>
                      <td>{fmtTime(s.checkInTime)}</td>
                      <td>
                        {s.checkOutTime
                          ? fmtTime(s.checkOutTime)
                          : <span className="badge badge-sm badge-outline badge-info">Inside</span>}
                      </td>
                      <td>
                        {s.durationMinutes > 0 ? fmtDuration(s.durationMinutes) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}