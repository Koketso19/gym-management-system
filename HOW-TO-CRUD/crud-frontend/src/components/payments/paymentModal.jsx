import { useState, useEffect } from 'react';

export default function PaymentModalForm({ isOpen, onClose, onSubmit, mode, paymentData }) {
  const [form, setForm] = useState({
    tenantName: '',
    roomNumber: '',
    amount: '',
    date: '',
    status: 'Paid'
  });

  useEffect(() => {
    if (mode === 'edit' && paymentData) {
      setForm(paymentData);
    } else {
      setForm({
        tenantName: '',
        roomNumber: '',
        amount: '',
        date: '',
        status: 'Paid'
      });
    }
  }, [mode, paymentData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-base-100 text-base-content p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{mode === 'add' ? 'Add' : 'Edit'} Payment</h2>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1">Tenant Name</label>
          <input
            name="tenantName"
            value={form.tenantName}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1">Room Number</label>
          <input
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1">Amount</label>
          <input
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1">Date</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-3">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {mode === 'add' ? 'Save' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
