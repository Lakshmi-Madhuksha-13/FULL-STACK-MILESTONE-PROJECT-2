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
  const [toast, setToast] = useState({ show: false, message: '' });

  // Event State Management
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
        const interval = setInterval(fetchAllData, 8000); 
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
    } catch (e) {}
    if (activeTab === 'support') fetchSupport();
  };

  const fetchSupport = async () => {
    try {
        const res = await api.support.get('/all');
        const data = Array.isArray(res.data) ? res.data : [];
        const grouped = data.reduce((acc, msg) => {
            if (msg?.userId) {
                if (!acc[msg.userId]) acc[msg.userId] = [];
                acc[msg.userId].push(msg);
            }
            return acc;
        }, {});
        setSupportChats(grouped);
    } catch (e) {}
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
        await api.event.put(`/${editingEvent.id}`, editingEvent);
        setEditingEvent(null);
        showToast("Event Asset Reconfigured Successfully");
        fetchAllData();
    } catch (err) { showToast("System Conflict: Reconfiguration failed."); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
        await api.event.post('', {...newEvent, availableTickets: newEvent.totalTickets});
        setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 100, availableTickets: 100 });
        showToast("New Event Successfully Deployed to Network");
        fetchAllData();
    } catch (err) { showToast("Network Error: Deployment failed."); }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b?.totalAmount || 0), 0);
  const totalTickets = bookings.reduce((sum, b) => sum + (b?.ticketsBooked || 0), 0);

  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container" style={{padding: '10rem', textAlign: 'center'}}><h2>Access Unauthorized</h2></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 GLOBAL NOTIFIER */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: '5000', padding: '1.2rem 2.5rem', background: 'var(--primary)', borderRadius: '1rem', boxShadow: '0 0 30px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{fontWeight: '900'}}>{toast.message}</span></div>
          </div>
      )}

      {/* 🏛️ CENTERALIZED HERO METRICS */}
      <div style={{ textAlign: 'center', margin: '4rem 0 6rem 0' }}>
            <h1 className="gradient-text" style={{ fontSize: '4.5rem', fontWeight: '950', letterSpacing: '-3px', margin: '0 0 1rem 0' }}>Command Center</h1>
            <p style={{ color: 'var(--success)', fontWeight: 'bold', letterSpacing: '2px', fontSize: '0.7rem', marginBottom: '3rem' }}>● OPERATIONAL PULSE: ONLINE</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
                <div className="hero-metric-xl">
                    <small>GROSS REVENUE</small>
                    <div className="val">₹{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="hero-metric-xl">
                    <small>TOTAL PASSES</small>
                    <div className="val">{totalTickets}</div>
                </div>
                <div className="hero-metric-xl">
                    <small>MEMBER BASE</small>
                    <div className="val">{users.length}</div>
                </div>
                <div className="hero-metric-xl">
                    <small>ACTIVE EVENTS</small>
                    <div className="val">{events.length}</div>
                </div>
            </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '4rem' }}>
        <button className="btn-tab-elite" style={activeTab === 'events' ? activeStyle : null} onClick={() => {setActiveTab('events'); setEditingEvent(null);}}>Architecture Hub</button>
        <button className="btn-tab-elite" style={activeTab === 'users' ? activeStyle : null} onClick={() => setActiveTab('users')}>Identity Registry</button>
        <button className="btn-tab-elite" style={activeTab === 'support' ? activeStyle : null} onClick={() => setActiveTab('support')}>Intel & Support</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '4rem' }}>
        {activeTab === 'events' && (
            <div className="page-transition">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {editingEvent ? (
                        <div style={{ marginBottom: '5rem', padding: '3rem', border: '2px solid var(--primary)', borderRadius: '2rem', background: 'rgba(139, 92, 246, 0.05)' }}>
                            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Reconfiguring Event Asset</h2>
                            <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} placeholder="Event Name" required/>
                                <input type="text" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} placeholder="Venue"/>
                                <input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} placeholder="Price (₹)"/>
                                <button type="submit" className="btn-primary">SYNC UPDATES</button>
                                <button type="button" className="btn-elite" onClick={() => setEditingEvent(null)} style={{ background: 'transparent' }}>CANCEL</button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '5rem' }}>
                            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Deploy New TechFest Asset</h2>
                            <form onSubmit={handleCreateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <input type="text" className="form-control" placeholder="Mission/Event Name" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                                <input type="text" className="form-control" placeholder="Primary Venue" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                                <input type="number" className="form-control" placeholder="Entry Fee (₹)" value={newEvent.price || ''} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>INITIATE DEPLOYMENT</button>
                            </form>
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '4rem' }}>
                        <h3 style={{ opacity: 0.5, marginBottom: '2rem', letterSpacing: '2px' }}>MANAGED ASSETS ({events.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {events.map(ev => (
                                <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem', alignItems: 'center' }}>
                                    <div><div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{ev.eventName}</div><div style={{ opacity: 0.4 }}>{ev.venue} • ₹{ev.price}</div></div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="btn-elite" onClick={() => setEditingEvent(ev)}>RECONFIGURE</button>
                                        <button className="btn-elite" style={{ background: 'var(--accent)' }} onClick={() => { if(window.confirm("Terminate Event?")) api.event.delete(`/${ev.id}`).then(fetchAllData); }}>ERASE</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="page-transition">
               <h2 className="gradient-text" style={{ marginBottom: '3rem' }}>Member Infrastructure Registry</h2>
               <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.5, fontSize: '0.75rem' }}>
                        <tr><th>IDENTIFIER</th><th>MEMBER NAME</th><th>CAPABILITY ROLE</th><th>AUTHORITY</th></tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>USR-{u.id}</td>
                                <td style={{ padding: '1.5rem 1rem' }}>{u.name}</td>
                                <td style={{ padding: '1.5rem 1rem' }}><span className="innovative-badge">{u.role}</span></td>
                                <td style={{ padding: '1.5rem 1rem' }}>{u.role !== 'ADMIN' && <button className="btn-elite" style={{ background: 'var(--accent)', fontSize: '0.7rem' }} onClick={() => { if(window.confirm("Purge User?")) api.user.delete(`/${u.id}`).then(fetchAllData); }}>PURGE</button>}</td>
                            </tr>
                        ))}
                    </tbody>
               </table>
            </div>
        )}

        {activeTab === 'support' && (
            <div className="page-transition" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
                <div>
                    <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Operational Intel</h2>
                    <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', lineHeight: '1.8' }}>
                        <p>Welcome to the **Command Intel Hub**. Use this space to manage participant inquiries and monitor real-time system health.</p>
                        <ul style={{ paddingLeft: '1.5rem', listStyle: 'square', color: 'var(--text-dim)' }}>
                            <li>Monitor ** Gross Revenue** benchmarks and ticket velocity.</li>
                            <li>Use the **Architecture Hub** to reconfigure event metadata and pricing.</li>
                            <li>Respond to **Refund Requests** by voiding transactions in the Audit tab.</li>
                            <li>Ensure **Member Registry** integrity by purging inactive or suspicious accounts.</li>
                        </ul>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         {Object.keys(supportChats).length > 0 ? Object.keys(supportChats).map(uId => (
                            <div key={uId} onClick={() => setSelectedUserChat(uId)} className="glass-panel" style={{ padding: '1.2rem', cursor: 'pointer', background: selectedUserChat === uId ? 'var(--primary)' : 'transparent' }}>
                                <strong>Ticket: USR-{uId}</strong>
                            </div>
                         )) : <p style={{opacity: 0.3}}>System is currently clear of participant inquiries.</p>}
                    </div>
                </div>
                <div>
                     {selectedUserChat ? (
                         <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
                             <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                                {supportChats[selectedUserChat].map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '1rem', margin: '0.5rem 0' }}>{m.message}</div>
                                ))}
                             </div>
                             <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" className="form-control" value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type communication..."/>
                                <button className="btn-primary" onClick={() => { api.support.post('/send', { userId: selectedUserChat, senderName: 'Admin', message: replyMessage, type: 'ADMIN' }); setReplyMessage(''); fetchSupport(); }}>SEND</button>
                             </div>
                         </div>
                     ) : <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '10rem' }}>SELECT AN INTEL TICKET</div>}
                </div>
            </div>
        )}
      </div>

      <style>{`
        .hero-metric-xl { text-align: center; }
        .hero-metric-xl small { display: block; font-size: 0.75rem; font-weight: 900; opacity: 0.4; letter-spacing: 3px; margin-bottom: 0.5rem; }
        .hero-metric-xl .val { font-size: 4rem; font-weight: 950; letter-spacing: -2px; }
        .btn-tab-elite { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2.5rem; border-radius: 12px; cursor: pointer; font-weight: 900; font-size: 0.8rem; letter-spacing: 1.5px; transition: 0.4s; }
      `}</style>
    </div>
  );
};

const activeStyle = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 30px var(--primary-bright)' };

export default AdminDashboard;
