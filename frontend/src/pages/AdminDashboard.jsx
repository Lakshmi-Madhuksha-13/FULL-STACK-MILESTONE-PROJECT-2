import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); // events, users, bookings
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
        const res = await axios.get('http://localhost:8082/api/events');
        setEvents(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('http://localhost:8081/api/users');
        setUsers(res.data);
      } else if (activeTab === 'bookings') {
        const [bookingsRes, eventsRes] = await Promise.all([
          axios.get('http://localhost:8083/api/bookings'),
          axios.get('http://localhost:8082/api/events')
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
    return event ? event.eventName : `Event #${id}`;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:8082/api/events', newEvent);
    setNewEvent({ eventName: '', department: '', dateTime: '', venue: '', price: 0, totalTickets: 0, availableTickets: 0 });
    fetchData();
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:8082/api/events/${editingEvent.id}`, editingEvent);
    setEditingEvent(null);
    fetchData();
  };

  const handleDeleteEvent = async (id) => {
    if(window.confirm("CANCELLING EVENT: This will delete the event and notify all attendees. Proceed?")) {
      await axios.delete(`http://localhost:8082/api/events/${id}`);
      fetchData();
    }
  };

  const handleDeleteUser = async (id) => {
    if(window.confirm("Are you sure you want to delete this user?")) {
      await axios.delete(`http://localhost:8081/api/users/${id}`);
      fetchData();
    }
  };

  const handleCancelBooking = async (id) => {
    if(window.confirm("CANCEL BOOKING: Are you sure you want to cancel this booking? The user will be notified.")) {
        await axios.delete(`http://localhost:8083/api/bookings/${id}`);
        fetchData();
    }
  };

  const parseAttendees = (details) => {
    try {
      if (!details) return [];
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch(e) { return null; }
  });
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div className="app-container page-transition" style={{textAlign: 'center', color: 'var(--accent)', padding: '5rem'}}><h2>Access Denied</h2><p>Admin privileges required.</p></div>;
  }

  return (
    <div className="app-container page-transition">
      <h2 className="gradient-text">Admin Control Panel</h2>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--success)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.5rem' }}>
                ₹{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
            </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--primary)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Registrations</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.5rem' }}>
                {users.length}
            </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--accent)' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Tickets Sold</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)', marginTop: '0.5rem' }}>
                {bookings.reduce((sum, b) => sum + (b.ticketsBooked || 0), 0)}
            </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'events' ? 1 : 0.6 }} onClick={() => setActiveTab('events')}>Manage Events</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'users' ? 1 : 0.6 }} onClick={() => setActiveTab('users')}>Manage Users</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>All Bookings</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'events' && (
          <div>
            {editingEvent ? (
              <div>
                <h3 className="gradient-text" style={{ fontSize: '1.5rem' }}>Edit Event</h3>
                <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <input type="text" placeholder="Name" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/>
                  <input type="text" placeholder="Department" className="form-control" value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} />
                  <input type="text" placeholder="Date/Time" className="form-control" value={editingEvent.dateTime} onChange={e => setEditingEvent({...editingEvent, dateTime: e.target.value})} />
                  <input type="text" placeholder="Venue" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} />
                  <input type="number" placeholder="Price" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Total Capacity" className="form-control" value={editingEvent.totalTickets} onChange={e => setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Available Tickets" className="form-control" value={editingEvent.availableTickets} onChange={e => setEditingEvent({...editingEvent, availableTickets: parseInt(e.target.value)})} />
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ background: 'var(--primary)' }}>Update & Notify</button>
                    <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={() => setEditingEvent(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3 className="gradient-text" style={{ fontSize: '1.5rem' }}>Add New Event</h3>
                <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <input type="text" placeholder="Name" className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} required/>
                  <input type="text" placeholder="Department" className="form-control" value={newEvent.department} onChange={e => setNewEvent({...newEvent, department: e.target.value})} />
                  <input type="text" placeholder="Date/Time" className="form-control" value={newEvent.dateTime} onChange={e => setNewEvent({...newEvent, dateTime: e.target.value})} />
                  <input type="text" placeholder="Venue" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                  <input type="number" placeholder="Price" className="form-control" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Total Capacity" title="Total Tickets" className="form-control" value={newEvent.totalTickets} onChange={e => setNewEvent({...newEvent, totalTickets: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Available Tickets" title="Available Tickets" className="form-control" value={newEvent.availableTickets} onChange={e => setNewEvent({...newEvent, availableTickets: parseInt(e.target.value)})} />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Add Event</button>
                </form>
              </div>
            )}

            <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginTop: '3rem' }}>Existing Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '1.1rem' }}>{ev.eventName}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{ev.venue} | {ev.totalTickets} Capacity | {ev.availableTickets} Left</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingEvent(ev)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 className="gradient-text">Registered Users</h3>
            {Array.isArray(users) && users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)' }}><strong style={{ color: 'var(--primary)' }}>[{u.role}]</strong> {u.name} ({u.email})</span>
                {u.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Delete</button>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 className="gradient-text">Global Booking Log</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>User ID</th>
                        <th style={{ padding: '1rem' }}>Event Name</th>
                        <th style={{ padding: '1rem' }}>Attendees</th>
                        <th style={{ padding: '1rem' }}>Tickets</th>
                        <th style={{ padding: '1rem' }}>Total</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(bookings) && bookings.map(b => {
                        const attendees = parseAttendees(b.attendeeDetails);
                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem' }}>#{b.id}</td>
                            <td style={{ padding: '1rem' }}>User {b.userId}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{getEventName(b.eventId)}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              {attendees.map((a, i) => <div key={i} style={{ color: 'var(--text-dim)' }}>{i+1}. {a.name}</div>)}
                            </td>
                            <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{(typeof b.totalAmount === 'number' ? b.totalAmount : 0).toFixed(2)}</td>
                            <td style={{ padding: '1rem' }}>
                                <button className="btn-primary" style={{ width: 'auto', background: 'var(--accent)', padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
