import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function ApprovedLibrary() {
  const [grouped, setGrouped] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    API.get('/materials/approved').then(res => {
      setGrouped(res.data.grouped);
      setTotal(res.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const solutionKeys = Object.keys(grouped);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">✅ Approved Material Library</h1>
        <p className="page-subtitle">{total} approved materials grouped by BAS solution</p>
      </div>

      {/* Solution tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}>
          All ({total})
        </button>
        {solutionKeys.map(key => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-outline'}`}>
            {grouped[key].solution?.icon} {key} ({grouped[key].materials.length})
          </button>
        ))}
      </div>

      {solutionKeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <p style={{ fontSize: 48 }}>📭</p>
          <p>No approved materials yet.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Materials get here after the marketing team approves them.</p>
        </div>
      ) : (
        (activeTab === 'all' ? solutionKeys : solutionKeys.filter(k => k === activeTab)).map(key => {
          const { solution, materials } = grouped[key];
          return (
            <div key={key} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: solution?.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>
                  {solution?.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{key}</h2>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>{materials.length} approved materials</p>
                </div>
              </div>

              <div className="grid grid-3">
                {materials.map(mat => (
                  <Link key={mat._id} to={`/material/${mat._id}`} style={{ textDecoration: 'none' }}>
                    <div className="card material-card">
                      <div className="material-thumbnail" style={{ height: 140 }}>
                        {mat.files?.[0]?.mimetype?.startsWith('image') ? (
                          <img src={mat.files[0].path} alt={mat.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 40 }}>{solution?.icon || '📄'}</span>
                        )}
                      </div>
                      <div className="material-card-body">
                        <div className="material-title" style={{ fontSize: 14 }}>{mat.title}</div>
                        <div className="material-meta">
                          <span>{mat.type?.replace('_', ' ')}</span>
                          <span>💬 {mat.feedbackSummary?.total || 0}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {mat.files?.map((f, i) => (
                            <a key={i} href={f.path} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: 12, color: '#5b21b6', marginRight: 8 }}>
                              ⬇️ Download
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
