import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

const TYPE_LABELS = {
  poster: '🖼️ Poster', advertisement: '📢 Advertisement', content: '📝 Content',
  video: '🎬 Video', brochure: '📄 Brochure', social_media: '📱 Social Media', other: '📦 Other'
};

export default function MaterialList() {
  const [materials, setMaterials] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    solution: searchParams.get('solution') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1')
  };

  useEffect(() => {
    API.get('/solutions').then(r => setSolutions(r.data.solutions)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters);
    API.get(`/materials?${params}`).then(res => {
      setMaterials(res.data.materials);
      setTotal(res.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, [searchParams]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📁 All Materials</h1>
          <p className="page-subtitle">{total} materials found</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-control" placeholder="🔍 Search..." style={{ maxWidth: 220 }}
          value={filters.search} onChange={e => setFilter('search', e.target.value)} />

        <select className="form-control" style={{ maxWidth: 180 }} value={filters.solution}
          onChange={e => setFilter('solution', e.target.value)}>
          <option value="">All Solutions</option>
          {solutions.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>

        <select className="form-control" style={{ maxWidth: 180 }} value={filters.type}
          onChange={e => setFilter('type', e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select className="form-control" style={{ maxWidth: 180 }} value={filters.status}
          onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revision_needed">Needs Revision</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p>No materials found</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {materials.map(mat => (
            <Link key={mat._id} to={`/material/${mat._id}`} style={{ textDecoration: 'none' }}>
              <div className="card material-card">
                <div className="material-thumbnail">
                  {mat.files?.[0]?.mimetype?.startsWith('image') ? (
                    <img src={mat.files[0].path} alt={mat.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 56 }}>{mat.solution?.icon || '📄'}</span>
                  )}
                </div>
                <div className="material-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="material-title">{mat.title}</div>
                    <span className={`badge badge-${mat.isApproved ? 'green' : mat.status === 'rejected' ? 'red' : 'yellow'}`}>
                      {mat.isApproved ? '✅ Approved' : mat.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="material-meta">
                    <span>{mat.solution?.icon} {mat.solution?.name}</span>
                    <span>{TYPE_LABELS[mat.type]}</span>
                    <span>💬 {mat.feedbackSummary?.total || 0} feedbacks</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
