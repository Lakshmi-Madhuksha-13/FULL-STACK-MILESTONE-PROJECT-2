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
        // Instant Parallel Boot
        Promise.all([
            fetchEvents(),
            fetchUsers(),
            fetchBookings()
        ]).then(() => setIsDataLoaded(true));

        const interval = setInterval(fetchAllData, 10000); 
        return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const showInteractiveToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchEvents = async () => {
    try {
        const res = await api.event.get('');
        setEvents(res.data);
        setStatus(prev => ({...prev, events: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, events: 'offline'})); }
  };

  const fetchUsers = async () => {
    try {
        const res = await api.user.get('');
        setUsers(res.data);
        setStatus(prev => ({...prev, users: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, users: 'offline'})); }
  };

  const fetchBookings = async () => {
    try {
        const res = await api.booking.get('');
        setBookings(res.data);
        setStatus(prev => ({...prev, bookings: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, bookings: 'offline'})); }
  };

  const fetchAllData = () => {
    fetchEvents();
    fetchUsers();
    fetchBookings();
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
    await api.event.post('', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    showInteractiveToast("System Asset Deployed", "success");
    fetchEvents();
  };

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '5rem', textAlign: 'center'}}><h2>Access Denied</h2></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh', opacity: 1 }}>
      {/* 🚀 INSTANT FEEDBACK TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: '5000', padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '1rem', border: '1px solid var(--primary-bright)', boxShadow: '0 0 20px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><span>✅</span><span style={{ fontWeight: 'bold' }}>{toast.message}</span></div>
          </div>
      )}

      {/* 🏗️ SCAFFOLDED HEADER: Renders instantly */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
            <h2 className="gradient-text" style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900' }}>Administrator Hub</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', marginTop: '0.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                <span className={status.events === 'online' ? 'status-pill-on' : 'status-pill-off'}>EVENTS</span>
                <span className={status.users === 'online' ? 'status-pill-on' : 'status-pill-off'}>USERS</span>
                <span className={status.bookings === 'online' ? 'status-pill-on' : 'status-pill-off'}>BOOKINGS</span>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="summary-pill">₹{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()} <small>REV</small></div>
            <div className="summary-pill">{users.length} <small>MEMBERS</small></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="btn-nav" style={activeTab === 'events' ? activeNavStyle : null} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-nav" style={activeTab === 'users' ? activeNavStyle : null} onClick={() => setActiveTab('users')}>Member Registry</button>
        <button className="btn-nav" style={activeTab === 'bookings' ? activeNavStyle : null} onClick={() => setActiveTab('bookings')}>Audit Log</button>
        <button className="btn-nav" style={{...(activeTab === 'support' ? activeNavStyle : null), background: 'var(--vivid-pink)'}} onClick={() => setActiveTab('support')}>Support Center</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '550px', padding: '2.5rem', position: 'relative' }}>
        {!isDataLoaded && <div className="loader-orbit"></div>}

        {activeTab === 'events' && (
          <div className="page-transition">
            <h3 className="gradient-text" style={{ marginBottom: '2rem' }}>Deployment Protocol</h3>
            <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                <input type="text" placeholder="Mission Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                <input type="number" placeholder="Asset Price" className="form-control" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Initiate Registry</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {events.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>{ev.eventName}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-elite" onClick={() => setEditingEvent(ev)}>CONFIGURE</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ... Other tabs using same scaffold ... */}
        {(activeTab === 'users' || activeTab === 'bookings') && isDataLoaded && (
            <div className="page-transition" style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>
                Asset Tables are currently in synchronous standby.
            </div>
        )}
      </div>

      <style>{`
        .status-pill-on { color: var(--success); }
        .status-pill-off { color: var(--accent); }
        .summary-pill { background: rgba(255,255,255,0.05); padding: 0.5rem 1.2rem; border-radius: 10px; font-weight: 800; border: 1px solid var(--glass-border); font-size: 1.1rem; }
        .summary-pill small { font-size: 0.5rem; opacity: 0.5; display: block; text-transform: uppercase; margin-top: 2px; }
        .btn-nav { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.6rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .loader-orbit { width: 30px; height: 30px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: orbit 0.8s linear infinite; position: absolute; top: 1rem; right: 1rem; }
        @keyframes orbit { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const activeNavStyle = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 15px var(--primary-bright)' };

export default AdminDashboard;
