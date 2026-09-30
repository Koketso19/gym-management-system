import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

export default function Payments() {
  const role = (localStorage.getItem('role') || 'member').toLowerCase();
  const isAdmin = role === 'admin';

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const [tab, setTab] = useState(isAdmin ? 'all' : 'mine');

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-base-content/60">
          Upload and review proof of payment
        </p>
      </div>

      {isAdmin && (
        <div className="tabs tabs-boxed w-fit">
          <button
            className={`tab gap-2 ${tab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setTab('all')}
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            All Submissions
          </button>
          <button
            className={`tab gap-2 ${tab === 'mine' ? 'tab-active' : ''}`}
            onClick={() => setTab('mine')}
          >
            <UserCircleIcon className="w-4 h-4" />
            My Uploads
          </button>
        </div>
      )}

      {tab === 'mine' && <MyUploads authHeader={authHeader} />}
      {isAdmin && tab === 'all' && <AllSubmissions authHeader={authHeader} />}
    </div>
  );
}

// ================================================================
// MY UPLOADS
// ================================================================
function MyUploads({ authHeader }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchMine = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments/proof/mine`, authHeader());
      setProofs(res.data.proofs || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load your uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  const fmtDate = (s) => (s ? s.split(' ')[0] : '—');
  const fmtR    = (n) => 'R ' + Number(n || 0).toLocaleString('en-ZA');

  const statusBadge = (s) =>
    s === 'Approved' ? 'badge-outline badge-success' :
    s === 'Rejected' ? 'badge-outline badge-error'   :
                       'badge-outline badge-warning';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => setUploadOpen(true)}
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          Upload Proof
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {!loading && !error && proofs.length === 0 && (
        <EmptyState
          icon={<DocumentTextIcon className="w-10 h-10 opacity-40" />}
          text="You haven't uploaded any proof of payment yet."
        />
      )}

      {!loading && !error && proofs.length > 0 && (
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <table className="table table-sm md:table-md w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>File</th>
                <th className="hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((p) => (
                <tr key={p._id} className="hover">
                  <td className="font-medium whitespace-nowrap">{p.month}</td>
                  <td className="whitespace-nowrap">{fmtR(p.amount)}</td>
                  <td>{p.method}</td>
                  <td className="text-xs whitespace-nowrap">{fmtDate(p.paidAt)}</td>
                  <td>
                    <span className={`badge badge-sm ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`${API_URL}${p.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs btn-outline btn-info gap-1"
                    >
                      <DocumentTextIcon className="w-3.5 h-3.5" />
                      View
                    </a>
                  </td>
                  <td className="hidden md:table-cell text-xs">
                    {p.reviewNote || p.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onDone={() => { setUploadOpen(false); fetchMine(); }}
          authHeader={authHeader}
        />
      )}
    </div>
  );
}

// ================================================================
// ALL SUBMISSIONS
// ================================================================
function AllSubmissions({ authHeader }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [month, setMonth]   = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState('All');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/api/payments/proof/list?month=${month}&status=${status}`;
      const res = await axios.get(url, authHeader());
      setProofs(res.data.proofs || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [month, status]);

  const approve = async (p) => {
    const reviewNote = window.prompt('Approval note (optional):', '');
    if (reviewNote === null) return;
    try {
      await axios.post(
        `${API_URL}/api/payments/proof/approve`,
        { id: p._id, reviewNote },
        authHeader()
      );
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Approve failed');
    }
  };

  const reject = async (p) => {
    const reviewNote = window.prompt('Reason for rejection:', '');
    if (reviewNote === null) return;
    try {
      await axios.post(
        `${API_URL}/api/payments/proof/reject`,
        { id: p._id, reviewNote },
        authHeader()
      );
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed');
    }
  };

  const fmtR = (n) => 'R ' + Number(n || 0).toLocaleString('en-ZA');
  const fmtDateTime = (s) => s || '—';

  const statusBadge = (s) =>
    s === 'Approved' ? 'badge-outline badge-success' :
    s === 'Rejected' ? 'badge-outline badge-error'   :
                       'badge-outline badge-warning';

  // build last 7 months for the picker
  const monthOptions = [];
  const now = new Date();
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOptions.push(d.toISOString().slice(0, 7));
  }
  monthOptions.reverse();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 opacity-60" />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="select select-bordered select-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button
          className="btn btn-sm btn-outline gap-1"
          onClick={fetchAll}
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>

        <span className="ml-auto text-xs opacity-60">
          {proofs.length} submission{proofs.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {!loading && !error && proofs.length === 0 && (
        <EmptyState
          icon={<DocumentTextIcon className="w-10 h-10 opacity-40" />}
          text={`No submissions for ${month}.`}
        />
      )}

      {!loading && !error && proofs.length > 0 && (
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <table className="table table-sm md:table-md w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Member</th>
                <th>Month</th>
                <th>Amount</th>
                <th className="hidden md:table-cell">Method</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((p) => (
                <tr key={p._id} className="hover">
                  <td className="font-medium whitespace-nowrap">
                    {p.FirstName} {p.LastName}
                    <div className="text-xs opacity-60">@{p.UserID}</div>
                  </td>
                  <td className="whitespace-nowrap">{p.month}</td>
                  <td className="whitespace-nowrap">{fmtR(p.amount)}</td>
                  <td className="hidden md:table-cell">{p.method}</td>
                  <td className="text-xs whitespace-nowrap">{fmtDateTime(p.paidAt)}</td>
                  <td>
                    <span className={`badge badge-sm ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`${API_URL}${p.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs btn-outline btn-info gap-1"
                    >
                      <DocumentTextIcon className="w-3.5 h-3.5" />
                      View
                    </a>
                  </td>
                  <td className="whitespace-nowrap">
                    {p.status === 'Pending' ? (
                      <div className="flex gap-1">
                        <button
                          className="btn btn-xs btn-outline btn-success gap-1"
                          onClick={() => approve(p)}
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          className="btn btn-xs btn-outline btn-error gap-1"
                          onClick={() => reject(p)}
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs opacity-60">
                        {p.reviewedBy ? `by ${p.reviewedBy}` : '—'}
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
  );
}

// ================================================================
// Upload Modal
// ================================================================
function UploadModal({ onClose, onDone, authHeader }) {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('EFT');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setErr('Please attach a file'); return; }
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('month', month);
      fd.append('amount', amount);
      fd.append('method', method);
      fd.append('note', note);

      await axios.post(
        `${API_URL}/api/payments/proof/upload`,
        fd,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      onDone();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BanknotesIcon className="w-5 h-5" />
          Upload Proof of Payment
        </h3>

        {err && <div className="alert alert-error mb-3"><span>{err}</span></div>}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label"><span className="label-text">Month</span></label>
              <input
                type="month"
                className="input input-bordered w-full"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label"><span className="label-text">Amount (R)</span></label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="label"><span className="label-text">Method</span></label>
            <select
              className="select select-bordered w-full"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>EFT</option>
              <option>Cash</option>
              <option>Card</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="label"><span className="label-text">Proof file (JPG / PNG / PDF)</span></label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="file-input file-input-bordered w-full"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Message (optional)</span></label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the admin should know…"
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary gap-2" disabled={busy}>
              <ArrowUpTrayIcon className="w-4 h-4" />
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

// ================================================================
// helpers
// ================================================================
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}
function ErrorBox({ msg }) {
  return <div className="alert alert-error"><span>{msg}</span></div>;
}
function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-sm opacity-60">{text}</p>
    </div>
  );
}