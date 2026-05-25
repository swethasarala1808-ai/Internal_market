import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/materials', label: 'Materials' },
    { to: '/library', label: '✅ Library' },
    ...(user?.role === 'marketing' ? [
      { to: '/upload', label: '+ Upload' },
      { to: '/solutions', label: 'Solutions' }
    ] : [])
  ];

  return (
    <nav style={{
      background: 'linear-gradient(90deg, #4c1d95, #5b21b6)',
      color: 'white', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 16, color: 'white', marginRight: 32, whiteSpace: 'nowrap' }}>
          🎯 ERPNext Portal
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500,
              color: 'white', background: isActive(link.to) ? 'rgba(255,255,255,0.2)' : 'transparent',
              transition: 'background 0.15s'
            }}>
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/profile" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px'
          }}>
            <span style={{
              width: 28, height: 28, background: 'rgba(255,255,255,0.3)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }} className="hide-mobile">{user?.name?.split(' ')[0]}</span>
          </Link>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13
          }}>
            Logout
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
