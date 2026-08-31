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
  AlertTriangle
} from 'lucide-react';

const HRComplaintDetails = () => {
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

  const fetchComplaint = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/hr/complaints/${id}`);
      setComplaint(res.data);
      if (res.data) setStatus(res.data.status);
    } catch (err) {
      console.error('Fetch HR complaint error:', err);
      setError('Unable to load complaint details. Please try again.');
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

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar activeTabTitle="HR Complaint Management" />
        <div style={{ padding: '2rem 2.5rem', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(220,38,38,0.1)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Access Error</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  // Normalized Fields Processing
  const responsibleDeptName = complaint.responsibleDepartment?.name || complaint.department || 'General';
  const assignedTLName = complaint.assignedTeamLeader?.name || complaint.teamLeader || 'Unassigned';
  const assignedTLEmpId = complaint.assignedTeamLeader?.employeeId ? `(${complaint.assignedTeamLeader.employeeId})` : '';
  const deptManagerName = complaint.departmentManager?.name || 'Unassigned';
  const deptManagerEmpId = complaint.departmentManager?.employeeId ? `(${complaint.departmentManager.employeeId})` : '';

  const isEscalated = complaint.status === 'Escalated' || complaint.status === 'Escalated to Super Admin' || complaint.escalated || complaint.escalatedToSuperAdmin;
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  
  let slaText = calculateSLATimeLeft(complaint.createdAt, complaint.priority, complaint.status, complaint.totalPausedDuration);
  let isSlaBreached = slaText.toLowerCase().includes('breach');

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
                  complaint.comments.map((comm, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{comm.senderName}</strong>
                          <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginLeft: '0.5rem' }}>
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
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} /> Ticket Resolved
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#14532D', margin: '0', lineHeight: '1.5' }}>
                  This ticket has been resolved or closed. Status modifications are completed.
                </p>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1.25rem' }}>
                  HR Action & Resolution
                </h3>

                {complaint.status === 'Submitted' || complaint.status === 'Pending' ? (
                  <button 
                    onClick={handleAcceptComplaint} 
                    disabled={updatingStatus} 
                    style={{ width: '100%', background: '#2563EB', color: '#FFF', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: updatingStatus ? 0.7 : 1 }}
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
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1rem 0' }}>Provide the resolution report details to resolve and close this ticket.</p>
                      
                      <textarea
                        rows="3"
                        placeholder="Enter HR resolution report details..."
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', resize: 'vertical', background: '#F8FAFC', marginBottom: '0.75rem' }}
                      />
                      
                      <button 
                        onClick={async () => {
                          if (!actionNote) return alert('Please write a resolution report.');
                          setUpdatingStatus(true);
                          try {
                            const res = await API.post(`/hr/complaints/${id}/resolve-report`, { reportText: actionNote });
                            setComplaint(res.data.complaint);
                            setActionNote('');
                            alert('HR Resolution report submitted successfully!');
                          } catch (err) { alert('Failed to send resolution report.'); }
                          setUpdatingStatus(false);
                        }}
                        disabled={updatingStatus || !actionNote} 
                        style={{ width: '100%', background: '#16A34A', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', opacity: (updatingStatus || !actionNote) ? 0.7 : 1 }}
                      >
                        Submit Resolution Report
                      </button>
                    </div>

                    {/* Escalate to Super Admin Form */}
                    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} color="#DC2626" /> I cannot solve this issue
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1rem 0' }}>Escalate this complaint directly to Super Admin for final review.</p>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to escalate this complaint to Super Admin?')) {
                            setUpdatingStatus(true);
                            try {
                              const res = await API.put(`/hr/complaints/${id}/escalate`, { reason: 'Escalated to Super Admin by HR' });
                              setComplaint(res.data.complaint);
                              alert('Complaint escalated to Super Admin successfully.');
                            } catch (err) { alert('Failed to escalate complaint.'); }
                            setUpdatingStatus(false);
                          }
                        }}
                        disabled={updatingStatus} 
                        style={{ width: '100%', background: '#DC2626', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', opacity: updatingStatus ? 0.7 : 1 }}
                      >
                        Escalate to Super Admin
                      </button>
                    </div>

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
    </div>
  );
};

export default HRComplaintDetails;
