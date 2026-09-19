// components/ClientModal.jsx
import { useState, useEffect } from 'react';

export default function ClientModal({ isOpen, onClose, OnSubmit, mode, clientData, properties }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: '',
    propertyName: '',
    propertyLocation: '',
    roomNumber: '',
    roomName: '',
    rate: '',
    paidAmount: '',
    job: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    notes: ''
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedPropertyRooms, setSelectedPropertyRooms] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && clientData) {
      setFormData({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        propertyId: clientData.propertyId || '',
        propertyName: clientData.propertyName || '',
        propertyLocation: clientData.propertyLocation || '',
        roomNumber: clientData.roomNumber || '',
        roomName: clientData.roomName || '',
        rate: clientData.rate || '',
        paidAmount: clientData.paidAmount || 0,
        job: clientData.job || '',
        checkInDate: clientData.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: clientData.checkOutDate || '',
        notes: clientData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyId: '',
        propertyName: '',
        propertyLocation: '',
        roomNumber: '',
        roomName: '',
        rate: '',
        paidAmount: 0,
        job: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: '',
        notes: ''
      });
    }
  }, [mode, clientData]);

  // Update rooms when property changes
  useEffect(() => {
    if (formData.propertyId && properties.length > 0) {
      const property = properties.find(p => p._id === formData.propertyId);
      if (property) {
        setFormData(prev => ({
          ...prev,
          propertyName: property.name,
          propertyLocation: property.location
        }));
        
        const rooms = property.rooms || [];
        setSelectedPropertyRooms(rooms);
        const available = rooms.filter(room => room.isAvailable === true);
        setAvailableRooms(available);
      }
    } else {
      setAvailableRooms([]);
      setSelectedPropertyRooms([]);
    }
  }, [formData.propertyId, properties]);

  // Update room name and rate when room number changes
  useEffect(() => {
    if (formData.roomNumber && selectedPropertyRooms.length > 0) {
      const room = selectedPropertyRooms.find(r => r.roomNumber == formData.roomNumber);
      if (room) {
        setFormData(prev => ({
          ...prev,
          roomName: room.roomName,
          rate: room.pricePerNight
        }));
      }
    }
  }, [formData.roomNumber, selectedPropertyRooms]);

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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-base-100 text-base-content w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{mode === 'edit' ? 'Edit Client' : 'Add New Client'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>

            {/* Email */}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
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

            {/* Job */}
            <div>
              <label className="block text-sm font-semibold mb-1">Job/Occupation</label>
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          {/* Property Selection */}
          <div>
            <label className="block text-sm font-semibold mb-1">Property *</label>
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name} - {prop.location}</option>
              ))}
            </select>
          </div>

          {/* Room Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Room Number *</label>
              <select
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
                disabled={!formData.propertyId}
              >
                <option value="">Select Room</option>
                {availableRooms.map(room => (
                  <option key={room.roomNumber} value={room.roomNumber}>
                    #{room.roomNumber} - {room.roomName}
                  </option>
                ))}
                {/* In edit mode, also show the current room even if occupied */}
                {mode === 'edit' && formData.roomNumber && !availableRooms.find(r => r.roomNumber == formData.roomNumber) && (
                  <option value={formData.roomNumber} selected>
                    #{formData.roomNumber} - {formData.roomName} (Current)
                  </option>
                )}
              </select>
              {formData.propertyId && availableRooms.length === 0 && mode !== 'edit' && (
                <p className="text-xs text-warning mt-1">No available rooms in this property</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Room Name</label>
              <input
                type="text"
                name="roomName"
                value={formData.roomName}
                readOnly
                className="input input-bordered w-full bg-base-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Rate */}
            <div>
              <label className="block text-sm font-semibold mb-1">Rate (Rp) *</label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-sm font-semibold mb-1">Paid Amount (Rp)</label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Check-in Date */}
            <div>
              <label className="block text-sm font-semibold mb-1">Check-in Date</label>
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>

            {/* Check-out Date */}
            <div>
              <label className="block text-sm font-semibold mb-1">Check-out Date</label>
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="textarea textarea-bordered w-full"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
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