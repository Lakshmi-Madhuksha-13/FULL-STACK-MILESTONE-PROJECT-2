import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

const Modal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '420px', width: '90%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ marginBottom: '0.8rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-elite" onClick={onCancel} style={{ padding: '0.8rem 2rem' }}>GO BACK</button>
          <button className="btn-primary" onClick={onConfirm} style={{ padding: '0.8rem 2rem' }}>CONFIRM & PAY</button>
        </div>
      </div>
    </div>
  );
};

const EventBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([{ name: '', email: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = (() => { try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; } })();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.event.get(`/${id}`).then(r => setEvent(r.data)).catch(() => setError('Event asset unreachable.'));
  }, [id]);

  const addAttendee = () => { if (attendees.length < (event?.availableTickets || 0)) setAttendees([...attendees, { name: '', email: '' }]); };
  const removeAttendee = i => { if (attendees.length > 1) setAttendees(attendees.filter((_, idx) => idx !== i)); };
  const updateAttendee = (i, field, val) => { const a = [...attendees]; a[i][field] = val; setAttendees(a); };

  const validateForm = () => {
    if (attendees.some(a => !a.name.trim() || !a.email.trim())) { setError('Please fill Name and Email for all attendees.'); return false; }
    if (attendees.some(a => !/\S+@\S+\.\S+/.test(a.email))) { setError('Please enter valid email addresses.'); return false; }
    setError(''); return true;
  };

  const handleReviewClick = () => { if (validateForm()) setShowConfirmModal(true); };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    try {
      await api.booking.post('', {
        userId: user.id, eventId: event.id,
        ticketsBooked: attendees.length,
        totalAmount: event.price * attendees.length,
        attendeeDetails: JSON.stringify(attendees),
        status: 'CONFIRMED'
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch { setError('Booking failed after payment. Contact support immediately.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '8rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🎉</div>
      <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Payment Complete!</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>Your entry pass is now live. Redirecting to your vault...</p>
    </div>
  );

  if (!event) return <div className="app-container" style={{ textAlign: 'center', padding: '10rem', opacity: 0.4 }}>Connecting to cloud edge...</div>;

  const total = event.price * attendees.length;

  return (
    <div className="app-container page-transition">
      <Modal show={showConfirmModal} title="Proceed to Payment?" message={`${attendees.length} slot(s) for "${event.eventName}" — Total ₹${total}.`}
        onConfirm={() => { setShowConfirmModal(false); setShowPayment(true); }} onCancel={() => setShowConfirmModal(false)} />

      {showPayment && (
        <PaymentModal amount={total} eventName={event.eventName}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)} />
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '3rem' }}>
        {/* LEFT */}
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <span className="innovative-badge" style={{ background: 'var(--primary)', marginBottom: '1.5rem', display: 'inline-block' }}>OFFICIAL ENTRY PASS</span>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{event.eventName}</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem' }}>
            <span>📍 {event.venue || 'TBD'}</span>
            <span>💎 ₹{event.price}/slot</span>
          </div>

          {error && <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(244,63,94,0.06)', borderLeft: '4px solid var(--accent)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--vivid-pink)' }}>{error}</div>}

          <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.5, letterSpacing: '1.5px' }}>ATTENDEE ROSTER</h3>
          {attendees.map((a, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.68rem', opacity: 0.45, fontWeight: 900, letterSpacing: '1.5px' }}>
                <span>SLOT #{i + 1}</span>
                {attendees.length > 1 && <button onClick={() => removeAttendee(i)} style={{ background: 'transparent', border: 'none', color: 'var(--vivid-pink)', cursor: 'pointer', fontWeight: 900, fontSize: '0.68rem' }}>✕ REMOVE</button>}
              </div>
              <input type="text" placeholder="Full Name *" className="form-control" value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} style={{ marginBottom: '0.8rem' }} />
              <input type="email" placeholder="Email Address *" className="form-control" value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)} />
            </div>
          ))}
          <button onClick={addAttendee} disabled={attendees.length >= event.availableTickets}
            style={{ background: 'transparent', border: '1px dashed var(--glass-border)', color: 'var(--text-dim)', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', width: '100%', marginTop: '0.5rem' }}>
            + ADD ANOTHER ATTENDEE
          </button>
        </div>

        {/* RIGHT — Ledger */}
        <div className="glass-panel" style={{ padding: '3rem', borderTop: '4px solid var(--secondary)', alignSelf: 'start', position: 'sticky', top: '120px' }}>
          <h2 style={{ marginBottom: '2.5rem', fontSize: '1.2rem' }}>Transaction Ledger</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
            {[['Slots', `× ${attendees.length}`], ['Per Slot', `₹${event.price}`], ['Available', `${event.availableTickets} left`]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 900 }}>TOTAL</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--success)' }}>₹{total}</span>
          </div>
          <button onClick={handleReviewClick} disabled={loading} className="btn-primary" style={{ height: '58px', fontSize: '1rem' }}>
            {loading ? 'PROCESSING...' : '🔒 PROCEED TO PAYMENT'}
          </button>
          <p style={{ textAlign: 'center', opacity: 0.25, fontSize: '0.65rem', marginTop: '1rem' }}>Secured by 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
};

export default EventBookingPage;
