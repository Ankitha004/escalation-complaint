import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import API from '../services/api';
import {
  Trophy,
  Award,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  BarChart2,
  AlertCircle,
  X,
  UserCheck,
  Check,
  Building,
  Layers,
  Eye,
  Activity
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ManagerPerformance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('dept'); // 'dept' (My Department TLs) or 'all' (Organization Leaderboard)

  // Selected Team Leader for Full Individual Analytics Modal
  const [selectedTL, setSelectedTL] = useState(null);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const [resPerformance, resComplaints] = await Promise.all([
        API.get('/manager/tl-performance'),
        API.get('/manager/complaints')
      ]);

      const rawTLs = resPerformance.data?.teamLeaders || [];
      const complaintsList = resComplaints.data?.complaints || (Array.isArray(resComplaints.data) ? resComplaints.data : []);
      setAllComplaints(complaintsList);

      // Enhance TL objects with deep complaint analytics & feedback ratings
      const enhancedTLs = rawTLs.map((tl, index) => {
        const tlIdStr = tl._id ? String(tl._id) : '';
        const tlName = (tl.name || '').toLowerCase().trim();
        const tlEmpId = (tl.employeeId || '').toLowerCase().trim();

        // Match complaints assigned to this TL across multiple identifier formats
        const assignedComplaints = complaintsList.filter(c => {
          const cAssignedTL = c.assignedTeamLeader ? (c.assignedTeamLeader._id ? String(c.assignedTeamLeader._id) : String(c.assignedTeamLeader)) : '';
          const cAssignedTo = c.assignedTo ? (c.assignedTo._id ? String(c.assignedTo._id) : String(c.assignedTo)) : '';
          const cTLString = (c.teamLeader || c.assignedTeamLeader?.name || '').toLowerCase().trim();
          const cTLEmpId = (c.assignedTeamLeader?.employeeId || '').toLowerCase().trim();

          if (tlIdStr && (cAssignedTL === tlIdStr || cAssignedTo === tlIdStr)) return true;
          if (tlEmpId && (cTLEmpId === tlEmpId || cTLString === tlEmpId)) return true;
          if (tlName && (cTLString === tlName || tlName.includes(cTLString) || cTLString.includes(tlName))) return true;

          return false;
        });

        const total = tl.total !== undefined && tl.total > 0 ? tl.total : assignedComplaints.length;
        const resolved = tl.resolved !== undefined && tl.resolved > 0 
          ? tl.resolved 
          : assignedComplaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
        const escalated = tl.escalated !== undefined && tl.escalated > 0 
          ? tl.escalated 
          : assignedComplaints.filter(c => c.escalated || c.status === 'Escalated' || c.status === 'Escalated to Super Admin').length;
        const pending = Math.max(0, total - resolved - escalated);
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : (tl.resolutionRate || 0);

        // Compute ratings
        const ratings = assignedComplaints.filter(c => c.feedbackRating && c.feedbackRating > 0).map(c => Number(c.feedbackRating));
        const avgRating = tl.avgRating || (ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : (total > 0 ? '4.8' : '5.0'));

        // Compute average resolution hours
        const resolutionTimes = [];
        assignedComplaints.forEach(c => {
          if (['Resolved', 'Closed', 'Approved'].includes(c.status) && c.createdAt && (c.resolvedDate || c.updatedAt)) {
            const hrs = (new Date(c.resolvedDate || c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
            if (hrs > 0) resolutionTimes.push(hrs);
          }
        });

        const avgHours = tl.avgHours || (resolutionTimes.length > 0
          ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
          : '8.5');

        return {
          ...tl,
          total,
          resolved,
          escalated,
          pending,
          resolutionRate,
          avgRating,
          avgHours,
          assignedComplaints
        };
      });

      // Sort by resolved count descending, then total assigned
      enhancedTLs.sort((a, b) => b.resolved - a.resolved || b.total - a.total);

      setPerformanceData(enhancedTLs);
    } catch (err) {
      console.error('Failed to load Manager TL performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Filter TLs by search query and scope (Department vs All)
  const scopedTLs = performanceData.filter(tl => {
    if (scopeFilter === 'dept') {
      return tl.isDeptTL || tl.total > 0;
    }
    return true;
  });

  const filteredTLs = scopedTLs.filter(tl => 
    (tl.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tl.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tl.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // High-level summary metrics based on scoped dataset
  const activeTLsCount = scopedTLs.length;
  const topResolver = scopedTLs.length > 0 ? scopedTLs[0] : null;
  const totalResolvedDept = scopedTLs.reduce((sum, tl) => sum + tl.resolved, 0);
  const totalAssignedDept = scopedTLs.reduce((sum, tl) => sum + tl.total, 0);
  const overallClearanceRate = totalAssignedDept > 0 ? Math.round((totalResolvedDept / totalAssignedDept) * 100) : 100;

  // Bar Chart Configuration
  const barChartData = {
    labels: scopedTLs.map(tl => tl.name),
    datasets: [
      {
        label: 'Resolved Complaints',
        data: scopedTLs.map(tl => tl.resolved),
        backgroundColor: '#10B981',
        borderRadius: 8
      },
      {
        label: 'Pending / In Progress',
        data: scopedTLs.map(tl => tl.pending),
        backgroundColor: '#F59E0B',
        borderRadius: 8
      },
      {
        label: 'Escalated (Breached)',
        data: scopedTLs.map(tl => tl.escalated),
        backgroundColor: '#EF4444',
        borderRadius: 8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top', 
        labels: { 
          font: { family: "'Plus Jakarta Sans', sans-serif", weight: '700', size: 11 },
          usePointStyle: true,
          boxWidth: 8
        } 
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#F1F5F9' },
        ticks: { stepSize: 2, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } 
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: '700', size: 11 } } 
      }
    }
  };

  // Doughnut Chart Configuration
  const doughnutColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
  const doughnutData = {
    labels: scopedTLs.map(tl => tl.name),
    datasets: [
      {
        data: scopedTLs.map(tl => tl.resolved > 0 ? tl.resolved : (tl.total > 0 ? tl.total : 1)),
        backgroundColor: scopedTLs.map((_, i) => doughnutColors[i % doughnutColors.length]),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="performance" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Team Leader Performance & Leaderboard
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Interactive Resolver Analytics
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time resolver statistics, clearance rates, resolution speeds, and full individual analytics on tap.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={fetchPerformanceData} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync
            </button>
          </div>
        </div>

        {/* EXECUTIVE KPI METRIC TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          {/* TOP RESOLVER CARD */}
          <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', padding: '1.35rem', borderRadius: '18px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 20px -4px rgba(49,46,129,0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }}>
              <Trophy size={24} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: '#A5B4FC', fontWeight: '800', letterSpacing: '0.5px' }}>🥇 #1 TOP RESOLVER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif", marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {topResolver ? topResolver.name : 'None'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: '700', marginTop: '2px' }}>
                {topResolver ? `${topResolver.resolved} Resolved (${topResolver.resolutionRate}%)` : 'No data'}
              </div>
            </div>
          </div>

          {/* ACTIVE TEAM LEADERS */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ACTIVE TEAM LEADERS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {activeTLsCount} {activeTLsCount === 1 ? 'TL' : 'TLs'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: '600', marginTop: '2px' }}>
                {scopeFilter === 'dept' ? 'Department resolvers' : 'Across company'}
              </div>
            </div>
          </div>

          {/* CLEARANCE RATE */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>OVERALL CLEARANCE RATE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {overallClearanceRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                {totalResolvedDept} of {totalAssignedDept} total resolved
              </div>
            </div>
          </div>

          {/* AVG RESOLUTION SPEED */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={22}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>AVG RESOLUTION SPEED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {topResolver ? `${topResolver.avgHours}h` : '8.5h'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: '600', marginTop: '2px' }}>
                Time to ticket closure
              </div>
            </div>
          </div>

        </div>

        {/* INTERACTIVE GRAPHICAL COMPARISON CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          
          {/* BAR CHART */}
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} color="#2563EB" /> Team Leader Resolution Comparison
              </h3>
            </div>
            <div style={{ height: '240px' }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={28} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : scopedTLs.length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  No Team Leader data available
                </div>
              )}
            </div>
          </div>

          {/* DOUGHNUT CHART */}
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#10B981" /> Resolved Share by Team Leader
              </h3>
            </div>
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                <RefreshCw size={28} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
              ) : scopedTLs.length > 0 ? (
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: '700', size: 11 }, usePointStyle: true, boxWidth: 8 } } } }} />
              ) : (
                <div style={{ color: '#94A3B8' }}>No Team Leader data available</div>
              )}
            </div>
          </div>

        </div>

        {/* SEARCH, SCOPE TOGGLES & LEADERBOARD TABLE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Award size={20} color="#2563EB" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Team Leader Performance Rankings
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                  Click any Team Leader to view assigned complaints breakdown and individual analytics
                </span>
              </div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #BFDBFE' }}>
                {filteredTLs.length} {filteredTLs.length === 1 ? 'Leader' : 'Leaders'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Scope Toggles */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setScopeFilter('dept')}
                  style={{
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: scopeFilter === 'dept' ? '#FFFFFF' : 'transparent',
                    color: scopeFilter === 'dept' ? '#2563EB' : '#64748B',
                    boxShadow: scopeFilter === 'dept' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Department TLs
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  style={{
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: scopeFilter === 'all' ? '#FFFFFF' : 'transparent',
                    color: scopeFilter === 'all' ? '#2563EB' : '#64748B',
                    boxShadow: scopeFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  All TLs (Company)
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text"
                  placeholder="Search TL by name, ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 1rem 0.45rem 2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none', background: '#F8FAFC', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={28} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: '700' }}>Calculating Team Leader analytics...</div>
            </div>
          ) : filteredTLs.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              <Users size={36} style={{ margin: '0 auto 1rem auto', color: '#CBD5E1' }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#475569' }}>No Team Leaders found</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>Try changing search terms or toggling to "All TLs"</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: '800', fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Rank</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Team Leader</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Assigned</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Resolved</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Escalated</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Avg Rating</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Resolution Rate</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTLs.map((tl, index) => {
                    const isTopThree = index < 3;
                    const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                    return (
                      <tr 
                        key={tl._id || index}
                        onClick={() => setSelectedTL(tl)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* RANK */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '800', fontSize: '0.95rem' }}>
                          {rankMedal}
                        </td>

                        {/* TL NAME */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: isTopThree ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#E2E8F0',
                              color: isTopThree ? '#FFF' : '#475569',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem'
                            }}>
                              {(tl.name || 'TL').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {tl.name}
                                {tl.isDeptTL && (
                                  <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', border: '1px solid #BFDBFE' }}>
                                    My Dept
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                ID: {tl.employeeId || 'TL-N/A'} {tl.departmentName ? `• ${tl.departmentName}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* TOTAL ASSIGNED */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#0F172A' }}>
                          {tl.total}
                        </td>

                        {/* RESOLVED */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '800', color: '#16A34A' }}>
                          {tl.resolved}
                        </td>

                        {/* ESCALATED */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '800', color: tl.escalated > 0 ? '#DC2626' : '#64748B' }}>
                          {tl.escalated}
                        </td>

                        {/* AVG RATING */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem' }}>
                            <Star size={12} fill="#D97706" /> {tl.avgRating} / 5
                          </span>
                        </td>

                        {/* RESOLUTION RATE BAR */}
                        <td style={{ padding: '1rem 1.25rem', minWidth: '160px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ flex: 1, background: '#E2E8F0', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${tl.resolutionRate}%`,
                                height: '100%',
                                background: tl.resolutionRate >= 75 ? '#10B981' : tl.resolutionRate >= 40 ? '#F59E0B' : '#DC2626'
                              }} />
                            </div>
                            <span style={{ fontWeight: '800', fontSize: '0.78rem', color: '#475569', minWidth: '35px' }}>{tl.resolutionRate}%</span>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTL(tl);
                            }}
                            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s ease' }}
                          >
                            <Activity size={13} /> View Analytics
                          </button>
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

      {/* FULL INDIVIDUAL ANALYTICS MODAL (ON TAP / CLICK) */}
      {selectedTL && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', maxWidth: '750px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            
            {/* MODAL HEADER */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#FFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.3)' }}>
                  {(selectedTL.name || 'TL').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                    {selectedTL.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <span>Employee ID: {selectedTL.employeeId || 'N/A'}</span> &bull; <span>Team Leader</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTL(null)} 
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* METRIC BADGES GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>TOTAL ASSIGNED</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{selectedTL.total}</div>
                </div>

                <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '14px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '700' }}>RESOLVED TICKETS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>{selectedTL.resolved}</div>
                </div>

                <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '14px', border: '1px solid #FCA5A5', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#B91C1C', fontWeight: '700' }}>ESCALATED TICKETS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#DC2626', marginTop: '2px' }}>{selectedTL.escalated}</div>
                </div>

                <div style={{ background: '#FFFBEB', padding: '1rem', borderRadius: '14px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: '700' }}>CSAT RATING</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Star size={16} fill="#D97706" /> {selectedTL.avgRating}
                  </div>
                </div>

              </div>

              {/* RESOLUTION PROGRESS BAR */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '0.5rem' }}>
                  <span>Resolution Clearance Rate</span>
                  <span style={{ color: selectedTL.resolutionRate >= 75 ? '#10B981' : '#DC2626' }}>{selectedTL.resolutionRate}% Complete</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#CBD5E1', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${selectedTL.resolutionRate}%`,
                    height: '100%',
                    background: selectedTL.resolutionRate >= 75 ? '#10B981' : selectedTL.resolutionRate >= 40 ? '#F59E0B' : '#DC2626'
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg Resolution Speed: <strong>{selectedTL.avgHours} hours</strong></span>
                  <span>Pending: <strong>{selectedTL.pending} complaints</strong></span>
                </div>
              </div>

              {/* ASSIGNED COMPLAINTS HISTORY STREAM */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} color="#2563EB" /> Assigned Complaints ({selectedTL.assignedComplaints ? selectedTL.assignedComplaints.length : 0})
                </h4>

                {(!selectedTL.assignedComplaints || selectedTL.assignedComplaints.length === 0) ? (
                  <div style={{ background: '#F8FAFC', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No explicit complaint records linked to this Team Leader.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedTL.assignedComplaints.map((c) => (
                      <div 
                        key={c._id}
                        onClick={() => {
                          setSelectedTL(null);
                          navigate(`/manager-complaint-details/${c._id}`);
                        }}
                        style={{ background: '#FFFFFF', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '800', color: '#2563EB', fontSize: '0.82rem' }}>{c.complaintId}</span>
                            <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>{c.subject}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                            Category: {c.category || 'General'} &bull; Created: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            background: ['Resolved', 'Closed', 'Approved'].includes(c.status) ? '#ECFDF5' : c.status === 'Escalated' || c.escalated ? '#FEF2F2' : '#FFFBEB',
                            color: ['Resolved', 'Closed', 'Approved'].includes(c.status) ? '#047857' : c.status === 'Escalated' || c.escalated ? '#DC2626' : '#D97706',
                            fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px'
                          }}>
                            {c.status}
                          </span>
                          <ChevronRight size={14} color="#94A3B8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerPerformance;
