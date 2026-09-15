import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

export default function EventsCalendar({ events }) {
  const calendarEvents = events.map(evt => ({
    id: evt._id,
    title: evt.title,
    date: evt.date,
  }));

  return (
    <div
      className="bg-base-100 rounded-xl shadow-md p-4 text-base-content
                 hover:shadow-lg transition-shadow duration-300 max-w-5xl mx-auto"
    >
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        height="auto"
        // Optional: Add some styling hooks to FullCalendar's elements here with custom classes
      />
    </div>
  );
} 