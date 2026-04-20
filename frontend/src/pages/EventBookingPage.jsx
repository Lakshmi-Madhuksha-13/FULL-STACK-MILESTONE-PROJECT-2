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

  if (loading && !event) return <div className="app-container" style={{textAlign: 'center', padding: '3rem'}}>Loading Event Details...</div>;
  if (error) return <div className="app-container" style={{textAlign: 'center', color: 'var(--danger)', padding: '3rem'}}>{error}</div>;
  if (!event && !loading) return <div className="app-container" style={{textAlign: 'center', padding: '3rem'}}>Event Not Found.</div>;

  return (
    <div className="app-container">
      <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
        &larr; Back to All Events
      </Link>

      <div style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(99,102,241,0.05)', borderRadius: '1.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-color)' }}>
           Secure Your Tickets
        </h2>
        
        <div className="grid-2">
          <EventDetails event={event} />
          <div className="glass-panel">
            {user ? (
              <BookingForm event={event} onBookingSuccess={handleBookingSuccess} user={user} />
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: 'var(--text-secondary)' }}>Login Required</h3>
                <p style={{ marginBottom: '1.5rem' }}>You must be authenticated to reserve your spot.</p>
                <button className="btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Booking Successful!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Your tickets have been reserved.</p>
              
              <div className="ticket-visual">
                <h3 style={{ color: 'var(--primary-color)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Ticket</h3>
                <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Event:</strong> {ticketSummary.eventName}</div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Attendee(s):</strong> 
                    <div style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                        {ticketSummary.attendees.map((a, i) => <div key={i}>{i+1}. {a.name} ({a.department})</div>)}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Quantity:</strong> {ticketSummary.ticketsBooked} Tickets</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Total Paid:</strong> ₹{ticketSummary.totalAmount}</div>
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ marginTop: '2rem' }} 
                onClick={() => { setShowSuccessModal(false); navigate('/bookings'); }}
              >
                View Booking History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBookingPage;
