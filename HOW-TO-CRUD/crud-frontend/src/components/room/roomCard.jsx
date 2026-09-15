import { Home, CheckCircle, XCircle } from 'lucide-react';

export default function RoomCard({ room }) {
  return (
    <div className="bg-transparent border border-gray-600 rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-transform hover:scale-105 duration-300 cursor-pointer">
      <h3 className="text-2xl font-bold text-blue-400 mb-2">Room {room.number}</h3>

      <div className="flex justify-center items-center gap-1 text-gray-300 text-sm mb-2">
        <Home size={16} />
        <span>{room.propertyName || room.propertyId || 'Unknown Property'}</span>
      </div>

      <div className="text-gray-300 mb-3">
        <p><span className="font-semibold">Type:</span> {room.type}</p>
        <p><span className="font-semibold">Rent:</span> R{room.rent}</p>
      </div>

      {/* Features badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {room.features?.map((feature, idx) => (
          <span
            key={idx}
            className="bg-blue-600 bg-opacity-30 text-blue-300 text-xs px-3 py-1 rounded-full"
            title={feature}
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-3">
        {room.occupied ? (
          <span className="inline-flex items-center gap-1 bg-red-700 bg-opacity-20 text-red-300 text-sm px-3 py-1 rounded-full">
            <XCircle size={14} /> Occupied
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-green-700 bg-opacity-20 text-green-300 text-sm px-3 py-1 rounded-full">
            <CheckCircle size={14} /> Available
          </span>
        )}
      </div>
    </div>
  );
}
