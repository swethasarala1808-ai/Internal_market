import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DirectorView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewingId, setReviewingId] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!['admin', 'director'].includes(user?.role)) { navigate('/dashboard'); return; }
    fetchQueue();
  }, [user, navigate]);

  const fetchQueue = () => {
    setLoading(true);
    API.get('/materials/director-queue').then(r => setMaterials(r.data.materials || [])).finally(() => setLoading(false));
  };

  const handleReview = async (id, decision) => {
    try {
      await API.post(`/materials/${id}/director-review`, { decision, note });
      toast.success(`Material ${decision}!`);
      setReviewingId(null);
      setNote('');
      fetchQueue();
    } catch { toast.error('Failed'); }
  };

  const statusColor = { pending: '#f59e0b', approved: '#00C851', rejected: '#ef4444' };
  const filtered = filter === 'all' ? materials : materials.filter(m => m.directorStatus === filter);
  const counts = { all: materials.length, pending: materials.filter(m => m.directorStatus === 'pending').length, approved: materials.filter(m => m.directorStatus === 'approved').length, rejected: materials.filter(m => m.directorStatus === 'rejected').length };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>👔 Director Approval Queue</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Review and approve marketing materials</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Sent', value: counts.all, color: '#6b7280' },
          { label: 'Pending Review', value: counts.pending, color: '#f59e0b' },
          { label: 'Approved', value: counts.approved, color: '#00C851' },
          { label: 'Rejected', value: counts.rejected, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}30`, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            background: filter === f ? 'var(--primary)' : 'white',
            color: filter === f ? 'white' : 'var(--text)',
            border: filter === f ? 'none' : '1.5px solid var(--border)'
          }}>{f} ({counts[f] || 0})</button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-muted)' }}>No materials in this category</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((m, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '16px 20px', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{m.title}</h3>
                      <span style={{ background: statusColor[m.directorStatus] + '20', color: statusColor[m.directorStatus], padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                        {m.directorStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                      <span>📁 {m.type}</span>
                      <span>🏷️ {m.solution?.name}</span>
                      <span>👤 By: {m.uploadedBy?.name}</span>
                      <span>📅 {new Date(m.sentToDirectorAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {m.directorNote && (
                      <div style={{ marginTop: 8, background: '#f9fafb', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                        💬 Note: {m.directorNote}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link to={`/material/${m._id}`} className="btn btn-outline btn-sm">👁️ View</Link>
                    {m.directorStatus === 'pending' && (
                      <button onClick={() => setReviewingId(reviewingId === m._id ? null : m._id)}
                        className="btn btn-primary btn-sm" style={{ background: '#1a1a2e' }}>
                        📋 Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Panel */}
                {reviewingId === m._id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: '#f9fafb' }}>
                    <label className="form-label">Note (Optional)</label>
                    <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Add any notes or feedback..." style={{ marginBottom: 12 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleReview(m._id, 'approved')}
                        style={{ flex: 1, padding: '10px', background: '#00C851', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => handleReview(m._id, 'rejected')}
                        style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        ❌ Reject
                      </button>
                      <button onClick={() => setReviewingId(null)}
                        style={{ padding: '10px 20px', background: 'white', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
