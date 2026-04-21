import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            
            if (parsed.role === 'USER') {
                const fetchNotifications = async () => {
                    try {
                        const res = await axios.get(`http://localhost:8081/api/users/${parsed.id}/notifications`);
                        setUnreadCount(res.data.filter(n => !n.read).length);
                    } catch (e) {}
                };
                fetchNotifications();
                const interval = setInterval(fetchNotifications, 10000);
                return () => clearInterval(interval);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
    };

    return (
        <nav style={{ position: 'sticky', top: '0', zIndex: '100', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '1rem 0' }}>
            <div className="app-container" style={{ padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 0 15px var(--primary-glow)' }}>&nbsp;T</div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>TechFest<span style={{ color: 'var(--primary)' }}>.</span></span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" style={linkStyle}>Home</Link>
                    <Link to="/events" style={linkStyle}>Events</Link>
                    
                    {user ? (
                        <>
                            <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={linkStyle}>
                                Dashboard
                                {unreadCount > 0 && <span className="notification-dot"></span>}
                            </Link>
                            {user.role === 'USER' && <Link to="/profile" style={linkStyle}>Profile</Link>}
                            <button className="btn-elite" onClick={handleLogout} style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', boxShadow: 'none', border: '1px solid var(--glass-border)' }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login" style={{ ...linkStyle, padding: '0.5rem 1.5rem', background: 'var(--primary)', borderRadius: '0.5rem', color: 'white' }}>Login</Link>
                            <Link to="/register" style={{ ...linkStyle, border: '1px solid var(--glass-border)', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }}>Register</Link>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .notification-dot {
                    position: absolute;
                    top: -5px; right: -8px;
                    width: 10px; height: 10px;
                    background: var(--accent);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
                }
            `}</style>
        </nav>
    );
};

const linkStyle = {
    color: 'var(--text-dim)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    position: 'relative',
    transition: '0.3s'
};

export default Navbar;
