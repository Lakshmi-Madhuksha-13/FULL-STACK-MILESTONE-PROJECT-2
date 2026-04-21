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

  // Event State Management
  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 50, availableTickets: 50 });
  const [editingEvent, setEditingEvent] = useState(null);

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')); } catch(e) { return null; }
  });

  // 🚀 INSTANT TAB SYNC: Fetch support immediately when tab changes
  useEffect(() => {
    if (activeTab === 'support') fetchSupport();
  }, [activeTab]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
        fetchAllData().then(() => setIsDataLoaded(true));
        const interval = setInterval(fetchAllData, 8000); 
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

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalTickets = bookings.reduce((sum, b) => sum + (b.ticketsBooked || 0), 0);

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '5rem', textAlign: 'center'}}><h2>Access Forbidden</h2></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 ADMIN HUD TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '30px', right: '30px', zIndex: '5000', padding: '1.2rem 2.5rem', background: 'var(--primary)', borderRadius: '1rem', border: '1px solid var(--primary-bright)', boxShadow: '0 0 30px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>⚙️</span>
                <span style={{ fontWeight: '900', letterSpacing: '0.5px' }}>{toast.message}</span>
              </div>
          </div>
      )}

      <div style={{ marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0, fontWeight: '900', letterSpacing: '-2px' }}>Event Management Console</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '1px' }}>● SYSTEM CORE STATUS: ACTIVE</span>
        </div>
      </div>

      {/* 🏆 HERO METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
          <div className="hero-metric">
              <div className="metric-label">TOTAL REVENUE (₹)</div>
              <div className="metric-value" style={{ color: 'var(--success)' }}>{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="hero-metric">
              <div className="metric-label">TICKETS ISSUED</div>
              <div className="metric-value" style={{ color: 'var(--primary)' }}>{totalTickets}</div>
          </div>
          <div className="hero-metric">
              <div className="metric-label">ADMIN CONTROLS</div>
              <div className="metric-value" style={{ color: 'white' }}>{events.length}</div>
          </div>
      </div>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeEliteTab : null} onClick={() => {setActiveTab('events'); setEditingEvent(null);}}>Configuration Hub</button>
        <button className="btn-tab-elite" style={activeTab === 'users' ? activeEliteTab : null} onClick={() => setActiveTab('users')}>Member Registry</button>
        <button className="btn-tab-elite" style={activeTab === 'bookings' ? activeEliteTab : null} onClick={() => setActiveTab('bookings')}>Financial Audit</button>
        <button className="btn-tab-elite" style={{...(activeTab === 'support' ? activeEliteTab : null), background: 'var(--vivid-pink)'}} onClick={() => setActiveTab('support')}>Support Center</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3rem' }}>
        {activeTab === 'events' && (
          <div className="page-transition">
            {editingEvent ? (
                <div style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '1rem', border: '1px solid var(--primary)' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Reconfiguring Event Asset: ID #{editingEvent.id}</h3>
                    <form onSubmit={(e) => { e.preventDefault(); api.event.put(`/${editingEvent.id}`, editingEvent).then(() => { setEditingEvent(null); fetchAllData(); showInteractiveToast("Sync Successful"); }); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
                        <input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/>
                        <input type="text" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} />
                        <input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Sync Reconfiguration</button>
                    </form>
                </div>
            ) : (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Deploy New Technical Event</h3>
                    <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
                        <input type="text" placeholder="Event Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                        <input type="number" placeholder="Fee (₹)" className="form-control" value={newEvent.price || ''} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>INITIATE DEPLOYMENT</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div><strong>{ev.eventName}</strong><br/><small style={{ opacity: 0.5 }}>{ev.venue} • {ev.price}₹</small></div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-elite" onClick={() => setEditingEvent(ev)}>RECONFIGURE</button>
                        <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => { if(window.confirm("Delete?")) api.event.delete(`/${ev.id}`).then(fetchAllData); }}>TERMINATE</button>
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
                  <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', opacity: 0.5 }}><tr><th>MEMBER ID</th><th>IDENTIFIER</th><th>CURRENT STATUS</th><th>ACTION</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>USR-{u.id}</td>
                            <td style={{ padding: '1.5rem 1rem' }}>{u.name}<br/><small style={{opacity: 0.5}}>{u.email}</small></td>
                            <td style={{ padding: '1.5rem 1rem' }}>
                                {/* ACTIVITY PULSE: Simulating status based on recent actions or role */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.role === 'ADMIN' || bookings.some(b => b.userId === u.id) ? 'var(--success)' : '#4b5563', boxShadow: u.role === 'ADMIN' ? '0 0 10px var(--success)' : 'none' }}></span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: u.role === 'ADMIN' || bookings.some(b => b.userId === u.id) ? 'var(--success)' : 'var(--text-dim)' }}>
                                        {u.role === 'ADMIN' || bookings.some(b => b.userId === u.id) ? 'ACTIVE' : 'DORMANT'}
                                    </span>
                                </div>
                            </td>
                            <td style={{ padding: '1.5rem 1rem' }}>
                                {u.role !== 'ADMIN' && <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => { if(window.confirm("Purge?")) api.user.delete(`/${u.id}`).then(fetchAllData); }}>PURGE</button>}
                            </td>
                        </tr>
                    ))}
                  </tbody>
             </table>
          </div>
        )}

        {activeTab === 'bookings' && (
            <div className="page-transition">
                <h2 className="gradient-text">Financial Audit</h2>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '2rem' }}>
                    <thead style={{ borderBottom: '1px solid var(--glass-border)' }}><tr><th>TXN ID</th><th>ASSET</th><th>TOTAL</th><th>ACTION</th></tr></thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.2rem' }}>#TF}-{b.id}</td>
                                <td style={{ padding: '1.2rem' }}>{events.find(e => e.id === b.eventId)?.eventName || b.eventId}</td>
                                <td style={{ padding: '1.2rem', color: 'var(--success)' }}>₹{b.totalAmount}</td>
                                <td style={{ padding: '1.2rem' }}><button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => { if(window.confirm("Void?")) api.booking.delete(`/${b.id}`).then(fetchAllData); }}>VOID</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'support' && (
            <div className="page-transition" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                    {Object.keys(supportChats).length > 0 ? Object.keys(supportChats).map(uId => (
                        <div key={uId} onClick={() => setSelectedUserChat(uId)} style={{ padding: '1.2rem', background: selectedUserChat === uId ? 'var(--primary)' : 'rgba(255,255,255,0.02)', borderRadius: '1rem', cursor: 'pointer', marginBottom: '0.8rem' }}>
                            <div style={{ fontWeight: 'bold' }}>MEMBER ID: {uId}</div>
                        </div>
                    )) : <div style={{opacity: 0.3, textAlign: 'center', padding: '2rem'}}>NO TICKETS FOUND</div>}
                </div>
                <div>
                    {selectedUserChat ? (
                        <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {supportChats[selectedUserChat].map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '1rem', fontSize: '0.8rem' }}>{m.message}</div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <input type="text" className="form-control" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendReply(selectedUserChat)} placeholder="Type reply..."/>
                                <button className="btn-primary" style={{ width: '100px' }} onClick={() => handleSendReply(selectedUserChat)}>SEND</button>
                            </div>
                        </div>
                    ) : <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.2 }}>SELECT A SUPPORT TICKET TO START CHAT</div>}
                </div>
            </div>
        )}
      </div>

      <style>{`
        .hero-metric { background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 2rem; border-radius: 15px; textAlign: center; }
        .metric-label { font-size: 0.6rem; font-weight: 900; letter-spacing: 2px; opacity: 0.6; margin-bottom: 0.5rem; }
        .metric-value { font-size: 2.8rem; font-weight: 950; letter-spacing: -1px; }
        .btn-tab-elite { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2.2rem; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

const activeEliteTab = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 25px var(--primary-bright)' };

export default AdminDashboard;
