import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('currentUser');
      return s && s !== 'undefined' ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [toast, setToast] = useState({ show: false, message: '', ok: true });
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const showToast = (message, ok = true) => {
    setToast({ show: true, message, ok });
    setTimeout(() => setToast({ show: false, message: '', ok: true }), 3500);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...user };
      if (newPassword.trim()) payload.password = newPassword;
      const res = await api.user.put(`/${user.id}`, payload);
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      setUser(res.data);
      setNewPassword('');
      setShowPasswordSection(false);
      showToast('Profile synchronized successfully! ✨');
    } catch {
      showToast('Update failed. Check your connection.', false);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return (
    <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}>
      <h2>Access Denied</h2>
      <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );

  return (
    <div className="app-container page-transition" style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '6rem' }}>

      {/* TOAST */}
      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: toast.ok ? 'var(--primary)' : 'var(--accent)', borderRadius: '2rem', boxShadow: '0 0 30px var(--primary-bright)', fontWeight: 900, whiteSpace: 'nowrap' }}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div style={{ textAlign: 'center', padding: '4rem 0 3rem 0' }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, margin: '0 auto 1.5rem auto', boxShadow: '0 0 30px var(--primary-bright)' }}>
          {user.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: '0 0 0.4rem 0' }}>{user.name}</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 1rem', background: user.role === 'ADMIN' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${user.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)'}`, borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900, color: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)' }}>
          {user.role === 'ADMIN' ? '🛡️ SYSTEM ADMINISTRATOR' : '🎟️ FEST PARTICIPANT'}
        </div>
      </div>

      {/* PROFILE FORM */}
      <div className="glass-panel" style={{ padding: '3rem' }}>
        <h3 style={{ marginBottom: '2rem', fontSize: '1rem', opacity: 0.5, letterSpacing: '2px', fontWeight: 900 }}>IDENTITY CONFIGURATION</h3>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={lbl}>FULL NAME</label>
            <input type="text" className="form-control" value={user.name || ''} onChange={e => setUser({ ...user, name: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>EMAIL (READ ONLY)</label>
            <input type="email" className="form-control" value={user.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div>
              <label style={lbl}>DEPARTMENT</label>
              <input type="text" className="form-control" value={user.department || ''} onChange={e => setUser({ ...user, department: e.target.value })} placeholder="e.g. CSE" />
            </div>
            <div>
              <label style={lbl}>COLLEGE</label>
              <input type="text" className="form-control" value={user.college || ''} onChange={e => setUser({ ...user, college: e.target.value })} placeholder="University Name" />
            </div>
          </div>

          {/* PASSWORD SECTION */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <button type="button" onClick={() => setShowPasswordSection(!showPasswordSection)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px', padding: 0 }}>
              {showPasswordSection ? '▼' : '▶'} CHANGE SECURITY KEY
            </button>
            {showPasswordSection && (
              <div style={{ marginTop: '1.2rem' }}>
                <label style={lbl}>NEW SECURITY KEY</label>
                <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current key" />
              </div>
            )}
          </div>

          {/* SAVE */}
          <button type="submit" className="btn-primary" disabled={saving} style={{ height: '56px', marginTop: '0.5rem' }}>
            {saving ? 'SYNCHRONIZING...' : 'SAVE PROFILE CHANGES'}
          </button>
        </form>
      </div>

      {/* QUICK LINKS */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.85rem', opacity: 0.4, letterSpacing: '2px' }}>QUICK ACCESS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: '🎟️ My Tickets', path: user.role === 'ADMIN' ? '/admin' : '/dashboard' },
            { label: '📅 Browse Events', path: '/events' },
            { label: '💬 Support Hub', path: user.role === 'ADMIN' ? '/admin' : '/dashboard' },
            { label: '🏠 Home', path: '/' },
          ].map(({ label, path }) => (
            <Link key={label} to={path} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', transition: '0.2s' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const lbl = { display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px' };

export default Profile;
