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

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '6rem 0 4rem 0' }}>
        <div className="bounce-in" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid var(--primary)', borderRadius: '2rem', marginBottom: '2.5rem', fontSize: '0.8rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px' }}>
          ✨ EVOLVING THE CAMPUS EXPERIENCE
        </div>
        <h1 className="gradient-text" style={{ fontSize: '5.5rem', lineHeight: '0.9', marginBottom: '2.5rem', letterSpacing: '-3px' }}>
          Ignite Your Technical <br/> Excellence.
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.3rem', maxWidth: '750px', margin: '0 auto 4rem auto', lineHeight: '1.7', opacity: 0.8 }}>
          The all-in-one portal to discover, book, and participate in the nation's most prestigious technical festivals. Built for the next generation of engineers.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <button className="btn-elite" style={{ padding: '1.4rem 3.5rem', fontSize: '1.1rem', background: 'var(--primary)', boxShadow: '0 0 30px var(--primary-bright)' }} onClick={() => navigate('/events')}>
            Launch Discovery 🚀
          </button>
          <button className="btn-elite" style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '1.4rem 3rem', boxShadow: 'none' }} onClick={() => navigate('/register')}>
            Join Community
          </button>
        </div>
      </section>

      {/* 💎 LIVE WORLD TICKER */}
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '1.8rem 0', background: 'var(--glass-bg)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', margin: '5rem 0' }}>
        <div className="ticker-animation" style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-dim)', letterSpacing: '2px', opacity: 0.6 }}>
          <span style={{ margin: '0 4rem' }}>● TECHNOVA 2026 REGISTRATIONS CLIMBING</span>
          <span style={{ margin: '0 4rem' }}>● NEW CLOUD SUMMIT ASSETS DEPLOYED</span>
          <span style={{ margin: '0 4rem' }}>● IIT MADRAS SHASTRATA NOW TRENDING</span>
          <span style={{ margin: '0 4rem' }}>● WEB3 BOOTCAMP SLOTS: 2 REMAINING</span>
          <span style={{ margin: '0 4rem' }}>● TECHNOVA 2026 REGISTRATIONS CLIMBING</span>
        </div>
      </div>

      {/* 🏆 LEADERBOARD: Pulse of the Fest */}
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '3rem', fontWeight: '900' }}>Live Pulse.</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '4rem', opacity: 0.6 }}>Real-time department engagement leaderboard across all festivals.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.length > 0 ? stats.map(([dept, count], i) => (
                <div key={dept} className="glass-panel" style={{ flex: '1', maxWidth: '320px', padding: '3rem 2rem', borderTop: i === 0 ? '4px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</div>
                    <h3 style={{ margin: '0 0 0.8rem 0', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '900' }}>{dept}</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: i === 0 ? 'var(--primary)' : 'inherit' }}>{count}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0.5rem', fontWeight: 'bold' }}>Entries Authenticated</div>
                </div>
            )) : (
                <div style={{ padding: '5rem', opacity: 0.3, letterSpacing: '2px', fontWeight: 'bold' }}>
                    {isLoading ? 'ESTABLISHING CLOUD SYNC...' : 'TICKET LEDGER IS CURRENTLY CLEAR.'}
                </div>
            )}
          </div>
      </div>

      {/* 🚀 ELITE FEATURES */}
      <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '3rem', fontWeight: '900', marginTop: '6rem' }}>Engineered for Impact.</h2>
      <div className="elite-grid" style={{ paddingBottom: '8rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Zero-Lag UI</h3>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>Every interaction is optimized for micro-latency, providing a sub-second response across all dashboards.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📢</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Instant Broadcasts</h3>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>Official management updates and venue changes are synchronized to your inbox the moment they're made.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💎</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Elite Credentials</h3>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>Your tickets and participation certificates are verified via unique digital signatures and QR identifiers.</p>
        </div>
      </div>

      <style>{`
        .ticker-animation {
            animation: tickerScroll 40s linear infinite;
        }
        @keyframes tickerScroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        .bounce-in { animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3); }
            50% { opacity: 1; transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Home;
