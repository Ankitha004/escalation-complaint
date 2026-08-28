import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  PenLine,
  ClipboardList,
  Search,
  Clock,
  CalendarDays,
  Bell,
  User,
  LogOut
} from 'lucide-react';

const StaffSidebar = ({ activeTab = 'dashboard', unreadCount = 0 }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.name || 'User';
  const role = user?.role || 'Staff';

  return (
    <aside style={{ 
      width: '260px', 
      background: '#090D16', 
      color: '#F9FAFB', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0, 
      minHeight: '100vh',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      
      {/* BRAND HEADER */}
      <div style={{ padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(124, 58, 237, 0.15))',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)'
          }}>
            <ShieldCheck size={22} style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#FFFFFF', lineHeight: '1.2', fontFamily: "'Outfit', sans-serif" }}>Staff Portal</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500' }}>Escalation Complaint System</div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NAVIGATION */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* MAIN DASHBOARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <SidebarLink 
            icon={LayoutDashboard} 
            isActive={activeTab === 'dashboard'} 
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </SidebarLink>
        </div>

        {/* COMPLAINTS SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', marginBottom: '0.4rem', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
            COMPLAINTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <SidebarLink icon={PenLine} isActive={activeTab === 'raise-complaint'} onClick={() => navigate('/raise-complaint')}>
              Raise Complaint
            </SidebarLink>
            <SidebarLink icon={ClipboardList} isActive={activeTab === 'my-complaints'} onClick={() => navigate('/my-complaints')}>
              My Complaints
            </SidebarLink>
            <SidebarLink icon={Search} isActive={activeTab === 'track-complaint'} onClick={() => navigate('/track-complaint')}>
              Track Complaint
            </SidebarLink>
          </div>
        </div>

        {/* SELF SERVICE SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', marginBottom: '0.4rem', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
            SELF SERVICE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <SidebarLink icon={Clock} isActive={activeTab === 'attendance'} onClick={() => navigate('/dashboard#attendance')}>
              Attendance
            </SidebarLink>
            <SidebarLink icon={CalendarDays} isActive={activeTab === 'leaves'} onClick={() => navigate('/dashboard#leaves')}>
              Leave Requests
            </SidebarLink>
          </div>
        </div>

        {/* COMMUNICATION SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', marginBottom: '0.4rem', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
            COMMUNICATION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <SidebarLink 
              icon={Bell} 
              isActive={activeTab === 'notifications'} 
              onClick={() => navigate('/notifications')}
              rightElement={
                unreadCount > 0 && (
                  <span style={{ 
                    background: '#EF4444', 
                    color: '#FFFFFF', 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    height: '18px',
                    minWidth: '18px',
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '0 5px'
                  }}>
                    {unreadCount}
                  </span>
                )
              }
            >
              Notifications
            </SidebarLink>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', marginBottom: '0.4rem', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
            ACCOUNT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <SidebarLink icon={User} isActive={activeTab === 'profile'} onClick={() => navigate('/profile')}>
              Profile
            </SidebarLink>
          </div>
        </div>

      </div>

      {/* LOGOUT FOOTER */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <LogoutButton onClick={handleLogout} />
      </div>
    </aside>
  );
};

const SidebarLink = ({ onClick, isActive, children, icon: Icon, rightElement }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.75rem 0.9rem',
        borderRadius: '10px',
        border: 'none',
        background: isActive 
          ? 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)' 
          : hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        color: isActive ? '#FFFFFF' : hovered ? '#FFFFFF' : '#94A3B8',
        fontWeight: isActive ? '600' : '500',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Icon size={18} style={{ 
          color: isActive ? '#FFFFFF' : hovered ? '#F3F4F6' : '#64748B',
          transition: 'color 0.2s ease'
        }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{children}</span>
      </div>
      {rightElement}
    </button>
  );
};

const LogoutButton = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button 
      onClick={onClick} 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        width: '100%', 
        padding: '0.75rem 0.9rem', 
        background: hovered ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
        color: '#EF4444', 
        border: 'none', 
        borderRadius: '10px', 
        fontSize: '0.85rem', 
        fontWeight: '600', 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
    >
      <LogOut size={18} />
      <span>Logout</span>
    </button>
  );
};

export default StaffSidebar;
