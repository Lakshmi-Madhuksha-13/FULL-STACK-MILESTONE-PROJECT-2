import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

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
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '2rem 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', margin: '4rem 0' }}>
        <div style={{ display: 'inline-block', animation: 'ticker 30s linear infinite', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dim)' }}>
          <span style={{ margin: '0 3rem' }}>🔥 IIT MADRAS SHASTRATA REGISTRATIONS OPEN</span>
          <span style={{ margin: '0 3rem' }}>⚡ TECHNOVA 2026 TICKETS SELLING FAST</span>
          <span style={{ margin: '0 3rem' }}>💎 NEW EVENT ADDED: WEB3 MASTERCLASS</span>
          <span style={{ margin: '0 3rem' }}>🚀 5000+ STUDENTS ALREADY JOINED</span>
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
