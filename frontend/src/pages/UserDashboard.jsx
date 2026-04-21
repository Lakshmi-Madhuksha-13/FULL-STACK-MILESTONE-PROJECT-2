import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [wishlistEvents, setWishlistEvents] = useState([]);
  const [countdown, setCountdown] = useState({ text: '...', target: null });
  const [showCertificate, setShowCertificate] = useState(false);
  const [status, setStatus] = useState({ bookings: 'evaluating', notifications: 'evaluating', events: 'evaluating' });

  // Support & Interactive Systems
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMsg, setUserMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [selectedMail, setSelectedMail] = useState(null);

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (user && user.id) {
      // Parallel Fetch for Instant Response
      Promise.all([
          fetchBookings(),
          fetchNotifications(),
          fetchEvents()
      ]).then(() => setIsDataLoaded(true));
      
      const interval = setInterval(fetchAllData, 6000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && showChat) {
        fetchChat();
        const chatInterval = setInterval(fetchChat, 3500);
        return () => clearInterval(chatInterval);
    }
  }, [user, showChat]);

  useEffect(() => {
    if (user) {
        const timer = setInterval(calculateCountdown, 1000);
        fetchWishlist();
        return () => clearInterval(timer);
    }
  }, [bookings, allEvents, user]);

  const showInteractiveToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchBookings = async () => {
    try {
        const res = await api.booking.get(`/user/${user.id}`);
        setBookings(Array.isArray(res.data) ? res.data : []);
        setStatus(prev => ({...prev, bookings: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, bookings: 'offline'})); }
  };

  const fetchNotifications = async () => {
    try {
        const res = await api.user.get(`/${user.id}/notifications`);
        setNotifications(Array.isArray(res.data) ? res.data : []);
        setStatus(prev => ({...prev, notifications: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, notifications: 'offline'})); }
  };

  const fetchEvents = async () => {
    try {
        const res = await api.event.get('');
        setAllEvents(res.data);
        setStatus(prev => ({...prev, events: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, events: 'offline'})); }
  };

  const fetchAllData = () => {
    fetchBookings();
    fetchNotifications();
    fetchEvents();
  };

  const fetchChat = async () => {
    try {
        const res = await api.support.get(`/history/${user.id}`);
        setChatHistory(res.data);
    } catch (e) {}
  };

  const getEventName = (id) => {
    const ev = allEvents.find(e => e.id === id);
    return ev ? ev.eventName : `Loading Heritage Data...`;
  };

  const fetchWishlist = () => {
    try {
        const ids = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (ids.length > 0 && allEvents.length > 0) {
            setWishlistEvents(allEvents.filter(e => ids.includes(e.id)));
        }
    } catch (e) {}
  };

  const calculateCountdown = () => {
    if (!bookings.length || !allEvents.length) {
        setCountdown({ text: 'Accessing Schedule...', target: null });
        return;
    }
    const eventDates = bookings.map(b => {
        const ev = allEvents.find(e => e.id === b.eventId);
        if (!ev) return null;
        const d = new Date(ev.dateTime);
        return isNaN(d.getTime()) ? null : { date: d, name: ev.eventName };
    }).filter(d => d !== null && d.date > new Date());

    if (!eventDates.length) {
        setCountdown({ text: 'Season Concluded', target: 'Fest Success' });
        return;
    }
    const closest = eventDates.sort((a, b) => a.date - b.date)[0];
    const diff = closest.date - new Date();
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    setCountdown({ text: `${d}d ${h}h ${m}m ${s}s`, target: closest.name });
  };

  const parseSnapshot = (msg) => {
    if (!msg || !msg.startsWith('BOOKING_SNAPSHOT|')) return { isSnapshot: false, text: msg || 'Official Notification' };
    const parts = msg.split('|').reduce((acc, p) => {
        const splitIdx = p.indexOf(': ');
        if (splitIdx > -1) {
            const key = p.substring(0, splitIdx).trim();
            const val = p.substring(splitIdx + 2).trim();
            acc[key] = val;
        }
        return acc;
    }, {});
    return { isSnapshot: true, ...parts };
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Expired</h2><button className="btn-primary" onClick={() => navigate('/login')}>Return to Login</button></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh', opacity: 1, transition: 'opacity 0.4s' }}>
      {/* 🚀 INSTANT-RENDER TOASTS */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: '5000', padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 40px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span>🚀</span><span style={{ fontWeight: 'bold' }}>{toast.message}</span></div>
          </div>
      )}

      {/* 🏗️ SCAFFOLDED HEADER: Renders instantly */}
      <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {countdown.target || 'System Status: Active'}
              </h4>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{countdown.text}</div>
          </div>
          <div style={{ fontSize: '3rem', opacity: 0.5 }}>⚡</div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.5, transition: '0.3s' }} onClick={() => setActiveTab('bookings')}>My Tickets</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.5, transition: '0.3s' }} onClick={() => setActiveTab('notifications')}>
            Official Inbox {notifications.filter(n => !n.read).length > 0 && <span style={{ marginLeft: '6px', background: 'white', color: 'black', borderRadius: '50%', padding: '0 5px', fontSize: '0.6rem' }}>{notifications.filter(n => !n.read).length}</span>}
        </button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'wishlist' ? 1 : 0.5, transition: '0.3s' }} onClick={() => setActiveTab('wishlist')}>Stars ⭐</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '500px', padding: '2rem', position: 'relative' }}>
        {!isDataLoaded && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '10px' }}>
                <span className="sync-pulse"></span> <small style={{ fontSize: '0.6rem', opacity: 0.4 }}>SYNCING DATA...</small>
            </div>
        )}

        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Transaction Ledger</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    <tr><th style={{ padding: '1rem' }}>UID</th><th style={{ padding: '1rem' }}>EVENT ASSET</th><th style={{ padding: '1rem' }}>AMOUNT</th><th style={{ padding: '1rem' }}>ACTION</th></tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                    {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--text-dim)' }}>#TF-{b.id}</td>
                        <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{getEventName(b.eventId)}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                        <td style={{ padding: '1rem' }}>
                            <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(false); }} style={{ padding: '0.3rem 1rem', fontSize: '0.7rem' }}>ENTER PASS</button>
                        </td>
                    </tr>
                    ))}
                    {isDataLoaded && !bookings.length && (<tr><td colSpan="4" style={{ padding: '5rem', textAlign: 'center', opacity: 0.3 }}>No active records found in the booking service.</td></tr>)}
                </tbody>
                </table>
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
            <div>
                <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Management Inbox</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {notifications.map(n => {
                        const snap = parseSnapshot(n.message);
                        return (
                            <div key={n.id} onClick={() => { setSelectedMail(n); if(!n.read) api.user.put(`/notifications/${n.id}/read`).then(fetchAllData); }} className="glass-panel" style={{ padding: '1rem', cursor: 'pointer', borderLeft: n.read ? 'none' : '4px solid var(--primary)', background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
                                    <span>{snap.ID || 'SYSTEM LOG'}</span>
                                    <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div style={{ fontWeight: 'bold', margin: '0.3rem 0' }}>{snap.Event || 'Broadcast Message'}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                            </div>
                        );
                    })}
                    {isDataLoaded && !notifications.length && <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>Your inbox is currently clear.</div>}
                </div>
            </div>
        ) : <div>Loading Starred assets...</div>}
      </div>

      {/* 💬 FLOATING SUPPORT */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '1000' }}>
            {showChat ? (
                <div className="glass-panel page-transition" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '1.2rem', background: '#020617', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>DIRECT SUPPORT</span>
                        <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>✖</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {chatHistory.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', fontSize: '0.75rem', maxWidth: '85%' }}>{m.message}</div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" className="form-control" style={{ fontSize: '0.8rem' }} value={userMsg} onChange={(e) => setUserMsg(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <button className="btn-primary" style={{ width: '45px' }} onClick={handleSendMessage}>➤</button>
                    </div>
                </div>
            ) : <button className="btn-primary" onClick={() => setShowChat(true)} style={{ width: '60px', height: '60px', borderRadius: '50%' }}>💬</button>}
      </div>

      <style>{`
        .sync-pulse {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--primary); display: inline-block;
            animation: pulseFade 1.5s infinite;
        }
        @keyframes pulseFade { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
      `}</style>
    </div>
  );
};

export default UserDashboard;
