import React, { useState } from 'react';

const DateManagement = () => {
  const [form, setForm] = useState({
    date: '',
    type: '',
    note: ''
  });

  const [events, setEvents] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEvent = () => {
    if (!form.date || !form.type) return;
    setEvents((prev) => [...prev, form]);
    setForm({ date: '', type: '', note: '' });
  };

  const handleDelete = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-base-100 shadow-lg rounded-xl p-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-primary">📅 Date Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Select date"
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="select select-bordered w-full"
        >
          <option value="">Select Type</option>
          <option>Rent Due</option>
          <option>Lease Start</option>
          <option>Lease End</option>
          <option>Maintenance</option>
          <option>Move-In</option>
          <option>Move-Out</option>
          <option>Other</option>
        </select>
        <input
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Optional note"
        />
      </div>

      <button className="btn btn-primary w-full md:w-auto" onClick={handleAddEvent}>
        ➕ Add Date Event
      </button>

      <div className="mt-8">
        {events.length === 0 ? (
          <p className="text-gray-500">No events yet.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event, idx) => (
              <li key={idx} className="bg-base-200 p-4 rounded-lg flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{event.type}</p>
                  <p>{new Date(event.date).toDateString()}</p>
                  {event.note && <p className="text-sm text-gray-600 italic">{event.note}</p>}
                </div>
                <button className="btn btn-sm btn-error" onClick={() => handleDelete(idx)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DateManagement;
