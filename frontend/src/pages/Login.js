import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1a1a2e',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e' }}>
            BAS <span style={{ color: '#00C851' }}>Portal</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Internal Marketing Feedback Platform
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Email
            </label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@bizaxl.com"
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #e5e7eb', borderRadius: 8,
                fontSize: 14, outline: 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Password
            </label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #e5e7eb', borderRadius: 8,
                fontSize: 14, outline: 'none'
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px',
            background: loading ? '#9ca3af' : '#00C851',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#00C851', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
