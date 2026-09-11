import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import HRSidebar from '../components/HRSidebar';
import TLSidebar from '../components/TLSidebar';
import ManagerSidebar from '../components/ManagerSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  Megaphone, 
  Pin, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  CalendarDays, 
  User, 
  Bell, 
  Check, 
  Clock,
  Sparkles,
  Users,
  ShieldCheck
} from 'lucide-react';

const AnnouncementsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'General',
    targetAudience: 'All',
    department: '',
    pinned: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Fetch announcements error:', err);
      setError('Failed to load announcements. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.content.trim()) errors.content = 'Content description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await API.post('/announcements', formData);
      setAnnouncements(prev => [res.data, ...prev]);
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        priority: 'General',
        targetAudience: 'All',
        department: '',
        pinned: false
      });
      alert('Announcement published successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      const res = await API.put(`/announcements/${id}/pin`);
      setAnnouncements(prev => prev.map(a => a._id === id ? res.data : a));
    } catch (err) {
      alert('Failed to update pin status.');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const res = await API.put(`/announcements/${id}/acknowledge`);
      setAnnouncements(prev => prev.map(a => a._id === id ? res.data : a));
    } catch (err) {
      console.warn('Failed to acknowledge announcement:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await API.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  // Filtered List
  const filtered = announcements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Pinned') return item.pinned;
    return item.priority === activeTab;
  });

  const urgentCount = announcements.filter(a => a.priority === 'Urgent').length;
  const pinnedCount = announcements.filter(a => a.pinned).length;
  const currentUserIdStr = user?._id?.toString() || '';
  const unreadCount = announcements.filter(a => !(a.acknowledgedBy || []).some(id => (id._id || id).toString() === currentUserIdStr)).length;

  const renderSidebar = () => {
    const role = user?.role || 'Staff';
    if (role === 'Manager') return <ManagerSidebar activeTab="tl-announcements" />;
    if (role === 'HR') return <HRSidebar activeTab="tl-announcements" />;
    if (role === 'Super Admin') return <SuperAdminSidebar activeTab="tl-announcements" />;
    if (role === 'Team Leader') return <TLSidebar activeTab="tl-announcements" />;
    return <StaffSidebar activeTab="tl-announcements" unreadCount={unreadCount} />;
  };

  const canCreate = ['Team Leader', 'Manager', 'HR', 'Super Admin'].includes(user?.role);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: AlertTriangle };
      case 'Important':
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', icon: Info };
      default:
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: Megaphone };
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {renderSidebar()}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>Announcements & Bulletins</h1>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Stay informed with real-time updates and team notices</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
            {canCreate && (
              <button 
                onClick={() => setShowModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5', color: '#FFFFFF', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(79,70,229,0.25)' }}
              >
                <Plus size={18} /> Post Announcement
              </button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>Total Bulletins</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{announcements.length}</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>Urgent Alerts</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif" }}>{urgentCount}</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pin size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>Pinned Bulletins</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>{pinnedCount}</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>Unread Notices</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>{unreadCount}</div>
              </div>
            </div>
          </div>

          {/* FILTER TABS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {['All', 'Urgent', 'Important', 'General', 'Pinned'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '0.55rem 1.25rem', 
                  borderRadius: '20px', 
                  border: activeTab === tab ? 'none' : '1px solid #E2E8F0', 
                  background: activeTab === tab ? '#4F46E5' : '#FFFFFF', 
                  color: activeTab === tab ? '#FFFFFF' : '#64748B', 
                  fontWeight: '700', 
                  fontSize: '0.84rem', 
                  cursor: 'pointer',
                  boxShadow: activeTab === tab ? '0 2px 6px rgba(79,70,229,0.2)' : 'none'
                }}
              >
                {tab} {tab === 'All' ? `(${announcements.length})` : tab === 'Pinned' ? `(${pinnedCount})` : ''}
              </button>
            ))}
          </div>

          {/* ANNOUNCEMENTS LIST */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <Megaphone size={36} className="spin-icon" style={{ color: '#4F46E5', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>Loading Announcements...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Megaphone size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.35rem 0' }}>No Announcements Found</h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0 }}>There are currently no announcements matching your selected filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filtered.map(item => {
                const priorityInfo = getPriorityStyle(item.priority);
                const PriorityIcon = priorityInfo.icon;
                const isAcked = (item.acknowledgedBy || []).some(id => (id._id || id).toString() === currentUserIdStr);
                const ackCount = (item.acknowledgedBy || []).length;
                const isAuthor = (item.createdBy?._id || item.createdBy).toString() === currentUserIdStr;

                return (
                  <div key={item._id} style={{ background: '#FFFFFF', borderRadius: '16px', border: item.pinned ? '2px solid #6366F1' : '1px solid #E2E8F0', padding: '1.5rem', boxShadow: item.pinned ? '0 4px 12px rgba(99,102,241,0.08)' : '0 2px 6px rgba(15,23,42,0.02)', position: 'relative' }}>
                    
                    {/* TOP METADATA ROW */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          background: priorityInfo.bg,
                          color: priorityInfo.color,
                          border: `1px solid ${priorityInfo.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <PriorityIcon size={14} /> {item.priority}
                        </span>

                        {item.pinned && (
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Pin size={13} /> Pinned
                          </span>
                        )}

                        <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '8px', fontWeight: '600' }}>
                          Target: {item.targetAudience} {item.department ? `(${item.department})` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {canCreate && (
                          <button 
                            onClick={() => handleTogglePin(item._id)} 
                            title={item.pinned ? 'Unpin Announcement' : 'Pin to Top'}
                            style={{ background: 'transparent', border: 'none', color: item.pinned ? '#D97706' : '#94A3B8', cursor: 'pointer', padding: '4px' }}
                          >
                            <Pin size={18} />
                          </button>
                        )}
                        {(isAuthor || canCreate) && (
                          <button 
                            onClick={() => handleDelete(item._id)} 
                            title="Delete Announcement"
                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CONTENT BODY */}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.5rem 0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.6', margin: '0 0 1.25rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {item.content}
                    </p>

                    {/* FOOTER AUTHOR & ACKNOWLEDGEMENT ROW */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '1rem', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#4F46E5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                          {(item.authorName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0F172A' }}>{item.authorName} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500' }}>({item.authorRole || 'Management'})</span></div>
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                          Acknowledged by {ackCount} members
                        </span>
                        <button 
                          onClick={() => handleAcknowledge(item._id)}
                          disabled={isAcked}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            background: isAcked ? '#F0FDF4' : '#FFFFFF', 
                            color: isAcked ? '#16A34A' : '#334155', 
                            border: isAcked ? '1px solid #86EFAC' : '1px solid #CBD5E1', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px', 
                            fontWeight: '700', 
                            fontSize: '0.8rem', 
                            cursor: isAcked ? 'default' : 'pointer' 
                          }}
                        >
                          {isAcked ? <CheckCircle2 size={16} /> : <Check size={16} />}
                          <span>{isAcked ? 'Acknowledged' : 'Acknowledge Notice'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '600px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Megaphone size={24} style={{ color: '#4F46E5' }} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>Post New Announcement</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. System Maintenance Notice / Policy Update"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: formErrors.title ? '2px solid #EF4444' : '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                />
                {formErrors.title && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.title}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Content Description <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea 
                  rows={5}
                  placeholder="Write full announcement details here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: formErrors.content ? '2px solid #EF4444' : '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
                {formErrors.content && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.content}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>Priority Level</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#FFF' }}
                  >
                    <option value="General">General Notice</option>
                    <option value="Important">Important Update</option>
                    <option value="Urgent">Urgent Priority Alert</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>Target Audience</label>
                  <select 
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#FFF' }}
                  >
                    <option value="All">All Users</option>
                    <option value="Staff">Staff Only</option>
                    <option value="Team Leaders">Team Leaders Only</option>
                    <option value="Department">Department Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox"
                  id="pinned"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="pinned" style={{ fontSize: '0.88rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                  Pin announcement to top of feed
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.7rem 1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: '#4F46E5', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnnouncementsPage;
