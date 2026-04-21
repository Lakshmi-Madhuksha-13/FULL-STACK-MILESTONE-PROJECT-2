import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  const fetchEvent = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const response = await api.event.get(`/events/${id}`);
      setEvent(response.data);
      setError('');
    } catch (err) {
      if (!isSilent) setError('Failed to fetch event details.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleBookingStart = (data) => {
    setPendingBookingData(data);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2500));
    
    try {
        const response = await api.booking.post('/bookings', pendingBookingData);
        setTicketSummary({
            ...response.data,
            eventName: event.eventName,
            attendees: JSON.parse(pendingBookingData.attendeeDetails)
        });
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        fetchEvent(true);
    } catch (e) {
        alert("Payment Gateaway Error: Communication Failed.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading && !event) return <div className="app-container" style={{textAlign: 'center', padding: '3rem'}}>Initializing Secure Checkout...</div>;
  if (error) return <div className="app-container" style={{textAlign: 'center', color: 'var(--accent)', padding: '3rem'}}>{error}</div>;

  return (
    <div className="app-container page-transition">
      <Link to="/events" className="btn-elite" style={{ background: 'transparent', border: '1px solid var(--glass-border)', display: 'inline-flex', marginBottom: '2rem', width: 'auto' }}>
        &larr; Browse More Festivals
      </Link>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '4rem' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Event Registration</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <EventDetails event={event} />
          <div>
            {user ? (
               <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <BookingForm event={event} onBookingSuccess={handleBookingStart} user={user} />
               </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: 'var(--text-dim)' }}>Session Required</h3>
                <button className="btn-primary" onClick={() => navigate('/login')}>Login to Register</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECURE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <h2 className="gradient-text">Secure Checkout</h2>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button className={`btn-primary ${paymentMethod === 'card' ? '' : 'btn-dim'}`} style={{ flex: 1, opacity: paymentMethod === 'card' ? 1 : 0.4 }} onClick={() => setPaymentMethod('card')}>💳 Card</button>
                    <button className={`btn-primary ${paymentMethod === 'upi' ? '' : 'btn-dim'}`} style={{ flex: 1, opacity: paymentMethod === 'upi' ? 1 : 0.4 }} onClick={() => setPaymentMethod('upi')}>📱 UPI</button>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>Total Amount: <strong style={{ color: 'white' }}>₹{pendingBookingData?.totalAmount}</strong></p>
                    {paymentMethod === 'card' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" className="form-control" placeholder="Card Number" disabled={isProcessing}/>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" className="form-control" placeholder="MM/YY" disabled={isProcessing}/>
                                <input type="password" className="form-control" placeholder="CVV" disabled={isProcessing}/>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div className="qr-frame" style={{ marginBottom: '1rem' }}>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=fest@gateway&pn=TechnicalFest&am=${pendingBookingData?.totalAmount}`} alt="UPI QR" style={{ width: '150px' }} />
                            </div>
                            <input type="text" className="form-control" style={{ textAlign: 'center' }} placeholder="yourname@okaxis" disabled={isProcessing}/>
                        </div>
                    )}
                </div>

                <button className="btn-primary" onClick={handleConfirmPayment} disabled={isProcessing}>
                    {isProcessing ? 'Verifying Transaction...' : 'Pay & Confirm Booking'}
                </button>
                {!isProcessing && <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', width: '100%', marginTop: '1rem', cursor: 'pointer' }} onClick={() => setShowPaymentModal(false)}>Cancel Payment</button>}
            </div>
        </div>
      )}

      {/* REAL TICKET SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <div className="real-ticket page-transition">
              <div className="ticket-header">
                <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '2px', marginBottom: '0.5rem' }}>OFFICIAL EVENT PASS</div>
                <h3 style={{ margin: 0 }}>{ticketSummary.eventName}</h3>
                <div className="status-badge-verified" style={{ marginTop: '0.8rem', display: 'inline-block' }}>CONFIRMED</div>
              </div>

              <div className="ticket-cut ticket-cut-left"></div>
              <div className="ticket-cut ticket-cut-right"></div>

              <div className="ticket-details">
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>TICKET ID</small>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>#TF-{ticketSummary.id}</div>
                    </div>
                    <div>
                        <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>ADMISSION</small>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{ticketSummary.ticketsBooked} Person(s)</div>
                    </div>
                 </div>
                 <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>ATTENDEES</small>
                 <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {ticketSummary.attendees.map((a, i) => <div key={i}>• {a.name} ({a.department})</div>)}
                 </div>
              </div>

              <div className="real-qr-container">
                 <div className="qr-frame">
                    <img className="qr-image" 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET_VERIFIED_ID_${ticketSummary.id}_VAL_${ticketSummary.totalAmount}`} 
                         alt="Real Ticket QR" />
                 </div>
                 <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.8rem' }}>SCAN TO VERIFY ENTRY</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to My Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBookingPage;
