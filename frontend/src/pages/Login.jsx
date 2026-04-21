import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.user.post('/login', formData);
            if (response.data) {
                localStorage.setItem('currentUser', JSON.stringify(response.data));
                navigate(response.data.role === 'ADMIN' ? '/admin' : '/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials or service offline');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome Back</h2>
                
                {error && <div className="error-text" style={{ marginBottom: '1.5rem', padding: '0.8rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>OFFICIAL EMAIL</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="name@university.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>PASSWORD</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>Forgot?</Link>
                        </div>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                    
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        New to TechFest? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Create Account</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
