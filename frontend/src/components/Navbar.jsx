import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, Bell, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const Navbar = ({ activeTabTitle }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await API.get('/notifications');
        const list = res.data || [];
        const unread = list.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        // silent fallback
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'Employee';

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'HR':
      case 'Super Admin':
        return 'status-chip-indigo';
      case 'Manager':
        return 'status-chip-amber';
      case 'Team Leader':
        return 'status-chip-emerald';
      case 'Staff':
      case 'Support Staff':
        return 'status-chip-rose';
      default:
        return 'status-chip-indigo';
    }
  };

  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/dashboard" className="app-brand-badge">
          <div className="app-brand-logo-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0F172A', lineHeight: 1.1 }}>
              CMS Portal
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4F46E5', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Escalation Engine
            </div>
          </div>
        </Link>

        {activeTabTitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
            <ChevronRight size={16} />
            <span style={{ fontWeight: '600', color: '#334155' }}>{activeTabTitle}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/notifications" style={{ textDecoration: 'none', position: 'relative', width: '38px', height: '38px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'all 0.2s ease' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: '800',
              padding: '1px 5px',
              borderRadius: '10px',
              border: '2px solid #FFFFFF'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="app-user-pill">
          <div className="app-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.2 }}>
              {user?.name || 'User'}
            </span>
            <span className={`status-chip ${getRoleBadgeClass()}`} style={{ padding: '0.1rem 0.45rem', fontSize: '0.68rem', width: 'fit-content' }}>
              <span className="pulse-dot pulse-dot-indigo" />
              {role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1rem',
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEE2E2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FEF2F2';
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
