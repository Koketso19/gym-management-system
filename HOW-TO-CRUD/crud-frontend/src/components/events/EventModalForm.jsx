import { useState, useEffect } from 'react';

export default function EventModalForm({ isOpen, onClose, onSubmit, mode, eventData }) {
  const [formData, setFormData] = useState({ title: '', date: '', type: '' });

  useEffect(() => {
    if (mode === 'edit' && eventData) {
      setFormData(eventData);
    } else {
      setFormData({ title: '', date: '', type: '' });
    }
  }, [mode, eventData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-base-100 text-base-content rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'add' ? 'Add Event' : 'Edit Event'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Event Title"
            className="input input-bordered w-full"
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Event Type"
            className="input input-bordered w-full"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
