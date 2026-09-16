import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Bell, 
  LogOut,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Settings,
  CalendarDays,
  ListTodo,
  AlertTriangle,
  User
} from 'lucide-react';

const ManagerSidebar = ({ activeTab = 'dashboard' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await API.get('/manager/my-department');
        setDepartmentName(res.data?.departmentName || '');
      } catch (err) {
        console.warn('Could not fetch department name:', err);
      }
    };
    fetchDept();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'COMPLAINT MANAGEMENT',
      items: [
        { id: 'complaints', label: 'Department Complaints', path: '/manager-complaints', icon: ListTodo },
        { id: 'escalated', label: 'Escalated Complaints', path: '/manager-escalated', icon: AlertTriangle },
        { id: 'approved', label: 'Resolved Complaints', path: '/manager-resolved', icon: CheckCircle2 },
      ]
    },
    {
      title: 'TEAM MANAGEMENT',
      items: [
        { id: 'performance', label: 'TL Performance', path: '/manager-performance', icon: TrendingUp },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { id: 'sla_reports', label: 'SLA Reports', path: '/manager-sla', icon: PieChart },
      ]
    },
    {
      title: 'LEAVE MANAGEMENT',
      items: [
        { id: 'leaves', label: 'Leave Approvals', path: '/manager-leaves', icon: CalendarDays },
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Profile', path: '/profile', icon: User },
      ]
    }
  ];

  const getInitials = (name) => {
    if (!name) return 'MN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside style={{ 
      width: '260px', 
      background: 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)', 
      color: '#F8FAFC', 
      padding: '1.5rem 1.15rem 1rem 1.15rem', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0, 
      height: '100vh', 
      position: 'sticky',
      top: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.08)', 
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0 0.25rem', flexShrink: 0 }}>
        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#FFFFFF', lineHeight: '1.2', fontFamily: "'Outfit', sans-serif" }}>DEPT. MANAGER</div>
          <div style={{ fontSize: '0.65rem', color: '#93C5FD', fontWeight: '500', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{departmentName || 'Department Operations'}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingRight: '0.25rem', marginBottom: '0.5rem' }}>
        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 1rem', marginBottom: '0.15rem' }}>
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#CBD5E1',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={17} style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} /> {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0 0.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Department Manager'}</div>
            <div style={{ fontSize: '0.7rem', color: '#93C5FD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'manager@company.com'}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            width: '100%', 
            padding: '0.65rem 1rem', 
            background: 'rgba(255, 255, 255, 0.06)', 
            color: '#E2E8F0', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '10px', 
            fontSize: '0.82rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#FCA5A5';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#E2E8F0';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
