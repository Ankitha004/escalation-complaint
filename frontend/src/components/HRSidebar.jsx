import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  UserCog, 
  Building2, 
  Bell, 
  LogOut,
  CalendarDays,
  User,
  DollarSign,
  FileText
} from 'lucide-react';

const HRSidebar = ({ activeTab = 'dashboard', badgeCount = 0 }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? '#3B82F6' : 'transparent',
    color: isActive ? '#FFFFFF' : '#D1D5DB',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    gap: '0.85rem'
  });

  return (
    <aside style={{ 
      width: '280px', 
      background: '#111827', 
      color: '#F9FAFB', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0, 
      minHeight: '100vh',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      
      {/* BRAND HEADER */}
      <div style={{ padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#3B82F6',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}>
            <ShieldCheck size={22} style={{ color: '#60A5FA' }} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#FFFFFF', lineHeight: '1.2', fontFamily: "'Outfit', sans-serif" }}>HR Portal</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '500' }}>Escalation Complaint System</div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NAVIGATION */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* MAIN DASHBOARD */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            style={navButtonStyle(activeTab === 'dashboard')}
          >
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </button>
        </div>

        {/* HR MODULE SECTION */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '1rem', textTransform: 'uppercase' }}>
            HR MODULE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button onClick={() => navigate('/hr-complaints')} style={navButtonStyle(activeTab === 'hr-complaints')}>
              <FileText size={18} /> <span>Complaint Management</span>
            </button>
            <button onClick={() => navigate('/pending-registrations')} style={{...navButtonStyle(activeTab === 'pending-registrations'), justifyContent: 'space-between'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <UserCheck size={18} /> <span>Pending Registrations</span>
              </div>
              {badgeCount > 0 && (
                <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: '800', padding: '2px 6px', borderRadius: '50%' }}>
                  {badgeCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/staff-management')} style={navButtonStyle(activeTab === 'staff-management')}>
              <Users size={18} /> <span>Staff Management</span>
            </button>
            <button onClick={() => navigate('/team-leaders')} style={navButtonStyle(activeTab === 'team-leaders')}>
              <UserCog size={18} /> <span>Team Leaders</span>
            </button>
            <button onClick={() => navigate('/departments')} style={navButtonStyle(activeTab === 'departments')}>
              <Building2 size={18} /> <span>Departments</span>
            </button>
            <button onClick={() => navigate('/hr-leaves')} style={navButtonStyle(activeTab === 'leaves')}>
              <CalendarDays size={18} /> <span>Leave Approvals</span>
            </button>
            <button onClick={() => navigate('/hr-salaries')} style={navButtonStyle(activeTab === 'salaries')}>
              <DollarSign size={18} /> <span>Salary & Incentives</span>
            </button>
          </div>
        </div>

        {/* COMMUNICATION SECTION */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '1rem', textTransform: 'uppercase' }}>
            COMMUNICATION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button onClick={() => navigate('/notifications')} style={navButtonStyle(activeTab === 'notifications')}>
              <Bell size={18} /> <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '1rem', textTransform: 'uppercase' }}>
            ACCOUNT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button onClick={() => navigate('/profile')} style={navButtonStyle(activeTab === 'profile')}>
              <User size={18} /> <span>Profile</span>
            </button>
          </div>
        </div>

      </div>

      {/* LOGOUT FOOTER */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid #1F2937' }}>
        <button 
          onClick={handleLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            width: '100%', 
            padding: '0.8rem 1rem', 
            background: 'transparent', 
            color: '#EF4444', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default HRSidebar;
