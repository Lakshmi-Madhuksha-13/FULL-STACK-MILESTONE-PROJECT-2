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

  // Custom Modal States
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
        fetchAllData();
        if (activeTab === 'support') fetchSupport();
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeTab]);

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
        // Group messages by userId for the chat list
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
    fetchSupport();
  };

  const getEventName = (id) => {
    const event = events.find(e => e.id === id);
    return event ? event.eventName : `Event ID: ${id}`;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await api.event.post('', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    fetchAllData();
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    await api.event.put(`/${editingEvent.id}`, editingEvent);
    setEditingEvent(null);
    fetchAllData();
  };

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch(e) { return null; }
  });
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div className="app-container" style={{textAlign: 'center', padding: '5rem'}}><h2>Admin Access Denied</h2></div>;
  }

  return (
    <div className="app-container page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Administrator Console</h2>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', fontWeight: 'bold' }}>
            <span style={{ color: status.events === 'online' ? 'var(--success)' : 'var(--accent)' }}>● EVENTS</span>
            <span style={{ color: status.users === 'online' ? 'var(--success)' : 'var(--accent)' }}>● USERS</span>
            <span style={{ color: status.bookings === 'online' ? 'var(--success)' : 'var(--accent)' }}>● BOOKINGS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Revenue</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success)' }}>
                ₹{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
            </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Entrants</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>{users.length}</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'events' ? 1 : 0.6 }} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'users' ? 1 : 0.6 }} onClick={() => setActiveTab('users')}>User Registry</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Booking Log</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'support' ? 1 : 0.6, background: 'var(--vivid-pink)' }} onClick={() => setActiveTab('support')}>
            Help Desk {Object.keys(supportChats).length > 0 && <span style={{ background: 'white', color: 'black', borderRadius: '50%', padding: '0 0.4rem', marginLeft: '0.5rem', fontSize: '0.7rem' }}>{Object.keys(supportChats).length}</span>}
        </button>
      </div>

      <div className="glass-panel" style={{ minHeight: '450px', padding: '2rem' }}>
        {activeTab === 'events' && (
          <div>
            {editingEvent ? (
              <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                  <h3 className="gradient-text" style={{ gridColumn: 'span 2' }}>Modify Protocol</h3>
                  <input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/>
                  <input type="text" className="form-control" value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} />
                  <input type="text" className="form-control" value={editingEvent.dateTime} onChange={e => setEditingEvent({...editingEvent, dateTime: e.target.value})} />
                  <input type="text" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} />
                  <input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" className="form-control" value={editingEvent.totalTickets} onChange={e => setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)})} />
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary">Execute Update</button>
                    <button type="button" className="btn-elite" onClick={() => setEditingEvent(null)}>Cancel</button>
                  </div>
              </form>
            ) : (
              <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                  <h3 className="gradient-text" style={{ gridColumn: 'span 2' }}>Register New Event</h3>
                  <input type="text" placeholder="Event Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                  <input type="text" placeholder="Department" className="form-control" value={newEvent.department} onChange={e => setNewEvent({...newEvent, department: e.target.value})} />
                  <input type="text" placeholder="Schedule" className="form-control" value={newEvent.dateTime} onChange={e => setNewEvent({...newEvent, dateTime: e.target.value})} />
                  <input type="text" placeholder="Venue" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                  <input type="number" placeholder="Price" className="form-control" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Capacity" className="form-control" value={newEvent.totalTickets} onChange={e => setNewEvent({...newEvent, totalTickets: parseInt(e.target.value)})} />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Deploy to System</button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map(ev => (
                <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{ev.eventName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ID: #{ev.id} | {ev.venue}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={() => setEditingEvent(ev)} className="btn-elite" style={{ padding: '0.4rem 1rem' }}>Edit</button>
                    <button onClick={() => openDecision("Confirm Deletion", `Are you sure you want to permanently delete the event "${ev.eventName}"?`, async () => {
                        await api.event.delete(`/${ev.id}`);
                        fetchAllData();
                    })} className="btn-elite" style={{ padding: '0.4rem 1rem', background: 'var(--accent)' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 className="gradient-text">Member Registry</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
               <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '1rem' }}>MEMBER ID</th>
                    <th style={{ padding: '1rem' }}>PERSONAL INFO</th>
                    <th style={{ padding: '1rem' }}>ACCOUNT TYPE</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                  </tr>
               </thead>
               <tbody style={{ fontSize: '0.9rem' }}>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>USR-{u.id}</td>
                    <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                        <span className="innovative-badge" style={{ background: u.role === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', fontSize: '0.6rem' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                        {u.role !== 'ADMIN' && <button onClick={() => openDecision("Confirm Purge", `Are you sure you want to delete user ${u.name}?`, async () => {
                            await api.user.delete(`/${u.id}`);
                            fetchAllData();
                        })} className="btn-elite" style={{ background: 'var(--accent)', fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}>Purge</button>}
                    </td>
                  </tr>
                ))}
               </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 className="gradient-text">Global Transaction Ledger</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        <th style={{ padding: '1rem' }}>TICKET ID</th>
                        <th style={{ padding: '1rem' }}>MEMBER</th>
                        <th style={{ padding: '1rem' }}>EVENT</th>
                        <th style={{ padding: '1rem' }}>SLOTS</th>
                        <th style={{ padding: '1rem' }}>TOTAL</th>
                        <th style={{ padding: '1rem' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.9rem' }}>
                      {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>#TF-{b.id}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>USR-{b.userId}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{getEventName(b.eventId)}</td>
                          <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                          <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: '1rem' }}>
                              <button onClick={() => openDecision("Revoke Booking", "Are you sure you want to cancel this entry pass and notify the user?", async () => {
                                  await api.booking.delete(`/${b.id}`);
                                  fetchAllData();
                              })} className="btn-elite" style={{ background: 'var(--accent)', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>Revoke</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
            </table>
          </div>
        )}

        {activeTab === 'support' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Active Enquiries</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {Object.keys(supportChats).map(uId => {
                            const msgs = supportChats[uId];
                            const last = msgs[msgs.length - 1];
                            return (
                                <div key={uId} onClick={() => setSelectedUserChat(uId)} style={{ padding: '1rem', background: selectedUserChat === uId ? 'var(--primary)' : 'var(--glass-bg)', borderRadius: '0.8rem', cursor: 'pointer', transition: '0.3s' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>MEMBER ID: {uId}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last.message}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    {selectedUserChat ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {supportChats[selectedUserChat].map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.8rem 1.2rem', borderRadius: '1rem', maxWidth: '70%' }}>
                                        <div style={{ fontSize: '0.8rem' }}>{m.message}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.3rem', textAlign: 'right' }}>{new Date(m.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <input type="text" className="form-control" placeholder="Type your response..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendReply(selectedUserChat)}/>
                                <button className="btn-primary" style={{ width: '100px' }} onClick={() => handleSendReply(selectedUserChat)}>Send</button>
                            </div>
                        </div>
                    ) : <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>Select a chat to view history</div>}
                </div>
            </div>
        )}
      </div>

      {/* CUSTOM INTERACTIVE DECISION MODAL */}
      {customModal.show && (
          <div className="modal-overlay" style={{ perspective: '1000px' }}>
              <div className="modal-content page-transition" style={{ maxWidth: '400px', transform: 'rotateX(-5deg)', border: '1px solid var(--accent)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{customModal.title}</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2rem' }}>{customModal.message}</p>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={() => { customModal.onConfirm(); setCustomModal({...customModal, show: false}); }}>Yes, Execute</button>
                            <button className="btn-elite" style={{ background: 'transparent' }} onClick={() => setCustomModal({...customModal, show: false})}>Cancel</button>
                        </div>
                    </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
