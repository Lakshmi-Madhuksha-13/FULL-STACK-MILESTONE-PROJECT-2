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

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
        fetchAllData().then(() => setIsDataLoaded(true));
        const interval = setInterval(fetchAllData, 10000); 
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

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
        await api.event.post('', {...newEvent, availableTickets: newEvent.totalTickets});
        setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 50, availableTickets: 50 });
        showInteractiveToast("New System Asset Deployed Successfully", "success");
        fetchAllData();
    } catch (err) { showInteractiveToast("Deployment Failed", "error"); }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
        await api.event.put(`/${editingEvent.id}`, editingEvent);
        setEditingEvent(null);
        showInteractiveToast("Event Asset Reconfigured Successfully", "success");
        fetchAllData();
    } catch (err) { showInteractiveToast("Reconfiguration Failed", "error"); }
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
            <span style={{ color: status.events === 'online' ? 'var(--success)' : 'var(--accent)', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '1px' }}>● SYSTEM CORE STATUS: ACTIVE</span>
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
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeEliteTab : null} onClick={() => {setActiveTab('events'); setEditingEvent(null);}}>Deployment & Configuration</button>
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
                    <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
                        <div><label style={labelStyle}>Mission Name</label><input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/></div>
                        <div><label style={labelStyle}>Department</label><input type="text" className="form-control" value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} /></div>
                        <div><label style={labelStyle}>Schedule Date/Time</label><input type="text" className="form-control" value={editingEvent.dateTime} onChange={e => setEditingEvent({...editingEvent, dateTime: e.target.value})} /></div>
                        <div><label style={labelStyle}>Venue Location</label><input type="text" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} /></div>
                        <div><label style={labelStyle}>Asset Price (₹)</label><input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} /></div>
                        <div><label style={labelStyle}>Capacity Slots</label><input type="number" className="form-control" value={editingEvent.totalTickets} onChange={e => setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)})} /></div>
                        
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Sync Reconfiguration</button>
                            <button type="button" className="btn-elite" onClick={() => setEditingEvent(null)} style={{ flex: 0.3 }}>Abort Changes</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Deploy New Technical Event</h3>
                    <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
                        <input type="text" placeholder="Event Name (e.g., Codeathon)" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                        <input type="text" placeholder="Target Department" className="form-control" value={newEvent.department} onChange={e => setNewEvent({...newEvent, department: e.target.value})} />
                        <input type="text" placeholder="Date & Time (YYYY-MM-DD HH:mm)" className="form-control" value={newEvent.dateTime} onChange={e => setNewEvent({...newEvent, dateTime: e.target.value})} />
                        <input type="text" placeholder="Campus Venue / Lab" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                        <input type="number" placeholder="Registration Fee" className="form-control" value={newEvent.price || ''} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Participant Capacity" className="form-control" value={newEvent.totalTickets || ''} onChange={e => setNewEvent({...newEvent, totalTickets: parseInt(e.target.value)})} />
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', height: '55px' }}>INITIATE WORLD-WIDE DEPLOYMENT</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px' }}>Live System Assets</h4>
                {events.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>{ev.eventName}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{ev.venue} • {ev.dateTime}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-elite" onClick={() => setEditingEvent(ev)}>RECONFIGURE</button>
                        <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => {
                            if(window.confirm(`Permanently terminate "${ev.eventName}"? This action is irreversible.`)) {
                                api.event.delete(`/${ev.id}`).then(fetchAllData);
                                showInteractiveToast("System Asset Purged", "info");
                            }
                        }}>TERMINATE</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {(activeTab === 'users' || activeTab === 'bookings') && isDataLoaded && (
            <div className="page-transition" style={{ overflowX: 'auto' }}>
                {activeTab === 'users' ? renderUserRegistry(users, fetchAllData, showInteractiveToast) : renderAuditLog(bookings, events, fetchAllData, showInteractiveToast)}
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

const renderUserRegistry = (users, fetchAllData, showInteractiveToast) => (
    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', opacity: 0.5 }}><tr><th>MEMBER ID</th><th>IDENTIFIER</th><th>CAPABILITY</th><th>ACTION</th></tr></thead>
        <tbody>
            {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>USR-{u.id}</td>
                    <td style={{ padding: '1.5rem 1rem' }}>{u.name}<br/><small>{u.email}</small></td>
                    <td style={{ padding: '1.5rem 1rem' }}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{u.role}</span></td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                        {u.role !== 'ADMIN' && <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => {
                            if(window.confirm("Purge member?")) api.user.delete(`/${u.id}`).then(() => { fetchAllData(); showInteractiveToast("Member Erased", "info"); });
                        }}>PURGE</button>}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const renderAuditLog = (bookings, events, fetchAllData, showInteractiveToast) => (
    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', opacity: 0.5 }}><tr><th>TXN ID</th><th>ASSET</th><th>GROSS TOTAL</th><th>ACTION</th></tr></thead>
        <tbody>
            {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>#TF-{b.id}</td>
                    <td style={{ padding: '1.5rem 1rem' }}>{events.find(e => e.id === b.eventId)?.eventName || `Asset ID: ${b.eventId}`}</td>
                    <td style={{ padding: '1.5rem 1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                        <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => {
                            if(window.confirm("Void transaction?")) api.booking.delete(`/${b.id}`).then(() => { fetchAllData(); showInteractiveToast("Txn Voided", "info"); });
                        }}>VOID</button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.6 };
const activeEliteTab = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 25px var(--primary-bright)' };

export default AdminDashboard;
