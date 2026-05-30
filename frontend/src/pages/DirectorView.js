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
  const [note, setNote] = useState({});

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
      await API.post(`/materials/${id}/director-review`, { decision, note: note[id] || '' });
      toast.success(decision === 'approved' ? '✅ Material Approved!' : '❌ Material Rejected!');
      fetchQueue();
    } catch { toast.error('Failed'); }
  };

  const statusColor = { pending: '#f59e0b', approved: '#00C851', rejected: '#ef4444' };
  const filtered = filter === 'all' ? materials : materials.filter(m => m.directorStatus === filter);
  const counts = {
    all: materials.length,
    pending: materials.filter(m => m.directorStatus === 'pending').length,
    approved: materials.filter(m => m.directorStatus === 'approved').length,
    rejected: materials.filter(m => m.directorStatus === 'rejected').length
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>👔 Director Approval Queue</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Review and approve marketing materials sent to you</p>
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
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            background: filter === f ? 'var(--primary)' : 'white',
            color: filter === f ? 'white' : 'var(--text)',
            boxShadow: filter === f ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
          }}>{f} ({counts[f] || 0})</button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {filter === 'pending' ? 'No materials pending review' : `No ${filter} materials`}
            </h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((m, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: `1px solid ${m.directorStatus === 'pending' ? '#fcd34d' : 'var(--border)'}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                
                {/* Material Info */}
                <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{m.title}</h3>
                      <span style={{ background: statusColor[m.directorStatus] + '20', color: statusColor[m.directorStatus], padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                        {m.directorStatus === 'pending' ? '⏳ Pending Review' : m.directorStatus === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>📁 {m.type?.replace('_', ' ')}</span>
                      <span>🏷️ {m.solution?.name}</span>
                      <span>👤 {m.uploadedBy?.name}</span>
                      <span>📤 Sent by: {m.sentToDirectorBy?.name || 'Admin'}</span>
                      <span>📅 {new Date(m.sentToDirectorAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {m.directorNote && (
                      <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#065f46', border: '1px solid #bbf7d0' }}>
                        💬 Your note: {m.directorNote}
                      </div>
                    )}
                  </div>
                  <Link to={`/material/${m._id}`} style={{ marginLeft: 16, flexShrink: 0 }}>
                    <button style={{ background: '#f5f3ff', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      👁️ View Material
                    </button>
                  </Link>
                </div>

                {/* Approve/Reject - always visible for pending */}
                {m.directorStatus === 'pending' && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: '#fffbeb' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 10 }}>📋 Your Decision Required:</p>
                    <textarea
                      placeholder="Add a note (optional)..."
                      value={note[m._id] || ''}
                      onChange={e => setNote({ ...note, [m._id]: e.target.value })}
                      rows={2}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleReview(m._id, 'approved')} style={{
                        flex: 1, padding: '12px', background: '#00C851', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                        fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        ✅ Approve Material
                      </button>
                      <button onClick={() => handleReview(m._id, 'rejected')} style={{
                        flex: 1, padding: '12px', background: '#ef4444', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                        fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        ❌ Reject Material
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
