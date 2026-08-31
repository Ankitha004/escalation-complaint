import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ManagerSidebar from '../components/ManagerSidebar';
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
  X,
  Layers,
  Check,
  Building,
  User,
  Sliders,
  ChevronRight,
  Timer
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PRIORITY_SLA_HOURS = {
  'Critical': 4,
  'High': 24,
  'Medium': 48,
  'Low': 72
};

const ManagerSLA = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [departmentName, setDepartmentName] = useState('Department');
  const [slaChartData, setSlaChartData] = useState({ labels: [], data: [] });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [slaStatusFilter, setSlaStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Timeline Modal
  const [timelineModalComplaint, setTimelineModalComplaint] = useState(null);

  const fetchSLAData = async () => {
    setLoading(true);
    try {
      const [resComplaints, resDept] = await Promise.all([
        API.get('/manager/complaints'),
        API.get('/manager/my-department').catch(() => ({ data: { departmentName: 'Department' } }))
      ]);

      const list = resComplaints.data?.complaints || (Array.isArray(resComplaints.data) ? resComplaints.data : []);
      setComplaints(list);
      
      if (resDept.data?.departmentName) {
        setDepartmentName(resDept.data.departmentName);
      }

      // Chart data calculation
      const dateMap = {};
      const breachedOrEscalated = list.filter(c => 
        c.status === 'Escalated' || 
        c.escalated || 
        c.escalatedToSuperAdmin ||
        c.isBreached ||
        c.slaStatus === 'Breached'
      );

      breachedOrEscalated.forEach(c => {
        const d = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + 1;
      });

      const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a + ', 2026') - new Date(b + ', 2026'));
      setSlaChartData({
        labels: sortedDates,
        data: sortedDates.map(d => dateMap[d])
      });
    } catch (err) {
      console.error('Failed to load Manager SLA complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLAData();
  }, []);

  // Compute SLA metrics per complaint
  const computeSlaMetrics = (c) => {
    const priority = c.priority || 'Medium';
    const totalAllowedHours = PRIORITY_SLA_HOURS[priority] || 48;
    const allowedMs = totalAllowedHours * 60 * 60 * 1000;

    const createdAt = new Date(c.createdAt || new Date());
    const deadline = new Date(createdAt.getTime() + allowedMs + ((c.totalPausedDuration || 0) * 60000));
    const now = new Date();

    const isResolved = ['Resolved', 'Closed', 'Approved'].includes(c.status);
    const isPaused = c.status === 'Waiting on User' || Boolean(c.slaPausedAt);

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

  // Filter complaints
  const processedComplaints = complaints.map(c => ({
    ...c,
    metrics: computeSlaMetrics(c)
  }));

  const filteredComplaints = processedComplaints.filter(c => {
    const sName = c.createdBy?.name || c.staffName || '';
    const sId = c.createdBy?.employeeId || c.staffId || '';
    const handler = c.assignedTo?.name || c.assignedTeamLeader?.name || c.teamLeader || '';

    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handler.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'All' ? true : c.priority === priorityFilter;

    let matchesSla = true;
    if (slaStatusFilter === 'OnTrack') matchesSla = c.metrics.slaStatus === 'On Track';
    if (slaStatusFilter === 'AtRisk') matchesSla = c.metrics.slaStatus.includes('At Risk');
    if (slaStatusFilter === 'Breached') matchesSla = c.metrics.slaStatus.includes('Breached');
    if (slaStatusFilter === 'Escalated') matchesSla = c.metrics.slaStatus.includes('Escalated');
    if (slaStatusFilter === 'Resolved') matchesSla = c.metrics.isResolved;

    return matchesSearch && matchesPriority && matchesSla;
  });

  // Calculate live summary analytics
  const activeCount = processedComplaints.filter(c => !c.metrics.isResolved).length;
  const onTrackCount = processedComplaints.filter(c => c.metrics.slaStatus === 'On Track').length;
  const atRiskCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('At Risk')).length;
  const breachedCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('Breached')).length;
  const escalatedCount = processedComplaints.filter(c => c.metrics.slaStatus.includes('Escalated')).length;
  const complianceRate = complaints.length > 0 
    ? Math.round(((complaints.length - breachedCount) / complaints.length) * 100) 
    : 100;

  // Chart configuration
  const chartData = {
    labels: slaChartData.labels,
    datasets: [
      {
        label: 'Department SLA Breaches & Escalations',
        data: slaChartData.data,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#DC2626',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' } } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { weight: 'bold' } } },
      x: { ticks: { font: { weight: 'bold' } } }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="sla_reports" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                {departmentName} SLA Analytics & Monitoring
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Department Escalation Active
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time SLA countdown tracking, breach risk detection, and resolution timelines for {departmentName}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={fetchSLAData} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.65rem 1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Sync
            </button>
          </div>
        </div>

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
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>⬆️ ESCALATED (MANAGER/HR)</div>
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
                <strong>Critical:</strong> 4h &bull; <strong>High:</strong> 24h &bull; <strong>Medium:</strong> 48h &bull; <strong>Low:</strong> 72h &bull; Auto-escalates to Manager on SLA breach &rarr; HR / Super Admin on L2 breach.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Department SLA Compliance:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: complianceRate >= 80 ? '#16A34A' : '#DC2626', fontFamily: "'Outfit', sans-serif" }}>
              {complianceRate}%
            </span>
          </div>
        </div>

        {/* CHART SECTION */}
        <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#DC2626" /> SLA Breach & Escalation Timeline
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : slaChartData.labels.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '700' }}>
                No SLA Breaches or Escalations Recorded
              </div>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text"
                placeholder="Search ticket ID, subject, staff name, employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', background: '#F8FAFC' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* SLA Status Filter */}
            <select 
              value={slaStatusFilter} 
              onChange={e => setSlaStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '600', color: '#334155', background: '#F8FAFC', cursor: 'pointer' }}
            >
              <option value="All">All SLA Statuses</option>
              <option value="OnTrack">🟢 On Track</option>
              <option value="AtRisk">🟡 At Risk</option>
              <option value="Breached">🔴 SLA Breached</option>
              <option value="Escalated">⬆️ Escalated</option>
              <option value="Resolved">✓ Resolved</option>
            </select>

            {/* Priority Filter */}
            <select 
              value={priorityFilter} 
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '600', color: '#334155', background: '#F8FAFC', cursor: 'pointer' }}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (4h)</option>
              <option value="High">High (24h)</option>
              <option value="Medium">Medium (48h)</option>
              <option value="Low">Low (72h)</option>
            </select>
          </div>
        </div>

        {/* SLA TRACKING DATA TABLE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                Department SLA Monitor Grid
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                Showing {filteredComplaints.length} of {complaints.length} department tickets
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={28} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: '700' }}>Calculating SLA deadlines and metrics...</div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              <Clock size={36} style={{ margin: '0 auto 1rem auto', color: '#CBD5E1' }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#475569' }}>No tickets match the selected SLA criteria</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '800', fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem 1.25rem' }}>Ticket & Priority</th>
                    <th style={{ padding: '1rem 1.25rem' }}>Subject & Category</th>
                    <th style={{ padding: '1rem 1.25rem' }}>Complainant</th>
                    <th style={{ padding: '1rem 1.25rem' }}>SLA Countdown Timer</th>
                    <th style={{ padding: '1rem 1.25rem' }}>SLA Progress</th>
                    <th style={{ padding: '1rem 1.25rem' }}>Current Status</th>
                    <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => {
                    const m = c.metrics;
                    const remainingLabel = formatRemainingTime(m.remainingMins, m.isResolved);
                    const sName = c.createdBy?.name || c.staffName || 'Staff Member';
                    const sId = c.createdBy?.employeeId || c.staffId || 'ID-N/A';

                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        
                        {/* TICKET ID */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <span 
                            onClick={() => navigate(`/manager-complaint-details/${c._id}`)} 
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', fontWeight: '800', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {c.complaintId}
                          </span>
                          <div style={{ marginTop: '0.3rem' }}>
                            <span style={{ 
                              background: c.priority === 'Critical' ? '#FEF2F2' : c.priority === 'High' ? '#FFF7ED' : '#EFF6FF',
                              color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#EA580C' : '#2563EB',
                              border: `1px solid ${c.priority === 'Critical' ? '#FCA5A5' : c.priority === 'High' ? '#FED7AA' : '#BFDBFE'}`,
                              fontSize: '0.68rem', fontWeight: '800', padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase'
                            }}>
                              {c.priority || 'Medium'} ({m.totalAllowedHours}h)
                            </span>
                          </div>
                        </td>

                        {/* SUBJECT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '220px', maxWidth: '280px' }}>
                          <div 
                            onClick={() => navigate(`/manager-complaint-details/${c._id}`)}
                            style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                          >
                            {c.subject}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
                            {c.category}
                          </div>
                        </td>

                        {/* COMPLAINANT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>{sName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>{sId}</div>
                        </td>

                        {/* COUNTDOWN TIMER */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '170px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '800', color: m.isResolved ? '#059669' : m.remainingMins <= 0 ? '#DC2626' : m.remainingMins <= 120 ? '#D97706' : '#2563EB' }}>
                            <Clock size={14} />
                            {remainingLabel}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                            Due: {m.deadline.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* SLA PROGRESS BAR */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: '800', marginBottom: '4px', color: '#475569' }}>
                            <span>{m.consumedPercent}% consumed</span>
                            {m.isPaused && <span style={{ color: '#D97706' }}>⏸ PAUSED</span>}
                          </div>
                          <div style={{ width: '100%', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${m.consumedPercent}%`,
                              height: '100%',
                              background: m.isResolved ? '#10B981' : m.consumedPercent >= 100 ? '#DC2626' : m.consumedPercent >= 75 ? '#F59E0B' : '#2563EB',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </td>

                        {/* CURRENT SLA STATUS */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '170px' }}>
                          <span style={{
                            background: m.statusBg,
                            color: m.statusColor,
                            border: `1px solid ${m.statusBorder}`,
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {m.isResolved && <Check size={11} />}
                            {m.slaStatus.includes('Escalated') && <ShieldAlert size={11} />}
                            {m.slaStatus}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right', minWidth: '160px' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              onClick={() => navigate(`/manager-complaint-details/${c._id}`)}
                              title="View & Manage Complaint"
                              style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.42rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                            >
                              <ChevronRight size={13} /> View Details
                            </button>

                            <button 
                              onClick={() => setTimelineModalComplaint(c)}
                              title="View Audit History Timeline"
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '0.42rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Layers size={12} /> Timeline
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* TIMELINE LOGS MODAL */}
      {timelineModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', maxWidth: '650px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Complaint Audit History & SLA Logs
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: '700' }}>
                  {timelineModalComplaint.complaintId} &bull; {timelineModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setTimelineModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#E2E8F0' }} />
                
                {(!timelineModalComplaint.timeline || timelineModalComplaint.timeline.length === 0) ? (
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No timeline entries found.</div>
                ) : (
                  timelineModalComplaint.timeline.map((t, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                      <div style={{ position: 'absolute', left: '-1.5rem', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#2563EB', border: '3px solid #FFF', zIndex: 2 }} />
                      <div style={{ background: '#F8FAFC', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem' }}>{t.title}</div>
                        {t.description && <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: '0.25rem' }}>{t.description}</div>}
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={12} /> {t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A'} {t.updatedByName ? `• By ${t.updatedByName}` : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerSLA;
