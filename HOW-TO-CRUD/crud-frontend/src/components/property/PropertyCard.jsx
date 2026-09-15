import React from 'react';

export default function PropertyCard({ property, onEdit }) {
  const roomTypes = Array.isArray(property.roomTypes) ? property.roomTypes : [];

  return (
    <div
      className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={onEdit}
    >
      <div className="card-body">
        <h2 className="card-title text-primary">{property.name}</h2>
        <p className="text-base-content">{property.location}</p>

        <div className="grid grid-cols-1 gap-1 text-sm text-base-content mt-2">
          <div>
            <span className="font-semibold">Total Rooms: </span>
            <span>{property.totalRooms}</span>
          </div>
          <div>
            <span className="font-semibold">Available: </span>
            <span className="text-success">{property.availableRooms}</span>
          </div>
          <div>
            <span className="font-semibold">Occupied: </span>
            <span className="text-error">{property.occupiedRooms}</span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-sm">Room Types:</h4>
          {roomTypes.length === 0 ? (
            <p className="text-xs text-gray-500">No room data</p>
          ) : (
            <ul className="text-sm mt-1 space-y-1">
              {roomTypes.map((rt) => (
                <li key={rt.type} className="flex justify-between">
                  <span className="capitalize">{rt.type}</span>
                  <span>
                    <span className="text-success">{rt.availability?.available || 0} available</span>{' '}
                    | <span className="text-error">{rt.availability?.occupied || 0} occupied</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
