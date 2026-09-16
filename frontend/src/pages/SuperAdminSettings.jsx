import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  Settings,
  ShieldCheck,
  Clock,
  Zap,
  Building,
  Save,
  Check,
  AlertCircle,
  Database,
  Lock,
  User,
  Sliders,
  Bell,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

const SuperAdminSettings = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // SLA Configuration
  const [slaCritical, setSlaCritical] = useState(4);
  const [slaHigh, setSlaHigh] = useState(24);
  const [slaMedium, setSlaMedium] = useState(48);
  const [slaLow, setSlaLow] = useState(72);
  const [defaultIncentive, setDefaultIncentive] = useState(500);
  const [autoEscalateL1, setAutoEscalateL1] = useState(true);
  const [autoEscalateL2, setAutoEscalateL2] = useState(true);

  // Organization Info
  const [orgName, setOrgName] = useState('Enterprise Escalation Systems');
  const [supportEmail, setSupportEmail] = useState('support@company.com');
  const [businessStart, setBusinessStart] = useState('09:00');
  const [businessEnd, setBusinessEnd] = useState('18:00');

  // Security Credentials
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    // Load existing settings if saved locally
    const saved = localStorage.getItem('system_sla_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.slaCritical) setSlaCritical(parsed.slaCritical);
        if (parsed.slaHigh) setSlaHigh(parsed.slaHigh);
        if (parsed.slaMedium) setSlaMedium(parsed.slaMedium);
        if (parsed.slaLow) setSlaLow(parsed.slaLow);
        if (parsed.defaultIncentive) setDefaultIncentive(parsed.defaultIncentive);
        if (parsed.orgName) setOrgName(parsed.orgName);
      } catch (e) {}
    }
  }, []);

  const handleSaveSlaSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const config = {
        slaCritical: Number(slaCritical),
        slaHigh: Number(slaHigh),
        slaMedium: Number(slaMedium),
        slaLow: Number(slaLow),
        defaultIncentive: Number(defaultIncentive),
        autoEscalateL1,
        autoEscalateL2,
        orgName,
        supportEmail,
        businessStart,
        businessEnd,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('system_sla_settings', JSON.stringify(config));
      setSaveSuccess('System SLA parameters and Organization profile saved successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      // Direct update
      await API.put(`/users/${user._id}/status`, { password: newPassword });
      setPasswordMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 4000);
    } catch (err) {
      setPasswordMsg('Failed to update password.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SuperAdminSidebar activeTab="settings" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Global System Governance & Settings
            </h1>
            <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
              Super Admin Control
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
            Configure enterprise SLA thresholds, automated escalation stages, resolver incentives, and system security credentials.
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {saveSuccess && (
          <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {saveSuccess}
          </div>
        )}

        {/* GRID LAYOUT - BALANCED 2 COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>

          {/* 1. SLA & ESCALATION RULES */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <Clock size={20} color="#2563EB" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                SLA & Automated Escalation Thresholds
              </h2>
            </div>

            <form onSubmit={handleSaveSlaSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Critical Priority SLA (Hours) *</label>
                  <input type="number" required value={slaCritical} onChange={e => setSlaCritical(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>High Priority SLA (Hours) *</label>
                  <input type="number" required value={slaHigh} onChange={e => setSlaHigh(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Medium Priority SLA (Hours) *</label>
                  <input type="number" required value={slaMedium} onChange={e => setSlaMedium(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Low Priority SLA (Hours) *</label>
                  <input type="number" required value={slaLow} onChange={e => setSlaLow(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Default Incentive per Solved Ticket (₹) *</label>
                <input type="number" required value={defaultIncentive} onChange={e => setDefaultIncentive(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoEscalateL1} onChange={e => setAutoEscalateL1(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                  Enable Auto-Escalation to Department Manager on TL breach (Level 1)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoEscalateL2} onChange={e => setAutoEscalateL2(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                  Enable Auto-Escalation to Super Admin on Manager breach (Level 2)
                </label>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ width: '100%', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                  <Save size={16} /> Save SLA Configuration
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: ENTERPRISE PROFILE & CREDENTIALS STACKED CLEANLY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 2. ORGANIZATION PROFILE */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                <Building size={20} color="#16A34A" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  Enterprise Profile & Business Hours
                </h2>
              </div>

              <form onSubmit={handleSaveSlaSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>Organization / Enterprise Name *</label>
                  <input type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Corporate Support Email *</label>
                  <input type="email" required value={supportEmail} onChange={e => setSupportEmail(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Business Start Time</label>
                    <input type="time" value={businessStart} onChange={e => setBusinessStart(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Business End Time</label>
                    <input type="time" value={businessEnd} onChange={e => setBusinessEnd(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#64748B' }}>
                  💡 Business hours dictate SLA minute calculations (excluding weekends and non-business intervals).
                </div>

                <button type="submit" style={{ width: '100%', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}>
                  <Check size={16} /> Save Profile Settings
                </button>
              </form>
            </div>

            {/* 3. SECURITY & CREDENTIALS */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                <Lock size={20} color="#EA580C" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  Super Admin Security & Password
                </h2>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>New Master Password *</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Password *</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={inputStyle} />
                </div>

                {passwordMsg && (
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: passwordMsg.includes('success') ? '#16A34A' : '#DC2626' }}>
                    {passwordMsg}
                  </div>
                )}

                <button type="submit" style={{ width: '100%', background: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem', boxShadow: '0 2px 8px rgba(234,88,12,0.25)' }}>
                  <ShieldCheck size={16} /> Update Password
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '700',
  color: '#475569',
  marginBottom: '0.35rem'
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

export default SuperAdminSettings;
