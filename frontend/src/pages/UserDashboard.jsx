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
  const [countdown, setCountdown] = useState({ text: 'Checking Schedule...', target: null });
  const [showCertificate, setShowCertificate] = useState(false);
  const [status, setStatus] = useState({ bookings: 'online', notifications: 'online', events: 'online' });

  // Floating Chat & Toast States
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMsg, setUserMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (user && user.id) {
      fetchAllData();
      // HIGH VELOCITY ALERTING: Check every 5 seconds for immediate alerts
      const interval = setInterval(fetchAllData, 5000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && showChat) {
        fetchChat();
        const chatInterval = setInterval(fetchChat, 3000);
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

  const fetchAllData = async () => {
    try {
        const bRes = await api.booking.get(`/user/${user.id}`);
        const oldLen = bookings.length;
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
        
        // Detect if admin revoked a booking immediately
        if (oldLen > 0 && bRes.data.length < oldLen) {
            showInteractiveToast("⚠️ CRITICAL: One of your bookings was modified by Admin.", "warning");
        }
    } catch (e) {}

    try {
        const nRes = await api.user.get(`/${user.id}/notifications`);
        const oldUnread = notifications.filter(n => !n.read).length;
        const newUnread = nRes.data.filter(n => !n.read).length;
        
        if (newUnread > oldUnread) {
            showInteractiveToast(`📩 New System Alert: ${nRes.data[nRes.data.length-1].message}`, "info");
        }
        setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
    } catch (e) {}

    try {
        const eRes = await api.event.get('');
        setAllEvents(eRes.data);
    } catch (e) {}
    
    setLoading(false);
  };

  const fetchChat = async () => {
    try {
        const res = await api.support.get(`/history/${user.id}`);
        if (res.data.length > chatHistory.length) {
            const last = res.data[res.data.length-1];
            if (last.type === 'ADMIN') showInteractiveToast("🎧 New Reply from Support!", "info");
        }
        setChatHistory(res.data);
    } catch (e) {}
  };

  const handleSendMessage = async () => {
    if (!userMsg.trim()) return;
    const msg = { userId: user.id, senderName: user.name, message: userMsg, type: 'USER' };
    await api.support.post('/send', msg);
    setUserMsg('');
    fetchChat();
  };

  const calculateCountdown = () => {
    if (bookings.length === 0 || allEvents.length === 0) {
        setCountdown({ text: 'No Upcoming Events', target: null });
        return;
    }
    const eventDates = bookings.map(b => {
        const ev = allEvents.find(e => e.id === b.eventId);
        if (!ev) return null;
        const d = new Date(ev.dateTime);
        return isNaN(d.getTime()) ? null : { date: d, name: ev.eventName };
    }).filter(d => d !== null && d.date > new Date());

    if (eventDates.length === 0) {
        setCountdown({ text: 'Festivals Complete!', target: 'All Finished' });
        return;
    }
    const closest = eventDates.sort((a, b) => a.date - b.date)[0];
    const diff = closest.date - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    setCountdown({ text: `${days}d ${hours}h ${mins}m ${secs}s`, target: closest.name });
  };

  const markAsRead = async (id) => {
    await api.user.put(`/notifications/${id}/read`);
    fetchAllData();
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Expired</h2><button className="btn-primary" onClick={() => navigate('/login')}>Login Again</button></div>;

  return (
    <div className="app-container page-transition">
      {/* INTERACTIVE TOAST SYSTEM */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: '2000', padding: '1rem 2rem', background: toast.type === 'warning' ? 'var(--vivid-pink)' : 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 40px var(--primary-bright)', animation: 'slideIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>{toast.type === 'warning' ? '⚠️' : '📩'}</span>
                <span style={{ fontWeight: 'bold' }}>{toast.message}</span>
              </div>
          </div>
      )}

      {countdown.target && (
          <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Next Event: {countdown.target}</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown.text}</div>
              </div>
              <div style={{ fontSize: '3rem' }}>🎉</div>
          </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Bookings</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'wishlist' ? 1 : 0.6 }} onClick={() => setActiveTab('wishlist')}>Stellar ⭐</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6 }} onClick={() => setActiveTab('notifications')}>Alerts ({notifications.filter(n => !n.read).length})</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text">Inventory</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <tr><th>ID</th><th>EVENT</th><th>TOTAL</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>#TF-{b.id}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{allEvents.find(e => e.id === b.eventId)?.eventName || 'Loading...'}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                        <td style={{ padding: '1rem' }}>
                            <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(false); }} style={{ padding: '0.4rem' }}>Pass</button>
                        </td>
                    </tr>
                    ))}
                    {bookings.length === 0 && (<tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Clean Registry.</td></tr>)}
                </tbody>
                </table>
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
            <div>
                <h2 className="gradient-text">System Alerts</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.map(n => (
                        <div key={n.id} className="glass-panel" style={{ padding: '1.2rem', borderLeft: n.read ? 'none' : '4px solid var(--primary)' }}>
                            <p style={{ margin: 0 }}>{n.message}</p>
                            {!n.read && <button onClick={() => markAsRead(n.id)} className="btn-elite" style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem', marginTop: '0.5rem' }}>Acknowledge</button>}
                        </div>
                    ))}
                </div>
            </div>
        ) : <div>Wishlist content...</div>}
      </div>

      {/* FLOATING SUPPORT BUBBLE */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '1000' }}>
            {showChat ? (
                <div className="glass-panel" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '1rem', background: '#020617' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)' }}>LIVE HELP</strong>
                        <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>✖</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
                        {chatHistory.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', margin: '0.3rem 0', fontSize: '0.8rem' }}>
                                {m.message}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="form-control" value={userMsg} onChange={(e) => setUserMsg(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything..."/>
                        <button className="btn-primary" style={{ width: '50px' }} onClick={handleSendMessage}>➤</button>
                    </div>
                </div>
            ) : <button className="btn-primary" onClick={() => setShowChat(true)} style={{ width: '60px', height: '60px', borderRadius: '50%' }}>💬</button>}
      </div>
    </div>
  );
};

export default UserDashboard;
