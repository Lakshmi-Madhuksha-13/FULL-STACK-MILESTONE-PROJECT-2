import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1=lookup, 2=reset, 3=done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.user.get('');
      const found = Array.isArray(res.data) && res.data.find(u => u.email === email);
      if (found) { setStep(2); }
      else { setError('Email not found in the registry. Check the address and try again.'); }
    } catch {
      setError('Service unavailable. Ensure your backend is running.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Security keys do not match.'); return; }
    if (newPassword.length < 6) { setError('Security key must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.user.post('/reset-password', { email, newPassword });
      setStep(3);
    } catch {
      setError('Reset failed. The service may be temporarily offline.');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '3rem' }}>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: '36px', height: '4px', borderRadius: '2px', background: step >= s ? 'var(--primary)' : 'var(--glass-border)', transition: '0.4s' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔑</div>
              <h2 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Asset Recovery</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Enter your registered email to begin the secure reset protocol.</p>
            </div>
            {error && <div style={{ padding: '0.8rem', borderLeft: '4px solid var(--accent)', background: 'rgba(244,63,94,0.05)', color: 'var(--vivid-pink)', fontSize: '0.85rem', marginBottom: '1.5rem', borderRadius: '4px' }}>{error}</div>}
            <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={lblStyle}>REGISTERED EMAIL</label>
                <input type="email" placeholder="name@university.edu" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ height: '52px' }}>
                {loading ? 'SEARCHING REGISTRY...' : 'VERIFY IDENTITY →'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
              <h2 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>New Security Key</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Identity verified for <strong style={{ color: 'var(--primary)' }}>{email}</strong>. Set your new access key.</p>
            </div>
            {error && <div style={{ padding: '0.8rem', borderLeft: '4px solid var(--accent)', background: 'rgba(244,63,94,0.05)', color: 'var(--vivid-pink)', fontSize: '0.85rem', marginBottom: '1.5rem', borderRadius: '4px' }}>{error}</div>}
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={lblStyle}>NEW SECURITY KEY</label>
                <input type="password" placeholder="Min. 6 characters" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label style={lblStyle}>CONFIRM SECURITY KEY</label>
                <input type="password" placeholder="Re-enter key" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ height: '52px' }}>
                {loading ? 'SYNCING RESET...' : 'CONFIRM NEW KEY →'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
            <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Key Synchronized!</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: 1.6 }}>Your security key has been successfully updated. You may now authorize your session.</p>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ height: '52px' }}>AUTHORIZE SESSION →</button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

const lblStyle = { display: 'block', fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px' };

export default ForgotPassword;
