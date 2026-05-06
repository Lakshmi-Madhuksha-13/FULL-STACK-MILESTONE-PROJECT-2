import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleQuickLoginAdmin = async () => {
    setLoading(true);
    try {
      let adminUser;
      try {
        const usersRes = await api.user.get('');
        adminUser = usersRes.data.find(u => u.email === '06admin@ad.com');
      } catch (e) {}

      if (!adminUser) {
        const regRes = await api.user.post('/register', { 
          name: 'Super Admin', 
          email: '06admin@ad.com', 
          password: 'admin', 
          role: 'ADMIN' 
        });
        adminUser = regRes.data;
      }

      if (adminUser) {
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        window.location.href = '/admin';
      }
    } catch (err) {
      const mockAdmin = { email: '06admin@ad.com', name: 'Admin', role: 'ADMIN', id: 2 };
      localStorage.setItem('currentUser', JSON.stringify(mockAdmin));
      window.location.href = '/admin';
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.user.post('/login', { email, password });
      const user = response.data;
      
      if (user && user.id) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === 'ADMIN') navigate('/admin');
        else navigate('/events'); 
      } else {
        setError('Authentication Failed: Identity not recognized.');
      }
    } catch (err) {
      setError('Connectivity Timeout: Cloud services are currently offline.');
    } finally {
      setLoading(false);
    }
  };
  
  // 🛡️ REBUILT GOOGLE AUTH
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const decoded = await res.json();
        
        // Connect with Backend
        const response = await api.user.post('/google-login', { 
            email: decoded.email, 
            name: decoded.name 
        });
        const user = response.data;
        
        if (user && user.id) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          navigate('/'); // Redirect to Home Page after Google Login
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

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={handleQuickLoginAdmin}
            className="btn-elite"
            style={{ fontSize: '0.75rem', padding: '0.8rem 2rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}
            disabled={loading}
          >
            {loading ? 'SWITCHING...' : 'SWITCH TO ADMIN'}
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
