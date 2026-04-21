import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedUserChat, setSelectedUserChat] = useState(null);
  const [status, setStatus] = useState({ events: 'evaluating', users: 'evaluating', bookings: 'evaluating' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
  const [editingEvent, setEditingEvent] = useState(null);

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')); } catch(e) { return null; }
  });

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
        fetchAllData().then(() => setIsDataLoaded(true));
        const interval = setInterval(fetchAllData, 7000); 
        return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const showInteractiveToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchAllData = async () => {
    try {
        const [eRes, uRes, bRes] = await Promise.all([
            api.event.get(''),
            api.user.get(''),
            api.booking.get('')
        ]);
        setEvents(eRes.data);
        setUsers(uRes.data);
        setBookings(bRes.data);
        setStatus({ events: 'online', users: 'online', bookings: 'online' });
    } catch (e) {
        setStatus({ events: 'offline', users: 'offline', bookings: 'offline' });
    }
    if (activeTab === 'support') fetchSupport();
  };

  const fetchSupport = async () => {
    try {
        const res = await api.support.get('/all');
        const grouped = res.data.reduce((acc, msg) => {
            if (!acc[msg.userId]) acc[msg.userId] = [];
            acc[msg.userId].push(msg);
            return acc;
        }, {});
        setSupportChats(grouped);
    } catch (e) {}
  };

  const handleSendReply = async (uId) => {
    if (!replyMessage.trim()) return;
    const msg = { userId: uId, senderName: 'Admin Support', message: replyMessage, type: 'ADMIN' };
    await api.support.post('/send', msg);
    setReplyMessage('');
    showInteractiveToast("Support Response Dispatched", "success");
    fetchSupport();
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await api.event.post('', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    showInteractiveToast("New Event Synchronized Successfully", "success");
    fetchAllData();
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalTickets = bookings.reduce((sum, b) => sum + (b.ticketsBooked || 0), 0);

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '5rem', textAlign: 'center'}}><h2>Access Forbidden</h2></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 ADMIN HUD TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '30px', right: '30px', zIndex: '5000', padding: '1.2rem 2.5rem', background: 'var(--primary)', borderRadius: '1rem', border: '1px solid var(--primary-bright)', boxShadow: '0 0 30px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>🛡️</span>
                <span style={{ fontWeight: '900', letterSpacing: '0.5px' }}>{toast.message}</span>
              </div>
          </div>
      )}

      <div style={{ marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0, fontWeight: '900', letterSpacing: '-2px' }}>Command Center</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={{ color: status.events === 'online' ? 'var(--success)' : 'var(--accent)', fontWeight: 'bold', fontSize: '0.7rem' }}>🌐 EVENT CLOUD: ONLINE</span>
            <span style={{ color: status.bookings === 'online' ? 'var(--success)' : 'var(--accent)', fontWeight: 'bold', fontSize: '0.7rem' }}>🧾 LEDGER: READY</span>
        </div>
      </div>

      {/* 🏆 THE CINEMATIC HERO METRICS - Center Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
          <div className="hero-metric">
              <div className="metric-label">GLOBAL REVENUE</div>
              <div className="metric-value" style={{ color: 'var(--success)' }}>₹{totalRevenue.toLocaleString()}</div>
              <div className="metric-footer">Across {bookings.length} Orders</div>
          </div>
          <div className="hero-metric">
              <div className="metric-label">TICKETS ISSUED</div>
              <div className="metric-value" style={{ color: 'var(--primary)' }}>{totalTickets}</div>
              <div className="metric-footer">Verified System Passes</div>
          </div>
          <div className="hero-metric">
              <div className="metric-label">TOTAL MEMBERS</div>
              <div className="metric-value" style={{ color: 'white' }}>{users.length}</div>
              <div className="metric-footer">Registered Students</div>
          </div>
      </div>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeEliteTab : null} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-tab-elite" style={activeTab === 'users' ? activeEliteTab : null} onClick={() => setActiveTab('users')}>Member Registry</button>
        <button className="btn-tab-elite" style={activeTab === 'bookings' ? activeEliteTab : null} onClick={() => setActiveTab('bookings')}>Audit Log</button>
        <button className="btn-tab-elite" style={{...(activeTab === 'support' ? activeEliteTab : null), background: 'var(--vivid-pink)'}} onClick={() => setActiveTab('support')}>
            Help Desk {Object.keys(supportChats).length > 0 && <span className="tab-count">{Object.keys(supportChats).length}</span>}
        </button>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3rem' }}>
        {activeTab === 'events' && (
          <div className="page-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Deployment Protocol</h2>
                <button className="btn-elite" onClick={() => setEditingEvent(null)}>REFRESH LIST</button>
            </div>
            <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
                <input type="text" placeholder="Event Mission Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                <input type="number" placeholder="Asset Cost" className="form-control" value={newEvent.price || ''} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                <button type="submit" className="btn-primary" style={{ height: '55px' }}>ADD TO REGISTRY</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>{ev.eventName}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>ASSET UID: #E-{ev.id} | {ev.department}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{ev.availableTickets} / {ev.totalTickets}</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>SLOTS REMAINING</div>
                        </div>
                        <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => {
                            if(window.confirm("Purge this event asset?")) {
                                api.event.delete(`/${ev.id}`).then(fetchAllData);
                                showInteractiveToast("Event Purged from Cloud", "info");
                            }
                        }}>TERMINATE</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="page-transition">
             <h2 className="gradient-text">Member Base Registry</h2>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '2rem' }}>
                  <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <tr><th>INTERNAL ID</th><th>IDENTIFIER</th><th>ROLE CAPABILITY</th><th>ACTION</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>USR-{u.id}</td>
                            <td style={{ padding: '1.5rem 1rem' }}><strong>{u.name}</strong><br/><small style={{ opacity: 0.5 }}>{u.email}</small></td>
                            <td style={{ padding: '1.5rem 1rem' }}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{u.role}</span></td>
                            <td style={{ padding: '1.5rem 1rem' }}>
                                {u.role !== 'ADMIN' && <button className="btn-elite" style={{ background: 'var(--accent)', fontSize: '0.7rem' }} onClick={() => {
                                    if(window.confirm("Delete account?")) {
                                        api.user.delete(`/${u.id}`).then(fetchAllData);
                                        showInteractiveToast("Member Record Erased", "info");
                                    }
                                }}>PURGE</button>}
                            </td>
                        </tr>
                    ))}
                  </tbody>
             </table>
          </div>
        )}

        {activeTab === 'bookings' && (
            <div className="page-transition">
                <h2 className="gradient-text">Global Financial Ledger</h2>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '2rem' }}>
                    <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', opacity: 0.5 }}>
                        <tr><th>TXN ID</th><th>ASSET</th><th>QUANTITY</th><th>GROSS TOTAL</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>#TF-{b.id}</td>
                                <td style={{ padding: '1.5rem 1rem' }}>{events.find(e => e.id === b.eventId)?.eventName || `Asset ID: ${b.eventId}`}</td>
                                <td style={{ padding: '1.5rem 1rem' }}>{b.ticketsBooked} Unit(s)</td>
                                <td style={{ padding: '1.5rem 1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount.toLocaleString()}</td>
                                <td style={{ padding: '1.5rem 1rem' }}>
                                    <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => {
                                        if(window.confirm("Revoke this transaction?")) {
                                            api.booking.delete(`/${b.id}`).then(fetchAllData);
                                            showInteractiveToast("Transaction Revoked", "info");
                                        }
                                    }}>VOID TXN</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'support' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                    <h4 style={{ opacity: 0.6, marginBottom: '1rem' }}>Active Support Tickets</h4>
                    {Object.keys(supportChats).map(uId => (
                        <div key={uId} onClick={() => setSelectedUserChat(uId)} style={{ padding: '1.2rem', background: selectedUserChat === uId ? 'var(--primary)' : 'rgba(255,255,255,0.02)', borderRadius: '1rem', cursor: 'pointer', marginBottom: '0.5rem', transition: '0.3s' }}>
                            <div style={{ fontWeight: 'bold' }}>USR-{uId}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Latest: {supportChats[uId][supportChats[uId].length-1].message}</div>
                        </div>
                    ))}
                </div>
                <div>
                    {selectedUserChat ? (
                        <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem' }}>
                                {supportChats[selectedUserChat].map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.8rem 1.2rem', borderRadius: '1rem', fontSize: '0.85rem' }}>{m.message}</div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" className="form-control" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendReply(selectedUserChat)} placeholder="Dispatch response..."/>
                                <button className="btn-primary" style={{ width: '120px' }} onClick={() => handleSendReply(selectedUserChat)}>REPLY</button>
                            </div>
                        </div>
                    ) : <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.2 }}>SELECT TICKET TO REVIEw</div>}
                </div>
            </div>
        )}
      </div>

      <style>{`
        .hero-metric { background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 2.5rem; border-radius: 20px; textAlign: center; transition: 0.3s; }
        .hero-metric:hover { transform: translateY(-5px); border-color: var(--primary); background: rgba(139, 92, 246, 0.05); }
        .metric-label { font-size: 0.7rem; font-weight: 900; letter-spacing: 2px; opacity: 0.6; margin-bottom: 0.5rem; }
        .metric-value { font-size: 3.5rem; font-weight: 950; letter-spacing: -2px; }
        .metric-footer { font-size: 0.75rem; opacity: 0.4; margin-top: 0.5rem; font-weight: bold; }
        .btn-tab-elite { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2.2rem; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; font-size: 0.9rem; }
        .tab-count { background: white; color: black; border-radius: 50%; padding: 0 6px; margin-left: 8px; font-size: 0.7rem; }
      `}</style>
    </div>
  );
};

const activeEliteTab = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 25px var(--primary-bright)', transform: 'scale(1.05)' };

export default AdminDashboard;
