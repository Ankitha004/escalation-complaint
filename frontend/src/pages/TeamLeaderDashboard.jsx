import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TLSidebar from '../components/TLSidebar';
import API from '../services/api';
import { 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  Eye, 
  Search, 
  RefreshCw, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  Check,
  CalendarDays,
  XCircle,
  Users,
  Bell,
  Clock3,
  CalendarX2,
  ListTodo
} from 'lucide-react';

const TeamLeaderDashboard = ({ initialTab = 'overview' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Normalize activeTab
  const tabFromQuery = searchParams.get('tab');
  const rawTab = tabFromQuery || initialTab || 'overview';
  const normalizedInitialTab = (rawTab === 'dashboard' || !['complaints', 'assigned', 'my_staff', 'sla', 'leaves'].includes(rawTab)) ? 'overview' : rawTab;
  
  const [activeTab, setActiveTab] = useState(normalizedInitialTab);

  useEffect(() => {
    const currentRaw = searchParams.get('tab') || initialTab || 'overview';
    const norm = (currentRaw === 'dashboard' || !['complaints', 'assigned', 'my_staff', 'sla', 'leaves'].includes(currentRaw)) ? 'overview' : currentRaw;
    setActiveTab(norm);
  }, [searchParams, initialTab]);

  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // States
  const [complaints, setComplaints] = useState([]);
  const [myStaff, setMyStaff] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    criticalCount: 0,
    escalatedCount: 0,
    slaBreachWarningCount: 0,
    slaAdherenceRate: null
  });

  // Filters State for Complaints
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const fetchTLComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get('/teamleader/complaints');
      const data = res.data || {};
      const list = data.complaints || (Array.isArray(data) ? data : []);

      if (Array.isArray(list)) {
        setComplaints(list);
        setStats({
          totalAssigned: list.length,
          pending: list.filter(c => ['Submitted', 'Pending', 'Waiting on User'].includes(c.status)).length,
          inProgress: list.filter(c => c.status === 'In Progress').length,
          resolved: list.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
          criticalCount: list.filter(c => c.priority === 'Critical' || c.priority === 'High').length,
          escalatedCount: list.filter(c => c.status === 'Escalated' || c.escalated === true).length,
          slaBreachWarningCount: list.filter(c => c.slaStatus === 'Breached' || c.slaStatus === 'Warning').length,
          slaAdherenceRate: null // Currently no API for SLA percentage
        });
        setErrorMsg('');
      }
    } catch (err) {
      console.error('Backend fetch error for complaints:', err);
      setErrorMsg('Unable to load team complaints.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStaff = async () => {
    setLoadingStaff(true);
    try {
      let res;
      try {
        res = await API.get('/teamleader/my-staff');
      } catch (e) {
        res = await API.get('/hr/my-staff');
      }
      setMyStaff(res.data || []);
    } catch (err) {
      console.error('Backend fetch error for staff:', err);
    } finally {
      setLoadingStaff(false);
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
    fetchTLComplaints();
    fetchMyStaff();
    fetchLeaves();
  }, []);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  
  // Complaint filtering
  let filteredComplaints = safeComplaints;
  
  // Tab specific filtering
  if (activeTab === 'assigned') {
    filteredComplaints = safeComplaints.filter(c => !['Resolved', 'Closed'].includes(c.status));
  } else if (activeTab === 'sla') {
    filteredComplaints = safeComplaints.filter(c => c.status === 'Escalated' || c.escalated === true || c.slaStatus === 'Breached');
  }
  
  filteredComplaints = filteredComplaints.filter((c) => {
    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || c.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All Priority' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All Categories' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusBadge = (status) => {
    const s = status || 'Open';
    if (['Submitted', 'Open', 'Pending'].includes(s)) return <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BFDBFE' }}>{s}</span>;
    if (s === 'In Progress') return <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BFDBFE' }}>{s}</span>;
    if (s === 'Waiting on User') return <span style={{ background: '#FFFBEB', color: '#D97706', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #FDE68A' }}>{s}</span>;
    if (['Resolved', 'Closed'].includes(s)) return <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BBF7D0' }}>{s}</span>;
    if (s === 'Escalated') return <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #FECACA' }}>{s}</span>;
    return <span style={{ background: '#F8FAFC', color: '#64748B', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>{s}</span>;
  };

  const isOverview = activeTab === 'overview' || activeTab === 'dashboard' || !['complaints', 'assigned', 'my_staff', 'sla', 'leaves'].includes(activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TLSidebar activeTab={isOverview ? 'dashboard' : activeTab} />

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#EFF6FF', color: '#2563EB', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> Team Leader Operations Desk
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.25rem 0' }}>
              {isOverview ? 'Dashboard Overview' : activeTab === 'assigned' ? 'Assigned Complaints' : activeTab === 'complaints' ? 'All Team Complaints' : activeTab === 'my_staff' ? 'Team Members' : activeTab === 'leaves' ? 'Leave Requests' : 'SLA & Escalation Analytics'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              Supervisor overview for <strong style={{ color: '#0F172A' }}>{user?.name || 'Supervisor'}</strong> | Direct Team Operations
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
              <CalendarDays size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button 
              onClick={() => { fetchTLComplaints(); fetchMyStaff(); fetchLeaves(); }} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: '#FFFFFF', 
                color: '#475569', 
                border: '1px solid #E2E8F0', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                fontWeight: '700', 
                fontSize: '0.85rem', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <RefreshCw size={14} className={loading || loadingStaff || loadingLeaves ? 'spin-icon' : ''} /> Refresh
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> {errorMsg}
          </div>
        )}

        {/* IS OVERVIEW DEFAULT VIEW */}
        {isOverview && (
          <>
            {/* TOP STATISTICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
              
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Assigned Tickets</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{stats.totalAssigned}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Pending Review</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock3 size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{stats.pending}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Active Leaves</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8B5CF6', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                  {leavesList.filter(l => l.status.startsWith('Pending')).length}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>SLA Compliance</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#94A3B8', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>
                  {stats.slaAdherenceRate !== null ? `${stats.slaAdherenceRate}%` : 'Data Unavailable'}
                </div>
              </div>

            </div>
          </>
        )}

        {/* COMPLAINTS TABLE VIEW */}
        {(isOverview || activeTab === 'complaints' || activeTab === 'assigned' || activeTab === 'sla') && (
          <>
            {/* MY TEAM COMPLAINTS - LARGEST SECTION */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ListTodo size={20} color="#0F172A" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Team Complaints</h2>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800' }}>{filteredComplaints.length} Records</span>
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
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.75rem', outline: 'none', background: '#F8FAFC', color: '#475569', fontWeight: '600' }}>
                    <option value="All Status">All Status</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting on User">Waiting on User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '1rem 1.5rem' }}>Complaint ID</th>
                      <th style={{ padding: '1rem' }}>Filer</th>
                      <th style={{ padding: '1rem' }}>Subject</th>
                      <th style={{ padding: '1rem' }}>Priority</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                          <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 1rem auto', display: 'block', color: '#2563EB' }} />
                          Loading complaints...
                        </td>
                      </tr>
                    ) : filteredComplaints.length > 0 ? (
                      filteredComplaints.map((c) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>{c.complaintId}</td>
                          <td style={{ padding: '1rem', color: '#0F172A', fontWeight: '600' }}>{c.staffName}</td>
                          <td style={{ padding: '1rem', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#EA580C' : '#64748B' }}>
                              {c.priority}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>{getStatusBadge(c.status)}</td>
                          <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/tl-complaint-details/${c._id}`)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                            >
                              <Eye size={14} /> Process Ticket
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                          <Inbox size={32} style={{ margin: '0 auto 0.75rem auto', display: 'block', color: '#CBD5E1' }} />
                          <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '0.25rem' }}>No Complaints Found</div>
                          <div style={{ fontSize: '0.8rem' }}>There are currently no complaints matching your criteria.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {isOverview && (
          <>
            {/* SECOND ROW: ATTENDANCE & TEAM MEMBERS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
              
              {/* Today's Team Attendance */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarX2 size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Today's Team Attendance</h3>
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                  <Users size={32} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.25rem 0' }}>Attendance monitoring is not currently available for your team.</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, maxWidth: '80%' }}>
                    The backend API for aggregating team attendance data is currently under development. Real data will appear here once supported.
                  </p>
                </div>
              </div>

              {/* Team Members Overview */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Members Overview</h3>
                    <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800' }}>{myStaff.length} Members</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px', paddingRight: '0.5rem' }}>
                  {loadingStaff ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}><RefreshCw size={20} className="spin-icon" /></div>
                  ) : myStaff.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {myStaff.map(staff => (
                        <div key={staff._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
                              {staff.name ? staff.name.substring(0, 2).toUpperCase() : 'ST'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{staff.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{staff.email}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563EB' }}>{staff.employeeId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>No staff assigned to your team.</div>
                  )}
                </div>
              </div>

            </div>

            {/* THIRD ROW: LEAVES & ESCALATION SUMMARY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
              
              {/* Leave Overview */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarDays size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Leave Overview</h3>
                    <span style={{ background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800' }}>
                      {leavesList.filter(l => l.status.startsWith('Pending')).length} Pending
                    </span>
                  </div>
                  <span onClick={() => navigate('/tl-leaves')} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563EB', cursor: 'pointer' }}>Manage Leaves &rarr;</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                  {loadingLeaves ? (
                     <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}><RefreshCw size={20} className="spin-icon" /></div>
                  ) : leavesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leavesList.slice(0, 3).map((leave, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{leave.employee?.name || 'Staff Member'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{leave.type} ({new Date(leave.startDate).toLocaleDateString()})</div>
                          </div>
                          <div>
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>No leave requests found.</div>
                  )}
                </div>
              </div>

              {/* SLA & Escalation Summary */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={20} color="#0F172A" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>SLA & Escalation Risks</h3>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Complaints Escalated to Manager</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>{stats.escalatedCount}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#DC2626' }}>SLA At Risk / Breached</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#DC2626' }}>{stats.slaBreachWarningCount}</div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.5rem 0 0 0', textAlign: 'center' }}>
                    * The escalation workflow automatically pushes unresolved complaints past SLA limits to Department Managers.
                  </p>
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 3: REPORTING STAFF (When accessed directly) */}
        {activeTab === 'my_staff' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
               <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Members List</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                    <th style={{ padding: '1rem 1.5rem' }}>Employee ID</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Email</th>
                    <th style={{ padding: '1rem' }}>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {myStaff.map((s) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '800', color: '#2563EB' }}>{s.employeeId}</td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#0F172A' }}>{s.name}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{s.email}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{s.designation || 'Staff Member'}</td>
                    </tr>
                  ))}
                  {myStaff.length === 0 && !loadingStaff && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>No team members assigned to you.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LEAVE APPROVALS (When accessed directly) */}
        {activeTab === 'leaves' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
               <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Leave Requests</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
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
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{leave.employee?.name || 'Unknown'}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {leave.employee?.employeeId}</span>
                      </td>
                      <td style={{ padding: '1rem', color: '#334155', fontWeight: '700' }}>{leave.type}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
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
                              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(leave._id, 'Rejected')}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leavesList.length === 0 && !loadingLeaves && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>No leaves requested by your team.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default TeamLeaderDashboard;
