import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8082/api/events');
      setEvents(response.data);
      setError('');
    } catch (err) {
      setError('Cannot connect to Event Service. Run MySQL & Microservices! ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="app-container">
      <header className="header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem' }}>Discover Tech Fests</h1>
        <p style={{ fontSize: '1.25rem' }}>Explore the top technical events happening across various domains.</p>
      </header>

      {error && <div className="glass-panel" style={{ color: 'var(--danger)', marginBottom: '2rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Exciting Events...</div>
      ) : (
        <>
          <h2 style={{ marginBottom: '2rem', paddingLeft: '0.5rem', borderLeft: '4px solid var(--primary-color)' }}>
             Upcoming Fests ({events.length})
          </h2>

          <div className="card-grid">
            {events.map(ev => {
              const ticketsSoldOut = ev.availableTickets === 0;
              return (
                <div 
                  key={ev.id} 
                  className="event-card" 
                  onClick={() => navigate(`/book/${ev.id}`)}
                  style={{ 
                    cursor: ticketsSoldOut ? 'not-allowed' : 'pointer', 
                    opacity: ticketsSoldOut ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span className="badge">
                      {ev.department}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                      ₹{ev.price}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.4rem' }}>{ev.eventName}</h3>
                  
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 {ev.venue}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>📅 {ev.dateTime}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Capacity: {ev.totalTickets}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: ticketsSoldOut ? 'var(--danger)' : 'var(--primary-color)' }}>
                        {ticketsSoldOut ? 'SOLD OUT' : `${ev.availableTickets} Left`}
                      </div>
                    </div>
                    <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem' }} disabled={ticketsSoldOut}>
                        Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default EventsPage;
