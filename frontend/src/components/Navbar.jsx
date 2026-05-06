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
                if (parsed && parsed.id) {
                    console.log("[Nexus Sync]: Identity Authenticated -", parsed.name);
                    setUser(parsed);
                }
            } catch (err) { 
                console.error("[Nexus Sync]: Identity Corruption Detected.");
                setUser(null); 
            }
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
        console.log("[Nexus System]: Initiating security de-authorization...");
        try {
            localStorage.clear();
            setUser(null);
            navigate('/login');
            console.log("[Nexus System]: De-authorization successful.");
        } catch (err) {
            console.error("[Nexus System]: Logout Failure -", err);
            window.location.href = '/login'; // Fallback
        }
    };

    useEffect(() => {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        } catch(e) {}
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav style={{ 
            position: 'sticky', top: '0', zIndex: '99999', 
            background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', 
            borderBottom: '1px solid var(--glass-border)', padding: '1rem 0' 
        }}>
            <div className="app-container" style={{ padding: '0 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '42px', height: '42px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.6rem', boxShadow: '0 0 25px var(--primary-bright)', color: 'white' }}>T</div>
                    <span className="logo-text" style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>TechFest<span style={{ color: 'var(--primary)' }}>.</span></span>
                </Link>

                {/* 💻 DESKTOP NAV */}
                <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" style={navItem}>HOME</Link>
                    {(user?.role === 'ADMIN' || user?.role === 'VOLUNTEER') ? (
                        <>
                            <Link to="/admin" style={navItem}>ANALYTICS</Link>
                            <Link to="/gate" style={{ ...navItem, color: '#fbbf24', border: '1px solid #fbbf24', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>GATE TERMINAL</Link>
                            <button onClick={() => navigate('/admin', { state: { tab: 'events' } })} 
                                    style={{ ...navItem, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                EVENTS
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/events" style={navItem}>EXPLORE</Link>
                            <Link to="/leaderboard" style={navItem}>LEADERBOARD</Link>
                        </>
                    )}
                    
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="coin-pill" style={{ padding: '0.4rem 0.8rem', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 900, fontSize: '0.7rem' }}>
                                🪙 {user.coins || 0}
                            </div>
                            <Link to={(user.role === 'ADMIN' || user.role === 'VOLUNTEER') ? '/admin' : '/dashboard'} style={{ ...navItem, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                {(user.role === 'ADMIN' || user.role === 'VOLUNTEER') ? 'CONSOLE' : 'PORTAL'}
                            </Link>
                            <Link to="/profile" style={{ ...navItem, padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>MY IDENTITY</Link>
                            <button className="btn-logout-elite" onClick={handleLogout}>LOGOUT</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <Link to="/login" style={{ ...navItem, padding: '0.6rem 2rem', background: 'var(--primary)', borderRadius: '0.75rem', color: 'white' }}>LOGIN</Link>
                        </div>
                    )}
                    <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
                </div>

                {/* 📱 MOBILE TOGGLE */}
                <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.8rem', display: 'none' }}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* 📱 MOBILE OVERLAY */}
            {isMenuOpen && (
                <div className="mobile-menu page-transition" style={{ position: 'fixed', top: '74px', left: 0, right: 0, bottom: 0, background: 'var(--bg-main)', zIndex: 1999, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Link to="/" style={mobileNavItem} onClick={() => setIsMenuOpen(false)}>HOME</Link>
                    <Link to="/events" style={mobileNavItem} onClick={() => setIsMenuOpen(false)}>EVENTS</Link>
                    <Link to="/leaderboard" style={mobileNavItem} onClick={() => setIsMenuOpen(false)}>LEADERBOARD</Link>
                    {user && <Link to="/profile" style={mobileNavItem} onClick={() => setIsMenuOpen(false)}>MY PROFILE</Link>}
                    {user && <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} style={mobileNavItem} onClick={() => setIsMenuOpen(false)}>DASHBOARD</Link>}
                    
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={toggleTheme} className="btn-elite" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
                            {theme === 'dark' ? 'LIGHT MODE ☀️' : 'DARK MODE 🌙'}
                        </button>
                        {user ? (
                            <button className="btn-elite" onClick={handleLogout} style={{ background: 'var(--accent)' }}>LOGOUT</button>
                        ) : (
                            <button className="btn-elite" onClick={() => navigate('/login')} style={{ background: 'var(--primary)' }}>LOGIN / JOIN</button>
                        )}
                    </div>
                </div>
            )}

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
                @media (max-width: 900px) {
                    .desktop-nav { display: none !important; }
                    .mobile-toggle { display: block !important; }
                    .logo-text { font-size: 1.2rem !important; }
                }
            `}</style>
        </nav>
    );
};

const navItem = { color: 'var(--text-main)', textDecoration: 'none', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase' };
const mobileNavItem = { color: 'var(--text-main)', textDecoration: 'none', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1px' };

export default Navbar;
