// ================================================================
// frontend/src/pages/Rooms.jsx
// ================================================================

import { useState, useEffect } from 'react';
import api from '../services/api';  // ✅ JWT-enabled axios
import NavBar from '../components/room/roomnavbar';
import ModalForm from '../components/room/modalForm';
import RoomCard from '../components/room/roomCard';

// Helper to group rooms by propertyId
function groupRoomsByProperty(rooms) {
    const grouped = {};
    rooms.forEach(room => {
        if (!grouped[room.propertyId]) {
            grouped[room.propertyId] = { propertyId: room.propertyId, rooms: [] };
        }
        grouped[room.propertyId].rooms.push(room);
    });
    return Object.values(grouped);
}

export default function Rooms() {
    const [isOpen, setIsOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [searchTerm, setSearchTerm] = useState('');
    const [roomData, setRoomData] = useState(null);
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Fetch rooms (backend returns plain array)
    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/rooms');
            // ✅ Backend returns array directly
            setAllRooms(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching rooms:', err.message);
            setError(err.response?.data?.message || 'Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleOpen = (mode, room = null) => {
        setRoomData(room);
        setModalMode(mode);
        setIsOpen(true);
    };

    // ✅ Create or update room
    const handleSubmit = async (newRoomData) => {
        try {
            if (modalMode === 'add') {
                const response = await api.post('/api/rooms', newRoomData);
                // ✅ Backend returns the room object directly
                setAllRooms((prev) => [...prev, response.data]);
            } else {
                const response = await api.put(
                    `/api/rooms/${roomData._id}`,
                    newRoomData
                );
                // ✅ Backend returns the updated room object
                setAllRooms((prev) =>
                    prev.map((room) =>
                        room._id === roomData._id ? response.data : room
                    )
                );
            }
            setIsOpen(false);
        } catch (error) {
            console.error('Error submitting room:', error);
            alert(error.response?.data?.message || 'Failed to save room');
        }
    };

    // ✅ Filter by room number OR property name
    const filteredRooms = allRooms.filter(room => {
        const term = searchTerm.toLowerCase();
        return (
            (room.number && room.number.toLowerCase().includes(term)) ||
            (room.propertyName && room.propertyName.toLowerCase().includes(term))
        );
    });

    const groupedRooms = groupRoomsByProperty(filteredRooms);

    // ✅ Loading state
    if (loading) {
        return (
            <>
                <NavBar onOpen={() => handleOpen('add')} onSearch={setSearchTerm} />
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar onOpen={() => handleOpen('add')} onSearch={setSearchTerm} />

            {/* ✅ Error state */}
            {error && (
                <div className="alert alert-error mx-5 mt-4">
                    <span>{error}</span>
                </div>
            )}

            <div className="p-5 space-y-10">
                {groupedRooms.length === 0 ? (
                    <div className="text-center text-gray-400 py-20">
                        <p className="text-xl">No rooms found</p>
                        <button
                            className="btn btn-primary mt-4"
                            onClick={() => handleOpen('add')}
                        >
                            Add First Room
                        </button>
                    </div>
                ) : (
                    groupedRooms.map(({ propertyId, rooms }) => {
                        // ✅ Backend provides propertyName & location
                        const propertyName = rooms[0]?.propertyName || propertyId;
                        const location = rooms[0]?.location || 'Unknown Location';

                        return (
                            <div key={propertyId}>
                                <h2 className="text-3xl font-semibold mb-1">
                                    {propertyName}
                                </h2>
                                <p className="text-gray-400 mb-4">{location}</p>

                                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {rooms.map(room => (
                                        <div
                                            key={room._id}
                                            onClick={() => handleOpen('edit', room)}
                                        >
                                            <RoomCard room={room} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ModalForm
                isOpen={isOpen}
                OnSubmit={handleSubmit}
                onClose={() => setIsOpen(false)}
                mode={modalMode}
                clientData={roomData}
            />
        </>
    );
}