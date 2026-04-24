import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('theme') || 'dark'; } catch(e) { return 'dark'; }
    });

    const syncUser = () => {
        const stored = localStorage.getItem('currentUser');
        if (stored && stored !== "undefined") {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.id) setUser(parsed);
            } catch (err) { setUser(null); }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        syncUser();
        // 🛡️ BROWSER-LEVEL MONITOR: Detects login/logout across all tabs & routes
        window.addEventListener('storage', syncUser);
        return () => window.removeEventListener('storage', syncUser);
    }, [location]); // Re-sync on every route change

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        } catch(e) {}
    }, [theme]);

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
                    <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>TechFest<span style={{ color: 'var(--primary)' }}>.</span></span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" style={navItem}>HOME</Link>
                    <Link to="/events" style={navItem}>BROWSE</Link>
                    
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 900, fontSize: '0.7rem' }}>
                                🪙 {user.coins || 0} COINS
                            </div>
                            <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={{ ...navItem, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                {user.role === 'ADMIN' ? 'CONSOLE' : 'PORTAL'}
                            </Link>
                            <Link to="/profile" style={{ ...navItem, padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>PROFILE</Link>
                            <button className="btn-logout-elite" onClick={handleLogout}>LOGOUT</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <Link to="/login" style={{ ...navItem, padding: '0.6rem 2rem', background: 'var(--primary)', borderRadius: '0.75rem', color: 'white' }}>LOGIN</Link>
                            <Link to="/register" style={{ ...navItem, padding: '0.6rem 2rem', border: '1px solid var(--glass-border)', borderRadius: '0.75rem' }}>JOIN</Link>
                        </div>
                    )}
                    <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
                </div>
            </div>

            <style>{`
                .btn-logout-elite {
                    background: transparent;
                    border: 2px solid var(--vivid-pink);
                    color: var(--vivid-pink);
                    padding: 0.5rem 1.4rem;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-logout-elite:hover {
                    background: var(--vivid-pink);
                    color: white;
                    box-shadow: 0 0 20px var(--vivid-pink);
                }
            `}</style>
        </nav>
    );
};

const navItem = { color: 'var(--text-main)', textDecoration: 'none', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase' };

export default Navbar;
