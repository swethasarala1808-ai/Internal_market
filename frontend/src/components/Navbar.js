import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navStyle = {
    background: '#1a1a2e',
    color: 'white',
    padding: '0 20px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
  };

  const linkStyle = (active) => ({
    color: active ? '#00C851' : '#c8d0e0',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    background: active ? 'rgba(0,200,81,0.12)' : 'transparent',
    transition: 'all 0.2s'
  });

  return (
    <nav style={navStyle}>
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🎯</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: 'white' }}>
          BAS <span style={{ color: '#00C851' }}>Portal</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link to="/dashboard" style={linkStyle(isActive('/dashboard'))}>Dashboard</Link>
        <Link to="/materials" style={linkStyle(isActive('/materials'))}>Materials</Link>
        <Link to="/library" style={linkStyle(isActive('/library'))}>✅ Library</Link>
        {['admin', 'marketing'].includes(user?.role) && (
          <Link to="/upload" style={linkStyle(isActive('/upload'))}>+ Upload</Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/staff" style={linkStyle(isActive('/staff'))}>👥 Staff</Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/solutions" style={linkStyle(isActive('/solutions'))}>Solutions</Link>
        )}
        {['admin', 'director'].includes(user?.role) && (
          <Link to="/director" style={linkStyle(isActive('/director'))}>👔 Approvals</Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" style={{...linkStyle(isActive('/admin')), background: isActive('/admin') ? '#dc262620' : 'transparent', color: isActive('/admin') ? '#dc2626' : '#c8d0e0'}}>🔑 Admin</Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, background: '#00C851',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: '#c8d0e0', fontSize: 13 }}>{user?.name?.split(' ')[0]}</span>
        </Link>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', padding: '5px 12px', borderRadius: 6,
          cursor: 'pointer', fontSize: 13
        }}>Logout</button>
      </div>
    </nav>
  );
}
