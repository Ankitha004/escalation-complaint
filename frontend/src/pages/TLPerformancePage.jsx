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

      <main style={{ flex: 1, padding: '2.25rem 2.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* WHITE THEME HERO HEADER CARD */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '24px', 
          padding: '2rem 2.25rem', 
          boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Decorative Accent Bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <LineChart size={14} color="#2563EB" /> PERFORMANCE SCORECARD
              </span>
              <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.72rem', fontWeight: '800', padding: '3px 9px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} /> LIVE TEAM MONITOR
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, letterSpacing: '-0.02em', lineHeight: '1.2' }}>
              Team Member Performance Center
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.4rem', margin: 0, maxWidth: '640px', lineHeight: '1.5' }}>
              Individual staff efficiency benchmarks, resolution velocity, customer satisfaction ratings, and workload monitoring.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={fetchPerformanceData} 
              title="Refresh Performance Metrics" 
              style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.75rem 1.1rem', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Scores
            </button>
          </div>
        </div>

        {/* 4 KPI SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.35rem' }}>
          
          {/* TEAM MEMBERS COUNT */}
          <div style={{ background: '#FFFFFF', padding: '1.6rem 1.75rem', borderRadius: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#2563EB' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Team Members</span>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '0.6rem' }}>
              {teamMembers.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
              Supervised staff headcount
            </div>
          </div>

          {/* AVERAGE TEAM EFFICIENCY */}
          <div style={{ background: '#FFFFFF', padding: '1.6rem 1.75rem', borderRadius: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10B981' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team Avg Efficiency</span>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '0.6rem' }}>
              {avgTeamEff}%
            </div>
            <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '0.4rem', fontWeight: '700' }}>
              ✓ High resolution velocity
            </div>
          </div>

          {/* TOP PERFORMER */}
          <div style={{ background: '#FFFFFF', padding: '1.6rem 1.75rem', borderRadius: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#F59E0B' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Performer</span>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '0.6rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topPerformer ? topPerformer.name : 'N/A'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#D97706', marginTop: '0.4rem', fontWeight: '700' }}>
              {topPerformer ? `Score: ${topPerformer.performanceScore} / 100` : 'No data'}
            </div>
          </div>

          {/* TOTAL RESOLVED TICKETS */}
          <div style={{ background: '#FFFFFF', padding: '1.6rem 1.75rem', borderRadius: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#8B5CF6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Resolved</span>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '0.6rem' }}>
              {totalTeamResolved}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
              Out of {totalTeamTickets} total tickets
            </div>
          </div>

        </div>

        {/* TEAM MEMBER PERFORMANCE MATRIX TABLE */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          
          {/* TABLE HEADER & SEARCH / FILTERS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <UserCheck size={20} color="#2563EB" /> Member Performance Scorecards
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>Detailed breakdown of efficiency, SLA adherence, and feedback ratings per staff member</p>
            </div>

            {/* CONTROLS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Search staff name or ID..." 
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: '12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              <select value={performanceFilter} onChange={e => setPerformanceFilter(e.target.value)} style={selectStyle}>
                <option value="All">All Performance Levels</option>
                <option value="Top">Top Performers (80%+ Score)</option>
                <option value="NeedsAttention">Needs Attention (&lt; 70% Score)</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {filteredMembers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.9rem' }}>
              No team members found matching the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={thStyle}>Staff Member</th>
                    <th style={thStyle}>Employee ID</th>
                    <th style={thStyle}>Assigned Tickets</th>
                    <th style={thStyle}>Resolved</th>
                    <th style={thStyle}>SLA Adherence</th>
                    <th style={thStyle}>CSAT Rating</th>
                    <th style={thStyle}>Scorecard Index</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Performance Status</th>
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
                        <td style={{ padding: '1rem 1.1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isNA ? '#F1F5F9' : (isHigh ? '#ECFDF5' : (isLow ? '#FEF2F2' : '#EFF6FF')), color: isNA ? '#64748B' : (isHigh ? '#059669' : (isLow ? '#DC2626' : '#2563EB')), border: `1px solid ${isNA ? '#E2E8F0' : (isHigh ? '#A7F3D0' : (isLow ? '#FCA5A5' : '#BFDBFE'))}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: '800' }}>
                              {member.name ? member.name.substring(0, 2).toUpperCase() : 'ST'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem' }}>{member.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{member.designation || 'Team Staff'}</div>
                            </div>
                          </div>
                        </td>

                        {/* EMPLOYEE ID */}
                        <td style={{ padding: '1rem 1.1rem', color: '#2563EB', fontWeight: '800', fontSize: '0.85rem' }}>
                          {member.employeeId}
                        </td>

                        {/* TOTAL ASSIGNED */}
                        <td style={{ padding: '1rem 1.1rem', fontWeight: '800', color: '#0F172A', fontSize: '0.9rem' }}>
                          {member.totalComplaints}
                        </td>

                        {/* RESOLVED */}
                        <td style={{ padding: '1rem 1.1rem', color: '#059669', fontWeight: '800', fontSize: '0.9rem' }}>
                          {member.resolvedComplaints}
                        </td>

                        {/* SLA ADHERENCE */}
                        <td style={{ padding: '1rem 1.1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '0.85rem', color: member.slaRate === 'N/A' ? '#64748B' : (member.slaRate >= 80 ? '#059669' : '#D97706') }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: member.slaRate === 'N/A' ? '#94A3B8' : (member.slaRate >= 80 ? '#059669' : '#D97706') }} />
                            {member.slaRate}{member.slaRate !== 'N/A' && '%'}
                          </div>
                        </td>

                        {/* CSAT RATING */}
                        <td style={{ padding: '1rem 1.1rem', fontWeight: '800', color: member.avgRating === 'N/A' ? '#94A3B8' : '#F59E0B', fontSize: '0.88rem' }}>
                          {member.avgRating !== 'N/A' && '★ '}{member.avgRating}{member.avgRating !== 'N/A' && ' / 5'}
                        </td>

                        {/* PERFORMANCE SCORE INDEX */}
                        <td style={{ padding: '1rem 1.1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ flex: 1, minWidth: '60px', height: '8px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${isNA ? 0 : member.performanceScore}%`, height: '100%', background: isHigh ? '#10B981' : (isLow ? '#EF4444' : '#2563EB'), borderRadius: '6px' }} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isNA ? '#94A3B8' : '#0F172A' }}>
                              {member.performanceScore}
                            </span>
                          </div>
                        </td>

                        {/* STATUS TAG */}
                        <td style={{ padding: '1rem 1.1rem', textAlign: 'right' }}>
                          <span style={{ 
                            background: isNA ? '#F8FAFC' : (isHigh ? '#ECFDF5' : (isLow ? '#FEF2F2' : '#EFF6FF')), 
                            color: isNA ? '#64748B' : (isHigh ? '#059669' : (isLow ? '#DC2626' : '#2563EB')), 
                            border: `1px solid ${isNA ? '#E2E8F0' : (isHigh ? '#A7F3D0' : (isLow ? '#FCA5A5' : '#BFDBFE'))}`, 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
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

const thStyle = {
  padding: '1rem 1.1rem',
  fontSize: '0.72rem',
  fontWeight: '800',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap'
};

const selectStyle = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '0.55rem 0.85rem',
  fontSize: '0.82rem',
  fontWeight: '700',
  color: '#334155',
  outline: 'none'
};

export default TLPerformancePage;
