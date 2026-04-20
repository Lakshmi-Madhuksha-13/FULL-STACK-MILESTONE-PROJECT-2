import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to TechFest Portal
        </h1>
        <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '3rem' }}>
          Connect with the brightest minds across the country. Our platform centralizes the registration and ticket booking process for the flagship technical festivals of top Indian engineering colleges. From coding marathons to robotics championships, secure your spot in minutes.
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            style={{ width: '200px', fontSize: '1.2rem', padding: '1rem' }}
            onClick={() => navigate('/events')}
          >
            Explore Events
          </button>
          <button 
            className="btn-primary" 
            style={{ 
                width: '200px', 
                fontSize: '1.2rem', 
                padding: '1rem', 
                background: 'transparent', 
                border: '2px solid var(--primary-color)',
                color: 'var(--text-primary)'
            }}
            onClick={() => navigate('/register')}
          >
            Join Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
