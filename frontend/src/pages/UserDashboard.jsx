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
  const [status, setStatus] = useState({ bookings: 'online', notifications: 'online', events: 'online' });

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
      Promise.all([fetchBookings(), fetchNotifications(), fetchEvents()]).then(() => setIsDataLoaded(true));
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

  const showInteractiveToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchBookings = async () => {
    try {
        const res = await api.booking.get(`/user/${user.id}`);
        setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
        const res = await api.user.get(`/${user.id}/notifications`);
        setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  const fetchEvents = async () => {
    try {
        const res = await api.event.get('');
        setAllEvents(res.data);
    } catch (e) {}
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

  const handleSendMessage = async () => {
    if (!userMsg.trim()) return;
    const msg = { userId: user.id, senderName: user.name, message: userMsg, type: 'USER' };
    await api.support.post('/send', msg);
    setUserMsg('');
    fetchChat();
  };

  const calculateCountdown = () => {
    if (!bookings.length || !allEvents.length) {
        setCountdown({ text: 'Registry Access...', target: null });
        return;
    }
    const eventDates = bookings.map(b => {
        const ev = allEvents.find(e => e.id === b.eventId);
        if (!ev) return null;
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

  const getEventName = (id) => {
    const ev = allEvents.find(e => e.id === id);
    return ev ? ev.eventName : `Event #${id}`;
  };

  const parseSnapshot = (msg) => {
    if (!msg || !msg.startsWith('BOOKING_SNAPSHOT|')) return { isSnapshot: false, text: msg || 'Notification' };
    return msg.split('|').reduce((acc, p) => {
        const [k, v] = p.split(': ');
        if(v) acc[k.trim()] = v.trim();
        return acc;
    }, {});
  };

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  };

  const handleDownload = () => {
    window.print();
    showInteractiveToast("Document preparation initiated...", "success");
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Expired</h2><button className="btn-primary" onClick={() => navigate('/login')}>Login</button></div>;

  return (
    <div className="app-container page-transition">
      {/* 🚀 TOAST ENGINE */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: '5000', padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 40px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span>📩</span><span style={{ fontWeight: 'bold' }}>{toast.message}</span></div>
          </div>
      )}

      {/* SCAFFOLDED HEADER */}
      <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.7rem' }}>NEXT MILESTONE: {countdown.target || 'SYNCING'}</h4><div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown.text}</div></div>
          <div style={{ fontSize: '3rem' }}>🚀</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Credential Vault</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6 }} onClick={() => setActiveTab('notifications')}>System Inbox</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '400px' }}>
        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text">Ticket Inventory & Awards</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <tr><th>BOOKING ID</th><th>EVENT UNIT</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>#TF-{b.id}</td>
                        <td style={{ padding: '1.5rem 1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{getEventName(b.eventId)}</td>
                        <td style={{ padding: '1.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(false); }} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>OPEN TICKET</button>
                            <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(true); }} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: 'var(--vivid-pink)' }}>OPEN CERTIFICATE</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        ) : (
            <div>
                <h2 className="gradient-text">Correspondence</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.map(n => {
                        const snap = parseSnapshot(n.message);
                        return (
                            <div key={n.id} onClick={() => { setSelectedMail(n); }} className="glass-panel" style={{ padding: '1.2rem', cursor: 'pointer', borderLeft: n.read ? 'none' : '4px solid var(--primary)', background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)' }}>
                                <div style={{ fontWeight: 'bold' }}>{snap.isSnapshot ? `Official Update: ${snap.ID}` : 'Management Note'}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(n.timestamp).toLocaleTimeString()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {/* SUPPORT WIDGET */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '1000' }}>
            {showChat ? (
                <div className="glass-panel" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '1rem', background: '#020617', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}><strong>Support Hub</strong><button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>✖</button></div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {chatHistory.map((m, i) => <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', margin: '0.3rem 0', fontSize: '0.8rem' }}>{m.message}</div>)}
                    </div>
                </div>
            ) : <button className="btn-primary" onClick={() => setShowChat(true)} style={{ width: '60px', height: '60px', borderRadius: '50%' }}>💬</button>}
      </div>

      {/* CREDENTIAL MODAL (Ticket or Certificate) */}
      {selectedBooking && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: showCertificate ? '800px' : '420px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                {showCertificate ? (
                    <div className="certificate-paper page-transition">
                        <div style={{ border: '2px solid #1e293b', padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontWeight: '900', letterSpacing: '4px', fontSize: '0.7rem', color: 'var(--primary)' }}>TECHFEST OFFICIAL RECOGNITION</div>
                            <h1 style={{ fontSize: '3.5rem', color: '#0f172a', margin: '1rem 0', fontFamily: 'serif' }}>CERTIFICATE</h1>
                            <p style={{ letterSpacing: '5px', fontWeight: 'bold' }}>OF EXCELLENCE & PARTICIPATION</p>
                            <div style={{ margin: '3rem 0' }}>
                                <p style={{ fontStyle: 'italic' }}>Awarded to</p>
                                <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', textTransform: 'uppercase' }}>{user.name}</h2>
                                <p>for their outstanding performance in</p>
                                <h3 style={{ fontSize: '1.8rem' }}>{getEventName(selectedBooking.eventId).toUpperCase()}</h3>
                            </div>
                            <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>UID: CERT-{selectedBooking.id}-{user.id}</p>
                        </div>
                    </div>
                ) : (
                    <div className="real-ticket page-transition">
                        <div className="ticket-header-print" style={{ padding: '1.5rem', textAlign: 'center', background: '#0f172a', color: 'white' }}>
                            <div style={{ fontSize: '0.6rem', letterSpacing: '2px' }}>OFFICIAL EVENT PASS</div>
                            <h3 style={{ margin: '0.5rem 0' }}>{getEventName(selectedBooking.eventId)}</h3>
                            <span className="status-badge-verified">VERIFIED ENTRY</span>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'white', color: '#1e293b' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <div><small style={{ fontWeight: 'bold' }}>HOLDER</small><div>{user.name}</div></div>
                                <div><small style={{ fontWeight: 'bold' }}>TICKET ID</small><div>#TF-{selectedBooking.id}</div></div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TF_VALID_${selectedBooking.id}`} style={{ width: '120px' }} alt="QR" />
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleDownload} style={{ background: 'white', color: '#0f172a' }}>📥 Download Full PDF</button>
                    <button className="btn-elite" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setSelectedBooking(null)}>Close Viewer</button>
                </div>
              </div>
          </div>
      )}

      {/* MAIL VIEW MODAL */}
      {selectedMail && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ background: 'white', color: '#1e293b' }}>
                  <h3>Management Correspondence</h3>
                  <p>{selectedMail.message}</p>
                  <button className="btn-primary" onClick={() => setSelectedMail(null)}>Close</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
