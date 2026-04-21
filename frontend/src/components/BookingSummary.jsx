import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookingSummary = ({ summary, onDismiss }) => {
  const navigate = useNavigate();

  if (!summary) return null;

  let attendees = [];
  try {
    attendees = JSON.parse(summary.attendeeDetails || '[]');
    if (!Array.isArray(attendees)) attendees = [];
  } catch { attendees = []; }

  const handlePrint = () => window.print();

  return (
    <div className="glass-panel bounce-in" style={{ marginTop: '2rem', border: '2px solid var(--success)', background: 'rgba(16,185,129,0.04)', padding: '2.5rem' }}>
      {/* SUCCESS HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 className="gradient-text" style={{ fontSize: '1.8rem', margin: 0 }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Your entry pass has been registered in the cloud registry.</p>
      </div>

      {/* SUMMARY TABLE */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { label: 'PASS ID', value: `TF-${summary.id || '---'}` },
          { label: 'EVENT', value: summary.eventName },
          { label: 'TOTAL SLOTS', value: `× ${summary.ticketsBooked}` },
          { label: 'AMOUNT PAID', value: `₹${summary.totalAmount?.toFixed(2) || '0.00'}`, highlight: true },
          { label: 'STATUS', value: '✅ CONFIRMED', highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.45, letterSpacing: '1.5px' }}>{label}</span>
            <span style={{ fontWeight: 900, color: highlight ? 'var(--success)' : 'var(--text-main)', fontSize: highlight ? '1rem' : '0.95rem' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ATTENDEES */}
      {attendees.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, letterSpacing: '1.5px', fontWeight: 900, marginBottom: '1rem' }}>REGISTERED ATTENDEES</div>
          {attendees.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '0.6rem' }}>
              <div style={{ width: '34px', height: '34px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>
                {(typeof a === 'string' ? a : a.name)?.charAt(0)?.toUpperCase() || (i + 1)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{typeof a === 'string' ? a : a.name}</div>
                {a.email && <div style={{ fontSize: '0.72rem', opacity: 0.4 }}>{a.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ flex: 1, height: '50px' }}>
          VIEW MY PASSES →
        </button>
        <button className="btn-elite" onClick={onDismiss} style={{ flex: 1, height: '50px', background: 'transparent', border: '1px solid var(--glass-border)' }}>
          BOOK ANOTHER
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
