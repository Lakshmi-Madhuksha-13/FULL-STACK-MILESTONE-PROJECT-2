import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EventBookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const user = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        if (!user) navigate('/login');
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const res = await api.event.get(`/${id}`);
            setEvent(res.data);
        } catch (e) { setError('Connection standby: Target event asset unreachable.'); }
    };

    const handleAddAttendee = () => {
        if (attendees.length < (event?.availableTickets || 0)) {
            setAttendees([...attendees, '']);
        }
    };

    const handleRemoveAttendee = (index) => {
        if (attendees.length > 1) {
            setAttendees(attendees.filter((_, i) => i !== index));
        }
    };

    const updateAttendeeName = (index, name) => {
        const newAttendees = [...attendees];
        newAttendees[index] = name;
        setAttendees(newAttendees);
    };

    const handleBooking = async () => {
        if (attendees.some(name => !name.trim())) {
            setError('Incomplete Data: Please provide names for all authenticated attendees.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const booking = {
                userId: user.id,
                eventId: event.id,
                ticketsBooked: attendees.length,
                totalAmount: event.price * attendees.length,
                attendeeDetails: JSON.stringify(attendees)
            };

            await api.booking.post('', booking);
            setSuccess(true);
            
            // Automated Redirection to Vault
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (err) {
            setError('Transaction Voided: Insufficient slots or microservice connection timeout.');
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div className="app-container page-transition" style={{ textAlign: 'center', paddingTop: '10rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>✅</div>
            <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Mission Success!</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Credentials authorized. Sweeping you to the Vault...</p>
        </div>
    );

    if (!event) return <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}><p>Synchronizing with Cloud Edge...</p></div>;

  return (
    <div className="app-container page-transition">
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
            {/* 🛡️ EVENT RECAP */}
            <div className="glass-panel" style={{ padding: '3rem' }}>
                <span className="innovative-badge" style={{ background: 'var(--primary)', marginBottom: '1.5rem' }}>OFFICIAL ENTRY</span>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{event.eventName}</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem', color: 'var(--text-dim)', marginBottom: '2.5rem' }}>
                    <span>📍</span> <span>{event.venue}</span>
                    <span>🕒</span> <span>{event.dateTime}</span>
                    <span>💎</span> <span>₹{event.price} / Ticket</span>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Authenticated Attendees</h3>
                    {attendees.map((name, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input 
                                type="text" placeholder={`Attendee #${i+1} Name`} 
                                className="form-control" value={name} 
                                onChange={(e) => updateAttendeeName(i, e.target.value)} 
                            />
                            {attendees.length > 1 && (
                                <button onClick={() => handleRemoveAttendee(i)} style={{ background: 'transparent', border: 'none', color: 'var(--vivid-pink)', fontWeight: 'bold', cursor: 'pointer' }}>REMOVE</button>
                            )}
                        </div>
                    ))}
                    <button className="btn-elite" onClick={handleAddAttendee} disabled={attendees.length >= event.availableTickets} style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>+ ADD ANOTHER SLOT</button>
                </div>
            </div>

            {/* 💰 TRANSACTION SUMMARY */}
            <div className="glass-panel" style={{ padding: '3rem', borderTop: '4px solid var(--secondary)' }}>
                <h2 style={{ marginBottom: '2rem' }}>Ledger Summary</h2>
                {error && <div className="error-text" style={{ padding: '0.8rem', borderLeft: '4px solid var(--vivid-pink)', marginBottom: '2rem' }}>{error}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    <span style={{ opacity: 0.6 }}>Slots Authorized</span>
                    <strong>x{attendees.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    <span style={{ opacity: 0.6 }}>Price Per Slot</span>
                    <strong>₹{event.price}</strong>
                </div>
                
                <div style={{ borderTop: '2px dashed var(--glass-border)', margin: '2rem 0', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <span style={{ fontWeight: '900', letterSpacing: '1px' }}>TOTAL COST</span>
                        <div style={{ fontSize: '2rem', fontWeight: '950', color: 'var(--success)' }}>₹{event.price * attendees.length}</div>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleBooking} 
                        disabled={loading}
                        style={{ height: '60px', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}
                    >
                        {loading ? 'CONFIRMING TRANSACTION...' : 'AUTHORIZE ENTRY'}
                    </button>
                    <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.7rem', marginTop: '1.5rem' }}>* By authorizing, you agree to the TechFest cloud participation protocols.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EventBookingPage;
