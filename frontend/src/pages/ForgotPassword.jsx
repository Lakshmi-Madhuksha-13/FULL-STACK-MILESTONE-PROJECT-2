import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: New Password
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setMsg('Searching secure records...');
    setTimeout(() => {
        setStep(2);
        setMsg('');
    }, 1500);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
        // hits /api/users/reset-password
        await api.user.post('/reset-password', { email, newPassword });
        setMsg('Password Reset Successfully! ✅');
        setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
        setMsg('Error: Account not found or service unavailable.');
    }
  };

  return (
    <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Reset Access</h2>
        
        {msg && <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center', fontWeight: 'bold' }}>{msg}</div>}

        {step === 1 ? (
            <form onSubmit={handleVerifyEmail}>
                <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter your registered email to start the recovery process.</p>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>REGISTRATION EMAIL</label>
                    <input type="email" required className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@college.edu"/>
                </div>
                <button type="submit" className="btn-primary">Verify Identity</button>
            </form>
        ) : (
            <form onSubmit={handleReset}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>NEW SECRET PASSWORD</label>
                    <input type="password" required className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters"/>
                </div>
                <button type="submit" className="btn-primary">Confirm New Password</button>
            </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/login" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.85rem' }}>&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
