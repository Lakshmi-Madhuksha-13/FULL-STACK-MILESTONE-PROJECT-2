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
  const [status, setStatus] = useState({ events: 'active', users: 'active', bookings: 'active' });
  const [toast, setToast] = useState({ show: false, message: '' });

  // Event & User Management State
  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 100, availableTickets: 100 });
  const [editingEvent, setEditingEvent] = useState(null);

  const [currentUser] = useState(() => {
    try { 
        const stored = localStorage.getItem('currentUser');
        return (stored && stored !== 'undefined') ? JSON.parse(stored) : null; 
    } catch(e) { return null; }
  });

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
        fetchAllData().then(() => setIsDataLoaded(true));
        const interval = setInterval(fetchAllData, 7000); 
        return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const fetchAllData = async () => {
    try {
        const [eRes, uRes, bRes] = await Promise.all([
            api.event.get(''),
            api.user.get(''),
            api.booking.get('')
        ]);
        setEvents(Array.isArray(eRes.data) ? eRes.data : []);
        setUsers(Array.isArray(uRes.data) ? uRes.data : []);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
        setStatus({ events: 'online', users: 'online', bookings: 'online' });
    } catch (e) { console.warn("Sync Standby..."); }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
        await api.event.post('', {...newEvent, availableTickets: newEvent.totalTickets});
        setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 100, availableTickets: 100 });
        showToast("New Event Successfully Deployed to Cloud");
        fetchAllData();
    } catch (err) { showToast("System Deployment Error"); }
  };

  const handleDeleteEvent = async (id, name) => {
    if (window.confirm(`Permanently terminate "${name}"? This will vanish all associated records.`)) {
        await api.event.delete(`/${id}`);
        showToast("Event Asset Successfully Purged");
        fetchAllData();
    }
  };

  const handlePurgeUser = async (id, name) => {
    if (window.confirm(`Purge Member "${name}" (ID: USR-${id}) from the registry?`)) {
        await api.user.delete(`/${id}`);
        showToast("Member Record Successfully Liquidated");
        fetchAllData();
    }
  };

  const handleVoidBooking = async (id) => {
    if (window.confirm(`Void Entry Pass #TF-${id}? Formal Revocation will be dispatched.`)) {
        await api.booking.delete(`/${id}`);
        showToast("Entry Pass Revoked & Transaction Voided");
        fetchAllData();
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b?.totalAmount || 0), 0);
  const totalTickets = bookings.reduce((sum, b) => sum + (b?.ticketsBooked || 0), 0);

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '10rem', textAlign: 'center'}}><h2>Access Forbidden</h2></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 ADMIN HUD TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '30px', right: '30px', zIndex: '5000', padding: '1.2rem 2.5rem', background: 'var(--primary)', borderRadius: '1rem', border: '1px solid var(--primary-bright)', boxShadow: '0 0 30px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{ fontWeight: '900' }}>{toast.message}</span></div>
          </div>
      )}

      {/* 🏛️ COMMAND HEADER */}
      <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 className="gradient-text" style={{ fontSize: '3.5rem', margin: 0, fontWeight: '950', letterSpacing: '-2px' }}>Command Hub</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 'bold' }}>● MISSION CRITICAL SYSTEMS: ONLINE</div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="metric-box">₹{totalRevenue.toLocaleString()} <small>REVENUE</small></div>
            <div className="metric-box">{totalTickets} <small>PASSES</small></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeStyle : null} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-tab-elite" style={activeTab === 'users' ? activeStyle : null} onClick={() => setActiveTab('users')}>Identity Registry</button>
        <button className="btn-tab-elite" style={activeTab === 'bookings' ? activeStyle : null} onClick={() => setActiveTab('bookings')}>Audit & Void</button>
        <button className="btn-tab-elite" style={{...(activeTab === 'support' ? activeStyle : null), background: 'var(--vivid-pink)'}} onClick={() => setActiveTab('support')}>Help Desk</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3.5rem' }}>
        {activeTab === 'events' && (
          <div className="page-transition">
            <h3 className="gradient-text" style={{ marginBottom: '2rem' }}>Deployment Protocol</h3>
            <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '4rem' }}>
                <input type="text" placeholder="Mission Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                <input type="text" placeholder="Venue" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                <input type="number" placeholder="Cost (₹)" className="form-control" value={newEvent.price || ''} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>INITIATE DEPLOYMENT</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <h4 style={{ opacity: 0.5, letterSpacing: '2px' }}>RECORDED ASSETS ({events.length})</h4>
                {events.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div><div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>{ev.eventName}</div><div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{ev.venue} • ₹{ev.price}</div></div>
                    <button className="btn-elite" style={{ background: 'var(--accent)', color: 'white', border: 'none' }} onClick={() => handleDeleteEvent(ev.id, ev.eventName)}>TERMINATE</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="page-transition">
            <h3 className="gradient-text" style={{ marginBottom: '2rem' }}>Identity Registry Audit</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', opacity: 0.5 }}><tr><th>MEMBER</th><th>EMAIL</th><th>ROLE</th><th>AUTHORITY</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>{u.name}</td>
                            <td style={{ padding: '1.5rem 1rem' }}>{u.email}</td>
                            <td style={{ padding: '1.5rem 1rem' }}><span className="innovative-badge" style={{fontSize: '0.6rem'}}>{u.role}</span></td>
                            <td style={{ padding: '1.5rem 1rem' }}>
                                {u.role !== 'ADMIN' && <button className="btn-elite" style={{ background: 'var(--accent)', padding: '0.4rem 1rem', fontSize: '0.7rem' }} onClick={() => handlePurgeUser(u.id, u.name)}>PURGE ACCOUNT</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="page-transition">
             <h3 className="gradient-text" style={{ marginBottom: '2rem' }}>Financial Audit & Revision</h3>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', opacity: 0.5 }}><tr><th>PASS ID</th><th>ASSET</th><th>TOTAL</th><th>ACTION</th></tr></thead>
                  <tbody>
                    {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1.5rem 1rem', fontWeight: '900' }}>#TF-{b.id}</td>
                            <td style={{ padding: '1.5rem 1rem' }}>{events.find(e => e.id === b.eventId)?.eventName || b.eventId}</td>
                            <td style={{ padding: '1.5rem 1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                            <td style={{ padding: '1.5rem 1rem' }}>
                                <button className="btn-elite" style={{ background: 'var(--accent)', border: 'none', padding: '0.4rem 1rem', fontSize: '0.7rem' }} onClick={() => handleVoidBooking(b.id)}>VOID ENTRY</button>
                            </td>
                        </tr>
                    ))}
                  </tbody>
             </table>
          </div>
        )}
      </div>

      <style>{`
        .metric-box { background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 1rem 2rem; border-radius: 12px; font-weight: 900; font-size: 1.5rem; text-align: center; }
        .metric-box small { display: block; font-size: 0.6rem; opacity: 0.4; letter-spacing: 1px; }
        .btn-tab-elite { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2rem; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 0.9rem; transition: 0.3s; }
      `}</style>
    </div>
  );
};

const activeStyle = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 25px var(--primary-bright)' };

export default AdminDashboard;
