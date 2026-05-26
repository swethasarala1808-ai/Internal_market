import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{label}</div>
        </div>
      </div>
    </div>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    API.get('/materials?limit=6').then(res => {
      const mats = res.data.materials;
      setRecent(mats);
      setStats({
        total: res.data.total,
        approved: mats.filter(m => m.isApproved).length,
        pending: mats.filter(m => m.status === 'pending_review').length
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👋 Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">BAS Internal Marketing Portal</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <StatCard label="Total Materials" value={stats.total} icon="📁" color="#00C851" to="/materials" />
        <StatCard label="Approved Library" value={stats.approved} icon="✅" color="#059669" to="/library" />
        <StatCard label="Pending Review" value={stats.pending} icon="⏳" color="#f59e0b" to="/materials?status=pending_review" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700, fontSize: 15 }}>
            🆕 Recent Uploads
          </div>
          <div style={{ padding: 16 }}>
            {recent.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No materials yet</p>
            ) : (
              recent.slice(0, 5).map(m => (
                <Link key={m._id} to={`/material/${m._id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid #f3f4f6', textDecoration: 'none'
                }}>
                  <span style={{ fontSize: 24 }}>{m.solution?.icon || '📄'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e1b4b' }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {m.solution?.name} • {m.type.replace('_', ' ')}
                    </div>
                  </div>
                  <span className={`badge badge-${m.isApproved ? 'green' : 'yellow'}`} style={{ marginLeft: 'auto' }}>
                    {m.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </Link>
              ))
            )}
            <Link to="/materials" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#00C851', fontWeight: 600, fontSize: 14 }}>
              View All →
            </Link>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4f0', fontWeight: 700, fontSize: 15 }}>
            🚀 Quick Actions
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {user?.role === 'marketing' && (
              <Link to="/upload" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                📤 Upload New Material
              </Link>
            )}
            <Link to="/materials" className="btn btn-outline" style={{ justifyContent: 'center' }}>
              📋 Browse & Give Feedback
            </Link>
            <Link to="/library" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              ✅ Approved Library
            </Link>
            <Link to="/profile" className="btn btn-outline" style={{ justifyContent: 'center' }}>
              ⚙️ Notification Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
