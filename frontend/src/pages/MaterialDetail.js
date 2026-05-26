import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RATINGS = [
  { value: 'excellent', emoji: '🌟', label: 'Excellent' },
  { value: 'good', emoji: '👍', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'needs_improvement', emoji: '⚠️', label: 'Needs Work' },
  { value: 'bad', emoji: '👎', label: 'Bad' }
];

const RATING_COLORS = { excellent: '#059669', good: '#2563eb', okay: '#f59e0b', needs_improvement: '#ea580c', bad: '#dc2626' };

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [myFeedback, setMyFeedback] = useState(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/materials/${id}`),
      API.get(`/feedback/material/${id}`),
      API.get(`/feedback/my/${id}`)
    ]).then(([mRes, fRes, myRes]) => {
      setMaterial(mRes.data.material);
      setFeedbacks(fRes.data.feedbacks);
      setMyFeedback(myRes.data.feedback);
    }).catch(() => navigate('/materials')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleFeedbackSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const res = await API.post('/feedback', { materialId: id, rating, comment, suggestion });
      setMyFeedback(res.data.feedback);
      setFeedbacks(prev => [res.data.feedback, ...prev]);
      setMaterial(prev => ({
        ...prev,
        feedbackSummary: {
          ...prev.feedbackSummary,
          [rating]: (prev.feedbackSummary[rating] || 0) + 1,
          total: (prev.feedbackSummary.total || 0) + 1
        }
      }));
      toast.success('Feedback submitted! 🎉');
      setRating(''); setComment(''); setSuggestion('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await API.patch(`/materials/${id}/approve`);
      setMaterial(res.data.material);
      toast.success('Material approved and added to library!');
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await API.patch(`/materials/${id}/status`, { status });
      setMaterial(res.data.material);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!material) return null;

  const totalFeedback = material.feedbackSummary?.total || 0;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Material Info */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            {/* Preview */}
            <div style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', minHeight: 220,
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {material.files?.[0]?.mimetype?.startsWith('image') ? (
                <img src={material.files[0].path} alt={material.title}
                  style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 72 }}>{material.solution?.icon || '📄'}</span>
              )}
              <span className={`badge badge-${material.isApproved ? 'green' : 'yellow'}`}
                style={{ position: 'absolute', top: 12, right: 12 }}>
                {material.isApproved ? '✅ Approved' : material.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="card-body">
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{material.title}</h2>
              {material.description && <p style={{ color: '#6b7280', marginBottom: 12 }}>{material.description}</p>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span className="badge badge-purple">{material.solution?.icon} {material.solution?.name}</span>
                <span className="badge badge-gray">{material.type?.replace('_', ' ')}</span>
              </div>

              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                <div>📤 Uploaded by: <strong>{material.uploadedBy?.name}</strong></div>
                <div>📅 {new Date(material.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
              </div>

              {/* Files */}
              {material.files?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>📎 Files:</div>
                  {material.files.map((f, i) => {
                    const isCloudinary = f.path && (f.path.startsWith('http') || f.path.startsWith('data:'));
                    const fileUrl = isCloudinary ? f.path : `https://internal-market.onrender.com${f.path}`;
                    return (
                      <a key={i} href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"
                        style={{ marginRight: 8, marginBottom: 8 }}
                        onClick={e => { if (!isCloudinary) { e.preventDefault(); alert('This file was uploaded before cloud storage was set up. Please re-upload the file.'); } }}>
                        ⬇️ {f.originalName}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Marketing team actions */}
          {user?.role === 'marketing' && (
            <div className="card">
              <div className="card-body">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>🔧 Marketing Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!material.isApproved && (
                    <button className="btn btn-secondary btn-sm" onClick={handleApprove}>✅ Approve</button>
                  )}
                  <button className="btn btn-sm" style={{ background: '#fef3c7', color: '#92400e' }}
                    onClick={() => handleStatusChange('revision_needed')}>
                    ✏️ Needs Revision
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('rejected')}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Feedback */}
        <div>
          {/* Feedback Stats */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
              📊 Feedback Summary ({totalFeedback} responses)
            </div>
            <div className="card-body">
              {RATINGS.map(r => {
                const count = material.feedbackSummary?.[r.value] || 0;
                const pct = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
                return (
                  <div key={r.value} className="feedback-bar">
                    <div className="feedback-bar-label">
                      <span>{r.emoji} {r.label}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="feedback-bar-track">
                      <div className="feedback-bar-fill" style={{ width: `${pct}%`, background: RATING_COLORS[r.value] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Form */}
          {!myFeedback ? (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
                💬 Your Feedback
              </div>
              <div className="card-body">
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>How would you rate this material?</div>
                <div className="rating-group">
                  {RATINGS.map(r => (
                    <button key={r.value} className={`rating-btn ${rating === r.value ? 'selected' : ''}`}
                      onClick={() => setRating(r.value)}>
                      <span className="emoji">{r.emoji}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Comment (Optional)</label>
                  <textarea className="form-control" rows={2} placeholder="What do you think about this material?"
                    value={comment} onChange={e => setComment(e.target.value)} maxLength={500} />
                </div>
                <div className="form-group">
                  <label className="form-label">Suggestion (Optional)</label>
                  <textarea className="form-control" rows={2} placeholder="Any suggestions for improvement?"
                    value={suggestion} onChange={e => setSuggestion(e.target.value)} maxLength={500} />
                </div>
                <button className="btn btn-primary" onClick={handleFeedbackSubmit} disabled={submitting || !rating}>
                  {submitting ? 'Submitting...' : '📤 Submit Feedback'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 16, border: '2px solid #059669' }}>
              <div className="card-body">
                <div style={{ color: '#059669', fontWeight: 700, marginBottom: 8 }}>✅ You've given feedback</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {RATINGS.find(r => r.value === myFeedback.rating)?.emoji}
                  <strong>{myFeedback.rating.replace('_', ' ')}</strong>
                </div>
                {myFeedback.comment && <p style={{ marginTop: 8, color: '#6b7280', fontSize: 14 }}>"{myFeedback.comment}"</p>}
              </div>
            </div>
          )}

          {/* All Feedbacks */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700 }}>
              💬 All Feedback ({feedbacks.length})
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {feedbacks.length === 0 ? (
                <p style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>No feedback yet. Be the first!</p>
              ) : feedbacks.map(f => (
                <div key={f._id} style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{f.submittedBy?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{RATINGS.find(r => r.value === f.rating)?.emoji}</span>
                      <span style={{ fontSize: 12, color: RATING_COLORS[f.rating], fontWeight: 600 }}>
                        {f.rating.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {f.submittedBy?.department && (
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.submittedBy.department}</div>
                  )}
                  {f.comment && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>"{f.comment}"</p>}
                  {f.suggestion && <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>💡 {f.suggestion}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
