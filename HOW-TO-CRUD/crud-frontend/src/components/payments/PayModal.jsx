import { useState } from 'react';

export default function PayModal({ isOpen, onClose, onSubmit, client }) {
  const [amount, setAmount] = useState(client?.membership?.rate || 500);
  const [method, setMethod] = useState('Cash');
  const [note, setNote]     = useState('');

  if (!isOpen || !client) return null;

  const rate  = client.membership?.rate || 500;
  const due   = client.payment?.dueThisMonth ?? rate;
  const bal   = client.payment?.balance || 0;

  const quickSet = (n) => setAmount(rate * n);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-base-100 w-full max-w-md rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Record Payment</h2>

        <div className="mb-4 text-sm space-y-1">
          <p><b>{client.FirstName} {client.LastName}</b> · {client.UserID}</p>
          <p>Monthly rate: <b>R {rate}</b></p>
          <p>Due this month: <b className={due > 0 ? 'text-error' : 'text-success'}>R {due}</b></p>
          {bal > 0 && <p>Prepaid credit: <b className="text-success">R {bal}</b></p>}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">Amount (R)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input input-bordered w-full"
          />
          <div className="flex gap-2 mt-2">
            <button className="btn btn-xs" onClick={() => quickSet(1)}>1 month</button>
            <button className="btn btn-xs" onClick={() => quickSet(2)}>2 months</button>
            <button className="btn btn-xs" onClick={() => quickSet(3)}>3 months</button>
            <button className="btn btn-xs" onClick={() => quickSet(6)}>6 months</button>
            <button className="btn btn-xs" onClick={() => quickSet(12)}>1 year</button>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="select select-bordered w-full"
          >
            <option>Cash</option>
            <option>EFT</option>
            <option>Card</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-success"
            onClick={() => onSubmit(Number(amount), method, note)}
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}