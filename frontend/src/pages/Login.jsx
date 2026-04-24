import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
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
      const response = await api.user.post('/login', { email, password });
      const user = response.data;
      
      if (user && user.id) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        // 🚀 INTELLIGENT REDIRECTION
        if (user.role === 'ADMIN') navigate('/admin');
        else navigate('/events'); // Direct to browsing cloud
      } else {
        setError('Authentication Failed: Identity not recognized.');
      }
    } catch (err) {
      if (err.response?.status === 401) setError('Invalid security key for this identifier.');
      else if (err.response?.status === 404) setError('Member identifier not found in the registry.');
      else setError('Connectivity Timeout: Cloud services are currently offline.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Fetch user info from Google using the access token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const decoded = await res.json();
        
        const response = await api.user.post('/google-login', {
          email: decoded.email,
          name: decoded.name,
        });
        const user = response.data;
        if (user && user.id) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.role === 'ADMIN') navigate('/admin');
          else navigate('/events');
        }
      } catch (err) {
        setError('Google Authentication Failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Authentication Failed'),
    prompt: 'select_account',
  });

  return (
    <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 0 25px var(--primary-bright)', color: 'white', marginBottom: '1.5rem' }}>T</div>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Authorize</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Synchronize with the Technical Fest Cloud.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="error-text" style={{ padding: '0.8rem', borderLeft: '4px solid var(--vivid-pink)', background: 'rgba(244, 63, 94, 0.05)' }}>{error}</div>}
          <input type="email" placeholder="Email Identifier" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Key" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit" disabled={loading} style={{ height: '55px' }}>{loading ? 'SYNCHRONIZING...' : 'AUTHORIZE SESSION'}</button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            type="button" 
            onClick={() => googleLogin()} 
            className="btn-elite" 
            style={{ width: '100%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', border: 'none', fontWeight: 700 }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: '20px' }} />
            CONTINUE WITH GOOGLE
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>New here? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Initialize Registry</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
