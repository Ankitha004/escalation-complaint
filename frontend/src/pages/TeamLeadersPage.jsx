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
  RefreshCw, 
  Inbox, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  X, 
  Search,
  UserCog,
  UserPlus,
  Users,
  ShieldAlert,
  CheckCircle,
  BarChart2,
  Award
} from 'lucide-react';

const TeamLeadersPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);

  // Active TL selected for Edit or View
  const [selectedTL, setSelectedTL] = useState(null);
  const [selectedTLForTeam, setSelectedTLForTeam] = useState(null);
  const [assignedStaffList, setAssignedStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Promote Form State
  const [selectedStaffToPromote, setSelectedStaffToPromote] = useState('');
  const [promoteError, setPromoteError] = useState('');

  // General lists for calculations
  const [allUsers, setAllUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Add Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [editFormError, setEditFormError] = useState('');

  const fetchTeamLeaders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/hr/team-leaders');
      setTeamLeaders(res.data || []);
    } catch (err) {
      console.warn('Team leaders fetch notice:', err);
      setTeamLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await API.get('/users');
      setAllUsers(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await API.get('/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch complaints:', err);
    }
  };

  useEffect(() => {
    fetchTeamLeaders();
    fetchDepartments();
    fetchAllUsers();
    fetchComplaints();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({ name: '', email: '', phone: '', department: '', password: '', confirmPassword: '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (formData.name.trim().length < 3) return setFormError('Full Name must be at least 3 characters long');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return setFormError('Please enter a valid email address');
    if (formData.password !== formData.confirmPassword) return setFormError('Passwords do not match');
    if (formData.password.length < 6) return setFormError('Password must be at least 6 characters long');

    setSubmitting(true);
    try {
      await API.post('/hr/team-leaders', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department || undefined,
        password: formData.password
      });
      setShowAddModal(false);
      fetchTeamLeaders();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create Team Leader');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (tl) => {
    setSelectedTL(tl);
    setEditFormData({
      name: tl.name || '',
      email: tl.email || '',
      phone: tl.phone || '',
      department: tl.department?._id || tl.department || ''
    });
    setEditFormError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTL) return;
    setEditFormError('');
    if (editFormData.name.trim().length < 3) return setEditFormError('Full Name must be at least 3 characters long');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email)) return setEditFormError('Please enter a valid email address');

    setSubmitting(true);
    try {
      await API.put(`/hr/team-leaders/${selectedTL._id}`, editFormData);
      setShowEditModal(false);
      setSelectedTL(null);
      fetchTeamLeaders();
    } catch (err) {
      setEditFormError(err.response?.data?.message || 'Failed to update Team Leader');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tl) => {
    try {
      const newStatus = tl.status === 'Active' ? 'Inactive' : 'Active';
      await API.put(`/hr/team-leaders/${tl._id}/status`, { status: newStatus });
      fetchTeamLeaders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffToPromote) return;
    setSubmitting(true);
    setPromoteError('');
    try {
      await API.put(`/users/${selectedStaffToPromote}`, { role: 'Team Leader' });
      setShowPromoteModal(false);
      setSelectedStaffToPromote('');
      fetchTeamLeaders();
      fetchAllUsers();
    } catch (err) {
      setPromoteError(err.response?.data?.message || 'Failed to promote user to Team Leader');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAssignedStaff = async (tl) => {
    setLoadingStaff(true);
    try {
      const res = await API.get('/users');
      const allActive = res.data || [];
      const assigned = allActive.filter(
        (u) => u.teamLeader?._id === tl._id || u.teamLeader === tl._id || u.teamLeader === tl.name || u.teamLeader === tl.employeeId
      );
      setAssignedStaffList(assigned);
    } catch (err) {
      setAssignedStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleOpenManageTeam = (tl) => {
    setSelectedTLForTeam(tl);
    fetchAssignedStaff(tl);
    setShowManageTeamModal(true);
  };

  const handleAssignMember = async (staffId) => {
    try {
      await API.put(`/users/${staffId}`, { teamLeader: selectedTLForTeam._id });
      fetchAssignedStaff(selectedTLForTeam);
      fetchAllUsers();
    } catch (err) {
      alert('Failed to assign team member');
    }
  };

  const handleRemoveMember = async (staffId) => {
    try {
      await API.put(`/users/${staffId}`, { teamLeader: null });
      fetchAssignedStaff(selectedTLForTeam);
      fetchAllUsers();
    } catch (err) {
      alert('Failed to remove team member');
    }
  };

  const handleOpenView = async (tl) => {
    setSelectedTL(tl);
    setShowViewModal(true);
    fetchAssignedStaff(tl);
  };

  const filteredTeamLeaders = teamLeaders.filter((tl) =>
    (tl.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tl.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tl.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tl.phone || '').includes(searchQuery)
  );

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
        <SuperAdminSidebar activeTab="team-leaders" />
      ) : (
        <HRSidebar activeTab="team-leaders" />
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

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Leaders Management</h1>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                Create, manage, monitor performance, and assign staff members to Team Leaders.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={fetchTeamLeaders} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
              </button>
              <button onClick={() => setShowPromoteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10B981', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                <UserPlus size={18} /> Promote Staff to TL
              </button>
              <button onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                <Plus size={18} /> Add Team Leader
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search Team Leader by Name, Email, Phone or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFFFF', color: '#0F172A', fontFamily: 'inherit' }} />
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {loading ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={28} className="spin-icon" style={{ marginBottom: '1rem', color: '#2563EB' }} />
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Loading Team Leaders...</div>
              </div>
            ) : filteredTeamLeaders.length === 0 ? (
              <div style={{ padding: '4.5rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F8FAFC', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Inbox size={40} style={{ color: '#64748B' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>No Team Leaders Found</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                  Click <strong>"Add Team Leader"</strong> above to create your first Team Leader account.
                </p>
                <button onClick={handleOpenAddModal} style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  + Add Team Leader
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Employee ID</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Name</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Department</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Team Size</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Performance (Resolves)</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                      <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamLeaders.map((tl) => {
                      const tlComplaints = complaints.filter(c => c.assignedTeamLeader?._id === tl._id || c.assignedTeamLeader === tl._id);
                      const total = tlComplaints.length;
                      const resolved = tlComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
                      const escalated = tlComplaints.filter(c => c.status === 'Escalated').length;
                      
                      return (
                        <tr key={tl._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>{tl.employeeId}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: '700', color: '#0F172A' }}>{tl.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{tl.email}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontWeight: '500' }}>{tl.department?.name || tl.department || 'General'}</td>
                          <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0F172A' }}>
                            <span onClick={() => handleOpenManageTeam(tl)} style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Users size={12} /> {allUsers.filter(u => u.teamLeader?._id === tl._id || u.teamLeader === tl._id).length} Staff
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <BarChart2 size={16} style={{ color: '#64748B' }} />
                              <div>
                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{resolved}/{total} Resolved</span>
                                {escalated > 0 && (
                                  <div style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <ShieldAlert size={12} /> {escalated} SLA Breached
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ 
                              background: tl.status === 'Active' ? '#DCFCE7' : '#FEE2E2', 
                              color: tl.status === 'Active' ? '#16A34A' : '#DC2626', 
                              fontSize: '0.75rem', 
                              fontWeight: '800', 
                              padding: '4px 10px', 
                              borderRadius: '12px',
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase'
                            }}>
                              {tl.status === 'Inactive' ? 'BANNED' : (tl.status || 'ACTIVE')}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleOpenView(tl)} title="View Profile" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                <Eye size={14} /> Profile
                              </button>
                              <button onClick={() => handleOpenManageTeam(tl)} title="Manage Team" style={{ background: '#FAF5FF', color: '#9333EA', border: '1px solid #E9D5FF', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                <UserPlus size={14} /> Team
                              </button>
                              <button onClick={() => handleOpenEdit(tl)} title="Edit Details" style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => handleToggleStatus(tl)} title={tl.status === 'Active' ? 'Ban Team Leader' : 'Unban Team Leader'} style={{ background: tl.status === 'Active' ? '#FEF2F2' : '#F0FDF4', color: tl.status === 'Active' ? '#DC2626' : '#16A34A', border: tl.status === 'Active' ? '1px solid #FCA5A5' : '1px solid #86EFAC', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
                                {tl.status === 'Active' ? 'Ban' : 'Unban'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: ADD TEAM LEADER */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCog size={22} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Add New Team Leader</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {formError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '0.65rem 2.2rem 0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={{ width: '100%', padding: '0.65rem 2.2rem 0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#2563EB', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Creating...' : 'Create Team Leader'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TEAM LEADER */}
      {showEditModal && selectedTL && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Edit Team Leader</h3>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>ID: {selectedTL.employeeId}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {editFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
                {editFormError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                <input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Department</label>
                <select value={editFormData.department} onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#2563EB', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW TEAM LEADER DETAILS & ASSIGNED STAFF */}
      {showViewModal && selectedTL && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '640px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Team Leader Profile</h3>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>Employee ID: {selectedTL.employeeId}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Full Name</span>
                <strong style={{ color: '#0F172A' }}>{selectedTL.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Email Address</span>
                <span style={{ color: '#475569' }}>{selectedTL.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Phone Number</span>
                <span style={{ color: '#475569' }}>{selectedTL.phone || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Department</span>
                <span style={{ color: '#475569', fontWeight: '500' }}>{selectedTL.department?.name || selectedTL.department || 'General'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Account Status</span>
                <span style={{ background: selectedTL.status === 'Active' ? '#DCFCE7' : '#FEE2E2', color: selectedTL.status === 'Active' ? '#16A34A' : '#DC2626', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  {selectedTL.status || 'Active'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600' }}>Assigned Staff Count</span>
                <strong style={{ color: '#2563EB' }}>{selectedTL.assignedStaffCount || 0} Members</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Assigned Active Staff Members</h4>
            {loadingStaff ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>Loading assigned staff...</div>
            ) : assignedStaffList.length === 0 ? (
              <div style={{ background: '#F8FAFC', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                No active staff currently assigned to this Team Leader.
              </div>
            ) : (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Designation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedStaffList.map((s) => (
                      <tr key={s._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#2563EB' }}>{s.employeeId}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F172A' }}>{s.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{s.email}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{s.designation || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setShowViewModal(false)} style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROMOTE USER TO TEAM LEADER */}
      {showPromoteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} style={{ color: '#10B981' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Promote Staff to Team Leader</h3>
              </div>
              <button onClick={() => { setShowPromoteModal(false); setPromoteError(''); }} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {promoteError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
                {promoteError}
              </div>
            )}

            <form onSubmit={handlePromoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Select Staff Member *</label>
                <select required value={selectedStaffToPromote} onChange={(e) => setSelectedStaffToPromote(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">Select a member to promote...</option>
                  {allUsers
                    .filter(u => u.role !== 'Team Leader' && u.role !== 'Super Admin' && u.role !== 'HR' && u.status === 'Active')
                    .map(u => (
                      <option key={u._id} value={u._id}>{u.name} - {u.designation || 'Staff'} ({u.employeeId})</option>
                    ))
                  }
                </select>
                <p style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Promoting this member will upgrade their system access level to <strong>Team Leader</strong> and assign them a TL ID prefix.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#10B981', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Promoting...' : 'Confirm Promotion'}
                </button>
                <button type="button" onClick={() => { setShowPromoteModal(false); setPromoteError(''); }} style={{ flex: 1, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: MANAGE TEAM MEMBERS */}
      {showManageTeamModal && selectedTLForTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '680px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Manage Team Members</h3>
                <span style={{ fontSize: '0.75rem', color: '#9333EA', fontWeight: '700' }}>Team Leader: {selectedTLForTeam.name}</span>
              </div>
              <button onClick={() => setShowManageTeamModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Current Team Members */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={16} style={{ color: '#16A34A' }} /> Active Team ({assignedStaffList.length})
                </h4>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', height: '300px', overflowY: 'auto', background: '#F8FAFC', padding: '0.5rem' }}>
                  {assignedStaffList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', padding: '2rem 1rem' }}>No staff members in this team.</div>
                  ) : (
                    assignedStaffList.map(s => (
                      <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: '#0F172A', display: 'block' }}>{s.name}</strong>
                          <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{s.designation || 'Staff'} ({s.employeeId})</span>
                        </div>
                        <button onClick={() => handleRemoveMember(s._id)} style={{ border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Unassigned or Other Team Members */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserPlus size={16} style={{ color: '#2563EB' }} /> Available Staff
                </h4>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', height: '300px', overflowY: 'auto', background: '#F8FAFC', padding: '0.5rem' }}>
                  {allUsers
                    .filter(u => u.role === 'Staff' && u.status === 'Active' && (!u.teamLeader || (u.teamLeader?._id !== selectedTLForTeam._id && u.teamLeader !== selectedTLForTeam._id)))
                    .map(s => (
                      <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: '#0F172A', display: 'block' }}>{s.name}</strong>
                          <span style={{ color: '#64748B', fontSize: '0.7rem' }}>TL: {s.teamLeader?.name || 'None'} | {s.employeeId}</span>
                        </div>
                        <button onClick={() => handleAssignMember(s._id)} style={{ border: 'none', background: '#2563EB', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>
                          Add to Team
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button onClick={() => setShowManageTeamModal(false)} style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeadersPage;
