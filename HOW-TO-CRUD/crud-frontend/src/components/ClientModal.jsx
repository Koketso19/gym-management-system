// components/ClientModal.jsx
import { useState, useEffect } from 'react';

export default function ClientModal({ isOpen, onClose, OnSubmit, mode, clientData }) {
  const empty = {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rate: 500,
    status: 'Active',
  };

  const [formData, setFormData] = useState(empty);

  useEffect(() => {
    if (mode === 'edit' && clientData) {
      setFormData({
        username: clientData.UserID || '',
        password: '',
        firstName: clientData.FirstName || '',
        lastName: clientData.LastName || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        rate: clientData.membership?.rate ?? 500,
        status: clientData.status || 'Active',
      });
    } else {
      setFormData(empty);
    }
  }, [mode, clientData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    OnSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-3 md:p-4">
      <div className="bg-base-100 text-base-content w-full max-w-2xl rounded-xl shadow-lg p-4 md:p-6 max-h-[92vh] overflow-y-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
          {mode === 'edit' ? 'Edit Client' : 'Add New Client'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={mode === 'edit'}
                className="input input-bordered w-full disabled:bg-base-200"
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">Username can't be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Password {mode === 'add' ? '*' : '(leave blank to keep)'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={mode === 'add'}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Monthly Rate (R) *</label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'edit' ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}