import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import HRSidebar from '../components/HRSidebar';
import TLSidebar from '../components/TLSidebar';
import ManagerSidebar from '../components/ManagerSidebar';
import API from '../services/api';
import { 
  Bell, 
  CheckSquare, 
  Trash2,
  Settings, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Menu,
  CalendarDays,
  ChevronDown
} from 'lucide-react';

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications');
      const data = res.data || [];
      const mapped = data.map((n, i) => {
        const relatedCompId = n.relatedComplaint?._id || n.relatedComplaint;
        const compDisplayId = n.relatedComplaint?.complaintId || n.complaintId;
        return {
          id: n._id || String(i),
          type: n.type === 'broadcast' ? 'System' : (n.type || 'Updates'),
          icon: n.type === 'broadcast' ? Bell : n.type === 'Escalations' ? Bell : MessageSquare,
          iconColor: n.type === 'broadcast' ? '#EA580C' : '#8B5CF6',
          bgColor: n.type === 'broadcast' ? '#FFEDD5' : '#F3E8FF',
          title: n.title || (compDisplayId ? `Complaint Alert (#${compDisplayId})` : 'System Alert'),
          isNew: !n.isRead,
          message: n.message || n.text || 'System update notification',
          highlightId: relatedCompId || compDisplayId,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
        };
      });
      setNotifications(mapped);
    } catch (err) {
      console.warn('Fetch notifications notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await API.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
      setNotifications([]);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (item) => {
    if (item.isNew && item.id) {
      try {
        await API.put(`/notifications/${item.id}/read`);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isNew: false } : n));
      } catch (err) {
        console.warn('Failed to mark notification read:', err);
      }
    }
    if (item.highlightId) {
      const role = user?.role || 'Staff';
      if (role === 'Manager') {
        navigate(`/manager-complaint-details/${item.highlightId}`);
      } else if (role === 'Team Leader') {
        navigate(`/tl-complaint-details/${item.highlightId}`);
      } else if (role === 'Super Admin') {
        navigate(`/super-admin-complaint-details/${item.highlightId}`);
      } else if (role === 'HR') {
        navigate(`/hr-complaint-details/${item.highlightId}`);
      } else {
        navigate(`/complaint-details/${item.highlightId}`);
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return n.isNew;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter(n => n.isNew).length;

  const renderSidebar = () => {
    const role = user?.role || 'Staff';
    if (role === 'Manager') return <ManagerSidebar activeTab="notifications" />;
    if (role === 'HR' || role === 'Super Admin') return <HRSidebar activeTab="notifications" />;
    if (role === 'Team Leader') return <TLSidebar activeTab="notifications" />;
    return <StaffSidebar activeTab="notifications" unreadCount={unreadCount} />;
  };

  const role = user?.role || 'HR';
  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(user?.name);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {renderSidebar()}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E2E8F0', 
          padding: '0.75rem 2rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <Menu size={24} style={{ color: '#475569', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
              <CalendarDays size={16} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} style={{ color: '#475569' }} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: '800', padding: '2px 5px', borderRadius: '50%', border: '2px solid #FFF' }}>
                  {unreadCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3B82F6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{user?.name || 'Priya Sharma'}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{role}</span>
              </div>
              <ChevronDown size={16} style={{ color: '#64748B' }} />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Notifications
              </h1>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.35rem', margin: '0' }}>
                Stay updated with the latest activity and system alerts.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {notifications.length > 0 && (
                <>
                  <button onClick={handleMarkAllRead} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.04)' }}>
                    <CheckSquare size={16} style={{ color: '#475569' }} />
                    <span>Mark all as read</span>
                  </button>
                  <button onClick={handleClearAll} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(220,38,38,0.04)' }}>
                    <Trash2 size={16} />
                    <span>Clear all</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('All')} style={{ padding: '0.55rem 1.1rem', borderRadius: '20px', border: activeTab === 'All' ? 'none' : '1px solid #E2E8F0', background: activeTab === 'All' ? '#EEF2FF' : '#FFFFFF', color: activeTab === 'All' ? '#4F46E5' : '#64748B', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>All</span>
              <span style={{ background: activeTab === 'All' ? '#4F46E5' : '#F1F5F9', color: activeTab === 'All' ? '#FFF' : '#64748B', borderRadius: '10px', padding: '1px 6px', fontSize: '0.72rem' }}>
                {notifications.length}
              </span>
            </button>
            <button onClick={() => setActiveTab('Unread')} style={{ padding: '0.55rem 1.1rem', borderRadius: '20px', border: activeTab === 'Unread' ? 'none' : '1px solid #E2E8F0', background: activeTab === 'Unread' ? '#EEF2FF' : '#FFFFFF', color: activeTab === 'Unread' ? '#4F46E5' : '#64748B', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Unread</span>
              <span style={{ background: activeTab === 'Unread' ? '#4F46E5' : '#F1F5F9', color: activeTab === 'Unread' ? '#FFF' : '#64748B', borderRadius: '10px', padding: '1px 6px', fontSize: '0.72rem' }}>
                {unreadCount}
              </span>
            </button>
            {['Updates', 'Escalations', 'System'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.55rem 1.1rem', borderRadius: '20px', border: activeTab === tab ? 'none' : '1px solid #E2E8F0', background: activeTab === tab ? '#EEF2FF' : '#FFFFFF', color: activeTab === tab ? '#4F46E5' : '#64748B', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredNotifications.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.id} onClick={() => handleNotificationClick(item)} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(15,23,42,0.02)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flex: 1 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: item.bgColor, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</h4>
                        {item.isNew && <span style={{ background: '#FEE2E2', color: '#EF4444', fontSize: '0.68rem', fontWeight: '800', padding: '1px 7px', borderRadius: '10px' }}>New</span>}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#475569', margin: '4px 0 0 0', lineHeight: '1.3' }}>{item.message}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                    <span>{item.time}</span>
                    <button 
                      onClick={(e) => handleDeleteNotification(e, item.id)} 
                      title="Delete notification"
                      style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotifications.length === 0 && (
            <div style={{ marginTop: '1.5rem', padding: '2.5rem 1.5rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Bell size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.35rem 0' }}>You're all caught up! 🎉</h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0 }}>We'll notify you when there are new updates.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
