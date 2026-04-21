import React, { useState, useEffect } from 'react';
import api from '../services/api';

const BookingForm = ({ event, onBookingSuccess, user }) => {
  const [ticketCount, setTicketCount] = useState(1);
  const [attendees, setAttendees] = useState([{
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    college: user?.college || ''
  }]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const count = Math.max(1, parseInt(ticketCount) || 1);
    setAttendees(prev => {
      if (prev.length < count) {
        const add = Array(count - prev.length).fill(0).map(() => ({ name: '', email: '', department: '', college: user?.college || '' }));
        return [...prev, ...add];
      }
      return prev.slice(0, count);
    });
  }, [ticketCount]);

  const updateAttendee = (index, field, value) => {
    setAttendees(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const validate = () => {
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name.trim() || !a.email.trim()) return `Please fill Name and Email for Attendee #${i + 1}`;
      if (!/\S+@\S+\.\S+/.test(a.email)) return `Invalid email for Attendee #${i + 1}`;
    }
    if (ticketCount > event.availableTickets) return `Only ${event.availableTickets} slots available.`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.booking.post('', {
        userId: user.id,
        eventId: event.id,
        ticketsBooked: parseInt(ticketCount),
        totalAmount: ticketCount * event.price,
        attendeeDetails: JSON.stringify(attendees),
        status: 'CONFIRMED'
      });
      onBookingSuccess({ ...res.data, eventName: event.eventName, attendees });
    } catch (err) {
      setError(err.response?.data || 'Booking failed. Check availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event || event.availableTickets === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '2.5rem' }}>
      <h2 className="gradient-text" style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Register Attendees</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.9rem 1.2rem', background: 'rgba(244,63,94,0.06)', borderLeft: '4px solid var(--accent)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--vivid-pink)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={lbl}>NUMBER OF SLOTS</label>
          <input type="number" className="form-control" value={ticketCount}
            onChange={e => setTicketCount(Math.min(event.availableTickets, Math.max(1, parseInt(e.target.value) || 1)))}
            min="1" max={event.availableTickets}
          />
          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.4rem' }}>{event.availableTickets} slots remaining</div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.4rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {attendees.map((a, i) => (
            <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, opacity: 0.4, letterSpacing: '1.5px', marginBottom: '1rem' }}>SLOT #{i + 1}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>FULL NAME *</label>
                  <input type="text" className="form-control" value={a.name}
                    onChange={e => updateAttendee(i, 'name', e.target.value)} placeholder="John Doe" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>EMAIL ADDRESS *</label>
                  <input type="email" className="form-control" value={a.email}
                    onChange={e => updateAttendee(i, 'email', e.target.value)} placeholder="name@college.edu" />
                </div>
                <div>
                  <label style={lbl}>DEPARTMENT</label>
                  <input type="text" className="form-control" value={a.department}
                    onChange={e => updateAttendee(i, 'department', e.target.value)} placeholder="e.g. CSE" />
                </div>
                <div>
                  <label style={lbl}>COLLEGE</label>
                  <input type="text" className="form-control" value={a.college}
                    onChange={e => updateAttendee(i, 'college', e.target.value)} placeholder="University Name" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 700 }}>TOTAL DUE</span>
          <span style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--success)' }}>₹{ticketCount * event.price}</span>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ height: '56px', fontSize: '1rem' }}>
          {isSubmitting ? 'PROCESSING TRANSACTION...' : `AUTHORIZE & PAY ₹${ticketCount * event.price}`}
        </button>
      </form>
    </div>
  );
};

const lbl = { display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '0.4rem', letterSpacing: '1px' };
export default BookingForm;
