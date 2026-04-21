import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER', department: '', college: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/api/users/register', formData);
      // Auto login after register
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      if (response.data.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      if (err.response?.data === "Email is already registered") {
        setError("Email already exists, please login instead.");
      } else {
        setError(err.response?.data || 'Registration failed');
      }
    }
  };

  return (
    <div className="app-container page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center' }}>Registration</h2>
        
        {error && <div className="error-text" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required className="form-control" onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>

          {formData.role === 'USER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" placeholder="e.g. CSE" className="form-control" onChange={(e) => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>College Name</label>
                  <input type="text" placeholder="e.g. Vel Tech" className="form-control" onChange={(e) => setFormData({...formData, college: e.target.value})} />
                </div>
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required className="form-control" onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required className="form-control" onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Account Type</label>
            <select className="form-control" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="USER">Participant</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Create Account</button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
