import React from 'react';

const EventDetails = ({ event }) => {
  if (!event) return (
    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}>
      Connecting to cloud edge...
    </div>
  );

  const stars = 4.6;
  const reviewCount = 42 + (event.id || 0) * 7;
  const filledStars = Math.floor(stars);

  return (
    <div className="glass-panel" style={{ padding: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="innovative-badge" style={{ background: 'var(--primary)' }}>{event.department || 'GENERAL'}</span>
          <span className="innovative-badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>✅ Verified</span>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#fbbf24', fontSize: '1rem', letterSpacing: '2px' }}>
            {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
          </div>
          <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{stars}/5 ({reviewCount} reviews)</small>
        </div>
      </div>

      {/* Event Name */}
      <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '2rem', lineHeight: 1.1 }}>{event.eventName}</h2>

      {/* Meta Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>
        {[
          { icon: '📍', label: 'VENUE', value: event.venue || 'To Be Announced' },
          { icon: '🕒', label: 'SCHEDULE', value: event.dateTime || 'TBD' },
          { icon: '💎', label: 'ENTRY FEE', value: `₹${(event.price || 0).toLocaleString()}`, color: 'var(--success)' },
          { icon: '🎟️', label: 'SLOTS OPEN', value: event.availableTickets, color: event.availableTickets < 10 ? 'var(--accent)' : 'var(--primary)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, letterSpacing: '1.5px', marginBottom: '0.4rem' }}>{icon} {label}</div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: color || 'var(--text-main)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
        Join us for an electrifying showcase of technical excellence. Compete alongside the brightest minds
        in <strong style={{ color: 'var(--primary)' }}>{event.department || 'engineering'}</strong>, attend
        hands-on workshops, and network with industry pioneers. This is a career-defining opportunity
        you cannot miss.
      </p>

      {/* Community Buzz */}
      <div style={{ padding: '1.2rem', background: 'rgba(139,92,246,0.05)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '1.5px', marginBottom: '0.6rem' }}>💬 COMMUNITY BUZZ</div>
        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', opacity: 0.75, lineHeight: 1.5 }}>
          "The most anticipated {event.department || 'technical'} event of the year — absolutely worth every rupee!"
        </div>
        <div style={{ fontSize: '0.65rem', opacity: 0.35, marginTop: '0.5rem' }}>— Verified Participant</div>
      </div>
    </div>
  );
};

export default EventDetails;
