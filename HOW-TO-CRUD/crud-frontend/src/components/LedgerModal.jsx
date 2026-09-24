import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function LedgerModal({ isOpen, onClose, client }) {
  const [year, setYear]         = useState(new Date().getFullYear().toString());
  const [ledger, setLedger]     = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!isOpen || !client) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API_URL}/api/clients/ledger`,
          { id: client._id, year },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setLedger(data.ledger || []);
        setPayments(data.payments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, client, year]);

  if (!isOpen || !client) return null;

  const badge = (s) =>
    s === 'Paid'    ? 'badge-success' :
    s === 'Partial' ? 'badge-warning' :
                      'badge-error';

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-base-100 w-full max-w-3xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Ledger — {client.FirstName} {client.LastName}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="input input-bordered input-sm w-28"
            />
            <button className="btn btn-sm btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <h3 className="font-semibold mb-2">Monthly Summary — {year}</h3>
            <table className="table table-sm w-full mb-6">
              <thead>
                <tr><th>Month</th><th>Rate</th><th>Paid</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>R {row.rate}</td>
                    <td>R {row.paid}</td>
                    <td>R {row.due}</td>
                    <td><span className={`badge ${badge(row.status)}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-semibold mb-2">Payment History</h3>
            <table className="table table-sm w-full">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Method</th><th>By</th><th>Allocated</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="text-xs">{p.paidAt}</td>
                    <td>R {p.amount}</td>
                    <td>{p.method}</td>
                    <td>{p.paidBy}</td>
                    <td className="text-xs">
                      {p.allocations.map(a => `${a.month}:R${a.amount}`).join(', ')}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-gray-500 py-3">No payments yet</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}