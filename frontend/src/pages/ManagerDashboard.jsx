import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { AuthContext } from '../context/AuthContext';
import ManagerSidebar from '../components/ManagerSidebar';
import API from '../services/api';
import { 
  Clock, 
  CheckCircle2, 
  Inbox, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  ShieldAlert,
  Check,
  XCircle,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Activity,
  ArrowRight,
  Eye,
  BarChart3,
  AlertCircle,
  FolderOpen,
  Users,
  Award,
  Sparkles,
  Sliders,
  UserCheck,
  Building
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
);

const ManagerDashboard = ({ initialTab = 'overview' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [error, setError] = useState('');

  // Department name
  const [departmentName, setDepartmentName] = useState('');

  // Stats & Complaints State
  const [complaints, setComplaints] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingReview: 0,
    escalatedToManager: 0,
    slaAtRisk: 0,
    resolved: 0
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    setActiveTab(initialTab || 'overview');
  }, [initialTab]);

  const fetchManagerComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/manager/complaints');
      const data = res.data || {};
      const list = data.complaints || [];
      
      setComplaints(Array.isArray(list) ? list : []);
      setDepartmentName(data.departmentName || '');
      setStats(data.stats || {
        totalComplaints: 0,
        pendingReview: 0,
        escalatedToManager: 0,
        slaAtRisk: 0,
        resolved: 0
      });
    } catch (err) {
      console.error('Failed to fetch department complaints:', err);
      setError(err.response?.data?.message || 'Failed to load department complaints. Please try again.');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await API.get('/leaves');
      setLeavesList(res.data || []);
    } catch (err) {
      console.error('Backend fetch error for leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleLeaveDecision = async (leaveId, decision) => {
    try {
      const res = await API.put(`/leaves/${leaveId}/status`, { status: decision });
      alert(res.data.message || `Leave ${decision} successfully!`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing leave decision.');
    }
  };

  useEffect(() => {
    fetchManagerComplaints();
    fetchLeaves();
  }, []);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredComplaints = safeComplaints.filter((c) => {
    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || c.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'All Priority' || c.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Chart Data: Complaint Status Overview (Doughnut)
  const statusCounts = safeComplaints.reduce((acc, c) => {
    const s = c.status || 'Pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusColorMap = {
    'Pending': '#F59E0B',
    'Submitted': '#F59E0B',
    'In Progress': '#2563EB',
    'Escalated': '#DC2626',
    'Resolved': '#16A34A',
    'Closed': '#059669',
    'Approved': '#10B981',
    'Waiting on User': '#D97706',
    'Rejected': '#EF4444',
    'Cancelled': '#6B7280',
    'Pending HR Review': '#8B5CF6'
  };

  const statusLabels = Object.keys(statusCounts);
  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusLabels.map(l => statusCounts[l]),
        backgroundColor: statusLabels.map(l => statusColorMap[l] || '#94A3B8'),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  // Chart Data: Department Complaint Trend (Line)
  const dateCounts = safeComplaints.reduce((acc, c) => {
    const d = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
  const lineData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Complaints',
        data: sortedDates.map(d => dateCounts[d]),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const userName = user?.name || 'Manager';

  // Status badge helper
  const getStatusBadge = (status) => {
    const s = status || 'Pending';
    if (['Submitted', 'Open', 'Pending'].includes(s)) return <span style={{ background: '#FFFBEB', color: '#D97706', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #FDE68A' }}>{s}</span>;
    if (s === 'In Progress') return <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BFDBFE' }}>{s}</span>;
    if (s === 'Escalated') return <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #FECACA' }}>{s}</span>;
    if (['Resolved', 'Closed', 'Approved'].includes(s)) return <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BBF7D0' }}>{s}</span>;
    if (s === 'Waiting on User') return <span style={{ background: '#FFFBEB', color: '#D97706', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #FDE68A' }}>{s}</span>;
    if (s === 'Pending HR Review') return <span style={{ background: '#F5F3FF', color: '#7C3AED', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #DDD6FE' }}>{s}</span>;
    return <span style={{ background: '#F8FAFC', color: '#64748B', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #E2E8F0' }}>{s}</span>;
  };

  // Priority badge helper
  const getPriorityBadge = (priority) => {
    const p = priority || 'Medium';
    if (p === 'Critical') return <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FECACA' }}>{p}</span>;
    if (p === 'High') return <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#EA580C', background: '#FFF7ED', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FED7AA' }}>{p}</span>;
    if (p === 'Medium') return <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#D97706', background: '#FFFBEB', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>{p}</span>;
    return <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', background: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>{p}</span>;
  };

  // SLA status badge helper
  const getSlaBadge = (slaStatus) => {
    if (slaStatus === 'Breached') return <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#DC2626', background: '#FEF2F2', padding: '2px 6px', borderRadius: '6px', border: '1px solid #FECACA' }}>Breached</span>;
    if (slaStatus === 'Warning') return <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#EA580C', background: '#FFF7ED', padding: '2px 6px', borderRadius: '6px', border: '1px solid #FED7AA' }}>At Risk</span>;
    if (slaStatus === 'Escalated') return <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#DC2626', background: '#FEF2F2', padding: '2px 6px', borderRadius: '6px', border: '1px solid #FECACA' }}>Escalated</span>;
    if (slaStatus === 'Resolved') return <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#16A34A', background: '#F0FDF4', padding: '2px 6px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>Resolved</span>;
    return <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#16A34A', background: '#F0FDF4', padding: '2px 6px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>On Track</span>;
  };

  const isOverview = activeTab === 'overview' || activeTab === 'dashboard';
  const isComplaints = activeTab === 'complaints';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FE', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab={activeTab === 'leaves' ? 'leaves' : activeTab === 'complaints' ? 'complaints' : 'dashboard'} />

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* EXECUTIVE HEADER BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                {activeTab === 'leaves' ? 'Leave Approval Center' : `${departmentName || 'Department'} Executive Control Center`}
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Department Manager View
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time department complaint surveillance, Team Leader performance, SLA compliance, and leave management.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => { fetchManagerComplaints(); fetchLeaves(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <RefreshCw size={15} style={{ animation: (loading || loadingLeaves) ? 'spin 1s linear infinite' : 'none' }} /> Sync
            </button>
          </div>
        </div>

        {activeTab === 'leaves' ? (
          /* LEAVE APPROVALS TAB */
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CalendarDays size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Leave Requests</h2>
              <span style={{ background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #FDE68A' }}>
                {leavesList.filter(l => l.status && l.status.startsWith('Pending')).length} Pending
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                    <th style={{ padding: '1rem 1.5rem' }}>Employee</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Duration</th>
                    <th style={{ padding: '1rem' }}>Reason</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesList.map((leave, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F59E0B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
                            {(leave.employee?.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>{leave.employee?.name || 'Unknown'}</div>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>ID: {leave.employee?.employeeId}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#334155', fontWeight: '700' }}>{leave.type}</td>
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8rem' }}>
                        {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leave.reason}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          background: leave.status === 'Approved' ? '#F0FDF4' : leave.status === 'Rejected' ? '#FEF2F2' : '#FFFBEB', 
                          color: leave.status === 'Approved' ? '#16A34A' : leave.status === 'Rejected' ? '#DC2626' : '#D97706', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          border: leave.status === 'Approved' ? '1px solid #BBF7D0' : leave.status === 'Rejected' ? '1px solid #FECACA' : '1px solid #FDE68A'
                        }}>
                          {leave.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        {leave.status.startsWith('Pending') && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleLeaveDecision(leave._id, 'Approved')}
                              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', transition: 'all 0.2s ease' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(leave._id, 'Rejected')}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', transition: 'all 0.2s ease' }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leavesList.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                        <Inbox size={32} style={{ margin: '0 auto 0.75rem auto', display: 'block', color: '#CBD5E1' }} />
                        <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '0.25rem' }}>No Leave Requests</div>
                        <div style={{ fontSize: '0.8rem' }}>There are currently no leave requests to review.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* STANDARD DASHBOARD / COMPLAINTS VIEW */
          <>
            {/* ERROR STATE */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} color="#DC2626" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#DC2626', fontSize: '0.9rem' }}>{error}</div>
                </div>
                <button onClick={fetchManagerComplaints} style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>Retry</button>
              </div>
            )}

            {/* EXECUTIVE KPI TILES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              
              {/* TOTAL DEPT COMPLAINTS */}
              <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FolderOpen size={22}/>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>DEPARTMENT COMPLAINTS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                    {stats.totalComplaints}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: '600', marginTop: '2px' }}>
                    {stats.pendingReview} pending review
                  </div>
                </div>
              </div>

              {/* RESOLVED TICKETS */}
              <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={22}/>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLVED & CLEARED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                    {stats.resolved}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                    {stats.totalComplaints > 0 ? Math.round((stats.resolved / stats.totalComplaints) * 100) : 100}% clearance rate
                  </div>
                </div>
              </div>

              {/* ESCALATED TICKETS */}
              <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldAlert size={22}/>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ESCALATED & AT RISK</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                    {stats.escalatedToManager}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>
                    {stats.slaAtRisk} SLA at risk
                  </div>
                </div>
              </div>

              {/* PENDING LEAVES */}
              <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarDays size={22}/>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>PENDING LEAVES</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                    {leavesList.filter(l => l.status && l.status.startsWith('Pending')).length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: '600', marginTop: '2px' }}>
                    {leavesList.length} total leave requests
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK COMMAND CENTER SHORTCUTS */}
            {isOverview && (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="#2563EB" /> Quick Command Shortcuts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
                  
                  <button 
                    onClick={() => navigate('/manager-complaints')}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <FolderOpen size={18} />
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Dept Complaints</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Department tickets</div>
                  </button>

                  <button 
                    onClick={() => navigate('/manager-performance')}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF9C3', color: '#854D0E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <Award size={18} />
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>TL Performance</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Team Leader metrics</div>
                  </button>

                  <button 
                    onClick={() => navigate('/manager-sla')}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <Clock size={18} />
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>SLA Analytics</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Department countdowns</div>
                  </button>

                  <button 
                    onClick={() => navigate('/manager-leaves')}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <CalendarDays size={18} />
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Leave Approvals</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Staff leave requests</div>
                  </button>

                  <button 
                    onClick={() => navigate('/manager-resolved')}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Resolved History</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Closed department tickets</div>
                  </button>

                </div>
              </div>
            )}

            {/* ANALYTICS CHARTS ROW — Only on overview */}
            {isOverview && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
                
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <BarChart3 size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Department Complaint Trend</h3>
                  </div>
                  <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
                    {sortedDates.length > 0 ? (
                      <Line data={lineData} options={{ 
                        maintainAspectRatio: false, 
                        plugins: { legend: { display: false } }, 
                        scales: { 
                          y: { grid: { color: '#F1F5F9' }, beginAtZero: true, ticks: { stepSize: 1, color: '#94A3B8', font: { size: 11 } } }, 
                          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } } 
                        } 
                      }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                        <Activity size={32} style={{ marginBottom: '0.75rem', color: '#CBD5E1' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>No trend data available</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <TrendingUp size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Complaint Status Overview</h3>
                  </div>
                  <div style={{ flex: 1, position: 'relative', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {statusLabels.length > 0 ? (
                      <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }, color: '#0F172A' } } } }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        <TrendingUp size={32} style={{ marginBottom: '0.75rem', color: '#CBD5E1' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>No data available</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* MAIN COMPLAINTS TABLE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ListTodo size={20} color="#0F172A" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Department Complaints</h2>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #BFDBFE' }}>{filteredComplaints.length} Records</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search ID, Name, Subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ padding: '0.45rem 1rem 0.45rem 2rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.75rem', outline: 'none', width: '220px', background: '#F8FAFC' }}
                    />
                  </div>
                  <select 
                    value={priorityFilter} 
                    onChange={(e) => setPriorityFilter(e.target.value)} 
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.75rem', outline: 'none', background: '#F8FAFC', color: '#475569', fontWeight: '600' }}
                  >
                    <option value="All Priority">All Priority</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.75rem', outline: 'none', background: '#F8FAFC', color: '#475569', fontWeight: '600' }}
                  >
                    <option value="All Status">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Waiting on User">Waiting on User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending HR Review">Pending HR Review</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '1rem 1.5rem' }}>Complaint ID</th>
                      <th style={{ padding: '1rem' }}>Staff / Requester</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Team Leader</th>
                      <th style={{ padding: '1rem' }}>Priority</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                          <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 1rem auto', display: 'block', color: '#F59E0B' }} />
                          Loading department complaints...
                        </td>
                      </tr>
                    ) : filteredComplaints.length > 0 ? (
                      filteredComplaints.map((c) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#FFFBF5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>{c.complaintId}</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800' }}>
                                {(c.staffName || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.8rem' }}>{c.staffName}</div>
                                {c.staffId && <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{c.staffId}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8rem' }}>{c.category || 'N/A'}</td>
                          <td style={{ padding: '1rem', color: '#475569', fontSize: '0.8rem' }}>{c.teamLeader || 'Unassigned'}</td>
                          <td style={{ padding: '1rem' }}>{getPriorityBadge(c.priority)}</td>
                          <td style={{ padding: '1rem' }}>{getStatusBadge(c.status)}</td>
                          <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/manager-complaint-details/${c._id}`)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F59E0B', color: '#FFFFFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(245,158,11,0.3)' }}
                            >
                              <Eye size={14} /> Review Complaint
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                          <Inbox size={32} style={{ margin: '0 auto 0.75rem auto', display: 'block', color: '#CBD5E1' }} />
                          <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '0.25rem' }}>No Complaints Found</div>
                          <div style={{ fontSize: '0.8rem' }}>No complaints found for your department.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTTOM WIDGETS ROW — Only on overview */}
            {isOverview && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
                
                {/* Leave Overview Widget */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CalendarDays size={20} color="#0F172A" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Leave Overview</h3>
                      <span style={{ background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #FDE68A' }}>
                        {leavesList.filter(l => l.status && l.status.startsWith('Pending')).length} Pending
                      </span>
                    </div>
                    <span onClick={() => navigate('/manager-leaves')} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Manage Leaves <ArrowRight size={12} /></span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                    {loadingLeaves ? (
                       <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}><RefreshCw size={20} className="spin-icon" /></div>
                    ) : leavesList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {leavesList.slice(0, 3).map((leave, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
                                {(leave.employee?.name || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{leave.employee?.name || 'Staff Member'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{leave.type} ({new Date(leave.startDate).toLocaleDateString()})</div>
                              </div>
                            </div>
                            <span style={{ 
                              background: leave.status === 'Approved' ? '#F0FDF4' : leave.status === 'Rejected' ? '#FEF2F2' : '#FFFBEB', 
                              color: leave.status === 'Approved' ? '#16A34A' : leave.status === 'Rejected' ? '#DC2626' : '#D97706', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.7rem', 
                              fontWeight: '700',
                              border: leave.status === 'Approved' ? '1px solid #BBF7D0' : leave.status === 'Rejected' ? '1px solid #FECACA' : '1px solid #FDE68A'
                            }}>
                              {leave.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>No leave requests found.</div>
                    )}
                  </div>
                </div>

                {/* SLA & Escalation Risk Summary */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertCircle size={20} color="#0F172A" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>SLA & Escalation Risks</h3>
                    </div>
                    <span onClick={() => navigate('/manager-sla')} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>View Reports <ArrowRight size={12} /></span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Complaints Pending Review</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' }}>Awaiting manager action</div>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>{stats.pendingReview}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#DC2626' }}>SLA At Risk / Breached</div>
                        <div style={{ fontSize: '0.7rem', color: '#F87171', marginTop: '0.15rem' }}>Tickets approaching deadline</div>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif" }}>
                        {stats.slaAtRisk}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#16A34A' }}>Resolved This Period</div>
                        <div style={{ fontSize: '0.7rem', color: '#4ADE80', marginTop: '0.15rem' }}>Successfully closed tickets</div>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>{stats.resolved}</div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.5rem 0 0 0', textAlign: 'center' }}>
                      * Complaints past the SLA deadline are automatically escalated to Super Admin.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default ManagerDashboard;
