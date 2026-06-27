import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
        api.event.get('')
            .then(res => {
                if (res.data && Array.isArray(res.data)) {
                    const deptStats = {};
                    res.data.forEach(ev => {
                        if (ev && ev.department) {
                            const dept = ev.department.toUpperCase();
                            deptStats[dept] = (deptStats[dept] || 0) + (ev.totalTickets - ev.availableTickets);
                        }
                    });
                    const sorted = Object.entries(deptStats)
                        .sort((a,b) => b[1] - a[1])
                        .slice(0, 3);
                    setStats(sorted);
                }
            })
            .catch(() => console.log("System Status: Synchronizing Cloud Analytics..."))
            .finally(() => setIsLoading(false));
    };
    fetchStats();
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh', position: 'relative' }}>
      
      {/* 🖱️ MAGIC CURSOR TRAIL */}
      <div style={{
          position: 'fixed', top: mousePos.y, left: mousePos.x,
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          zIndex: 9999, opacity: 0.4, filter: 'blur(10px)', transition: 'top 0.15s ease-out, left 0.15s ease-out'
      }}></div>

      {/* 🚀 HERO SECTION */}
      <section style={{ textAlign: 'center', padding: 'clamp(6rem, 12vh, 10rem) 0' }}>
        <div className="bounce-in" style={{ display: 'inline-block', padding: '0.6rem 1.5rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid var(--primary)', borderRadius: '2rem', marginBottom: '2.5rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ✨ The Evolution of Technical Festivals
        </div>
        <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', lineHeight: '0.9', marginBottom: '2.5rem', letterSpacing: '-4px', fontWeight: 950 }}>
          Ignite Your <br className="mobile-hide"/> Future.
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)', maxWidth: '800px', margin: '0 auto 4.5rem auto', lineHeight: '1.6', opacity: 0.7, fontWeight: 500 }}>
          The all-in-one portal to discover, book, and dominate the nation's most prestigious technical festivals. Engineered for the next generation.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <button className="btn-elite neon-glow magnetic-hover mobile-full-width" style={{ padding: '1.5rem 4rem', fontSize: '1.2rem', background: 'var(--primary)', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }} onClick={() => navigate('/events')}>
            Launch Terminal 🚀
          </button>
          <button className="btn-elite magnetic-hover mobile-full-width" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1.5rem 3.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/register')}>
            Join Nexus
          </button>
        </div>
      </section>

      {/* 💎 LIVE WORLD TICKER */}
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '2rem 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', margin: '4rem 0', backdropFilter: 'blur(10px)' }}>
        <div className="ticker-animation" style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-dim)', letterSpacing: '3px', opacity: 0.5 }}>
          <span style={{ margin: '0 5rem' }}>● TECHNOVA 2026 REGISTRATIONS CLIMBING</span>
          <span style={{ margin: '0 5rem' }}>● NEW CLOUD SUMMIT ASSETS DEPLOYED</span>
          <span style={{ margin: '0 5rem' }}>● IIT MADRAS SHASTRATA NOW TRENDING</span>
          <span style={{ margin: '0 5rem' }}>● WEB3 BOOTCAMP SLOTS: 2 REMAINING</span>
          <span style={{ margin: '0 5rem' }}>● NEXUS CORE SYSTEM ONLINE</span>
        </div>
      </div>

      {/* 🏆 LEADERBOARD: Pulse of the Fest */}
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: '950', marginBottom: '1rem' }}>Live Pulse.</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '4.5rem', opacity: 0.6, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 4.5rem auto' }}>Real-time department engagement leaderboard across all festivals.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {stats.length > 0 ? stats.map(([dept, count], i) => (
                <div key={dept} className="glass-panel magnetic-hover" style={{ padding: '3.5rem 2rem', borderTop: i === 0 ? '6px solid var(--primary)' : '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
                    {i === 0 && <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05, fontWeight: 950 }}>1</div>}
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</div>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: '950', letterSpacing: '-1px' }}>{dept}</h3>
                    <div style={{ fontSize: '3rem', fontWeight: '950', color: i === 0 ? 'var(--primary-bright)' : 'inherit', textShadow: i === 0 ? '0 0 30px rgba(139, 92, 246, 0.3)' : 'none' }}>{count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '1rem', fontWeight: '900', opacity: 0.5 }}>IDENTITIES VERIFIED</div>
                </div>
            )) : (
                <div style={{ gridColumn: '1 / -1', padding: '6rem', opacity: 0.4, letterSpacing: '3px', fontWeight: '950', fontSize: '1.2rem' }}>
                    {isLoading ? 'ESTABLISHING CLOUD SYNC...' : 'NO ACTIVE MANIFEST DETECTED.'}
                </div>
            )}
          </div>
      </div>

      {/* 🚀 ELITE FEATURES */}
      <section style={{ padding: '8rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '5rem', fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: '950' }}>Engineered for Impact.</h2>
        <div className="elite-grid">
            <div className="glass-panel magnetic-hover" style={{ padding: '3.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>⚡</div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', fontWeight: 950 }}>Zero-Lag UI</h3>
                <p style={{ color: 'var(--text-dim)', lineHeight: '1.7', fontSize: '1.1rem', opacity: 0.8 }}>Every interaction is optimized for micro-latency, providing sub-second response across all terminals.</p>
            </div>
            <div className="glass-panel magnetic-hover" style={{ padding: '3.5rem', borderLeft: '4px solid var(--secondary)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>📢</div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', fontWeight: 950 }}>Instant Comms</h3>
                <p style={{ color: 'var(--text-dim)', lineHeight: '1.7', fontSize: '1.1rem', opacity: 0.8 }}>Official updates and venue changes are synchronized to your identity the moment they are deployed.</p>
            </div>
            <div className="glass-panel magnetic-hover" style={{ padding: '3.5rem', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>💎</div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', fontWeight: 950 }}>Elite Passports</h3>
                <p style={{ color: 'var(--text-dim)', lineHeight: '1.7', fontSize: '1.1rem', opacity: 0.8 }}>Tickets and participation certificates are verified via unique digital signatures and QR identifiers.</p>
            </div>
        </div>
      </section>

      {/* 📍 CAMPUS NEXUS EXPLORER */}
      <section style={{ padding: '8rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: '950' }}>Campus Nexus Explorer.</h2>
          <p style={{ color: 'var(--text-dim)', opacity: 0.6, fontSize: '1.2rem' }}>Navigate the Technical Fest ecosystem in real-time.</p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', overflow: 'hidden', position: 'relative', borderRadius: '2.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)' }}>
           <iframe
              title="Campus Map Explorer"
              width="100%"
              height="600"
              style={{ border: 'none', borderRadius: '2rem' }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=Vel+Tech+University+Avadi&output=embed&z=14`}
           />
           <div style={{ position: 'absolute', bottom: '3rem', right: '3rem', background: 'rgba(15, 23, 42, 0.95)', padding: '1.5rem 2.5rem', borderRadius: '1.5rem', border: '1px solid var(--primary)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '3px', marginBottom: '0.5rem' }}>OFFICIAL VENUE NETWORK</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.5 }}>
                Vel Tech Technical University<br />
                Avadi, Chennai - 600062
              </div>
              <button className="btn-primary" onClick={() => navigate('/events')} style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.75rem', padding: '0.8rem' }}>EXPLORE EVENT VENUES →</button>
           </div>
        </div>
      </section>

      <style>{`
        .ticker-animation {
            animation: tickerScroll 50s linear infinite;
        }
        @keyframes tickerScroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        .iso-grid {
            position: relative;
            width: 1000px;
            height: 500px;
            background: linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), 
                        linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%);
            background-size: 80px 80px;
            transform: rotateX(45deg) rotateZ(-30deg);
            transform-style: preserve-3d;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 40px;
            box-shadow: 0 100px 200px rgba(0,0,0,0.8);
        }
        .venue-node {
            position: absolute;
            transform: rotateZ(30deg) rotateX(-45deg);
            transform-style: preserve-3d;
        }
        .pulse-ping {
            width: 25px;
            height: 25px;
            background: var(--primary);
            border-radius: 50%;
            position: relative;
            box-shadow: 0 0 30px var(--primary);
        }
        .pulse-ping::after {
            content: '';
            position: absolute;
            inset: -15px;
            border: 2px solid var(--primary);
            border-radius: 50%;
            animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
            75%, 100% { transform: scale(3.5); opacity: 0; }
        }
        .node-label {
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: rgba(15, 23, 42, 0.95);
            padding: 0.6rem 1.4rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 950;
            letter-spacing: 2px;
            color: white;
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: none;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        }
        @media (max-width: 1024px) {
            .iso-grid { transform: scale(0.7) rotateX(45deg) rotateZ(-30deg); }
        }
        @media (max-width: 768px) {
            .iso-grid { transform: scale(0.5) rotateX(45deg) rotateZ(-30deg); }
        }
      `}</style>
    </div>
  );
};

export default Home;
