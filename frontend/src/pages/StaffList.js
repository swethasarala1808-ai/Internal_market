import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StaffList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (user?.role !== 'marketing') { navigate('/dashboard'); return; }
    fetchStaff();
  }, [user, navigate]);

  const fetchStaff = () => {
    setLoading(true);
    API.get('/users/staff-list').then(r => setStaff(r.data.staff || [])).finally(() => setLoading(false));
  };

  const handleEdit = (s) => { setEditUser(s); setEditForm({ name: s.name, department: s.department || '', phone: s.phone || '', isActive: s.isActive }); };

  const handleSave = async () => {
    try {
      await API.patch(`/users/${editUser._id}`, editForm);
      toast.success('Staff updated!');
      setEditUser(null);
      fetchStaff();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name}? They will lose access.`)) return;
    try {
      await API.delete(`/users/${s._id}`);
      toast.success('Staff removed!');
      fetchStaff();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👥 Internal Staff</h1>
          <p className="page-subtitle">{staff.length} registered team members</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 Search by name, email or department..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 100px',
          padding: '12px 20px', background: '#f5f3ff',
          borderBottom: '1px solid var(--border)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: 0.5
        }}>
          <div>Name</div><div>Email</div><div>Department</div><div>Phone</div><div>Status</div><div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No staff found</div>
        ) : filtered.map((s, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 100px',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            alignItems: 'center', fontSize: 14, background: i % 2 === 0 ? 'white' : '#fafafa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0
              }}>{s.name.charAt(0).toUpperCase()}</div>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.email}</div>
            <div>{s.department || '—'}</div>
            <div>{s.phone || '—'}</div>
            <div>
              <span style={{
                background: s.isActive ? '#d1fae5' : '#fee2e2',
                color: s.isActive ? '#065f46' : '#991b1b',
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
              }}>{s.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleEdit(s)}
                style={{ background: '#ede9fe', color: 'var(--primary)', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(s)}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 16
        }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 460, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>✏️ Edit Staff Member</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{editUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="e.g. Sales, HR" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Phone (WhatsApp)</label>
              <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+91XXXXXXXXXX" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Active Account (can login)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: 15 }}>💾 Save Changes</button>
              <button onClick={() => setEditUser(null)} className="btn btn-outline" style={{ flex: 1, padding: '12px', fontSize: 15 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
