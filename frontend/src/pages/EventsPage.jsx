import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [wishlist, setWishlist] = useState(() => {
     try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch(e) { return []; }
  });
  const navigate = useNavigate();

  // 🛡️ CRASH GUARD: Handle potential missing department data
  const categories = ['ALL', ...new Set(events.filter(e => e && e.department).map(e => e.department.toUpperCase()))];

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
        setWishlist(wishlist.filter(item => item !== id));
    } else {
        setWishlist([...wishlist, id]);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.event.get('');
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Connection standby. Syncing in progress.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    if (!e) return false;
    const matchesSearch = (e.eventName?.toLowerCase()?.includes(search.toLowerCase())) || 
                         (e.department?.toLowerCase()?.includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || e.department?.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-container page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Cloud Events.</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Discover entries that define the next generation.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="form-control" 
            style={{ borderRadius: '2rem', paddingLeft: '3rem', height: '3.5rem' }} 
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className="innovative-badge"
            style={{ 
                cursor: 'pointer',
                width: 'auto', 
                background: selectedCategory === cat ? 'var(--primary)' : 'var(--glass-bg)', 
                color: selectedCategory === cat ? 'white' : 'var(--text-main)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--glass-border)', 
                padding: '0.6rem 1.4rem', 
                fontSize: '0.75rem',
                fontWeight: 900,
                boxShadow: selectedCategory === cat ? '0 0 15px var(--primary-bright)' : 'none',
                transition: '0.3s'
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 📍 CAMPUS MAP EXPLORER (INTEGRATED) */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '4rem', border: '1px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950 }}>Campus Nexus Explorer</h2>
                <p style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem' }}>Live venue telemetry for the festival grounds.</p>
            </div>
            <a href="https://maps.google.com/maps?q=Vel+Tech+University+Avadi&z=15" target="_blank" rel="noopener noreferrer" className="btn-elite" style={{ padding: '0.6rem 1.2rem', fontSize: '0.7rem' }}>OPEN FULL MAP ↗</a>
        </div>
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <iframe
                title="Campus Events Map"
                width="100%"
                height="350"
                style={{ border: 'none', display: 'block' }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=Vel+Tech+University+Avadi&output=embed&z=14`}
            />
        </div>
      </div>

      {/* 📍 VENUE NETWORK INTELLIGENCE */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '4rem', border: '1px solid var(--secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950 }}>Venue Network Intelligence</h2>
                <p style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem' }}>Spatial distribution of all active festival nodes.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-elite" onClick={() => fetchEvents()} style={{ padding: '0.6rem 1.2rem', fontSize: '0.7rem' }}>REFRESH NODES</button>
            </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {filteredEvents.slice(0, 4).map(ev => (
                <div key={`map-${ev.id}`} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ev.eventName}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '1rem' }}>📍 {ev.venue}</div>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', height: '180px' }}>
                        <iframe
                            title={`Map for ${ev.eventName}`}
                            width="100%"
                            height="180"
                            style={{ border: 'none', display: 'block' }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(ev.venue)}&output=embed&z=14`}
                        />
                    </div>
                    <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.7rem', padding: '0.6rem' }} onClick={() => navigate(`/book/${ev.id}`)}>BOOK ENTRY</button>
                </div>
            ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
           <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1.2s linear infinite', margin: '0 auto 1.5rem auto' }}></div>
           <p style={{ opacity: 0.5 }}>SYNCING SYSTEM DATA...</p>
        </div>
      ) : (
        <div className="elite-grid">
          {filteredEvents.map(ev => {
            const isSoldOut = ev.availableTickets === 0;
            const badgeColor = ev.department?.toUpperCase().includes('CS') ? 'var(--vivid-pink)' : 'var(--primary)';
            return (
              <div key={ev.id} className="event-card" style={{ cursor: isSoldOut ? 'default' : 'pointer', opacity: isSoldOut ? 0.7 : 1, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ 
                            background: isSoldOut ? 'var(--vivid-pink)' : 'var(--success)', 
                            color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', 
                            fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px'
                        }}>
                            {isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                        </span>
                        <span style={{ fontWeight: '800', color: 'var(--success)' }}>₹{ev.price}</span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem' }}>{ev.eventName}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', margin: '1rem 0 2rem 0' }}>
                       <span>📍</span> 
                       <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venue)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                         onClick={(e) => e.stopPropagation()}
                       >
                         {ev.venue}
                       </a>
                       <span>🕒</span> <span>{ev.dateTime}</span>
                    </div>
                    <button className="btn-primary" disabled={isSoldOut} onClick={() => !isSoldOut && navigate(`/book/${ev.id}`)}>
                        {isSoldOut ? 'REGISTRY CLOSED' : 'CONFIRM ENTRY'}
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
