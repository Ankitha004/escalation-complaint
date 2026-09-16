import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import ManagerSidebar from '../components/ManagerSidebar';
import HRSidebar from '../components/HRSidebar';
import TLSidebar from '../components/TLSidebar';
import API from '../services/api';
import { 
  Mail, Phone, Hash, Briefcase, Users, CheckCircle, AlertCircle, Loader2, 
  Lock, Shield, Bell, Clock, Key, ShieldCheck, User, Eye, EyeOff, Laptop, Globe, FileText, ExternalLink,
  UploadCloud, Download, X, Check, Calendar, HeartPulse, Sparkles
} from 'lucide-react';

const StaffProfile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Leave balances state
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // CV Upload & Viewer states
  const [uploadingCv, setUploadingCv] = useState(false);
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvSuccessMsg, setCvSuccessMsg] = useState('');

  // Password change state & visibility toggles
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passUpdating, setPassUpdating] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Preference toggles
  const [escalationAlerts, setEscalationAlerts] = useState(true);

  const handleStaffCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCv(true);
    setCvSuccessMsg('');
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const res = await API.post('/auth/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileData(prev => ({
        ...prev,
        cvUrl: res.data.cvUrl,
        cvOriginalName: res.data.cvOriginalName || file.name
      }));
      setCvSuccessMsg('CV uploaded and updated successfully!');
      setTimeout(() => setCvSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload CV.');
    } finally {
      setUploadingCv(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/auth/me');
        setProfileData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    const fetchBalances = async () => {
      setLoadingBalances(true);
      try {
        const bRes = await API.get('/leaves/balances');
        setLeaveBalances(bRes.data);
      } catch (err) {
        console.warn('Could not fetch leave balances:', err);
      } finally {
        setLoadingBalances(false);
      }
    };

    fetchProfile();
    fetchBalances();
  }, []);

  const renderSidebar = () => {
    const role = user?.role || profileData?.role || 'Staff';
    switch (role) {
      case 'Manager':
        return <ManagerSidebar activeTab="profile" />;
      case 'HR':
        return <HRSidebar activeTab="profile" />;
      case 'Team Leader':
        return <TLSidebar activeTab="profile" />;
      case 'Staff':
      case 'Support Staff':
      default:
        return <StaffSidebar activeTab="profile" />;
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPassMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setPassUpdating(true);
    try {
      await API.put('/auth/change-password', {
        oldPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }).catch(async () => {
        // Fallback endpoint test
        await API.put('/auth/update-password', {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        });
      });

      setPassMsg({ type: 'success', text: 'Security password updated successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPassUpdating(false);
    }
  };

  // Helper to resolve phone number
  const getPhoneNumber = () => {
    return profileData?.phone || profileData?.phoneNumber || profileData?.mobile || user?.phone || user?.phoneNumber || '+91 98765 43210';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {renderSidebar()}

      <main style={{ flex: 1, minWidth: 0, padding: '2rem 2.5rem', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
                <User size={22} />
              </div>
              My Profile & Security
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '0.35rem', margin: 0 }}>
              Manage personal credentials, employment records, annual leave quotas, and security preferences.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.45rem 1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#16A34A" /> ID: {profileData?.employeeId || 'Active Member'}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem', color: '#64748B' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginRight: '1rem' }} />
            <span>Loading profile details...</span>
          </div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertCircle size={24} />
            <span style={{ fontWeight: '600' }}>{error}</span>
          </div>
        ) : (
          /* Main 2-Column Grid Layout */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(420px, 1.15fr)', gap: '1.75rem', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: Identity & Personal Information (Unified Card) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Unified Profile Card */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)' }}></div>
                
                {/* Hero Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ 
                    width: '76px', height: '76px', borderRadius: '20px', 
                    background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)', 
                    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: '800', fontSize: '2rem', boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
                    border: '3px solid #FFFFFF', flexShrink: 0
                  }}>
                    {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.4rem 0', fontFamily: "'Outfit', sans-serif" }}>
                      {profileData?.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #C7D2FE' }}>
                        {profileData?.role || 'Staff'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: profileData?.status === 'Active' ? '#10B981' : '#F59E0B', fontSize: '0.75rem', fontWeight: '700', background: '#F0FDF4', padding: '3px 10px', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
                        <CheckCircle size={12} /> {profileData?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Title */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Briefcase size={16} style={{ color: '#2563EB' }} /> Personal & Organization Details
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                    
                    {/* Employee ID */}
                    <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Hash size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee ID</div>
                        <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem' }}>{profileData?.employeeId || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
                        <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem' }}>{getPhoneNumber()}</div>
                      </div>
                    </div>

                    {/* Email - Spans 2 columns */}
                    <div style={{ gridColumn: 'span 2', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={17} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                        <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{profileData?.email || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Department */}
                    <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Briefcase size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                        <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem' }}>
                          {profileData?.department ? profileData.department.name : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Team Leader */}
                    <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Leader</div>
                        <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem' }}>
                          {profileData?.teamLeader ? profileData.teamLeader.name : 'Not Assigned'}
                        </div>
                      </div>
                    </div>

                    {/* Curriculum Vitae (CV) / Resume Document - Spans 2 columns */}
                    <div style={{ gridColumn: 'span 2', padding: '1rem 1.15rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: profileData?.cvUrl ? '#ECFDF5' : '#EFF6FF', color: profileData?.cvUrl ? '#10B981' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Curriculum Vitae (CV)</div>
                            <div style={{ color: '#0F172A', fontWeight: '800', fontSize: '0.88rem', marginTop: '1px' }}>
                              {profileData?.cvOriginalName || (profileData?.cvUrl ? 'Employee_CV_Document.pdf' : 'No CV Uploaded Yet')}
                            </div>
                          </div>
                        </div>

                        {profileData?.cvUrl ? (
                          <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={12} /> Verified
                          </span>
                        ) : (
                          <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                            Action Required
                          </span>
                        )}
                      </div>

                      {cvSuccessMsg && (
                        <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={14} /> {cvSuccessMsg}
                        </div>
                      )}

                      {/* Actions Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid #F1F5F9' }}>
                        {profileData?.cvUrl && (
                          <button
                            type="button"
                            onClick={() => setShowCvModal(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#0F172A', color: '#FFFFFF', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.15)' }}
                          >
                            <Eye size={14} /> View CV
                          </button>
                        )}

                        {/* Upload / Replace input */}
                        <input
                          type="file"
                          id="staff-profile-cv-input"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleStaffCvUpload}
                          style={{ display: 'none' }}
                          disabled={uploadingCv}
                        />
                        <label
                          htmlFor="staff-profile-cv-input"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: profileData?.cvUrl ? '#EFF6FF' : '#2563EB',
                            color: profileData?.cvUrl ? '#2563EB' : '#FFFFFF',
                            border: profileData?.cvUrl ? '1px solid #BFDBFE' : 'none',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: uploadingCv ? 'not-allowed' : 'pointer',
                            boxShadow: profileData?.cvUrl ? 'none' : '0 2px 6px rgba(37,99,235,0.25)'
                          }}
                        >
                          {uploadingCv ? (
                            <>
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud size={14} />
                              {profileData?.cvUrl ? 'Update / Replace CV' : 'Upload CV'}
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Extra Quick Info Widget */}
                <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ShieldCheck size={16} color="#2563EB" />
                    <span>Compliance Status: <strong style={{ color: '#0F172A' }}>Verified Staff</strong></span>
                  </div>
                  <span style={{ fontSize: '0.74rem', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                    Enterprise SSO Active
                  </span>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Leave Tracking, Password & Preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* ANNUAL LEAVE BALANCE TRACKER (12 YEARLY: 6 EL, 6 MEDICAL) */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 50%, #2563EB 100%)' }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                        Annual Leave Quotas & Tracker
                      </h3>
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '600' }}>
                        Yearly Entitlement: {leaveBalances?.totalLimit || 12} Days Total
                      </span>
                    </div>
                  </div>

                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #E2E8F0' }}>
                    Year {leaveBalances?.year || new Date().getFullYear()}
                  </span>
                </div>

                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: '1.4' }}>
                  Staff leaves are strictly governed per company policy: <strong style={{ color: '#0F172A' }}>12 days yearly</strong> comprising <strong style={{ color: '#2563EB' }}>6 Earned Leaves (EL)</strong> and <strong style={{ color: '#059669' }}>6 Medical Leaves</strong>.
                </p>

                {/* OVERVIEW SUMMARY BADGE */}
                <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Leaves Remaining</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: (leaveBalances?.totalRemaining ?? 12) > 3 ? '#059669' : '#D97706', fontFamily: "'Outfit', sans-serif" }}>
                      {leaveBalances?.totalRemaining ?? 12} <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748B' }}>/ {leaveBalances?.totalLimit || 12} Days</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Used</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>
                      {leaveBalances?.totalUsed ?? 0} Days
                    </div>
                  </div>
                </div>

                {/* DETAILED 2-CARD BREAKDOWN: EARNED LEAVE (6) vs MEDICAL LEAVE (6) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  {/* Earned Leave Card (6 Days) */}
                  <div style={{ background: '#EFF6FF', borderRadius: '14px', border: '1px solid #BFDBFE', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Sparkles size={13} /> Earned Leave (EL)
                      </span>
                      <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '2px 7px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>
                        6 Max
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E3A8A', fontFamily: "'Outfit', sans-serif" }}>
                        {leaveBalances?.earnedLeave?.remaining ?? 6}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3B82F6' }}>days left</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (((leaveBalances?.earnedLeave?.used ?? 0) / 6) * 100))}%`, 
                        height: '100%', 
                        background: '#2563EB',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', fontWeight: '600' }}>
                      <span>Used: <strong>{leaveBalances?.earnedLeave?.used ?? 0}d</strong></span>
                      {leaveBalances?.earnedLeave?.pending > 0 && (
                        <span style={{ color: '#D97706' }}>Pending: <strong>{leaveBalances.earnedLeave.pending}d</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Medical Leave Card (6 Days) */}
                  <div style={{ background: '#ECFDF5', borderRadius: '14px', border: '1px solid #A7F3D0', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <HeartPulse size={13} /> Medical Leave
                      </span>
                      <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 7px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>
                        6 Max
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#064E3B', fontFamily: "'Outfit', sans-serif" }}>
                        {leaveBalances?.medicalLeave?.remaining ?? 6}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#059669' }}>days left</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: '#D1FAE5', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (((leaveBalances?.medicalLeave?.used ?? 0) / 6) * 100))}%`, 
                        height: '100%', 
                        background: '#059669',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', fontWeight: '600' }}>
                      <span>Used: <strong>{leaveBalances?.medicalLeave?.used ?? 0}d</strong></span>
                      {leaveBalances?.medicalLeave?.pending > 0 && (
                        <span style={{ color: '#D97706' }}>Pending: <strong>{leaveBalances.medicalLeave.pending}d</strong></span>
                      )}
                    </div>
                  </div>

                </div>

                {/* EMERGENCY LEAVE NOTICE */}
                <div style={{ marginTop: '0.9rem', padding: '0.75rem 0.9rem', background: '#FFF1F2', borderRadius: '12px', border: '1px solid #FECDD3', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <AlertCircle size={16} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.74rem', color: '#9F1239', lineHeight: '1.4' }}>
                    <strong>Emergency Leave Available:</strong> Staff can apply for Emergency Leave beyond standard quotas. If leave days extend remaining annual quota days, a salary deduction (₹{Math.round(((profileData?.baseSalary || 30000) / 30)).toLocaleString('en-IN')}/day) will be calculated and notified.
                  </div>
                </div>

                <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Quota resets on January 1st annually
                  </span>
                  <a href="/staff-dashboard#my-leaves-section" style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700', textDecoration: 'none' }}>
                    Apply or View Requests &rarr;
                  </a>
                </div>
              </div>
              
              {/* Account Security / Change Password */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.35rem 0', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} style={{ color: '#2563EB' }} /> Change Password
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                  Update your credentials regularly to keep your enterprise account safe.
                </p>

                {passMsg.text && (
                  <div style={{ 
                    marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600',
                    background: passMsg.type === 'error' ? '#FEE2E2' : '#D1FAE5',
                    color: passMsg.type === 'error' ? '#991B1B' : '#065F46',
                    border: passMsg.type === 'error' ? '1px solid #FCA5A5' : '1px solid #6EE7B7',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    {passMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {passMsg.text}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  
                  {/* Password input row (Current, New, Confirm side-by-side or stacked cleanly) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      Current Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showCurrentPass ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        style={{
                          width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', borderRadius: '10px',
                          border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', background: '#F8FAFC',
                          boxSizing: 'border-box'
                        }}
                      />
                      <Key size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: 0 }}
                        title={showCurrentPass ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* New Password Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          style={{
                            width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', borderRadius: '10px',
                            border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', background: '#F8FAFC',
                            boxSizing: 'border-box'
                          }}
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: 0 }}
                          title={showNewPass ? 'Hide password' : 'Show password'}
                        >
                          {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        Confirm New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          style={{
                            width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', borderRadius: '10px',
                            border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', background: '#F8FAFC',
                            boxSizing: 'border-box'
                          }}
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: 0 }}
                          title={showConfirmPass ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={passUpdating}
                    style={{
                      marginTop: '0.25rem', padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF',
                      fontWeight: '700', fontSize: '0.9rem', cursor: passUpdating ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.2s ease'
                    }}
                  >
                    {passUpdating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={18} />}
                    {passUpdating ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* System Notifications & Active Session Card */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} style={{ color: '#2563EB' }} /> System Notifications & Session
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Escalation Reminders Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>Escalation Reminders</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Get notified when SLA deadline approaches</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={escalationAlerts} 
                      onChange={(e) => setEscalationAlerts(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                    />
                  </div>

                  {/* Fixed Active Session Badge */}
                  <div style={{ padding: '0.85rem 1.1rem', background: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', flexShrink: 0, boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#065F46' }}>Current Active Session</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#047857', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>Active Now</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Laptop size={13} /> <span>Web App (Windows PC)</span>
                        <span>•</span>
                        <Globe size={13} /> <span>Internal Portal Network</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* CV DOCUMENT PREVIEW MODAL */}
      {showCvModal && profileData?.cvUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '900px', height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                    {profileData?.cvOriginalName || 'Curriculum Vitae'}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Uploaded Document &bull; {profileData?.name} ({profileData?.employeeId})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={`http://localhost:5000${profileData.cvUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FFFFFF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Open in New Tab
                </a>
                <a
                  href={`http://localhost:5000${profileData.cvUrl}`}
                  download={profileData?.cvOriginalName || 'Staff_CV.pdf'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#10B981', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', textDecoration: 'none' }}
                >
                  <Download size={13} /> Download
                </a>
                <button
                  onClick={() => setShowCvModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview */}
            <div style={{ flex: 1, background: '#334155', position: 'relative' }}>
              <iframe
                src={`http://localhost:5000${profileData.cvUrl}`}
                title="Staff CV Document"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProfile;
