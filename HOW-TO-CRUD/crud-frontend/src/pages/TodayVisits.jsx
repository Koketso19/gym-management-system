import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function TodayVisits() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All'); // All | Inside | Done

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchToday = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clients/today`, authHeader());
      setLogs(res.data.logs || []);
      setError('');
    } catch (err) {
      console.error('Error fetching today visits:', err);
      setError('Failed to load today\'s visits');
    } finally {
      setLoading(false);
    }
  };

  // initial + auto-refresh
  useEffect(() => {
    fetchToday();
    const t = setInterval(fetchToday, 30000);
    return () => clearInterval(t);
  }, []);

  // derived stats
  const inside = logs.filter((l) => !l.checkOutTime).length;
  const done = logs.filter((l) => !!l.checkOutTime).length;

  const filtered = logs.filter((l) => {
    if (filter === 'Inside') return !l.checkOutTime;
    if (filter === 'Done') return !!l.checkOutTime;
    return true;
  });

  // duration formatter
  const fmtDuration = (mins) => {
    if (!mins && mins !== 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Today's Visits</h1>
          <p className="text-sm text-base-content/60">
            {new Date().toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-lg badge-primary">
            {inside} inside
          </div>
          <div className="badge badge-lg badge-ghost">
            {done} done
          </div>
          <button onClick={fetchToday} className="btn btn-sm btn-outline">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['All', 'Inside', 'Done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg font-medium">No visits today</p>
          <p className="text-sm text-base-content/60">
            Check-ins for today will appear here
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Member</th>
                <th>UserID</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const stillIn = !log.checkOutTime;
                return (
                  <tr key={log._id} className="hover">
                    <td className="font-medium">
                      {log.FirstName} {log.LastName}
                    </td>
                    <td className="text-sm opacity-70">{log.UserID}</td>
                    <td className="text-sm">
                      {log.checkInTime?.split(' ')[1] || '—'}
                    </td>
                    <td className="text-sm">
                      {log.checkOutTime?.split(' ')[1] || '—'}
                    </td>
                    <td className="text-sm">
                      {fmtDuration(log.durationMinutes)}
                    </td>
                    <td>
                      {stillIn ? (
                        <span className="badge badge-success gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          Inside
                        </span>
                      ) : (
                        <span className="badge badge-ghost">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-base-content/60 text-right mt-3">
          Showing {filtered.length} of {logs.length} visits
        </p>
      )}
    </div>
  );
}