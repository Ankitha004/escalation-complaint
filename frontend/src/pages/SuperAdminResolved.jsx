import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  CheckCircle2,
  Check,
  Search,
  Filter,
  RefreshCw,
  Award,
  Star,
  Clock,
  Printer,
  Calendar,
  Building,
  User,
  ShieldCheck,
  X,
  FileText,
  RotateCcw,
  Receipt,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders
} from 'lucide-react';

const SuperAdminResolved = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modals
  const [reportModalComplaint, setReportModalComplaint] = useState(null);
  const [receiptModalComplaint, setReceiptModalComplaint] = useState(null);
  const [reopenModalComplaint, setReopenModalComplaint] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const fetchResolvedData = async () => {
    setLoading(true);
    try {
      const [compRes, deptRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/departments')
      ]);

      const all = compRes.data || [];
      const resolvedOnly = all.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status));
      setComplaints(resolvedOnly);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to load resolved complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolvedData();
  }, []);

  // Reopen Complaint Action
  const handleConfirmReopen = async (e) => {
    e.preventDefault();
    if (!reopenModalComplaint) return;

    setReopening(true);
    try {
      await API.put(`/complaints/${reopenModalComplaint._id}`, {
        status: 'In Progress',
        comment: `Super Admin reopened ticket. Reason: ${reopenReason || 'Further investigation needed.'}`,
        timelineTitle: 'Ticket Reopened by Super Admin',
        timelineDescription: reopenReason || 'Ticket re-opened for audit & resolution revision.'
      });

      // Remove from resolved list since it is now In Progress
      setComplaints(prev => prev.filter(c => c._id !== reopenModalComplaint._id));
      setReopenModalComplaint(null);
      setReopenReason('');
    } catch (err) {
      alert('Failed to reopen complaint.');
    } finally {
      setReopening(false);
    }
  };

  // Turnaround duration helper
  const calculateTurnaround = (createdAt, resolvedDate, updatedAt) => {
    if (!createdAt) return 'N/A';
    const start = new Date(createdAt);
    const end = new Date(resolvedDate || updatedAt || new Date());
    const diffMs = end - start;
    if (diffMs <= 0) return '< 1 hour';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / 60000);
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ${diffHours % 24}h`;
    }
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins} mins`;
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const sName = c.createdBy?.name || c.staffName || '';
    const sId = c.createdBy?.employeeId || c.staffId || '';
    const dept = c.responsibleDepartment?.name || c.department || '';
    const solverName = c.assignedTo?.name || c.assignedTeamLeader?.name || c.departmentManager?.name || c.teamLeader || '';

    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solverName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'All' ? true : dept === departmentFilter;
    const matchesPriority = priorityFilter === 'All' ? true : c.priority === priorityFilter;

    let matchesRating = true;
    if (ratingFilter === '5') matchesRating = Number(c.feedbackRating) === 5;
    if (ratingFilter === '4') matchesRating = Number(c.feedbackRating) >= 4;
    if (ratingFilter === '3') matchesRating = Number(c.feedbackRating) < 4 && Number(c.feedbackRating) >= 1;
    if (ratingFilter === 'Unrated') matchesRating = !c.feedbackRating;

    return matchesSearch && matchesDept && matchesPriority && matchesRating;
  });

  // Calculate live statistics from resolved records
  const totalResolvedCount = complaints.length;
  const ratedCount = complaints.filter(c => c.feedbackRating).length;
  const ratingSum = complaints.reduce((sum, c) => sum + (Number(c.feedbackRating) || 0), 0);
  const avgSatisfaction = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : 'No ratings';
  const totalIncentivesDisbursed = complaints.reduce((sum, c) => sum + (c.incentiveRate || 500), 0);
  const fiveStarCount = complaints.filter(c => Number(c.feedbackRating) === 5).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="resolved" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Resolved Complaints Archive & Audit Hub
              </h1>
              <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Verified Resolutions
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Historical archive of all resolved complaints, solver reports, staff satisfaction ratings, and turnaround metrics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => window.print()} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Printer size={15} /> Print Archive
            </button>
            <button 
              onClick={fetchResolvedData} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync DB
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLVED & CLOSED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {totalResolvedCount} Tickets
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>Completed life-cycles</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>STAFF SATISFACTION (CSAT)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {avgSatisfaction !== 'No ratings' ? `★ ${avgSatisfaction} / 5` : 'Unrated'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>{fiveStarCount} perfect 5-star ratings</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLUTION EFFICIENCY</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                100% Verified
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>Resolution reports filed</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLVER INCENTIVES</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                ₹{totalIncentivesDisbursed.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Earned by solvers</div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', flex: '1 1 280px', maxWidth: '360px' }}>
            <Search size={16} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search by ticket ID, subject, staff, or solver..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.85rem', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* RATING FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Star size={13} color="#D97706" />
              <select 
                value={ratingFilter} 
                onChange={e => setRatingFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Ratings</option>
                <option value="5">★ 5 Stars Only</option>
                <option value="4">★ 4+ Stars</option>
                <option value="3">★ Below 4 Stars</option>
                <option value="Unrated">Unrated / No Review</option>
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

            {/* PRIORITY FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
              <Sliders size={13} color="#64748B" />
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

          </div>
        </div>

        {/* RESOLVED COMPLAINTS TABLE */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '6rem', textAlign: 'center' }}>
            <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>Loading Resolved Archive...</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle}>Ticket ID & Priority</th>
                    <th style={thStyle}>Subject & Dept</th>
                    <th style={thStyle}>Complainant</th>
                    <th style={thStyle}>Resolved By</th>
                    <th style={thStyle}>Turnaround & Date</th>
                    <th style={thStyle}>CSAT Feedback</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Audit Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
                        <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem', color: '#16A34A', display: 'block' }} />
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>No Resolved Complaints Match Criteria</div>
                      </td>
                    </tr>
                  ) : filteredComplaints.map(c => {
                    const solverName = c.assignedTo?.name || c.assignedTeamLeader?.name || c.departmentManager?.name || c.teamLeader || 'Department Team';
                    const solverRole = c.assignedTo?.role || c.assignedTeamLeader?.role || (c.departmentManager ? 'Department Manager' : 'Team Leader');
                    const turnaround = calculateTurnaround(c.createdAt, c.resolvedDate, c.updatedAt);

                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        
                        {/* TICKET ID & PRIORITY */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '140px' }}>
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
                              {c.priority || 'Medium'}
                            </span>
                          </div>
                        </td>

                        {/* SUBJECT & DEPT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '200px', maxWidth: '260px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.subject}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                            {c.responsibleDepartment?.name || c.department || 'General'} &bull; <span style={{ color: '#2563EB' }}>{c.category}</span>
                          </div>
                        </td>

                        {/* COMPLAINANT */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem' }}>
                            {c.createdBy?.name || c.staffName || 'Staff Member'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
                            {c.createdBy?.employeeId || c.staffId || 'ID-N/A'}
                          </div>
                        </td>

                        {/* RESOLVED BY */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '170px' }}>
                          <div style={{ fontWeight: '800', color: '#16A34A', fontSize: '0.85rem' }}>
                            {solverName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                            {solverRole}
                          </div>
                        </td>

                        {/* TURNAROUND & DATE */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: '800', color: '#0F172A' }}>
                            <Clock size={13} color="#2563EB" />
                            {turnaround}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                            {c.resolvedDate ? new Date(c.resolvedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Resolved'}
                          </div>
                        </td>

                        {/* CSAT FEEDBACK */}
                        <td style={{ padding: '1.15rem 1.25rem', minWidth: '150px' }}>
                          {c.feedbackRating ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {[1,2,3,4,5].map(st => (
                                  <Star key={st} size={13} fill={st <= c.feedbackRating ? '#F59E0B' : 'none'} color={st <= c.feedbackRating ? '#F59E0B' : '#CBD5E1'} />
                                ))}
                                <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#B45309', marginLeft: '4px' }}>
                                  {c.feedbackRating}/5
                                </span>
                              </div>
                              {c.feedbackComment && (
                                <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                  "{c.feedbackComment}"
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Unrated</span>
                          )}
                        </td>

                        {/* AUDIT ACTIONS */}
                        <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right', minWidth: '200px' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              onClick={() => setReportModalComplaint(c)}
                              title="View Full Resolution Report & Timeline"
                              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={12} /> Report
                            </button>

                            <button 
                              onClick={() => setReceiptModalComplaint(c)}
                              title="Official Resolution Certificate"
                              style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Receipt size={12} /> Certificate
                            </button>

                            <button 
                              onClick={() => setReopenModalComplaint(c)}
                              title="Reopen Ticket (Executive Power)"
                              style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <RotateCcw size={12} /> Reopen
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

      {/* RESOLUTION REPORT MODAL */}
      {reportModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '580px', width: '100%', padding: '2rem', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Resolution Audit Document
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: '700' }}>
                  {reportModalComplaint.complaintId} &bull; {reportModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setReportModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>COMPLAINANT ISSUE DESCRIPTION</div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{reportModalComplaint.description}</div>
              </div>

              {reportModalComplaint.resolutionReports && reportModalComplaint.resolutionReports.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Official Solver Resolution Report
                  </div>
                  {reportModalComplaint.resolutionReports.map((r, i) => (
                    <div key={i} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '12px', color: '#065F46', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.78rem', marginBottom: '4px' }}>
                        Filed by {r.solverName || 'Assigned Resolver'} ({r.solverRole || 'Team Leader'}) on {new Date(r.timestamp || new Date()).toLocaleDateString('en-IN')}
                      </div>
                      {r.reportText}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '12px', color: '#065F46', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.78rem', marginBottom: '4px' }}>Resolution Verified</div>
                  Complaint status verified and marked as Resolved.
                </div>
              )}

              {reportModalComplaint.feedbackRating && (
                <div style={{ background: '#FFFBEB', padding: '1rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>STAFF SATISFACTION RATING</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: '#B45309', fontSize: '0.9rem' }}>
                    ★ {reportModalComplaint.feedbackRating} / 5 Stars
                  </div>
                  {reportModalComplaint.feedbackComment && (
                    <div style={{ fontSize: '0.8rem', color: '#78350F', fontStyle: 'italic', marginTop: '4px' }}>
                      "{reportModalComplaint.feedbackComment}"
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => setReportModalComplaint(null)} style={{ padding: '0.65rem 1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION CERTIFICATE / RECEIPT MODAL */}
      {receiptModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={24} color="#16A34A" />
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>COMPLAINT RESOLUTION CERTIFICATE</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>OFFICIAL AUDITED RESOLUTION RECORD</div>
              </div>
              <button onClick={() => setReceiptModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', fontSize: '0.82rem', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>TICKET ID</div>
                <div style={{ fontWeight: '800', color: '#2563EB', fontSize: '1rem' }}>{receiptModalComplaint.complaintId}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>CATEGORY / DEPT</div>
                <div style={{ fontWeight: '800', color: '#0F172A' }}>{receiptModalComplaint.responsibleDepartment?.name || receiptModalComplaint.department || 'General'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>COMPLAINANT</div>
                <div style={{ fontWeight: '800', color: '#0F172A' }}>{receiptModalComplaint.createdBy?.name || receiptModalComplaint.staffName}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>RESOLVED BY</div>
                <div style={{ fontWeight: '800', color: '#16A34A' }}>{receiptModalComplaint.assignedTo?.name || receiptModalComplaint.assignedTeamLeader?.name || receiptModalComplaint.teamLeader || 'Department Team'}</div>
              </div>
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>SUBJECT</div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>{receiptModalComplaint.subject}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>{receiptModalComplaint.description}</div>
            </div>

            <div style={{ background: '#ECFDF5', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.75rem', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontWeight: '700' }}>✓ STATUS: OFFICIALLY RESOLVED & CLOSED</span>
              <span>Reward: +₹{receiptModalComplaint.incentiveRate || 500}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Printer size={15} /> Print Certificate
              </button>
              <button onClick={() => setReceiptModalComplaint(null)} style={{ padding: '0.75rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN COMPLAINT MODAL */}
      {reopenModalComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '460px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#E11D48', fontFamily: "'Outfit', sans-serif" }}>
                  Reopen Resolved Complaint
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {reopenModalComplaint.complaintId} &bull; {reopenModalComplaint.subject}
                </span>
              </div>
              <button onClick={() => setReopenModalComplaint(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Super Admin Reopen Justification *
                </label>
                <input 
                  type="text" 
                  required
                  value={reopenReason} 
                  onChange={e => setReopenReason(e.target.value)} 
                  placeholder="e.g. Issue recurring, resolution insufficient, reopened for audit"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={reopening} style={{ flex: 1, background: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: reopening ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(225,29,72,0.25)' }}>
                  {reopening && <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  Reopen Complaint
                </button>
                <button type="button" onClick={() => setReopenModalComplaint(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
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

export default SuperAdminResolved;
