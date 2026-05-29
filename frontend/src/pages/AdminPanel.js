import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'admin', label: '🔑 Admin', color: '#dc2626' },
  { value: 'marketing', label: '📢 Marketing', color: '#7c3aed' },
  { value: 'internal', label: '👤 Internal Staff', color: '#2563eb' },
  { value: 'director', label: '👔 Director', color: '#059669' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'internal', phone: '', department: '' });
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = () => {
    setLoading(true);
    API.get('/users/all').then(r => setUsers(r.data.users || [])).finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    try {
      await API.post('/users/create', form);
      toast.success(`${form.name} created!`);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'internal', phone: '', department: '' });
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (u) => { setEditUser(u); setEditForm({ name: u.name, department: u.department || '', phone: u.phone || '', isActive: u.isActive, role: u.role }); };

  const handleSave = async () => {
    try {
      await API.patch(`/users/${editUser._id}`, editForm);
      toast.success('Updated!');
      setEditUser(null);
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try { await API.delete(`/users/${u._id}`); toast.success('Deleted!'); fetchUsers(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const filtered = users.filter(u =>
    (filterRole === 'all' || u.role === filterRole) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const roleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[2];

  const counts = ROLES.reduce((acc, r) => { acc[r.value] = users.filter(u => u.role === r.value).length; return acc; }, {});

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>🔑 Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage all users • {users.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          + Create User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: `2px solid ${r.color}20`, borderLeft: `4px solid ${r.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: r.color }}>{counts[r.value] || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <select className="form-input" style={{ width: 180 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr 80px 100px', padding: '11px 20px', background: '#f5f3ff', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <div>Name</div><div>Email</div><div>Role</div><div>Department</div><div>Phone</div><div>Status</div><div>Actions</div>
        </div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          : filtered.map((u, i) => {
            const ri = roleInfo(u.role);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr 80px 100px', padding: '13px 20px', borderBottom: '1px solid #f3f4f6', alignItems: 'center', fontSize: 13, background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ri.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{u.name.charAt(0).toUpperCase()}</div>
                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</div>
                <div><span style={{ background: ri.color + '20', color: ri.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{u.role}</span></div>
                <div>{u.department || '—'}</div>
                <div>{u.phone || '—'}</div>
                <div><span style={{ background: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#065f46' : '#991b1b', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{u.isActive ? 'Active' : 'Off'}</span></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleEdit(u)} style={{ background: '#ede9fe', color: 'var(--primary)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                  {u._id !== user._id && <button onClick={() => handleDelete(u)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12 }}>🗑️</button>}
                </div>
              </div>
            );
          })}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 500, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>+ Create New User</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" /></div>
              <div><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="user@bizaxl.com" /></div>
              <div><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 chars" /></div>
              <div><label className="form-label">Role *</label>
                <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Sales" /></div>
              <div><label className="form-label">Phone (WhatsApp)</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91XXXXXXXXXX" /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>✅ Create User</button>
              <button onClick={() => setShowCreate(false)} className="btn btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 460, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>✏️ Edit User</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700 }}>{editUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editUser.email}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label className="form-label">Name</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div><label className="form-label">Role</label>
                <select className="form-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div><label className="form-label">Department</label><input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></div>
              <div><label className="form-label">Phone</label><input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} style={{ width: 16, height: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Active Account</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>💾 Save</button>
              <button onClick={() => setEditUser(null)} className="btn btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
