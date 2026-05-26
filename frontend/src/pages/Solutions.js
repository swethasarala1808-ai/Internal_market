import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', icon: '📦', color: '#5b21b6' });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = () => {
    API.get('/solutions').then(r => setSolutions(r.data.solutions))
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/solutions', form);
      toast.success('Solution created!');
      setForm({ name: '', description: '', icon: '📦', color: '#5b21b6' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await API.post('/solutions/seed');
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this solution?')) return;
    await API.delete(`/solutions/${id}`);
    toast.success('Solution deactivated');
    load();
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">🏷️ BAS Solutions</h1>
          <p className="page-subtitle">Manage solution categories for marketing materials</p>
        </div>
        <button className="btn btn-outline" onClick={handleSeed} disabled={seeding}>
          {seeding ? 'Seeding...' : '⚡ Seed Default Solutions'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Create form */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
            ➕ Add New Solution
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" placeholder="e.g. CRM"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Icon (Emoji)</label>
                  <input className="form-control" placeholder="📦"
                    value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} maxLength={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input type="color" className="form-control" style={{ height: 42, padding: 4 }}
                    value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Optional description"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary">➕ Create Solution</button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
            📋 Active Solutions ({solutions.length})
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : solutions.length === 0 ? (
              <p style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>
                No solutions yet. Click "Seed Default Solutions" to add BAS defaults!
              </p>
            ) : solutions.map(s => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: s.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  {s.description && <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.description}</div>}
                </div>
                <button onClick={() => handleDelete(s._id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
