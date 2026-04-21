import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [wishlistEvents, setWishlistEvents] = useState([]);
  const [countdown, setCountdown] = useState('');

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
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
        const [bookingsRes, notifyRes, eventsRes] = await Promise.all([
            axios.get(`http://localhost:8083/api/bookings/user/${user.id}`),
            axios.get(`http://localhost:8081/api/users/${user.id}/notifications`),
            axios.get(`http://localhost:8082/api/events`)
        ]);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setNotifications(Array.isArray(notifyRes.data) ? notifyRes.data : []);
        setAllEvents(eventsRes.data);
      } catch (err) {
          console.error("Dashboard Sync Error:", err);
      } finally {
          setLoading(false);
      }
  };

  const getEventName = (id) => {
    const ev = allEvents.find(e => e.id === id);
    return ev ? ev.eventName : `Event #${id}`;
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
    target.setDate(target.getDate() + 5);
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

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Expired</h2><button className="btn-primary" onClick={() => navigate('/login')}>Login Again</button></div>;

  return (
    <div className="app-container page-transition">
      {bookings.length > 0 && (
          <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem' }}>NEXT EVENT COMMENCES IN</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown}</div>
              </div>
              <div style={{ fontSize: '3rem' }}>🎉</div>
          </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Bookings</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'wishlist' ? 1 : 0.6 }} onClick={() => setActiveTab('wishlist')}>Wishlist ⭐</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6 }} onClick={() => setActiveTab('notifications')}>Alerts ({notifications.filter(n => !n.read).length})</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'bookings' ? (
          <>
            <h2 className="gradient-text">Ticket Inventory</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <tr>
                    <th style={{ padding: '1rem' }}>BOOKING ID</th>
                    <th style={{ padding: '1rem' }}>EVENT NAME</th>
                    <th style={{ padding: '1rem' }}>TICKETS</th>
                    <th style={{ padding: '1rem' }}>AMOUNT</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 'bold' }}>#TF-{b.id}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{getEventName(b.eventId)}</td>
                        <td style={{ padding: '1rem' }}>{b.ticketsBooked} Slot(s)</td>
                        <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                        <td style={{ padding: '1rem' }}>
                            <button className="btn-elite" onClick={() => setSelectedBooking(b)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}>View Pass 🎫</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </>
        ) : activeTab === 'wishlist' ? (
            <div>
                <h2 className="gradient-text">Starred Events ⭐</h2>
                <div className="elite-grid" style={{ marginTop: '2rem' }}>
                    {wishlistEvents.map(ev => (
                        <div key={ev.id} className="event-card">
                            <div className="innovative-badge">{ev.department}</div>
                            <h4>{ev.eventName}</h4>
                            <p>{ev.venue} | ₹{ev.price}</p>
                            <button className="btn-primary" onClick={() => navigate(`/book/${ev.id}`)}>Book Now</button>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div>
                <h2 className="gradient-text">System Alerts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {notifications.map(n => (
                    <div key={n.id} className="glass-panel" style={{ padding: '1.2rem', background: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(139, 92, 246, 0.05)', borderLeft: n.read ? '2px solid transparent' : '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0 }}>{n.message}</p>
                            <small style={{ color: 'var(--text-dim)' }}>{new Date(n.timestamp).toLocaleString()}</small>
                        </div>
                        {!n.read && <button onClick={() => markAsRead(n.id)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>Mark Read</button>}
                    </div>
                ))}
                </div>
            </div>
        )}
      </div>

      {/* REAL TICKET VIEW MODAL */}
      {selectedBooking && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '420px', background: 'transparent', border: 'none' }}>
                <div className="real-ticket">
                  <div className="ticket-header">
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '2px', marginBottom: '0.5rem' }}>SECURE ACCESS PASS</div>
                    <h3 style={{ margin: 0 }}>{getEventName(selectedBooking.eventId)}</h3>
                    <div className="status-badge-verified" style={{ marginTop: '0.8rem', display: 'inline-block' }}>BOOKED ✅</div>
                  </div>
                  <div className="ticket-cut ticket-cut-left"></div>
                  <div className="ticket-cut ticket-cut-right"></div>
                  <div className="ticket-details">
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>TICKET ID</small>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>#TF-{selectedBooking.id}</div>
                        </div>
                        <div>
                            <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>USER ID</small>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>USR-{selectedBooking.userId}</div>
                        </div>
                     </div>
                     <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>ATTENDEES</small>
                     <div style={{ fontSize: '0.8rem' }}>
                        {parseAttendees(selectedBooking.attendeeDetails).map((a, i) => <div key={i}>• {a.name} ({a.department})</div>)}
                     </div>
                  </div>
                  <div className="real-qr-container">
                     <div className="qr-frame">
                        <img className="qr-image" 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY_BK_${selectedBooking.id}`} 
                             alt="QR Code" />
                     </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button className="btn-primary" onClick={() => setSelectedBooking(null)}>Close Ticket</button>
                    <button className="btn-elite" style={{ marginTop: '0.5rem', background: 'transparent' }} onClick={() => window.print()}>Save as PDF</button>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
