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
  Sparkles,
  ClipboardList,
  BarChart2,
  Settings,
  Bell,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Clock
} from 'lucide-react';

const SuperAdminSidebar = ({ activeTab = 'overview' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navButtonStyle = (isActive) => ({
    background: isActive ? 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
    color: isActive ? '#FFFFFF' : '#CBD5E1',
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
    boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
    transition: 'all 0.2s ease'
  });

  return (
    <aside style={{ 
      width: '280px', 
      background: 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)', 
      borderRight: '1px solid rgba(255, 255, 255, 0.08)', 
      color: '#F8FAFC', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      position: 'sticky',
      top: 0,
      flexShrink: 0, 
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ padding: '2rem 1.5rem 1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
            <ShieldCheck size={24} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#FFFFFF' }}>Super Admin</div>
            <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>System Control Room</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={navButtonStyle(activeTab === 'overview' || activeTab === 'dashboard')}
          >
            <Activity size={18} style={{ color: activeTab === 'overview' || activeTab === 'dashboard' ? '#FFFFFF' : '#94A3B8' }} /> Global Dashboard
          </button>

          <button 
            onClick={() => navigate('/hr-attendance')}
            style={navButtonStyle(activeTab === 'attendance')}
          >
            <Clock size={18} style={{ color: activeTab === 'attendance' ? '#FFFFFF' : '#94A3B8' }} /> Attendance Directory
          </button>
          
          <button 
            onClick={() => navigate('/departments')} 
            style={navButtonStyle(activeTab === 'departments')}
          >
            <Building2 size={18} style={{ color: activeTab === 'departments' ? '#FFFFFF' : '#94A3B8' }} /> Manage Departments
          </button>
          
          <button 
            onClick={() => navigate('/team-leaders')} 
            style={navButtonStyle(activeTab === 'team-leaders')}
          >
            <UserCheck size={18} style={{ color: activeTab === 'team-leaders' ? '#FFFFFF' : '#94A3B8' }} /> Team Leaders
          </button>
          
          <button 
            onClick={() => navigate('/hr-leaves')}
            style={navButtonStyle(activeTab === 'leaves')}
          >
            <CalendarDays size={18} style={{ color: activeTab === 'leaves' ? '#FFFFFF' : '#94A3B8' }} /> Leave Approvals
          </button>
          
          <button 
            onClick={() => navigate('/pending-registrations')} 
            style={navButtonStyle(activeTab === 'pending-registrations')}
          >
            <ClipboardList size={18} style={{ color: activeTab === 'pending-registrations' ? '#FFFFFF' : '#94A3B8' }} /> Pending Registrations
          </button>
          
          <button 
            onClick={() => navigate('/staff-management')} 
            style={navButtonStyle(activeTab === 'staff-management')}
          >
            <Users size={18} style={{ color: activeTab === 'staff-management' ? '#FFFFFF' : '#94A3B8' }} /> Staff Management
          </button>
          
          <button 
            onClick={() => navigate('/hr-incentives')} 
            style={navButtonStyle(activeTab === 'incentives' || activeTab === 'salaries')}
          >
            <Sparkles size={18} style={{ color: (activeTab === 'incentives' || activeTab === 'salaries') ? '#FFFFFF' : '#94A3B8' }} /> Resolution Incentives
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-complaints')} 
            style={navButtonStyle(activeTab === 'complaints')}
          >
            <FolderOpen size={18} style={{ color: activeTab === 'complaints' ? '#FFFFFF' : '#94A3B8' }} /> All Complaints
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-sla')} 
            style={navButtonStyle(activeTab === 'sla')}
          >
            <AlertTriangle size={18} style={{ color: activeTab === 'sla' ? '#FFFFFF' : '#94A3B8' }} /> SLA Monitoring
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-performance')} 
            style={navButtonStyle(activeTab === 'performance')}
          >
            <BarChart2 size={18} style={{ color: activeTab === 'performance' ? '#FFFFFF' : '#94A3B8' }} /> Performance Reports
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-resolved')} 
            style={navButtonStyle(activeTab === 'resolved')}
          >
            <CheckCircle size={18} style={{ color: activeTab === 'resolved' ? '#FFFFFF' : '#94A3B8' }} /> Resolved Complaints
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-settings')} 
            style={navButtonStyle(activeTab === 'settings')}
          >
            <Settings size={18} style={{ color: activeTab === 'settings' ? '#FFFFFF' : '#94A3B8' }} /> Settings
          </button>
          
          <button 
            onClick={() => navigate('/superadmin-notifications')} 
            style={navButtonStyle(activeTab === 'notifications')}
          >
            <Bell size={18} style={{ color: activeTab === 'notifications' ? '#FFFFFF' : '#94A3B8' }} /> Notifications
          </button>
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '1.15rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
        <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
