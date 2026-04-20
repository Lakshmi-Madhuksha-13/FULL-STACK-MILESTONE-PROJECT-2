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
        const res = await axios.get('http://localhost:8083/api/bookings');
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    }
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
    return <div className="app-container" style={{textAlign: 'center', color: 'var(--danger)'}}>Access Denied. Admin Privileges Required.</div>;
  }

  return (
    <div className="app-container">
      <h2 style={{ color: 'var(--primary-color)' }}>Admin Control Panel</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ opacity: activeTab === 'events' ? 1 : 0.5 }} onClick={() => setActiveTab('events')}>Manage Events</button>
        <button className="btn-primary" style={{ opacity: activeTab === 'users' ? 1 : 0.5 }} onClick={() => setActiveTab('users')}>Manage Users</button>
        <button className="btn-primary" style={{ opacity: activeTab === 'bookings' ? 1 : 0.5 }} onClick={() => setActiveTab('bookings')}>All Bookings</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'events' && (
          <div>
            {editingEvent ? (
              <div>
                <h3 style={{ color: 'var(--primary-color)' }}>Edit Event</h3>
                <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <input type="text" placeholder="Name" className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} required/>
                  <input type="text" placeholder="Department" className="form-control" value={editingEvent.department} onChange={e => setEditingEvent({...editingEvent, department: e.target.value})} />
                  <input type="text" placeholder="Date/Time" className="form-control" value={editingEvent.dateTime} onChange={e => setEditingEvent({...editingEvent, dateTime: e.target.value})} />
                  <input type="text" placeholder="Venue" className="form-control" value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} />
                  <input type="number" placeholder="Price" className="form-control" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Total Capacity" className="form-control" value={editingEvent.totalTickets} onChange={e => setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Available Tickets" className="form-control" value={editingEvent.availableTickets} onChange={e => setEditingEvent({...editingEvent, availableTickets: parseInt(e.target.value)})} />
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary">Update and Notify Attendees</button>
                    <button type="button" className="btn-primary" style={{ background: 'var(--surface-dark)', border: '1px solid var(--text-secondary)' }} onClick={() => setEditingEvent(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3>Add New Event</h3>
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

            <h3>Existing Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--primary-color)' }}>{ev.eventName}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ev.venue} | {ev.totalTickets} Capacity | {ev.availableTickets} Left</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingEvent(ev)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3>Registered Users</h3>
            {Array.isArray(users) && users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>[{u.role}] {u.name} ({u.email})</span>
                {u.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div style={{ overflowX: 'auto' }}>
            <h3>Global Booking Log</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>User ID</th>
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
                            <td style={{ padding: '1rem' }}>{b.userId}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              {attendees.map((a, i) => <div key={i}>{i+1}. {a.name}</div>)}
                            </td>
                            <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                            <td style={{ padding: '1rem' }}>₹{b.totalAmount}</td>
                            <td style={{ padding: '1rem' }}>
                                <button className="btn-primary" style={{ width: 'auto', background: 'var(--danger)', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleCancelBooking(b.id)}>Cancel</button>
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
