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
  const [status, setStatus] = useState({ events: 'standby', users: 'standby', bookings: 'standby' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 50, availableTickets: 50 });
  const [editingEvent, setEditingEvent] = useState(null);

  const [currentUser] = useState(() => {
    try { 
        const stored = localStorage.getItem('currentUser');
        return stored && stored !== "undefined" ? JSON.parse(stored) : null; 
    } catch(e) { return null; }
  });

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

  const showInteractiveToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const fetchAllData = async () => {
    try {
        const [eRes, uRes, bRes] = await Promise.all([
            api.event.get('').catch(() => ({data: []})),
            api.user.get('').catch(() => ({data: []})),
            api.booking.get('').catch(() => ({data: []}))
        ]);
        setEvents(Array.isArray(eRes.data) ? eRes.data : []);
        setUsers(Array.isArray(uRes.data) ? uRes.data : []);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
        setStatus({ events: 'online', users: 'online', bookings: 'online' });
    } catch (e) {
        setStatus({ events: 'maintenance', users: 'maintenance', bookings: 'maintenance' });
    }
    if (activeTab === 'support') fetchSupport();
  };

  const fetchSupport = async () => {
    try {
        const res = await api.support.get('/all');
        const data = Array.isArray(res.data) ? res.data : [];
        const grouped = data.reduce((acc, msg) => {
            if (msg && msg.userId) {
                if (!acc[msg.userId]) acc[msg.userId] = [];
                acc[msg.userId].push(msg);
            }
            return acc;
        }, {});
        setSupportChats(grouped);
    } catch (e) {}
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const totalRevenue = safeBookings.reduce((sum, b) => sum + (b?.totalAmount || 0), 0);
  const totalTickets = safeBookings.reduce((sum, b) => sum + (b?.ticketsBooked || 0), 0);

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '5rem', textAlign: 'center'}}><h2>Unauthorized Access</h2></div>;

  return (
    <div className="app-container page-transition">
      {/* HUD DASHBOARD */}
      <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: '900', margin: 0 }}>Command Console</h1>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--success)' }}>● CORE SERVICES ACTIVE</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', margin: '3rem 0' }}>
          <div className="hero-metric"><div className="metric-label">REVENUE</div><div className="metric-value">₹{totalRevenue.toLocaleString()}</div></div>
          <div className="hero-metric"><div className="metric-label">TICKETS</div><div className="metric-value">{totalTickets}</div></div>
          <div className="hero-metric"><div className="metric-label">MEMBERS</div><div className="metric-value">{users.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeStyle : null} onClick={() => setActiveTab('events')}>Events Hub</button>
        <button className="btn-tab-elite" style={activeTab === 'users' ? activeStyle : null} onClick={() => setActiveTab('users')}>Registry</button>
        <button className="btn-tab-elite" style={activeTab === 'support' ? activeStyle : null} onClick={() => setActiveTab('support')}>Help Desk</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '500px' }}>
        {activeTab === 'events' ? (
            <div className="page-transition">
                <h3>System Deployment</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                    {events.map(ev => ev && (
                        <div key={ev.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><strong>{ev.eventName}</strong><br/><small>{ev.venue}</small></div>
                            <button className="btn-elite" onClick={() => setEditingEvent(ev)}>CONFIGURE</button>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === 'users' ? (
            <div className="page-transition">
                <h3>Participant Database</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '2rem' }}>
                    <thead><tr style={{opacity: 0.5}}><th style={{padding: '1rem'}}>ID</th><th style={{padding: '1rem'}}>NAME</th><th style={{padding: '1rem'}}>STATUS</th></tr></thead>
                    <tbody>
                        {users.map(u => u && (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.2rem' }}>USR-{u.id}</td>
                                <td style={{ padding: '1.2rem' }}>{u.name}</td>
                                <td style={{ padding: '1.2rem' }}>{u.role === 'ADMIN' ? '👑 ADMIN' : '🟢 ACTIVE'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="page-transition">
                <h3>Support Inquiries</h3>
                {Object.keys(supportChats).map(uId => (
                    <div key={uId} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setSelectedUserChat(uId)}>
                        <strong>Ticket Holder: USR-{uId}</strong>
                    </div>
                ))}
            </div>
        )}
      </div>

      <style>{`
        .hero-metric { background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 2.5rem; border-radius: 20px; textAlign: center; }
        .metric-label { font-size: 0.7rem; font-weight: 800; opacity: 0.5; margin-bottom: 0.5rem; letter-spacing: 2px; }
        .metric-value { font-size: 3rem; font-weight: 950; letter-spacing: -2px; }
        .btn-tab-elite { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2rem; border-radius: 12px; cursor: pointer; font-weight: bold; }
      `}</style>
    </div>
  );
};

const activeStyle = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 20px var(--primary-bright)' };

export default AdminDashboard;
