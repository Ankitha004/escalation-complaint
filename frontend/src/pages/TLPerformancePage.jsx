import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TLSidebar from '../components/TLSidebar';
import API from '../services/api';
import { calculateSLATimeLeft } from '../utils/slaUtils';
import { 
  LineChart, 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Star, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Zap, 
  ShieldCheck, 
  UserCheck, 
  ArrowUpRight,
  Sparkles,
  BarChart2
} from 'lucide-react';

const TLPerformancePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('All'); // 'All', 'Top', 'NeedsAttention'

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const [resComplaints, resStaff] = await Promise.all([
        API.get('/teamleader/complaints').catch(() => ({ data: [] })),
        API.get('/teamleader/my-staff').catch(() => ({ data: [] }))
      ]);

      const cList = resComplaints.data?.complaints || (Array.isArray(resComplaints.data) ? resComplaints.data : []);
      const sList = resStaff.data?.staff || (Array.isArray(resStaff.data) ? resStaff.data : []);

      setComplaints(cList);
      setTeamMembers(sList);
    } catch (err) {
      console.error('Error fetching team performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Compute metrics per staff member
  const memberMetrics = teamMembers.map(staff => {
    const staffComplaints = complaints.filter(c => 
      (c.createdBy?._id && c.createdBy._id === staff._id) || 
      (c.createdBy?.employeeId && c.createdBy.employeeId === staff.employeeId) ||
      (c.staffId && c.staffId === staff.employeeId) ||
      (c.assignedTo?._id && c.assignedTo._id === staff._id)
    );

    const total = staffComplaints.length;
    const resolved = staffComplaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
    const pending = staffComplaints.filter(c => ['Pending', 'Submitted', 'Waiting on User', 'In Progress'].includes(c.status)).length;
    const escalated = staffComplaints.filter(c => c.status === 'Escalated' || c.escalated || c.escalatedToSuperAdmin).length;

    const breached = staffComplaints.filter(c => {
      if (c.slaStatus === 'Breached') return true;
      const sla = calculateSLATimeLeft(c.slaDeadline || c.createdAt, c.priority, c.status);
      return sla === 'Breached';
    }).length;

    const slaRate = total > 0 ? Math.max(0, Math.round(((total - breached) / total) * 100)) : 'N/A';
    const effRate = total > 0 ? Math.round((resolved / total) * 100) : 'N/A';

    const rated = staffComplaints.filter(c => c.feedbackRating && c.feedbackRating > 0);
    const avgRating = rated.length > 0 
      ? (rated.reduce((acc, c) => acc + c.feedbackRating, 0) / rated.length).toFixed(1)
      : (total > 0 ? '5.0' : 'N/A');

    // Calculate score out of 100
    const performanceScore = total > 0 ? Math.round((effRate * 0.4) + (slaRate * 0.4) + (parseFloat(avgRating) * 4)) : 'N/A';

    return {
      ...staff,
      totalComplaints: total,
      resolvedComplaints: resolved,
      pendingComplaints: pending,
      escalatedComplaints: escalated,
      breachedComplaints: breached,
      slaRate,
      effRate,
      avgRating,
      performanceScore
    };
  });

  // Filtered members list
  const filteredMembers = memberMetrics.filter(m => {
    const matchesSearch = 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.designation || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (performanceFilter === 'Top') {
      return matchesSearch && m.performanceScore !== 'N/A' && m.performanceScore >= 80;
    }
    if (performanceFilter === 'NeedsAttention') {
      return matchesSearch && m.performanceScore !== 'N/A' && m.performanceScore < 70;
    }

    return matchesSearch;
  });

  // Overall Team Stats
  const totalTeamTickets = complaints.length;
  const totalTeamResolved = complaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
  const validEffMembers = memberMetrics.filter(m => m.effRate !== 'N/A');
  const avgTeamEff = validEffMembers.length > 0 
    ? Math.round(validEffMembers.reduce((acc, m) => acc + m.effRate, 0) / validEffMembers.length)
    : 100;

  const validScoreMembers = memberMetrics.filter(m => m.performanceScore !== 'N/A');
  const topPerformer = validScoreMembers.length > 0 
    ? [...validScoreMembers].sort((a, b) => b.performanceScore - a.performanceScore)[0] 
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TLSidebar activeTab="tl-performance" />

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#EFF6FF', color: '#2563EB', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              <LineChart size={14} /> Team Performance Center
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.25rem 0' }}>
              Staff Performance & Productivity
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              Efficiency benchmarks, resolution velocity, customer satisfaction, and workload analytics for <strong style={{ color: '#0F172A' }}>{user?.name || 'Supervisor'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
              <Users size={16} /> {teamMembers.length} Active Members
            </div>
            <button 
              onClick={fetchPerformanceData} 
              title="Refresh Performance Metrics" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Scores
            </button>
          </div>
        </div>

        {/* 4 TOP KPI METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          
          {/* ACTIVE TEAM MEMBERS */}
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Active Team Members</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {teamMembers.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
              Supervised staff headcount
            </div>
          </div>

          {/* TEAM AVG EFFICIENCY */}
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Team Avg Efficiency</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: avgTeamEff >= 70 ? '#16A34A' : '#D97706', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {avgTeamEff}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.5rem', fontWeight: '700' }}>
              ✓ Resolution velocity
            </div>
          </div>

          {/* TOP PERFORMER */}
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Top Performer</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topPerformer ? topPerformer.name : 'N/A'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '0.5rem', fontWeight: '700' }}>
              {topPerformer ? `Score: ${topPerformer.performanceScore} / 100` : 'No scores yet'}
            </div>
          </div>

          {/* TOTAL RESOLVED */}
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Total Resolved</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {totalTeamResolved}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
              Out of {totalTeamTickets} total tickets
            </div>
          </div>

        </div>

        {/* TEAM MEMBER PERFORMANCE MATRIX TABLE */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          
          {/* TABLE HEADER & SEARCH / FILTERS */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserCheck size={20} color="#0F172A" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  Member Performance Scorecards
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>Detailed breakdown of efficiency, SLA adherence, and feedback ratings per staff member</p>
              </div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800' }}>
                {filteredMembers.length} Members
              </span>
            </div>

            {/* CONTROLS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Search staff name or ID..." 
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              <select 
                value={performanceFilter} 
                onChange={e => setPerformanceFilter(e.target.value)} 
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.75rem', outline: 'none', background: '#F8FAFC', color: '#475569', fontWeight: '600' }}
              >
                <option value="All">All Performance Levels</option>
                <option value="Top">Top Performers (80%+ Score)</option>
                <option value="NeedsAttention">Needs Attention (&lt; 70% Score)</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {filteredMembers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
              No team members found matching the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                    <th style={{ padding: '1rem 1.25rem' }}>Staff Member</th>
                    <th style={{ padding: '1rem' }}>Employee ID</th>
                    <th style={{ padding: '1rem' }}>Assigned Tickets</th>
                    <th style={{ padding: '1rem' }}>Resolved</th>
                    <th style={{ padding: '1rem' }}>SLA Adherence</th>
                    <th style={{ padding: '1rem' }}>CSAT Rating</th>
                    <th style={{ padding: '1rem' }}>Scorecard Index</th>
                    <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Performance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => {
                    const isHigh = member.performanceScore !== 'N/A' && member.performanceScore >= 80;
                    const isLow = member.performanceScore !== 'N/A' && member.performanceScore < 70;
                    const isNA = member.performanceScore === 'N/A';

                    return (
                      <tr 
                        key={member._id || member.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        {/* STAFF NAME & ROLE */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isNA ? '#F1F5F9' : (isHigh ? '#F0FDF4' : (isLow ? '#FEF2F2' : '#EFF6FF')), color: isNA ? '#64748B' : (isHigh ? '#16A34A' : (isLow ? '#DC2626' : '#2563EB')), border: `1px solid ${isNA ? '#E2E8F0' : (isHigh ? '#BBF7D0' : (isLow ? '#FECACA' : '#BFDBFE'))}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800' }}>
                              {member.name ? member.name.substring(0, 2).toUpperCase() : 'ST'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>{member.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{member.designation || 'Team Staff'}</div>
                            </div>
                          </div>
                        </td>

                        {/* EMPLOYEE ID */}
                        <td style={{ padding: '1rem', color: '#2563EB', fontWeight: '700' }}>
                          {member.employeeId}
                        </td>

                        {/* TOTAL ASSIGNED */}
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0F172A' }}>
                          {member.totalComplaints}
                        </td>

                        {/* RESOLVED */}
                        <td style={{ padding: '1rem', color: '#16A34A', fontWeight: '700' }}>
                          {member.resolvedComplaints}
                        </td>

                        {/* SLA ADHERENCE */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.78rem', color: member.slaRate === 'N/A' ? '#64748B' : (member.slaRate >= 80 ? '#16A34A' : '#D97706') }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.slaRate === 'N/A' ? '#94A3B8' : (member.slaRate >= 80 ? '#16A34A' : '#D97706') }} />
                            {member.slaRate}{member.slaRate !== 'N/A' && '%'}
                          </div>
                        </td>

                        {/* CSAT RATING */}
                        <td style={{ padding: '1rem', fontWeight: '700', color: member.avgRating === 'N/A' ? '#94A3B8' : '#D97706', fontSize: '0.8rem' }}>
                          {member.avgRating !== 'N/A' && '★ '}{member.avgRating}{member.avgRating !== 'N/A' && ' / 5'}
                        </td>

                        {/* PERFORMANCE SCORE INDEX */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ flex: 1, minWidth: '60px', height: '6px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${isNA ? 0 : member.performanceScore}%`, height: '100%', background: isHigh ? '#16A34A' : (isLow ? '#DC2626' : '#2563EB'), borderRadius: '6px' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isNA ? '#94A3B8' : '#0F172A' }}>
                              {member.performanceScore}
                            </span>
                          </div>
                        </td>

                        {/* STATUS TAG */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <span style={{ 
                            background: isNA ? '#F8FAFC' : (isHigh ? '#F0FDF4' : (isLow ? '#FEF2F2' : '#EFF6FF')), 
                            color: isNA ? '#64748B' : (isHigh ? '#16A34A' : (isLow ? '#DC2626' : '#2563EB')), 
                            border: `1px solid ${isNA ? '#E2E8F0' : (isHigh ? '#BBF7D0' : (isLow ? '#FECACA' : '#BFDBFE'))}`, 
                            padding: '3px 9px', 
                            borderRadius: '12px', 
                            fontSize: '0.72rem', 
                            fontWeight: '800' 
                          }}>
                            {isNA ? 'No Data' : (isHigh ? '★ Top Performer' : (isLow ? '⚠️ Needs Review' : '✓ Good Standing'))}
                          </span>
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
    </div>
  );
};

export default TLPerformancePage;

