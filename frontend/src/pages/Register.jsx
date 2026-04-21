import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER', department: '', collegeName: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Updated to hit /api/users/register explicitly
            await api.user.post('/register', formData);
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (err) {
            setError(err.response?.data || 'Registration failed. Service might be offline.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
                <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Registry.</h2>
                
                {error && <div className="error-text" style={{ marginBottom: '1.5rem', padding: '0.8rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>FULL NAME</label>
                            <input type="text" className="form-control" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>ACCOUNT TYPE</label>
                            <select className="form-control" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                <option value="USER" style={{background: '#0f172a'}}>Student Participant</option>
                                <option value="ADMIN" style={{background: '#0f172a'}}>Fest Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>OFFICIAL EMAIL</label>
                        <input type="email" className="form-control" placeholder="name@university.edu" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>

                    {formData.role !== 'ADMIN' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>DEPARTMENT</label>
                                <input type="text" className="form-control" placeholder="CSE / IT" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>COLLEGE</label>
                                <input type="text" className="form-control" placeholder="University Name" value={formData.collegeName} onChange={(e) => setFormData({...formData, collegeName: e.target.value})} required />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>SECURE PASSWORD</label>
                        <input type="password" className="form-control" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                    
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        Already registered? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
