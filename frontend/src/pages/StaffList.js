import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StaffList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('internal');
  const [staff, setStaff] = useState([]);
  const [marketing, setMarketing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (user?.role !== 'marketing') { navigate('/dashboard'); return; }
    fetchAll();
  }, [user, navigate]);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      API.get('/users/staff-list'),
      API.get('/users/marketing-list')
    ]).then(([staffRes, mktRes]) => {
      setStaff(staffRes.data.staff || []);
      setMarketing(mktRes.data.marketingTeam || []);
    }).finally(() => setLoading(false));
  };

  const handleEdit = (s) => {
    setEditUser(s);
    setEditForm({ name: s.name, department: s.department || '', phone: s.phone || '', isActive: s.isActive });
  };

  const handleSave = async () => {
    try {
      await API.patch(`/users/${editUser._id}`, editForm);
      toast.success('Updated!');
      setEditUser(null);
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Remove ${s.name}? They will lose access.`)) return;
    try {
      await API.delete(`/users/${s._id}`);
      toast.success('Removed!');
      fetchAll();
    } catch { toast.error('Failed to remove'); }
  };

  const currentList = activeTab === 'internal' ? staff : marketing;
  const filtered = currentList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const UserTable = ({ list }) => (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 2.5fr 1.5fr 1.5fr 80px 100px',
        padding: '12px 20px', background: '#f5f3ff',
        borderBottom: '1px solid var(--border)',
        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5
      }}>
        <div>Name</div><div>Email</div><div>Department</div><div>Phone</div><div>Status</div><div>Actions</div>
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No members found</div>
      ) : list.map((s, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '2fr 2.5fr 1.5fr 1.5fr 80px 100px',
          padding: '13px 20px', borderBottom: '1px solid #f3f4f6',
          alignItems: 'center', fontSize: 14, background: i % 2 === 0 ? 'white' : '#fafafa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: activeTab === 'marketing' ? '#00C851' : 'var(--primary)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, flexShrink: 0
            }}>{s.name.charAt(0).toUpperCase()}</div>
            <span style={{ fontWeight: 600 }}>{s.name}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.email}</div>
          <div style={{ fontSize: 13 }}>{s.department || '—'}</div>
          <div style={{ fontSize: 13 }}>{s.phone || '—'}</div>
          <div>
            <span style={{
              background: s.isActive ? '#d1fae5' : '#fee2e2',
              color: s.isActive ? '#065f46' : '#991b1b',
              padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>{s.isActive ? 'Active' : 'Off'}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => handleEdit(s)} style={{
              background: '#ede9fe', color: 'var(--primary)', border: 'none',
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>✏️</button>
            <button onClick={() => handleDelete(s)} style={{
              background: '#fee2e2', color: '#dc2626', border: 'none',
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12
            }}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>👥 Team Members</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          {staff.length} internal staff • {marketing.length} marketing team
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'internal', label: `👤 Internal Staff (${staff.length})` },
          { key: 'marketing', label: `📢 Marketing Team (${marketing.length})` }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
            background: activeTab === tab.key ? 'var(--primary)' : 'white',
            color: activeTab === tab.key ? 'white' : 'var(--text)',
            border: activeTab === tab.key ? 'none' : '1.5px solid var(--border)'
          }}>{tab.label}</button>
        ))}
      </div>

      <input className="form-input" placeholder="🔍 Search by name, email or department..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }} />

      <UserTable list={filtered} />

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 460, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>✏️ Edit Member</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{editUser.name}</div>
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
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>💾 Save Changes</button>
              <button onClick={() => setEditUser(null)} className="btn btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
