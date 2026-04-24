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
  const [attendees, setAttendees] = useState([{ name: '', email: '', department: '', university: '', yearOfStudy: '' }]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const user = (() => { try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; } })();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.event.get(`/${id}`).then(r => setEvent(r.data)).catch(() => setError('Event asset unreachable.'));
    api.event.get('').then(r => setAllEvents(r.data)).catch(() => {});
    api.booking.get(`/user/${user.id}`).then(r => setUserBookings(r.data)).catch(() => {});
    api.coupon.get('').then(r => setAvailableCoupons(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (event && event.dateTime && allEvents.length > 0 && userBookings.length > 0) {
      const currentEventDate = new Date(event.dateTime);
      if (!isNaN(currentEventDate)) {
        const clash = userBookings.find(b => b.status !== 'CANCELLED' && b.status !== 'REFUNDED' && b.eventId !== event.id && (() => {
          const e = allEvents.find(ev => ev.id === b.eventId);
          if (!e || !e.dateTime) return false;
          const d = new Date(e.dateTime);
          return !isNaN(d) && Math.abs(d - currentEventDate) < 2 * 60 * 60 * 1000; // 2 hours window
        })());
        if (clash) {
          const clashEvent = allEvents.find(ev => ev.id === clash.eventId);
          setWarning(`⚠️ Collision Detected: This event clashes with your existing booking for "${clashEvent?.eventName}".`);
        }
      }
    }
  }, [event, allEvents, userBookings]);

  const addAttendee = () => { if (attendees.length < (event?.availableTickets || 0)) setAttendees([...attendees, { name: '', email: '', department: '', university: '', yearOfStudy: '' }]); };
  const removeAttendee = i => { if (attendees.length > 1) setAttendees(attendees.filter((_, idx) => idx !== i)); };
  const updateAttendee = (i, field, val) => { const a = [...attendees]; a[i][field] = val; setAttendees(a); };

  const validateForm = () => {
    if (attendees.some(a => !a.name.trim() || !a.email.trim() || !a.department.trim() || !a.university.trim() || !a.yearOfStudy.trim())) { setError('Please fill all fields (Name, Email, Department, University, Year) for all attendees.'); return false; }
    if (attendees.some(a => !/\S+@\S+\.\S+/.test(a.email))) { setError('Please enter valid email addresses.'); return false; }
    setError(''); return true;
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await api.coupon.get(`/validate/${promoCode.toUpperCase()}`);
      if (res.data) {
        setAppliedCoupon(res.data);
        const disc = (event.price * attendees.length) * (res.data.discountPercent / 100);
        setDiscountAmount(disc);
        setError('');
      } else {
        setError('Invalid or expired promo code.');
      }
    } catch {
      setError('Invalid or expired promo code.');
    }
  };

  const handleReviewClick = () => { if (validateForm()) setShowConfirmModal(true); };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    try {
      const bRes = await api.booking.post('', {
        userId: user.id, eventId: event.id,
        ticketsBooked: attendees.length,
        totalAmount: event.price * attendees.length - discountAmount,
        attendeeDetails: JSON.stringify(attendees),
        status: 'CONFIRMED'
      });
      if (bRes.data && bRes.data.id) setCreatedBookingId(bRes.data.id);
      // Give coins (Gamification)
      try { 
        const cRes = await api.user.put(`/${user.id}/coins`, { coins: 50 * attendees.length }); 
        if(cRes && cRes.data && cRes.data.id) localStorage.setItem('currentUser', JSON.stringify(cRes.data));
      } catch(e) {}
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch { setError('Booking failed after payment. Contact support immediately.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '8rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🎉</div>
      <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Payment Complete!</h1>
      <div style={{ margin: '2rem 0', padding: '1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid var(--success)', display: 'inline-block' }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '2px', fontWeight: 900 }}>OFFICIAL TICKET ID</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--success)', fontFamily: 'monospace' }}>TF-{createdBookingId}</div>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>Your entry pass is now live. Redirecting to your vault...</p>
    </div>
  );

  if (!event) return <div className="app-container" style={{ textAlign: 'center', padding: '10rem', opacity: 0.4 }}>Connecting to cloud edge...</div>;

  const total = event.price * attendees.length;

  return (
    <div className="app-container page-transition">
      <Modal show={showConfirmModal} title="Proceed to Payment?" message={`${attendees.length} slot(s) for "${event.eventName}" — Total ₹${(event.price * attendees.length - discountAmount).toFixed(2)}.`}
        onConfirm={() => { setShowConfirmModal(false); setShowPayment(true); }} onCancel={() => setShowConfirmModal(false)} />

      {showPayment && (
        <PaymentModal amount={(event.price * attendees.length - discountAmount)} eventName={event.eventName}
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
          {warning && <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(251,191,36,0.06)', borderLeft: '4px solid #fbbf24', borderRadius: '8px', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>{warning}</div>}

          <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.5, letterSpacing: '1.5px' }}>ATTENDEE ROSTER</h3>
          {attendees.map((a, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.68rem', opacity: 0.45, fontWeight: 900, letterSpacing: '1.5px' }}>
                <span>SLOT #{i + 1}</span>
                {attendees.length > 1 && <button onClick={() => removeAttendee(i)} style={{ background: 'transparent', border: 'none', color: 'var(--vivid-pink)', cursor: 'pointer', fontWeight: 900, fontSize: '0.68rem' }}>✕ REMOVE</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <input type="text" placeholder="Full Name *" className="form-control" value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} />
                <input type="email" placeholder="Email Address *" className="form-control" value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <input type="text" placeholder="Department *" className="form-control" value={a.department} onChange={e => updateAttendee(i, 'department', e.target.value)} />
                <input type="text" placeholder="University *" className="form-control" value={a.university} onChange={e => updateAttendee(i, 'university', e.target.value)} />
                <select className="form-control" value={a.yearOfStudy} onChange={e => updateAttendee(i, 'yearOfStudy', e.target.value)} style={{ color: a.yearOfStudy ? 'white' : 'var(--text-dim)' }}>
                  <option value="" disabled>Year of Study *</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
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
          
          <div style={{ marginBottom: '2rem' }}>
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" placeholder="Promo Code" className="form-control" style={{ fontSize: '0.8rem', height: '40px' }} value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
                <button className="btn-elite" onClick={handleApplyCoupon} style={{ padding: '0 1rem', fontSize: '0.7rem' }}>APPLY</button>
             </div>
             {appliedCoupon && <div className="bounce-in" style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 900, background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--success)' }}>✅ PROMO: {appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF)</div>}
             
             {availableCoupons.length > 0 && !appliedCoupon && (
               <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 900, marginBottom: '0.6rem', letterSpacing: '1px' }}>APPLICABLE OFFERS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availableCoupons.map(c => (
                      <span key={c.id} onClick={() => { setPromoCode(c.code); }} style={{ cursor: 'pointer', background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', color: '#fbbf24', fontSize: '0.65rem', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 900, transition: '0.2s' }} onMouseOver={e => e.target.style.background='rgba(251,191,36,0.2)'} onMouseOut={e => e.target.style.background='rgba(251,191,36,0.1)'}>{c.code}</span>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            {[['Slots', `× ${attendees.length}`], ['Base Price', `₹${event.price * attendees.length}`], ['Discount', appliedCoupon ? `- ₹${discountAmount.toFixed(2)}` : '₹0.00']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>{k}</span>
                <span style={{ fontWeight: 800, color: k === 'Discount' ? 'var(--success)' : 'white', fontSize: k === 'Discount' ? '0.9rem' : '1rem' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '1.8rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, letterSpacing: '1px' }}>TOTAL</span>
            <span style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--success)', letterSpacing: '-1px' }}>₹{(event.price * attendees.length - discountAmount).toFixed(2)}</span>
          </div>

          <button onClick={handleReviewClick} disabled={loading} className="btn-primary" style={{ height: '62px', fontSize: '1.1rem', letterSpacing: '1px' }}>
            {loading ? 'PROCESSING...' : '🔒 PROCEED TO PAYMENT'}
          </button>
          <p style={{ textAlign: 'center', opacity: 0.25, fontSize: '0.65rem', marginTop: '1.5rem' }}>Secured by 256-bit SSL encryption</p>
        </div>}}>Secured by 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
};

export default EventBookingPage;
