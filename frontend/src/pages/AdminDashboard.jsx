import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newEvent, setNewEvent] = useState({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'events') {
        const res = await api.event.get('/events');
        setEvents(res.data);
      } else if (activeTab === 'users') {
        const res = await api.user.get('/');
        setUsers(res.data);
      } else if (activeTab === 'bookings') {
        const [bookingsRes, eventsRes] = await Promise.all([
          api.booking.get('/bookings'),
          api.event.get('/events')
        ]);
        setBookings(bookingsRes.data);
        setEvents(eventsRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getEventName = (id) => {
    const event = events.find(e => e.id === id);
    return event ? event.eventName : `Event ID: ${id}`;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await api.event.post('/events', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    fetchData();
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    await api.event.put(`/events/${editingEvent.id}`, editingEvent);
    setEditingEvent(null);
    fetchData();
  };

  const handleDeleteEvent = async (id) => {
    if(window.confirm("CRITICAL: This will PERMANENTLY delete the event. Proceed?")) {
      await api.event.delete(`/events/${id}`);
      fetchData();
    }
  };

  const handleDeleteUser = async (id) => {
    if(window.confirm("Are you sure you want to delete this user?")) {
      await api.user.delete(`/${id}`);
      fetchData();
    }
  };

  const handleCancelBooking = async (id) => {
    if(window.confirm("ADMIN ACTION: Cancel this booking and notify user?")) {
        await api.booking.delete(`/bookings/${id}`);
        fetchData();
    }
  };

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
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
      <h2 className="gradient-text">Administrator Console</h2>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--success)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold' }}>TOTAL REVENUE GENERATED</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>
                ₹{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
            </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--primary)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold' }}>REGISTERED ENTRANTS</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{users.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--accent)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold' }}>TICKETS ISSUED</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)' }}>
                {bookings.reduce((sum, b) => sum + (b.ticketsBooked || 0), 0)}
            </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'events' ? 1 : 0.6 }} onClick={() => setActiveTab('events')}>System Events</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'users' ? 1 : 0.6 }} onClick={() => setActiveTab('users')}>User Registry</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>Booking Log</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'events' && (
          <div>
            {editingEvent ? (
              <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <h3 className="gradient-text" style={{ gridColumn: 'span 2' }}>Modify Protocol</h3>
                  <input type="text" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/>
                  <input type="text" className="form-control" value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} />
                  <input type="text" className="form-control" value={editingEvent.dateTime} onChange={e => setEditingEvent({...editingEvent, dateTime: e.target.value})} />
                  <input type="text" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} />
                  <input type="number" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" className="form-control" value={editingEvent.totalTickets} onChange={e => setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)})} />
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary">Execute Update</button>
                    <button type="button" className="btn-elite" style={{ background: 'transparent' }} onClick={() => setEditingEvent(null)}>Abort</button>
                  </div>
              </form>
            ) : (
              <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <h3 className="gradient-text" style={{ gridColumn: 'span 2' }}>Initialize New Event</h3>
                  <input type="text" placeholder="Event Code/Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                  <input type="text" placeholder="Department" className="form-control" value={newEvent.department} onChange={e => setNewEvent({...newEvent, department: e.target.value})} />
                  <input type="text" placeholder="Timestamp" className="form-control" value={newEvent.dateTime} onChange={e => setNewEvent({...newEvent, dateTime: e.target.value})} />
                  <input type="text" placeholder="Venue" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                  <input type="number" placeholder="Entry Price" className="form-control" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Cap Limit" className="form-control" value={newEvent.totalTickets} onChange={e => setNewEvent({...newEvent, totalTickets: parseInt(e.target.value)})} />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Register Global Event</button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map(ev => (
                <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>ID: #{ev.id} | {ev.eventName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{ev.venue} | {ev.availableTickets} Slots Left</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingEvent(ev)} className="btn-elite" style={{ padding: '0.4rem 1rem' }}>Edit</button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="btn-elite" style={{ padding: '0.4rem 1rem', background: 'var(--accent)' }}>X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 className="gradient-text">Global User Registry</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem' }}>USER ID</th>
                    <th style={{ padding: '1rem' }}>NAME</th>
                    <th style={{ padding: '1rem' }}>ROLE</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                  </tr>
               </thead>
               <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: '1rem' }}>USR-{u.id}</td>
                    <td style={{ padding: '1rem' }}>{u.name} ({u.email})</td>
                    <td style={{ padding: '1rem', color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-dim)' }}>{u.role}</td>
                    <td style={{ padding: '1rem' }}>
                        {u.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '4px' }}>Purge</button>}
                    </td>
                  </tr>
                ))}
               </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 className="gradient-text">Booking Verification Log</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '1rem' }}>BK ID</th>
                        <th style={{ padding: '1rem' }}>USER</th>
                        <th style={{ padding: '1rem' }}>EVENT NAME</th>
                        <th style={{ padding: '1rem' }}>TICKETS</th>
                        <th style={{ padding: '1rem' }}>REVENUE</th>
                        <th style={{ padding: '1rem' }}>ADMIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td style={{ padding: '1rem' }}>#TF-{b.id}</td>
                          <td style={{ padding: '1rem' }}>USR-{b.userId}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{getEventName(b.eventId)}</td>
                          <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                          <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                          <td style={{ padding: '1rem' }}>
                              <button onClick={() => handleCancelBooking(b.id)} className="btn-elite" style={{ background: 'var(--accent)', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>Revoke</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
