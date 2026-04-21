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
  const [countdown, setCountdown] = useState({ text: 'Syncing Schedule...', target: null });
  const [showCertificate, setShowCertificate] = useState(false);

  // Support & Interactive Systems
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMsg, setUserMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [selectedMail, setSelectedMail] = useState(null);

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (user && user.id) {
      fetchAllData().then(() => setIsDataLoaded(true));
      const interval = setInterval(fetchAllData, 8000); 
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

  const fetchAllData = async () => {
    try {
        const [bRes, nRes, eRes] = await Promise.all([
            api.booking.get(`/user/${user.id}`).catch(() => ({data: []})),
            api.user.get(`/${user.id}/notifications`).catch(() => ({data: []})),
            api.event.get('').catch(() => ({data: []}))
        ]);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
        setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
        setAllEvents(Array.isArray(eRes.data) ? eRes.data : []);
    } catch (e) {}
  };

  const fetchChat = async () => {
    try {
        const res = await api.support.get(`/history/${user.id}`);
        setChatHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  const handleSendMessage = async () => {
    if (!userMsg.trim()) return;
    const msg = { userId: user.id, senderName: user.name, message: userMsg, type: 'USER' };
    await api.support.post('/send', msg);
    setUserMsg('');
    fetchChat();
  };

  const getEventName = (id) => {
    const ev = allEvents.find(e => e && e.id === id);
    return ev?.eventName || `Registry Log #${id}`;
  };

  const calculateCountdown = () => {
    if (!bookings.length || !allEvents.length) {
        setCountdown({ text: 'Accessing Schedule...', target: null });
        return;
    }
    const eventDates = bookings.map(b => {
        const ev = allEvents.find(e => e && e.id === b.eventId);
        if (!ev || !ev.dateTime) return null;
        const d = new Date(ev.dateTime);
        return isNaN(d.getTime()) ? null : { date: d, name: ev.eventName };
    }).filter(d => d !== null && d.date > new Date());

    if (!eventDates.length) {
        setCountdown({ text: 'Season Ended', target: 'Completed' });
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

  const fetchWishlist = () => {
    try {
        const ids = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (ids.length > 0 && allEvents.length > 0) {
            setWishlistEvents(allEvents.filter(e => e && ids.includes(e.id)));
        }
    } catch (e) {}
  };

  const parseSnapshot = (msg) => {
    if (!msg || typeof msg !== 'string' || !msg.startsWith('BOOKING_SNAPSHOT|')) return { isSnapshot: false, text: msg || 'Official Note' };
    return msg.split('|').reduce((acc, p) => {
        const [k, v] = p.split(': ');
        if(v) acc[k.trim()] = v.trim();
        return acc;
    }, {});
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Standby</h2><button className="btn-primary" onClick={() => navigate('/login')}>Return to Identity Hub</button></div>;

  return (
    <div className="app-container page-transition">
      <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.7rem' }}>OPERATIONAL PULSE: {countdown.target || 'ACTIVE'}</h4><div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown.text}</div></div>
          <div style={{ fontSize: '3rem' }}>⚡</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Credential Vault</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6 }} onClick={() => setActiveTab('notifications')}>System Inbox</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '500px' }}>
        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text">Participation Registry</h2>
            {!isDataLoaded ? <p style={{opacity: 0.5}}>Establishing connection with Booking Service...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead><tr style={{ fontSize: '0.8rem', opacity: 0.5 }}><th style={{padding: '1rem'}}>ID</th><th style={{padding: '1rem'}}>ASSET</th><th style={{padding: '1rem'}}>ACTION</th></tr></thead>
                    <tbody>
                        {bookings.map(b => (
                        <tr key={b?.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>#TF-{b?.id}</td>
                            <td style={{ padding: '1rem' }}><strong>{getEventName(b?.eventId)}</strong></td>
                            <td style={{ padding: '1rem', display: 'flex', gap: '0.4rem' }}>
                                <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(false); }} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>VIEW PASS</button>
                                <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(true); }} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: 'var(--vivid-pink)' }}>AWARD</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            )}
          </div>
        ) : (
            <div>
                <h2 className="gradient-text">Correspondence</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.map(n => (
                        <div key={n?.id} onClick={() => { setSelectedMail(n); }} className="glass-panel" style={{ padding: '1rem', cursor: 'pointer', borderLeft: n.read ? 'none' : '4px solid var(--primary)', background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)' }}>
                            <div style={{ fontWeight: 'bold' }}>{parseSnapshot(n?.message).ID || 'System Broadcast'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(n?.timestamp).toLocaleTimeString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* FLOAT CHAT */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '1000' }}>
            {showChat ? (
                <div className="glass-panel page-transition" style={{ width: '300px', height: '400px', display: 'flex', flexDirection: 'column', background: '#020617', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Help Desk</strong><button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>✖</button></div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {chatHistory.map((m, i) => m && <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.8rem', margin: '0.3rem 0', fontSize: '0.75rem' }}>{m.message}</div>)}
                    </div>
                </div>
            ) : <button className="btn-primary" onClick={() => setShowChat(true)} style={{ width: '55px', height: '55px', borderRadius: '50%' }}>💬</button>}
      </div>

      {/* MODAL RESET (Safe-render) */}
      {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', color: '#1e293b' }}>
                  <h3>{showCertificate ? 'CERTIFICATE PREVIEW' : 'PASS PREVIEW'}</h3>
                  <p>Identifier: #TF-{selectedBooking?.id}</p>
                  <button className="btn-primary" onClick={() => window.print()}>EXPORT PDF</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
