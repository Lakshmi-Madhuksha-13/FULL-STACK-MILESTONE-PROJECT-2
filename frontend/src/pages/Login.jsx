import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setError(location.state.message);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.user.post('/login', formData);
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            
            // Success Feedback
            setLoading(false);
            if (response.data.role === 'ADMIN') navigate('/admin');
            else navigate('/dashboard');
            
        } catch (err) {
            setLoading(false);
            setError(err.response?.status === 404 ? 'User not found in registry.' : 
                  err.response?.status === 401 ? 'Incorrect access key (password).' : 
                  'System Offline: Communication Error with User Service.');
        }
    };

    return (
        <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', perspective: '1000px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3.5rem', position: 'relative', transform: 'rotateX(2deg)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px var(--primary-bright)' }}>
                
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.4 }}></div>
                <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '60px', height: '60px', background: 'var(--accent)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome.</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', letterSpacing: '1px' }}>ENTER THE TECHNICAL MULTIVERSE</p>
                </div>

                {error && (
                    <div style={{ padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', borderLeft: '3px solid var(--accent)', color: 'var(--accent)', marginBottom: '2rem', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '2px' }}>OFFICIAL EMAIL</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="name@university.edu" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required 
                            style={{ background: 'rgba(255,255,255,0.03)', height: '3.5rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '2px' }}>PASSKEY</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', opacity: 0.8 }}>Forgot?</Link>
                        </div>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="••••••••" 
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required 
                            style={{ background: 'rgba(255,255,255,0.03)', height: '3.5rem' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '2.5rem', height: '3.5rem', fontSize: '1rem', fontWeight: 'bold' }}>
                        {loading ? 'Decrypting Access...' : 'Secure Access Login'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            New participant? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Create Account</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
