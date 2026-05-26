import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    notifyEmail: user?.notifyEmail ?? true,
    notifyWhatsapp: user?.notifyWhatsapp ?? false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await API.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );

  return (
    <div className="page-container" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Profile & Settings</h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
          👤 Your Profile
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 24, fontWeight: 800
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ color: '#9ca3af', fontSize: 13 }}>{user?.email}</div>
              <span className={`badge ${user?.role === 'marketing' ? 'badge-purple' : 'badge-green'}`}>
                {user?.role === 'marketing' ? '🎯 Marketing Team' : '👥 Internal Staff'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-control" placeholder="e.g. Sales, Support, HR"
              value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (for WhatsApp notifications)</label>
            <input className="form-control" placeholder="+91XXXXXXXXXX"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Format: +91XXXXXXXXXX</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
          🔔 Notification Preferences
        </div>
        <div className="card-body">
          <div className="toggle-row">
            <div>
              <div style={{ fontWeight: 600 }}>📧 Email Notifications</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Get notified when new materials are uploaded</div>
            </div>
            <Toggle checked={form.notifyEmail} onChange={v => setForm({...form, notifyEmail: v})} />
          </div>
          <div className="toggle-row" style={{ borderBottom: 'none' }}>
            <div>
              <div style={{ fontWeight: 600 }}>📱 WhatsApp Notifications</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                Requires phone number above (via Twilio)
              </div>
            </div>
            <Toggle checked={form.notifyWhatsapp} onChange={v => setForm({...form, notifyWhatsapp: v})} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : '💾 Save Changes'}
      </button>
    </div>
  );
}
