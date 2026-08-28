import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { calculateSLATimeLeft } from '../utils/slaUtils';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  BadgeCheck, 
  Briefcase, 
  PlusCircle, 
  FileText, 
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Check,
  MessageSquare,
  Send,
  TrendingUp,
  LogOut
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'attendance' | 'new_complaint' | 'track_status' | 'my_complaints' | 'leave'

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data from API
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [myAttendance, setMyAttendance] = useState(null);

  const fetchData = async () => {
    try {
      const [compRes, leaveRes, attRes] = await Promise.all([
        API.get('/complaints/my'),
        API.get('/leaves/my'),
        API.get('/attendance/today')
      ]);

      const complaintsData = compRes.data.complaints || (Array.isArray(compRes.data) ? compRes.data : []);
      
      setAllComplaints(
        complaintsData.map(c => ({
          ...c,
          id: c.complaintId,
          title: c.subject || c.title,
          date: new Date(c.createdAt).toLocaleDateString(),
          progressRemark: c.timeline && c.timeline.length > 0 ? c.timeline[c.timeline.length - 1].description : 'Ticket is being processed.'
        }))
      );
      setLeaveRequests(leaveRes.data || []);
      setMyAttendance(attRes.data || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  // Filter complaints STRICTLY for this logged-in Employee ID
  // Since APIs only return current user's data, we just map it.
  const myComplaints = allComplaints;
  const myLeaves = leaveRequests;

  // Clock In / Out Handler
  const handleClockIn = async () => {
    try {
      const res = await API.post('/attendance');
      alert(res.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error clocking in/out');
    }
  };

  // Leave Submit Handler
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leaves', {
        type: leaveType,
        startDate,
        endDate,
        reason: leaveReason
      });
      alert('Leave application submitted successfully!');
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting leave');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      const res = await API.post('/complaints', {
        title,
        subject: title,
        category,
        priority,
        description
      });
      setSuccessMsg(`Complaint ticket ${res.data.complaintId || 'Registered'} created successfully!`);
      setTitle('');
      setDescription('');
      fetchData();
      
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('track_status');
      }, 1500);
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting complaint');
    }
  };

  const getStepLevel = (status) => {
    switch (status) {
      case 'Submitted': 
      case 'Pending': return 1;
      case 'In Progress': 
      case 'Waiting for Parts': return 2;
      case 'Pending HR Approval': 
      case 'Escalated': 
      case 'Escalated to Manager': return 3;
      case 'Resolved': 
      case 'Closed': return 4;
      default: return 1;
    }
  };

  return (
    <div className="dashboard-layout" style={{ flexDirection: 'column' }}>
      <Navbar activeTabTitle="Employee Dashboard" />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* SIDEBAR */}
        <aside className="sidebar-nav-container">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '1rem', padding: '0 0.5rem' }}>
              SELF-SERVICE DESK
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'attendance', label: 'Attendance Clock-In', icon: Clock },
                { id: 'new_complaint', label: 'Raise Complaint', icon: PlusCircle },
                { id: 'track_status', label: 'Track Status', icon: Activity, badge: myComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length },
                { id: 'my_complaints', label: 'My Complaints', icon: FileText, badge: myComplaints.length },
                { id: 'leave', label: 'Apply For Leave', icon: CalendarCheck }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                  >
                    <div className="icon-container">
                      <Icon size={19} color={isActive ? '#4F46E5' : '#64748B'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`status-chip ${isActive ? 'status-chip-indigo' : 'status-chip-amber'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.72rem' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '0.85rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name || 'Employee'}</div>
                <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: '700' }}>ID: {user?.employeeId || 'N/A'}</div>
              </div>
            </div>

            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="dashboard-content-area animate-fade-in-up">
          
          {/* STATS OVERVIEW HEADER */}
          <div className="stat-card-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-label">Attendance Today</div>
                <div className="stat-card-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Clock size={22} />
                </div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.5rem', color: myAttendance ? '#059669' : '#D97706' }}>
                {myAttendance ? myAttendance.status : 'Not Clocked In'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Routes directly to Manager</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-label">Active Complaints</div>
                <div className="stat-card-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  <Activity size={22} />
                </div>
              </div>
              <div className="stat-card-value">{myComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Under review or progress</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-label">Total Tickets</div>
                <div className="stat-card-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <FileText size={22} />
                </div>
              </div>
              <div className="stat-card-value">{myComplaints.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Registered in account</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-label">Leave Applications</div>
                <div className="stat-card-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                  <CalendarCheck size={22} />
                </div>
              </div>
              <div className="stat-card-value">{myLeaves.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Sent to Team Leader</div>
            </div>
          </div>

          {/* TAB CONTENT: PROFILE */}
          {activeTab === 'profile' && (
            <div className="content-card hover-glow" style={{ maxWidth: '850px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Account Profile Overview
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', marginBottom: '0.35rem' }}>Employee ID</div>
                  <h3 style={{ color: '#4F46E5', fontWeight: '800', margin: 0 }}>{user?.employeeId || 'N/A'}</h3>
                </div>

                <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', marginBottom: '0.35rem' }}>Full Name</div>
                  <h3 style={{ color: '#0F172A', fontWeight: '800', margin: 0 }}>{user?.name || 'N/A'}</h3>
                </div>

                <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', marginBottom: '0.35rem' }}>Email Address</div>
                  <h4 style={{ color: '#0F172A', fontWeight: '700', margin: 0 }}>{user?.email || 'N/A'}</h4>
                </div>

                <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', marginBottom: '0.35rem' }}>Assigned Role</div>
                  <span className="status-chip status-chip-indigo" style={{ fontSize: '0.85rem' }}>
                    {user?.role || 'Employee'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="content-card hover-glow" style={{ maxWidth: '650px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>
                Daily Attendance Clock-In
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Attendance entries are automatically recorded and routed to your <strong>Manager Dashboard</strong>.
              </p>

              <div style={{ padding: '2rem', background: '#F8FAFC', borderRadius: '16px', border: '1.5px solid var(--border-color)', textAlign: 'center' }}>
                <Clock size={48} color="#4F46E5" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Today: {new Date().toLocaleDateString()}</h4>

                <div style={{ margin: '1rem 0' }}>
                  {myAttendance ? (
                    <span className="status-chip status-chip-emerald" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
                      Clocked In at {myAttendance.clockIn} ({myAttendance.clockOut})
                    </span>
                  ) : (
                    <span className="status-chip status-chip-amber" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
                      Not Clocked In Yet
                    </span>
                  )}
                </div>

                <button
                  onClick={handleClockIn}
                  className="btn-primary-enterprise"
                  style={{ width: 'auto', margin: '0 auto', padding: '0.8rem 2rem' }}
                >
                  {myAttendance && myAttendance.clockOut === 'In Progress' ? 'Clock Out Now' : 'Clock In Now'}
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: NEW COMPLAINT */}
          {activeTab === 'new_complaint' && (
            <div className="content-card hover-glow" style={{ maxWidth: '800px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Register New Support Ticket
              </h3>

              {successMsg && (
                <div className="alert-box alert-success">
                  <CheckCircle2 size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group-custom">
                  <label className="form-label-custom">Complaint Title *</label>
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="e.g. Broken monitor screen or Wi-Fi disconnection"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group-custom">
                    <label className="form-label-custom">Category *</label>
                    <select className="form-control-custom" value={category} onChange={(e) => setCategory(e.target.value)} style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }}>
                      <option value="Hardware">Hardware Support</option>
                      <option value="Network">Network & Wi-Fi</option>
                      <option value="Maintenance">Facilities & Maintenance</option>
                      <option value="Software">Software & OS</option>
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">Priority SLA *</label>
                    <select className="form-control-custom" value={priority} onChange={(e) => setPriority(e.target.value)} style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }}>
                      <option value="Low">Low — (72h SLA)</option>
                      <option value="Medium">Medium — (48h SLA)</option>
                      <option value="High">High — (24h SLA)</option>
                      <option value="Critical">Critical — (8h SLA)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label-custom">Detailed Description</label>
                  <textarea
                    className="form-control-custom"
                    rows="4"
                    placeholder="Describe location, symptoms, error codes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF', resize: 'vertical' }}
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary-enterprise">
                  <PlusCircle size={18} /> Register Ticket under {user?.employeeId}
                </button>
              </form>
            </div>
          )}

          {/* TAB CONTENT: TRACK STATUS */}
          {activeTab === 'track_status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {myComplaints.length === 0 ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <AlertCircle size={40} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>No Complaints Currently Registered</h3>
                  <p style={{ color: '#64748B', fontSize: '0.88rem' }}>Submit a ticket to view real-time lifecycle tracking.</p>
                </div>
              ) : (
                myComplaints.map(c => {
                  const stepLevel = getStepLevel(c.status);
                  return (
                    <div key={c.id} className="content-card hover-glow" style={c.status === 'Resolved' ? { border: '2px solid #10B981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' } : {}}>
                      {c.status === 'Resolved' && (
                        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          <CheckCircle2 size={18} /> Complaint is resolved (100% Progress)
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                          <span className="status-chip status-chip-indigo" style={{ marginRight: '0.75rem' }}>{c.id}</span>
                          <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0F172A' }}>{c.title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span className={`status-chip ${c.priority === 'Critical' ? 'status-chip-rose' : 'status-chip-indigo'}`}>
                            {c.priority} Priority
                          </span>
                          <span className="status-chip status-chip-amber">
                            ⏱ {calculateSLATimeLeft(c.createdAt || new Date(), c.priority, c.status, c.totalPausedDuration)}
                          </span>
                        </div>
                      </div>

                      {/* 4-STEP TRACKER */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center', margin: '2rem 0' }}>
                        <div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: stepLevel >= 1 ? 'var(--primary-gradient)' : '#F1F5F9', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 0.5rem auto' }}>
                            {stepLevel > 1 ? <Check size={20} /> : '1'}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>Submitted</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.date}</div>
                        </div>

                        <div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: stepLevel >= 2 ? 'var(--primary-gradient)' : '#F1F5F9', color: stepLevel >= 2 ? '#FFF' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 0.5rem auto' }}>
                            {stepLevel > 2 ? <Check size={20} /> : '2'}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>TL Review</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Team Leader Action</div>
                        </div>

                        <div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: stepLevel >= 3 ? '#F59E0B' : '#F1F5F9', color: stepLevel >= 3 ? '#FFF' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 0.5rem auto' }}>
                            {stepLevel > 3 ? <Check size={20} /> : '3'}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>Pending HR</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Approval Stage</div>
                        </div>

                        <div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: stepLevel === 4 ? '#10B981' : '#F1F5F9', color: stepLevel === 4 ? '#FFF' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 0.5rem auto' }}>
                            {stepLevel === 4 ? <CheckCircle2 size={22} /> : '4'}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>Resolved</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Completed</div>
                        </div>
                      </div>

                      <div style={{ padding: '1rem', background: '#EEF2FF', borderRadius: '12px', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <MessageSquare size={18} color="#4F46E5" style={{ marginTop: '2px' }} />
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>Update:</strong>
                          <span style={{ fontSize: '0.85rem', color: '#334155' }}>{c.progressRemark || 'Ticket is being processed.'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT: MY COMPLAINTS */}
          {activeTab === 'my_complaints' && (
            <div className="content-card hover-glow" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-custom-wrapper">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title & Description</th>
                      <th>Category</th>
                      <th>Priority SLA</th>
                      <th>Date</th>
                      <th>Status Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myComplaints.map(c => (
                      <tr key={c.id} className="hoverable-row">
                        <td style={{ fontWeight: '800', color: '#4F46E5' }}>{c.id}</td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{c.title}</div>
                          {c.description && <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{c.description}</span>}
                        </td>
                        <td>{c.category}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                            <span className={`status-chip ${c.priority === 'Critical' ? 'status-chip-rose' : 'status-chip-indigo'}`}>
                              {c.priority}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#D97706' }}>
                              ⏱ {calculateSLATimeLeft(c.createdAt || new Date(), c.priority, c.status, c.totalPausedDuration)}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{c.date}</td>
                        <td>
                          <span className={`status-chip ${c.status === 'Resolved' || c.status === 'Closed' ? 'status-chip-emerald' : 'status-chip-indigo'}`}>
                            {c.status !== 'Resolved' && c.status !== 'Closed' && <span className="pulse-dot pulse-dot-indigo" />}
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: APPLY LEAVE */}
          {activeTab === 'leave' && (
            <div className="content-card hover-glow" style={{ maxWidth: '650px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Apply For Leave (Sent to Team Manager)
              </h3>

              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group-custom">
                  <label className="form-label-custom">Leave Type</label>
                  <select className="form-control-custom" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }}>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group-custom">
                    <label className="form-label-custom">Start Date</label>
                    <input type="date" className="form-control-custom" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }} />
                  </div>
                  <div className="form-group-custom">
                    <label className="form-label-custom">End Date</label>
                    <input type="date" className="form-control-custom" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF' }} />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label-custom">Reason For Leave</label>
                  <textarea className="form-control-custom" rows="3" placeholder="Provide reason..." value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} required style={{ paddingLeft: '1rem', backgroundColor: '#FFFFFF', resize: 'vertical' }}></textarea>
                </div>

                <button type="submit" className="btn-primary-enterprise">
                  Submit Application to Team Manager
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
