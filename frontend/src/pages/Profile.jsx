import React, { useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')));
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.put(`http://localhost:8081/api/users/${user.id}`, user);
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        setMsg('Profile Updated Successfully! ✨');
        setTimeout(() => setMsg(''), 3000);
    } catch (err) {
        setMsg('Update failed. Check connection.');
    }
  };

  if (!user) return <div className="app-container">Please login.</div>;

  return (
    <div className="app-container page-transition" style={{ maxWidth: '600px' }}>
      <h2 className="gradient-text">Member Profile</h2>
      <div className="glass-panel">
        {msg && <div style={{ color: 'var(--success)', marginBottom: '1rem', fontWeight: 'bold' }}>{msg}</div>}
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
                type="text" 
                className="form-control" 
                value={user.name} 
                onChange={(e) => setUser({...user, name: e.target.value})} 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Academic Department</label>
                <input 
                    type="text" 
                    className="form-control" 
                    value={user.department} 
                    onChange={(e) => setUser({...user, department: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>College Name</label>
                <input 
                    type="text" 
                    className="form-control" 
                    value={user.college} 
                    onChange={(e) => setUser({...user, college: e.target.value})} 
                />
              </div>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--glass-border)', marginTop: '2rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Tier Status</div>
              <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.2rem' }}>ELITE FEST PASS MEMBER</div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
