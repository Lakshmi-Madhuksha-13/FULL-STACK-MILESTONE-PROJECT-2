import React from 'react';

const EventDetails = ({ event }) => {
  if (!event) return <div className="glass-panel">Loading events...</div>;

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        Event Details
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <span className="badge">{event.department}</span>
        </div>
        <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>{event.eventName}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span><strong>Date:</strong> {event.dateTime}</span>
          <span><strong>Venue:</strong> {event.venue}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block' }}>Ticket Price</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
               ₹{(typeof event.price === 'number' ? event.price : 0).toFixed(2)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block' }}>Capacity: {event.totalTickets || 0}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: (event.availableTickets || 0) > 5 ? 'var(--primary-color)' : 'var(--danger)' }}>
              {event.availableTickets || 0} tickets left
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
