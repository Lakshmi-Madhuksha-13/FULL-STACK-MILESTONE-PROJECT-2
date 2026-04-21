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
  const [countdown, setCountdown] = useState({ text: 'Syncing...', target: null });
  const [showCertificate, setShowCertificate] = useState(false);
  const [status, setStatus] = useState({ bookings: 'online', notifications: 'online', events: 'online' });

  // Support & Mail States
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
      fetchAllData();
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
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
    } catch (e) {}

    try {
        const nRes = await api.user.get(`/${user.id}/notifications`);
        const oldLen = notifications.length;
        if (oldLen > 0 && nRes.data.length > oldLen) {
            showInteractiveToast("📩 New Official Correspondence Received.", "info");
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
        setCountdown({ text: 'No Records Found', target: null });
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

  const markAsRead = async (id) => {
    await api.user.put(`/notifications/${id}/read`);
    fetchAllData();
  };

  const parseSnapshot = (msg) => {
    if (!msg.startsWith('BOOKING_SNAPSHOT|')) return { isSnapshot: false, text: msg };
    const parts = msg.split('|').reduce((acc, p) => {
        const [key, val] = p.split(': ');
        if (val) acc[key.trim()] = val.trim();
        return acc;
    }, {});
    return { isSnapshot: true, ...parts };
  };

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { 
        if (typeof details === 'string' && details.includes('name')) return [{name: 'Syncing...'}];
        return []; 
    }
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Session Closed</h2><button className="btn-primary" onClick={() => navigate('/login')}>Login</button></div>;

  return (
    <div className="app-container page-transition">
      {/* GLOBAL TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: '2000', padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 40px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span>📩</span><span style={{ fontWeight: 'bold' }}>{toast.message}</span></div>
          </div>
      )}

      {countdown.target && (
          <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Next Milestone: {countdown.target}</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{countdown.text}</div>
              </div>
              <div style={{ fontSize: '3rem' }}>🚀</div>
          </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Ticket Inventory</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6 }} onClick={() => setActiveTab('notifications')}>Official Inbox ({notifications.filter(n => !n.read).length})</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'wishlist' ? 1 : 0.6 }} onClick={() => setActiveTab('wishlist')}>Starred ⭐</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '400px' }}>
        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text">My Experiences</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <tr><th>ID</th><th>EVENT NAME</th><th>REVENUE</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1.2rem 1rem', fontWeight: 'bold' }}>#TF-{b.id}</td>
                        <td style={{ padding: '1.2rem 1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{getEventName(b.eventId)}</td>
                        <td style={{ padding: '1.2rem 1rem' }}>₹{b.totalAmount}</td>
                        <td style={{ padding: '1.2rem 1rem' }}>
                            <button className="btn-elite" onClick={() => { setSelectedBooking(b); setShowCertificate(false); }} style={{ padding: '0.4rem 1rem' }}>View Pass</button>
                        </td>
                    </tr>
                    ))}
                    {!loading && !bookings.length && (<tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>Registry Empty. Explore the Events page to begin.</td></tr>)}
                </tbody>
                </table>
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
            <div>
                <h2 className="gradient-text">Management Correspondence</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {notifications.map(n => {
                        const snap = parseSnapshot(n.message);
                        return (
                            <div key={n.id} onClick={() => { setSelectedMail(n); markAsRead(n.id); }} className="glass-panel" style={{ padding: '1.2rem', cursor: 'pointer', borderLeft: n.read ? 'none' : '4px solid var(--primary)', background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)', transition: '0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{snap.isSnapshot ? `Official Correspondence: ${snap.ID}` : 'General Update'}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(n.timestamp).toLocaleString()}</div>
                                </div>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {snap.isSnapshot ? `Details regarding your booking for ${snap.Event}...` : n.message}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : <div>Starred items hub...</div>}
      </div>

      {/* SUPPORT WIDGET */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '1000' }}>
            {showChat ? (
                <div className="glass-panel page-transition" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '1rem', background: '#020617', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Support Line</span>
                        <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>✖</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
                        {chatHistory.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '0.8rem', margin: '0.3rem 0', fontSize: '0.8rem' }}>{m.message}</div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="form-control" value={userMsg} onChange={(e) => setUserMsg(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <button className="btn-primary" style={{ width: '50px' }} onClick={handleSendMessage}>➤</button>
                    </div>
                </div>
            ) : <button className="btn-primary" onClick={() => setShowChat(true)} style={{ width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 0 30px var(--primary-bright)' }}>💬</button>}
      </div>

      {/* OFFICIAL MAIL MODAL */}
      {selectedMail && (
          <div className="modal-overlay">
              <div className="modal-content page-transition" style={{ maxWidth: '650px', background: 'white', color: '#1e293b', padding: '3rem', border: 'none' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div style={{ fontWeight: '900', color: 'var(--primary)', letterSpacing: '4px', fontSize: '0.7rem' }}>TECHFEST MANAGEMENT OFFICE</div>
                        <h2 style={{ color: '#0f172a', marginTop: '0.5rem' }}>Official Correspondence</h2>
                    </div>
                    
                    <p style={{ fontWeight: 'bold' }}>Dear {user.name},</p>
                    
                    {(() => {
                        const snap = parseSnapshot(selectedMail.message);
                        if (!snap.isSnapshot) return <p style={{ lineHeight: '1.6' }}>{selectedMail.message}</p>;
                        return (
                            <div>
                                <p style={{ lineHeight: '1.6' }}>This letter serves as formal notification regarding your recent participation booking in our upcoming Technical Festival.</p>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.8rem', margin: '1.5rem 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><strong>Reference:</strong> {snap.ID}</div>
                                        <div><strong>Event:</strong> {snap.Event}</div>
                                        <div><strong>Total Cost:</strong> {snap.Cost}</div>
                                        <div><strong>Status:</strong> <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>REVOKED</span></div>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <strong>Registered Attendees:</strong>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                            {parseAttendees(snap.Attendees).map((a, i) => <div key={i}>• {a.name} ({a.department})</div>)}
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Note: If you believe this revocation was made in error, please contact our Support Hub immediately via your dashboard portal.</p>
                            </div>
                        );
                    })()}

                    <div style={{ marginTop: '3rem', borderTop: '2px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.9rem' }}>
                        <p style={{ margin: 0 }}>Sincerely,</p>
                        <p style={{ fontWeight: 'bold', margin: '0.2rem 0' }}>The Technical Festival Executive Committee</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Received: {new Date(selectedMail.timestamp).toLocaleString()}</p>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <button className="btn-primary" onClick={() => setSelectedMail(null)}>Close Inbox</button>
                    </div>
              </div>
          </div>
      )}

      {/* TICKET PASS MODAL (Existing logic for Viewing Pass) */}
      {selectedBooking && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '420px', background: 'transparent' }}>
                    <div className="real-ticket">
                        <div className="ticket-header"><h3>{getEventName(selectedBooking.eventId)}</h3></div>
                        <div className="ticket-details">
                            <p>#TF-{selectedBooking.id}</p>
                            <div>{parseAttendees(selectedBooking.attendeeDetails).map((a, i) => <div key={i}>• {a.name}</div>)}</div>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;
