// ================================================================
// frontend/src/pages/Properties.jsx
// ================================================================

import { useState, useEffect } from 'react';
import api from '../services/api';  // ✅ JWT-enabled axios
import Navbar from '../components/property/Navbar';
import PropertyCard from '../components/property/PropertyCard';

export default function Properties() {
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('add');
    const [currentProperty, setCurrentProperty] = useState(null);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ================================================================
    // FETCH PROPERTIES (only — rooms summary will come later)
    // ================================================================
    const fetchProperties = async () => {
        try {
            setLoading(true);

            const propertiesRes = await api.get('/api/properties');

            console.log('📦 Properties raw:', propertiesRes.data);

            // ✅ Handle both response shapes (array OR { properties: [...] })
            const propertiesArray = Array.isArray(propertiesRes.data)
                ? propertiesRes.data
                : propertiesRes.data.properties || [];

            // ✅ Attach empty stats placeholders so PropertyCard doesn't break
            const propertiesWithStats = propertiesArray.map((prop) => ({
                ...prop,
                totalRooms: 0,
                availableRooms: 0,
                occupiedRooms: 0,
                roomTypes: [],
            }));

            setProperties(propertiesWithStats);
            setError(null);

        } catch (err) {
            console.error('❌ Failed to load properties:', err);
            setError(err.response?.data?.message || 'Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    // ================================================================
    // MODAL CONTROLS
    // ================================================================
    const openModal = (mode = 'add', property = null) => {
        setMode(mode);
        setCurrentProperty(property);
        setName(property?.name || '');
        setLocation(property?.location || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setName('');
        setLocation('');
        setCurrentProperty(null);
    };

    // ================================================================
    // SUBMIT (CREATE / UPDATE)
    // ================================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Auto-generate _id for new properties
        const propertyData = mode === 'add'
            ? {
                _id: `PROP${Date.now()}`,
                name,
                location,
                type: 'GuestHouse',
                status: 'Active',
            }
            : { name, location };

        try {
            if (mode === 'edit' && currentProperty) {
                const res = await api.put(
                    `/api/properties/${currentProperty._id}`,
                    propertyData
                );

                const updatedProp = res.data.property || res.data;

                setProperties((prev) =>
                    prev.map((p) =>
                        p._id === currentProperty._id
                            ? { ...p, ...updatedProp }
                            : p
                    )
                );
            } else {
                const res = await api.post('/api/properties', propertyData);

                const newProp = res.data.property || res.data;

                setProperties((prev) => [
                    ...prev,
                    {
                        ...newProp,
                        totalRooms: 0,
                        availableRooms: 0,
                        occupiedRooms: 0,
                        roomTypes: [],
                    },
                ]);
            }
            closeModal();
        } catch (err) {
            console.error('❌ Failed to save property:', err);
            alert(err.response?.data?.message || 'Failed to save property');
        }
    };

    // ================================================================
    // SEARCH FILTER
    // ================================================================
    const filteredProps = properties.filter((p) =>
        `${p.name} ${p.location}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // ================================================================
    // LOADING STATE
    // ================================================================
    if (loading) {
        return (
            <>
                <Navbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onAddClick={() => openModal('add')}
                />
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </>
        );
    }

    // ================================================================
    // RENDER
    // ================================================================
    return (
        <>
            <Navbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAddClick={() => openModal('add')}
            />

            {error && (
                <div className="alert alert-error mx-4 mt-4">
                    <span>{error}</span>
                </div>
            )}

            {filteredProps.length === 0 ? (
                <div className="text-center text-gray-400 py-20">
                    <p className="text-xl">No properties found</p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => openModal('add')}
                    >
                        Add First Property
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {filteredProps.map((property) => (
                        <PropertyCard
                            key={property._id}
                            property={property}
                            onEdit={() => openModal('edit', property)}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <dialog open className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg py-4">
                            {mode === 'edit' ? 'Edit Property' : 'Add New Property'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <label className="input input-bordered my-2 flex items-center gap-2">
                                Property Name
                                <input
                                    type="text"
                                    className="grow"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </label>
                            <label className="input input-bordered my-2 flex items-center gap-2">
                                Location
                                <input
                                    type="text"
                                    className="grow"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </label>

                            <div className="modal-action justify-between">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={closeModal}
                                >
                                    ✕ Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    {mode === 'edit' ? 'Save Changes' : 'Add Property'}
                                </button>
                            </div>
                        </form>
                    </div>
                </dialog>
            )}
        </>
    );
}