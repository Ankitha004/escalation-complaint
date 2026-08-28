import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  Trophy,
  Award,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Users,
  Building,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  BarChart2,
  Crown,
  Medal,
  AlertCircle
} from 'lucide-react';

const SuperAdminPerformance = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const [compRes, usersRes, deptRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/users'),
        API.get('/departments')
      ]);

      setComplaints(compRes.data || []);
      setAllUsers(usersRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Filter out relevant staff roles (Team Leader, Department Manager, Staff)
  const activeResolvers = allUsers.filter(u => 
    ['Team Leader', 'Manager', 'Staff'].includes(u.role) && u.status !== 'Inactive'
  );

  // Build 100% Real Database Resolver Stats Map
  const resolverStatsMap = {};

  activeResolvers.forEach(u => {
    const deptName = typeof u.department === 'object' && u.department?.name 
      ? u.department.name 
      : (typeof u.department === 'string' ? u.department : 'General');

    resolverStatsMap[String(u._id)] = {
      id: String(u._id),
      employeeId: u.employeeId,
      name: u.name,
      role: u.role === 'Manager' ? 'Department Manager' : u.role,
      department: deptName,
      totalAssigned: 0,
      resolved: 0,
      escalated: 0,
      ratings: [],
      resolutionTimesHours: [],
      incentives: 0
    };
  });

  // Calculate stats strictly from real MongoDB complaints
  complaints.forEach(c => {
    const assignedStaffId = c.assignedTo?._id ? String(c.assignedTo._id) : (c.assignedTo ? String(c.assignedTo) : null);
    const assignedTLId = c.assignedTeamLeader?._id ? String(c.assignedTeamLeader._id) : (c.assignedTeamLeader ? String(c.assignedTeamLeader) : null);
    const managerId = c.departmentManager?._id ? String(c.departmentManager._id) : (c.departmentManager ? String(c.departmentManager) : null);

    // Track targets
    const matchedKeys = new Set();
    if (assignedStaffId && resolverStatsMap[assignedStaffId]) matchedKeys.add(assignedStaffId);
    if (assignedTLId && resolverStatsMap[assignedTLId]) matchedKeys.add(assignedTLId);
    if (managerId && resolverStatsMap[managerId] && (c.escalated || c.status === 'Escalated')) matchedKeys.add(managerId);

    // If report has explicit solver
    if (c.resolutionReports && Array.isArray(c.resolutionReports)) {
      c.resolutionReports.forEach(r => {
        const reportSolverId = r.solvedBy?._id ? String(r.solvedBy._id) : (r.solvedBy ? String(r.solvedBy) : null);
        if (reportSolverId && resolverStatsMap[reportSolverId]) matchedKeys.add(reportSolverId);
      });
    }

    matchedKeys.forEach(k => {
      resolverStatsMap[k].totalAssigned += 1;

      if (['Resolved', 'Closed', 'Approved'].includes(c.status)) {
        resolverStatsMap[k].resolved += 1;
        resolverStatsMap[k].incentives += (c.incentiveRate || 500);

        if (c.feedbackRating) {
          resolverStatsMap[k].ratings.push(Number(c.feedbackRating));
        }

        if (c.createdAt && (c.resolvedDate || c.updatedAt)) {
          const start = new Date(c.createdAt);
          const end = new Date(c.resolvedDate || c.updatedAt);
          const diffHours = (end - start) / (1000 * 60 * 60);
          if (diffHours > 0) resolverStatsMap[k].resolutionTimesHours.push(diffHours);
        }
      }

      if (c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated') {
        resolverStatsMap[k].escalated += 1;
      }
    });
  });

  // Convert map to leaderboard array
  const leaderboard = Object.values(resolverStatsMap).map(r => {
    const avgRating = r.ratings.length > 0
      ? (r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length).toFixed(1)
      : null;
    const avgHours = r.resolutionTimesHours.length > 0
      ? (r.resolutionTimesHours.reduce((a, b) => a + b, 0) / r.resolutionTimesHours.length).toFixed(1)
      : null;
    const resolutionRate = r.totalAssigned > 0
      ? Math.round((r.resolved / r.totalAssigned) * 100)
      : 0;

    // Rank score: (resolved * 10) + (resolutionRate) + (rating * 5)
    const score = (r.resolved * 10) + resolutionRate + (avgRating ? Number(avgRating) * 5 : 0);

    return {
      ...r,
      avgRating,
      avgHours,
      resolutionRate,
      score
    };
  }).sort((a, b) => {
    if (b.resolved !== a.resolved) return b.resolved - a.resolved;
    return b.score - a.score;
  });

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' ? true : (
      roleFilter === 'Manager' ? r.role.includes('Manager') : r.role === roleFilter
    );
    const matchesDept = departmentFilter === 'All' ? true : r.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  // Top Performers
  const topResolversOnly = leaderboard.filter(r => r.resolved > 0);
  const top1 = topResolversOnly[0] || null;
  const top2 = topResolversOnly[1] || null;
  const top3 = topResolversOnly[2] || null;

  // Real Department Statistics from Database
  const deptMap = {};
  departments.forEach(d => {
    deptMap[d.name] = {
      name: d.name,
      total: 0,
      resolved: 0,
      escalated: 0
    };
  });

  complaints.forEach(c => {
    const dName = c.responsibleDepartment?.name || c.department || 'General';
    if (!deptMap[dName]) {
      deptMap[dName] = { name: dName, total: 0, resolved: 0, escalated: 0 };
    }
    deptMap[dName].total += 1;
    if (['Resolved', 'Closed', 'Approved'].includes(c.status)) deptMap[dName].resolved += 1;
    if (c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated') deptMap[dName].escalated += 1;
  });

  const departmentMetrics = Object.values(deptMap);

  // Overall Organization Metrics from Real Data
  const totalResolved = complaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
  const allRatings = complaints.filter(c => c.feedbackRating).map(c => Number(c.feedbackRating));
  const orgAvgRating = allRatings.length > 0 
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) 
    : 'No reviews yet';
  const orgEfficiencyRate = complaints.length > 0 ? Math.round((totalResolved / complaints.length) * 100) : 0;

  // Real Organization Average Turnaround Time
  const allResolutionTimes = [];
  complaints.forEach(c => {
    if (['Resolved', 'Closed', 'Approved'].includes(c.status) && c.createdAt && (c.resolvedDate || c.updatedAt)) {
      const diffH = (new Date(c.resolvedDate || c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
      if (diffH > 0) allResolutionTimes.push(diffH);
    }
  });
  const orgAvgTime = allResolutionTimes.length > 0
    ? `${(allResolutionTimes.reduce((a, b) => a + b, 0) / allResolutionTimes.length).toFixed(1)} hrs`
    : 'N/A';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="performance" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Enterprise Performance & Resolver Leaderboard
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Strict Database Metrics
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Live database metrics tracking staff, team leaders, department managers, resolution rates, and genuine staff feedback.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => window.print()} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Printer size={15} /> Print Report
            </button>
            <button 
              onClick={fetchPerformanceData} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync Real Data
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL SOLVED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {totalResolved} / {complaints.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>{orgEfficiencyRate}% Clearance Rate</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>AVERAGE CSAT RATING</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {orgAvgRating !== 'No reviews yet' ? `★ ${orgAvgRating} / 5` : 'Unrated'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>{allRatings.length} feedback submissions</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>AVG RESOLUTION TIME</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#7C3AED', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {orgAvgTime}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Turnaround duration</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>#1 TOP RESOLVER</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', fontFamily: "'Outfit', sans-serif", marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                {top1 ? top1.name : 'No Solvers Yet'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>{top1 ? `${top1.resolved} tickets solved` : 'Active'}</div>
            </div>
          </div>
        </div>

        {/* TOP PODIUM CARDS (IF SOLVERS EXIST) */}
        {topResolversOnly.length > 0 ? (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Crown size={18} color="#D97706" /> Top Active Resolvers
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* #1 GOLD */}
              {top1 && (
                <div style={{ background: 'linear-gradient(135deg, #FEF9C3 0%, #FFFFFF 100%)', border: '2px solid #FDE047', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(234,179,8,0.15)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '36px', height: '36px', borderRadius: '50%', background: '#FDE047', color: '#854D0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                    🥇
                  </div>
                  <span style={{ background: '#FEF08A', color: '#854D0E', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    1st Place Champion
                  </span>
                  <h3 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                    {top1.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                    {top1.employeeId} &bull; {top1.role} &bull; {top1.department}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(234,179,8,0.3)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RESOLVED</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#16A34A' }}>{top1.resolved} tickets</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RATING</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#D97706' }}>{top1.avgRating ? `★ ${top1.avgRating}` : 'Unrated'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>CLEARANCE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563EB' }}>{top1.resolutionRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>INCENTIVES</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>₹{top1.incentives.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* #2 SILVER */}
              {top2 && (
                <div style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #FFFFFF 100%)', border: '2px solid #CBD5E1', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                    🥈
                  </div>
                  <span style={{ background: '#E2E8F0', color: '#475569', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    2nd Place Silver
                  </span>
                  <h3 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                    {top2.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                    {top2.employeeId} &bull; {top2.role} &bull; {top2.department}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RESOLVED</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#16A34A' }}>{top2.resolved} tickets</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RATING</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#D97706' }}>{top2.avgRating ? `★ ${top2.avgRating}` : 'Unrated'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>CLEARANCE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563EB' }}>{top2.resolutionRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>INCENTIVES</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>₹{top2.incentives.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* #3 BRONZE */}
              {top3 && (
                <div style={{ background: 'linear-gradient(135deg, #FFEDD5 0%, #FFFFFF 100%)', border: '2px solid #FDBA74', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '36px', height: '36px', borderRadius: '50%', background: '#FED7AA', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                    🥉
                  </div>
                  <span style={{ background: '#FED7AA', color: '#9A3412', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    3rd Place Bronze
                  </span>
                  <h3 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                    {top3.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                    {top3.employeeId} &bull; {top3.role} &bull; {top3.department}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #FED7AA' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RESOLVED</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#16A34A' }}>{top3.resolved} tickets</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>RATING</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#D97706' }}>{top3.avgRating ? `★ ${top3.avgRating}` : 'Unrated'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>CLEARANCE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563EB' }}>{top3.resolutionRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>INCENTIVES</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>₹{top3.incentives.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: '#94A3B8' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>No Complaints Resolved Yet</div>
            <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0' }}>Resolvers will appear on the Leaderboard as tickets are marked Resolved in the database.</p>
          </div>
        )}

        {/* DEPARTMENT BENCHMARK */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building size={18} color="#2563EB" /> Department Resolution Benchmark & Efficiency
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {departmentMetrics.map((d, i) => {
              const clearRate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
              return (
                <div key={i} style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0F172A' }}>{d.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: clearRate >= 75 ? '#16A34A' : clearRate > 0 ? '#F59E0B' : '#64748B' }}>
                      {d.total > 0 ? `${clearRate}% Clearance` : 'No Tickets'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', margin: '6px 0' }}>
                    <div style={{ width: `${clearRate}%`, height: '100%', background: clearRate >= 75 ? '#16A34A' : clearRate >= 40 ? '#F59E0B' : '#DC2626' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    <span>{d.resolved} / {d.total} Solved</span>
                    {d.escalated > 0 && <span style={{ color: '#DC2626', fontWeight: '700' }}>{d.escalated} Escalated</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', flex: '1 1 280px', maxWidth: '360px' }}>
            <Search size={16} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search by name, employee ID, or dept..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.85rem', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* ROLE FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Users size={13} color="#64748B" />
              <select 
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Roles</option>
                <option value="Team Leader">Team Leaders</option>
                <option value="Manager">Department Managers</option>
                <option value="Staff">Staff Resolvers</option>
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

        {/* FULL DATABASE RESOLVER RANKINGS TABLE */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={thStyle}>Rank & Staff Member</th>
                  <th style={thStyle}>Role & Department</th>
                  <th style={thStyle}>Assigned vs Resolved</th>
                  <th style={thStyle}>Clearance Rate</th>
                  <th style={thStyle}>CSAT Rating</th>
                  <th style={thStyle}>Avg Resolution Time</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Solver Rewards</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : filteredLeaderboard.map((r, index) => {
                  let rankBadge = `#${index + 1}`;
                  if (r.resolved > 0) {
                    if (index === 0) rankBadge = '🥇 #1';
                    else if (index === 1) rankBadge = '🥈 #2';
                    else if (index === 2) rankBadge = '🥉 #3';
                  }

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      
                      {/* RANK & RESOLVER */}
                      <td style={{ padding: '1.15rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: '900', fontSize: '0.85rem', color: index === 0 && r.resolved > 0 ? '#B45309' : '#64748B', minWidth: '40px' }}>
                            {rankBadge}
                          </span>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem' }}>{r.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#2563EB', fontFamily: "'Outfit', sans-serif", fontWeight: '700' }}>{r.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE & DEPT */}
                      <td style={{ padding: '1.15rem 1.25rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.7rem', fontWeight: '700', padding: '2px 7px', borderRadius: '8px' }}>
                          {r.role}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>{r.department}</div>
                      </td>

                      {/* ASSIGNED VS RESOLVED */}
                      <td style={{ padding: '1.15rem 1.25rem' }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem' }}>
                          <span style={{ color: r.resolved > 0 ? '#16A34A' : '#64748B' }}>{r.resolved} Solved</span> / {r.totalAssigned} Assigned
                        </div>
                        {r.escalated > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: '600' }}>{r.escalated} Escalated</div>
                        )}
                      </td>

                      {/* CLEARANCE RATE */}
                      <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${r.resolutionRate}%`, height: '100%', background: r.resolutionRate >= 75 ? '#16A34A' : r.resolutionRate >= 40 ? '#F59E0B' : '#64748B' }} />
                          </div>
                          <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#0F172A', minWidth: '35px' }}>{r.resolutionRate}%</span>
                        </div>
                      </td>

                      {/* CSAT RATING */}
                      <td style={{ padding: '1.15rem 1.25rem' }}>
                        {r.avgRating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" />
                            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#B45309' }}>★ {r.avgRating}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({r.ratings.length})</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>No ratings</span>
                        )}
                      </td>

                      {/* AVG TIME */}
                      <td style={{ padding: '1.15rem 1.25rem' }}>
                        {r.avgHours ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: '700', color: '#0F172A' }}>
                            <Clock size={13} color="#64748B" />
                            {r.avgHours} hrs
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>N/A</span>
                        )}
                      </td>

                      {/* INCENTIVES */}
                      <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: r.incentives > 0 ? '#059669' : '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                          ₹{r.incentives.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
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

export default SuperAdminPerformance;
