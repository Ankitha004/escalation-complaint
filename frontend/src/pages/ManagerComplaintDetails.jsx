import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ManagerSidebar from '../components/ManagerSidebar';
import API from '../services/api';
import DOMPurify from 'dompurify';
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
  RotateCcw,
  AlertTriangle,
  LayoutDashboard,
  UserCheck,
  XCircle,
  Sparkles,
  Wand2,
  Bot
} from 'lucide-react';

const ManagerComplaintDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [escalationLogs, setEscalationLogs] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actions State
  const [selectedTL, setSelectedTL] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComplaintAndTLs = async () => {
    setLoading(true);
    setError('');
    try {
      let resDetails;
      try {
        resDetails = await API.get(`/manager/complaints/${id}`);
      } catch (mgrErr) {
        const fallbackRes = await API.get(`/complaints/${id}`);
        resDetails = { data: { complaint: fallbackRes.data, escalationLogs: fallbackRes.data.escalationLogs || [] } };
      }
      
      const resTLs = await API.get('/hr/team-leaders').catch(() => ({ data: [] }));

      const data = resDetails.data || {};
      setComplaint(data.complaint || null);
      setEscalationLogs(data.escalationLogs || []);
      if (data.complaint) {
        setStatusUpdate(data.complaint.status);
      }

      const tls = resTLs.data || [];
      setTeamLeaders(tls.map(t => ({ id: t._id, name: t.name, employeeId: t.employeeId })));
    } catch (err) {
      console.warn('Fetch manager complaint notice:', err);
      setError(err.response?.data?.message || 'Complaint record not found or access restricted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchComplaintAndTLs();
  }, [id]);

  // Reassign complaint to another TL
  const handleReassign = async () => {
    if (!selectedTL) return alert('Please select a Team Leader to reassign.');
    setSubmittingAction(true);
    try {
      const res = await API.put(`/manager/complaints/${id}/reassign`, { teamLeader: selectedTL });
      setComplaint(res.data);
      setSelectedTL('');
      alert('Complaint reassigned successfully!');
      fetchComplaintAndTLs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign complaint.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Update status
  const handleStatusUpdate = async (newStatus) => {
    setSubmittingAction(true);
    try {
      const res = await API.put(`/manager/complaints/${id}/status`, { 
        status: newStatus, 
        note: actionNote || `Status updated to ${newStatus} by Department Manager` 
      });
      setComplaint(res.data);
      setActionNote('');
      alert(`Status updated to ${newStatus}.`);
      fetchComplaintAndTLs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Approve resolution
  const handleApprove = async () => {
    setSubmittingAction(true);
    try {
      const res = await API.put(`/manager/complaints/${id}/approve`);
      setComplaint(res.data);
      alert('Resolution approved.');
      fetchComplaintAndTLs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve resolution.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Close complaint
  const handleClose = async () => {
    setSubmittingAction(true);
    try {
      const res = await API.put(`/manager/complaints/${id}/close`);
      setComplaint(res.data);
      alert('Complaint closed.');
      fetchComplaintAndTLs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close complaint.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Add comment using POST
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;

    setSubmittingComment(true);
    try {
      await API.post(`/manager/complaints/${id}/comment`, {
        message: commentText.trim()
      });
      setCommentText('');
      fetchComplaintAndTLs();
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="complaints" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <main style={{ padding: '2rem 2.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/dashboard" style={{ color: '#4F46E5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.88rem' }}>
              <LayoutDashboard size={16} /> Back to Manager Dashboard
            </Link>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', marginTop: '0.4rem', margin: 0 }}>
              Complaint Review
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Ticket Reference: <strong style={{ color: '#4F46E5' }}>{complaint?.complaintId || id}</strong>
            </p>
          </div>

          {complaint && (
            <span className="status-chip status-chip-rose" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
              <span className="pulse-dot pulse-dot-rose" />
              Status: {complaint.status}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={32} className="spin-icon" style={{ color: '#4F46E5', marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>Loading complaint details...</div>
          </div>
        ) : error || !complaint ? (
          <div style={{ padding: '3rem 2rem', maxWidth: '600px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <AlertCircle size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 0.5rem 0' }}>Complaint Not Found</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
                {error || 'The requested complaint ticket could not be located or may have been deleted.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/manager-sla')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5', color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
                  <ArrowLeft size={16} /> Return to Manager Dashboard
                </button>
                <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', color: '#475569', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <LayoutDashboard size={16} /> Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* TICKET DETAILS CARD */}
              <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span className="status-chip status-chip-indigo" style={{ marginBottom: '0.5rem' }}>
                      {complaint.category}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {complaint.subject || complaint.title}
                    </h2>
                  </div>
                  <span className={`status-chip ${complaint.priority === 'Critical' ? 'status-chip-rose' : 'status-chip-indigo'}`}>
                    Priority: {complaint.priority}
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                    Issue Description
                  </h4>
                  <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.65', background: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(complaint.description) }} />
                  </div>
                </div>

                {/* DEPARTMENT MANAGER ACTION CONSOLE */}
                <div style={{ padding: '1.5rem', background: '#FFF1F2', borderRadius: '16px', border: '1.5px solid #FECDD3' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#BE123C', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} /> Department Manager Actions
                  </h4>

                  {/* TL Resolution Report Review */}
                  {complaint.resolutionReports && complaint.resolutionReports.some(r => r.forwardedTo === 'Manager' && !r.isReviewed) ? (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#7F1D1D', marginBottom: '1rem' }}>
                        The Team Leader has resolved this issue and submitted a report. Please review and forward it to HR.
                      </p>
                      
                      {complaint.resolutionReports.filter(r => r.forwardedTo === 'Manager' && !r.isReviewed).map((report, idx) => (
                        <div key={idx} style={{ background: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid #FECACA', marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: '700', marginBottom: '0.25rem' }}>TL Report ({report.solverName})</div>
                          <div style={{ fontSize: '0.9rem', color: '#0F172A' }}>{report.reportText}</div>
                        </div>
                      ))}

                      <button onClick={async () => {
                        setSubmittingAction(true);
                        try {
                          const res = await API.put(`/manager/complaints/${id}/forward-report`);
                          setComplaint(res.data.complaint);
                          alert('Report forwarded to HR.');
                          fetchComplaintAndTLs();
                        } catch (err) { alert('Failed to forward report.'); }
                        setSubmittingAction(false);
                      }} disabled={submittingAction} style={{ width: '100%', padding: '0.75rem', background: '#BE123C', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                        Forward Report to HR
                      </button>
                    </div>
                  ) : complaint.status === 'Escalated' ? (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#7F1D1D', marginBottom: '1rem' }}>
                        This complaint was escalated from the Team Leader. You can resolve it and submit a report to HR.
                      </p>
                      <textarea
                        rows="3"
                        placeholder="Enter resolution report details..."
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.85rem', outline: 'none', resize: 'vertical', background: '#FFF', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                      />
                      <button onClick={async () => {
                        if (!actionNote) return alert('Please enter a resolution report.');
                        setSubmittingAction(true);
                        try {
                          const res = await API.post(`/manager/complaints/${id}/resolve-report`, { reportText: actionNote });
                          setComplaint(res.data.complaint);
                          setActionNote('');
                          alert('Report submitted to HR.');
                          fetchComplaintAndTLs();
                        } catch (err) { alert('Failed to submit report.'); }
                        setSubmittingAction(false);
                      }} disabled={submittingAction || !actionNote} style={{ width: '100%', padding: '0.75rem', background: '#BE123C', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', opacity: (!actionNote || submittingAction) ? 0.7 : 1 }}>
                        Submit Report to HR
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Status actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {complaint.status !== 'Resolved' && complaint.status !== 'Closed' && complaint.status !== 'Approved' && (
                          <>
                            {complaint.status !== 'In Progress' && (
                              <button onClick={() => handleStatusUpdate('In Progress')} disabled={submittingAction}
                                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Set In Progress
                              </button>
                            )}
                            <button onClick={() => handleStatusUpdate('Resolved')} disabled={submittingAction}
                              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                              <CheckCircle2 size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Resolve
                            </button>
                          </>
                        )}
                        {complaint.status === 'Resolved' && (
                          <button onClick={handleApprove} disabled={submittingAction}
                            style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <CheckCircle2 size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Approve Resolution
                          </button>
                        )}
                        {complaint.status !== 'Closed' && (
                          <button onClick={handleClose} disabled={submittingAction}
                            style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <XCircle size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Close
                          </button>
                        )}
                      </div>

                      {/* Reassign */}
                      {complaint.status !== 'Resolved' && complaint.status !== 'Closed' && complaint.status !== 'Approved' && teamLeaders.length > 0 && (
                        <div style={{ background: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991B1B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <UserCheck size={14} /> Reassign to Team Leader
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select value={selectedTL} onChange={(e) => setSelectedTL(e.target.value)}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.82rem', outline: 'none' }}>
                              <option value="">Select Team Leader...</option>
                              {teamLeaders.map(tl => (
                                <option key={tl.id} value={tl.employeeId}>{tl.name} ({tl.employeeId})</option>
                              ))}
                            </select>
                            <button onClick={handleReassign} disabled={submittingAction || !selectedTL}
                              style={{ background: '#BE123C', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', opacity: (!selectedTL || submittingAction) ? 0.6 : 1 }}>
                              Reassign
                            </button>
                          </div>
                        </div>
                      )}

                      {complaint.status === 'Closed' || complaint.status === 'Approved' ? (
                        <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: '600' }}>
                          ✅ This complaint has been resolved and closed.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* COMMENTS LOG */}
              <div className="content-card">
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <MessageSquare size={20} color="#4F46E5" /> Communication & Remarks
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {(!complaint.comments || complaint.comments.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '14px', color: '#64748B', fontSize: '0.9rem' }}>
                      No comments posted.
                    </div>
                  ) : (
                    complaint.comments.map((comm, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                            {comm.senderName} <span className="status-chip status-chip-indigo" style={{ padding: '0.1rem 0.45rem', fontSize: '0.68rem', marginLeft: '0.35rem' }}>{comm.senderRole}</span>
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {comm.createdAt ? new Date(comm.createdAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0 }}>{comm.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.85rem' }}>
                  <input
                    type="text"
                    placeholder="Add a comment or directive..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="form-control-custom"
                    style={{ flex: 1, paddingLeft: '1rem', backgroundColor: '#FFFFFF' }}
                  />
                  <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn-primary-enterprise" style={{ width: 'auto', padding: '0.65rem 1.35rem' }}>
                    <Send size={16} /> Send
                  </button>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="content-card" style={{ padding: '1.35rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  Requester & Assignment Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Staff Member</span>
                    <strong style={{ color: '#0F172A' }}>{complaint.staffName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Employee ID</span>
                    <span style={{ color: '#4F46E5', fontWeight: '800' }}>{complaint.staffId}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Department</span>
                    <span style={{ color: '#334155', fontWeight: '700' }}>{complaint.department}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Category</span>
                    <span style={{ color: '#334155', fontWeight: '700' }}>{complaint.category}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Assigned Team Leader</span>
                    <strong style={{ color: '#4F46E5' }}>{complaint.teamLeader}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Escalation Level</span>
                    <span style={{ color: complaint.escalationLevel >= 1 ? '#DC2626' : '#16A34A', fontWeight: '800' }}>
                      {complaint.escalationLevel || 0} {complaint.escalatedToSuperAdmin ? '(Escalated to Super Admin)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escalation Logs */}
              {escalationLogs.length > 0 && (
                <div className="content-card" style={{ padding: '1.35rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="#DC2626" /> Escalation Logs
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {escalationLogs.map((log, idx) => (
                      <div key={idx} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991B1B' }}>{log.reason}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
                          {log.escalatedAt ? new Date(log.escalatedAt).toLocaleString() : 'N/A'} | Priority: {log.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTRIBUTORS / WORK HISTORY CARD */}
              {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Approved' || complaint.status === 'Pending HR Review' || true) && (
                <div className="content-card" style={{ padding: '1.35rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', fontFamily: "'Outfit', sans-serif" }}>
                    Ticket Contributors / Work History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(() => {
                      const actors = new Map();
                      
                      const cleanName = (val, fallback = 'Team Member') => {
                        if (!val) return null;
                        if (typeof val === 'object') {
                          return val.name || val.employeeId || fallback;
                        }
                        if (typeof val === 'string') {
                          const str = val.trim();
                          if (/^[0-9a-fA-F]{24}$/.test(str)) {
                            if (complaint.departmentManager?.name && (complaint.departmentManager._id === str || complaint.departmentManager === str)) {
                              return complaint.departmentManager.name;
                            }
                            if (complaint.assignedTeamLeader?.name && (complaint.assignedTeamLeader._id === str || complaint.assignedTeamLeader === str)) {
                              return complaint.assignedTeamLeader.name;
                            }
                            if (complaint.createdBy?.name && (complaint.createdBy._id === str || complaint.createdBy === str)) {
                              return complaint.createdBy.name;
                            }
                            return fallback;
                          }
                          return str;
                        }
                        return fallback;
                      };

                      // Creator / Requester
                      const staffNameStr = cleanName(complaint.staffName || complaint.createdBy, 'Staff Member');
                      if (staffNameStr) actors.set(staffNameStr, 'Raised Complaint');

                      // Assigned TL
                      const tlNameStr = cleanName(complaint.assignedTeamLeader || complaint.teamLeader, 'Team Leader');
                      if (tlNameStr && tlNameStr !== 'Unassigned') actors.set(tlNameStr, 'Assigned Team Leader');

                      // Department Manager
                      const mgrNameStr = cleanName(complaint.departmentManager, 'Department Manager');
                      if (mgrNameStr && mgrNameStr !== 'Unassigned') actors.set(mgrNameStr, 'Department Manager');

                      // Commenters
                      if (complaint.comments && Array.isArray(complaint.comments)) {
                        complaint.comments.forEach(c => {
                          const senderStr = cleanName(c.senderName || c.user, c.senderRole || 'Commenter');
                          if (senderStr) actors.set(senderStr, `${c.senderRole || 'User'} (Commented)`);
                        });
                      }

                      // Solver Reports
                      if (complaint.resolutionReports && Array.isArray(complaint.resolutionReports)) {
                        complaint.resolutionReports.forEach(r => {
                          const solverStr = cleanName(r.solverName || r.solverId, r.solverRole || 'Resolution Officer');
                          if (solverStr) actors.set(solverStr, `${r.solverRole || 'Officer'} (Submitted Report)`);
                        });
                      }

                      // Timeline update actors
                      if (complaint.timeline && Array.isArray(complaint.timeline)) {
                        complaint.timeline.forEach(t => {
                          const updaterStr = cleanName(t.updatedByName || t.updatedBy, 'Department Manager');
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

              <div className="content-card" style={{ padding: '1.35rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="#4F46E5" /> Complaint Timeline
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {(!complaint.timeline || complaint.timeline.length === 0) ? (
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No timeline entries.</div>
                  ) : (
                    complaint.timeline.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary-gradient)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0F172A' }}>{item.title}</div>
                          {item.description && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>{item.description}</div>}
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
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
      </div>
    </div>
  );
};

export default ManagerComplaintDetails;
