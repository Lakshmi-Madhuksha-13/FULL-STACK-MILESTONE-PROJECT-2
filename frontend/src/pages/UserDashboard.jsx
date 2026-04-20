import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, notifications
  const [user] = useState(() => JSON.parse(localStorage.getItem('currentUser')));

  useEffect(() => {
    if (user && user.id) {
      fetchData();
      const interval = setInterval(fetchData, 10000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, notifyRes] = await Promise.all([
            axios.get(`http://localhost:8083/api/bookings/user/${user.id}`),
            axios.get(`http://localhost:8081/api/users/${user.id}/notifications`)
        ]);
        setBookings(bookingsRes.data);
        setNotifications(notifyRes.data);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const markAsRead = async (id) => {
    await axios.put(`http://localhost:8081/api/users/notifications/${id}/read`);
    fetchData();
  };

  const parseAttendees = (details) => {
    try {
      return JSON.parse(details);
    } catch (e) {
      return [];
    }
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center'}}>Please log in first.</div>;

  return (
    <div className="app-container">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'bookings' ? 1 : 0.6 }} onClick={() => setActiveTab('bookings')}>My Bookings</button>
        <button className="btn-primary" style={{ width: 'auto', opacity: activeTab === 'notifications' ? 1 : 0.6, position: 'relative' }} onClick={() => setActiveTab('notifications')}>
          Notifications
          {notifications.filter(n => !n.read).length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
                  {notifications.filter(n => !n.read).length}
              </span>
          )}
        </button>
      </div>

      <div className="glass-panel">
        {activeTab === 'bookings' ? (
          <>
            <h2 style={{ color: 'var(--primary-color)' }}>My Booking History</h2>
            {loading ? (
              <p>Loading...</p>
            ) : bookings.length === 0 ? (
              <p>You haven't booked any events yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem' }}>ID</th>
                      <th style={{ padding: '1rem' }}>Event ID</th>
                      <th style={{ padding: '1rem' }}>Attendees</th>
                      <th style={{ padding: '1rem' }}>Count</th>
                      <th style={{ padding: '1rem' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => {
                      const attendees = parseAttendees(b.attendeeDetails);
                      return (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>#{b.id}</td>
                          <td style={{ padding: '1rem' }}>{b.eventId}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            {attendees.map((a, i) => (
                              <div key={i} style={{ color: 'var(--text-secondary)' }}>
                                {i + 1}. {a.name} ({a.department})
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: '1rem' }}>{b.ticketsBooked}</td>
                          <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{b.totalAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ color: 'var(--primary-color)' }}>Alerts & Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {notifications.length === 0 ? (
                  <p>No notifications yet.</p>
              ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ 
                        padding: '1.5rem', 
                        background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.1)', 
                        borderLeft: n.read ? '4px solid transparent' : '4px solid var(--primary-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ margin: 0, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.message}</p>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{new Date(n.timestamp).toLocaleString()}</small>
                        </div>
                        {!n.read && (
                            <button className="btn-primary" style={{ width: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => markAsRead(n.id)}>Dismiss</button>
                        )}
                    </div>
                  ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
