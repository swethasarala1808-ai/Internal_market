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
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (!['admin', 'director'].includes(user?.role)) { navigate('/dashboard'); return; }
    fetchQueue();
  }, [user, navigate]);

  const fetchQueue = () => {
    setLoading(true);
    API.get('/materials/director-queue')
      .then(r => setMaterials(r.data.materials || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const handleDecision = async (id, decision) => {
    try {
      await API.post(`/materials/${id}/director-review`, { decision, note: notes[id] || '' });
      toast.success(decision === 'approved' ? '✅ Approved!' : decision === 'rejected' ? '❌ Rejected!' : '✏️ Revision requested!');
      fetchQueue();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const statusColor = { pending: '#f59e0b', approved: '#00C851', rejected: '#ef4444', revision_needed: '#f97316' };
  const statusLabel = { pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected', revision_needed: '✏️ Needs Revision' };
  const filtered = filter === 'all' ? materials : materials.filter(m => m.directorStatus === filter);
  const counts = {
    all: materials.length,
    pending: materials.filter(m => m.directorStatus === 'pending').length,
    approved: materials.filter(m => m.directorStatus === 'approved').length,
    rejected: materials.filter(m => m.directorStatus === 'rejected').length,
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>👔 Director Approval Queue</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Materials sent to you for approval</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: counts.all, color: '#6b7280' },
          { label: 'Pending', value: counts.pending, color: '#f59e0b' },
          { label: 'Approved', value: counts.approved, color: '#00C851' },
          { label: 'Rejected', value: counts.rejected, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} onClick={() => setFilter(i === 0 ? 'all' : ['all','pending','approved','rejected'][i])}
            style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            background: filter === f ? 'var(--primary)' : 'white',
            color: filter === f ? 'white' : 'var(--text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>{f} ({counts[f] || 0})</button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-muted)' }}>No {filter === 'all' ? '' : filter} materials</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((m) => (
              <div key={m._id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${m.directorStatus === 'pending' ? '#fcd34d' : 'var(--border)'}` }}>
                
                {/* Top info */}
                <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{m.title}</h3>
                      <span style={{ background: (statusColor[m.directorStatus] || '#6b7280') + '20', color: statusColor[m.directorStatus] || '#6b7280', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {statusLabel[m.directorStatus] || m.directorStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>📁 {m.type}</span>
                      <span>🏷️ {m.solution?.name}</span>
                      <span>👤 By: {m.uploadedBy?.name}</span>
                      <span>📅 {new Date(m.sentToDirectorAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {/* Feedback summary */}
                    {m.feedbackSummary?.total > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Feedback ({m.feedbackSummary.total}):</span>
                        {m.feedbackSummary.excellent > 0 && <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>🌟 {m.feedbackSummary.excellent}</span>}
                        {m.feedbackSummary.good > 0 && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>👍 {m.feedbackSummary.good}</span>}
                        {m.feedbackSummary.okay > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>😐 {m.feedbackSummary.okay}</span>}
                        {m.feedbackSummary.needs_work > 0 && <span style={{ background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>⚠️ {m.feedbackSummary.needs_work}</span>}
                        {m.feedbackSummary.bad > 0 && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>👎 {m.feedbackSummary.bad}</span>}
                      </div>
                    )}

                    {m.directorNote && (
                      <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#065f46', border: '1px solid #bbf7d0' }}>
                        💬 Your note: {m.directorNote}
                      </div>
                    )}
                  </div>
                  <Link to={`/material/${m._id}`}>
                    <button style={{ background: '#f5f3ff', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                      👁️ View
                    </button>
                  </Link>
                </div>

                {/* Decision area - always shown for pending */}
                {m.directorStatus === 'pending' && (
                  <div style={{ borderTop: '2px solid #fef3c7', padding: '16px 20px', background: '#fffbeb' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>⚡ Your Decision Required:</p>
                    <textarea
                      placeholder="Add suggestion or note (optional)..."
                      value={notes[m._id] || ''}
                      onChange={e => setNotes({ ...notes, [m._id]: e.target.value })}
                      rows={2}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleDecision(m._id, 'approved')} style={{
                        flex: 1, padding: '12px', background: '#00C851', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
                      }}>✅ Approve</button>
                      <button onClick={() => handleDecision(m._id, 'revision_needed')} style={{
                        flex: 1, padding: '12px', background: '#f97316', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
                      }}>✏️ Needs Revision</button>
                      <button onClick={() => handleDecision(m._id, 'rejected')} style={{
                        flex: 1, padding: '12px', background: '#ef4444', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
                      }}>❌ Reject</button>
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
