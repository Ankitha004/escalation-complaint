import React, { useContext, useState } from 'react';
import ManagerSidebar from '../components/ManagerSidebar';
import { Settings, User, Mail, Shield, Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ManagerSettings = () => {
  const { user } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="settings" />
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 1.5rem 0' }}>
          Account Settings
        </h1>
        
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '2rem', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F59E0B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800' }}>
              MN
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>{user?.name || 'Department Manager'}</h2>
              <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <Shield size={14} /> Department Level Access
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Employee ID</label>
              <div style={{ padding: '0.8rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} /> {user?.employeeId || 'MGR001'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Email Address</label>
              <div style={{ padding: '0.8rem 1rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: '#94A3B8' }}/> {user?.email || 'manager@company.com'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>Email Notifications</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Receive alerts when tickets breach SLA.</div>
                </div>
                <div 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  style={{ width: '40px', height: '24px', background: notificationsEnabled ? '#2563EB' : '#CBD5E1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
                >
                  <div style={{ width: '18px', height: '18px', background: '#FFF', borderRadius: '50%', position: 'absolute', top: '3px', left: notificationsEnabled ? '19px' : '3px', transition: 'left 0.3s ease' }}></div>
                </div>
              </div>
            </div>

          </div>

          <button style={{ marginTop: '3rem', background: '#2563EB', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
};

export default ManagerSettings;
