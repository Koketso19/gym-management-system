import { useState, useEffect } from 'react';

export default function ModalForm({ isOpen, onClose, OnSubmit, mode, clientData }) {
  const [formData, setFormData] = useState({
    roomNumber: '',
    propertyName: '',
    isOccupied: false,
  });

  useEffect(() => {
    if (mode === 'edit' && clientData) {
      setFormData({
        roomNumber: clientData.roomNumber || '',
        propertyName: clientData.propertyName || '',
        isOccupied: clientData.isOccupied || false,
      });
    } else {
      setFormData({
        roomNumber: '',
        propertyName: '',
        isOccupied: false,
      });
    }
  }, [mode, clientData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    OnSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-base-100 text-base-content w-full max-w-md rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">{mode === 'edit' ? 'Edit Room' : 'Add New Room'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">Room Number</label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Property Name</label>
            <input
              type="text"
              name="propertyName"
              value={formData.propertyName}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isOccupied"
              checked={formData.isOccupied}
              onChange={handleChange}
              className="checkbox checkbox-primary"
              id="occupied-checkbox"
            />
            <label htmlFor="occupied-checkbox" className="text-sm font-semibold">
              Occupied
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              {mode === 'edit' ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
