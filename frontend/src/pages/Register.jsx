import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 🛡️ ENDPOINT FIX: Using /register to match backend UserController
            await api.user.post('/register', formData);
            
            // Auto-Login after registry
            const loginRes = await api.user.post('/login', { email: formData.email, password: formData.password });
            localStorage.setItem('currentUser', JSON.stringify(loginRes.data));
            
            if (loginRes.data.role === 'ADMIN') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data || 'Registry Conflict: Identifer already exists or system is offline.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', width: '50px', height: '50px', background: 'var(--secondary)', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 0 25px var(--vivid-pink)', color: 'white', marginBottom: '1.5rem' }}>+</div>
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Join the Fest</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Create your global Technical Identity.</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {error && <div className="error-text" style={{ padding: '0.8rem', borderLeft: '4px solid var(--vivid-pink)', background: 'rgba(244, 63, 94, 0.05)' }}>{error}</div>}
                    
                    <div className="form-group">
                        <label style={labelStyle}>FULL NAME</label>
                        <input type="text" placeholder="John Doe" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>UNIVERSITY IDENTIFIER (EMAIL)</label>
                        <input type="email" placeholder="name@university.edu" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>SECURITY KEY (PASSWORD)</label>
                        <input type="password" placeholder="••••••••" className="form-control" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>CAPABILITY ROLE</label>
                        <select className="form-control" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ cursor: 'pointer' }}>
                            <option value="USER">Standard Participant</option>
                            <option value="ADMIN">System Administrator</option>
                        </select>
                    </div>

                    <button className="btn-primary" type="submit" disabled={loading} style={{ height: '55px', marginTop: '1rem', background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
                        {loading ? 'INITIALIZING REGISTRY...' : 'CREATE IDENTITY'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Already in the System? </span>
                    <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 'bold', textDecoration: 'none' }}>Authorize Session</Link>
                </div>
            </div>
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px' };

export default Register;
