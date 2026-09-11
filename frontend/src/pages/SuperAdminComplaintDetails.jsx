import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
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
  Award,
  Star,
  Edit3,
  UserCheck
} from 'lucide-react';

const SuperAdminComplaintDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action Form States
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedHandler, setSelectedHandler] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // SLA Extension State
  const [extendHours, setExtendHours] = useState('24');
  const [extendingSLA, setExtendingSLA] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [resDetails, resTLs] = await Promise.all([
        API.get(`/complaints/${id}`),
        API.get('/hr/team-leaders').catch(() => ({ data: [] }))
      ]);

      const data = resDetails.data || null;
      setComplaint(data);
      if (data) {
        setStatus(data.status || '');
        setPriority(data.priority || 'Medium');
        setSelectedHandler(data.assignedTo?._id || data.assignedTo || '');
      }

      const tls = resTLs.data || [];
      setTeamLeaders(tls);
    } catch (err) {
      console.error('Fetch Super Admin complaint error:', err);
      setError(err.response?.data?.message || 'Failed to load complaint details. It may not exist or access is restricted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchComplaintDetails();
  }, [id]);

  // Update Status / Handler / Priority
  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    setUpdatingStatus(true);
    try {
      const payload = {
        status,
        priority,
        assignedTo: selectedHandler || null,
        comment: actionNote || `Super Admin updated status to ${status}`
      };

      const res = await API.put(`/complaints/${complaint._id}`, payload);
      setComplaint(res.data);
      setActionNote('');
      alert('Complaint updated successfully by Super Admin!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Extend SLA Deadline
  const handleExtendSLA = async (e) => {
    e.preventDefault();
    if (!complaint || !extendHours) return;

    setExtendingSLA(true);
    try {
      const res = await API.put(`/complaints/${complaint._id}/extend-sla`, {
        hours: parseInt(extendHours, 10)
      });
      setComplaint(res.data);
      alert(`SLA deadline extended by ${extendHours} hours.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend SLA deadline.');
    } finally {
      setExtendingSLA(false);
    }
  };

  // Add Executive Audit Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;

    setSubmittingComment(true);
    try {
      const res = await API.put(`/complaints/${complaint._id}`, {
        comment: `[Super Admin Executive Note]: ${commentText.trim()}`,
        timelineTitle: 'Super Admin Oversight Note',
        timelineDescription: commentText.trim()
      });
      setComplaint(res.data);
      setCommentText('');
    } catch (err) {
      alert('Failed to post audit note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <SuperAdminSidebar activeTab="complaints" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem', color: '#2563EB' }} />
            <p style={{ fontWeight: '600' }}>Loading Super Admin Complaint Control View...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <SuperAdminSidebar activeTab="complaints" />
        <main style={{ flex: 1, padding: '4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2.5rem', borderRadius: '16px', maxWidth: '520px', width: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <AlertCircle size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.5rem 0' }}>Complaint Not Found</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
              {error || 'The requested complaint ticket could not be located or may have been deleted.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/superadmin-dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Super Admin Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const slaInfo = calculateSLATimeLeft(complaint.slaDeadline || complaint.createdAt, complaint.priority);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Resolved':
      case 'Approved':
      case 'Closed':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'In Progress':
      case 'Pending HR Review':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
      case 'Escalated':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
      default:
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
    }
  };

  const statusBadge = getStatusBadge(complaint.status);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="complaints" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* TOP NAVIGATION / BACK BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/superadmin-dashboard')} 
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.5rem 1rem', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <button 
              onClick={() => navigate('/superadmin-complaints')} 
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.5rem 1rem', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              Control Center
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '800', padding: '0.35rem 0.85rem', borderRadius: '20px' }}>
              Super Admin View
            </span>
            {complaint.escalatedToSuperAdmin && (
              <span style={{ background: '#7C3AED', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '800', padding: '0.35rem 0.85rem', borderRadius: '20px' }}>
                L2 ESCALATED TO SUPER ADMIN
              </span>
            )}
          </div>
        </div>

        {/* HEADER TITLE CARD */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem 2rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: '800', color: '#2563EB' }}>
                {complaint.complaintId}
              </span>
              <span style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px' }}>
                {complaint.status}
              </span>
              <span style={{ background: complaint.priority === 'Critical' ? '#FEF2F2' : '#F8FAFC', color: complaint.priority === 'Critical' ? '#DC2626' : '#475569', border: `1px solid ${complaint.priority === 'Critical' ? '#FCA5A5' : '#E2E8F0'}`, fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {complaint.priority} Priority
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: '1.3' }}>
              {complaint.subject}
            </h1>

            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Category: <strong style={{ color: '#334155' }}>{complaint.category || 'General'}</strong></span>
              <span>&bull;</span>
              <span>Department: <strong style={{ color: '#334155' }}>{complaint.responsibleDepartment?.name || complaint.department || 'Unassigned'}</strong></span>
              <span>&bull;</span>
              <span>Created: <strong style={{ color: '#334155' }}>{new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>

          {/* SLA COUNTDOWN BADGE */}
          <div style={{ background: slaInfo.isOverdue ? '#FEF2F2' : '#F0FDFA', border: `1px solid ${slaInfo.isOverdue ? '#FCA5A5' : '#99F6E4'}`, padding: '1rem 1.25rem', borderRadius: '16px', textAlign: 'right', minWidth: '180px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: slaInfo.isOverdue ? '#DC2626' : '#0D9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {slaInfo.isOverdue ? 'SLA VIOLATED' : 'SLA REMAINING'}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: slaInfo.isOverdue ? '#991B1B' : '#0F766E', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
              {slaInfo.timeLeftFormatted}
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* COMPLAINANT INFORMATION */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} color="#2563EB" /> Complainant Information
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1.1rem 1.25rem', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>STAFF NAME</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                    {complaint.createdBy?.name || complaint.staffName || 'Anonymous / Staff'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>EMPLOYEE ID</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
                    {complaint.createdBy?.employeeId || complaint.staffId || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>DEPARTMENT</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                    {complaint.createdBy?.department || complaint.department || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>DESIGNATION</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                    {complaint.createdBy?.designation || 'Staff Member'}
                  </div>
                </div>
              </div>
            </div>

            {/* ORIGINAL COMPLAINT DESCRIPTION */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="#2563EB" /> Original Complaint Statement
              </div>

              <div 
                style={{ background: '#F8FAFC', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(complaint.description || 'No description provided.') }}
              />

              {/* ATTACHMENTS IF ANY */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Attached Documentation ({complaint.attachments.length})
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {complaint.attachments.map((att, idx) => (
                      <a 
                        key={idx} 
                        href={att.url || att} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Paperclip size={13} /> {att.name || `Attachment #${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CHRONOLOGICAL EVENT HISTORY TIMELINE */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#2563EB" /> Event History & Audit Log
              </div>

              {!complaint.timeline || complaint.timeline.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No events recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #E2E8F0', marginLeft: '0.75rem' }}>
                  {complaint.timeline.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1.1rem', borderRadius: '12px' }}>
                      <div style={{ position: 'absolute', left: '-1.95rem', top: '14px', width: '12px', height: '12px', borderRadius: '50%', background: '#2563EB', border: '2px solid #FFFFFF' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0F172A' }}>{item.title}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
                          {item.description}
                        </div>
                      )}
                      {item.updatedByName && (
                        <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: '700', marginTop: '4px' }}>
                          By {item.updatedByName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXECUTIVE DISCUSSION & AUDIT NOTES */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="#7C3AED" /> Ticket Thread & Audit Directives
              </div>

              {/* COMMENTS THREAD */}
              {complaint.comments && complaint.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {complaint.comments.map((cm, i) => (
                    <div key={i} style={{ background: '#F8FAFC', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A' }}>
                          {cm.senderName} <span style={{ color: '#2563EB', fontWeight: '600' }}>({cm.senderRole})</span>
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                          {cm.createdAt ? new Date(cm.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>{cm.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>No discussion messages or notes posted yet.</p>
              )}

              {/* POST AUDIT NOTE FORM */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.6rem' }}>
                <input 
                  type="text" 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  placeholder="Post executive directive or audit note to ticket thread..." 
                  style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.88rem', outline: 'none' }} 
                />
                <button 
                  type="submit" 
                  disabled={submittingComment || !commentText.trim()} 
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.7rem 1.25rem', fontWeight: '700', fontSize: '0.85rem', cursor: (submittingComment || !commentText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> Send Directive
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN - EXECUTIVE ACTIONS & CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* HANDLER & DEPT ASSIGNMENT CARD */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={16} color="#2563EB" /> Resolver Assignment
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>ASSIGNED HANDLER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                    {complaint.assignedTo?.name || complaint.assignedTeamLeader?.name || complaint.teamLeader || 'Unassigned'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>DEPARTMENT MANAGER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                    {complaint.departmentManager?.name || 'Department Manager'}
                  </div>
                </div>
              </div>
            </div>

            {/* SUPER ADMIN OVERRIDE CONTROLS */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={16} color="#2563EB" /> Super Admin Controls
              </div>

              <form onSubmit={handleUpdateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>
                    Lifecycle Status
                  </label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  >
                    <option value="Pending">Pending (Initial)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting on User">Waiting on User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Approved">Approved</option>
                    <option value="Closed">Closed</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Pending HR Review">Pending HR Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>
                    Reassign Handler
                  </label>
                  <select 
                    value={selectedHandler} 
                    onChange={e => setSelectedHandler(e.target.value)} 
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  >
                    <option value="">-- Keep Current Handler --</option>
                    {teamLeaders.map(tl => (
                      <option key={tl._id || tl.id} value={tl._id || tl.id}>
                        {tl.name} ({tl.role} - {tl.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>
                    Priority Level
                  </label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value)} 
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>
                    Audit Remark / Directive Note
                  </label>
                  <input 
                    type="text" 
                    value={actionNote} 
                    onChange={e => setActionNote(e.target.value)} 
                    placeholder="Brief reason for update..." 
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={updatingStatus} 
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '800', fontSize: '0.85rem', cursor: updatingStatus ? 'not-allowed' : 'pointer', width: '100%', marginTop: '0.25rem' }}
                >
                  {updatingStatus ? 'Applying Changes...' : 'Save Executive Updates'}
                </button>
              </form>
            </div>

            {/* SLA EXTENSION CARD */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#D97706" /> Extend SLA Deadline
              </div>

              <form onSubmit={handleExtendSLA} style={{ display: 'flex', gap: '0.6rem' }}>
                <select 
                  value={extendHours} 
                  onChange={e => setExtendHours(e.target.value)} 
                  style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                >
                  <option value="12">+ 12 Hours</option>
                  <option value="24">+ 24 Hours (1 Day)</option>
                  <option value="48">+ 48 Hours (2 Days)</option>
                  <option value="72">+ 72 Hours (3 Days)</option>
                </select>
                <button 
                  type="submit" 
                  disabled={extendingSLA} 
                  style={{ background: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '700', fontSize: '0.82rem', cursor: extendingSLA ? 'not-allowed' : 'pointer' }}
                >
                  Extend
                </button>
              </form>
            </div>

            {/* RESOLUTION & FEEDBACK REPORT IF RESOLVED */}
            {['Resolved', 'Closed', 'Approved'].includes(complaint.status) && (
              <div style={{ background: '#ECFDF5', borderRadius: '20px', border: '1px solid #A7F3D0', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} color="#059669" /> Complainant Feedback
                </div>

                {complaint.feedbackRating ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                      {[1,2,3,4,5].map(st => (
                        <Star key={st} size={16} fill={st <= complaint.feedbackRating ? '#F59E0B' : 'none'} color={st <= complaint.feedbackRating ? '#F59E0B' : '#CBD5E1'} />
                      ))}
                      <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#92400E', marginLeft: '6px' }}>
                        {complaint.feedbackRating} / 5 Stars
                      </span>
                    </div>
                    {complaint.feedbackComment && (
                      <p style={{ fontSize: '0.82rem', color: '#064E3B', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                        "{complaint.feedbackComment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#047857', margin: 0 }}>
                    Staff feedback rating has not been submitted yet.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
};

export default SuperAdminComplaintDetails;
