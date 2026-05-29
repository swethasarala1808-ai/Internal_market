import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'internal', phone: '', department: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      login(res.data.user, res.data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 36, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>BAS <span style={{ color: '#5b21b6' }}>Portal</span></h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@bizaxl.com" />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">I am a... *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'marketing', label: '📢 Marketing Team', desc: 'Upload & manage materials' },
                { value: 'internal', label: '👤 Internal Staff', desc: 'View & give feedback' }
              ].map(r => (
                <div key={r.value} onClick={() => setForm({...form, role: r.value})}
                  style={{ border: `2px solid ${form.role === r.value ? '#5b21b6' : '#e5e7eb'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', background: form.role === r.value ? '#f5f3ff' : 'white', transition: 'all 0.2s' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: form.role === r.value ? '#5b21b6' : '#374151' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Sales, HR" />
            </div>
            <div>
              <label className="form-label">Phone (WhatsApp)</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91XXXXXXXXXX" />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: loading ? '#9ca3af' : '#5b21b6', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#5b21b6', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
          Admin & Director accounts are created by admin only.
        </p>
      </div>
    </div>
  );
}
