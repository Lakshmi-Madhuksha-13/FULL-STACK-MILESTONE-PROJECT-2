import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import EventDetails from '../components/EventDetails';
import BookingForm from '../components/BookingForm';

const EventBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [ticketSummary, setTicketSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Safe user parsing
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const fetchEvent = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const response = await axios.get(`http://localhost:8082/api/events/${id}`);
      setEvent(response.data);
      setError('');
    } catch (err) {
      if (!isSilent) setError('Failed to fetch event details. Ensure Event Service is running.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleBookingSuccess = (summary) => {
    setTicketSummary(summary);
    setShowSuccessModal(true);
    fetchEvent(true); // Silent update of available tickets
  };

  if (loading && !event) return <div className="app-container" style={{textAlign: 'center', padding: '3rem'}}>Loading Event Facts...</div>;
  if (error) return <div className="app-container" style={{textAlign: 'center', color: 'var(--accent)', padding: '3rem'}}>{error}</div>;
  if (!event && !loading) return <div className="app-container" style={{textAlign: 'center', padding: '3rem'}}>Event Not Found.</div>;

  return (
    <div className="app-container page-transition">
      <Link to="/events" className="btn-elite" style={{ background: 'transparent', border: '1px solid var(--glass-border)', display: 'inline-flex', marginBottom: '2rem', width: 'auto' }}>
        &larr; Back to Events
      </Link>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '4rem' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Event Registration</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <EventDetails event={event} />
          <div>
            {user ? (
               <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <BookingForm event={event} onBookingSuccess={handleBookingSuccess} user={user} />
               </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: 'var(--text-dim)' }}>Login Required</h3>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-dim)' }}>Authenticate to reserve your spot.</p>
                <button className="btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h2 className="gradient-text">Booking Confirmed!</h2>
              
              <div className="ticket-pass">
                <div className="ticket-top">OFFICIAL ENTRY PASS</div>
                <div className="ticket-body" style={{ textAlign: 'left', color: '#0f172a' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>{ticketSummary.eventName}</h4>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>TICKET ID: #TF-{ticketSummary.id}</div>
                  
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                    <strong>Attendees:</strong>
                    {ticketSummary.attendees.map((a, i) => <div key={i}>• {a.name} ({a.department})</div>)}
                  </div>
                </div>
                <div className="ticket-footer">
                    <div className="qr-mock"></div>
                </div>
              </div>

              <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                View in Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBookingPage;
