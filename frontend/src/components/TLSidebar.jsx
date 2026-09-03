import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Home,
  FileSearch,
  List,
  TrendingUp,
  BarChart2,
  Users,
  LineChart,
  Calendar,
  CalendarDays,
  Bell,
  Megaphone,
  User,
  LogOut
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
        { id: 'leaves', label: 'Leave Requests', path: '/tl-leaves', icon: Calendar },
        { id: 'tl-leave-calendar', label: 'Leave Calendar', path: '/tl-leave-calendar', icon: CalendarDays }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, badge: 8 },
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
      width: '260px', 
      background: '#020617', 
      color: '#94A3B8', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0, 
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
        
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} style={{ marginBottom: '1.25rem' }}>
            <div style={{ 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              color: '#64748B', 
              letterSpacing: '0.05em', 
              marginBottom: '0.5rem',
              paddingLeft: '0.5rem'
            }}>
              {group.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#2563EB' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#CBD5E1',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#0F172A';
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
                    {item.badge && (
                      <span style={{ 
                        background: '#EF4444', 
                        color: '#FFF', 
                        fontSize: '0.65rem', 
                        fontWeight: '800', 
                        width: '18px', 
                        height: '18px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '50%'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '1.25rem', borderTop: '1px solid #1E293B' }}>
        <button 
          onClick={handleLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            width: '100%', 
            padding: '0.65rem 1rem', 
            background: 'transparent', 
            color: '#94A3B8', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0F172A';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94A3B8';
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default TLSidebar;
