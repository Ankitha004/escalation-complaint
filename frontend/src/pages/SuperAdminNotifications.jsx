import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  Bell,
  Megaphone,
  CheckCircle2,
  Trash2,
  Send,
  RefreshCw,
  Clock,
  ShieldAlert,
  Users,
  Search,
  Filter,
  Check,
  X,
  Inbox,
  AlertCircle,
  Radio,
  Building
} from 'lucide-react';

const SuperAdminNotifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetRole, setTargetRole] = useState('All');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Send Broadcast Announcement
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcasting(true);
    setBroadcastStatus('');
    try {
      const res = await API.post('/notifications/broadcast', {
        title: broadcastTitle.trim() || 'Executive Notice',
        message: broadcastMessage.trim(),
        targetRole
      });

      setBroadcastStatus(res.data?.message || 'Broadcast announcement successfully dispatched!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      fetchNotifications();
      setTimeout(() => setBroadcastStatus(''), 5000);
    } catch (err) {
      setBroadcastStatus('Failed to dispatch broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = (n.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    let matchesType = true;
    if (filterType === 'Unread') matchesType = !n.isRead;
    if (filterType === 'Read') matchesType = n.isRead;
    if (filterType === 'Escalations') matchesType = (n.message || '').toLowerCase().includes('escalat');
    if (filterType === 'Broadcasts') matchesType = (n.message || '').includes('📢');
    return matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="notifications" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Enterprise Notification & Broadcast Center
              </h1>
              {unreadCount > 0 && (
                <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Monitor system SLA alerts, escalation notices, and broadcast enterprise-wide announcements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#334155', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <Check size={15} /> Mark All as Read
              </button>
            )}
            <button 
              onClick={fetchNotifications} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync
            </button>
          </div>
        </div>

        {/* BROADCAST ANNOUNCEMENT CARD */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
            <Radio size={20} color="#EA580C" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Dispatch Enterprise Broadcast Announcement
            </h2>
          </div>

          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Announcement Title / Heading</label>
                <input 
                  type="text" 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="e.g. System Maintenance Notice / Policy Update"
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>Target Audience</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={inputStyle}>
                  <option value="All">📢 All Employees (Entire Company)</option>
                  <option value="Staff">Staff Only</option>
                  <option value="Team Leader">Team Leaders Only</option>
                  <option value="Manager">Department Managers Only</option>
                  <option value="HR">HR Team Only</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Broadcast Message Content *</label>
              <textarea 
                rows={3} 
                required
                value={broadcastMessage} 
                onChange={e => setBroadcastMessage(e.target.value)} 
                placeholder="Type urgent directive or organization announcement to be delivered to user inboxes..."
                style={{ ...inputStyle, resize: 'vertical' }} 
              />
            </div>

            {broadcastStatus && (
              <div style={{ background: broadcastStatus.includes('success') ? '#DCFCE7' : '#FEE2E2', color: broadcastStatus.includes('success') ? '#15803D' : '#991B1B', border: `1px solid ${broadcastStatus.includes('success') ? '#86EFAC' : '#F87171'}`, padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} /> {broadcastStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={broadcasting || !broadcastMessage.trim()} 
                style={{ background: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.7rem 1.4rem', fontWeight: '700', fontSize: '0.88rem', cursor: (broadcasting || !broadcastMessage.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(234,88,12,0.25)' }}
              >
                <Send size={15} /> {broadcasting ? 'Broadcasting...' : 'Publish Broadcast Notice'}
              </button>
            </div>
          </form>
        </div>

        {/* NOTIFICATIONS FEED & FILTERS */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
              {['All', 'Unread', 'Escalations', 'Broadcasts', 'Read'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    background: filterType === t ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    color: filterType === t ? '#0F172A' : '#64748B',
                    fontWeight: filterType === t ? '800' : '500',
                    fontSize: '0.78rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: filterType === t ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid #E2E8F0', minWidth: '260px' }}>
              <Search size={15} color="#94A3B8" />
              <input 
                type="text" 
                placeholder="Search notification messages..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.82rem', width: '100%' }} 
              />
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.5rem', display: 'block' }} />
              <div style={{ fontWeight: '700' }}>Loading Notifications Feed...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
              <Inbox size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4, display: 'block' }} />
              <div style={{ fontWeight: '700', color: '#0F172A' }}>No Notifications Found</div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>Your notification inbox is clean.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredNotifications.map(n => {
                const isEscalation = (n.message || '').toLowerCase().includes('escalat');
                const isBroadcast = (n.message || '').includes('📢');

                return (
                  <div 
                    key={n._id} 
                    style={{ 
                      background: n.isRead ? '#FAFAFA' : '#F0F7FF', 
                      border: `1px solid ${n.isRead ? '#F1F5F9' : '#BFDBFE'}`, 
                      borderRadius: '12px', 
                      padding: '1rem 1.25rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      gap: '1rem' 
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.85rem', flex: 1 }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px', 
                        background: isEscalation ? '#FEE2E2' : isBroadcast ? '#FFEDD5' : '#EFF6FF', 
                        color: isEscalation ? '#DC2626' : isBroadcast ? '#EA580C' : '#2563EB', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0 
                      }}>
                        {isEscalation ? <ShieldAlert size={18} /> : isBroadcast ? <Megaphone size={18} /> : <Bell size={18} />}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: n.isRead ? '600' : '800', color: '#0F172A', lineHeight: '1.4' }}>
                          {n.message}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', fontSize: '0.72rem', color: '#94A3B8' }}>
                          <Clock size={12} />
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(n._id)} 
                          title="Mark as read"
                          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#2563EB', padding: '0.35rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotification(n._id)} 
                        title="Delete notification"
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '700',
  color: '#475569',
  marginBottom: '0.35rem'
};

const inputStyle = {
  width: '100%',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  padding: '0.65rem 0.9rem',
  color: '#0F172A',
  outline: 'none',
  fontSize: '0.88rem',
  fontWeight: '500',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: 'border-box'
};

export default SuperAdminNotifications;
