import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  const [showCertificate, setShowCertificate] = useState(false);
  const [status, setStatus] = useState({ bookings: 'loading', notifications: 'loading', events: 'loading' });

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (user && user.id) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 15000); 
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

  const fetchAllData = async () => {
    // 1. Fetch Bookings
    try {
        const res = await api.booking.get(`/user/${user.id}`);
        setBookings(Array.isArray(res.data) ? res.data : []);
        setStatus(prev => ({...prev, bookings: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, bookings: 'offline'})); }

    // 2. Fetch Notifications
    try {
        const res = await api.user.get(`/${user.id}/notifications`);
        setNotifications(Array.isArray(res.data) ? res.data : []);
        setStatus(prev => ({...prev, notifications: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, notifications: 'offline'})); }

    // 3. Fetch Events (for naming)
    try {
        const res = await api.event.get('');
        setAllEvents(res.data);
        setStatus(prev => ({...prev, events: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, events: 'offline'})); }

    setLoading(false);
  };

  const getEventName = (id) => {
    const ev = allEvents.find(e => e.id === id);
    if (!ev) return status.events === 'online' ? `Code: #${id}` : 'Connecting to Event Service...';
    return ev.eventName;
  };

  const fetchWishlist = async () => {
    try {
        const ids = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (ids.length > 0) {
            const res = await api.event.get('');
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

  const handleExportCalendar = (b) => {
    const evName = getEventName(b.eventId);
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${evName}\nDTSTART:20260425T090000Z\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TF_Pass_${b.id}.ics`;
    link.click();
  };

  const markAsRead = async (id) => {
    await api.user.put(`/notifications/${id}/read`);
    fetchAllData();
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
      {/* SERVICE HEALTH CHECK (Admin-Style UI) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.65rem', justifyContent: 'flex-end' }}>
          <span style={{ color: status.bookings === 'online' ? 'var(--success)' : 'var(--accent)' }}>● BOOKING SERVICE</span>
          <span style={{ color: status.events === 'online' ? 'var(--success)' : 'var(--accent)' }}>● EVENT DB</span>
          <span style={{ color: status.notifications === 'online' ? 'var(--success)' : 'var(--accent)' }}>● NOTIFICATION HUB</span>
      </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="gradient-text">Ticket Inventory</h2>
                {status.bookings === 'offline' && <small style={{ color: 'var(--accent)' }}>Trying to connect to system...</small>}
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <tr>
                    <th style={{ padding: '1rem' }}>BOOKING ID</th>
                    <th style={{ padding: '1rem' }}>EVENT NAME</th>
                    <th style={{ padding: '1rem' }}>TICKETS</th>
                    <th style={{ padding: '1rem' }}>REVENUE</th>
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
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-elite" onClick={() => setSelectedBooking(b)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}>View Pass</button>
                        </td>
                    </tr>
                    ))}
                    {bookings.length === 0 && !loading && (
                        <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No active tickets in your inventory.</td></tr>
                    )}
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

      {/* DASHBOARD MODAL: PREMIUM ACCESS PASS */}
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
                                <small style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 'bold' }}>ADMISSION</small>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedBooking.ticketsBooked} Slot(s)</div>
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
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button className="btn-primary" onClick={() => handleExportCalendar(selectedBooking)}>📅 Sync Calendar</button>
                            <button className="btn-elite" style={{ background: '#f8fafc', color: '#0f172a' }} onClick={() => window.print()}>🖨️ Print Pass</button>
                        </div>
                        <button className="btn-primary" style={{ background: 'transparent', border: '1px solid white' }} onClick={() => setSelectedBooking(null)}>Close</button>
                    </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
