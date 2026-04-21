import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  const navigate = useNavigate();

  const categories = ['ALL', ...new Set(events.map(e => e.department.toUpperCase()))];

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
      const response = await api.event.get('/events');
      setEvents(response.data);
    } catch (err) {
      setError('Connection failed. Microservices offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.eventName.toLowerCase().includes(search.toLowerCase()) || 
                         e.department.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || e.department.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-container page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Global Events.</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Discover the tech fests shaping the future.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search events or domains..." 
            className="form-control" 
            style={{ borderRadius: '2rem', paddingLeft: '3rem', height: '3.5rem', background: 'var(--glass-bg)', color: 'var(--text-main)' }} 
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      <div className="search-container">
        {categories.map(cat => (
          <button 
            key={cat} 
            className="btn-elite" 
            style={{ width: 'auto', background: selectedCategory === cat ? 'var(--primary)' : 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem 1.5rem' }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
           <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem auto' }}></div>
           <p>Syncing with Cluster...</p>
        </div>
      ) : (
        <div className="elite-grid">
          {filteredEvents.map(ev => {
            const isSoldOut = ev.availableTickets === 0;
            const badgeColor = ev.department.toUpperCase().includes('CS') ? 'var(--vivid-pink)' : 
                              ev.department.toUpperCase().includes('IT') ? 'var(--accent)' : 'var(--primary-bright)';
            return (
              <div key={ev.id} className="event-card" style={{ position: 'relative' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(ev.id); }}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: '5' }}
                >
                  {wishlist.includes(ev.id) ? '⭐' : '☆'}
                </button>
                <div onClick={() => !isSoldOut && navigate(`/book/${ev.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span className="innovative-badge" style={{ background: badgeColor }}>{ev.department}</span>
                    <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '1.2rem' }}>₹{ev.price}</span>
                  </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{ev.eventName}</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.8rem', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <span>📍</span> <span>{ev.venue}</span>
                  <span>📅</span> <span>{ev.dateTime}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Availability</div>
                        <div style={{ color: isSoldOut ? 'var(--accent)' : 'var(--primary)', fontWeight: 'bold' }}>
                            {isSoldOut ? 'REGISTRATIONS CLOSED' : `${ev.availableTickets} Slots Left`}
                        </div>
                    </div>
                    <button className="btn-elite" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }} disabled={isSoldOut}>
                        {isSoldOut ? 'Closed' : 'Book Now'}
                    </button>
                </div>
               </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EventsPage;
