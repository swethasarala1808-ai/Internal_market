import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, feedback: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    API.get('/materials?limit=5').then(r => {
      const mats = r.data.materials || [];
      setRecent(mats);
      setStats({
        total: r.data.total || mats.length,
        approved: mats.filter(m => m.isApproved).length,
        pending: mats.filter(m => m.status === 'pending_review').length,
        feedback: 0
      });
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Materials', value: stats.total, icon: '📁', color: '#1a1a2e', to: '/materials' },
    { label: 'Approved', value: stats.approved, icon: '✅', color: '#00C851', to: '/library' },
    { label: 'Pending Review', value: stats.pending, icon: '⏳', color: '#f59e0b', to: '/materials' },
  ];

  const statusColor = (s) => ({
    approved: '#00C851', pending_review: '#f59e0b', rejected: '#ef4444', revision_needed: '#f97316'
  }[s] || '#6b7280');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e' }}>
          👋 Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>BAS Internal Marketing Portal</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: 12, padding: '20px 24px',
              border: '1px solid #e5e7eb', borderLeft: `4px solid ${s.color}`,
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'box-shadow 0.2s', cursor: 'pointer'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: s.color + '15', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Recent Uploads */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>📋 Recent Uploads</h3>
            <Link to="/materials" style={{ color: '#00C851', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No materials yet</div>
          ) : recent.map((m, i) => (
            <Link key={i} to={`/material/${m._id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {m.solution?.name} • {m.type}
                  </div>
                </div>
                <span style={{
                  background: statusColor(m.status) + '20',
                  color: statusColor(m.status),
                  padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, textTransform: 'capitalize'
                }}>
                  {m.status?.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🚀 Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user?.role === 'marketing' && (
              <Link to="/upload" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#1a1a2e', color: 'white', padding: '13px 16px',
                  borderRadius: 10, fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>📤 Upload New Material</div>
              </Link>
            )}
            <Link to="/materials" style={{ textDecoration: 'none' }}>
              <div style={{
                border: '1.5px solid #e5e7eb', color: '#374151', padding: '13px 16px',
                borderRadius: 10, fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8
              }}>📝 Browse & Give Feedback</div>
            </Link>
            <Link to="/library" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#00C85115', border: '1.5px solid #00C851',
                color: '#007E33', padding: '13px 16px',
                borderRadius: 10, fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8
              }}>✅ Approved Library</div>
            </Link>
            {user?.role === 'marketing' && (
              <Link to="/staff" style={{ textDecoration: 'none' }}>
                <div style={{
                  border: '1.5px solid #e5e7eb', color: '#374151', padding: '13px 16px',
                  borderRadius: 10, fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>👥 View Internal Staff</div>
              </Link>
            )}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                border: '1.5px solid #e5e7eb', color: '#374151', padding: '13px 16px',
                borderRadius: 10, fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8
              }}>⚙️ Notification Settings</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
