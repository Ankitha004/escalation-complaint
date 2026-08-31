import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  ShieldCheck,
  Building,
  Activity,
  UserCheck,
  RefreshCw,
  Clock,
  Check,
  XCircle,
  Users,
  DollarSign,
  AlertTriangle,
  FolderOpen,
  Zap,
  TrendingUp,
  Award,
  Star,
  CheckCircle2,
  Megaphone,
  Sliders,
  Bell,
  ArrowUpRight,
  ShieldAlert,
  Inbox,
  Flame,
  ChevronRight,
  Sparkles,
  Layers,
  Send,
  Eye,
  Edit3
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [triggeringEscalation, setTriggeringEscalation] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Quick Broadcast State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [compRes, usersRes, deptRes, leavesRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/users'),
        API.get('/departments'),
        API.get('/leaves').catch(() => ({ data: [] }))
      ]);

      setComplaints(compRes.data || []);
      setUsersList(usersRes.data || []);
      setDepartments(deptRes.data || []);
      setLeavesList(leavesRes.data || []);
    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  // Trigger Instant SLA Escalation Check
  const handleTriggerSlaCheck = async () => {
    setTriggeringEscalation(true);
    setActionMessage('');
    try {
      const res = await API.post('/complaints/trigger-sla-check');
      setActionMessage(res.data?.message || 'SLA Auto-Escalation Engine ran successfully.');
      await fetchGlobalData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to trigger SLA check.');
    } finally {
      setTriggeringEscalation(false);
    }
  };

  // Dispatch Quick Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcasting(true);
    try {
      await API.post('/notifications/broadcast', {
        title: broadcastTitle.trim() || 'Super Admin Notice',
        message: broadcastMessage.trim(),
        targetRole: targetAudience
      });
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setActionMessage('Broadcast announcement published to all active inboxes!');
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert('Failed to send broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  // Key Statistics
  const totalComplaints = complaints.length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;
  const inProgressCount = complaints.filter(c => ['In Progress', 'Waiting on User', 'Pending HR Review'].includes(c.status)).length;
  const escalatedCount = complaints.filter(c => c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated').length;
  const criticalCount = complaints.filter(c => c.priority === 'Critical').length;
  const clearanceRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;

  // Rating and Staff CSAT
  const feedbackReviews = complaints.filter(c => c.feedbackRating).map(c => Number(c.feedbackRating));
  const avgCsat = feedbackReviews.length > 0
    ? (feedbackReviews.reduce((a, b) => a + b, 0) / feedbackReviews.length).toFixed(1)
    : '5.0';

  // Active Workforce Counts
  const teamLeadersCount = usersList.filter(u => u.role === 'Team Leader' && u.status === 'Active').length;
  const managersCount = usersList.filter(u => u.role === 'Manager' && u.status === 'Active').length;
  const staffCount = usersList.filter(u => u.role === 'Staff' && u.status === 'Active').length;
  const pendingLeavesCount = leavesList.filter(l => l.status && l.status.startsWith('Pending')).length;

  // Urgent / Escalated Complaints Feed
  const urgentTickets = complaints.filter(c => 
    c.priority === 'Critical' || c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated'
  ).slice(0, 5);

  // Department Breakdown
  const deptMap = {};
  departments.forEach(d => {
    deptMap[d.name] = { name: d.name, total: 0, resolved: 0, escalated: 0 };
  });
  complaints.forEach(c => {
    const dName = c.responsibleDepartment?.name || c.department || 'General';
    if (!deptMap[dName]) deptMap[dName] = { name: dName, total: 0, resolved: 0, escalated: 0 };
    deptMap[dName].total += 1;
    if (['Resolved', 'Closed', 'Approved'].includes(c.status)) deptMap[dName].resolved += 1;
    if (c.escalated || c.escalatedToSuperAdmin || c.status === 'Escalated') deptMap[dName].escalated += 1;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="dashboard" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* HEADER WITH LIVE SYSTEM PULSE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Super Admin Command Center 🛡️
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                All Systems Operational
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Real-time enterprise complaint surveillance, automated SLA escalations, workforce performance, and department metrics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowBroadcastModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#EA580C', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(234,88,12,0.25)' }}
            >
              <Megaphone size={16} /> Broadcast
            </button>

            <button 
              onClick={fetchGlobalData} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {actionMessage && (
          <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {actionMessage}
          </div>
        )}

        {/* EXECUTIVE KPI TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          {/* TOTAL COMPLAINTS */}
          <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderOpen size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ORGANIZATION COMPLAINTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {totalComplaints}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: '600', marginTop: '2px' }}>
                {inProgressCount} currently in progress
              </div>
            </div>
          </div>

          {/* RESOLVED TICKETS */}
          <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>RESOLVED & CLEARED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {resolvedCount} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>({clearanceRate}%)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                ★ {avgCsat}/5 Avg Satisfaction
              </div>
            </div>
          </div>

          {/* ESCALATED TICKETS */}
          <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ESCALATED (SLA BREACHES)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#DC2626', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {escalatedCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>
                {criticalCount} critical priority issues
              </div>
            </div>
          </div>

          {/* WORKFORCE & DEPTS */}
          <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>DEPARTMENTS & STAFF</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {departments.length} Depts
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                {teamLeadersCount} TLs &bull; {managersCount} Mgrs &bull; {staffCount} Staff
              </div>
            </div>
          </div>
        </div>

        {/* QUICK COMMAND CENTER SHORTCUTS */}
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="#2563EB" /> Quick Command Shortcuts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
            
            <button 
              onClick={() => navigate('/superadmin-complaints')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <FolderOpen size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>All Complaints</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Master ticket stream</div>
            </button>

            <button 
              onClick={() => navigate('/superadmin-sla')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Clock size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>SLA Monitoring</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Live countdown timers</div>
            </button>

            <button 
              onClick={() => navigate('/superadmin-performance')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF9C3', color: '#854D0E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Award size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Leaderboard</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Resolver rankings & CSAT</div>
            </button>

            <button 
              onClick={() => navigate('/incentives-salary')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <DollarSign size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Incentives & Pay</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Disburse salary & rewards</div>
            </button>

            <button 
              onClick={() => navigate('/staff-management')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Users size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Staff Control</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Roster, roles & access</div>
            </button>

            <button 
              onClick={() => navigate('/superadmin-settings')}
              style={shortcutStyle}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Sliders size={18} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>System Settings</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>SLA rules & security</div>
            </button>

          </div>
        </div>

        {/* DUAL SECTION: ESCALATIONS WATCHLIST & DEPARTMENT BENCHMARK */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>

          {/* URGENT & ESCALATED TICKETS WATCHLIST */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={18} color="#DC2626" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  Critical & Escalated Watchlist
                </h2>
              </div>
              <button 
                onClick={() => navigate('/superadmin-sla')} 
                style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                View SLA Board <ArrowUpRight size={13} />
              </button>
            </div>

            {urgentTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={36} color="#16A34A" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: '700', color: '#0F172A' }}>No Critical Breaches</div>
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>All complaints are being handled on track.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {urgentTickets.map(t => (
                  <div 
                    key={t._id} 
                    style={{ background: '#FFFDFD', border: '1px solid #FEE2E2', padding: '0.85rem 1.1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', fontWeight: '800', color: '#2563EB' }}>
                          {t.complaintId}
                        </span>
                        <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '0.65rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {t.priority}
                        </span>
                        {t.escalatedToSuperAdmin && (
                          <span style={{ background: '#7C3AED', color: '#FFFFFF', fontSize: '0.62rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                            L2 SUPER ADMIN
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.85rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                        {t.subject}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                        Handler: {t.assignedTo?.name || t.assignedTeamLeader?.name || t.teamLeader || 'Unassigned'} &bull; {t.responsibleDepartment?.name || t.department || 'General'}
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/superadmin-complaints')}
                      style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEPARTMENT RESOLUTION HEALTH */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={18} color="#2563EB" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  Department Clearance Velocity
                </h2>
              </div>
              <button 
                onClick={() => navigate('/departments')} 
                style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                All Departments <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {Object.values(deptMap).map((d, i) => {
                const clearRate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
                return (
                  <div key={i} style={{ background: '#F8FAFC', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>{d.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: clearRate >= 75 ? '#16A34A' : clearRate > 0 ? '#F59E0B' : '#64748B' }}>
                        {d.total > 0 ? `${clearRate}% Cleared` : '0 Tickets'}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', margin: '5px 0' }}>
                      <div style={{ width: `${clearRate}%`, height: '100%', background: clearRate >= 75 ? '#16A34A' : clearRate >= 40 ? '#F59E0B' : '#DC2626' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                      <span>{d.resolved} / {d.total} Solved</span>
                      {d.escalated > 0 && <span style={{ color: '#DC2626', fontWeight: '700' }}>{d.escalated} Escalated</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>

      {/* QUICK BROADCAST MODAL */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '480px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Dispatch System Broadcast
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Publish real-time announcement to user inboxes</span>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Notice Title</label>
                <input 
                  type="text" 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="e.g. Scheduled Maintenance / Policy Directive" 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Target Role</label>
                <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} style={inputStyle}>
                  <option value="All">📢 All Employees (Entire Organization)</option>
                  <option value="Staff">Staff Only</option>
                  <option value="Team Leader">Team Leaders Only</option>
                  <option value="Manager">Department Managers Only</option>
                  <option value="HR">HR Team Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Broadcast Message *</label>
                <textarea 
                  rows={3} 
                  required 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                  placeholder="Type announcement message..." 
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={broadcasting} style={{ flex: 1, background: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: broadcasting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(234,88,12,0.25)' }}>
                  <Send size={15} /> {broadcasting ? 'Publishing...' : 'Dispatch Broadcast'}
                </button>
                <button type="button" onClick={() => setShowBroadcastModal(false)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
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

const shortcutStyle = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '16px',
  padding: '1.1rem 1.25rem',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 6px rgba(15,23,42,0.02)'
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

export default SuperAdminDashboard;
