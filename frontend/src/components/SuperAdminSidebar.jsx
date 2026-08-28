import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Building2, 
  Activity,
  UserCheck,
  LogOut,
  CalendarDays,
  Users,
  DollarSign,
  ClipboardList,
  BarChart2,
  Settings,
  Bell,
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const SuperAdminSidebar = ({ activeTab = 'overview' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navButtonStyle = (isActive) => ({
    background: isActive ? '#F1F5F9' : 'transparent',
    color: isActive ? '#10B981' : '#475569',
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: isActive ? '700' : '600',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease'
  });

  return (
    <aside style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '2rem 1.5rem 1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#0F172A' }}>Super Admin</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>System Control Room</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={navButtonStyle(activeTab === 'overview' || activeTab === 'dashboard')}
          >
            <Activity size={18} style={{ color: activeTab === 'overview' || activeTab === 'dashboard' ? '#10B981' : '#64748B' }} /> Global Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/departments')} 
            style={navButtonStyle(activeTab === 'departments')}
          >
            <Building2 size={18} style={{ color: activeTab === 'departments' ? '#10B981' : '#64748B' }} /> Manage Departments
          </button>
          
          <button 
            onClick={() => navigate('/team-leaders')} 
            style={navButtonStyle(activeTab === 'team-leaders')}
          >
            <UserCheck size={18} style={{ color: activeTab === 'team-leaders' ? '#10B981' : '#64748B' }} /> Team Leaders
          </button>
          
          <button 
            onClick={() => {
              navigate('/dashboard', { state: { activeTab: 'leaves' } });
            }}
            style={navButtonStyle(activeTab === 'leaves')}
          >
            <CalendarDays size={18} style={{ color: activeTab === 'leaves' ? '#10B981' : '#64748B' }} /> Leave Approvals
          </button>
          
          <button 
            onClick={() => navigate('/pending-registrations')} 
            style={navButtonStyle(activeTab === 'pending-registrations')}
          >
            <ClipboardList size={18} style={{ color: activeTab === 'pending-registrations' ? '#10B981' : '#64748B' }} /> Pending Registrations
          </button>
          
          <button 
            onClick={() => navigate('/staff-management')} 
            style={navButtonStyle(activeTab === 'staff-management')}
          >
            <Users size={18} style={{ color: activeTab === 'staff-management' ? '#10B981' : '#64748B' }} /> Staff Management
          </button>
          
          <button 
            onClick={() => navigate('/hr-salaries')} 
            style={navButtonStyle(activeTab === 'salaries')}
          >
            <DollarSign size={18} style={{ color: activeTab === 'salaries' ? '#10B981' : '#64748B' }} /> Incentives & Salary
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-complaints')} 
            style={navButtonStyle(activeTab === 'complaints')}
          >
            <FolderOpen size={18} style={{ color: activeTab === 'complaints' ? '#10B981' : '#64748B' }} /> All Complaints
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-sla')} 
            style={navButtonStyle(activeTab === 'sla')}
          >
            <AlertTriangle size={18} style={{ color: activeTab === 'sla' ? '#10B981' : '#64748B' }} /> SLA Monitoring
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-performance')} 
            style={navButtonStyle(activeTab === 'performance')}
          >
            <BarChart2 size={18} style={{ color: activeTab === 'performance' ? '#10B981' : '#64748B' }} /> Performance Reports
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-resolved')} 
            style={navButtonStyle(activeTab === 'resolved')}
          >
            <CheckCircle size={18} style={{ color: activeTab === 'resolved' ? '#10B981' : '#64748B' }} /> Resolved Complaints
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-settings')} 
            style={navButtonStyle(activeTab === 'settings')}
          >
            <Settings size={18} style={{ color: activeTab === 'settings' ? '#10B981' : '#64748B' }} /> Settings
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-notifications')} 
            style={navButtonStyle(activeTab === 'notifications')}
          >
            <Bell size={18} style={{ color: activeTab === 'notifications' ? '#10B981' : '#64748B' }} /> Notifications
          </button>
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid #E2E8F0' }}>
        <button onClick={handleLogout} style={{ width: '100%', background: '#F8FAFC', color: '#EF4444', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
