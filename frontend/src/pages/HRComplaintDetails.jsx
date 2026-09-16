import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import Navbar from '../components/Navbar';
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
  Edit2,
  Check,
  X,
  Award,
  FileText,
  Printer,
  Download,
  FileCheck
} from 'lucide-react';
import ResolutionCertificateModal from '../components/ResolutionCertificateModal';

const HRComplaintDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);

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

  // Comment Edit State (15 min window)
  const [editingCommentIndex, setEditingCommentIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEditComment = async (idx) => {
    if (!editingText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await API.put(`/hr/complaints/${id}/comments/${idx}`, {
        message: editingText.trim()
      });
      setComplaint(res.data);
      setEditingCommentIndex(null);
      setEditingText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit comment. The 15-minute edit window may have expired.');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchComplaint = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      try {
        res = await API.get(`/hr/complaints/${id}`);
      } catch (hrErr) {
        // Fallback to main complaint route if /hr/complaints/:id route fails
        res = await API.get(`/complaints/${id}`);
      }
      setComplaint(res.data);
      if (res.data) setStatus(res.data.status);
    } catch (err) {
      console.error('Fetch HR complaint error:', err);
      setError(err.response?.data?.message || 'Complaint record not found or has been removed.');
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
      const res = await API.put(`/hr/complaints/${id}/status`, {
        action: 'accept',
        status: 'In Progress',
        note: 'Accepted by HR'
      });
      setComplaint(res.data);
      setStatus('In Progress');
    } catch (err) {
      alert('Failed to accept complaint.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleHRApproveAndClose = async () => {
    if (!window.confirm('Are you sure you want to approve this resolution and close the complaint?')) {
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await API.put(`/hr/complaints/${id}/status`, {
        action: 'approve_and_close',
        status: 'Closed',
        note: 'Resolution verified, HR approved and ticket closed.'
      });
      setComplaint(res.data);
      setStatus('Closed');
      alert('Resolution approved and complaint has been successfully closed by HR!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve and close complaint.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;

    setSubmittingComment(true);
    try {
      const res = await API.post(`/hr/complaints/${id}/comment`, {
        comment: commentText.trim()
      });
      setComplaint(res.data);
      setCommentText('');
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar activeTabTitle="HR Complaint Management" />
        <div style={{ padding: '5rem 2rem', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={32} className="spin-icon" style={{ color: '#2563EB', marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>Loading complaint details...</div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar activeTabTitle="HR Complaint Management" />
        <div style={{ padding: '4rem 2rem', maxWidth: '600px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <AlertTriangle size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.5rem 0' }}>Complaint Not Found</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
              {error || 'The requested complaint ticket could not be located or may have been deleted.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/hr-complaints')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Return to HR Complaints List
              </button>
              <button onClick={() => navigate('/hr-dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', color: '#475569', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

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
    (complaint.department && !isObjectId(complaint.department) ? (typeof complaint.department === 'string' ? complaint.department : complaint.department?.name) : '') ||
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

  const isEscalated = complaint.status === 'Escalated' || complaint.status === 'Escalated to Super Admin' || complaint.escalated || complaint.escalatedToSuperAdmin;
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const hasSubmittedReport = (complaint.resolutionReports && complaint.resolutionReports.length > 0) || complaint.status === 'Pending HR Review';
  
  let slaText = calculateSLATimeLeft(complaint.createdAt, complaint.priority, complaint.status, complaint.totalPausedDuration);
  let isSlaBreached = (slaText || '').toLowerCase().includes('breach');

  if (isEscalated) {
    isSlaBreached = true;
    slaText = complaint.escalatedToSuperAdmin || complaint.status === 'Escalated to Super Admin'
      ? 'Escalated to Super Admin' 
      : 'Escalated Level';
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <HRSidebar activeTab="hr-complaints" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* TOP HEADER */}
        <div>
          <div style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <Link to="/hr-complaints" style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={16} /> HR Complaints Portal
            </Link>
            <span>/</span>
            <span>All Complaints</span>
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
                  background: isEscalated ? '#FEE2E2' : isResolved ? '#F0FDF4' : '#EFF6FF',
                  color: isEscalated ? '#DC2626' : isResolved ? '#16A34A' : '#2563EB',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {isEscalated ? (complaint.escalatedToSuperAdmin || complaint.status === 'Escalated to Super Admin' ? 'ESCALATED TO SUPER ADMIN' : 'ESCALATED') : complaint.status}
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
                  {complaint.priority || 'Medium'}
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

            {(isResolved || hasSubmittedReport) && (
              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                  color: '#FFFFFF',
                  border: '1px solid #86EFAC',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 101, 52, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Download size={17} /> Download Resolution Report (PDF)
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT: TWO-COLUMN WORKSPACE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT / MAIN COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* OVERVIEW COMPACT BLOCK */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutDashboard size={18} color="#2563EB" /> Complaint Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Category</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{complaint.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Created Date</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>Last Updated</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>
                    {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : 'N/A'}
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
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(complaint.description || '') }} />
              </div>
            </div>

            {/* ATTACHMENTS */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={18} /> Attachments ({complaint.attachments.length})
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {complaint.attachments.map((file, idx) => (
                    <a key={idx} href={`http://127.0.0.1:5000/uploads/${file}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', textDecoration: 'none', color: '#2563EB', fontSize: '0.9rem', fontWeight: '600' }}>
                      <Paperclip size={16} /> {file}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* COMMUNICATION / ACTIVITY LOG */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="#2563EB" /> Communication Log
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {(!complaint.comments || complaint.comments.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '0.9rem', border: '1px dashed #CBD5E1' }}>
                    No communication recorded yet.
                  </div>
                ) : (
                  complaint.comments.map((comm, idx) => {
                    const commentTime = new Date(comm.createdAt || Date.now()).getTime();
                    const minutesPassed = (Date.now() - commentTime) / (1000 * 60);
                    const isMine = user && (user.name === comm.senderName || comm.senderRole === 'HR' || user.role === 'HR');
                    const canEdit = isMine && minutesPassed <= 15;
                    const isEditing = editingCommentIndex === idx;

                    return (
                      <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{comm.senderName}</strong>
                            <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginLeft: '0.5rem' }}>
                              {comm.senderRole}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              {comm.createdAt ? new Date(comm.createdAt).toLocaleString() : 'Recent'}
                              {comm.isEdited && <em style={{ marginLeft: '0.4rem', color: '#475569', fontWeight: '700', fontStyle: 'normal' }}>(edited)</em>}
                            </span>
                            {canEdit && !isEditing && (
                              <button
                                onClick={() => { setEditingCommentIndex(idx); setEditingText(comm.message); }}
                                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Edit comment (available for 15 min after posting)"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #2563EB', fontSize: '0.9rem', outline: 'none', background: '#FFF' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setEditingCommentIndex(null)}
                                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditComment(idx)}
                                disabled={savingEdit || !editingText.trim()}
                                style={{ background: '#2563EB', border: 'none', color: '#FFF', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Check size={12} /> Save Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>{comm.message}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {!isEscalated && !isResolved && (
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <input
                    type="text"
                    placeholder="Type an HR directive or message..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <button type="submit" disabled={submittingComment || !commentText.trim()} style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '0 1.5rem', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: (submittingComment || !commentText.trim()) ? 0.7 : 1 }}>
                    <Send size={16} /> Send HR Message
                  </button>
                </form>
              )}
            </div>

            {/* AUDIT / ACTIVITY TIMELINE */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#2563EB" /> Audit History
              </h3>

              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#E2E8F0' }} />
                
                {(!complaint.timeline || complaint.timeline.length === 0) ? (
                  <div style={{ fontSize: '0.9rem', color: '#64748B' }}>No audit history recorded.</div>
                ) : (
                  complaint.timeline.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: idx !== complaint.timeline.length - 1 ? '1.5rem' : '0' }}>
                      <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#2563EB', border: '3px solid #FFF', zIndex: 2 }} />
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
            
            {/* HR ACTION PANEL */}
            {isEscalated ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#991B1B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} /> Complaint Escalated
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#7F1D1D', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                  This complaint has been escalated to Super Admin level for executive resolution.
                </p>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.85rem' }}>
                  <div style={{ color: '#991B1B', fontWeight: '700', marginBottom: '0.25rem' }}>Escalated Level:</div>
                  <div style={{ color: '#0F172A', fontWeight: '600' }}>Super Admin</div>
                </div>
              </div>
            ) : isResolved ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={20} /> Ticket Resolved
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#14532D', margin: '0', lineHeight: '1.5' }}>
                    This ticket has been resolved or closed. Status modifications are completed.
                  </p>
                </div>

                {/* Display Resolution Reports to HR */}
                {complaint.resolutionReports && complaint.resolutionReports.length > 0 && (
                  <div style={{ background: '#EFF6FF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1E40AF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} /> Reported Resolution Details
                      </h4>
                      <button 
                        onClick={() => setShowCertModal(true)}
                        style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                      >
                        <Download size={13} /> View / Print PDF
                      </button>
                    </div>
                    {complaint.resolutionReports.map((report, idx) => (
                      <div key={idx} style={{ background: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid #93C5FD', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: '700' }}>
                            Reported by {report.solverName} ({report.solverRole})
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#0F172A', whiteSpace: 'pre-wrap' }}>{report.reportText}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.25rem' }}>
                  HR Action & Resolution
                </h3>

                {/* Forwarded Resolution Reports */}
                {complaint.resolutionReports && complaint.resolutionReports.some(r => r.forwardedTo === 'HR') && (
                  <div style={{ marginBottom: '1.5rem', background: '#EFF6FF', padding: '1.25rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1E40AF', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} /> Resolution Reports Pending Review
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#1E3A8A', marginBottom: '1rem' }}>
                      The following resolution reports have been submitted. Please review them before taking final action.
                    </p>
                    {complaint.resolutionReports.filter(r => r.forwardedTo === 'HR').map((report, idx) => (
                      <div key={idx} style={{ background: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid #93C5FD', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: '700', marginBottom: '0.25rem' }}>Report by {report.solverName} ({report.solverRole})</div>
                        <div style={{ fontSize: '0.9rem', color: '#0F172A' }}>{report.reportText}</div>
                      </div>
                    ))}
                  </div>
                )}

                {complaint.status === 'Submitted' || complaint.status === 'Pending' ? (
                  <button 
                    onClick={handleAcceptComplaint} 
                    disabled={updatingStatus} 
                    style={{ width: '100%', background: '#2563EB', color: '#FFF', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: updatingStatus ? 0.7 : 1 }}
                  >
                    <CheckCircle2 size={18} /> Accept & Start Resolution
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ background: hasSubmittedReport ? '#F0FDF4' : '#EFF6FF', border: hasSubmittedReport ? '1px solid #BBF7D0' : '1px solid #BFDBFE', borderRadius: '8px', padding: '0.85rem', fontSize: '0.82rem', color: hasSubmittedReport ? '#15803D' : '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color={hasSubmittedReport ? '#16A34A' : '#2563EB'} /> 
                      <span>{hasSubmittedReport ? 'Report Submitted (Pending Closure)' : 'Ticket is In Progress'}</span>
                    </div>

                    {/* Resolution Report Button & HR Approval Action */}
                    {hasSubmittedReport ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {/* THE REQUESTED BUTTON: HR APPROVED AND CLOSE COMPLAINT */}
                        <button
                          type="button"
                          onClick={handleHRApproveAndClose}
                          disabled={updatingStatus}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.95rem 1rem',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            cursor: updatingStatus ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                            transition: 'all 0.2s ease',
                            opacity: updatingStatus ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(22, 163, 74, 0.4)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22, 163, 74, 0.35)'; }}
                        >
                          <CheckCircle2 size={19} />
                          <span>{updatingStatus ? 'Closing Ticket...' : 'HR Approved & Close Complaint'}</span>
                        </button>

                        <button 
                          onClick={() => setShowResolveModal(true)}
                          style={{ 
                            width: '100%', 
                            background: '#F0FDF4', 
                            color: '#16A34A', 
                            border: '1.5px solid #86EFAC', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '8px', 
                            fontWeight: '700', 
                            fontSize: '0.85rem', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 1px 3px rgba(22,163,74,0.1)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CheckCircle2 size={16} color="#16A34A" />
                          <span>Add Additional Resolution Note</span>
                        </button>
                      </div>
                    ) : (
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
                    )}

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
                      <span>Escalate to Super Admin</span>
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* REQUESTER INFO */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} /> Requester Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Staff Name</div>
                  <div style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '600' }}>{complaint.createdBy?.name || complaint.staffName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Employee ID</div>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A' }}>{complaint.createdBy?.employeeId || complaint.staffId || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* ASSIGNMENT INFO */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={16} /> Assignment & Routing
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>Responsible Department</div>
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
                  <CheckCircle2 size={20} />
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
                  cursor: 'pointer'
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
                  Provide final HR resolution details to mark this ticket <strong>Resolved</strong> and prepare the closure sign-off.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
                  Resolution Summary & Corrective Actions <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows="5"
                  autoFocus
                  placeholder="Explain the HR resolution details, solution actions taken, and closing remarks..."
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
                    const res = await API.post(`/hr/complaints/${id}/resolve-report`, { reportText: actionNote.trim() });
                    setComplaint(res.data.complaint);
                    setShowResolveModal(false);
                    setActionNote('');
                    alert('HR Resolution report submitted successfully!');
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

      {/* ESCALATE TO SUPER ADMIN MODAL */}
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
                    Escalate to Super Admin
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
                This will escalate the complaint directly to the <strong>Super Administrator</strong> for executive intervention.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
                  Escalation Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Specify why this cannot be resolved at HR level..."
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
                    const res = await API.put(`/hr/complaints/${id}/escalate`, {
                      reason: escalateReason.trim()
                    });
                    setComplaint(res.data.complaint);
                    setShowEscalateModal(false);
                    setEscalateReason('');
                    alert('Complaint escalated to Super Admin successfully.');
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

      {/* RESOLUTION CERTIFICATE PREVIEW MODAL */}
      {showCertModal && complaint && (
        <ResolutionCertificateModal
          complaint={complaint}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};


export default HRComplaintDetails;
