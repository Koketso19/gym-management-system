import { Calendar, Bell, Pencil, Trash2 } from 'lucide-react';

export default function EventCard({ event, onEdit, onDelete }) {
  return (
    <div className="bg-base-100 rounded-xl shadow-md p-4 text-base-content hover:shadow-lg transition-transform hover:scale-105 duration-300">
      <h3 className="text-xl font-semibold text-primary mb-2">{event.title}</h3>

      <div className="flex items-center text-sm text-gray-500 mb-1 gap-2">
        <Calendar size={16} />
        <span>{new Date(event.date).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-3 gap-2">
        <Bell size={16} />
        <span>{event.type}</span>
      </div>

      {event.clientId && (
        <div className="text-xs text-gray-400 mb-2">
          <span className="font-medium">Client ID:</span> {event.clientId}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <button
          className="btn btn-sm btn-primary btn-outline flex items-center gap-1"
          onClick={() => onEdit(event)}
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          className="btn btn-sm btn-error btn-outline flex items-center gap-1"
          onClick={() => onDelete(event._id)}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
