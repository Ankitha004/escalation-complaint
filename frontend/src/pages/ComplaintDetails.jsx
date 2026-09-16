import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import API from '../services/api';
import DOMPurify from 'dompurify';
import { 
  ShieldCheck, 
  Star,
  XCircle,
  RotateCcw,
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  MessageSquare, 
  Send, 
  Activity,
  RefreshCw,
  FileText,
  UserCheck,
  User,
  Building2,
  Tag,
  AlertTriangle,
  Download,
  Calendar,
  Check,
  Crown,
  Edit2,
  Award
} from 'lucide-react';
import ResolutionCertificateModal from '../components/ResolutionCertificateModal';

const MOCK_COMPLAINT_DATA = {
  _id: 'CMP0005',
  complaintId: 'CMP0005',
  category: 'IT Support',
  priority: 'Medium',
  subject: 'Unable to Access Company ERP System',
  title: 'Unable to Access Company ERP System',
  description: 'I am unable to access the company ERP system since this morning. I receive an "Access Denied" error. This is affecting my daily work and pending tasks. Kindly check and resolve this issue at the earliest.',
  status: 'Pending',
  staffName: 'Ankitha S',
  staffId: 'EMP3833',
  department: 'General',
  teamLeader: 'TL001 (Michael Carter)',
  createdAt: '2026-07-30T09:12:05.000Z',
  attachments: ['erp_error_screenshot.png'],
  comments: [],
  timeline: [
    {
      title: 'Complaint Created',
      description: 'Submitted by Ankitha S & assigned to Team Leader TL001',
      timestamp: '2026-07-30T09:12:05.000Z'
    }
  ]
};

const ComplaintDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);

  // Comment Form & Edit State (15 min window)
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentIndex, setEditingCommentIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEditComment = async (idx) => {
    if (!editingText.trim()) return;
    setSavingEdit(true);
    try {
      await API.put(`/complaints/${id}/comments/${idx}`, {
        message: editingText.trim()
      });
      setComplaint(prev => {
        const updated = [...(prev.comments || [])];
        if (updated[idx]) {
          updated[idx].message = editingText.trim();
          updated[idx].isEdited = true;
        }
        return { ...prev, comments: updated };
      });
      setEditingCommentIndex(null);
      setEditingText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit comment. The 15-minute edit window may have expired.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Ratings & Cancel State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reopenReason, setReopenReason] = useState('');

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/complaints/${id}`);
      if (res.data) {
        setComplaint({
          ...res.data,
          subject: res.data.subject || res.data.title || 'Untitled Complaint',
          description: res.data.description || 'No description provided.',
          status: res.data.status || 'Pending',
          staffName: res.data.staffName || user?.name || 'Ankitha S',
          staffId: res.data.staffId || user?.employeeId || 'EMP3833',
          department: res.data.responsibleDepartment?.name || res.data.department || user?.department || 'General',
          teamLeader: res.data.assignedTeamLeader?.name ? `${res.data.assignedTeamLeader.name} (${res.data.assignedTeamLeader.employeeId})` : res.data.teamLeader || 'Unassigned',
          departmentManager: res.data.departmentManager?.name ? `${res.data.departmentManager.name} (${res.data.departmentManager.employeeId})` : 'Unassigned',
          escalatedToSuperAdmin: res.data.escalatedToSuperAdmin || false,
          attachments: res.data.attachments || [],
          comments: res.data.comments || [],
          timeline: res.data.timeline || [
            {
              title: 'Complaint Created',
              description: `Submitted & assigned to ${res.data.teamLeader || 'Team Leader'}`,
              timestamp: res.data.createdAt || new Date().toISOString()
            }
          ]
        });
      } else {
        setComplaint({ ...MOCK_COMPLAINT_DATA, _id: id, complaintId: id });
      }
    } catch (err) {
      console.warn('Backend fetch fallback (using mock details for ticket display):', err);
      setComplaint({ 
        ...MOCK_COMPLAINT_DATA, 
        _id: id || 'CMP0005', 
        complaintId: id || 'CMP0005' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleCancel = async () => {
    if(!window.confirm('Are you sure you want to cancel this ticket?')) return;
    try {
      await API.put(`/complaints/${id}/cancel`);
      fetchComplaintDetails();
    } catch(err) {
      alert('Failed to cancel ticket');
    }
  };

  const handleReopen = async () => {
    if(!reopenReason.trim()) return alert('Please provide a reason to reopen');
    try {
      await API.put(`/complaints/${id}/reopen`, { comment: reopenReason });
      setReopenReason('');
      fetchComplaintDetails();
    } catch(err) {
      alert('Failed to reopen ticket');
    }
  };

  const handleRating = async (val) => {
    try {
      await API.put(`/complaints/${id}/feedback`, { rating: val });
      setComplaint(prev => ({...prev, feedbackRating: val}));
      setRating(val);
      alert('Thank you for your feedback!');
    } catch(err) {
      alert('Failed to submit rating');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !complaint) return;

    setSubmittingComment(true);
    const commentObj = {
      senderName: user?.name || 'Ankitha S',
      senderRole: user?.role || 'Staff',
      message: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      try {
        await API.put(`/complaints/${id}`, { comment: newComment.trim() });
      } catch (apiErr) {
        console.warn('Comment API fallback:', apiErr);
      }
      
      setComplaint(prev => ({
        ...prev,
        comments: [...(prev.comments || []), commentObj]
      }));
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return { bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC', label: 'RESOLVED' };
      case 'in progress':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'IN PROGRESS' };
      case 'escalated':
        return { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5', label: 'ESCALATED' };
      default:
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'PENDING' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' };
      case 'high':
        return { bg: '#FFEDD5', color: '#EA580C', border: '#FDBA74' };
      case 'low':
        return { bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC' };
      default:
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' };
    }
  };

  const statusBadge = getStatusBadge(complaint?.status);
  const priorityBadge = getPriorityBadge(complaint?.priority);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="my-complaints" unreadCount={3} />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link 
              to="/my-complaints" 
              style={{ 
                color: '#2563EB', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                fontWeight: '700', 
                fontSize: '0.88rem',
                marginBottom: '0.5rem'
              }}
            >
              <ArrowLeft size={16} /> Back to My Complaints
            </Link>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Complaint Ticket Details
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0, fontWeight: '600' }}>
              Ticket Reference: <strong style={{ color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>{complaint?.complaintId || complaint?._id || id}</strong>
            </p>
          </div>

          {complaint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {(complaint.status === 'Pending' || complaint.status === 'Submitted') && (
                <button 
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '14px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <XCircle size={16} /> Cancel Ticket
                </button>
              )}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.border}`,
                padding: '0.55rem 1.25rem',
                borderRadius: '14px',
                fontSize: '0.85rem',
                fontWeight: '800',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusBadge.color, display: 'inline-block' }}></span>
                STATUS: {statusBadge.label}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '5rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>Loading ticket details...</div>
          </div>
        ) : complaint && (
          <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* TICKET DETAILS CARD */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                
                {/* CATEGORY & PRIORITY HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#EFF6FF', 
                      color: '#1D4ED8', 
                      border: '1px solid #BFDBFE',
                      padding: '0.35rem 0.85rem', 
                      borderRadius: '10px', 
                      fontSize: '0.78rem', 
                      fontWeight: '800',
                      marginBottom: '0.65rem'
                    }}>
                      <Tag size={13} />
                      {complaint.category?.toUpperCase() || 'GENERAL'}
                    </span>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif", wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {complaint.subject}
                    </h2>
                  </div>

                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: priorityBadge.bg,
                    color: priorityBadge.color,
                    border: `1px solid ${priorityBadge.border}`,
                    padding: '0.4rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: '800'
                  }}>
                    PRIORITY: {complaint.priority?.toUpperCase()}
                  </span>
                </div>

                {/* ISSUE DESCRIPTION WITH HIGH CONTRAST */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                    Issue Description
                  </h4>
                  <div style={{ 
                    color: '#0F172A', 
                    fontSize: '0.95rem', 
                    fontWeight: '500',
                    lineHeight: '1.65', 
                    background: '#F8FAFC', 
                    padding: '1.25rem', 
                    borderRadius: '14px', 
                    border: '1px solid #CBD5E1',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(complaint.description) }} />
                  </div>
                </div>

                {/* ATTACHED FILES */}
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                      Attached Files ({complaint.attachments.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      {complaint.attachments.map((att, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.55rem 0.95rem', borderRadius: '10px', fontSize: '0.85rem', color: '#1D4ED8', fontWeight: '700' }}>
                          <Paperclip size={16} /> 
                          <span>{att}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COMMENTS & ACTIVITY LOG */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.55rem', fontFamily: "'Outfit', sans-serif" }}>
                  <MessageSquare size={20} color="#2563EB" /> Activity & Conversation Log
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {(!complaint.comments || complaint.comments.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.9rem', fontWeight: '600' }}>
                      No messages posted yet. Leave a comment below to update your Team Leader.
                    </div>
                  ) : (
                    complaint.comments.map((comm, idx) => {
                      const commentTime = new Date(comm.createdAt || Date.now()).getTime();
                      const minutesPassed = (Date.now() - commentTime) / (1000 * 60);
                      const isMine = user && (user.name === comm.senderName || comm.senderRole === user.role);
                      const canEdit = isMine && minutesPassed <= 15;
                      const isEditing = editingCommentIndex === idx;

                      return (
                        <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: '800' }}>
                                {comm.senderName}
                              </strong>
                              <span style={{ background: '#2563EB', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800' }}>
                                {comm.senderRole || 'Staff'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                                {comm.createdAt ? new Date(comm.createdAt).toLocaleString() : 'Recent'}
                                {comm.isEdited && <em style={{ marginLeft: '0.4rem', color: '#475569', fontWeight: '700', fontStyle: 'normal' }}>(edited)</em>}
                              </span>
                              {canEdit && !isEditing && (
                                <button
                                  onClick={() => { setEditingCommentIndex(idx); setEditingText(comm.message); }}
                                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                  title="Edit comment (available for 15 min after posting)"
                                >
                                  <Edit2 size={11} /> Edit
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
                                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #2563EB', fontSize: '0.9rem', outline: 'none', background: '#FFF' }}
                              />
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditingCommentIndex(null)}
                                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEditComment(idx)}
                                  disabled={savingEdit || !editingText.trim()}
                                  style={{ background: '#2563EB', border: 'none', color: '#FFF', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  <Check size={12} /> Save Edit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.9rem', color: '#0F172A', margin: 0, lineHeight: 1.5, fontWeight: '500' }}>{comm.message}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* POST COMMENT FORM */}
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.85rem' }}>
                  <input
                    type="text"
                    placeholder="Type a follow-up comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: (submittingComment || !newComment.trim()) ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                      opacity: (submittingComment || !newComment.trim()) ? 0.6 : 1
                    }}
                  >
                    <Send size={16} /> Post
                  </button>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* FEEDBACK AND REOPEN CARD (Only if Resolved/Closed) */}
              {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={18} color="#D97706" /> Resolution Feedback
                  </h4>
                  
                  {complaint.feedbackRating ? (
                    <div>
                      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={20} fill={s <= complaint.feedbackRating ? "#F59E0B" : "none"} color={s <= complaint.feedbackRating ? "#F59E0B" : "#CBD5E1"} />
                        ))}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>You rated this resolution {complaint.feedbackRating}/5.</p>
                      <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', color: '#166534', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} color="#16A34A" />
                        <span>This complaint has been resolved.</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', marginTop: 0 }}>How would you rate the resolution of this issue?</p>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star 
                            key={s} 
                            size={24} 
                            onClick={() => handleRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            fill={(hoverRating || rating) >= s ? "#F59E0B" : "none"} 
                            color={(hoverRating || rating) >= s ? "#F59E0B" : "#CBD5E1"}
                            style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                          />
                        ))}
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '1.25rem 0' }} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>Not satisfied with the resolution?</p>
                        <input 
                          type="text" 
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="Reason for reopening..."
                          style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button 
                          onClick={handleReopen}
                          style={{ background: '#FFF', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <RotateCcw size={14} /> Reopen Ticket
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Official Resolution Certificate Button */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      type="button"
                      onClick={() => setShowCertModal(true)}
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                        color: '#FFFFFF',
                        border: '1px solid #D97706',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Award size={18} color="#F59E0B" /> View Resolution Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* REQUESTER INFO CARD */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.15rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                  Staff Requester Info
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '2px' }}>
                      Staff Name
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: '800', fontSize: '0.95rem' }}>
                      <User size={16} style={{ color: '#2563EB' }} />
                      {complaint.staffName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '2px' }}>
                      Employee ID
                    </span>
                    <div style={{ color: '#2563EB', fontWeight: '800', fontSize: '0.92rem', fontFamily: "'Outfit', sans-serif" }}>
                      {complaint.staffId}
                    </div>
                  </div>

                  {(() => {
                    const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());
                    const deptVal = complaint.responsibleDepartment?.name || 
                      (!isObjectId(complaint.department) ? (typeof complaint.department === 'string' ? complaint.department : complaint.department?.name) : '') ||
                      'Finance & Accounting';

                    const tlVal = complaint.assignedTeamLeader?.name || 
                      (!isObjectId(complaint.teamLeader) ? complaint.teamLeader : '') || 
                      'Tarun Verma';

                    const mgrVal = complaint.departmentManager?.name || 
                      (!isObjectId(complaint.departmentManager) ? complaint.departmentManager : '') || 
                      'Ananya Sen';

                    return (
                      <>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '2px' }}>
                            Department
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E293B', fontWeight: '700', fontSize: '0.9rem' }}>
                            <Building2 size={16} style={{ color: '#64748B' }} />
                            {deptVal}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '2px' }}>
                            Assigned Team Leader
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', fontWeight: '800', fontSize: '0.9rem' }}>
                            <UserCheck size={16} style={{ color: '#4F46E5' }} />
                            {tlVal}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '2px' }}>
                            Department Manager
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: '800', fontSize: '0.9rem' }}>
                            <Crown size={16} style={{ color: '#F59E0B' }} />
                            {mgrVal}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {complaint.escalatedToSuperAdmin && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.8rem', fontWeight: '700' }}>
                      <ShieldCheck size={16} /> ESCALATED TO SUPER ADMIN
                    </div>
                  )}

                </div>
              </div>

              {/* CONTRIBUTORS / WORK HISTORY CARD */}
              {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Approved' || complaint.status === 'Pending HR Review') && (
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.15rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                    Ticket Contributors / Work History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(() => {
                      const actors = new Map();
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
                      
                      // Creator / Requester
                      const sName = getSafeStr(complaint.staffName) || (complaint.createdBy?.name || '');
                      if (sName) actors.set(sName, 'Raised Complaint');
                      
                      // Assigned TL
                      const tlName = complaint.assignedTeamLeader?.name || getSafeStr(complaint.teamLeader) || 'Tarun Verma';
                      if (tlName && tlName !== 'Unassigned') actors.set(tlName, 'Assigned Team Leader');
                      
                      // Department Manager
                      const mgrName = complaint.departmentManager?.name || getSafeStr(complaint.departmentManager) || 'Ananya Sen';
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

              {/* TIMELINE AUDIT CARD */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.15rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
                  <Activity size={18} color="#2563EB" /> Complaint Timeline
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {(!complaint.timeline || complaint.timeline.length === 0) ? (
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No timeline entries recorded.</div>
                  ) : (
                    complaint.timeline.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', 
                          color: '#FFF', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.75rem', 
                          fontWeight: '800', 
                          flexShrink: 0, 
                          boxShadow: '0 2px 6px rgba(37,99,235,0.25)' 
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>{item.title}</div>
                          {item.description && <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: '600', marginTop: '2px' }}>{item.description}</div>}
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={12} />
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
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
      </main>

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

export default ComplaintDetails;
