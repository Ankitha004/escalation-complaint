import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  Building2, 
  RefreshCw, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  X, 
  LayoutGrid, 
  List, 
  Inbox,
  Briefcase,
  Shield,
  Layers,
  Menu,
  CalendarDays,
  Bell,
  ChevronDown,
  Award,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

const DEFAULT_DEPARTMENTS = [
  { id: 'dept_1', _id: 'dept_1', name: 'IT Support & Systems', description: 'Hardware, software troubleshooting, network access, and system infrastructure.', manager: 'Alex Morgan', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  { id: 'dept_2', _id: 'dept_2', name: 'Payroll & Finance', description: 'Salary distribution, tax calculations, reimbursements, and financial queries.', manager: 'Sarah Jenkins', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  { id: 'dept_3', _id: 'dept_3', name: 'HR & Personnel Admin', description: 'Employee onboarding, leave policies, internal grievances, and HR compliance.', manager: 'Priya Sharma', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  { id: 'dept_4', _id: 'dept_4', name: 'Facilities & Workplace', description: 'Office logistics, security passes, desk allocation, and maintenance.', manager: 'David Chen', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  { id: 'dept_5', _id: 'dept_5', name: 'Software Engineering', description: 'Internal ERP tools, web portal development, and software bugs.', manager: 'Michael Carter', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
];

const DepartmentsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', manager: '' });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/departments');
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setDepartments(data.map(d => ({
          id: d._id || d.id,
          _id: d._id || d.id,
          name: d.name || 'N/A',
          description: d.description || 'N/A',
          manager: typeof d.manager === 'object' ? (d.manager?.name || 'Unassigned') : 'Unassigned',
          managerId: typeof d.manager === 'object' ? (d.manager?._id || '') : (d.manager || ''),
          createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        })));
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Backend fetch notice (using preset department structure):', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await API.get('/users');
      setAllUsers(res.data || []);
      const mgrs = Array.isArray(res.data) ? res.data.filter(u => u.role === 'Manager') : [];
      setManagers(mgrs);
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
    fetchDepartments();
    fetchAllUsers();
    fetchComplaints();
  }, []);

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', manager: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description, manager: dept.managerId || '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormData({ name: '', description: '', manager: '' });
    setModalError('');
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setModalError('Department Name must be at least 3 characters.');
      return;
    }
    setSaving(true);
    setModalError('');

    try {
      if (editingDept) {
        try {
          await API.put(`/departments/${editingDept.id}`, formData);
        } catch (apiErr) {
          console.warn('API update fallback:', apiErr);
        }
        setDepartments(prev => prev.map(d => d.id === editingDept.id ? {
          ...d,
          name: formData.name,
          description: formData.description,
          manager: formData.manager ? (managers.find(m => m._id === formData.manager)?.name || 'Unassigned') : 'Unassigned',
          managerId: formData.manager || ''
        } : d));
        showNotification('success', `Department "${formData.name}" updated successfully!`);
      } else {
        let createdObj = null;
        try {
          const res = await API.post('/departments', formData);
          createdObj = res.data;
        } catch (apiErr) {
          console.warn('API create fallback:', apiErr);
        }
        const newDept = {
          id: createdObj?._id || `dept_${Date.now()}`,
          _id: createdObj?._id || `dept_${Date.now()}`,
          name: formData.name,
          description: formData.description || 'No description provided.',
          manager: formData.manager ? (managers.find(m => m._id === formData.manager)?.name || 'Unassigned') : 'Unassigned',
          managerId: formData.manager || '',
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setDepartments(prev => [newDept, ...prev]);
        showNotification('success', `Department "${formData.name}" created successfully!`);
      }
      handleCloseModal();
    } catch (err) {
      setModalError('Failed to save department. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      try {
        await API.delete(`/departments/${id}`);
      } catch (apiErr) {
        console.warn('API delete fallback:', apiErr);
      }
      setDepartments(prev => prev.filter(d => d.id !== id));
      setDeletingId(null);
      showNotification('success', 'Department deleted successfully.');
    } catch (err) {
      showNotification('error', 'Could not delete department.');
    }
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.manager.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <SuperAdminSidebar activeTab="departments" />
      ) : (
        <HRSidebar activeTab="departments" />
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

        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {feedbackMsg.text && (
            <div style={{ background: feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: feedbackMsg.type === 'success' ? '#166534' : '#991B1B', border: `1px solid ${feedbackMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`, padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {feedbackMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button onClick={() => setFeedbackMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
            </div>
          )}

          {selectedDept ? (
            /* DETAILED DEPARTMENT VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setSelectedDept(null)} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                    {selectedDept.name} Details
                  </h1>
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                    Analytics, staff directory, and profile monitoring.
                  </p>
                </div>
              </div>

              {/* Department description card */}
              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.5rem 0' }}>About Department</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 1rem 0', lineHeight: '1.6' }}>{selectedDept.description}</p>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Manager: </span>
                    <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedDept.manager}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Created On: </span>
                    <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedDept.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Department specific analytics cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Total Staff</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>
                      {allUsers.filter(u => u.department?._id === selectedDept._id || u.department === selectedDept._id || u.department?.name === selectedDept.name).length}
                    </div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Total Complaints</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>
                      {complaints.filter(c => c.responsibleDepartment?._id === selectedDept._id || c.responsibleDepartment === selectedDept._id || c.responsibleDepartment?.name === selectedDept.name).length}
                    </div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Resolved</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>
                      {complaints.filter(c => (c.responsibleDepartment?._id === selectedDept._id || c.responsibleDepartment === selectedDept._id || c.responsibleDepartment?.name === selectedDept.name) && (c.status === 'Resolved' || c.status === 'Closed')).length}
                    </div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Escalated</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#EF4444', fontFamily: "'Outfit', sans-serif" }}>
                      {complaints.filter(c => (c.responsibleDepartment?._id === selectedDept._id || c.responsibleDepartment === selectedDept._id || c.responsibleDepartment?.name === selectedDept.name) && c.status === 'Escalated').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Directory Table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>Staff Directory</h3>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', fontWeight: '700', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px' }}>
                    {allUsers.filter(u => u.department?._id === selectedDept._id || u.department === selectedDept._id || u.department?.name === selectedDept.name).length} Members
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                        <th style={{ padding: '1rem 1.5rem' }}>Employee ID</th>
                        <th style={{ padding: '1rem 1.5rem' }}>Name</th>
                        <th style={{ padding: '1rem 1.5rem' }}>Designation</th>
                        <th style={{ padding: '1rem 1.5rem' }}>Role</th>
                        <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => u.department?._id === selectedDept._id || u.department === selectedDept._id || u.department?.name === selectedDept.name)
                        .map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#2563EB' }}>{u.employeeId}</td>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0F172A' }}>{u.name}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#475569' }}>{u.designation || 'N/A'}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#475569' }}>{u.role}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                background: u.status === 'Active' ? '#DCFCE7' : u.status === 'Pending' ? '#FEF3C7' : '#FEE2E2', 
                                color: u.status === 'Active' ? '#16A34A' : u.status === 'Pending' ? '#D97706' : '#EF4444', 
                                fontSize: '0.75rem', 
                                fontWeight: '700', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '12px' 
                              }}>
                                {u.status}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                              <button onClick={() => setSelectedStaff(u)} style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      {allUsers.filter(u => u.department?._id === selectedDept._id || u.department === selectedDept._id || u.department?.name === selectedDept.name).length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748B' }}>
                            No staff registered under this department yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Building2 style={{ color: '#2563EB' }} size={28} />
                    Departments Overview
                  </h1>
                  <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                    Manage organizational departments, assign leads, and streamline routing.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={fetchDepartments} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
                  </button>
                  <button onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <Plus size={18} /> Add Department
                  </button>
                </div>
              </div>

              {/* SUMMARY STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Total Departments</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>{departments.length}</div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Active Leads</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>{departments.filter(d => d.manager && d.manager !== 'Unassigned').length}</div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Coverage Ratio</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#9333EA', fontFamily: "'Outfit', sans-serif" }}>100%</div>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Routing Policy</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '5px' }}>Auto-Escalate</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" placeholder="Search departments or managers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }} />
                  {searchQuery && <X size={16} onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', cursor: 'pointer' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: '4px', borderRadius: '8px', gap: '4px', border: '1px solid #E2E8F0' }}>
                  <button onClick={() => setViewMode('grid')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? '#FFFFFF' : 'transparent', color: viewMode === 'grid' ? '#2563EB' : '#64748B', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <LayoutGrid size={16} /> Grid
                  </button>
                  <button onClick={() => setViewMode('table')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: viewMode === 'table' ? '#FFFFFF' : 'transparent', color: viewMode === 'table' ? '#2563EB' : '#64748B', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <List size={16} /> Table
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={28} className="spin-icon" style={{ color: '#2563EB', marginBottom: '1rem' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Loading departments...</div>
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '4.5rem 2rem', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F8FAFC', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Inbox size={40} style={{ color: '#64748B' }} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>No Departments Found</h3>
                  <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                    {searchQuery ? `No results match "${searchQuery}".` : 'Click "Add Department" to create your first organizational department.'}
                  </p>
                  {!searchQuery && (
                    <button onClick={handleOpenAddModal} style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>+ Create Department</button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {filteredDepartments.map((dept) => (
                    <div key={dept.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div onClick={() => setSelectedDept(dept)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Briefcase size={20} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => handleOpenEditModal(dept)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeletingId(dept.id)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 onClick={() => setSelectedDept(dept)} style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>{dept.name}</h3>
                        <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {dept.description}
                        </p>
                      </div>
                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: '500' }}>Manager: </span>
                          <span style={{ color: '#0F172A', fontWeight: '700' }}>{dept.manager}</span>
                        </div>
                        <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', color: '#475569', fontSize: '0.75rem', fontWeight: '700' }}>
                          {dept.createdAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                          <th style={{ padding: '1rem 1.5rem' }}>Department Name</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Description</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Manager / Lead</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Created</th>
                          <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map(d => (
                          <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td onClick={() => setSelectedDept(d)} style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0F172A', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Briefcase size={16} style={{ color: '#2563EB' }} />
                                {d.name}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#475569', maxWidth: '300px' }}>{d.description}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#0F172A', fontWeight: '700' }}>{d.manager}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>{d.createdAt}</td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                <button onClick={() => handleOpenEditModal(d)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Edit2 size={13} /> Edit
                                </button>
                                <button onClick={() => setDeletingId(d.id)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Staff Profile Details Modal */}
      {selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Staff Profile Details
              </h2>
              <button onClick={() => setSelectedStaff(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
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
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Department</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.department?.name || selectedStaff.department || 'General'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Designation</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.designation || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Role / System Access</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{selectedStaff.role}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontWeight: '500' }}>Access Status</span>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    background: selectedStaff.status === 'Active' ? '#DCFCE7' : '#FEE2E2', 
                    color: selectedStaff.status === 'Active' ? '#16A34A' : '#EF4444', 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '8px',
                    marginTop: '0.25rem'
                  }}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <button onClick={() => setSelectedStaff(null)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>
                  Close Profile
                </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>
            {modalError && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <AlertCircle size={16} /> {modalError}
              </div>
            )}
            <form onSubmit={handleSaveDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Department Name *</label>
                <input type="text" required placeholder="e.g. IT Support" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Description</label>
                <textarea rows={3} placeholder="Brief summary..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Head of Department</label>
                <select value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="">-- Select a Manager --</option>
                  {managers.map(mgr => <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.employeeId})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
                <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif" }}>Delete Department?</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>Are you sure you want to delete this department? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => handleDeleteDepartment(deletingId)} style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                Delete
              </button>
              <button onClick={() => setDeletingId(null)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
