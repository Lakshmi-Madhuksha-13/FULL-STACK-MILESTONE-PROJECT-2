import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';
import MapView from '../components/MapView';
import SeatLayout from '../components/SeatLayout';

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
  const [step, setStep] = useState('ATTENDEES'); // ATTENDEES -> SEATS -> SUMMARY
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([{ name: '', email: '', department: '', university: '', yearOfStudy: '', seatNumber: '' }]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = useState(false);
  const [squads, setSquads] = useState([]);
  const [showSquadForge, setShowSquadForge] = useState(false);
  const [newSquad, setNewSquad] = useState({ teamName: '', skills: '' });

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const user = (() => { try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; } })();

  const [eventBookings, setEventBookings] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.event.get(`/${id}`).then(r => setEvent(r.data)).catch(() => setError('Event asset unreachable.'));
    api.event.get('').then(r => setAllEvents(r.data)).catch(() => {});
    api.booking.get(`/user/${user.id}`).then(r => setUserBookings(r.data)).catch(() => {});
    api.booking.get('').then(r => {
        // Fetching all bookings to find taken seats for this event
        if (Array.isArray(r.data)) {
            setEventBookings(r.data.filter(b => b.eventId?.toString() === id?.toString()));
        }
    }).catch(() => {});

    api.coupon.get('').then(r => {
      const dbCoupons = Array.isArray(r.data) ? r.data : [];
      const defaultCoupons = [
        { id: 'd1', code: 'WELCOME10', discountPercent: 10 },
        { id: 'd2', code: 'FESTIVAL25', discountPercent: 25 },
        { id: 'd3', code: 'ELITE50', discountPercent: 50 }
      ];
      const merged = [...dbCoupons];
      defaultCoupons.forEach(dc => { if (!merged.find(mc => mc.code === dc.code)) merged.push(dc); });
      setAvailableCoupons(merged);
    }).catch(() => {
       setAvailableCoupons([
         { id: 'd1', code: 'WELCOME10', discountPercent: 10 },
         { id: 'd2', code: 'FESTIVAL25', discountPercent: 25 },
         { id: 'd3', code: 'ELITE50', discountPercent: 50 }
       ]);
    });

    api.booking.get(`/squads/event/${id}`).then(r => setSquads(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (event && event.dateTime && allEvents.length > 0 && userBookings.length > 0) {
      const currentEventDate = new Date(event.dateTime);
      if (!isNaN(currentEventDate)) {
        const clash = userBookings.find(b => b.status !== 'CANCELLED' && b.status !== 'REFUNDED' && b.eventId !== event.id && (() => {
          const e = allEvents.find(ev => ev.id === b.eventId);
          if (!e || !e.dateTime) return false;
          const d = new Date(e.dateTime);
          return !isNaN(d) && Math.abs(d - currentEventDate) < 2 * 60 * 60 * 1000;
        })());
        if (clash) {
          const clashEvent = allEvents.find(ev => ev.id === clash.eventId);
          setWarning(`⚠️ Collision Detected: This event clashes with your existing booking for "${clashEvent?.eventName}".`);
        }
      }
    }
  }, [event, allEvents, userBookings]);

  const addAttendee = () => { if (attendees.length < (event?.availableTickets || 0)) setAttendees([...attendees, { name: '', email: '', department: '', university: '', yearOfStudy: '', seatNumber: '' }]); };
  const removeAttendee = i => { if (attendees.length > 1) setAttendees(attendees.filter((_, idx) => idx !== i)); };
  const updateAttendee = (i, field, val) => { const a = [...attendees]; a[i][field] = val; setAttendees(a); };

  const validateAttendees = () => {
    if (attendees.some(a => !a.name.trim() || !a.email.trim() || !a.department.trim() || !a.university.trim() || !a.yearOfStudy.trim())) { setError('Please fill all fields for all attendees.'); return false; }
    if (attendees.some(a => !/\S+@\S+\.\S+/.test(a.email))) { setError('Please enter valid emails.'); return false; }
    setError(''); return true;
  };

  useEffect(() => {
    if (appliedCoupon && event) {
      const disc = (event.price * attendees.length) * (appliedCoupon.discountPercent / 100);
      setDiscountAmount(disc);
    } else { setDiscountAmount(0); }
  }, [attendees.length, appliedCoupon, event]);

  const handleApplyCoupon = async () => {
    if (!promoCode) return;
    const normalizedCode = promoCode.toUpperCase().trim();
    const localMatch = availableCoupons.find(c => c.code.toUpperCase() === normalizedCode);
    if (localMatch) { setAppliedCoupon(localMatch); setError(''); return; }
    try {
      const res = await api.coupon.get(`/validate/${normalizedCode}`);
      if (res.data) { setAppliedCoupon(res.data); setError(''); }
      else { setError('Invalid promo code.'); }
    } catch { setError('Invalid promo code.'); }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    try {
       const bRes = await api.booking.post('', {
        userId: user.id, eventId: event.id,
        ticketsBooked: attendees.length,
        totalAmount: event.price * attendees.length - discountAmount,
        attendeeDetails: JSON.stringify(attendees),
        status: 'CONFIRMED',
        seatNumber: attendees.map(a => a.seatNumber).join(', ')
      });
      if (bRes.data && bRes.data.id) setCreatedBookingId(bRes.data.id);
      try { 
        const cRes = await api.user.put(`/${user.id}/coins`, { coins: 50 * attendees.length }); 
        if(cRes && cRes.data && cRes.data.id) localStorage.setItem('currentUser', JSON.stringify(cRes.data));
      } catch(e) {}
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch { setError('Booking failed. Contact support.'); }
    finally { setLoading(false); }
  };

  const handleJoinWaitlist = async () => {
    setLoading(true);
    try {
      const res = await api.booking.post('/waitlist', {
        userId: user.id, eventId: event.id, ticketsRequested: 1, expectedAmount: event.price,
        attendeeDetails: JSON.stringify([{ name: user.name, email: user.email }])
      });
      if (res.data && res.data.id) { setWaitlistPosition(res.data.position); setWaitlistSuccess(true); }
    } catch (err) {
      if (err?.response?.status === 409) setAlreadyOnWaitlist(true);
      else setError('Failed to join waitlist.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '8rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🎉</div>
      <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Payment Complete!</h1>
      <div style={{ margin: '2rem 0', padding: '1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid var(--success)', display: 'inline-block' }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '2px', fontWeight: 900 }}>OFFICIAL TICKET ID</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--success)', fontFamily: 'monospace' }}>TF-{createdBookingId}</div>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>Your entry pass is live. Redirecting to your vault...</p>
    </div>
  );

  if (!event) return <div className="app-container" style={{ textAlign: 'center', padding: '10rem', opacity: 0.4 }}>Connecting to cloud edge...</div>;

  if (event.availableTickets === 0) {
    if (waitlistSuccess) return (
        <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '8rem' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>⏳</div>
          <h1 className="gradient-text" style={{ fontSize: '3rem' }}>You're on the Waitlist!</h1>
          <div className="glass-panel" style={{ display: 'inline-block', padding: '2rem 3rem', marginTop: '2rem' }}>
            <div style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--primary)' }}>#{waitlistPosition}</div>
          </div>
          <button className="btn-elite" onClick={() => navigate('/dashboard')} style={{ marginTop: '2rem', padding: '1rem 3rem' }}>GO TO DASHBOARD →</button>
        </div>
      );
      return (
        <div className="app-container page-transition">
          <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
            <div className="glass-panel" style={{ padding: '4rem', borderTop: '4px solid var(--accent)' }}>
              <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{event.eventName}</h1>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--accent)', borderRadius: '2rem', color: 'var(--accent)', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '2rem' }}>SOLD OUT</div>
              {!alreadyOnWaitlist && (
                <button className="btn-primary" onClick={handleJoinWaitlist} disabled={loading} style={{ padding: '1rem 3rem', fontSize: '1rem' }}>
                  {loading ? 'Joining...' : '⏳ JOIN WAITLIST'}
                </button>
              )}
              <button className="btn-elite" onClick={() => navigate('/events')} style={{ padding: '1rem 2rem' }}>EXPLORE OTHER EVENTS</button>
            </div>
          </div>
        </div>
      );
  }

  const selectedSeatsCount = attendees.filter(a => a.seatNumber).length;

  return (
    <div className="app-container page-transition" style={{ paddingBottom: '10rem' }}>
      
      {showPayment && (
        <PaymentModal amount={(event.price * attendees.length - discountAmount)} eventName={event.eventName}
          onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} />
      )}

      {/* 🚢 STEP INDICATOR */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
        {['ATTENDEES', 'SEATS', 'SUMMARY'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: step === s ? 'var(--primary)' : (['SEATS', 'SUMMARY'].includes(s) && step === 'ATTENDEES' ? 'rgba(255,255,255,0.05)' : 'var(--success)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem'
            }}>{step === s || (s === 'ATTENDEES' && step !== 'ATTENDEES') ? '✓' : i + 1}</div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: step === s ? 1 : 0.4, letterSpacing: '1px' }}>{s}</span>
            {i < 2 && <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
        
        {/* 📋 MAIN CONTENT ZONE */}
        <div className="glass-panel" style={{ padding: '3.5rem' }}>
            
            {/* STEP 1: ATTENDEES */}
            {step === 'ATTENDEES' && (
                <div className="page-transition">
                    <h2 style={{ marginBottom: '2rem' }}>Attendee Details</h2>
                    {error && <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', color: 'var(--accent)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{error}</div>}
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {attendees.map((a, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 950, opacity: 0.5 }}>PARTICIPANT #{i+1}</span>
                                    {attendees.length > 1 && <button onClick={() => removeAttendee(i)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.7rem' }}>REMOVE</button>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input placeholder="Full Name" className="form-control" value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} />
                                    <input placeholder="Email" className="form-control" value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <input placeholder="Department" className="form-control" value={a.department} onChange={e => updateAttendee(i, 'department', e.target.value)} />
                                    <input placeholder="College" className="form-control" value={a.university} onChange={e => updateAttendee(i, 'university', e.target.value)} />
                                    <select className="form-control" value={a.yearOfStudy} onChange={e => updateAttendee(i, 'yearOfStudy', e.target.value)} style={{ color: a.yearOfStudy ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                        <option value="" disabled>Year of Study</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="Postgraduate">Postgraduate</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-elite" onClick={addAttendee} style={{ width: '100%', marginTop: '1.5rem', border: '1px dashed var(--glass-border)' }}>+ ADD ATTENDEE</button>
                    <div style={{ marginTop: '3rem', textAlign: 'right' }}>
                        <button className="btn-primary" onClick={() => validateAttendees() && setStep('SEATS')} style={{ padding: '1rem 4rem' }}>NEXT: SELECT SEATS ➔</button>
                    </div>
                </div>
            )}

            {/* STEP 2: SEATS */}
            {step === 'SEATS' && (
                <div className="page-transition">
                    <h2 style={{ marginBottom: '1rem' }}>Seat Allocation</h2>
                    <p style={{ opacity: 0.5, marginBottom: '2.5rem', fontSize: '0.9rem' }}>Please select <b>{attendees.length}</b> seats for your party.</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                        {attendees.map((a, i) => (
                            <div key={i} style={{ 
                                padding: '0.8rem 1.5rem', background: a.seatNumber ? 'var(--success)' : 'rgba(255,255,255,0.05)', 
                                borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, border: `1px solid ${a.seatNumber ? 'var(--success)' : 'var(--glass-border)'}` 
                            }}>
                                {a.name || `User ${i+1}`}: {a.seatNumber || 'Pending...'}
                            </div>
                        ))}
                    </div>

                    <SeatLayout eventId={id} basePrice={event.price} multiSelect={attendees.length} existingBookings={eventBookings} onSeatsSelect={(selectedSeatObjs) => {
                        const newAttendees = [...attendees];
                        // Clear existing assignments first to avoid ghosting
                        newAttendees.forEach(a => { a.seatNumber = ''; a.seatPrice = 0; a.seatTier = ''; });
                        selectedSeatObjs.forEach((sObj, i) => { 
                            if(newAttendees[i]) {
                                newAttendees[i].seatNumber = sObj.id;
                                newAttendees[i].seatPrice = sObj.price;
                                newAttendees[i].seatTier = sObj.tier;
                            }
                        });
                        setAttendees(newAttendees);
                    }} />

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn-elite" onClick={() => setStep('ATTENDEES')}>← BACK</button>
                        <button className="btn-primary" disabled={selectedSeatsCount < attendees.length} onClick={() => setStep('SUMMARY')} style={{ padding: '1rem 4rem' }}>NEXT: REVIEW SUMMARY ➔</button>
                    </div>
                </div>
            )}

            {/* STEP 3: SUMMARY */}
            {step === 'SUMMARY' && (
                <div className="page-transition">
                    <h2 style={{ marginBottom: '2.5rem' }}>Review Summary</h2>
                    <div className="glass-panel" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.01)', marginBottom: '2.5rem' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px', marginBottom: '1.5rem' }}>ATTENDEE MANIFEST</div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {attendees.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${a.seatTier === 'DIAMOND' ? '#facc15' : a.seatTier === 'GOLD' ? 'var(--primary)' : '#94a3b8'}` }}>
                                    <div>
                                        <div style={{ fontWeight: 900 }}>{a.name}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{a.email} • {a.department} • {a.yearOfStudy}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900 }}>{a.seatTier} SEAT</div>
                                        <div style={{ fontWeight: 950, color: 'white' }}>{a.seatNumber} (₹{a.seatPrice})</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🎫 PROMO PORTAL (RELOCATED TO PAYMENT SECTION) */}
                    <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem', background: 'rgba(251,191,36,0.02)', border: '1px solid rgba(251,191,36,0.1)' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px', marginBottom: '1.2rem', color: '#fbbf24' }}>PROMO PORTAL</div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input placeholder="ENTER CODE" className="form-control" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ fontSize: '0.9rem', flex: 1 }} />
                            <button className="btn-elite" onClick={handleApplyCoupon} style={{ width: '120px', background: '#fbbf24', color: '#000' }}>APPLY</button>
                        </div>
                        {appliedCoupon && (
                             <div className="bounce-in" style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 900, background: 'rgba(16,185,129,0.1)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>✅ DISCOUNT APPLIED: {appliedCoupon.code} (-{appliedCoupon.discountPercent}%)</span>
                                <button onClick={() => { setAppliedCoupon(null); setPromoCode(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', fontWeight: 900 }}>✕</button>
                             </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.2rem' }}>
                            {availableCoupons.slice(0, 3).map(c => (
                                <div key={c.id} onClick={() => { setPromoCode(c.code); setTimeout(handleApplyCoupon, 10); }} style={{ 
                                    cursor: 'pointer', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', 
                                    padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.7rem', color: '#fbbf24', fontWeight: 900, transition: '0.3s'
                                }}>
                                    {c.code}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                         <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px', marginBottom: '1.5rem' }}>BILLING SUMMARY</div>
                         <div style={{ display: 'grid', gap: '1.2rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                 <span style={{ opacity: 0.6 }}>Cumulative Subtotal ({attendees.length} slots)</span>
                                 <span style={{ fontWeight: 900 }}>₹{attendees.reduce((acc, a) => acc + (a.seatPrice || 0), 0)}</span>
                             </div>
                             {appliedCoupon && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                                    <span style={{ fontWeight: 700 }}>Promo Discount</span>
                                    <span style={{ fontWeight: 900 }}>- ₹{(attendees.reduce((acc, a) => acc + (a.seatPrice || 0), 0) * (appliedCoupon.discountPercent / 100)).toFixed(2)}</span>
                                </div>
                             )}
                             <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '2.2rem' }}>
                                 <span style={{ fontWeight: 950 }}>TOTAL DUE</span>
                                 <span style={{ fontWeight: 950, color: 'var(--success)', textShadow: '0 0 30px rgba(16,185,129,0.2)' }}>₹{(attendees.reduce((acc, a) => acc + (a.seatPrice || 0), 0) * (1 - (appliedCoupon?.discountPercent || 0) / 100)).toFixed(2)}</span>
                             </div>
                         </div>
                    </div>

                    <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn-elite" onClick={() => setStep('SEATS')}>← BACK</button>
                        <button className="btn-primary" onClick={() => setShowPayment(true)} style={{ padding: '1.2rem 6rem', background: 'linear-gradient(45deg, var(--success), #059669)', fontSize: '1.2rem' }}>PROCEED TO SECURE PAYMENT 🔒</button>
                    </div>
                </div>
            )}
        </div>

        {/* 💳 SIDEBAR INFO (SQUAD FINDER INTEGRATED) */}
        <div style={{ alignSelf: 'start', position: 'sticky', top: '120px' }}>
            <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px', marginBottom: '1.2rem' }}>EVENT CONTEXT</div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 950, marginBottom: '0.8rem' }}>{event.eventName}</h3>
                <div style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 {event.venue}</div>
                <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>📅 {event.dateTime}</div>
            </div>

            {/* 🤝 SQUAD FINDER COMMAND CENTER */}
            <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px' }}>SQUAD FINDER</div>
                    <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'rgba(139,92,246,0.1)', borderRadius: '4px', color: 'var(--primary-bright)', fontWeight: 900 }}>LIVE</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {squads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.4, fontSize: '0.8rem' }}>No open squads yet.</div>
                    ) : (
                        squads.slice(0, 3).map(s => (
                            <div key={s.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>{s.teamName}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.5, margin: '0.3rem 0' }}>Needed: {s.skills}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                                    <div style={{ fontSize: '0.6rem' }}>👥 {s.members.split(',').length}/{s.maxMembers} Members</div>
                                    <button className="btn-primary" onClick={async () => {
                                        try {
                                            await api.booking.put(`/squads/${s.id}/join`, { userId: user.id });
                                            alert("Request sent to Squad Leader!");
                                        } catch(e) { alert(e.response?.data || "Failed to join."); }
                                    }} style={{ padding: '0.3rem 0.8rem', fontSize: '0.6rem' }}>JOIN</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!showSquadForge ? (
                    <button className="btn-elite" onClick={() => setShowSquadForge(true)} style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.7rem' }}>FORGE NEW SQUAD +</button>
                ) : (
                    <div className="page-transition" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(139,92,246,0.05)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                        <input placeholder="Squad Name" className="form-control" style={{ fontSize: '0.8rem', marginBottom: '0.8rem' }} onChange={e => setNewSquad({...newSquad, teamName: e.target.value})} />
                        <input placeholder="Skills (e.g. Python, Design)" className="form-control" style={{ fontSize: '0.8rem', marginBottom: '1rem' }} onChange={e => setNewSquad({...newSquad, skills: e.target.value})} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-primary" style={{ flex: 1, fontSize: '0.7rem' }} onClick={async () => {
                                try {
                                    await api.booking.post('/squads', {
                                        eventId: id, creatorId: user.id, creatorName: user.name,
                                        teamName: newSquad.teamName, skills: newSquad.skills
                                    });
                                    setShowSquadForge(false);
                                    api.booking.get(`/squads/event/${id}`).then(r => setSquads(r.data));
                                } catch(e) { alert("Forge failed."); }
                            }}>FORGE</button>
                            <button onClick={() => setShowSquadForge(false)} style={{ background: 'transparent', border: 'none', color: 'white', opacity: 0.5, fontSize: '0.7rem' }}>CANCEL</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 950, letterSpacing: '2px', marginBottom: '1.2rem' }}>SECURE TRANSACTION</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                    All transactions are encrypted with 256-bit SSL technology. Your payment information is never stored on our servers.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventBookingPage;
