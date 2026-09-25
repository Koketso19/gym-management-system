import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function CheckInLog() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // fetch all clients once
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clients/list`, authHeader());
        setClients(res.data.clients || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch history when a client is selected
  const loadHistory = async (clientId) => {
    setLogsLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/clients/history`,
        { id: clientId, limit: 500 },
        authHeader()
      );
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const selectClient = (c) => {
    setSelectedClient(c);
    loadHistory(c._id);
  };

  // filter clients in sidebar
  const filteredClients = clients.filter((c) => {
    const t = searchTerm.toLowerCase();
    return (
      c.FirstName?.toLowerCase().includes(t) ||
      c.LastName?.toLowerCase().includes(t) ||
      c.UserID?.toLowerCase().includes(t) ||
      c.phone?.includes(searchTerm)
    );
  });

  // filter logs by date range
  const filteredLogs = logs.filter((l) => {
    if (!dateFrom && !dateTo) return true;
    const d = l.date; // YYYY-MM-DD
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  // duration format
  const fmtDuration = (mins) => {
    if (!mins && mins !== 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // total duration for filtered
  const totalMins = filteredLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Check-In Log</h1>
        <p className="text-sm text-base-content/60">
          Full visit history — pick a member to see their digital book
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error"><span>{error}</span></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT — client list */}
          <aside className="lg:col-span-1 bg-base-100 border border-base-300 rounded-lg p-4 h-fit">
            <input
              type="text"
              placeholder="🔍 Search members…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm w-full mb-3"
            />

            <p className="text-xs uppercase tracking-wider text-base-content/50 mb-2">
              {filteredClients.length} member{filteredClients.length !== 1 ? 's' : ''}
            </p>

            <ul className="max-h-[600px] overflow-y-auto space-y-1">
              {filteredClients.map((c) => {
                const isActive = selectedClient?._id === c._id;
                return (
                  <li key={c._id}>
                    <button
                      onClick={() => selectClient(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'hover:bg-base-200'
                      }`}
                    >
                      <p className="font-medium text-sm">
                        {c.FirstName} {c.LastName}
                      </p>
                      <p className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                        {c.UserID}
                      </p>
                    </button>
                  </li>
                );
              })}
              {filteredClients.length === 0 && (
                <li className="text-center text-sm text-base-content/50 py-4">
                  No members match
                </li>
              )}
            </ul>
          </aside>

          {/* RIGHT — selected client's log */}
          <main className="lg:col-span-2">
            {!selectedClient ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-base-100 border border-dashed border-base-300 rounded-lg">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-lg font-medium">Pick a member</p>
                <p className="text-sm text-base-content/60">
                  Their full check-in history will appear here
                </p>
              </div>
            ) : (
              <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {selectedClient.FirstName} {selectedClient.LastName}
                    </h2>
                    <p className="text-xs text-base-content/60">
                      {selectedClient.UserID} · {selectedClient.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="badge badge-ghost">
                      {filteredLogs.length} visits
                    </div>
                    <div className="badge badge-primary">
                      {fmtDuration(totalMins)} total
                    </div>
                  </div>
                </div>

                {/* Date range */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <label className="flex items-center gap-1 text-sm">
                    <span className="opacity-60">From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input input-bordered input-xs"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <span className="opacity-60">To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input input-bordered input-xs"
                    />
                  </label>
                  {(dateFrom || dateTo) && (
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Log table */}
                {logsLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="loading loading-spinner"></span>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <p className="text-center text-sm text-base-content/60 py-10">
                    No visits in this range
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead className="bg-base-200">
                        <tr>
                          <th>Date</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((l) => (
                          <tr key={l._id}>
                            <td className="font-medium">{l.date}</td>
                            <td>{l.checkInTime?.split(' ')[1] || '—'}</td>
                            <td>{l.checkOutTime?.split(' ')[1] || '—'}</td>
                            <td>
                              {l.checkOutTime ? (
                                fmtDuration(l.durationMinutes)
                              ) : (
                                <span className="badge badge-success badge-sm">
                                  Inside
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}