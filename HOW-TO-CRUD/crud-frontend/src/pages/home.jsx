import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function InGym() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchInGym = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clients/in-gym`, authHeader());
      setClients(res.data.clients || []);
      setError('');
    } catch (err) {
      console.error('Error fetching in-gym:', err);
      setError('Failed to load gym members');
    } finally {
      setLoading(false);
    }
  };

  // initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchInGym();
    const interval = setInterval(fetchInGym, 30000);
    return () => clearInterval(interval);
  }, []);

  // live clock (updates every second) — for duration display
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // check out a member
  const handleCheckOut = async (id, name) => {
    if (!window.confirm(`Check out ${name}?`)) return;
    try {
      await axios.post(
        `${API_URL}/api/clients/checkout`,
        { id },
        authHeader()
      );
      fetchInGym();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check out');
    }
  };

  // duration from check-in time to now
  const duration = (checkInStr) => {
    if (!checkInStr) return '—';
    const start = new Date(checkInStr.replace(' ', 'T'));
    const diffMs = now - start;
    if (diffMs < 0) return 'just now';
    const mins = Math.floor(diffMs / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">In Gym Now</h1>
          <p className="text-sm text-base-content/60">
            Members currently checked in — auto-refreshes every 30s
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="badge badge-lg badge-primary gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            {clients.length} inside
          </div>
          <button
            onClick={fetchInGym}
            className="btn btn-sm btn-outline"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <p className="text-lg font-medium">Nobody is in the gym right now</p>
          <p className="text-sm text-base-content/60">
            Checked-in members will appear here
          </p>
        </div>
      )}

      {/* Grid of cards */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => {
            const fullName = `${c.FirstName} ${c.LastName}`;
            return (
              <div
                key={c._id}
                className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition"
              >
                <div className="card-body p-5">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-12">
                        <span className="text-lg font-bold">
                          {c.FirstName?.[0]}{c.LastName?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{fullName}</p>
                      <p className="text-xs text-base-content/60 truncate">
                        {c.UserID}
                      </p>
                    </div>
                    <span className="badge badge-success badge-sm">Inside</span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Phone</span>
                      <span className="font-medium">{c.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Checked in</span>
                      <span className="font-medium">
                        {c.lastCheckIn?.split(' ')[1] || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Duration</span>
                      <span className="font-medium text-primary">
                        {duration(c.lastCheckIn)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="card-actions justify-end mt-3">
                    <button
                      onClick={() => handleCheckOut(c._id, fullName)}
                      className="btn btn-sm btn-warning"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}