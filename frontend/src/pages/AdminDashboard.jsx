import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedUserChat, setSelectedUserChat] = useState(null);
  
  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
  const [editingEvent, setEditingEvent] = useState(null);
  const [status, setStatus] = useState({ events: 'loading', users: 'loading', bookings: 'loading' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Custom Decision Modal State
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
        fetchAllData();
        if (activeTab === 'support') fetchSupport();
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeTab]);

  const showInteractiveToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchAllData = async () => {
    try {
        const res = await api.event.get('');
        setEvents(res.data);
        setStatus(prev => ({...prev, events: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, events: 'offline'})); }

    try {
        const res = await api.user.get('');
        setUsers(res.data);
        setStatus(prev => ({...prev, users: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, users: 'offline'})); }

    try {
        const res = await api.booking.get('');
        setBookings(res.data);
        setStatus(prev => ({...prev, bookings: 'online'}));
    } catch (e) { setStatus(prev => ({...prev, bookings: 'offline'})); }
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

  const openDecision = (title, message, callback) => {
    setCustomModal({ show: true, title, message, onConfirm: callback });
  };

  const handleSendReply = async (uId) => {
    if (!replyMessage.trim()) return;
    const msg = { userId: uId, senderName: 'Admin Support', message: replyMessage, type: 'ADMIN' };
    await api.support.post('/send', msg);
    setReplyMessage('');
    showInteractiveToast("Reply Transmitted Successfully", "info");
    fetchSupport();
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await api.event.post('', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    showInteractiveToast("New Event Registered Successfully", "success");
    fetchAllData();
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    await api.event.put(`/${editingEvent.id}`, editingEvent);
    setEditingEvent(null);
    showInteractiveToast("Event Modifications Synchronized", "info");
    fetchAllData();
  };

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')); } catch(e) { return null; }
  });
  
  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="app-container"><h2>Access Denied</h2></div>;

  return (
    <div className="app-container page-transition">
      {/* INTERACTIVE ADMIN TOAST */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: '2000', padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '1rem', border: '1px solid var(--primary-bright)', boxShadow: '0 0 20px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>✅</span>
                <span style={{ fontWeight: 'bold' }}>{toast.message}</span>
              </div>
          </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="gradient-text">Administrator Console</h2>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem' }}>
            <span style={{ color: status.events === 'online' ? 'var(--success)' : 'var(--accent)' }}>● EVENTS</span>
            <span style={{ color: status.users === 'online' ? 'var(--success)' : 'var(--accent)' }}>● USERS</span>
            <span style={{ color: status.bookings === 'online' ? 'var(--success)' : 'var(--accent)' }}>● BOOKINGS</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'events' ? 1 : 0.6 }} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'users' ? 1 : 0.6 }} onClick={() => setActiveTab('users')}>User Registry</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Booking Log</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'support' ? 1 : 0.6, background: 'var(--vivid-pink)' }} onClick={() => setActiveTab('support')}>Help Desk</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {activeTab === 'events' && (
          <div>
            {editingEvent ? (
              <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} />
                  <input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Sync Update</button>
              </form>
            ) : (
              <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <input type="text" placeholder="Event Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                  <input type="number" placeholder="Price" className="form-control" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Register Event</button>
              </form>
            )}

            {events.map(ev => (
              <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', marginBottom: '0.5rem' }}>
                <strong>{ev.eventName}</strong>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingEvent(ev)} className="btn-elite">Edit</button>
                    <button onClick={() => openDecision("Confirm Deletion", `Purge event ${ev.eventName}?`, async () => {
                        await api.event.delete(`/${ev.id}`);
                        showInteractiveToast("Event Purged from Database", "info");
                        fetchAllData();
                    })} className="btn-elite" style={{ background: 'var(--accent)' }}>X</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Similar Toast triggers for Users and Bookings... */}
        {activeTab === 'users' && (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left' }}>
                    <thead><tr><th>ID</th><th>NAME</th><th>ACTION</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>USR-{u.id}</td>
                                <td>{u.name}</td>
                                <td>
                                    {u.role !== 'ADMIN' && <button onClick={() => openDecision("Confirm Purge", `Delete user ${u.name}?`, async () => {
                                        await api.user.delete(`/${u.id}`);
                                        showInteractiveToast("User Account Erased", "info");
                                        fetchAllData();
                                    })} className="btn-elite" style={{ background: 'var(--accent)' }}>Purge</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'bookings' && (
            <table style={{ width: '100%', textAlign: 'left' }}>
                <thead><tr><th>TICKET ID</th><th>USER</th><th>ACTION</th></tr></thead>
                <tbody>
                    {bookings.map(b => (
                        <tr key={b.id}>
                            <td>#TF-{b.id}</td>
                            <td>USR-{b.userId}</td>
                            <td>
                                <button onClick={() => openDecision("Revoke Booking", "Terminate this entry pass?", async () => {
                                    await api.booking.delete(`/${b.id}`);
                                    showInteractiveToast("Entry Pass Revoked and User Notified", "info");
                                    fetchAllData();
                                })} className="btn-elite" style={{ background: 'var(--accent)' }}>Revoke</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

        {activeTab === 'support' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
                <div style={{ borderRight: '1px solid var(--glass-border)' }}>
                    {Object.keys(supportChats).map(uId => (
                        <div key={uId} onClick={() => setSelectedUserChat(uId)} style={{ padding: '0.8rem', background: selectedUserChat === uId ? 'var(--primary)' : 'transparent', cursor: 'pointer', borderRadius: '0.5rem' }}>
                            MEMBER ID: {uId}
                        </div>
                    ))}
                </div>
                <div>
                    {selectedUserChat ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '300px' }}>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {supportChats[selectedUserChat].map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.5rem', margin: '0.2rem', borderRadius: '0.5rem', width: 'fit-content' }}>
                                        {m.message}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" className="form-control" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type reply..."/>
                                <button className="btn-primary" onClick={() => handleSendReply(selectedUserChat)}>Send</button>
                            </div>
                        </div>
                    ) : <div style={{ textAlign: 'center', opacity: 0.3 }}>Select a chat</div>}
                </div>
            </div>
        )}
      </div>

      {/* CUSTOM DECISION MODAL */}
      {customModal.show && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '350px' }}>
                    <h3 className="gradient-text">{customModal.title}</h3>
                    <p style={{ margin: '1rem 0', fontSize: '0.9rem' }}>{customModal.message}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-primary" onClick={() => { customModal.onConfirm(); setCustomModal({...customModal, show: false}); }}>Execute</button>
                        <button className="btn-elite" onClick={() => setCustomModal({...customModal, show: false})}>Abort</button>
                    </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
