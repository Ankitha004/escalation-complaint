import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck,
  Home,
  FileSearch,
  List,
  TrendingUp,
  BarChart2,
  Users,
  LineChart,
  Calendar,
  Bell,
  Megaphone,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';

const TLSidebar = ({ activeTab = 'dashboard' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home }
      ]
    },
    {
      title: 'COMPLAINTS',
      items: [
        { id: 'complaints', label: 'Team Complaints', path: '/tl-complaints', icon: List },
        { id: 'sla', label: 'Escalated Complaints', path: '/tl-escalated-complaints', icon: TrendingUp },
        { id: 'tl-reports', label: 'Reports', path: '/tl-reports', icon: BarChart2 }
      ]
    },
    {
      title: 'TEAM MANAGEMENT',
      items: [
        { id: 'my_staff', label: 'Team Members', path: '/tl-team-members', icon: Users },
        { id: 'tl-performance', label: 'Performance', path: '/tl-performance', icon: LineChart }
      ]
    },
    {
      title: 'LEAVE MANAGEMENT',
      items: [
        { id: 'leaves', label: 'Leave Requests', path: '/tl-leaves', icon: Calendar }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
        { id: 'tl-announcements', label: 'Announcements', path: '/tl-announcements', icon: Megaphone }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'tl-profile', label: 'Profile', path: '/profile', icon: User }
      ]
    }
  ];

  return (
    <aside style={{ 
      width: '280px', 
      background: 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)', 
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#F8FAFC', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0, 
      height: '100vh',
      position: 'sticky',
      top: 0,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* BRAND HEADER */}
      <div style={{ padding: '2rem 1.5rem 1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)' 
          }}>
            <ShieldCheck size={24} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#FFFFFF' }}>Team Leader</div>
            <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>Escalation Complaint System</div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NAVIGATION */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1.5rem 1.25rem' }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: '1.25rem' }}>
            <div style={{ 
              fontSize: '0.65rem', 
              fontWeight: '800', 
              color: '#94A3B8', 
              letterSpacing: '0.08em', 
              marginBottom: '0.5rem',
              paddingLeft: '0.75rem',
              textTransform: 'uppercase'
            }}>
              {group.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isDashboardRoute = location.pathname === '/dashboard';
                const isActive = location.pathname === item.path || 
                  (isDashboardRoute && item.id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'overview')) ||
                  (item.id === 'complaints' && (['assigned', 'complaints'].includes(activeTab) || ['/tl-assigned-complaints', '/tl-all-complaints', '/tl-complaints'].includes(location.pathname))) ||
                  (activeTab === item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#CBD5E1',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#CBD5E1';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={18} style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} /> 
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: '#2563EB', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '800',
              fontSize: '0.9rem',
              boxShadow: '0 2px 6px rgba(37,99,235,0.4)'
            }}>
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                {user?.name || 'Team Leader'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: '500' }}>
                {user?.employeeId || 'TL'}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.5rem', 
            width: '100%', 
            padding: '0.6rem 1rem', 
            background: 'rgba(239, 68, 68, 0.12)', 
            color: '#FCA5A5', 
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            borderRadius: '10px', 
            fontSize: '0.85rem', 
            fontWeight: '700', 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EF4444';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#FCA5A5';
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default TLSidebar;
