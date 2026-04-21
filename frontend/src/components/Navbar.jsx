import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
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
        // Absolute Session Verification
        const stored = localStorage.getItem('currentUser');
        if (stored && stored !== "undefined") {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.id) setUser(parsed);
            } catch (err) { setUser(null); }
        } else {
            setUser(null);
        }
    }, [location]); 

    const handleLogout = () => {
        localStorage.clear(); // Complete purge
        window.location.href = '/login';
    };

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <nav style={{ 
            position: 'sticky', top: '0', zIndex: '2000', 
            background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', 
            borderBottom: '1px solid var(--glass-border)', padding: '1rem 0' 
        }}>
            <div className="app-container" style={{ padding: '0 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '42px', height: '42px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.6rem', boxShadow: '0 0 25px var(--primary-bright)', color: 'white' }}>T</div>
                    <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1px' }}>TechFest<span style={{ color: 'var(--primary)' }}>.</span></span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" style={navItem}>HOME</Link>
                    <Link to="/events" style={navItem}>EXPLORE</Link>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={{ ...navItem, color: 'var(--primary)', fontWeight: '900' }}>PORTAL</Link>
                            <button className="btn-elite" onClick={handleLogout} style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--vivid-pink)', color: 'var(--vivid-pink)', boxShadow: 'none' }}>LOGOUT</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Link to="/login" style={{ ...navItem, padding: '0.6rem 1.8rem', background: 'var(--primary)', borderRadius: '0.75rem', color: 'white', border: 'none' }}>LOGIN</Link>
                            <Link to="/register" style={{ ...navItem, border: '1px solid var(--glass-border)', padding: '0.6rem 1.8rem', borderRadius: '0.75rem' }}>JOIN</Link>
                        </div>
                    )}
                    <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
                </div>
            </div>
        </nav>
    );
};

const navItem = { color: 'var(--text-main)', textDecoration: 'none', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' };

export default Navbar;
