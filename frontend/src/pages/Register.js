import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'internal', department: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', form);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🎯 BAS Portal</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" type="text" placeholder="John Doe"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="internal">Internal Staff</option>
                <option value="marketing">Marketing Team</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" type="text" placeholder="e.g. Sales"
                value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone (for WhatsApp, optional)</label>
            <input className="form-control" type="text" placeholder="+91XXXXXXXXXX"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: '#5b21b6', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
