import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  UserCog, 
  Building2, 
  Bell, 
  LogOut, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const RegistrationDetails = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for HR action
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assignedTeamLeader, setAssignedTeamLeader] = useState('');
  const [assignedDesignation, setAssignedDesignation] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Team Leaders list fetched dynamically from MongoDB
  const [teamLeadersList, setTeamLeadersList] = useState([]);

  // Fetch active team leaders from backend API
  useEffect(() => {
    const fetchTeamLeaders = async () => {
      try {
        const res = await API.get('/hr/team-leaders?activeOnly=true');
        const data = res.data || [];
        setTeamLeadersList(data.map(tl => ({
          id: tl._id || tl.employeeId,
          name: tl.name,
          employeeId: tl.employeeId
        })));
      } catch (err) {
        console.warn('Team leaders fetch notice:', err);
        setTeamLeadersList([]);
      }
    };
    fetchTeamLeaders();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await API.get(`/hr/registrations/${id}`);
          const found = res.data;
          if (found) {
            setRegistration({
              id: found._id,
              regId: found.employeeId || 'REG-PENDING',
              name: found.name,
              email: found.email,
              phone: found.phone || found.phoneNumber || 'N/A',
              department: found.department?.name || found.department || 'General',
              appliedDate: found.createdAt ? new Date(found.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
              status: found.status || 'Pending'
            });
            // Auto generate Staff ID if not set
            const genId = found.employeeId && !found.employeeId.startsWith('REG-')
              ? found.employeeId 
              : `EMP${Math.floor(1000 + Math.random() * 9000)}`;
            setAssignedStaffId(genId);
          }
        }
      } catch (err) {
        console.error('Error fetching registration details:', err);
        setRegistration(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
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
      if (registration?.id) {
        await API.put(`/hr/registrations/${registration.id}/approve`, {
          employeeId: assignedStaffId,
          teamLeader: assignedTeamLeader,
          designation: assignedDesignation || 'Staff',
          phone: registration.phone,
          department: registration.department
        });
      }
      setActionSuccess({
        type: 'Approve',
        title: 'Registration Request Approved Successfully!',
        message: `Staff ID ${assignedStaffId} has been generated and assigned to Team Leader ${assignedTeamLeader}. Account is now Active.`
      });
    } catch (err) {
      console.error(err.response || err);
      alert(err.response?.data?.message || 'Failed to approve registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      alert('Please provide a detailed rejection reason (min 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      if (registration?.id) {
        await API.put(`/hr/registrations/${registration.id}/reject`, {
          reason: rejectionReason
        });
      }
      setActionSuccess({
        type: 'Reject',
        title: 'Registration Request Rejected',
        message: `Reason recorded: ${rejectionReason}`
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-gradient)', fontFamily: "var(--font-sans)", color: '#0F172A' }}>
      
      {/* TOP HEADER */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/pending-registrations')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Pending Registrations
        </button>
        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>
          HR Review Module &bull; ID: <strong style={{ color: '#2563EB' }}>{registration?.regId || id}</strong>
        </span>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* SIDEBAR */}
        {user?.role === 'Super Admin' ? (
          <SuperAdminSidebar activeTab="pending-registrations" />
        ) : (
          <HRSidebar activeTab="pending-registrations" />
        )}

        {/* WORKSPACE CONTENT */}
        <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', background: '#F8FAFC' }}>
          
          {actionSuccess ? (
            /* ACTION SUCCESS CONFIRMATION CARD */
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', maxWidth: '550px', margin: '4rem auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: actionSuccess.type === 'Approve' ? '#DCFCE7' : '#FEE2E2', color: actionSuccess.type === 'Approve' ? '#16A34A' : '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: actionSuccess.type === 'Approve' ? '0 0 0 10px #F0FDF4' : '0 0 0 10px #FEF2F2' }}>
                {actionSuccess.type === 'Approve' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                {actionSuccess.title}
              </h3>
              <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                {actionSuccess.message}
              </p>
              <button
                onClick={() => navigate('/pending-registrations')}
                style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
              >
                Back to Registration Requests
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start', maxWidth: '1200px', margin: '0 auto' }}>
              
              {/* APPLICANT DETAILS CARD */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '110px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}></div>
                
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', marginBottom: '2.5rem' }}>
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', border: '4px solid #FFF', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                    {registration?.name ? registration.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', marginTop: '1rem', marginBottom: '0.35rem', fontFamily: "'Outfit', sans-serif" }}>
                    {registration?.name}
                  </h2>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FEF3C7', color: '#D97706', fontSize: '0.75rem', fontWeight: '800', padding: '0.4rem 1rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Clock size={14} /> Pending HR Approval
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ width: '44px', height: '44px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={20} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Email Address</div>
                      <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: '600' }}>{registration?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ width: '44px', height: '44px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={20} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Phone Number</div>
                      <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: '600' }}>{registration?.phone}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ width: '44px', height: '44px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={20} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Applied Department</div>
                      <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: '700' }}>{registration?.department}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ width: '44px', height: '44px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Applied Date</div>
                      <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: '600' }}>{registration?.appliedDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HR ACTION FORM */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Assignment Details
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.35rem' }}>Complete the fields below to finalize the onboarding process.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Generated Staff ID */}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                      Generated Staff ID
                    </label>
                    <input
                      type="text"
                      value={assignedStaffId}
                      onChange={(e) => setAssignedStaffId(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', color: '#2563EB', background: '#F8FAFC', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  {/* Assign Team Leader Dropdown */}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                      Assign Team Leader *
                    </label>
                    <select
                      value={assignedTeamLeader}
                      onChange={(e) => setAssignedTeamLeader(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.95rem', color: '#0F172A', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', background: '#FFF url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748B\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 1rem center/1.2rem', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    >
                      <option value="">Select Team Leader...</option>
                      {teamLeadersList.length === 0 ? (
                        <option value="" disabled>No active Team Leaders found. Please add a Team Leader first.</option>
                      ) : (
                        teamLeadersList.map((tl) => (
                          <option key={tl.id} value={tl.employeeId || tl.id}>{tl.name} ({tl.employeeId})</option>
                        ))
                      )}
                    </select>
                    {teamLeadersList.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                        <AlertTriangle size={15} /> You must create a Team Leader first.
                      </span>
                    )}
                  </div>

                  {/* Designation */}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                      Assign Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Manager..."
                      value={assignedDesignation}
                      onChange={(e) => setAssignedDesignation(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.95rem', color: '#0F172A', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  {/* Approve Button */}
                  <button
                    onClick={handleApprove}
                    disabled={submitting || teamLeadersList.length === 0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(to right, #10B981, #059669)', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', cursor: submitting || teamLeadersList.length === 0 ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: teamLeadersList.length === 0 ? 0.6 : 1, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'transform 0.1s' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <CheckCircle2 size={20} /> Approve & Activate Account
                  </button>

                  <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #E2E8F0' }}></div>
                    <span style={{ position: 'relative', background: '#FFFFFF', padding: '0 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Or Decline</span>
                  </div>

                  {/* Rejection Section */}
                  <div style={{ background: '#FEF2F2', border: '1px dashed #FCA5A5', borderRadius: '16px', padding: '1.5rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#991B1B', display: 'block', marginBottom: '0.5rem' }}>
                      Rejection Reason
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Required if rejecting..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #FCA5A5', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: '#FFF', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#EF4444'}
                      onBlur={(e) => e.target.style.borderColor = '#FCA5A5'}
                    ></textarea>

                    <button
                      onClick={handleReject}
                      disabled={submitting || !rejectionReason}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#EF4444', color: '#FFF', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: submitting || !rejectionReason ? 'not-allowed' : 'pointer', opacity: !rejectionReason ? 0.5 : 1, marginTop: '1rem', width: '100%' }}
                    >
                      <XCircle size={18} /> Reject Request
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default RegistrationDetails;
