import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import API from '../services/api';
import {
  FolderOpen,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  UserCog,
  Eye,
  Edit3,
  MessageSquare,
  ShieldAlert,
  Send,
  X,
  Calendar,
  Layers,
  ChevronDown,
  Building,
  User,
  Star,
  Check,
  RotateCcw,
  Activity,
  Award,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

const PRIORITY_COLORS = {
  'Critical': { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  'High':     { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  'Medium':   { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'Low':      { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

const STATUS_COLORS = {
  'Resolved':            { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  'Closed':              { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  'Approved':            { bg: '#ECFDF5', color: '#059669', border: '#6EE7B7' },
  'In Progress':         { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'Waiting on User':     { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  'Escalated':           { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  'Escalated to Super Admin': { bg: '#4C1D95', color: '#FFFFFF', border: '#5B21B6' },
  'Pending':             { bg: '#FFFBEB', color: '#B45309', border: '#FCD34D' },
  'Submitted':           { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  'Pending HR Review':   { bg: '#FDF2F8', color: '#DB2777', border: '#FBCFE8' },
  'Rejected':            { bg: '#FEE2E2', color: '#991B1B', border: '#F87171' },
  'Cancelled':           { bg: '#F1F5F9', color: '#94A3B8', border: '#CBD5E1' },
};

const HRComplaints = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [escalationFilter, setEscalationFilter] = useState('All');

  // Modals
  const [manageModalComplaint, setManageModalComplaint] = useState(null);
  const [timelineModalComplaint, setTimelineModalComplaint] = useState(null);
  const [resolutionModalComplaint, setResolutionModalComplaint] = useState(null);

  // Manage Form State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedHandler, setSelectedHandler] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Timeline Admin Comment State
  const [adminComment, setAdminComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [compRes, usersRes, deptRes] = await Promise.all([
        API.get('/hr/complaints'),
        API.get('/users'),
        API.get('/departments')
      ]);

      setComplaints(compRes.data || []);
      
      const allUsers = usersRes.data || [];
      const resolvers = allUsers.filter(u => ['Team Leader', 'Manager'].includes(u.role));
      setTeamLeaders(resolvers);
      
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to load HR complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helper to calculate time since raised
  const formatTimeSince = (dateString) => {
    if (!dateString) return 'N/A';
    const raised = new Date(dateString);
    const now = new Date();
    const diffMs = now - raised;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ago`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m ago`;
    if (diffMins > 0) return `${diffMins} mins ago`;
    return 'Just now';
  };

  // Open Manage Modal
  const handleOpenManageModal = (c) => {
    setManageModalComplaint(c);
    setSelectedStatus(c.status || 'Pending');
    setSelectedPriority(c.priority || 'Medium');
    setSelectedHandler(c.assignedTo?._id || c.assignedTeamLeader?._id || '');
    setStatusComment('');
  };

  // Submit Manage Action
  const handleSaveManage = async (e) => {
    e.preventDefault();
    if (!manageModalComplaint) return;

    setSavingAction(true);
    try {
      const payload = {
        status: selectedStatus,
        priority: selectedPriority,
        comment: statusComment || `HR updated status to ${selectedStatus}`
      };

      const res = await API.put(`/complaints/${manageModalComplaint._id}`, payload);
      const updated = res.data;

      setComplaints(prev =>
        prev.map(c => (c._id === manageModalComplaint._id ? { ...c, ...updated } : c))
      );

      setManageModalComplaint(null);
    } catch (err) {
      alert('Failed to update complaint.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleAddAdminComment = async (e) => {
    e.preventDefault();
    if (!timelineModalComplaint || !adminComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await API.put(`/complaints/${timelineModalComplaint._id}`, {
        comment: `[HR Note]: ${adminComment.trim()}`,
        timelineTitle: 'HR Oversight Note',
        timelineDescription: adminComment.trim()
      });

      const updated = res.data;
      setTimelineModalComplaint(updated);
      setComplaints(prev =>
        prev.map(c => (c._id === updated._id ? { ...c, ...updated } : c))
      );
      setAdminComment('');
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const sName = c.createdBy?.name || c.staffName || '';
    const sId = c.createdBy?.employeeId || c.staffId || '';
    const dept = c.responsibleDepartment?.name || c.department || '';
    const handler = c.assignedTo?.name || c.assignedTeamLeader?.name || c.departmentManager?.name || c.teamLeader || '';

    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handler.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' ? true : c.priority === priorityFilter;
    const matchesDept = departmentFilter === 'All' ? true : dept === departmentFilter;

    let matchesEscalation = true;
    if (escalationFilter === 'Escalated') matchesEscalation = Boolean(c.escalated || c.escalatedToSuperAdmin);
    if (escalationFilter === 'SuperAdmin') matchesEscalation = Boolean(c.escalatedToSuperAdmin || c.escalationLevel >= 2);
    if (escalationFilter === 'Normal') matchesEscalation = !c.escalated && !c.escalatedToSuperAdmin;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept && matchesEscalation;
  });

  // Calculate live statistics
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(c => ['In Progress', 'Waiting on User', 'Pending HR Review'].includes(c.status)).length;
  const escalatedCount = complaints.filter(c => c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated').length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <HRSidebar activeTab="hr-complaints" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Enterprise Complaint Control Center
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                HR Master View
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time monitoring across all departments, complaint handlers, resolution timelines, and automated SLA escalations.
            </p>
          </div>

          <button 
            onClick={fetchAllData} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Feed
          </button>
        </div>

        {/* SUMMARY METRICS TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderOpen size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL COMPLAINTS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {totalCount} Raised
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Across all departments</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>IN PROGRESS / ACTIVE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#EA580C', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {inProgressCount} Tickets
              </div>
              <div style={{ fontSize: '0.7rem', color: '#EA580C', fontWeight: '600', marginTop: '2px' }}>Being handled currently</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ESCALATED TICKETS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {escalatedCount} Escalated
              </div>
              <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>SLA breach warnings</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLVED & CLOSED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {resolvedCount} ({resolutionRate}%)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>Verified resolutions</div>
            </div>
          </div>
        </div>

        {/* ADVANCED MULTI-DIMENSIONAL FILTER TOOLBAR */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', flex: '1 1 280px', maxWidth: '360px' }}>
            <Search size={16} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search by Ticket ID, Subject, Complainant, or Handler..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.85rem', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* STATUS FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Filter size={13} color="#64748B" />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on User">Waiting on User</option>
                <option value="Resolved">Resolved</option>
                <option value="Approved">Approved</option>
                <option value="Closed">Closed</option>
                <option value="Escalated">Escalated</option>
                <option value="Pending HR Review">Pending HR Review</option>
              </select>
            </div>

            {/* PRIORITY FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <AlertCircle size={13} color="#64748B" />
              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* DEPARTMENT FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Building size={13} color="#64748B" />
              <select 
                value={departmentFilter} 
                onChange={e => setDepartmentFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d._id || d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* ESCALATION FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <ShieldAlert size={13} color="#DC2626" />
              <select 
                value={escalationFilter} 
                onChange={e => setEscalationFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#DC2626', cursor: 'pointer' }}
              >
                <option value="All">All Escalation States</option>
                <option value="Escalated">All Escalated</option>
                <option value="SuperAdmin">Escalated to Super Admin</option>
                <option value="Normal">Normal / Not Escalated</option>
              </select>
            </div>

          </div>
        </div>

        {/* MASTER COMPLAINTS TABLE */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '6rem', textAlign: 'center' }}>
            <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>Loading Organization Complaint Stream...</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle}>Ticket & Priority</th>
                    <th style={thStyle}>Subject & Category</th>
                    <th style={thStyle}>Complainant / Dept</th>
                    <th style={thStyle}>Raised & Elapsed</th>
                    <th style={thStyle}>Handling Handler</th>
                    <th style={thStyle}>Current Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4.5rem', textAlign: 'center', color: '#64748B' }}>
                        <Inbox size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>No Complaints Found</div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>No complaints match the specified search or filter criteria.</p>
                      </td>
                    </tr>
                  ) : filteredComplaints.map(c => {
                    const prio = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS['Medium'];
                    const st = STATUS_COLORS[c.status] || STATUS_COLORS['Pending'];
                    const isEscalated = c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated';
                    const handlerName = c.assignedTo?.name || c.assignedTeamLeader?.name || c.departmentManager?.name || c.teamLeader || 'Unassigned';
                    const handlerRole = c.assignedTo?.role || c.assignedTeamLeader?.role || (c.departmentManager ? 'Manager' : '');

                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9', background: isEscalated ? '#FFFDFD' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background= isEscalated ? '#FFFDFD' : 'transparent'}>
                        
                        {/* TICKET ID & PRIORITY */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span 
                              onClick={() => navigate(`/hr-complaint-details/${c._id}`)}
                              style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', fontWeight: '800', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {c.complaintId}
                            </span>
                            {c.escalatedToSuperAdmin && (
                              <span title="Escalated to Super Admin Level" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>
                                L2
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.3rem' }}>
                            <span style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`, fontSize: '0.68rem', fontWeight: '800', padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase' }}>
                              {c.priority || 'Medium'}
                            </span>
                          </div>
                        </td>

                        {/* SUBJECT & CATEGORY */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '220px', maxWidth: '280px' }}>
                          <div 
                            onClick={() => navigate(`/hr-complaint-details/${c._id}`)}
                            style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                          >
                            {c.subject}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px' }}>
                            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem', fontWeight: '600', padding: '1px 6px', borderRadius: '4px' }}>
                              {c.category}
                            </span>
                            {c.attachments && c.attachments.length > 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Paperclip size={11} /> {c.attachments.length}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* COMPLAINANT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '160px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>
                            {c.createdBy?.name || c.staffName || 'Staff Member'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                            {c.createdBy?.employeeId || c.staffId || 'ID-N/A'} &bull; {c.responsibleDepartment?.name || c.department || 'General'}
                          </div>
                        </td>

                        {/* RAISED DATE & TIME SINCE */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', color: '#0F172A' }}>
                            <Clock size={13} color="#64748B" />
                            {formatTimeSince(c.createdAt)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        {/* HANDLER */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '170px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: handlerName === 'Unassigned' ? '#F1F5F9' : '#EFF6FF', color: handlerName === 'Unassigned' ? '#94A3B8' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800' }}>
                              {handlerName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: handlerName === 'Unassigned' ? '#94A3B8' : '#0F172A', fontSize: '0.82rem' }}>
                                {handlerName}
                              </div>
                              {handlerRole && (
                                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{handlerRole}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '160px' }}>
                          <span style={{ 
                            background: st.bg, 
                            color: st.color, 
                            border: `1px solid ${st.border}`, 
                            fontSize: '0.72rem', 
                            fontWeight: '800', 
                            padding: '3px 9px', 
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {c.status === 'Resolved' && <Check size={11} />}
                            {(c.status === 'Escalated' || c.status === 'Escalated to Super Admin') && <ShieldAlert size={11} />}
                            {c.status}
                          </span>
                          {c.feedbackRating && (
                            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F59E0B', marginTop: '3px' }}>
                              ★ {c.feedbackRating} / 5
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right', minWidth: '190px' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              onClick={() => navigate(`/hr-complaint-details/${c._id}`)}
                              title="Act Upon & Resolve Complaint"
                              style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.42rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                            >
                              <Eye size={13} /> View & Act
                            </button>

                            <button 
                              onClick={() => setTimelineModalComplaint(c)}
                              title="View Full History Timeline"
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '0.42rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Layers size={12} /> Timeline
                            </button>

                            {['Resolved', 'Closed', 'Approved'].includes(c.status) && (
                              <button 
                                onClick={() => setResolutionModalComplaint(c)}
                                title="View Resolution Report"
                                style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', padding: '0.42rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Award size={12} /> Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MANAGE STATUS & REASSIGN MODAL */}
      {manageModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '500px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Manage Complaint Status & Assignment
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: '700' }}>
                  {manageModalComplaint.complaintId} &bull; {manageModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setManageModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveManage} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* CURRENT STATUS SELECTOR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Update Lifecycle Status *
                </label>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={inputStyle}>
                  <option value="Pending">Pending (Initial)</option>
                  <option value="In Progress">In Progress (Under Investigation)</option>
                  <option value="Waiting on User">Waiting on User (Pause SLA)</option>
                  <option value="Resolved">Resolved (Resolution Complete)</option>
                  <option value="Approved">Approved by Manager/HR</option>
                  <option value="Closed">Closed & Archived</option>
                  <option value="Escalated">Escalated (Critical)</option>
                  <option value="Escalated to Super Admin">Escalated to Super Admin</option>
                  <option value="Pending HR Review">Pending HR Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* REASSIGN HANDLER */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Reassign Handler / Resolver
                </label>
                <select value={selectedHandler} onChange={e => setSelectedHandler(e.target.value)} style={inputStyle}>
                  <option value="">-- Leave Unassigned / Keep Current --</option>
                  {teamLeaders.map(tl => (
                    <option key={tl._id || tl.id} value={tl._id || tl.id}>
                      {tl.name} ({tl.role} - {tl.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* PRIORITY SELECTOR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Severity / Priority Level
                </label>
                <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} style={inputStyle}>
                  <option value="Critical">Critical (Fast SLA)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* AUDIT REMARK */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                  HR Audit Log / Note
                </label>
                <input 
                  type="text" 
                  value={statusComment} 
                  onChange={e => setStatusComment(e.target.value)} 
                  placeholder="e.g. Expedited ticket per executive request"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={savingAction} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: savingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                  {savingAction && <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  Apply Updates to Database
                </button>
                <button type="button" onClick={() => setManageModalComplaint(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE TIMELINE & HISTORY DRAWER/MODAL */}
      {timelineModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '680px', width: '100%', maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            {/* TIMELINE HEADER */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: '800', color: '#2563EB' }}>
                    {timelineModalComplaint.complaintId}
                  </span>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
                    {timelineModalComplaint.category}
                  </span>
                </div>
                <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.05rem', fontWeight: '800', color: '#0F172A' }}>
                  {timelineModalComplaint.subject}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  Raised by {timelineModalComplaint.createdBy?.name || timelineModalComplaint.staffName} ({timelineModalComplaint.responsibleDepartment?.name || timelineModalComplaint.department}) &bull; {formatTimeSince(timelineModalComplaint.createdAt)}
                </p>
              </div>
              <button onClick={() => setTimelineModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            {/* TIMELINE BODY */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* DESCRIPTION CARD */}
              <div style={{ background: '#F8FAFC', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Original Complaint Description</div>
                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                  {timelineModalComplaint.description}
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} color="#2563EB" /> Chronological Event History
                </div>

                {!timelineModalComplaint.timeline || timelineModalComplaint.timeline.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No events recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '1.25rem', borderLeft: '2px solid #E2E8F0', marginLeft: '0.5rem' }}>
                    {timelineModalComplaint.timeline.map((t, idx) => (
                      <div key={idx} style={{ position: 'relative', background: '#FFFFFF', border: '1px solid #F1F5F9', padding: '0.75rem 1rem', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ position: 'absolute', left: '-1.7rem', top: '12px', width: '12px', height: '12px', borderRadius: '50%', background: '#2563EB', border: '2px solid #FFFFFF' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>{t.title}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {t.timestamp ? new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                            {t.description}
                          </div>
                        )}
                        {t.updatedByName && (
                          <div style={{ fontSize: '0.68rem', color: '#2563EB', fontWeight: '600', marginTop: '4px' }}>
                            By {t.updatedByName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMMENTS THREAD */}
              {timelineModalComplaint.comments && timelineModalComplaint.comments.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={14} color="#7C3AED" /> Discussion Messages
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {timelineModalComplaint.comments.map((cm, i) => (
                      <div key={i} style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0F172A' }}>
                            {cm.senderName} ({cm.senderRole})
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            {cm.createdAt ? new Date(cm.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>{cm.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ADD HR OVERSIGHT COMMENT */}
            <form onSubmit={handleAddAdminComment} style={{ padding: '1rem 1.75rem', borderTop: '1px solid #F1F5F9', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>Add HR Note</div>
                <textarea 
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Enter a note or observation... This will be visible in the timeline."
                  style={{ ...inputStyle, flex: 1, minHeight: '60px', resize: 'vertical' }} 
                />
              <button type="submit" disabled={submittingComment || !adminComment.trim()} style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.65rem 1.1rem', fontWeight: '700', fontSize: '0.82rem', cursor: (submittingComment || !adminComment.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION DETAILS & FEEDBACK MODAL */}
      {resolutionModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '520px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={20} color="#16A34A" />
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                    Resolution & Feedback Review
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  Ticket: <strong>{resolutionModalComplaint.complaintId}</strong> &bull; {resolutionModalComplaint.subject}
                </div>
              </div>
              <button onClick={() => setResolutionModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* RESOLUTION STATUS */}
              <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#065F46' }}>OFFICIALLY RESOLVED</span>
                  <span style={{ fontSize: '0.72rem', color: '#047857' }}>
                    {resolutionModalComplaint.resolvedDate ? new Date(resolutionModalComplaint.resolvedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date N/A'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: '600' }}>
                  Handler: {resolutionModalComplaint.assignedTo?.name || resolutionModalComplaint.assignedTeamLeader?.name || 'Department Team'}
                </div>
              </div>

              {/* RESOLUTION REPORTS IF ANY */}
              {resolutionModalComplaint.resolutionReports && resolutionModalComplaint.resolutionReports.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Resolver Report
                  </div>
                  {resolutionModalComplaint.resolutionReports.map((r, i) => (
                    <div key={i} style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.78rem', color: '#2563EB', marginBottom: '2px' }}>
                        By {r.solverName || 'Resolver'} ({r.solverRole || 'Team Leader'})
                      </div>
                      {r.reportText}
                    </div>
                  ))}
                </div>
              )}

              {/* USER FEEDBACK & RATING */}
              <div style={{ background: '#FFFBEB', padding: '1rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Complainant Satisfaction Feedback
                </div>
                {resolutionModalComplaint.feedbackRating ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                      {[1,2,3,4,5].map(st => (
                        <Star key={st} size={15} fill={st <= resolutionModalComplaint.feedbackRating ? '#F59E0B' : 'none'} color={st <= resolutionModalComplaint.feedbackRating ? '#F59E0B' : '#CBD5E1'} />
                      ))}
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#92400E', marginLeft: '6px' }}>
                        {resolutionModalComplaint.feedbackRating} / 5 Stars
                      </span>
                    </div>
                    {resolutionModalComplaint.feedbackComment && (
                      <div style={{ fontSize: '0.82rem', color: '#78350F', fontStyle: 'italic', marginTop: '4px' }}>
                        "{resolutionModalComplaint.feedbackComment}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#B45309' }}>
                    Staff has not submitted feedback rating yet.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => setResolutionModalComplaint(null)} style={{ padding: '0.65rem 1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '1.1rem 1.25rem',
  fontSize: '0.72rem',
  fontWeight: '800',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap'
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

export default HRComplaints;
