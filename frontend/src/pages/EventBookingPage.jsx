import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

/* ─── INLINE MODAL ─────────────────────────────── */
const Modal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '420px', width: '90%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ marginBottom: '0.8rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-elite" onClick={onCancel} style={{ padding: '0.8rem 2rem' }}>GO BACK</button>
          <button className="btn-primary" onClick={onConfirm} style={{ padding: '0.8rem 2rem', background: 'var(--primary)' }}>CONFIRM & PAY</button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const user = (() => {
    try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.event.get(`/${id}`).then(res => setEvent(res.data)).catch(() => setError('Event asset unreachable.'));
  }, [id]);

  const addAttendee = () => {
    if (attendees.length < (event?.availableTickets || 0)) setAttendees([...attendees, { name: '', email: '' }]);
  };

  const removeAttendee = (i) => { if (attendees.length > 1) setAttendees(attendees.filter((_, idx) => idx !== i)); };

  const updateAttendee = (i, field, val) => {
    const updated = [...attendees];
    updated[i][field] = val;
    setAttendees(updated);
  };

  const validateAndConfirm = () => {
    if (attendees.some(a => !a.name.trim() || !a.email.trim())) {
      setError('Please fill in Name and Email for all attendees before proceeding.');
      return;
    }
    if (attendees.some(a => !/\S+@\S+\.\S+/.test(a.email))) {
      setError('Please enter a valid email address for each attendee.');
      return;
    }
    setError('');
    setShowConfirmModal(true);
  };

  const handleBooking = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await api.booking.post('', {
        userId: user.id,
        eventId: event.id,
        ticketsBooked: attendees.length,
        totalAmount: event.price * attendees.length,
        attendeeDetails: JSON.stringify(attendees),
        status: 'CONFIRMED'
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch {
      setError('Transaction failed: Slots unavailable or service timeout. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '8rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '2rem', animation: 'bounceIn 0.8s ease' }}>🎉</div>
      <h1 className="gradient-text" style={{ fontSize: '3.5rem' }}>Mission Authorized!</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>Your credentials have been registered. Redirecting to Vault...</p>
    </div>
  );

  if (!event) return (
    <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}>
      <p style={{ opacity: 0.4 }}>Connecting to Cloud Edge...</p>
    </div>
  );

  const total = event.price * attendees.length;

  return (
    <div className="app-container page-transition">
      <Modal
        show={showConfirmModal}
        title="Authorize Transaction?"
        message={`You are purchasing ${attendees.length} entry pass(es) for "${event.eventName}" at a total of ₹${total}. This action is final.`}
        onConfirm={handleBooking}
        onCancel={() => setShowConfirmModal(false)}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '3rem' }}>
        {/* LEFT: Attendee Form */}
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <span className="innovative-badge" style={{ background: 'var(--primary)', marginBottom: '1.5rem', display: 'inline-block' }}>OFFICIAL ENTRY PASS</span>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{event.eventName}</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem' }}>
            <span>📍 {event.venue}</span>
            <span>💎 ₹{event.price}/slot</span>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(244,63,94,0.06)', borderLeft: '4px solid var(--accent)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--vivid-pink)' }}>
              {error}
            </div>
          )}

          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', opacity: 0.6, letterSpacing: '1px' }}>ATTENDEE ROSTER</h3>
          {attendees.map((a, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.7rem', opacity: 0.5, fontWeight: 900, letterSpacing: '1px' }}>
                <span>SLOT #{i + 1}</span>
                {attendees.length > 1 && <button onClick={() => removeAttendee(i)} style={{ background: 'transparent', border: 'none', color: 'var(--vivid-pink)', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem' }}>✕ REMOVE</button>}
              </div>
              <input
                type="text" placeholder="Full Name *" className="form-control"
                value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)}
                style={{ marginBottom: '0.8rem' }}
              />
              <input
                type="email" placeholder="Email Address *" className="form-control"
                value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addAttendee} disabled={attendees.length >= event.availableTickets}
            style={{ background: 'transparent', border: '1px dashed var(--glass-border)', color: 'var(--text-dim)', padding: '0.8rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', width: '100%', marginTop: '0.5rem', transition: '0.3s' }}>
            + ADD ANOTHER ATTENDEE
          </button>
        </div>

        {/* RIGHT: Ledger */}
        <div className="glass-panel" style={{ padding: '3rem', borderTop: '4px solid var(--secondary)', position: 'sticky', top: '120px', alignSelf: 'start' }}>
          <h2 style={{ marginBottom: '2.5rem', fontSize: '1.3rem' }}>Transaction Ledger</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Slots Registered</span>
              <strong>× {attendees.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Cost Per Slot</span>
              <strong>₹{event.price}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Available Slots</span>
              <strong style={{ color: event.availableTickets < 10 ? 'var(--accent)' : 'var(--success)' }}>{event.availableTickets} left</strong>
            </div>
          </div>
          <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, letterSpacing: '1px', fontSize: '0.9rem' }}>TOTAL</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--success)' }}>₹{total}</span>
            </div>
          </div>
          <button
            className="btn-primary" onClick={validateAndConfirm} disabled={loading}
            style={{ height: '60px', fontSize: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', width: '100%' }}
          >
            {loading ? 'PROCESSING...' : 'AUTHORIZE ENTRY ➔'}
          </button>
          <p style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.65rem', marginTop: '1.2rem' }}>
            By authorizing, you agree to TechFest participation protocols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventBookingPage;
