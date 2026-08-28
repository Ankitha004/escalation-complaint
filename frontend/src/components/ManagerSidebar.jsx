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
        { id: 'settings', label: 'Settings', path: '/manager-settings', icon: Settings },
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
    <aside style={{ width: '250px', background: '#FFFFFF', color: '#0F172A', padding: '1.5rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, minHeight: '100vh', borderRight: '1px solid #E2E8F0' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.25rem', padding: '0 0.25rem' }}>
          <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0F172A', lineHeight: '1.2', fontFamily: "'Outfit', sans-serif" }}>DEPT. MANAGER</div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: '500', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{departmentName || 'Department Operations'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 1rem', marginBottom: '0.15rem' }}>
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
                      background: isActive ? '#F1F5F9' : 'transparent',
                      color: isActive ? '#F59E0B' : '#475569',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={17} style={{ color: isActive ? '#F59E0B' : '#64748B' }} /> {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0 0.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.82rem' }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Department Manager'}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'manager@company.com'}</div>
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
            background: '#F8FAFC', 
            color: '#475569', 
            border: '1px solid #E2E8F0', 
            borderRadius: '10px', 
            fontSize: '0.82rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
