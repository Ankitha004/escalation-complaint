import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TLSidebar from '../components/TLSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import HRSidebar from '../components/HRSidebar';
import ManagerSidebar from '../components/ManagerSidebar';
import API from '../services/api';
import DOMPurify from 'dompurify';
import { calculateSLATimeLeft } from '../utils/slaUtils';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  MessageSquare, 
  Send, 
  Activity, 
  RefreshCw, 
  Clock,
  LayoutDashboard,
  ShieldAlert,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Sparkles,
  Wand2,
  X,
  FileCheck
} from 'lucide-react';

const TLComplaintDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actions State
  const [status, setStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');


  // Comment State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const renderSidebar = () => {
    const roleLower = (user?.role || '').toLowerCase();
    if (roleLower.includes('super admin') || roleLower === 'superadmin') {
      return <SuperAdminSidebar activeTab="complaints" />;
    }
    if (roleLower.includes('hr')) {
      return <HRSidebar activeTab="complaints" />;
    }
    if (roleLower.includes('manager')) {
      return <ManagerSidebar activeTab="complaints" />;
    }
    return <TLSidebar activeTab="complaints" />;
  };

  const fetchComplaint = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      try {
        res = await API.get(`/teamleader/complaints/${id}`);
      } catch (tlErr) {
        try {
          res = await API.get(`/complaints/${id}`);
        } catch (genErr) {
          res = await API.get(`/superadmin/complaints/${id}`);
        }
      }
      
      const compData = res?.data?.complaint || res?.data;
      if (!compData || typeof compData !== 'object' || (!compData._id && !compData.complaintId)) {
        setError('Complaint record not found.');
        setComplaint(null);
      } else {
        setComplaint(compData);
        if (compData.status) setStatus(compData.status);
      }
    } catch (err) {
      console.error('Fetch TL complaint error:', err);
      setError(err.response?.data?.message || 'Complaint record not found or access restricted.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchComplaint();
  }, [id]);

  const handleAcceptComplaint = async () => {
    setUpdatingStatus(true);
    try {
      const res = await API.put(`/teamleader/complaints/${id}/status`, {
        action: 'accept',
        status: 'In Progress',
        note: 'Accepted by Team Leader'
      });
      const updatedData = res?.data?.complaint || res?.data;
      setComplaint(updatedData);
      setStatus('In Progress');
    } catch (err) {
      alert('Failed to accept complaint.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!status || !complaint) return;

    setUpdatingStatus(true);
    try {
      const res = await API.put(`/teamleader/complaints/${id}/status`, {
        status,
        note: actionNote
      });
      const updatedData = res?.data?.complaint || res?.data;
      setComplaint(updatedData);
      setActionNote('');
      alert('Complaint status updated successfully!');
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;

    setSubmittingComment(true);
    try {
      await API.post(`/teamleader/complaints/${id}/comment`, {
        comment: commentText.trim()
      });
      setCommentText('');
      fetchComplaint();
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {renderSidebar()}
        <main style={{ flex: 1, padding: '5rem 2rem', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={32} className="spin-icon" style={{ color: '#4F46E5', marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>Loading ticket details...</div>
        </main>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {renderSidebar()}
        <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Ticket Not Available</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#B91C1C' }}>{error || 'Complaint record not found or access restricted.'}</p>
            <button 
              onClick={() => navigate(-1)} 
              style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Helper for safely extracting string names without raw hex ObjectIds
  const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

  const getSafeStr = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'object' && val.name && typeof val.name === 'string') return val.name;
    if (typeof val === 'string') {
      if (isObjectId(val)) return fallback;
      return val;
    }
    return fallback;
  };

  // Normalized Fields Processing
  const responsibleDeptName = getSafeStr(complaint.responsibleDepartment) || 
    (complaint.department && !isObjectId(complaint.department) ? (typeof complaint.department === 'string' ? complaint.department : complaint.department.name) : '') ||
    'Finance & Accounting';

  const assignedTLName = getSafeStr(complaint.assignedTeamLeader) || 
    (complaint.teamLeader && !isObjectId(complaint.teamLeader) ? complaint.teamLeader : '') || 
    'Tarun Verma';

  const assignedTLEmpId = complaint.assignedTeamLeader?.employeeId 
    ? `(${complaint.assignedTeamLeader.employeeId})` 
    : (assignedTLName === 'Tarun Verma' ? '(TL001)' : '');

  const deptManagerName = getSafeStr(complaint.departmentManager) || 'Ananya Sen';
  const deptManagerEmpId = complaint.departmentManager?.employeeId 
    ? `(${complaint.departmentManager.employeeId})` 
    : (deptManagerName === 'Ananya Sen' ? '(MGR003)' : '');

  const hasSubmittedReport = (complaint.resolutionReports && complaint.resolutionReports.length > 0) || complaint.status === 'Pending HR Review' || complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Pending HR Review' || hasSubmittedReport;
  const isEscalated = !isResolved && (complaint.status === 'Escalated' || complaint.status === 'Escalated to Manager' || complaint.status === 'Escalated to Super Admin' || Boolean(complaint.escalated) || Boolean(complaint.escalatedToSuperAdmin));
  
  let slaText = calculateSLATimeLeft(complaint.createdAt, complaint.priority, complaint.status, complaint.totalPausedDuration);
  let isSlaBreached = (slaText || '').toLowerCase().includes('breach');

  if (isEscalated) {
    isSlaBreached = true;
    slaText = complaint.escalatedToSuperAdmin 
      ? 'Escalated to Super Admin' 
      : 'Escalated to Manager';
  }


  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {renderSidebar()}

      <main style={{ flex: 1, padding: '2.25rem 2.75rem', overflowY: 'auto' }}>
        
        {/* TOP HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <Link to="/tl-dashboard" style={{ color: '#4F46E5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={16} /> Team Leader Portal
            </Link>
            <span>/</span>
            <span>Team Complaints</span>
            <span>/</span>
            <span style={{ color: '#0F172A' }}>{complaint.complaintId}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {complaint.complaintId}
                </h1>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  background: isEscalated ? '#FEE2E2' : isResolved ? '#F0FDF4' : '#EEF2FF',
                  color: isEscalated ? '#DC2626' : isResolved ? '#16A34A' : '#4F46E5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {isEscalated ? (complaint.escalatedToSuperAdmin ? 'ESCALATED TO SUPER ADMIN' : 'ESCALATED') : complaint.status}
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '800',
                  background: complaint.priority === 'Critical' ? '#FEE2E2' : complaint.priority === 'High' ? '#FFEDD5' : '#FEF3C7',
                  color: complaint.priority === 'Critical' ? '#DC2626' : complaint.priority === 'High' ? '#EA580C' : '#D97706',
                  textTransform: 'uppercase'
                }}>
                  {complaint.priority}
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '800',
                  background: isSlaBreached ? '#FEE2E2' : '#F0FDF4',
                  color: isSlaBreached ? '#DC2626' : '#16A34A',
                  textTransform: 'uppercase'
                }}>
                  {isSlaBreached ? 'SLA BREACHED' : 'SLA ON TRACK'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#334155', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {complaint.subject}
              </h2>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: TWO-COLUMN WORKSPACE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT / MAIN COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* OVERVIEW COMPACT BLOCK */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutDashboard size={18} color="#4F46E5" /> Complaint Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Category</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{complaint.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Created Date</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> {new Date(complaint.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Last Updated</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>
                    {new Date(complaint.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>SLA Target Time</div>
                  <div style={{ fontSize: '0.95rem', color: isSlaBreached ? '#DC2626' : '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} /> {slaText}
                  </div>
                </div>
              </div>
            </div>

            {/* ISSUE DESCRIPTION */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem' }}>Description</h3>
              <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(complaint.description) }} />
              </div>
            </div>

            {/* ATTACHMENTS */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={18} /> Attachments
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {complaint.attachments.map((file, idx) => (
                    <a key={idx} href={`http://127.0.0.1:5000/uploads/${file}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', textDecoration: 'none', color: '#4F46E5', fontSize: '0.9rem', fontWeight: '500' }}>
                      <Paperclip size={16} /> {file}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* COMMUNICATION / ACTIVITY */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="#4F46E5" /> Communication Log
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {(!complaint.comments || complaint.comments.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '0.9rem', border: '1px dashed #CBD5E1' }}>
                    No communication recorded yet.
                  </div>
                ) : (
                  complaint.comments.map((comm, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{comm.senderName}</strong>
                          <span style={{ background: '#E2E8F0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', marginLeft: '0.5rem' }}>
                            {comm.senderRole}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          {comm.createdAt ? new Date(comm.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>{comm.message}</p>
                    </div>
                  ))
                )}
              </div>

              {!isEscalated && !isResolved && (
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <input
                    type="text"
                    placeholder="Type a message or instruction..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <button type="submit" disabled={submittingComment || !commentText.trim()} style={{ background: '#4F46E5', color: '#FFF', border: 'none', padding: '0 1.5rem', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: (submittingComment || !commentText.trim()) ? 0.7 : 1 }}>
                    <Send size={16} /> Send
                  </button>
                </form>
              )}
            </div>

            {/* AUDIT / ACTIVITY TIMELINE */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#4F46E5" /> Audit History
              </h3>

              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#E2E8F0' }} />
                
                {(!complaint.timeline || complaint.timeline.length === 0) ? (
                  <div style={{ fontSize: '0.9rem', color: '#64748B' }}>No audit history recorded.</div>
                ) : (
                  complaint.timeline.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: idx !== complaint.timeline.length - 1 ? '1.5rem' : '0' }}>
                      <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#4F46E5', border: '3px solid #FFF', zIndex: 2 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>{item.title}</div>
                        {item.description && <div style={{ fontSize: '0.9rem', color: '#475569' }}>{item.description}</div>}
                        <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          <Clock size={12} /> {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                          {item.updatedByName && (
                            <>
                              <span>•</span>
                              <span>By: {item.updatedByName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* ACTION PANEL */}
            {isEscalated ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#991B1B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} /> Complaint Escalated
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#7F1D1D', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                  This complaint has been escalated for higher-level resolution.
                </p>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.85rem' }}>
                  <div style={{ color: '#991B1B', fontWeight: '700', marginBottom: '0.25rem' }}>Escalated To:</div>
                  <div style={{ color: '#0F172A', fontWeight: '600' }}>{complaint.escalatedToSuperAdmin ? 'Super Admin' : 'Manager'}</div>
                </div>
              </div>
            ) : isResolved ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} /> {complaint.status === 'Pending HR Review' ? 'Resolution Submitted' : 'Ticket Resolved'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#14532D', margin: 0, lineHeight: '1.5' }}>
                  {complaint.status === 'Pending HR Review'
                    ? 'Resolution report has been submitted and ticket is currently pending HR review.'
                    : 'Resolution report has been submitted and ticket is resolved.'}
                </p>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.25rem' }}>
                  Team Leader Action
                </h3>

                {complaint.status === 'Submitted' || complaint.status === 'Pending' ? (
                  <button 
                    onClick={handleAcceptComplaint} 
                    disabled={updatingStatus} 
                    style={{ width: '100%', background: '#4F46E5', color: '#FFF', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: updatingStatus ? 0.7 : 1 }}
                  >
                    <CheckCircle2 size={18} /> Accept & Start Resolution
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.85rem', fontSize: '0.82rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="#2563EB" /> 
                      <span>Ticket is In Progress</span>
                    </div>

                    <button 
                      onClick={() => setShowResolveModal(true)}
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', 
                        color: '#FFF', 
                        border: 'none', 
                        padding: '0.85rem 1rem', 
                        borderRadius: '8px', 
                        fontWeight: '700', 
                        fontSize: '0.88rem', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 2px 6px rgba(22,163,74,0.25)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CheckCircle2 size={17} />
                      <span>Submit Resolution Report</span>
                    </button>

                    {/* Button to Open Escalation Modal - Kept always accessible */}
                    <button 
                      onClick={() => setShowEscalateModal(true)}
                      style={{ 
                        width: '100%', 
                        background: '#FFFFFF', 
                        color: '#DC2626', 
                        border: '1px solid #FECACA', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        fontWeight: '600', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      <AlertTriangle size={16} />
                      <span>Escalate to Manager</span>
                    </button>
                  </div>
                )}
              </div>
            )}



            {/* REQUESTER INFO */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} /> Requester
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Staff Name</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '600' }}>{complaint.staffName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Employee ID</div>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A' }}>{complaint.staffId}</div>
                </div>
              </div>
            </div>

            {/* ASSIGNMENT INFO */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={16} /> Assignment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Department</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '600' }}>{responsibleDeptName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Team Leader</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '600' }}>
                    {assignedTLName} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'normal' }}>{assignedTLEmpId}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Department Manager</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '600' }}>
                    {deptManagerName} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'normal' }}>{deptManagerEmpId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTRIBUTORS / WORK HISTORY CARD */}
            {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Approved' || complaint.status === 'Pending HR Review') && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
                  Ticket Contributors / Work History
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(() => {
                    const actors = new Map();
                    
                    // Creator / Requester
                    const sName = getSafeStr(complaint.staffName) || (complaint.createdBy?.name || '');
                    if (sName) actors.set(sName, 'Raised Complaint');
                    
                    // Assigned TL
                    const tlName = assignedTLName;
                    if (tlName && tlName !== 'Unassigned') actors.set(tlName, 'Assigned Team Leader');
                    
                    // Department Manager
                    const mgrName = deptManagerName;
                    if (mgrName && mgrName !== 'Unassigned') actors.set(mgrName, 'Department Manager');

                    // Commenters
                    if (complaint.comments && Array.isArray(complaint.comments)) {
                      complaint.comments.forEach(c => {
                        const senderStr = getSafeStr(c.senderName);
                        if (senderStr) actors.set(senderStr, `${c.senderRole || 'User'} (Commented)`);
                      });
                    }

                    // Solver Reports
                    if (complaint.resolutionReports && Array.isArray(complaint.resolutionReports)) {
                      complaint.resolutionReports.forEach(r => {
                        const solverStr = getSafeStr(r.solverName);
                        if (solverStr) actors.set(solverStr, `${r.solverRole || 'Officer'} (Submitted Report)`);
                      });
                    }

                    // Timeline update actors
                    if (complaint.timeline && Array.isArray(complaint.timeline)) {
                      complaint.timeline.forEach(t => {
                        const updaterStr = getSafeStr(t.updatedByName);
                        if (updaterStr) actors.set(updaterStr, 'Updated Complaint');
                      });
                    }

                    const actorsList = Array.from(actors.entries()).map(([name, role]) => ({ name, role }));

                    if (actorsList.length === 0) {
                      return <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No work history contributors found.</div>;
                    }

                    return actorsList.map((actor, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }} />
                        <div>
                          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.9rem' }}>{actor.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{actor.role}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* SLA INFO */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} /> SLA Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '500' }}>Priority</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{complaint.priority}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '500' }}>SLA Status</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isSlaBreached ? '#DC2626' : '#16A34A' }}>
                    {isSlaBreached ? 'Breached' : 'On Track'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '500' }}>Escalated</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isEscalated ? '#DC2626' : '#0F172A' }}>
                    {isEscalated ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* RESOLUTION REPORT POPUP MODAL */}
      {showResolveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                }}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#166534', fontFamily: "'Outfit', sans-serif" }}>
                    Submit Resolution Report
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#15803D' }}>
                    Complaint #{complaint.complaintId} • {complaint.subject}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={updatingStatus}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#166534',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                <span>
                  This formal resolution summary will mark the ticket <strong>Resolved</strong> and send the report for audit compliance.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
                  Root Cause & Solution Summary <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows="5"
                  autoFocus
                  placeholder="Explain clearly what caused the issue, the exact steps taken to fix it, and any prevention measures implemented..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'vertical',
                    background: '#FFFFFF',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#16A34A'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #F1F5F9',
              background: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                disabled={updatingStatus}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!actionNote.trim()) return alert('Please enter resolution report details before submitting.');
                  setUpdatingStatus(true);
                  try {
                    const res = await API.post(`/teamleader/complaints/${id}/resolve-report`, { reportText: actionNote });
                    setComplaint(res.data.complaint);
                    setShowResolveModal(false);
                    setActionNote('');
                    alert('Resolution report submitted successfully!');
                  } catch (err) {
                    alert('Failed to submit resolution report.');
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                disabled={updatingStatus || !actionNote.trim()}
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: (updatingStatus || !actionNote.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (updatingStatus || !actionNote.trim()) ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                }}
              >
                {updatingStatus ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Resolve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {showEscalateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #FEE2E2'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FEF2F2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#991B1B' }}>
                    Escalate to Manager
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#B91C1C' }}>
                    Complaint #{complaint.complaintId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                disabled={updatingStatus}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                This will escalate the complaint directly to the <strong>Department Manager</strong> for higher-level intervention.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
                  Escalation Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Specify why this cannot be resolved at Team Leader level..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #F1F5F9',
              background: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                disabled={updatingStatus}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!escalateReason.trim()) return alert('Please enter an escalation reason.');
                  setUpdatingStatus(true);
                  try {
                    const res = await API.put(`/teamleader/complaints/${id}/escalate`, {
                      reason: escalateReason.trim()
                    });
                    setComplaint(res.data.complaint);
                    setShowEscalateModal(false);
                    setEscalateReason('');
                    alert('Complaint escalated to Manager successfully.');
                  } catch (err) {
                    alert('Failed to escalate complaint.');
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                disabled={updatingStatus || !escalateReason.trim()}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: (updatingStatus || !escalateReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (updatingStatus || !escalateReason.trim()) ? 0.65 : 1
                }}
              >
                {updatingStatus ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TLComplaintDetails;

