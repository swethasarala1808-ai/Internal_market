import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StaffList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'marketing') { navigate('/dashboard'); return; }
    API.get('/users/staff-list').then(r => setStaff(r.data.staff || [])).finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>👥 Internal Staff</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>{staff.length} registered team members</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 Search by name, email or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
            borderRadius: 8, fontSize: 14, outline: 'none'
          }}
        />
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr',
          padding: '12px 20px', background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb', fontSize: 12,
          fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5
        }}>
          <div>Name</div><div>Email</div><div>Department</div><div>Phone</div><div>Status</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No staff found</div>
        ) : filtered.map((s, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr',
            padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
            alignItems: 'center', fontSize: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#1a1a2e', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0
              }}>{s.name.charAt(0).toUpperCase()}</div>
              <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{s.name}</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{s.email}</div>
            <div style={{ color: '#374151' }}>{s.department || '—'}</div>
            <div style={{ color: '#374151' }}>{s.phone || '—'}</div>
            <div>
              <span style={{
                background: s.isActive ? '#00C85120' : '#fee2e2',
                color: s.isActive ? '#007E33' : '#991b1b',
                padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700
              }}>{s.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
