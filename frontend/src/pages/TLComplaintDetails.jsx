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
  Wand2
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

  // Helper for safely extracting string names
  const getSafeStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name && typeof val.name === 'string') return val.name;
    return '';
  };

  // Normalized Fields Processing
  const responsibleDeptName = getSafeStr(complaint.responsibleDepartment) || (typeof complaint.department === 'string' ? complaint.department : (complaint.department?.name || 'General'));
  const assignedTLName = getSafeStr(complaint.assignedTeamLeader) || getSafeStr(complaint.teamLeader) || 'Unassigned';
  const assignedTLEmpId = complaint.assignedTeamLeader?.employeeId ? `(${complaint.assignedTeamLeader.employeeId})` : '';
  const deptManagerName = getSafeStr(complaint.departmentManager) || 'Unassigned';
  const deptManagerEmpId = complaint.departmentManager?.employeeId ? `(${complaint.departmentManager.employeeId})` : '';

  const isEscalated = complaint.status === 'Escalated' || complaint.escalated || complaint.escalatedToSuperAdmin;
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  
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
                  This complaint has exceeded its SLA and has been escalated for final resolution. Normal Team Leader status updates are locked.
                </p>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.85rem' }}>
                  <div style={{ color: '#991B1B', fontWeight: '700', marginBottom: '0.25rem' }}>Escalated To:</div>
                  <div style={{ color: '#0F172A', fontWeight: '600' }}>{complaint.escalatedToSuperAdmin ? 'Super Admin' : 'Manager'}</div>
                </div>
              </div>
            ) : isResolved ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} /> Ticket Resolved
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#14532D', margin: '0', lineHeight: '1.5' }}>
                  This ticket has been resolved or closed. Status modifications are disabled.
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Resolution Report Form */}
                    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} color="#16A34A" /> I solved this issue
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1rem 0' }}>Write a report explaining the solution. This will send the report to the HR team for final review.</p>
                      
                      <textarea
                        rows="3"
                        placeholder="Enter resolution report details..."
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', resize: 'vertical', background: '#F8FAFC', marginBottom: '0.75rem' }}
                      />
                      
                      <button 
                        onClick={async () => {
                          if (!actionNote) return alert('Please write a report.');
                          setUpdatingStatus(true);
                          try {
                            const res = await API.post(`/teamleader/complaints/${id}/resolve-report`, { reportText: actionNote });
                            setComplaint(res.data.complaint);
                            alert('Report sent successfully!');
                          } catch (err) { alert('Failed to send report.'); }
                          setUpdatingStatus(false);
                        }}
                        disabled={updatingStatus || !actionNote} 
                        style={{ width: '100%', background: '#16A34A', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', opacity: (updatingStatus || !actionNote) ? 0.7 : 1 }}
                      >
                        Submit Resolution Report
                      </button>
                    </div>

                    {/* Escalate Form */}
                    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} color="#DC2626" /> I cannot solve this issue
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1rem 0' }}>Escalate this directly to the Department Manager for final resolution.</p>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to escalate this complaint to the manager?')) {
                            setUpdatingStatus(true);
                            try {
                              const res = await API.put(`/teamleader/complaints/${id}/escalate`, { reason: 'Escalated manually by Team Leader' });
                              setComplaint(res.data.complaint);
                              alert('Complaint escalated.');
                            } catch (err) { alert('Failed to escalate.'); }
                            setUpdatingStatus(false);
                          }
                        }}
                        disabled={updatingStatus} 
                        style={{ width: '100%', background: '#DC2626', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', opacity: updatingStatus ? 0.7 : 1 }}
                      >
                        Escalate to Manager
                      </button>
                    </div>
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
                    const sName = getSafeStr(complaint.staffName);
                    if (sName) actors.set(sName, 'Raised Complaint');
                    
                    // Assigned TL
                    const tlName = getSafeStr(complaint.assignedTeamLeader) || getSafeStr(complaint.teamLeader);
                    if (tlName && tlName !== 'Unassigned') actors.set(tlName, 'Assigned Team Leader');
                    
                    // Department Manager
                    const mgrName = getSafeStr(complaint.departmentManager);
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
    </div>
  );
};

export default TLComplaintDetails;
