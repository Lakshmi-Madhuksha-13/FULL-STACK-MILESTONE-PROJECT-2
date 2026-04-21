import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:8082/api/events');
            const deptStats = {};
            res.data.forEach(ev => {
                const dept = ev.department.toUpperCase();
                deptStats[dept] = (deptStats[dept] || 0) + (ev.totalTickets - ev.availableTickets);
            });
            const sorted = Object.entries(deptStats)
                .sort((a,b) => b[1] - a[1])
                .slice(0, 3);
            setStats(sorted);
        } catch (e) {}
    };
    fetchStats();
  }, []);

  return (
    <div className="app-container page-transition">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '6rem 0 4rem 0' }}>
        <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '2rem', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
          ✨ The Future of Campus Fests is Here
        </div>
        <h1 className="gradient-text" style={{ fontSize: '5rem', lineHeight: '1', marginBottom: '1.5rem', transition: '0.3s' }}>
          Ignite Your Technical <br/> Excellence.
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.4rem', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
          The all-in-one portal to discover, book, and participate in India's most prestigious technical festivals.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <button className="btn-elite" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }} onClick={() => navigate('/events')}>
            Explore Fests 🚀
          </button>
          <button className="btn-elite" style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '1.2rem 2.5rem', boxShadow: 'none' }} onClick={() => navigate('/register')}>
            Join Community
          </button>
        </div>
      </section>

      {/* Innovation: Live Ticker */}
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '1.5rem 0', background: 'var(--glass-bg)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', margin: '4rem 0' }}>
        <div style={{ display: 'inline-block', animation: 'ticker 30s linear infinite', fontSize: '1rem', fontWeight: '800', color: 'var(--text-dim)', letterSpacing: '1px' }}>
          <span style={{ margin: '0 3rem' }}>🔥 IIT MADRAS SHASTRATA REGISTRATIONS OPEN</span>
          <span style={{ margin: '0 3rem' }}>⚡ TECHNOVA 2026 TICKETS SELLING FAST</span>
          <span style={{ margin: '0 3rem' }}>💎 NEW EVENT ADDED: WEB3 MASTERCLASS</span>
          <span style={{ margin: '0 3rem' }}>🚀 CLOUD SUMMIT 2026 NOW TRENDING</span>
        </div>
      </div>

      {/* Live Stats: Leaderboard */}
      <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem' }}>Pulse of the Fest.</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '3rem' }}>Live department-wise registration leaderboard.</p>
          <div className="leaderboard-container" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {stats.length > 0 ? stats.map(([dept, count], i) => (
                <div key={dept} className="stat-card" style={{ flex: '1', maxWidth: '300px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>{dept}</h3>
                    <div style={{ fontSize: '2rem', fontWeight: '800' }}>{count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bookings Confirmed</div>
                </div>
            )) : (
                <div style={{ color: 'var(--text-dim)', opacity: 0.5 }}>Syncing live analytics...</div>
            )}
          </div>
      </div>

      {/* Features Grid */}
      <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Engineered for Performance.</h2>
      <div className="elite-grid">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h3>Micro-Latency</h3>
          <p style={{ color: 'var(--text-dim)' }}>Built on Java Microservices architecture for sub-second transaction times.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h3>Instant Alerts</h3>
          <p style={{ color: 'var(--text-dim)' }}>Real-time synchronization ensures you never miss a venue change or update.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h3>Secure Tickets</h3>
          <p style={{ color: 'var(--text-dim)' }}>Unique attendee verification for all 10+ participants in a single booking.</p>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Home;
