import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 🛡️ PROTOCOL FIX: Using POST with JSON body to match backend UserController
      const response = await api.user.post('/login', { email, password });
      const user = response.data;
      
      if (user && user.id) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Redirect based on authority level
        if (user.role === 'ADMIN') navigate('/admin');
        else navigate('/dashboard');
      } else {
        setError('Authentication Failed: Identity not recognized.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
          setError('Invalid Credentials: The security key provided is incorrect.');
      } else if (err.response?.status === 404) {
          setError('Account Not Found: This identifier is not registered in our database.');
      } else {
          setError('System Connection Standby: Microservices are currently unreachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 0 25px var(--primary-bright)', color: 'white', marginBottom: '1.5rem' }}>T</div>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Authorize Session</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Synchronize with the Technical Fest Cloud.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="error-text" style={{ padding: '0.8rem', marginBottom: '1rem', borderLeft: '4px solid var(--vivid-pink)', background: 'rgba(244, 63, 94, 0.05)' }}>{error}</div>}
          
          <div className="form-group">
            <label style={labelStyle}>MEMBER IDENTIFIER (EMAIL)</label>
            <input type="email" placeholder="name@university.edu" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label style={labelStyle}>SECURITY KEY</label>
            <input type="password" placeholder="••••••••" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ height: '55px', marginTop: '1rem' }}>
            {loading ? 'SYNCHRONIZING...' : 'AUTHORIZE SESSION'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>New to the Fest? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Initialize Registry</Link>
          <div style={{ marginTop: '1rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Asset Recovery (Forgot Password?)</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '0.6rem', letterSpacing: '1px' };

export default Login;
