import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  Sparkles,
  Search,
  Award,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Settings,
  Printer
} from 'lucide-react';

const ROLE_COLORS = {
  'Staff':       { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'Team Leader': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  'Manager':     { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  'HR':          { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  'Super Admin': { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' },
};

const thStyle = {
  padding: '1rem 1.25rem',
  fontSize: '0.78rem',
  fontWeight: '800',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '0.9rem',
  outline: 'none',
  background: '#F8FAFC',
  boxSizing: 'border-box'
};

const HRSalaries = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [salariesList, setSalariesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [incentiveFilter, setIncentiveFilter] = useState('All');

  // Modals
  const [structureUser, setStructureUser] = useState(null);
  const [payIncentiveUser, setPayIncentiveUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [payslipUser, setPayslipUser] = useState(null);

  // Incentive Form State inside Modal
  const [incentiveRateInput, setIncentiveRateInput] = useState(500);
  const [customIncentiveInput, setCustomIncentiveInput] = useState(0);
  const [salaryNotesInput, setSalaryNotesInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  // Payment Form States
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await API.get('/hr/salaries');
      setSalariesList(res.data || []);
    } catch (err) {
      console.error('Failed to load incentives data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Open Configure Incentive Structure Modal
  const handleOpenStructureModal = (u) => {
    setStructureUser(u);
    setIncentiveRateInput(u.incentiveRate || 500);
    setCustomIncentiveInput(u.customIncentive || 0);
    setSalaryNotesInput(u.salaryNotes || '');
    setMessage('');
  };

  // Save Incentive Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!structureUser) return;

    setUpdating(true);
    setMessage('');
    try {
      const payload = {
        incentiveRate: Number(incentiveRateInput),
        customIncentive: Number(customIncentiveInput),
        salaryNotes: salaryNotesInput
      };

      await API.put(`/hr/salaries/${structureUser._id}`, payload);

      setSalariesList(prev =>
        prev.map(u =>
          u._id === structureUser._id
            ? {
                ...u,
                ...payload,
                earnedIncentive: (u.resolvedCount * payload.incentiveRate) + payload.customIncentive
              }
            : u
        )
      );

      setMessage('Incentive structure updated successfully!');
      setTimeout(() => {
        setStructureUser(null);
      }, 800);
    } catch (err) {
      setMessage('Failed to save incentive configuration.');
    } finally {
      setUpdating(false);
    }
  };

  // Open Pay Incentive Modal
  const handleOpenPayIncentiveModal = (u) => {
    setPayIncentiveUser(u);
    setPayMethod(u.incentivePaymentMethod || 'Bank Transfer');
    setPayRef(u.incentivePaymentRef || `INC-${Date.now().toString().slice(-6)}`);
  };

  // Confirm Pay Incentive
  const handleConfirmPayIncentive = async (e) => {
    e.preventDefault();
    if (!payIncentiveUser) return;

    setPayProcessing(true);
    try {
      await API.put(`/hr/salaries/${payIncentiveUser._id}`, {
        incentiveStatus: 'Paid',
        incentivePaidDate: new Date(),
        incentivePaymentMethod: payMethod,
        incentivePaymentRef: payRef
      });

      setSalariesList(prev =>
        prev.map(u =>
          u._id === payIncentiveUser._id
            ? {
                ...u,
                incentiveStatus: 'Paid',
                incentivePaidDate: new Date().toISOString(),
                incentivePaymentMethod: payMethod,
                incentivePaymentRef: payRef
              }
            : u
        )
      );

      setPayIncentiveUser(null);
    } catch (err) {
      alert('Failed to update incentive payment status.');
    } finally {
      setPayProcessing(false);
    }
  };

  // Filter list
  const filteredUsers = salariesList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' ? true : u.role === roleFilter;
    const matchesIncentive = incentiveFilter === 'All' ? true : (u.incentiveStatus || 'Pending') === incentiveFilter;
    return matchesSearch && matchesRole && matchesIncentive;
  });

  // Calculate live statistics
  const totalIncentivesEarned = salariesList.reduce((sum, u) => sum + (u.earnedIncentive || 0), 0);
  const totalIncentivePaid = salariesList.filter(u => u.incentiveStatus === 'Paid').reduce((sum, u) => sum + (u.earnedIncentive || 0), 0);
  const pendingIncentives = totalIncentivesEarned - totalIncentivePaid;
  const totalResolversWithIncentives = salariesList.filter(u => u.resolvedCount > 0).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* DYNAMIC SIDEBAR */}
      {user?.role === 'Super Admin' ? (
        <SuperAdminSidebar activeTab="incentives" />
      ) : (
        <HRSidebar activeTab="incentives" />
      )}

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={28} style={{ color: '#10B981' }} /> Resolution Incentives Control Room
              </h1>
              <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Performance Reward Desk
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Track ticket resolution performance, configure rate per solved complaint, and manage incentive payouts for staff and team leaders.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={fetchSalaries} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Loader2 size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Sync DB Records
            </button>
          </div>
        </div>

        {/* METRICS OVERVIEW CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          {/* RESOLUTION INCENTIVES TOTAL */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>SOLVER INCENTIVES EARNED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                ₹{totalIncentivesEarned.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                Total performance rewards calculated
              </div>
            </div>
          </div>

          {/* INCENTIVES PAID OUT */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL INCENTIVES PAID</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                ₹{totalIncentivePaid.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: '600', marginTop: '2px' }}>
                Disbursed to solvers
              </div>
            </div>
          </div>

          {/* PENDING DISBURSAL */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>PENDING INCENTIVES DUE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                ₹{Math.max(0, pendingIncentives).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: '600', marginTop: '2px' }}>
                Awaiting approval / payment
              </div>
            </div>
          </div>

          {/* ACTIVE COMPLAINT SOLVERS */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ACTIVE TICKET SOLVERS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#EA580C', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {totalResolversWithIncentives} Eligible
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                Resolved live database tickets
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS TOOLBAR */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', flex: '1 1 280px', maxWidth: '360px' }}>
            <Search size={16} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search by employee name, ID, or dept..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontSize: '0.85rem', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* ROLE FILTER */}
            <div style={{ display: 'flex', gap: '0.25rem', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              {['All', 'Staff', 'Team Leader', 'Manager', 'HR'].map(role => (
                <button 
                  key={role} 
                  onClick={() => setRoleFilter(role)} 
                  style={{ 
                    background: roleFilter === role ? '#FFFFFF' : 'transparent', 
                    border: 'none', 
                    color: roleFilter === role ? '#0F172A' : '#64748B', 
                    fontWeight: roleFilter === role ? '700' : '500', 
                    fontSize: '0.78rem', 
                    padding: '0.4rem 0.75rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    boxShadow: roleFilter === role ? '0 1px 3px rgba(15,23,42,0.08)' : 'none' 
                  }}
                >
                  {role}{role !== 'All' ? 's' : ''}
                </button>
              ))}
            </div>

            {/* INCENTIVE STATUS FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
              <Sparkles size={14} color="#64748B" />
              <select 
                value={incentiveFilter} 
                onChange={e => setIncentiveFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Incentive Status</option>
                <option value="Paid">Incentive: Paid</option>
                <option value="Pending">Incentive: Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* PURE INCENTIVES TABLE */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '6rem', textAlign: 'center' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>Loading Incentive Records...</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle}>Employee / Role</th>
                    <th style={{ ...thStyle, background: '#ECFDF5' }}>Complaints Solved & Rate</th>
                    <th style={{ ...thStyle, background: '#ECFDF5' }}>Total Incentive Earned</th>
                    <th style={{ ...thStyle, background: '#ECFDF5' }}>Incentive Status & Action</th>
                    <th style={thStyle}>Manage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>No staff members match the selected filters.</td></tr>
                  ) : filteredUsers.map(u => {
                    const rolec = ROLE_COLORS[u.role] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
                    const isIncentivePaid = u.incentiveStatus === 'Paid';

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        
                        {/* EMPLOYEE INFO */}
                        <td style={{ padding: '1.2rem 1.25rem', minWidth: '220px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>{u.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                            <span style={{ color: '#2563EB', fontSize: '0.75rem', fontFamily: "'Outfit', sans-serif", fontWeight: '700' }}>{u.employeeId}</span>
                            <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>&bull; {u.department || 'General'}</span>
                          </div>
                          <div style={{ marginTop: '0.4rem' }}>
                            <span style={{ background: rolec.bg, color: rolec.color, border: `1px solid ${rolec.border}`, fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                              {u.role}
                            </span>
                          </div>
                        </td>

                        {/* COMPLAINTS SOLVED & INCENTIVE RATE */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#F0FDF4', minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: u.resolvedCount > 0 ? '#DCFCE7' : '#F1F5F9', color: u.resolvedCount > 0 ? '#15803D' : '#64748B', padding: '3px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>
                              <CheckCircle2 size={13} /> {u.resolvedCount || 0} Solved
                            </div>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: '700', marginTop: '4px' }}>
                            Rate: ₹{u.incentiveRate || 500} / ticket
                          </div>
                          {u.customIncentive > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                              + ₹{u.customIncentive.toLocaleString()} Custom Bonus
                            </div>
                          )}
                        </td>

                        {/* TOTAL INCENTIVE EARNED */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#F0FDF4', minWidth: '180px' }}>
                          <div style={{ fontSize: '1.1rem', color: u.earnedIncentive > 0 ? '#10B981' : '#94A3B8', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                            ₹{Number(u.earnedIncentive || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                            ({u.resolvedCount || 0} × ₹{u.incentiveRate || 500} {u.customIncentive ? `+ ₹${u.customIncentive}` : ''})
                          </div>
                        </td>

                        {/* INCENTIVE PAYMENT STATUS & ACTION */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#F0FDF4', minWidth: '200px' }}>
                          {u.earnedIncentive === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
                              No tickets solved yet
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: isIncentivePaid ? '#DCFCE7' : '#FEF3C7', 
                                color: isIncentivePaid ? '#15803D' : '#B45309', 
                                border: `1px solid ${isIncentivePaid ? '#86EFAC' : '#FDE68A'}`, 
                                fontSize: '0.72rem', 
                                fontWeight: '800', 
                                padding: '2px 8px', 
                                borderRadius: '12px' 
                              }}>
                                {isIncentivePaid ? <Check size={11} /> : <Clock size={11} />}
                                {isIncentivePaid ? 'Incentive Paid' : 'Incentive Due'}
                              </span>

                              {!isIncentivePaid ? (
                                <button 
                                  onClick={() => handleOpenPayIncentiveModal(u)}
                                  style={{ background: '#10B981', border: 'none', color: '#FFFFFF', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                                >
                                  <Sparkles size={14} /> Pay Incentive (₹{u.earnedIncentive.toLocaleString()})
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: '700' }}>
                                  ✓ Cleared via {u.incentivePaymentMethod || 'Bank Transfer'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* MANAGE INCENTIVE RATE & PAYSLIP */}
                        <td style={{ padding: '1.2rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => setPayslipUser(u)}
                              title="Generate & Print Monthly Payslip Statement"
                              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Printer size={14} /> Payslip
                            </button>
                            <button 
                              onClick={() => handleOpenStructureModal(u)} 
                              title="Configure Incentive Rate & Bonus"
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Settings size={14} /> Rate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CONFIGURE INCENTIVE STRUCTURE MODAL */}
      {structureUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '480px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#10B981" /> Configure Resolution Incentive
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                  {structureUser.name} &bull; {structureUser.employeeId} ({structureUser.role})
                </span>
              </div>
              <button onClick={() => setStructureUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* INCENTIVE RATE & CUSTOM BONUS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    Rate per Solved Ticket (₹) *
                  </label>
                  <input 
                    type="number" 
                    value={incentiveRateInput} 
                    onChange={e => setIncentiveRateInput(e.target.value)} 
                    placeholder="e.g. 500"
                    required
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    Extra Custom Bonus (₹)
                  </label>
                  <input 
                    type="number" 
                    value={customIncentiveInput} 
                    onChange={e => setCustomIncentiveInput(e.target.value)} 
                    placeholder="e.g. 1000"
                    style={inputStyle} 
                  />
                </div>
              </div>

              {/* LIVE INCENTIVE CALCULATION PREVIEW */}
              <div style={{ background: '#ECFDF5', padding: '0.9rem', borderRadius: '12px', border: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700' }}>TOTAL CALCULATED INCENTIVE</div>
                  <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                    {structureUser.resolvedCount || 0} Solved Tickets × ₹{incentiveRateInput || 0} {customIncentiveInput > 0 ? `+ ₹${customIncentiveInput}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{((structureUser.resolvedCount || 0) * Number(incentiveRateInput || 0) + Number(customIncentiveInput || 0)).toLocaleString()}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                  Incentive Remarks (Optional)
                </label>
                <input 
                  type="text" 
                  value={salaryNotesInput} 
                  onChange={e => setSalaryNotesInput(e.target.value)} 
                  placeholder="e.g. High resolution efficiency bonus"
                  style={inputStyle} 
                />
              </div>

              {message && (
                <div style={{ background: message.includes('success') ? '#DCFCE7' : '#FEE2E2', color: message.includes('success') ? '#15803D' : '#BE123C', border: `1px solid ${message.includes('success') ? '#BBF7D0' : '#FECDD3'}`, padding: '0.6rem 0.9rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {message.includes('success') ? <Check size={15} /> : <AlertCircle size={15} />}
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={updating} style={{ flex: 1, background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(16,185,129,0.25)' }}>
                  {updating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Save Incentive Rate
                </button>
                <button type="button" onClick={() => setStructureUser(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISBURSE INCENTIVE MODAL */}
      {payIncentiveUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '440px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#10B981" /> Disburse Incentive Payout
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                  {payIncentiveUser.name} &bull; {payIncentiveUser.employeeId}
                </span>
              </div>
              <button onClick={() => setPayIncentiveUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayIncentive} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '14px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700' }}>TOTAL INCENTIVE AMOUNT TO DISBURSE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                  ₹{payIncentiveUser.earnedIncentive.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                  Calculated from {payIncentiveUser.resolvedCount || 0} resolved tickets
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                  Payment Method
                </label>
                <select 
                  value={payMethod} 
                  onChange={e => setPayMethod(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="Payroll Addition">Payroll Addition</option>
                  <option value="Cash">Cash Handout</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                  Payment Reference / UTR Number
                </label>
                <input 
                  type="text" 
                  value={payRef} 
                  onChange={e => setPayRef(e.target.value)} 
                  placeholder="e.g. INC-981245"
                  required
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={payProcessing} style={{ flex: 1, background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: payProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {payProcessing && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Mark Incentive Paid
                </button>
                <button type="button" onClick={() => setPayIncentiveUser(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PAYSLIP MODAL */}
      {payslipUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '22px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }} id="printable-payslip">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>RESOLVEX ENTERPRISE SYSTEMS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600', marginTop: '2px' }}>Official Employee Monthly Payslip Statement</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                  CONFIDENTIAL
                </span>
              </div>
            </div>

            {/* EMPLOYEE INFO GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '700' }}>EMPLOYEE NAME</div>
                <div style={{ fontWeight: '800', color: '#0F172A' }}>{payslipUser.name}</div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '700', marginTop: '0.5rem' }}>EMPLOYEE ID</div>
                <div style={{ fontWeight: '700', color: '#2563EB' }}>{payslipUser.employeeId}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '700' }}>DEPARTMENT / ROLE</div>
                <div style={{ fontWeight: '700', color: '#0F172A' }}>{payslipUser.department || 'Operations'} &bull; {payslipUser.role}</div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '700', marginTop: '0.5rem' }}>PAYMENT STATUS</div>
                <div style={{ fontWeight: '700', color: payslipUser.incentiveStatus === 'Paid' ? '#16A34A' : '#D97706' }}>
                  {payslipUser.incentiveStatus === 'Paid' ? 'Processed & Released' : 'Pending Verification'}
                </div>
              </div>
            </div>

            {/* EARNINGS & DEDUCTIONS TABLE */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#FFFFFF' }}>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700' }}>EARNINGS COMPONENT</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: '700' }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#334155' }}>Basic Salary</td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700' }}>₹{(payslipUser.baseSalary || 45000).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#334155' }}>House Rent Allowance (HRA)</td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700' }}>₹{(payslipUser.hra || 18000).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#334155' }}>Special & Transport Allowances</td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700' }}>₹{(payslipUser.allowances || 7500).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#ECFDF5' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#047857', fontWeight: '700' }}>
                      Ticket Resolution Incentive ({payslipUser.resolvedCount || 0} tickets solved)
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                      + ₹{Number(payslipUser.earnedIncentive || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ background: '#FEF2F2', borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#B91C1C' }}>Standard Deductions (PF & Tax)</td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700', color: '#B91C1C' }}>
                      - ₹{(payslipUser.deductions || 3600).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', fontSize: '0.95rem', color: '#0F172A' }}>NET SALARY PAYABLE</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: '#10B981', fontFamily: "'Outfit', sans-serif" }}>
                      ₹{(
                        (payslipUser.baseSalary || 45000) + 
                        (payslipUser.hra || 18000) + 
                        (payslipUser.allowances || 7500) + 
                        Number(payslipUser.earnedIncentive || 0) - 
                        (payslipUser.deductions || 3600)
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* AUTHORIZATION FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px dashed #CBD5E1', fontSize: '0.75rem', color: '#64748B' }}>
              <div>
                <div>Generated by ResolveX HR Payroll System</div>
                <div style={{ fontWeight: '600' }}>Digital System Verification Hash: RX-PAY-{payslipUser._id ? payslipUser._id.slice(-6).toUpperCase() : 'SYS'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: '1rem', color: '#0F172A' }}>HR Manager</div>
                <div>Authorized Signatory</div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 2px 6px rgba(15,23,42,0.2)' }}
              >
                <Printer size={16} /> Print / Save Payslip PDF
              </button>
              <button 
                onClick={() => setPayslipUser(null)} 
                style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRSalaries;
