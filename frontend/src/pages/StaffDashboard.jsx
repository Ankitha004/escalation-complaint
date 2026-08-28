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
  Check
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

  // Leave Form state
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [compRes, leaveRes, attRes, profileRes] = await Promise.all([
        API.get('/complaints/my'),
        API.get('/leaves/my'),
        API.get('/attendance/today'),
        API.get('/auth/me').catch(() => null)
      ]);

      if (profileRes && profileRes.data) {
        setProfileData(profileRes.data);
      }

      const compList = compRes.data.complaints || (Array.isArray(compRes.data) ? compRes.data : []);
      if (compList.length > 0) {
        const total = compList.length;
        const pending = compList.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
        const inProgress = compList.filter(c => c.status === 'In Progress' || c.status === 'Escalated' || c.status === 'Pending HR Approval').length;
        const resolved = compList.filter(c => c.status === 'Resolved').length;
        const closed = compList.filter(c => c.status === 'Closed').length;

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
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
      // Fallback only if server is completely offline
      setStats({
        totalComplaints: 0,
        pendingComplaints: 0,
        inProgressComplaints: 0,
        resolvedComplaints: 0,
        closedComplaints: 0
      });
      setRecentComplaints([]);
      setMyAttendance(null);
      setMyLeaves([]);
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

  const handleClockIn = async () => {
    try {
      const res = await API.post('/attendance');
      alert(res.data.message);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error clocking in/out');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leaves', {
        type: leaveType,
        startDate,
        endDate,
        reason: leaveReason
      });
      alert('Leave application submitted successfully!');
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting leave');
    }
  };

  const userName = profileData?.name || user?.name || 'User';
  const role = profileData?.role || user?.role || 'Staff';
  
  const getInitials = (name) => {
    if (!name || name === 'User') return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(userName);

  // Chart Data (Pending/Open, In Progress, Resolved, Closed)
  const chartData = {
    labels: ['Pending / Open', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [stats.pendingComplaints, stats.inProgressComplaints, stats.resolvedComplaints, stats.closedComplaints],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#9CA3AF'],
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
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  // Leave Stats Calculation
  const totalLeaves = myLeaves.length;
  const approvedLeaves = myLeaves.filter(l => l.status === 'Approved').length;
  const pendingLeaves = myLeaves.filter(l => l.status === 'Pending').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="dashboard" unreadCount={5} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E2E8F0', 
          padding: '0.85rem 2.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <Menu size={22} style={{ color: '#475569', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.875rem', fontWeight: '500' }}>
              <Calendar size={18} style={{ color: '#64748B' }} />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}</span>
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} style={{ color: '#475569' }} />
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                background: '#EF4444', 
                color: '#FFF', 
                fontSize: '0.65rem', 
                fontWeight: '800', 
                height: '18px',
                width: '18px',
                borderRadius: '50%', 
                border: '2px solid #FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                5
              </span>
            </div>

            <div 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)', 
                color: '#FFF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '700', 
                fontSize: '0.875rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)'
              }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A', lineHeight: '1.2' }}>{userName}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>{role}</span>
              </div>
              <ChevronDown size={16} style={{ color: '#64748B' }} />
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT */}
        <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
          
          {/* WELCOME BANNER */}
          <div style={{ 
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', 
            borderRadius: '24px', 
            padding: '2.5rem 3rem', 
            marginBottom: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.05)'
          }}>
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                Welcome back, {userName}! 👋
              </h1>
              <p style={{ color: '#475569', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>
                Manage your self-service tasks, check attendance, and track complaints.
              </p>
            </div>
            
            {/* Elegant glassmorphism graphic cards inside the welcome banner */}
            <div style={{
              position: 'absolute',
              right: '5%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              height: '140px',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
              opacity: 0.95
            }}>
              {/* Floating UI card 1 */}
              <div style={{
                width: '180px',
                height: '110px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: 'rotate(-4deg) translateY(10px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748B' }}>System SLA Status</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                </div>
                <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ flex: 1, height: '40%', background: '#E2E8F0', borderRadius: '2px' }} />
                  <div style={{ flex: 1, height: '60%', background: '#CBD5E1', borderRadius: '2px' }} />
                  <div style={{ flex: 1, height: '80%', background: '#94A3B8', borderRadius: '2px' }} />
                  <div style={{ flex: 1, height: '55%', background: '#CBD5E1', borderRadius: '2px' }} />
                  <div style={{ flex: 1, height: '95%', background: 'linear-gradient(to top, #3B82F6, #60A5FA)', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#0F172A' }}>98.4% Compliance</span>
              </div>
              
              {/* Floating UI card 2 */}
              <div style={{
                width: '130px',
                height: '90px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                borderRadius: '14px',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.2)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: 'rotate(4deg) translateY(-5px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>Active SLA</span>
                  <Activity size={12} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>100%</div>
                <span style={{ fontSize: '0.55rem', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>All clear</span>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            <StatCard 
              title="Total Complaints" 
              value={stats.totalComplaints} 
              icon={<FileText size={24} color="#3B82F6" />} 
              iconBg="#EFF6FF" 
              onClick={() => navigate('/my-complaints')} 
            />
            
            <StatCard 
              title="Pending / Open" 
              value={stats.pendingComplaints} 
              icon={<FileText size={24} color="#F59E0B" />} 
              iconBg="#FFFBEB" 
              valueColor="#F59E0B"
              onClick={() => navigate('/my-complaints')} 
            />
            
            <StatCard 
              title="Resolved Complaints" 
              value={stats.resolvedComplaints} 
              icon={<CheckCircle2 size={24} color="#10B981" />} 
              iconBg="#ECFDF5" 
              valueColor="#10B981"
              onClick={() => navigate('/my-complaints')} 
            />
            
            <StatCard 
              title="Attendance Status" 
              value={myAttendance ? myAttendance.status : 'Absent'} 
              icon={<Calendar size={24} color="#8B5CF6" />} 
              iconBg="#F5F3FF" 
              valueColor={myAttendance?.status === 'Present' ? '#10B981' : '#0F172A'}
              onClick={() => {
                const el = document.getElementById('attendance');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
              linkText="View attendance"
            />

          </div>

          {/* TWO COLUMN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* MY RECENT COMPLAINTS */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '20px', 
                padding: '1.75rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Recent Complaints</h3>
                  <span onClick={() => navigate('/my-complaints')} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentComplaints.length > 0 ? recentComplaints.map((c, idx) => {
                    let statusColor = '#3B82F6';
                    let statusBg = '#EFF6FF';
                    if (c.status === 'Resolved' || c.status === 'Closed') {
                      statusColor = '#10B981';
                      statusBg = '#ECFDF5';
                    } else if (c.status === 'Pending' || c.status === 'Submitted') {
                      statusColor = '#F59E0B';
                      statusBg = '#FFFBEB';
                    } else if (c.status === 'Escalated' || c.status === 'Rejected') {
                      statusColor = '#EF4444';
                      statusBg = '#FEF2F2';
                    } else if (c.status === 'Approved') {
                      statusColor = '#3B82F6';
                      statusBg = '#EFF6FF';
                    }
                    
                    return (
                      <div key={c._id || idx} style={{ 
                        padding: '1rem 0', 
                        borderBottom: idx !== recentComplaints.length - 1 ? '1px solid #F1F5F9' : 'none', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
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
                            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.875rem', marginBottom: '0.2rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title || c.subject}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>
                              #{c.complaintId} • {c.category}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <span style={{ 
                              background: statusBg, 
                              color: statusColor, 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.7rem', 
                              fontWeight: '700', 
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em'
                            }}>
                              {c.status}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '500' }}>
                              {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <ChevronRight size={16} style={{ color: '#94A3B8', cursor: 'pointer' }} onClick={() => navigate(`/complaint-details/${c._id}`)} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>No recent complaints found.</p>
                    </div>
                  )}
                </div>
                
                {recentComplaints.length > 0 && (
                  <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                    <span onClick={() => navigate('/my-complaints')} style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3B82F6', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Go to My Complaints <ChevronRight size={14} />
                    </span>
                  </div>
                )}
              </div>

              {/* COMPLAINT STATUS OVERVIEW */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '20px', 
                padding: '1.75rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid #E2E8F0' 
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: '0 0 1.5rem 0', fontFamily: "'Outfit', sans-serif" }}>Complaint Status Overview</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
                    {stats.totalComplaints > 0 ? (
                      <Doughnut data={chartData} options={chartOptions} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>No Data</div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    <ChartLegendItem color="#F59E0B" label="Pending / Open" count={stats.pendingComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#3B82F6" label="In Progress" count={stats.inProgressComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#10B981" label="Resolved" count={stats.resolvedComplaints} total={stats.totalComplaints} />
                    <ChartLegendItem color="#9CA3AF" label="Closed" count={stats.closedComplaints} total={stats.totalComplaints} />
                  </div>

                  {/* Status Helper Card */}
                  <div style={{ 
                    flex: 1,
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)', 
                    borderRadius: '16px', 
                    padding: '1rem',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563EB', fontWeight: '700', fontSize: '0.85rem' }}>
                      <BarChart2 size={16} />
                      <span>In Progress</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', fontWeight: '500', lineHeight: '1.4' }}>
                      Most of your complaints are currently being worked on.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* ATTENDANCE OVERVIEW */}
              <div id="attendance" style={{ 
                background: '#FFFFFF', 
                borderRadius: '20px', 
                padding: '1.75rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Attendance Overview</h3>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginBottom: '0.35rem' }}>Today</div>
                      <span style={{ 
                        background: myAttendance?.status === 'Present' ? '#ECFDF5' : '#FFF1F2', 
                        color: myAttendance?.status === 'Present' ? '#10B981' : '#F43F5E', 
                        padding: '3px 12px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700' 
                      }}>
                        {myAttendance ? myAttendance.status : 'Absent'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Working Hours</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>
                        {myAttendance && myAttendance.clockOut && myAttendance.clockOut !== 'In Progress' ? 'Completed' : '08:45 Hrs'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>Clock In</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: '700', color: '#10B981', fontSize: '0.85rem' }}>{myAttendance?.clockIn || '-- : --'}</span>
                        <div style={{ background: '#ECFDF5', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}><LogIn size={12} color="#10B981" /></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>Clock Out</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>{myAttendance?.clockOut && myAttendance.clockOut !== 'In Progress' ? myAttendance.clockOut : '-- : --'}</span>
                        <div style={{ background: '#FFF1F2', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}><LogOut size={12} color="#F43F5E" /></div>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ marginTop: '1.25rem' }}>
                   {myAttendance && myAttendance.clockOut !== 'In Progress' ? (
                      <div style={{ 
                        background: '#ECFDF5', 
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '12px', 
                        padding: '0.75rem 1rem', 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} color="#FFF" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065F46' }}>Attendance Completed</div>
                          <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '500' }}>Great job!</div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={handleClockIn} 
                        style={{ 
                          width: '100%', 
                          background: myAttendance ? '#0F172A' : '#3B82F6', 
                          color: '#FFFFFF', 
                          border: 'none', 
                          borderRadius: '10px', 
                          padding: '0.75rem', 
                          fontWeight: '600', 
                          fontSize: '0.85rem', 
                          cursor: 'pointer', 
                          transition: 'opacity 0.2s',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                        }}
                      >
                        {myAttendance ? 'Clock Out Now' : 'Clock In Now'}
                      </button>
                    )}
                </div>
              </div>

              {/* LEAVE SUMMARY */}
              <div id="leaves" style={{ 
                background: '#FFFFFF', 
                borderRadius: '20px', 
                padding: '1.75rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Leave Summary</h3>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: '700', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Leaves</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3B82F6' }}>{totalLeaves}</div>
                  </div>
                  <div style={{ width: '1px', background: '#E2E8F0' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Approved</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>{approvedLeaves}</div>
                  </div>
                  <div style={{ width: '1px', background: '#E2E8F0' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: '700', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Pending</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F59E0B' }}>{pendingLeaves}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.85rem' }}>Request Leave</h4>
                  <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    
                    <div style={{ position: 'relative' }}>
                      <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={inputStyle}>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={inputStyle} />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={inputStyle} />
                      </div>
                    </div>

                    <textarea 
                      value={leaveReason} 
                      onChange={(e) => setLeaveReason(e.target.value)} 
                      required 
                      placeholder="Reason for leave..." 
                      style={{...inputStyle, height: '65px', resize: 'none'}} 
                    />

                    <button type="submit" style={{ 
                      background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)', 
                      color: '#FFFFFF', 
                      border: 'none', 
                      borderRadius: '10px', 
                      padding: '0.75rem', 
                      fontWeight: '600', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
                    }}>
                      Submit Application
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>

              {/* NOTIFICATIONS WIDGET */}
              <div style={{ 
                background: '#FFFFFF', 
                borderRadius: '20px', 
                padding: '1.75rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Notifications</h3>
                  <span onClick={() => navigate('/notifications')} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#EFF6FF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Bell size={14} color="#3B82F6" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500', lineHeight: '1.4' }}>
                        Your complaint #CMP-2025-0012 status updated to In Progress.
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem', fontWeight: '500' }}>10 mins ago</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#ECFDF5', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <MessageSquare size={14} color="#10B981" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500', lineHeight: '1.4' }}>
                        You have a new message from Team Leader.
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem', fontWeight: '500' }}>1 hour ago</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: '#FFFBEB', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Clock size={14} color="#F59E0B" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500', lineHeight: '1.4' }}>
                        Reminder: Complete your attendance for today.
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem', fontWeight: '500' }}>2 hours ago</div>
                    </div>
                  </div>

                </div>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                  <span onClick={() => navigate('/notifications')} style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3B82F6', cursor: 'pointer' }}>
                    Go to Notifications →
                  </span>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg, valueColor = '#0F172A', onClick, linkText = 'View all' }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        background: '#FFFFFF', 
        borderRadius: '20px', 
        padding: '1.5rem', 
        border: '1px solid #E2E8F0', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.25rem', 
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ 
          width: '46px', 
          height: '46px', 
          borderRadius: '14px', 
          background: iconBg, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0 
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: valueColor, fontFamily: "'Outfit', sans-serif", margin: '0', lineHeight: '1.2' }}>
            {value}
          </div>
        </div>
      </div>
      <div style={{ 
        fontSize: '0.78rem', 
        color: '#3B82F6', 
        fontWeight: '700', 
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {linkText} <ChevronRight size={14} />
      </div>
    </div>
  );
};

const ChartLegendItem = ({ color, label, count, total }) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '600' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
        {label}
      </div>
      <div style={{ color: '#0F172A', fontWeight: '500' }}>
        <span style={{ fontWeight: '700', marginRight: '0.4rem' }}>{count}</span>
        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({percentage}%)</span>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  background: '#F8FAFC', 
  border: '1px solid #E2E8F0', 
  borderRadius: '10px', 
  padding: '0.65rem 0.85rem', 
  color: '#0F172A', 
  outline: 'none', 
  fontSize: '0.8rem',
  fontWeight: '500',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'border-color 0.2s',
  ':focus': {
    borderColor: '#3B82F6'
  }
};

export default StaffDashboard;
