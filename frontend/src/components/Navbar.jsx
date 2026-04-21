import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('theme') || 'dark'; } catch(e) { return 'dark'; }
    });

    useEffect(() => {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        } catch(e) {}
    }, [theme]);

    useEffect(() => {
        // Safe Session Detection
        const stored = localStorage.getItem('currentUser');
        if (stored && stored !== "undefined") {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.id) {
                    setUser(parsed);
                    if (parsed.role === 'USER') {
                        api.user.get(`/${parsed.id}/notifications`)
                            .then(res => {
                                if (res.data) setUnreadCount(res.data.filter(n => !n.read).length);
                            })
                            .catch(() => console.log("System Sync: Standby Mode"));
                    }
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

    return (
        <nav style={{ 
            position: 'sticky', top: '0', zIndex: '2000', 
            background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid var(--glass-border)', padding: '0.8rem 0' 
        }}>
            <div className="app-container" style={{ padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 0 20px var(--primary-bright)', color: 'white' }}>T</div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px' }}>TechFest<span style={{ color: 'var(--primary)' }}>.</span></span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" style={navItem}>Home</Link>
                    <Link to="/events" style={navItem}>Events</Link>
                    {user ? (
                        <>
                            <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={navItem}>
                                Dashboard {unreadCount > 0 && <span className="notif-dot"></span>}
                            </Link>
                            <button className="btn-elite" onClick={() => { localStorage.removeItem('currentUser'); window.location.href='/login'; }} style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Logout</button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login" style={{ ...navItem, padding: '0.5rem 1.5rem', background: 'var(--primary)', borderRadius: '0.5rem', color: 'white' }}>Login</Link>
                            <Link to="/register" style={{ ...navItem, border: '1px solid var(--glass-border)', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }}>Join</Link>
                        </div>
                    )}
                    <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
                </div>
            </div>
            <style>{`
                .notif-dot { position: absolute; top: -5px; right: -8px; width: 8px; height: 8px; background: var(--secondary); border-radius: 50%; box-shadow: 0 0 10px var(--secondary); }
            `}</style>
        </nav>
    );
};

const navItem = { color: 'var(--text-main)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', position: 'relative' };

export default Navbar;
