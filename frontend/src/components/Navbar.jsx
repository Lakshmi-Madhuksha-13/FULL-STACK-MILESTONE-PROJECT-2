import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser')));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'USER') {
      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`http://localhost:8081/api/users/${user.id}/notifications`);
          const unread = res.data.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (e) {}
      };
      
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '1rem 2rem', background: 'var(--surface-dark)', 
      borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem',
      position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)'
    }}>
      <Link to="/" style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
        TechFest
      </Link>
      
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Home</Link>
        <Link to="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Events</Link>
        
        {user ? (
          <>
            {user.role === 'ADMIN' && (
              <Link to="/admin" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Admin Dashboard</Link>
            )}
            
            <Link to="/bookings" style={{ color: 'var(--text-primary)', textDecoration: 'none', position: 'relative' }}>
              My Dashboard
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-12px', background: 'var(--danger)',
                  color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>

            <span style={{ color: 'var(--success)', marginLeft: '1rem' }}>Hi, {user.name}</span>
            <button onClick={handleLogout} className="btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto', background: 'var(--danger)' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto', textDecoration: 'none', textAlign: 'center' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto', background: 'transparent', border: '1px solid var(--primary-color)', textDecoration: 'none', textAlign: 'center' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
