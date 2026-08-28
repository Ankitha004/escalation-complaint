import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import ManagerSidebar from '../components/ManagerSidebar';
import HRSidebar from '../components/HRSidebar';
import TLSidebar from '../components/TLSidebar';
import API from '../services/api';
import { Mail, Phone, Hash, Briefcase, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const StaffProfile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    fetchProfile();
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {renderSidebar()}

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            My Profile
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.3rem', margin: 0 }}>
            Manage your personal information and account details.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#64748B' }}>
            <Loader2 size={32} className="lucide-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '1rem' }} />
            Loading profile...
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertCircle size={24} />
            <span style={{ fontWeight: '600' }}>{error}</span>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', maxWidth: '900px' }}>
            
            {/* Header / Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '2rem' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)', 
                color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: '800', fontSize: '2rem', boxShadow: '0 4px 14px rgba(56,189,248,0.3)'
              }}>
                {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
                  {profileData?.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {profileData?.role || 'Staff'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: profileData?.status === 'Active' ? '#10B981' : '#F59E0B', fontSize: '0.85rem', fontWeight: '600' }}>
                    <CheckCircle size={14} /> {profileData?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Hash size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Employee ID</div>
                  <div style={{ color: '#0F172A', fontWeight: '700' }}>{profileData?.employeeId || 'N/A'}</div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Email Address</div>
                  <div style={{ color: '#0F172A', fontWeight: '700' }}>{profileData?.email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Phone Number</div>
                  <div style={{ color: '#0F172A', fontWeight: '700' }}>{profileData?.phone || 'N/A'}</div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Department</div>
                  <div style={{ color: '#0F172A', fontWeight: '700' }}>
                    {profileData?.department ? profileData.department.name : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '1rem', gridColumn: '1 / -1' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginBottom: '0.2rem' }}>Team Leader</div>
                  <div style={{ color: '#0F172A', fontWeight: '700' }}>
                    {profileData?.teamLeader ? profileData.teamLeader.name : 'Not Assigned'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffProfile;
