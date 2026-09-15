import { useState, useEffect } from 'react';
import axios from 'axios';
import EventNavbar from '../components/events/EventNavbar';
import EventCard from '../components/events/EventCard';
import EventModalForm from '../components/events/EventModalForm';
import EventsCalendar from '../components/events/Calendar';

const API_URL = import.meta.env.VITE_API_URL;

export default function Events() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/events`);
        setEvents(res.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedEvent({ title: '', date: '', type: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSubmit = async (formData) => {
    if (modalMode === 'add') {
      try {
        const res = await axios.post(`${API_URL}/api/events`, formData);
        setEvents((prev) => [...prev, res.data]);
        closeModal();
      } catch (err) {
        console.error('Error adding event:', err);
      }
    } else {
      try {
        const res = await axios.put(`${API_URL}/api/events/${selectedEvent._id}`, formData);
        setEvents((prev) =>
          prev.map((e) => (e._id === selectedEvent._id ? res.data : e))
        );
        closeModal();
      } catch (err) {
        console.error('Error editing event:', err);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-base-200">
      <EventNavbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddClick={openAddModal}
      />

      {/* Card View */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500 mt-6">
            No events found.
          </p>
        )}
      </div>

      {/* Calendar View */}
      <div className="px-6 py-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Calendar View</h2>
        <EventsCalendar events={filteredEvents} />
      </div>

      {/* Modal */}
      <EventModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        mode={modalMode}
        eventData={selectedEvent}
      />
    </div>
  );
}
