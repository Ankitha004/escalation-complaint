import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  Menu,
  CalendarDays,
  Bell,
  ChevronDown,
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  Inbox,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  AlertTriangle
} from 'lucide-react';

const PendingRegistrations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('All Dates');

  // Quick Action States
  const [teamLeadersList, setTeamLeadersList] = useState([]);
  const [showQuickApproveModal, setShowQuickApproveModal] = useState(false);
  const [showQuickRejectModal, setShowQuickRejectModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assignedTeamLeader, setAssignedTeamLeader] = useState('');
  const [assignedDesignation, setAssignedDesignation] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const departments = [
    'All Departments',
    'IT & Technology',
    'Human Resources',
    'Finance & Accounts',
    'Operations & Logistics',
    'Sales & Marketing',
    'Customer Support'
  ];

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const response = await API.get('/hr/registrations?status=pending');
      const data = response.data || [];
      const formatted = data.map((u, index) => ({
        id: u._id || `REG-${1000 + index}`,
        regId: u.employeeId || `REG-${1000 + index}`,
        name: u.name || 'N/A',
        email: u.email || 'N/A',
        phone: u.phone || u.phoneNumber || 'N/A',
        department: u.department?.name || u.department || 'General',
        appliedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
        status: u.status || 'Pending HR Review'
      }));
      setRegistrations(formatted);
    } catch (err) {
      console.warn('Backend API connection notice:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const res = await API.get('/hr/team-leaders?activeOnly=true');
      setTeamLeadersList(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch Team Leaders:', err);
    }
  };

  useEffect(() => {
    fetchPendingRegistrations();
    fetchTeamLeaders();
  }, []);

  const handleOpenQuickApprove = (reg) => {
    setSelectedReg(reg);
    const genId = reg.regId && !reg.regId.startsWith('REG-')
      ? reg.regId 
      : `EMP${Math.floor(1000 + Math.random() * 9000)}`;
    setAssignedStaffId(genId);
    setAssignedTeamLeader('');
    setAssignedDesignation('');
    setShowQuickApproveModal(true);
  };

  const handleQuickApproveSubmit = async (e) => {
    e.preventDefault();
    if (!assignedStaffId || assignedStaffId.trim().length < 3) {
      alert('Please provide a valid Generated Staff ID (min 3 characters).');
      return;
    }
    if (!assignedTeamLeader) {
      alert('Please select a Team Leader before approving.');
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/hr/registrations/${selectedReg.id}/approve`, {
        employeeId: assignedStaffId,
        teamLeader: assignedTeamLeader,
        designation: assignedDesignation || 'Staff',
        phone: selectedReg.phone,
        department: selectedReg.department
      });
      setShowQuickApproveModal(false);
      fetchPendingRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQuickReject = (reg) => {
    setSelectedReg(reg);
    setRejectionReason('');
    setShowQuickRejectModal(true);
  };

  const handleQuickRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      alert('Please provide a detailed rejection reason (min 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/hr/registrations/${selectedReg.id}/reject`, {
        reason: rejectionReason
      });
      setShowQuickRejectModal(false);
      fetchPendingRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      (reg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.phone || '').includes(searchQuery) ||
      (reg.regId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All Departments' || reg.department === departmentFilter;
    const matchesStatus = statusFilter === 'All Status' || reg.status === statusFilter || (statusFilter === 'Pending' && reg.status.includes('Pending'));
    return matchesSearch && matchesDept && matchesStatus;
  });

  const userName = user?.name ? user.name.split(' ')[0] : 'Priya';
  const role = user?.role || 'HR Manager';
  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(user?.name);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {user?.role === 'Super Admin' ? (
        <SuperAdminSidebar activeTab="pending-registrations" />
      ) : (
        <HRSidebar activeTab="pending-registrations" badgeCount={filteredRegistrations.length} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E2E8F0', 
          padding: '0.75rem 2rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <Menu size={24} style={{ color: '#475569', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
              <CalendarDays size={16} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} style={{ color: '#475569' }} />
              {filteredRegistrations.length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: '800', padding: '2px 5px', borderRadius: '50%', border: '2px solid #FFF' }}>
                  {filteredRegistrations.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3B82F6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{user?.name || 'Priya Sharma'}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{role}</span>
              </div>
              <ChevronDown size={16} style={{ color: '#64748B' }} />
            </div>
          </div>
        </header>

        {/* MAIN WORKSPACE AREA */}
        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
            
          {/* HEADER TITLE & SUMMARY ROW */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Pending Registration Requests
                </h1>
                <span style={{ background: '#EFF6FF', color: '#2563EB', fontWeight: '700', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #BFDBFE' }}>
                  {filteredRegistrations.length} Requests
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                Review, verify, and approve incoming staff registration applications with Super Admin privileges.
              </p>
            </div>

            <button
              onClick={fetchPendingRegistrations}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh Data
            </button>
          </div>

          {/* FILTERS AND SEARCH CONTROL BAR */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '260px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by Name, Email, Phone or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'inherit' }}
              />
            </div>

            {/* Dropdown Filters Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                <Filter size={15} style={{ color: '#64748B' }} />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '600', color: '#475569', outline: 'none', cursor: 'pointer' }}
                >
                  {departments.map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                <Clock size={15} style={{ color: '#64748B' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '600', color: '#475569', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="All Status">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                <Calendar size={15} style={{ color: '#64748B' }} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '600', color: '#475569', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="All Dates">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>

            </div>
          </div>

          {/* REGISTRATION DATA TABLE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {loading ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={28} className="spin-icon" style={{ marginBottom: '1rem', color: '#2563EB' }} />
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Loading registration requests...</div>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div style={{ padding: '4.5rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F8FAFC', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Inbox size={40} style={{ color: '#64748B' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>
                  No Pending Registration Requests
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
                  New registration requests will appear here after staff submit their registration.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Registration ID</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Full Name</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Email / Phone</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Department</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Applied Date</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                      <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>
                          {reg.regId}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0F172A' }}>
                          {reg.name}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#475569' }}>
                          <div>{reg.email}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{reg.phone}</span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontWeight: '500' }}>
                          {reg.department}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>
                          {reg.appliedDate}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          {reg.status === 'Approved' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#DCFCE7', color: '#16A34A', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                              Approved
                            </span>
                          ) : reg.status === 'Rejected' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEE2E2', color: '#DC2626', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                              Rejected
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#D97706', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => navigate(`/registration-details/${reg.id}`)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              <Eye size={13} /> View
                            </button>
                            {reg.status !== 'Approved' && reg.status !== 'Rejected' && (
                              <>
                                <button
                                  onClick={() => handleOpenQuickApprove(reg)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#10B981', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenQuickReject(reg)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#EF4444', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER NOTICE */}
          <div style={{ marginTop: '1.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1rem 1.25rem', color: '#1E40AF', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
            <span>
              <strong>Super Admin Control:</strong> You can approve or reject registration applications inline instantly, or click 'View' to review the applicant's complete profile.
            </span>
          </div>

        </main>
      </div>

      {/* QUICK APPROVE MODAL */}
      {showQuickApproveModal && selectedReg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={22} style={{ color: '#10B981' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Quick Approve Registration</h3>
              </div>
              <button onClick={() => setShowQuickApproveModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleQuickApproveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div><strong>Applicant:</strong> {selectedReg.name}</div>
                <div><strong>Email:</strong> {selectedReg.email}</div>
                <div><strong>Department:</strong> {selectedReg.department}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Generated Staff ID *</label>
                <input type="text" required value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', fontWeight: '700', color: '#2563EB' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Assign Team Leader *</label>
                <select required value={assignedTeamLeader} onChange={(e) => setAssignedTeamLeader(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">Select Team Leader...</option>
                  {teamLeadersList.map((tl) => (
                    <option key={tl._id} value={tl.employeeId || tl.name}>{tl.name} ({tl.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Designation</label>
                <input type="text" placeholder="e.g. Staff Associate" value={assignedDesignation} onChange={(e) => setAssignedDesignation(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#10B981', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Approving...' : 'Approve & Activate'}
                </button>
                <button type="button" onClick={() => setShowQuickApproveModal(false)} style={{ flex: 1, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK REJECT MODAL */}
      {showQuickRejectModal && selectedReg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={22} style={{ color: '#EF4444' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Reject Registration</h3>
              </div>
              <button onClick={() => setShowQuickRejectModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleQuickRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', fontSize: '0.85rem', color: '#991B1B' }}>
                Reject registration for applicant <strong>{selectedReg.name}</strong>.
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Rejection Reason (min 10 characters) *</label>
                <textarea required rows={3} placeholder="Provide details for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={submitting || rejectionReason.trim().length < 10} style={{ flex: 1, background: '#EF4444', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: submitting || rejectionReason.trim().length < 10 ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Rejecting...' : 'Reject Request'}
                </button>
                <button type="button" onClick={() => setShowQuickRejectModal(false)} style={{ flex: 1, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
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

export default PendingRegistrations;
