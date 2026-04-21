import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                
                if (parsed && parsed.role === 'USER') {
                    const fetchNotifications = async () => {
                        try {
                            const res = await api.user.get(`/${parsed.id}/notifications`);
                            if (res.data) setUnreadCount(res.data.filter(n => !n.read).length);
                        } catch (e) {}
                    };
                    fetchNotifications();
                }
            } catch (err) {
                localStorage.removeItem('currentUser');
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [location]); 

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
    };

    return (
        <nav style={{ 
            position: 'sticky', top: '0', zIndex: '1000', 
            background: 'var(--glass-bg)', backdropFilter: 'blur(15px)', 
            borderBottom: '1px solid var(--glass-border)', padding: '0.8rem 0' 
        }}>
            <div className="app-container" style={{ padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ 
                        width: '38px', height: '38px', background: 'var(--primary)', 
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 'bold', fontSize: '1.4rem', color: 'white',
                        boxShadow: '0 0 15px var(--primary-bright)'
                     }}>T</div>
                    <span style={{ fontSize: '1.4rem', fontWeight: '850', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                        TechFest<span style={{ color: 'var(--primary)' }}>.</span>
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <Link to="/" style={linkStyle}>Home</Link>
                        <Link to="/events" style={linkStyle}>Events</Link>
                        {user ? (
                            <>
                                <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={{...linkStyle, position: 'relative'}}>
                                    Dashboard
                                    {unreadCount > 0 && <span className="notification-dot"></span>}
                                </Link>
                                <button className="btn-elite" onClick={handleLogout} style={{ 
                                    padding: '0.4rem 1.2rem', fontSize: '0.85rem', 
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' 
                                }}>Logout</button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <Link to="/login" style={{ ...linkStyle, padding: '0.4rem 1.2rem', background: 'var(--primary)', borderRadius: '6px', color: 'white' }}>Login</Link>
                                <Link to="/register" style={{ ...linkStyle, border: '1px solid var(--glass-border)', padding: '0.4rem 1.2rem', borderRadius: '6px' }}>Join</Link>
                            </div>
                        )}
                    </div>
                    <button onClick={toggleTheme} style={{ 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', 
                        cursor: 'pointer', fontSize: '1.1rem', padding: '0.4rem', 
                        borderRadius: '50%', width: '38px', height: '38px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}> {theme === 'dark' ? '☀️' : '🌙'} </button>
                </div>
            </div>

            <style>{`
                .notification-dot {
                    position: absolute; top: -2px; right: -8px;
                    width: 7px; height: 7px; background: var(--vivid-pink);
                    border-radius: 50%; box-shadow: 0 0 10px var(--vivid-pink);
                    animation: pulseAlert 2s infinite;
                }
                @keyframes pulseAlert {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </nav>
    );
};

const linkStyle = {
    color: 'var(--text-main)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: '0.2s',
    letterSpacing: '0.2px'
};

export default Navbar;
