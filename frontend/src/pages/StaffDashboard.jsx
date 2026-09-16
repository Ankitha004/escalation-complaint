import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import API from '../services/api';
import { 
  FileText, 
  CheckCircle2, 
  Bell, 
  Calendar, 
  User, 
  ChevronDown,
  Menu,
  Clock,
  LogOut,
  LogIn,
  MessageSquare,
  Activity,
  BarChart2,
  ChevronRight,
  Send,
  Check,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { Chart as ArcChart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ArcChart.register(ArcElement, Tooltip, Legend);

const StaffDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // States
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    closedComplaints: 0
  });

  const [myAttendance, setMyAttendance] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeavesModal, setShowLeavesModal] = useState(false);
  const [showApplyLeaveForm, setShowApplyLeaveForm] = useState(false);
  
  // Leave Form State
  const [leaveType, setLeaveType] = useState('Earned Leave (EL)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);
  const [dateError, setDateError] = useState('');
  const [leaveBalances, setLeaveBalances] = useState(null);

  // Today formatted as YYYY-MM-DD for min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [compRes, leaveRes, attRes, profileRes, notifRes, balanceRes] = await Promise.all([
        API.get('/complaints/my').catch(() => ({ data: [] })),
        API.get('/leaves/my').catch(() => ({ data: [] })),
        API.get('/attendance/today').catch(() => ({ data: null })),
        API.get('/auth/me').catch(() => null),
        API.get('/notifications').catch(() => ({ data: [] })),
        API.get('/leaves/balances').catch(() => ({ data: null }))
      ]);

      if (profileRes && profileRes.data) {
        setProfileData(profileRes.data);
      }

      if (balanceRes && balanceRes.data) {
        setLeaveBalances(balanceRes.data);
      }

      const compList = compRes.data.complaints || (Array.isArray(compRes.data) ? compRes.data : []);
      if (compList.length > 0) {
        const total = compList.length;
        const pending = compList.filter(c => ['Pending', 'Submitted'].includes(c.status)).length;
        const inProgress = compList.filter(c => 
          ['In Progress', 'Waiting on User', 'Escalated', 'Escalated to Super Admin', 'Pending HR Review', 'Pending HR Approval'].includes(c.status)
        ).length;
        const resolved = compList.filter(c => ['Resolved', 'Approved'].includes(c.status)).length;
        const closed = compList.filter(c => ['Closed', 'Cancelled', 'Rejected'].includes(c.status)).length;

        setStats({
          totalComplaints: total,
          pendingComplaints: pending,
          inProgressComplaints: inProgress,
          resolvedComplaints: resolved,
          closedComplaints: closed
        });
        
        const sortedComplaints = [...compList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentComplaints(sortedComplaints.slice(0, 5));
      } else {
        setStats({
          totalComplaints: 0,
          pendingComplaints: 0,
          inProgressComplaints: 0,
          resolvedComplaints: 0,
          closedComplaints: 0
        });
        setRecentComplaints([]);
      }

      setMyLeaves(leaveRes.data || []);
      setMyAttendance(attRes.data || null);
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data.slice(0, 3) : []);
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [location.hash]);

  const [clockingLoading, setClockingLoading] = useState(false);

  const handleClockIn = async () => {
    if (clockingLoading) return;
    setClockingLoading(true);
    try {
      const isClockedIn = myAttendance && myAttendance.clockIn && myAttendance.clockIn !== '--:--' && (!myAttendance.clockOut || myAttendance.clockOut === 'In Progress');
      const action = isClockedIn ? 'clockOut' : 'clockIn';
      const res = await API.post('/attendance', { action });
      setActionAlert({ type: 'success', message: res.data.message || 'Attendance status updated successfully' });
      await fetchDashboardData();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (error) {
      setActionAlert({ type: 'error', message: error.response?.data?.message || 'Error updating attendance' });
      setTimeout(() => setActionAlert(null), 4000);
    } finally {
      setClockingLoading(false);
    }
  };

  const [modalError, setModalError] = useState('');

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setDateError('');
    setModalError('');

    if (!startDate) {
      setDateError('Please select a start date.');
      return;
    }

    if (startDate < todayStr) {
      setDateError('Start date cannot be in the past.');
      return;
    }

    if (!endDate) {
      setDateError('Please select an end date.');
      return;
    }

    if (endDate < startDate) {
      setDateError('End date cannot be earlier than start date.');
      return;
    }

    setSubmittingLeave(true);
    try {
      await API.post('/leaves', {
        type: leaveType,
        startDate,
        endDate,
        reason: leaveReason
      });
      setActionAlert({ type: 'success', message: 'Leave application submitted successfully!' });
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      setDateError('');
      setModalError('');
      setShowApplyLeaveForm(false);
      fetchDashboardData();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Error submitting leave request';
      setModalError(errMsg);
      setActionAlert({ type: 'error', message: errMsg });
      setTimeout(() => setActionAlert(null), 6000);
    } finally {
      setSubmittingLeave(false);
    }
  };


  const userName = profileData?.name || user?.name || 'Staff Member';
  const role = profileData?.role || user?.role || 'Staff';
  
  const getInitials = (name) => {
    if (!name || name === 'User') return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(userName);

  // Leave Stats Calculation
  const totalLeaves = myLeaves.length;
  const approvedLeaves = myLeaves.filter(l => l.status === 'Approved').length;
  const pendingLeaves = myLeaves.filter(l => l.status === 'Pending' || l.status === 'Pending Approval').length;

  // Status breakdown calculations
  const totalChartCount = stats.pendingComplaints + stats.inProgressComplaints + stats.resolvedComplaints + stats.closedComplaints;
  
  const chartData = {
    labels: ['Pending / Open', 'In Progress', 'Resolved', 'Closed / Other'],
    datasets: [
      {
        data: totalChartCount > 0 
          ? [stats.pendingComplaints, stats.inProgressComplaints, stats.resolvedComplaints, stats.closedComplaints]
          : [0, 0, 0, 1],
        backgroundColor: totalChartCount > 0 
          ? ['#F59E0B', '#3B82F6', '#10B981', '#94A3B8']
          : ['#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: totalChartCount > 0,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) label += context.parsed;
            return label;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  // Helper text logic
  let helperTitle = 'All Caught Up';
  let helperText = 'You have no unresolved complaints. Everything is running smoothly!';
  if (stats.inProgressComplaints > 0) {
    helperTitle = 'In Progress';
    helperText = `${stats.inProgressComplaints} complaint${stats.inProgressComplaints > 1 ? 's are' : ' is'} actively being worked on by your Team Leader.`;
  } else if (stats.pendingComplaints > 0) {
    helperTitle = 'Pending Review';
    helperText = `${stats.pendingComplaints} ticket${stats.pendingComplaints > 1 ? 's are' : ' is'} waiting for team review.`;
  } else if (stats.resolvedComplaints > 0) {
    helperTitle = 'Recently Resolved';
    helperText = 'Your previous complaints have been resolved. Please provide your feedback!';
  }



  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="dashboard" unreadCount={notifications.filter(n => !n.isRead).length} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP HEADER */}
        <header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E2E8F0', 
          padding: '0.85rem 2rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Menu size={20} style={{ color: '#64748B', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Employee Workspace</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.825rem', fontWeight: '500', background: '#F1F5F9', padding: '0.4rem 0.85rem', borderRadius: '20px' }}>
              <Calendar size={15} style={{ color: '#3B82F6' }} />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })}</span>
            </div>
            
            <div 
              onClick={() => navigate('/notifications')}
              style={{ position: 'relative', cursor: 'pointer', padding: '0.4rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <Bell size={18} style={{ color: '#475569' }} />
              {notifications.some(n => !n.isRead) && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-2px', 
                  right: '-2px', 
                  background: '#EF4444', 
                  color: '#FFF', 
                  fontSize: '0.6rem', 
                  fontWeight: '800', 
                  height: '16px',
                  minWidth: '16px',
                  borderRadius: '50%', 
                  border: '2px solid #FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px'
                }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>

            <div 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '12px', transition: 'background 0.2s' }}
            >
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)', 
                color: '#FFF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '700', 
                fontSize: '0.85rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)'
              }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', lineHeight: '1.2' }}>{userName}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '500' }}>{role}</span>
              </div>
              <ChevronDown size={14} style={{ color: '#94A3B8' }} />
            </div>
          </div>
        </header>



        {/* NOTIFICATION TOAST ALERT */}
        {actionAlert && (
          <div style={{
            margin: '1.5rem 2rem 0 2rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: actionAlert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${actionAlert.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: actionAlert.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {actionAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionAlert.message}</span>
            </div>
            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setActionAlert(null)} />
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          
          {/* WELCOME BANNER */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', 
            borderRadius: '20px', 
            padding: '2.25rem 2.5rem', 
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Ambient background glows */}
            <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ maxWidth: '560px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 10px', borderRadius: '20px', color: '#60A5FA', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                  <Sparkles size={12} /> Staff Self-Service Hub
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FFFFFF', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                  Welcome back, {userName}! 👋
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>
                  Submit complaints and monitor SLA resolution progress seamlessly.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowAttendanceModal(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Clock size={16} /> Attendance
                </button>
                <button 
                  onClick={() => setShowLeavesModal(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Calendar size={16} /> Leave Requests
                </button>
                <button 
                  onClick={() => navigate('/raise-complaint')}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Plus size={16} /> Raise Complaint
                </button>
              </div>
            </div>
          </div>

          {/* STATS METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <StatCard 
              title="Total Complaints" 
              value={stats.totalComplaints} 
              icon={<FileText size={22} color="#3B82F6" />} 
              iconBg="#EFF6FF" 
              onClick={() => navigate('/my-complaints')} 
              badgeText="View Tickets"
            />
            
            <StatCard 
              title="In Progress / Open" 
              value={stats.inProgressComplaints + stats.pendingComplaints} 
              icon={<Clock size={22} color="#F59E0B" />} 
              iconBg="#FFFBEB" 
              valueColor="#D97706"
              onClick={() => navigate('/my-complaints')} 
              badgeText="Active SLA"
            />
            
            <StatCard 
              title="Resolved / Closed" 
              value={stats.resolvedComplaints + stats.closedComplaints} 
              icon={<CheckCircle2 size={22} color="#10B981" />} 
              iconBg="#ECFDF5" 
              valueColor="#059669"
              onClick={() => navigate('/my-complaints')} 
              badgeText="Completed"
            />

          </div>

          {/* TWO COLUMN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '1.75rem' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* MY RECENT COMPLAINTS */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '18px', 
                padding: '1.5rem', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '18px', borderRadius: '4px', background: '#3B82F6' }}></div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Recent Complaints</h3>
                  </div>
                  <span onClick={() => navigate('/my-complaints')} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    View All <ArrowUpRight size={14} />
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentComplaints.length > 0 ? recentComplaints.map((c, idx) => {
                    let statusColor = '#3B82F6';
                    let statusBg = '#EFF6FF';
                    const s = (c.status || '').toLowerCase();
                    
                    if (s === 'resolved' || s === 'approved') {
                      statusColor = '#059669';
                      statusBg = '#ECFDF5';
                    } else if (s === 'pending' || s === 'submitted') {
                      statusColor = '#D97706';
                      statusBg = '#FFFBEB';
                    } else if (s === 'escalated' || s === 'rejected') {
                      statusColor = '#DC2626';
                      statusBg = '#FEF2F2';
                    } else if (s === 'cancelled' || s === 'closed') {
                      statusColor = '#64748B';
                      statusBg = '#F1F5F9';
                    } else if (s === 'waiting on user') {
                      statusColor = '#EA580C';
                      statusBg = '#FFF7ED';
                    }
                    
                    return (
                      <div 
                        key={c._id || idx} 
                        onClick={() => navigate(`/complaint-details/${c._id}`)}
                        style={{ 
                          padding: '0.9rem 0.5rem', 
                          borderBottom: idx !== recentComplaints.length - 1 ? '1px solid #F1F5F9' : 'none', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '10px', 
                            background: statusBg, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText size={18} color={statusColor} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.875rem', marginBottom: '0.2rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title || c.subject}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500' }}>
                              #{c.complaintId || 'CMP'} • {c.category || 'General'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <span style={{ 
                              background: statusBg, 
                              color: statusColor, 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.68rem', 
                              fontWeight: '700', 
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}>
                              {c.status}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: '500' }}>
                              {new Date(c.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                        <FileText size={22} color="#94A3B8" />
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '0.9rem', fontWeight: '600' }}>No complaints filed yet</p>
                      <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>Encountering an issue? Raise a ticket and track its SLA progress in real time.</p>
                    </div>
                  )}
                </div>
                
                {recentComplaints.length > 0 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                    <span onClick={() => navigate('/my-complaints')} style={{ fontSize: '0.825rem', fontWeight: '600', color: '#3B82F6', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Go to My Complaints <ChevronRight size={14} />
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* NOTIFICATIONS WIDGET */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '18px', 
                padding: '1.5rem', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '18px', borderRadius: '4px', background: '#3B82F6' }}></div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Notifications</h3>
                  </div>
                  <span onClick={() => navigate('/notifications')} style={{ fontSize: '0.78rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.length > 0 ? (
                    notifications.map((n, idx) => (
                      <div key={n._id || idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.4rem 0' }}>
                        <div style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          background: n.isRead ? '#F1F5F9' : '#EFF6FF', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0
                        }}>
                          <Bell size={14} color={n.isRead ? '#64748B' : '#3B82F6'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: n.isRead ? '500' : '600', lineHeight: '1.35' }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.15rem', fontWeight: '500' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem' }}>
                      You're all caught up! No new notifications.
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLAINT STATUS OVERVIEW */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '18px', 
                padding: '1.5rem', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '8px', height: '18px', borderRadius: '4px', background: '#8B5CF6' }}></div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Complaint Status Overview</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* DOUGHNUT CHART CONTAINER */}
                  <div style={{ width: '120px', height: '120px', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Doughnut data={chartData} options={chartOptions} />
                    <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', lineHeight: '1', fontFamily: "'Outfit', sans-serif" }}>
                        {stats.totalComplaints}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>
                        Total
                      </div>
                    </div>
                  </div>
                  
                  {/* LEGEND BREAKDOWN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
                    <ChartLegendItem color="#F59E0B" label="Pending / Open" count={stats.pendingComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#3B82F6" label="In Progress" count={stats.inProgressComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#10B981" label="Resolved" count={stats.resolvedComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#94A3B8" label="Closed / Cancelled" count={stats.closedComplaints} total={stats.totalComplaints} />
                  </div>

                  {/* DYNAMIC HELPER CARD */}
                  <div style={{ 
                    flex: 1,
                    minWidth: '180px',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                    borderRadius: '14px', 
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563EB', fontWeight: '700', fontSize: '0.825rem' }}>
                      <Activity size={15} />
                      <span>{helperTitle}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: '500', lineHeight: '1.45' }}>
                      {helperText}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>



        {/* MODALS */}
        {showAttendanceModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '400px',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#16A34A" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Today's Attendance</h3>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500' }}>
                      {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAttendanceModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', flex: 1, marginRight: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Clock In</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{myAttendance?.clockIn || '--:--'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', flex: 1, marginLeft: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Clock Out</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{myAttendance?.clockOut && myAttendance.clockOut !== 'In Progress' ? myAttendance.clockOut : '--:--'}</div>
                </div>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL DAYS ATTENDED</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Total attendance records verified</div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#15803D', fontFamily: "'Outfit', sans-serif" }}>
                  {myAttendance?.totalDaysAttended || 0} Days
                </div>
              </div>

              {myAttendance && myAttendance.clockIn && myAttendance.clockIn !== '--:--' && myAttendance.clockOut && myAttendance.clockOut !== 'In Progress' && myAttendance.clockOut !== '--:--' ? (
                <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#065F46', fontWeight: '600' }}>
                  ✓ Shift Completed for Today
                </div>
              ) : (
                <button 
                  onClick={handleClockIn} 
                  disabled={clockingLoading}
                  style={{ 
                    width: '100%', 
                    background: (myAttendance && myAttendance.clockIn && myAttendance.clockIn !== '--:--') ? '#0F172A' : '#2563EB', 
                    color: '#FFFFFF', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    fontWeight: '700', 
                    fontSize: '1rem', 
                    cursor: clockingLoading ? 'not-allowed' : 'pointer', 
                    opacity: clockingLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {clockingLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      {(myAttendance && myAttendance.clockIn && myAttendance.clockIn !== '--:--') ? <LogOut size={18} /> : <LogIn size={18} />}
                      {(myAttendance && myAttendance.clockIn && myAttendance.clockIn !== '--:--') ? 'Clock Out Now' : 'Clock In Now'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {showLeavesModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#D97706" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Leave Management</h3>
                </div>
                <button onClick={() => setShowLeavesModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ background: '#F8FAFC', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Total Quota</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0F172A' }}>{leaveBalances?.totalLimit || 12}d</div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Annual Limit</div>
                </div>
                <div style={{ background: '#EFF6FF', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: '700', textTransform: 'uppercase' }}>EL Left</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#2563EB' }}>{leaveBalances?.earnedLeave?.remaining ?? 6}d</div>
                  <div style={{ fontSize: '0.65rem', color: '#60A5FA' }}>out of 6 max</div>
                </div>
                <div style={{ background: '#ECFDF5', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: '700', textTransform: 'uppercase' }}>Medical Left</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#059669' }}>{leaveBalances?.medicalLeave?.remaining ?? 6}d</div>
                  <div style={{ fontSize: '0.65rem', color: '#34D399' }}>out of 6 max</div>
                </div>
                <div style={{ background: '#FFFBEB', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: '700', textTransform: 'uppercase' }}>Pending</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#F59E0B' }}>{pendingLeaves}</div>
                  <div style={{ fontSize: '0.65rem', color: '#FBBF24' }}>In Review</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                {myLeaves.length > 0 ? myLeaves.map((l, i) => (
                  <div key={l._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>{l.type}</span>
                        {l.salaryDeductionAmount > 0 && (
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: '6px' }}>
                            -₹{l.salaryDeductionAmount.toLocaleString('en-IN')} Salary
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: l.status === 'Approved' ? '#10B981' : l.status === 'Rejected' ? '#DC2626' : '#F59E0B' }}>{l.status}</span>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>No leaves found</div>
                )}
              </div>

              <button 
                onClick={() => { setShowLeavesModal(false); setShowApplyLeaveForm(true); }}
                style={{ width: '100%', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '1rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Apply for Leave
              </button>
            </div>
          </div>
        )}

        {showApplyLeaveForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '490px',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#D97706" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Apply for Leave</h3>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>12 Annual Quota (6 EL + 6 Medical) + Emergency Leave</span>
                  </div>
                </div>
                <button onClick={() => { setShowApplyLeaveForm(false); setShowLeavesModal(true); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>Leave Type *</label>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      color: leaveType.includes('Emergency') ? '#DC2626' : leaveType.includes('Medical') ? '#059669' : '#2563EB', 
                      fontWeight: '700' 
                    }}>
                      {leaveType.includes('Emergency')
                        ? `Quota-free (Salary deduction if > quota)`
                        : leaveType.includes('Medical')
                        ? `Available: ${leaveBalances?.medicalLeave?.remaining ?? 6} of 6 days`
                        : `Available: ${leaveBalances?.earnedLeave?.remaining ?? 6} of 6 days`}
                    </span>
                  </div>
                  <select value={leaveType} onChange={(e) => { setLeaveType(e.target.value); setModalError(''); }} style={modalInputStyle}>
                    <option value="Earned Leave (EL)">Earned Leave (EL) - 6 Days Yearly</option>
                    <option value="Medical Leave">Medical Leave - 6 Days Yearly</option>
                    <option value="Emergency Leave">Emergency Leave (Exceeding quota incurs salary deduction)</option>
                  </select>
                </div>

                {/* EMERGENCY LEAVE INFO BANNER */}
                {leaveType.includes('Emergency') && (
                  <div style={{
                    padding: '0.75rem 0.95rem',
                    background: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    color: '#9F1239',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                      <AlertCircle size={15} color="#E11D48" /> Emergency Leave Policy Notice:
                    </div>
                    <span style={{ lineHeight: '1.4' }}>
                      Emergency leave can be requested beyond your regular quota. If the number of leave days extends your remaining quota ({leaveBalances?.totalRemaining ?? 0} days remaining), <strong>a proportional amount from your monthly salary will be deducted</strong> (₹{Math.round(((profileData?.baseSalary || 30000) / 30)).toLocaleString('en-IN')}/day) upon approval.
                    </span>
                  </div>
                )}

                {modalError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.8rem 1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    color: '#B91C1C',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    lineHeight: '1.4'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{modalError}</span>
                  </div>
                )}

                {dateError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    color: '#B91C1C',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    <AlertCircle size={15} />
                    <span>{dateError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      min={todayStr}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setStartDate(newStart);
                        if (endDate && newStart > endDate) {
                          setEndDate(newStart);
                        }
                        if (dateError) setDateError('');
                      }} 
                      required 
                      style={{
                        ...modalInputStyle,
                        borderColor: dateError ? '#EF4444' : '#E2E8F0'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      min={startDate || todayStr}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (dateError) setDateError('');
                      }} 
                      required 
                      style={{
                        ...modalInputStyle,
                        borderColor: dateError ? '#EF4444' : '#E2E8F0'
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Reason for Leave</label>
                  <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} required style={{ ...modalInputStyle, height: '80px', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { setShowApplyLeaveForm(false); setShowLeavesModal(true); setDateError(''); }} style={{ flex: 1, background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submittingLeave} style={{ flex: 1.5, background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '700', cursor: submittingLeave ? 'not-allowed' : 'pointer' }}>{submittingLeave ? 'Submitting...' : 'Submit Application'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg, valueColor = '#0F172A', onClick, badgeText = 'View all' }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        background: '#FFFFFF', 
        borderRadius: '18px', 
        padding: '1.35rem', 
        border: '1px solid #E2E8F0', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem', 
        boxShadow: hovered ? '0 10px 25px -5px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.25s ease-out',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: iconBg, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0 
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#3B82F6', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
          {badgeText}
        </span>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.2rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.65rem', fontWeight: '800', color: valueColor, fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>
          {value}
        </div>
      </div>
    </div>
  );
};

const ChartLegendItem = ({ color, label, count, total }) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontWeight: '600' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
        <span>{label}</span>
      </div>
      <div style={{ color: '#0F172A', fontWeight: '500' }}>
        <span style={{ fontWeight: '700', marginRight: '0.35rem' }}>{count}</span>
        <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>({percentage}%)</span>
      </div>
    </div>
  );
};

const modalInputStyle = {
  width: '100%',
  background: '#F8FAFC', 
  border: '1px solid #CBD5E1', 
  borderRadius: '10px', 
  padding: '0.65rem 0.85rem', 
  color: '#0F172A', 
  outline: 'none', 
  fontSize: '0.85rem',
  fontWeight: '500',
  fontFamily: "'Plus Jakarta Sans', sans-serif"
};

export default StaffDashboard;
