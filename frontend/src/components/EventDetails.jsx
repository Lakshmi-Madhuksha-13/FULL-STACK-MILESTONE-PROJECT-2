import React from 'react';

const EventDetails = ({ event }) => {
  if (!event) return <div className="glass-panel">Loading events...</div>;

  // Mock community data - can be made dynamic later
  const ratings = {
    'Coding Challenge': { stars: 4.8, count: 124 },
    'Web Design': { stars: 4.5, count: 86 },
    'Robotics': { stars: 4.9, count: 210 },
    'Hackathon': { stars: 5.0, count: 540 }
  };

  const getStats = (name) => ratings[name] || { stars: 4.6, count: 42 };
  const { stars, count } = getStats(event.eventName);

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Festival Briefing</h2>
        <div style={{ textAlign: 'right' }}>
            <div className="rating-stars" style={{ color: '#fbbf24' }}>{'★'.repeat(Math.floor(stars))}{'☆'.repeat(5-Math.floor(stars))}</div>
            <small style={{ color: 'var(--text-dim)' }}>{stars} / 5.0 ({count} reviews)</small>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="innovative-badge" style={{ background: 'var(--primary)' }}>{event.department}</span>
          <span className="innovative-badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>Verified Organizers</span>
        </div>

        <h3 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-main)', letterSpacing: '-1px' }}>{event.eventName}</h3>
        
        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', display: 'flex', gap: '2rem' }}>
          <div>
            <small style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800' }}>Venue</small>
            <div style={{ fontWeight: '600' }}>{event.venue}</div>
          </div>
          <div>
            <small style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800' }}>Schedule</small>
            <div style={{ fontWeight: '600' }}>{event.dateTime}</div>
          </div>
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Join us for an electrifying day of technical innovation. Experience hands-on workshops, 
            high-stakes competitions, and network with industry pioneers in {event.department}.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', fontWeight: 'bold' }}>ENTRY FEE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
               ₹{(typeof event.price === 'number' ? event.price : 0).toLocaleString()}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', fontWeight: 'bold' }}>SLOTS OPEN</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: event.availableTickets > 5 ? 'var(--primary)' : 'var(--accent)' }}>
              {event.availableTickets}
            </span>
          </div>
        </div>
      </div>

      {/* Community Review Ticker */}
      <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <small style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>COMMUNITY BUZZ</small>
          <div style={{ fontStyle: 'italic', color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              "The most anticipated {event.department} event of the year!" - Previous Participant
          </div>
      </div>
    </div>
  );
};

export default EventDetails;
