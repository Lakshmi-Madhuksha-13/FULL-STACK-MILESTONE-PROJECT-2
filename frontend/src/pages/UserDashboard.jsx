import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [wishlistEvents, setWishlistEvents] = useState([]);
  const [countdown, setCountdown] = useState('');

  // Safe user parsing
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (user && user.id) {
      fetchData();
      const interval = setInterval(fetchData, 10000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
        calculateCountdown();
        const timer = setInterval(calculateCountdown, 1000);
        fetchWishlist();
        return () => clearInterval(timer);
    }
  }, [bookings, user]);

  const fetchData = async () => {
      try {
        const [bookingsRes, notifyRes] = await Promise.all([
            axios.get(`http://localhost:8083/api/bookings/user/${user.id}`),
            axios.get(`http://localhost:8081/api/users/${user.id}/notifications`)
        ]);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setNotifications(Array.isArray(notifyRes.data) ? notifyRes.data : []);
      } catch (err) {
          console.error("Dashboard Sync Error:", err);
      } finally {
          setLoading(false);
      }
  };

  const fetchWishlist = async () => {
    try {
        const ids = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (ids.length > 0) {
            const res = await axios.get('http://localhost:8082/api/events');
            setWishlistEvents(res.data.filter(e => ids.includes(e.id)));
        }
    } catch (e) {}
  };

  const calculateCountdown = () => {
    if (bookings.length === 0) return;
    const target = new Date();
    target.setDate(target.getDate() + 5); // Realistic mock target
    const diff = target - new Date();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`);
  };

  const markAsRead = async (id) => {
    await axios.put(`http://localhost:8081/api/users/notifications/${id}/read`);
    fetchData();
  };

  const handlePrint = () => {
    window.print();
  };

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  if (!user) return <div className="app-container page-transition" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Expired</h2><p>Please log in to view your dashboard.</p></div>;

  return (
    <div className="app-container page-transition">
      
      {/* Countdown Card */}
      {bookings.length > 0 && (
          <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem' }}>TIME UNTIL YOUR NEXT FEST</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown}</div>
              </div>
              <div style={{ fontSize: '3rem' }}>🚀</div>
          </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Bookings</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'wishlist' ? 1 : 0.6 }} onClick={() => setActiveTab('wishlist')}>Wishlist ⭐</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6, position: 'relative' }} onClick={() => setActiveTab('notifications')}>
          Alerts
          {notifications.filter(n => !n.read).length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', boxShadow: '0 0 10px var(--accent)' }}>
                  {notifications.filter(n => !n.read).length}
              </span>
          )}
        </button>
      </div>

      <div className="glass-panel">
        {activeTab === 'bookings' ? (
          <>
            <h2 className="gradient-text">Ticket Inventory</h2>
            {bookings.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', padding: '2rem 0' }}>No tickets booked yet. Start your journey!</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <tr>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>Event</th>
                        <th style={{ padding: '1rem' }}>Tickets</th>
                        <th style={{ padding: '1rem' }}>Total Paid</th>
                        <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem' }}>#{b.id}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>Official Fest</td>
                            <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                            <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                            <td style={{ padding: '1rem' }}>
                                <button className="btn-elite" onClick={() => setSelectedBooking(b)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}>Get Pass 🎫</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            )}
          </>
        ) : activeTab === 'wishlist' ? (
            <>
                <h2 className="gradient-text">Starred Events ⭐</h2>
                {wishlistEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)', padding: '2rem 0' }}>Your wishlist is empty.</p>
                ) : (
                    <div className="elite-grid" style={{ marginTop: '2rem' }}>
                        {wishlistEvents.map(ev => (
                            <div key={ev.id} className="event-card">
                                <div className="innovative-badge" style={{ marginBottom: '1rem' }}>{ev.department}</div>
                                <h4>{ev.eventName}</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>{ev.venue} | ₹{ev.price}</p>
                                <button className="btn-primary" onClick={() => navigate(`/book/${ev.id}`)}>Book Now</button>
                            </div>
                        ))}
                    </div>
                )}
            </>
        ) : (
            <>
                <h2 className="gradient-text">System Alerts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {notifications.map(n => (
                    <div key={n.id} className="glass-panel" style={{ 
                        padding: '1.2rem', 
                        background: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(139, 92, 246, 0.05)', 
                        borderLeft: n.read ? '2px solid transparent' : '4px solid var(--primary)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ margin: 0, color: n.read ? 'var(--text-dim)' : 'var(--text-main)' }}>{n.message}</p>
                            <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{new Date(n.timestamp).toLocaleString()}</small>
                        </div>
                        {!n.read && <button onClick={() => markAsRead(n.id)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>Mark Read</button>}
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      {/* Digital Ticket Modal */}
      {selectedBooking && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 className="gradient-text">Fest Entry Pass</h2>
                  <div className="ticket-pass">
                    <div className="ticket-top">ENTRY AUTHORIZED</div>
                    <div className="ticket-body" style={{ textAlign: 'left', color: '#0f172a' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>OFFICIAL FEST</h3>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>TICKET ID: #TKT-{selectedBooking.id}</div>
                        <div style={{ fontSize: '0.75rem' }}>
                            <strong>Attendees:</strong>
                            {parseAttendees(selectedBooking.attendeeDetails).map((a, i) => <div key={i}>• {a.name}</div>)}
                        </div>
                    </div>
                    <div className="ticket-footer"><div className="qr-mock"></div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <button className="btn-elite" onClick={handlePrint} style={{ flex: 1, background: '#f1f5f9', color: '#0f172a' }}>Export PDF 🖨️</button>
                      <button className="btn-elite" style={{ flex: 1, background: '#1da1f2' }}>Tweet 🐦</button>
                  </div>
                  <button className="btn-primary" onClick={() => setSelectedBooking(null)}>Close</button>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
