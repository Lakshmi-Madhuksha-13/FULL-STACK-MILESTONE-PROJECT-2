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
    const matchesSearch = (e.eventName?.toLowerCase().includes(search.toLowerCase())) || 
                         (e.department?.toLowerCase().includes(search.toLowerCase()));
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

      <div className="search-container" style={{ gap: '0.5rem' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className="btn-elite" 
            style={{ width: 'auto', background: selectedCategory === cat ? 'var(--primary)' : 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
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
              <div key={ev.id} className="event-card" style={{ cursor: isSoldOut ? 'default' : 'pointer', opacity: isSoldOut ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span className="innovative-badge" style={{ background: badgeColor }}>{ev.department}</span>
                  <span style={{ fontWeight: '800', color: 'var(--success)' }}>₹{ev.price}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem' }}>{ev.eventName}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', margin: '1rem 0 2rem 0' }}>
                   <span>📍</span> <span>{ev.venue}</span>
                   <span>🕒</span> <span>{ev.dateTime}</span>
                </div>
                <button className="btn-primary" disabled={isSoldOut} onClick={() => !isSoldOut && navigate(`/book/${ev.id}`)}>
                    {isSoldOut ? 'REGISTRY CLOSED' : 'CONFIRM ENTRY'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
