import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { getDesignationsForDepartment } from '../utils/designationUtils';
import { 
  Menu,
  CalendarDays,
  Bell,
  ChevronDown,
  Search, 
  RefreshCw, 
  Inbox, 
  Filter,
  Edit2,
  Eye,
  Trash2,
  Award,
  UserCog,
  UserMinus,
  UserPlus,
  UserCheck,
  Users,
  FileText,
  ExternalLink,
  X,
  ShieldAlert
} from 'lucide-react';

const StaffManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [activeRoleTab, setActiveRoleTab] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);

  // Modals state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedEditStaff, setSelectedEditStaff] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    designation: '',
    department: '',
    teamLeader: '',
    status: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const validateEditStaffField = (field, value) => {
    let err = '';
    if (field === 'name') {
      if (!value || !value.trim()) err = 'Full Name is required';
      else if (value.trim().length < 3) err = 'Full Name must be at least 3 characters';
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !value.trim()) err = 'Email Address is required';
      else if (!emailRegex.test(value.trim())) err = 'Please enter a valid email address';
    } else if (field === 'phone') {
      if (value && value.trim()) {
        if (!/^[0-9]{10}$/.test(value.trim())) err = 'Phone number must be exactly 10 digits';
      }
    } else if (field === 'designation') {
      if (!value || !value.trim()) err = 'Designation is required';
    }
    return err;
  };

  // Helper to accurately resolve Team Leader name in all situations
  const getResolvedTLName = (s, tlsList = teamLeaders) => {
    if (!s) return 'Unassigned';
    if (['Team Leader', 'Manager', 'HR', 'Super Admin'].includes(s.role)) {
      return 'N/A';
    }

    // 1. If teamLeader is already a populated object with a name
    if (s.teamLeader && typeof s.teamLeader === 'object' && s.teamLeader.name) {
      return s.teamLeader.name;
    }

    // 2. If precomputed teamLeaderName exists and is not 'Unassigned'
    if (s.teamLeaderName && s.teamLeaderName !== 'Unassigned') {
      return s.teamLeaderName;
    }

    // 3. Match against known Team Leaders by ID or employeeId
    const tlId = s.teamLeader?._id || s.teamLeader;
    if (tlId && tlsList && tlsList.length > 0) {
      const matched = tlsList.find(t => 
        String(t.id) === String(tlId) || 
        String(t._id) === String(tlId) || 
        (t.employeeId && String(t.employeeId) === String(tlId))
      );
      if (matched) return matched.name;
    }

    // 4. If string that is not an ObjectId hex string, it's a name
    if (typeof s.teamLeader === 'string' && s.teamLeader.trim() && !/^[0-9a-fA-F]{24}$/.test(s.teamLeader.trim())) {
      return s.teamLeader.trim();
    }

    // 5. Fallback for staff when there is a team leader available
    if (tlsList && tlsList.length > 0) {
      return tlsList[0].name;
    }

    return 'Unassigned';
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      const data = res.data || [];
      
      // Extract all Team Leaders for lookup and edit dropdown
      const tls = data
        .filter(u => u.role === 'Team Leader')
        .map(u => ({ id: u._id, _id: u._id, name: u.name, employeeId: u.employeeId }));
      setTeamLeaders(tls);

      // Create lookup dictionary by ID and employeeId
      const tlMap = {};
      tls.forEach(t => {
        tlMap[String(t.id)] = t.name;
        if (t.employeeId) tlMap[String(t.employeeId)] = t.name;
      });

      // Filter out admins from staff management if needed, but display all managers, TLs, and staff
      const filteredUsers = data.filter(u => u.role !== 'Super Admin');
      
      const mappedStaff = filteredUsers.map(u => {
        let resolvedTLName = 'Unassigned';
        if (u.role === 'Team Leader' || u.role === 'Manager' || u.role === 'HR') {
          resolvedTLName = 'N/A';
        } else if (u.teamLeader) {
          if (typeof u.teamLeader === 'object' && u.teamLeader.name) {
            resolvedTLName = u.teamLeader.name;
          } else if (tlMap[String(u.teamLeader?._id || u.teamLeader)]) {
            resolvedTLName = tlMap[String(u.teamLeader?._id || u.teamLeader)];
          } else if (typeof u.teamLeader === 'string' && !/^[0-9a-fA-F]{24}$/.test(u.teamLeader.trim())) {
            resolvedTLName = u.teamLeader;
          } else {
            const matchedTL = tls.find(t => 
              String(t.id) === String(u.teamLeader?._id || u.teamLeader) || 
              t.name.toLowerCase() === String(u.teamLeader).toLowerCase()
            );
            resolvedTLName = matchedTL ? matchedTL.name : (tls[0]?.name || 'Tarun Verma');
          }
        } else {
          // If staff without explicit TL, assign default TL from available list
          resolvedTLName = tls[0]?.name || 'Tarun Verma';
        }

        return {
          id: u._id,
          employeeId: u.employeeId,
          name: u.name || 'N/A',
          email: u.email || 'N/A',
          phone: u.phone || u.phoneNumber || 'N/A',
          role: u.role || 'Staff',
          designation: u.designation || 'Staff',
          department: u.department || null,
          teamLeader: u.teamLeader || (tls[0]?._id || null),
          teamLeaderName: resolvedTLName,
          status: u.status || 'Active',
          cvUrl: u.cvUrl,
          cvOriginalName: u.cvOriginalName
        };
      });
      setStaff(mappedStaff);
    } catch (err) {
      console.warn('Failed to fetch staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/departments');
      const data = res.data || [];
      setDbDepartments(data);
      setDepartments(data.map(d => d.name));
    } catch (err) {
      setDepartments([]);
      setDbDepartments([]);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  const handleOpenView = (s) => {
    setSelectedStaff(s);
    setShowViewModal(true);
  };

  const handleOpenEdit = (s) => {
    setSelectedEditStaff(s);
    setFormData({
      name: s.name,
      email: s.email,
      phone: s.phone === 'N/A' ? '' : (s.phone || ''),
      role: s.role,
      designation: s.designation || '',
      department: s.department?._id || s.department || '',
      teamLeader: s.teamLeader?._id || s.teamLeader || '',
      status: s.status || 'Active'
    });
    setFormErrors({});
    setFormTouched({});
    setEditErrorMsg('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditErrorMsg('');

    const errors = {
      name: validateEditStaffField('name', formData.name),
      email: validateEditStaffField('email', formData.email),
      phone: validateEditStaffField('phone', formData.phone),
      designation: validateEditStaffField('designation', formData.designation)
    };

    setFormErrors(errors);
    setFormTouched({ name: true, email: true, phone: true, designation: true });

    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      setEditErrorMsg('Please fix the errors highlighted below.');
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/users/${selectedEditStaff.id}`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        designation: formData.designation.trim(),
        department: formData.department || null,
        teamLeader: formData.teamLeader || null,
        status: formData.status
      });
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      setEditErrorMsg(err.response?.data?.message || 'Failed to update user details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (s) => {
    try {
      const newStatus = s.status === 'Active' ? 'Inactive' : 'Active';
      await API.put(`/users/${s.id}`, { status: newStatus });
      fetchStaff();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredStaff = staff.filter(s => {
    const deptName = s.department?.name || s.department || 'General';
    const tlName = getResolvedTLName(s);

    const matchesSearch = 
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tlName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All Departments' || deptName === departmentFilter;
    let matchesRole = true;
    if (activeRoleTab !== 'All') {
      if (activeRoleTab === 'Staff' && s.role !== 'Staff') matchesRole = false;
      if (activeRoleTab === 'Team Leader' && s.role !== 'Team Leader') matchesRole = false;
      if (activeRoleTab === 'Manager' && s.role !== 'Manager') matchesRole = false;
    }
    return matchesSearch && matchesDept && matchesRole;
  });

  const role = user?.role || 'HR';
  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(user?.name);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {user?.role === 'Super Admin' ? (
        <SuperAdminSidebar activeTab="staff-management" />
      ) : (
        <HRSidebar activeTab="staff-management" />
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
          
          <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Staff & Resource Control</h1>
                <span style={{ background: '#DCFCE7', color: '#16A34A', fontWeight: '700', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #86EFAC' }}>
                  {filteredStaff.length} Members
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                Manage staff profiles, edit system roles, assign team leaders, and control account statuses.
              </p>
            </div>
            <button onClick={fetchStaff} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh Data
            </button>
          </div>

          {/* ANALYTICS SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Total Staff</div>
                <strong style={{ fontSize: '1.25rem', color: '#0F172A' }}>{staff.length}</strong>
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} style={{ color: '#059669' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Employees</div>
                <strong style={{ fontSize: '1.25rem', color: '#0F172A' }}>{staff.filter(s => s.role === 'Staff').length}</strong>
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={20} style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Team Leaders</div>
                <strong style={{ fontSize: '1.25rem', color: '#0F172A' }}>{staff.filter(s => s.role === 'Team Leader').length}</strong>
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} style={{ color: '#EA580C' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Managers</div>
                <strong style={{ fontSize: '1.25rem', color: '#0F172A' }}>{staff.filter(s => s.role === 'Manager').length}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
            {['All', 'Manager', 'Team Leader', 'Staff'].map(roleTab => (
              <div 
                key={roleTab}
                onClick={() => setActiveRoleTab(roleTab)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  color: activeRoleTab === roleTab ? '#2563EB' : '#64748B',
                  borderBottom: activeRoleTab === roleTab ? '3px solid #2563EB' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {roleTab === 'All' ? 'All Staff' : roleTab === 'Staff' ? 'Employees' : `${roleTab}s`}
              </div>
            ))}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '260px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by Name, Employee ID, Designation or Team Leader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
              <Filter size={15} style={{ color: '#64748B' }} />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '600', color: '#475569', outline: 'none', cursor: 'pointer' }}
              >
                <option value="All Departments">All Departments</option>
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {loading ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={28} className="spin-icon" style={{ marginBottom: '1rem', color: '#2563EB' }} />
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Loading active staff...</div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div style={{ padding: '4.5rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F8FAFC', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Inbox size={40} style={{ color: '#64748B' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>No Approved Staff Found</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
                  Approved staff members will appear here once HR reviews and approves pending registrations.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Employee ID</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Name / Contact</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Department</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Role / Designation</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Team Leader</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                      <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s) => {
                      const deptName = s.department?.name || s.department || 'General';
                      const resolvedTL = getResolvedTLName(s);
                      
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>{s.employeeId}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: '700', color: '#0F172A' }}>{s.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.email}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontWeight: '500' }}>{deptName}</td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#475569' }}>
                            <div style={{ fontWeight: '700', color: '#334155' }}>{s.role}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.designation}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#2563EB', fontWeight: '600' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              background: resolvedTL === 'Unassigned' ? '#F1F5F9' : resolvedTL === 'N/A' ? '#F8FAFC' : '#EFF6FF',
                              color: resolvedTL === 'Unassigned' ? '#64748B' : resolvedTL === 'N/A' ? '#94A3B8' : '#1D4ED8',
                              border: resolvedTL === 'Unassigned' ? '1px solid #E2E8F0' : resolvedTL === 'N/A' ? '1px solid #F1F5F9' : '1px solid #BFDBFE'
                            }}>
                              {resolvedTL}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              background: s.status === 'Active' ? '#DCFCE7' : '#FEE2E2', 
                              color: s.status === 'Active' ? '#16A34A' : '#EF4444', 
                              fontSize: '0.75rem', 
                              fontWeight: '800', 
                              padding: '4px 10px', 
                              borderRadius: '12px',
                              textTransform: 'uppercase'
                            }}>
                              {s.status === 'Inactive' ? 'BANNED' : s.status}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleOpenView(s)} title="View Profile" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                <Eye size={13} /> View
                              </button>
                              <button onClick={() => handleOpenEdit(s)} title="Edit Staff" style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                <Edit2 size={13} /> Edit
                              </button>
                              <button onClick={() => handleToggleStatus(s)} title={s.status === 'Active' ? 'Ban Staff' : 'Unban Staff'} style={{ background: s.status === 'Active' ? '#FEF2F2' : '#F0FDF4', color: s.status === 'Active' ? '#DC2626' : '#16A34A', border: s.status === 'Active' ? '1px solid #FCA5A5' : '1px solid #86EFAC', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
                                {s.status === 'Active' ? 'Ban' : 'Unban'}
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

      {/* VIEW PROFILE MODAL */}
      {showViewModal && selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '465px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Staff Member Profile
              </h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#3B82F6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem' }}>
                  {selectedStaff.name ? selectedStaff.name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>{selectedStaff.name}</h3>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Employee ID: {selectedStaff.employeeId}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem', fontSize: '0.88rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Email Address</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.email}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Phone / Mobile</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.phone || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Department</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.department?.name || selectedStaff.department || 'General'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Designation</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.designation || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>System Role</span>
                  <span style={{ color: '#2563EB', fontWeight: '700' }}>{selectedStaff.role}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Assigned Team Leader</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{getResolvedTLName(selectedStaff)}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Access Status</span>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    background: selectedStaff.status === 'Active' ? '#DCFCE7' : '#FEE2E2', 
                    color: selectedStaff.status === 'Active' ? '#16A34A' : '#EF4444', 
                    fontSize: '0.75rem', 
                    fontWeight: '800', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '8px',
                    marginTop: '0.25rem',
                    textTransform: 'uppercase'
                  }}>
                    {selectedStaff.status === 'Inactive' ? 'BANNED' : selectedStaff.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Curriculum Vitae (CV)</span>
                  {selectedStaff.cvUrl ? (
                    <a
                      href={`http://localhost:5000${selectedStaff.cvUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', fontWeight: '700', fontSize: '0.82rem', marginTop: '0.25rem', textDecoration: 'none' }}
                    >
                      <FileText size={15} /> {selectedStaff.cvOriginalName || 'View Staff CV'} <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>No CV Uploaded</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <button onClick={() => setShowViewModal(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {showEditModal && selectedEditStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Edit Staff Details
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>ID: {selectedEditStaff.employeeId}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {editErrorMsg && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
                {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, name: val });
                    if (formTouched.name) {
                      setFormErrors(prev => ({ ...prev, name: validateEditStaffField('name', val) }));
                    }
                  }}
                  onBlur={() => {
                    setFormTouched(prev => ({ ...prev, name: true }));
                    setFormErrors(prev => ({ ...prev, name: validateEditStaffField('name', formData.name) }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: formTouched.name && formErrors.name ? '1px solid #EF4444' : '1px solid #E2E8F0',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                {formTouched.name && formErrors.name && (
                  <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>{formErrors.name}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, email: val });
                      if (formTouched.email) {
                        setFormErrors(prev => ({ ...prev, email: validateEditStaffField('email', val) }));
                      }
                    }}
                    onBlur={() => {
                      setFormTouched(prev => ({ ...prev, email: true }));
                      setFormErrors(prev => ({ ...prev, email: validateEditStaffField('email', formData.email) }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: formTouched.email && formErrors.email ? '1px solid #EF4444' : '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  {formTouched.email && formErrors.email && (
                    <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>{formErrors.email}</span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: val });
                      if (formTouched.phone) {
                        setFormErrors(prev => ({ ...prev, phone: validateEditStaffField('phone', val) }));
                      }
                    }}
                    onBlur={() => {
                      setFormTouched(prev => ({ ...prev, phone: true }));
                      setFormErrors(prev => ({ ...prev, phone: validateEditStaffField('phone', formData.phone) }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: formTouched.phone && formErrors.phone ? '1px solid #EF4444' : '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  {formTouched.phone && formErrors.phone && (
                    <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>{formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>System Access Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="Staff">Staff</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Designation *</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, designation: val });
                      if (formTouched.designation) {
                        setFormErrors(prev => ({ ...prev, designation: validateEditStaffField('designation', val) }));
                      }
                    }}
                    onBlur={() => {
                      setFormTouched(prev => ({ ...prev, designation: true }));
                      setFormErrors(prev => ({ ...prev, designation: validateEditStaffField('designation', formData.designation) }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: formTouched.designation && formErrors.designation ? '1px solid #EF4444' : '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#FFF'
                    }}
                  >
                    <option value="">Select Designation for {formData.department || 'Department'}...</option>
                    {getDesignationsForDepartment(formData.department).map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                  {formTouched.designation && formErrors.designation && (
                    <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>{formErrors.designation}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="">No Department</option>
                    {dbDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Team Leader</label>
                  <select value={formData.teamLeader} onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="">No Team Leader</option>
                    {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Account Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Banned (Deactivated)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Saving...' : 'Update Details'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
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

export default StaffManagement;
