import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowPathIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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

  // live clock — for duration display
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">In Gym Now</h1>
          <p className="text-sm text-base-content/60">
            Members currently checked in — auto-refreshes every 30s
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="badge badge-lg badge-outline badge-primary gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {clients.length} inside
          </div>
          <button
            onClick={fetchInGym}
            className="btn btn-sm btn-outline btn-primary gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
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
          <div className="mb-4 rounded-full bg-base-200 p-6">
            <UserGroupIcon className="w-12 h-12 text-base-content/40" />
          </div>
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
                    <span className="badge badge-sm badge-outline badge-info">
                      Inside
                    </span>
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
                      <span className="font-medium text-primary flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {duration(c.lastCheckIn)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="card-actions justify-end mt-3">
                    <button
                      onClick={() => handleCheckOut(c._id, fullName)}
                      className="btn btn-sm btn-outline btn-warning"
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