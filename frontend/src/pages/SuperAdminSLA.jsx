import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  PlusCircle,
  X,
  Layers,
  Check,
  Building,
  User,
  Sliders,
  ChevronRight,
  History,
  Timer
} from 'lucide-react';

const PRIORITY_SLA_HOURS = {
  'Critical': 4,
  'High': 24,
  'Medium': 48,
  'Low': 72
};

const SuperAdminSLA = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [triggeringEscalation, setTriggeringEscalation] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [slaStatusFilter, setSlaStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [extendModalComplaint, setExtendModalComplaint] = useState(null);
  const [extensionHours, setExtensionHours] = useState(6);
  const [extensionReason, setExtensionReason] = useState('');
  const [extending, setExtending] = useState(false);

  const [logsModalComplaint, setLogsModalComplaint] = useState(null);

  const fetchSLAComplaints = async () => {
    setLoading(true);
    try {
      const [compRes, deptRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/departments')
      ]);

      setComplaints(compRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to load SLA complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLAComplaints();
  }, []);

  // Trigger manual SLA evaluation
  const handleTriggerSlaCheck = async () => {
    setTriggeringEscalation(true);
    setTriggerMessage('');
    try {
      const res = await API.post('/complaints/trigger-sla-check');
      setTriggerMessage(res.data?.message || 'SLA evaluation engine executed successfully.');
      await fetchSLAComplaints();
      setTimeout(() => setTriggerMessage(''), 4000);
    } catch (err) {
      setTriggerMessage('Failed to run escalation engine.');
    } finally {
      setTriggeringEscalation(false);
    }
  };

  // Helper to compute SLA metrics per complaint
  const computeSlaMetrics = (c) => {
    const priority = c.priority || 'Medium';
    const totalAllowedHours = PRIORITY_SLA_HOURS[priority] || 48;
    const allowedMs = totalAllowedHours * 60 * 60 * 1000;

    const createdAt = new Date(c.createdAt || new Date());
    const deadline = new Date(createdAt.getTime() + allowedMs + ((c.totalPausedDuration || 0) * 60000));
    const now = new Date();

    const isResolved = ['Resolved', 'Closed', 'Approved'].includes(c.status);
    const isPaused = c.status === 'Waiting on User' || Boolean(c.slaPausedAt);

    // Calculate time diff
    const remainingMs = deadline - now;
    const remainingMins = Math.floor(remainingMs / 60000);
    const elapsedMs = now - createdAt;
    const consumedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / (allowedMs + ((c.totalPausedDuration || 0) * 60000))) * 100)));

    let slaStatus = 'On Track';
    let statusColor = '#16A34A';
    let statusBg = '#DCFCE7';
    let statusBorder = '#86EFAC';

    if (isResolved) {
      slaStatus = 'Resolved within SLA';
      statusColor = '#059669';
      statusBg = '#ECFDF5';
      statusBorder = '#A7F3D0';
    } else if (c.escalatedToSuperAdmin || c.escalationLevel >= 2) {
      slaStatus = 'Escalated to Super Admin';
      statusColor = '#991B1B';
      statusBg = '#FEE2E2';
      statusBorder = '#F87171';
    } else if (c.escalated || c.escalationLevel === 1 || c.status === 'Escalated') {
      slaStatus = 'Escalated to Manager';
      statusColor = '#DC2626';
      statusBg = '#FEF2F2';
      statusBorder = '#FCA5A5';
    } else if (remainingMins <= 0) {
      slaStatus = 'SLA Breached';
      statusColor = '#DC2626';
      statusBg = '#FEF2F2';
      statusBorder = '#FCA5A5';
    } else if (remainingMins <= 120 || consumedPercent >= 75) {
      slaStatus = 'At Risk (Approaching SLA)';
      statusColor = '#D97706';
      statusBg = '#FEF3C7';
      statusBorder = '#FDE68A';
    }

    return {
      deadline,
      remainingMins,
      consumedPercent,
      slaStatus,
      statusColor,
      statusBg,
      statusBorder,
      isResolved,
      isPaused,
      totalAllowedHours
    };
  };

  // Helper to format remaining time
  const formatRemainingTime = (mins, isResolved) => {
    if (isResolved) return '✓ Completed';
    const absMins = Math.abs(mins);
    const hours = Math.floor(absMins / 60);
    const remMins = absMins % 60;

    if (mins >= 0) {
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `+${days}d ${hours % 24}h remaining`;
      }
      return `+${hours}h ${remMins}m remaining`;
    } else {
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `-${days}d ${hours % 24}h overdue`;
      }
      return `-${hours}h ${remMins}m overdue`;
    }
  };

  // Open Extend SLA Modal
  const handleOpenExtendModal = (c) => {
    setExtendModalComplaint(c);
    setExtensionHours(6);
    setExtensionReason('');
  };

  // Save SLA Extension
  const handleSaveExtension = async (e) => {
    e.preventDefault();
    if (!extendModalComplaint) return;

    setExtending(true);
    try {
      const res = await API.put(`/complaints/${extendModalComplaint._id}/extend-sla`, {
        hours: Number(extensionHours),
        reason: extensionReason
      });

      const updated = res.data;
      setComplaints(prev =>
        prev.map(c => (c._id === extendModalComplaint._id ? { ...c, ...updated } : c))
      );

      setExtendModalComplaint(null);
    } catch (err) {
      alert('Failed to extend SLA deadline.');
    } finally {
      setExtending(false);
    }
  };

  // Filter complaints
  const processedComplaints = complaints.map(c => ({
    ...c,
    metrics: computeSlaMetrics(c)
  }));

  const filteredComplaints = processedComplaints.filter(c => {
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

    const matchesPriority = priorityFilter === 'All' ? true : c.priority === priorityFilter;
    const matchesDept = departmentFilter === 'All' ? true : dept === departmentFilter;

    let matchesSla = true;
    if (slaStatusFilter === 'OnTrack') matchesSla = c.metrics.slaStatus === 'On Track';
    if (slaStatusFilter === 'AtRisk') matchesSla = c.metrics.slaStatus.includes('At Risk');
    if (slaStatusFilter === 'Breached') matchesSla = c.metrics.slaStatus.includes('Breached');
    if (slaStatusFilter === 'Escalated') matchesSla = c.metrics.slaStatus.includes('Escalated');
    if (slaStatusFilter === 'Resolved') matchesSla = c.metrics.isResolved;

    return matchesSearch && matchesPriority && matchesDept && matchesSla;
  });

  // Calculate live summary analytics
  const activeCount = processedComplaints.filter(c => !c.metrics.isResolved).length;
  const onTrackCount = processedComplaints.filter(c => c.metrics.slaStatus === 'On Track').length;
  const atRiskCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('At Risk')).length;
  const breachedCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('Breached')).length;
  const escalatedCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('Escalated')).length;
  const complianceRate = complaints.length > 0 
    ? Math.round(((complaints.length - breachedCount - escalatedCount) / complaints.length) * 100) 
    : 100;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="sla" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Enterprise SLA Monitoring & Auto-Escalation
              </h1>
              <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Automated Node-Cron Active
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time countdown tracking, automated multi-tier escalation triggers, SLA breach alerts, and deadline overrides.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handleTriggerSlaCheck}
              disabled={triggeringEscalation}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: triggeringEscalation ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              <Zap size={16} />
              {triggeringEscalation ? 'Evaluating Deadlines...' : 'Run Auto-Escalation Engine'}
            </button>

            <button 
              onClick={fetchSLAComplaints} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.65rem 1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Sync
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {triggerMessage && (
          <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {triggerMessage}
          </div>
        )}

        {/* METRICS DASHBOARD CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          
          {/* TOTAL ACTIVE */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Timer size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ACTIVE UNDER SLA</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {activeCount} Active
              </div>
            </div>
          </div>

          {/* ON TRACK */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>🟢 ON TRACK (WITHIN SLA)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#16A34A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {onTrackCount} Tickets
              </div>
            </div>
          </div>

          {/* AT RISK */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>🟡 AT RISK (APPROACHING)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {atRiskCount} Tickets
              </div>
            </div>
          </div>

          {/* SLA BREACHED */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>🔴 SLA BREACHED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {breachedCount} Tickets
              </div>
            </div>
          </div>

          {/* ESCALATED COMPLAINTS */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>⬆️ ESCALATED (L1/L2)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#7C3AED', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {escalatedCount} Escalated
              </div>
            </div>
          </div>
        </div>

        {/* SLA RULES EXPLANATION BANNER */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0F172A' }}>Active SLA Resolution Windows by Severity</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                <strong>Critical:</strong> 4h &bull; <strong>High:</strong> 24h &bull; <strong>Medium:</strong> 48h &bull; <strong>Low:</strong> 72h &bull; Auto-escalates to Manager on breach &rarr; Super Admin on secondary breach.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Overall SLA Compliance:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: complianceRate >= 80 ? '#16A34A' : '#DC2626', fontFamily: "'Outfit', sans-serif" }}>
              {complianceRate}%
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', flex: '1 1 280px', maxWidth: '360px' }}>
            <Search size={16} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search by Ticket ID, Subject, Handler..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.85rem', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* SLA STATUS FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Clock size={13} color="#64748B" />
              <select 
                value={slaStatusFilter} 
                onChange={e => setSlaStatusFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All SLA States</option>
                <option value="OnTrack">🟢 On Track (Within SLA)</option>
                <option value="AtRisk">🟡 At Risk (Approaching)</option>
                <option value="Breached">🔴 SLA Breached</option>
                <option value="Escalated">⬆️ Escalated (L1/L2)</option>
                <option value="Resolved">✓ Resolved within SLA</option>
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
                <option value="Critical">Critical (4h)</option>
                <option value="High">High (24h)</option>
                <option value="Medium">Medium (48h)</option>
                <option value="Low">Low (72h)</option>
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

          </div>
        </div>

        {/* SLA LIVE MONITORING TABLE */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '6rem', textAlign: 'center' }}>
            <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>Calculating Live SLA Countdown Windows...</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle}>Ticket & Priority</th>
                    <th style={thStyle}>Subject & Dept</th>
                    <th style={thStyle}>Assigned Resolver & Tier</th>
                    <th style={thStyle}>SLA Target Deadline</th>
                    <th style={thStyle}>Time Countdown</th>
                    <th style={thStyle}>SLA Status & Progress</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>SLA Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4.5rem', textAlign: 'center', color: '#64748B' }}>
                        <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem', color: '#16A34A', display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>No Breached Complaints</div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>All active complaints are within target SLA parameters.</p>
                      </td>
                    </tr>
                  ) : filteredComplaints.map(c => {
                    const m = c.metrics;
                    const handlerName = c.assignedTo?.name || c.assignedTeamLeader?.name || c.departmentManager?.name || c.teamLeader || 'Unassigned';
                    const handlerRole = c.assignedTo?.role || c.assignedTeamLeader?.role || (c.departmentManager ? 'Manager' : 'Team Leader');

                    let tierBadge = 'Tier 1 (Team Leader)';
                    if (c.escalatedToSuperAdmin || c.escalationLevel >= 2) tierBadge = 'Tier 3 (Super Admin)';
                    else if (c.escalated || c.escalationLevel === 1) tierBadge = 'Tier 2 (Manager Escalated)';

                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        
                        {/* TICKET ID & PRIORITY */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', fontWeight: '800', color: '#2563EB' }}>
                            {c.complaintId}
                          </div>
                          <div style={{ marginTop: '3px' }}>
                            <span style={{ 
                              background: c.priority === 'Critical' ? '#FEF2F2' : c.priority === 'High' ? '#FFF7ED' : '#EFF6FF', 
                              color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#EA580C' : '#2563EB', 
                              border: `1px solid ${c.priority === 'Critical' ? '#FCA5A5' : c.priority === 'High' ? '#FED7AA' : '#BFDBFE'}`, 
                              fontSize: '0.68rem', 
                              fontWeight: '800', 
                              padding: '2px 7px', 
                              borderRadius: '6px', 
                              textTransform: 'uppercase' 
                            }}>
                              {c.priority} ({m.totalAllowedHours}h SLA)
                            </span>
                          </div>
                        </td>

                        {/* SUBJECT & DEPT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '200px', maxWidth: '260px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.subject}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                            {c.responsibleDepartment?.name || c.department || 'General'}
                          </div>
                        </td>

                        {/* HANDLER & TIER */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '180px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.82rem' }}>
                            {handlerName}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '1px' }}>
                            {handlerRole}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.65rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>
                              {tierBadge}
                            </span>
                          </div>
                        </td>

                        {/* TARGET DEADLINE */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '160px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0F172A' }}>
                            {new Date(m.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
                            at {new Date(m.deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* TIME COUNTDOWN */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '160px' }}>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontWeight: '800', 
                            fontSize: '0.82rem',
                            color: m.remainingMins < 0 ? '#DC2626' : m.remainingMins <= 120 ? '#D97706' : '#16A34A'
                          }}>
                            <Clock size={13} />
                            {formatRemainingTime(m.remainingMins, m.isResolved)}
                          </div>
                          {m.isPaused && (
                            <div style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: '700', marginTop: '2px' }}>
                              ⏸️ SLA Timer Paused
                            </div>
                          )}
                        </td>

                        {/* SLA STATUS & PROGRESS BAR */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '190px' }}>
                          <div>
                            <span style={{ 
                              background: m.statusBg, 
                              color: m.statusColor, 
                              border: `1px solid ${m.statusBorder}`, 
                              fontSize: '0.7rem', 
                              fontWeight: '800', 
                              padding: '2px 8px', 
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {m.slaStatus}
                            </span>
                          </div>
                          {/* SLA PROGRESS CONSUMPTION BAR */}
                          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${m.consumedPercent}%`, 
                              height: '100%', 
                              background: m.remainingMins < 0 ? '#DC2626' : m.consumedPercent >= 75 ? '#D97706' : '#16A34A',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </td>

                        {/* SLA ACTIONS */}
                        <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right', minWidth: '150px' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {!m.isResolved && (
                              <button 
                                onClick={() => handleOpenExtendModal(c)}
                                title="Extend SLA Deadline (+Hours Grace)"
                                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <PlusCircle size={12} /> Extend
                              </button>
                            )}

                            <button 
                              onClick={() => setLogsModalComplaint(c)}
                              title="View SLA Timeline History"
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <History size={12} /> Logs
                            </button>
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

      {/* EXTEND SLA DEADLINE MODAL */}
      {extendModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '460px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Extend SLA Target Deadline
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>
                  {extendModalComplaint.complaintId} &bull; {extendModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setExtendModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveExtension} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Grace Period to Add (Hours) *
                </label>
                <select value={extensionHours} onChange={e => setExtensionHours(e.target.value)} style={inputStyle}>
                  <option value={2}>+2 Hours Grace</option>
                  <option value={4}>+4 Hours Grace</option>
                  <option value={6}>+6 Hours Grace</option>
                  <option value={12}>+12 Hours Grace</option>
                  <option value={24}>+24 Hours (1 Day Extension)</option>
                  <option value={48}>+48 Hours (2 Days Extension)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Super Admin Justification / Reason *
                </label>
                <input 
                  type="text" 
                  required
                  value={extensionReason} 
                  onChange={e => setExtensionReason(e.target.value)} 
                  placeholder="e.g. Third-party vendor delay, executive extension granted"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={extending} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: extending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                  {extending && <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  Grant SLA Extension
                </button>
                <button type="button" onClick={() => setExtendModalComplaint(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLA TIMELINE LOGS MODAL */}
      {logsModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  SLA Event History & Audit Log
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>
                  {logsModalComplaint.complaintId} &bull; {logsModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setLogsModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!logsModalComplaint.timeline || logsModalComplaint.timeline.length === 0 ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>No SLA events recorded.</div>
              ) : (
                logsModalComplaint.timeline.map((t, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.82rem', color: '#0F172A' }}>{t.title}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>{t.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #F1F5F9', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setLogsModalComplaint(null)} style={{ padding: '0.6rem 1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>
                Close Logs
              </button>
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

export default SuperAdminSLA;
