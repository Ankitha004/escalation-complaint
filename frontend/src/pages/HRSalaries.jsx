import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import {
  DollarSign,
  Search,
  Edit3,
  Award,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
  ClipboardList,
  Star,
  CheckCircle2,
  Clock,
  Lightbulb,
  Lock,
  BarChart3,
  CreditCard,
  Printer,
  FileText,
  Filter,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Building,
  UserCheck,
  Layers,
  Settings,
  Sliders,
  PlusCircle,
  ChevronRight,
  Receipt
} from 'lucide-react';

const ROLE_COLORS = {
  'Staff':       { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'Team Leader': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  'Manager':     { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  'HR':          { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  'Super Admin': { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' },
};

const HRSalaries = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [salariesList, setSalariesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [salaryFilter, setSalaryFilter] = useState('All');
  const [incentiveFilter, setIncentiveFilter] = useState('All');

  // Modals
  const [structureUser, setStructureUser] = useState(null);
  const [paySalaryUser, setPaySalaryUser] = useState(null);
  const [payIncentiveUser, setPayIncentiveUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [payslipUser, setPayslipUser] = useState(null);

  // Form State inside Salary Structure Modal
  const [baseSalaryInput, setBaseSalaryInput] = useState(0);
  const [hraInput, setHraInput] = useState(0);
  const [allowancesInput, setAllowancesInput] = useState(0);
  const [deductionsInput, setDeductionsInput] = useState(0);
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
      console.error('Failed to load salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Open Configure Salary Structure Modal
  const handleOpenStructureModal = (u) => {
    setStructureUser(u);
    setBaseSalaryInput(u.baseSalary || 0);
    setHraInput(u.hra || 0);
    setAllowancesInput(u.allowances || 0);
    setDeductionsInput(u.deductions || 0);
    setIncentiveRateInput(u.incentiveRate || 500);
    setCustomIncentiveInput(u.customIncentive || 0);
    setSalaryNotesInput(u.salaryNotes || '');
    setMessage('');
  };

  // Save Salary Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!structureUser) return;

    setUpdating(true);
    setMessage('');
    try {
      const payload = {
        baseSalary: Number(baseSalaryInput),
        hra: Number(hraInput),
        allowances: Number(allowancesInput),
        deductions: Number(deductionsInput),
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
                netBaseSalary: Math.max(0, payload.baseSalary + payload.hra + payload.allowances - payload.deductions),
                isSalaryConfigured: (payload.baseSalary > 0 || payload.hra > 0 || payload.allowances > 0),
                earnedIncentive: (u.resolvedCount * payload.incentiveRate) + payload.customIncentive
              }
            : u
        )
      );

      setMessage('Salary & incentive structure saved successfully!');
      setTimeout(() => {
        setStructureUser(null);
      }, 800);
    } catch (err) {
      setMessage('Failed to save salary configuration.');
    } finally {
      setUpdating(false);
    }
  };

  // Open Pay Base Salary Modal
  const handleOpenPaySalaryModal = (u) => {
    setPaySalaryUser(u);
    setPayMethod(u.salaryPaymentMethod || 'Bank Transfer');
    setPayRef(u.salaryPaymentRef || `SAL-${Date.now().toString().slice(-6)}`);
  };

  // Confirm Pay Base Salary
  const handleConfirmPaySalary = async (e) => {
    e.preventDefault();
    if (!paySalaryUser) return;

    setPayProcessing(true);
    try {
      await API.put(`/hr/salaries/${paySalaryUser._id}`, {
        salaryStatus: 'Paid',
        salaryPaidDate: new Date(),
        salaryPaymentMethod: payMethod,
        salaryPaymentRef: payRef
      });

      setSalariesList(prev =>
        prev.map(u =>
          u._id === paySalaryUser._id
            ? {
                ...u,
                salaryStatus: 'Paid',
                salaryPaidDate: new Date().toISOString(),
                salaryPaymentMethod: payMethod,
                salaryPaymentRef: payRef
              }
            : u
        )
      );

      setPaySalaryUser(null);
    } catch (err) {
      alert('Failed to update salary payment status.');
    } finally {
      setPayProcessing(false);
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
    const matchesSalary = salaryFilter === 'All' ? true : (u.salaryStatus || 'Pending') === salaryFilter;
    const matchesIncentive = incentiveFilter === 'All' ? true : (u.incentiveStatus || 'Pending') === incentiveFilter;
    return matchesSearch && matchesRole && matchesSalary && matchesIncentive;
  });

  // Calculate live statistics
  const totalBasePayLiability = salariesList.reduce((sum, u) => sum + (u.netBaseSalary || 0), 0);
  const totalIncentivesEarned = salariesList.reduce((sum, u) => sum + (u.earnedIncentive || 0), 0);
  const totalSalaryPaid = salariesList.filter(u => u.salaryStatus === 'Paid').reduce((sum, u) => sum + (u.netBaseSalary || 0), 0);
  const totalIncentivePaid = salariesList.filter(u => u.incentiveStatus === 'Paid').reduce((sum, u) => sum + (u.earnedIncentive || 0), 0);
  const configuredCount = salariesList.filter(u => u.isSalaryConfigured).length;
  const totalResolversWithIncentives = salariesList.filter(u => u.resolvedCount > 0).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* DYNAMIC SIDEBAR */}
      {user?.role === 'Super Admin' ? (
        <SuperAdminSidebar activeTab="salaries" />
      ) : (
        <HRSidebar activeTab="salaries" />
      )}

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Salary & Resolution Incentives Control Room
              </h1>
              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                Strict Database Values
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Configure base salaries, set individual allowances, track genuine ticket solvers, and disburse salary & incentive payouts separately.
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
          
          {/* BASE SALARY TOTAL */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>CONFIGURED SALARY PAYROLL</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                ₹{totalBasePayLiability.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>
                ₹{totalSalaryPaid.toLocaleString()} paid this cycle
              </div>
            </div>
          </div>

          {/* RESOLUTION INCENTIVES TOTAL */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>SOLVER INCENTIVES EARNED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                + ₹{totalIncentivesEarned.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                ₹{totalIncentivePaid.toLocaleString()} paid out
              </div>
            </div>
          </div>

          {/* CONFIGURATION COVERAGE */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sliders size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>SALARY CONFIG STATUS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#7C3AED', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                {configuredCount} / {salariesList.length} Set
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                {salariesList.length - configuredCount} pending configuration
              </div>
            </div>
          </div>

          {/* ACTIVE COMPLAINT SOLVERS */}
          <div style={{ background: '#FFFFFF', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={24}/>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>ACTIVE SOLVERS</div>
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

            {/* SALARY STATUS FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
              <CreditCard size={14} color="#64748B" />
              <select 
                value={salaryFilter} 
                onChange={e => setSalaryFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                <option value="All">All Salary Status</option>
                <option value="Paid">Salary: Paid</option>
                <option value="Pending">Salary: Pending</option>
              </select>
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

        {/* DUAL TABLE: SALARY STRUCTURE & RESOLUTION INCENTIVES */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '6rem', textAlign: 'center' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: '700', color: '#0F172A' }}>Loading Database Records...</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle}>Employee / Role</th>
                    <th style={{ ...thStyle, background: '#F1F5F9' }}>Monthly Salary Structure</th>
                    <th style={{ ...thStyle, background: '#F1F5F9' }}>Salary Status & Action</th>
                    <th style={{ ...thStyle, background: '#ECFDF5' }}>Complaints Solved & Rate</th>
                    <th style={{ ...thStyle, background: '#ECFDF5' }}>Incentive Status & Action</th>
                    <th style={thStyle}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>No staff members match the selected filters.</td></tr>
                  ) : filteredUsers.map(u => {
                    const rolec = ROLE_COLORS[u.role] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
                    const isSalaryPaid = u.salaryStatus === 'Paid';
                    const isIncentivePaid = u.incentiveStatus === 'Paid';

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        
                        {/* EMPLOYEE INFO */}
                        <td style={{ padding: '1.2rem 1.25rem', minWidth: '180px' }}>
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

                        {/* SALARY STRUCTURE (BASE, HRA, ALLOWANCES, DEDUCTIONS) */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#FAFAFA', minWidth: '220px' }}>
                          {u.isSalaryConfigured ? (
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                                ₹{u.netBaseSalary.toLocaleString()}
                                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '500', marginLeft: '4px' }}>Net Base</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <span>Base: ₹{u.baseSalary.toLocaleString()}</span>
                                {u.hra > 0 && <span>+ HRA: ₹{u.hra.toLocaleString()}</span>}
                                {u.allowances > 0 && <span>+ Allw: ₹{u.allowances.toLocaleString()}</span>}
                                {u.deductions > 0 && <span style={{ color: '#DC2626' }}>- Ded: ₹{u.deductions.toLocaleString()}</span>}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <AlertCircle size={12} /> Not Configured
                              </span>
                              <button 
                                onClick={() => handleOpenStructureModal(u)}
                                style={{ display: 'block', background: 'transparent', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', marginTop: '4px', padding: 0 }}
                              >
                                + Set Base Salary
                              </button>
                            </div>
                          )}
                        </td>

                        {/* SALARY PAYMENT STATUS & ACTION */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#FAFAFA', minWidth: '180px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              background: isSalaryPaid ? '#DCFCE7' : '#F1F5F9', 
                              color: isSalaryPaid ? '#15803D' : '#64748B', 
                              border: `1px solid ${isSalaryPaid ? '#86EFAC' : '#E2E8F0'}`, 
                              fontSize: '0.72rem', 
                              fontWeight: '800', 
                              padding: '2px 8px', 
                              borderRadius: '12px' 
                            }}>
                              {isSalaryPaid ? <Check size={11} /> : <Clock size={11} />}
                              {isSalaryPaid ? 'Salary Paid' : 'Salary Pending'}
                            </span>

                            {isSalaryPaid && u.salaryPaidDate && (
                              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                                Paid {new Date(u.salaryPaidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}

                            {!isSalaryPaid ? (
                              <button 
                                onClick={() => handleOpenPaySalaryModal(u)}
                                disabled={!u.isSalaryConfigured}
                                style={{ background: u.isSalaryConfigured ? '#2563EB' : '#94A3B8', border: 'none', color: '#FFFFFF', padding: '0.4rem 0.75rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: '700', cursor: u.isSalaryConfigured ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <CreditCard size={12} /> Pay Base Salary
                              </button>
                            ) : (
                              <button 
                                onClick={() => setPayslipUser(u)}
                                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '0.35rem 0.65rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Receipt size={12} /> View Payslip
                              </button>
                            )}
                          </div>
                        </td>

                        {/* COMPLAINTS SOLVED & INCENTIVE RATE */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#F0FDF4', minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: u.resolvedCount > 0 ? '#DCFCE7' : '#F1F5F9', color: u.resolvedCount > 0 ? '#15803D' : '#64748B', padding: '3px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>
                              <CheckCircle2 size={13} /> {u.resolvedCount || 0} Solved
                            </div>
                            {u.resolvedCount > 0 && (
                              <button 
                                onClick={() => setHistoryUser(u)} 
                                style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                              >
                                View Tickets
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '700', marginTop: '4px' }}>
                            Rate: ₹{u.incentiveRate || 500} / ticket
                          </div>
                          <div style={{ fontSize: '0.9rem', color: u.earnedIncentive > 0 ? '#10B981' : '#94A3B8', fontWeight: '800', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                            Earned: + ₹{Number(u.earnedIncentive || 0).toLocaleString()}
                          </div>
                        </td>

                        {/* INCENTIVE PAYMENT STATUS & ACTION */}
                        <td style={{ padding: '1.2rem 1.25rem', background: '#F0FDF4', minWidth: '180px' }}>
                          {u.earnedIncentive === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
                              No tickets solved
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
                                  style={{ background: '#10B981', border: 'none', color: '#FFFFFF', padding: '0.4rem 0.75rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                                >
                                  <Sparkles size={12} /> Pay ₹{u.earnedIncentive.toLocaleString()}
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: '600' }}>
                                  ✓ Cleared ({u.incentivePaymentMethod || 'Bank'})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* MANAGE STRUCTURE & HISTORY */}
                        <td style={{ padding: '1.2rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              onClick={() => handleOpenStructureModal(u)} 
                              title="Set or Edit Full Salary & Incentive Structure"
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Settings size={13} /> Set Structure
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

      {/* CONFIGURE SALARY STRUCTURE MODAL */}
      {structureUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '520px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Configure Salary Structure
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700' }}>
                  {structureUser.name} &bull; {structureUser.employeeId} ({structureUser.role})
                </span>
              </div>
              <button onClick={() => setStructureUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* BASE SALARY & HRA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    Base Monthly Salary (₹) *
                  </label>
                  <input 
                    type="number" 
                    value={baseSalaryInput} 
                    onChange={e => setBaseSalaryInput(e.target.value)} 
                    placeholder="e.g. 35000"
                    required 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    HRA Allowance (₹)
                  </label>
                  <input 
                    type="number" 
                    value={hraInput} 
                    onChange={e => setHraInput(e.target.value)} 
                    placeholder="e.g. 5000"
                    style={inputStyle} 
                  />
                </div>
              </div>

              {/* SPECIAL ALLOWANCES & DEDUCTIONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    Special Allowances (₹)
                  </label>
                  <input 
                    type="number" 
                    value={allowancesInput} 
                    onChange={e => setAllowancesInput(e.target.value)} 
                    placeholder="e.g. 2500"
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                    PF / Tax Deductions (₹)
                  </label>
                  <input 
                    type="number" 
                    value={deductionsInput} 
                    onChange={e => setDeductionsInput(e.target.value)} 
                    placeholder="e.g. 1800"
                    style={inputStyle} 
                  />
                </div>
              </div>

              {/* INCENTIVE RATE PER COMPLAINT */}
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16A34A', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} /> Resolution Incentive Formula (Separate from Salary)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                      Rate per Solved Ticket (₹)
                    </label>
                    <input 
                      type="number" 
                      value={incentiveRateInput} 
                      onChange={e => setIncentiveRateInput(e.target.value)} 
                      placeholder="e.g. 500"
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
              </div>

              {/* LIVE NET CALCULATION PREVIEW */}
              <div style={{ background: '#F8FAFC', padding: '0.9rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>CALCULATED NET MONTHLY SALARY</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Base + HRA + Allowances - Deductions</div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{Math.max(0, Number(baseSalaryInput || 0) + Number(hraInput || 0) + Number(allowancesInput || 0) - Number(deductionsInput || 0)).toLocaleString()}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
                  Payroll / Contract Remarks (Optional)
                </label>
                <input 
                  type="text" 
                  value={salaryNotesInput} 
                  onChange={e => setSalaryNotesInput(e.target.value)} 
                  placeholder="e.g. Revised standard band for Senior Staff"
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
                <button type="submit" disabled={updating} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {updating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Save Structure to Database
                </button>
                <button type="button" onClick={() => setStructureUser(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISBURSE BASE SALARY MODAL */}
      {paySalaryUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '440px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Disburse Base Salary</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>Paying regular monthly salary to {paySalaryUser.name}</p>
              </div>
              <button onClick={() => setPaySalaryUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#64748B' }}>
                <span>Base Salary:</span>
                <strong style={{ color: '#0F172A' }}>₹{paySalaryUser.baseSalary.toLocaleString()}</strong>
              </div>
              {paySalaryUser.hra > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#64748B' }}>
                  <span>HRA:</span>
                  <strong style={{ color: '#0F172A' }}>+ ₹{paySalaryUser.hra.toLocaleString()}</strong>
                </div>
              )}
              {paySalaryUser.allowances > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#64748B' }}>
                  <span>Allowances:</span>
                  <strong style={{ color: '#0F172A' }}>+ ₹{paySalaryUser.allowances.toLocaleString()}</strong>
                </div>
              )}
              {paySalaryUser.deductions > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#DC2626' }}>
                  <span>Deductions:</span>
                  <strong>- ₹{paySalaryUser.deductions.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '0.6rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>Net Salary Disbursable:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{paySalaryUser.netBaseSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPaySalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Payment Channel *</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={inputStyle}>
                  <option value="Bank Transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI / Instant">UPI Payment (GPay / PhonePe / Paytm)</option>
                  <option value="Corporate Cheque">Corporate Bank Cheque</option>
                  <option value="Cash Voucher">Cash / Direct Disbursement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Transaction / UTR Reference</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. UTR-98213876" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={payProcessing} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: payProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {payProcessing && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Mark Salary as Paid
                </button>
                <button type="button" onClick={() => setPaySalaryUser(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISBURSE RESOLUTION INCENTIVE MODAL */}
      {payIncentiveUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '22px', maxWidth: '440px', width: '100%', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Disburse Solver Incentive</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>Paying complaint resolution incentive to {payIncentiveUser.name}</p>
              </div>
              <button onClick={() => setPayIncentiveUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '14px', border: '1px solid #A7F3D0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#065F46' }}>
                <span>Solved Tickets:</span>
                <strong>{payIncentiveUser.resolvedCount} complaints</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#065F46' }}>
                <span>Rate per Ticket:</span>
                <strong>₹{payIncentiveUser.incentiveRate || 500}</strong>
              </div>
              {payIncentiveUser.customIncentive > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#065F46' }}>
                  <span>Custom Bonus:</span>
                  <strong>+ ₹{payIncentiveUser.customIncentive.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #6EE7B7', paddingTop: '0.6rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#065F46' }}>Total Incentive Due:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{payIncentiveUser.earnedIncentive.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayIncentive} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Payment Channel *</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={inputStyle}>
                  <option value="Bank Transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI / Instant">UPI Payment (GPay / PhonePe / Paytm)</option>
                  <option value="Cash Voucher">Cash / Instant Bonus Voucher</option>
                  <option value="Corporate Cheque">Corporate Bank Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>Transaction / UTR Reference</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. INC-UTR-43289" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={payProcessing} style={{ flex: 1, background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.88rem', cursor: payProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                  {payProcessing && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Mark Incentive as Paid
                </button>
                <button type="button" onClick={() => setPayIncentiveUser(null)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION HISTORY TICKETS MODAL */}
      {historyUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '680px', width: '100%', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Resolution Log — {historyUser.name}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  {historyUser.employeeId} &bull; {historyUser.role} &bull; {historyUser.department || 'General'}
                </p>
              </div>
              <button onClick={() => setHistoryUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ padding: '1rem 1.75rem', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Genuine Tickets Solved</div>
                <div style={{ fontWeight: '800', color: '#16A34A', fontSize: '1.1rem' }}>{historyUser.resolvedCount || 0} tickets</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Rate / Ticket</div>
                <div style={{ fontWeight: '800', color: '#2563EB', fontSize: '1.1rem' }}>₹{historyUser.incentiveRate || 500}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Earned Incentive</div>
                <div style={{ fontWeight: '800', color: '#10B981', fontSize: '1.1rem' }}>₹{Number(historyUser.earnedIncentive || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.75rem' }}>
              {!historyUser.resolvedComplaints || historyUser.resolvedComplaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
                  <BarChart3 size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
                  <div style={{ fontWeight: '600' }}>No tickets resolved by this user yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {historyUser.resolvedComplaints.map((c, i) => (
                    <div key={i} style={{ background: '#FAFAFA', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: '800', color: '#2563EB' }}>{c.complaintId}</span>
                          <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', borderRadius: '6px' }}>{c.category}</span>
                          <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.65rem', fontWeight: '600', padding: '1px 6px', borderRadius: '6px' }}>{c.priority || 'Medium'}</span>
                        </div>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.88rem' }}>{c.subject}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.72rem', color: '#94A3B8' }}>
                          <Clock size={12} />
                          Resolved on: {c.resolvedDate ? new Date(c.resolvedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: '8px' }}>
                          {c.status}
                        </span>
                        {c.feedbackRating ? (
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#F59E0B', marginRight: '3px' }}>★ {c.feedbackRating}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Unrated</span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#16A34A' }}>+ ₹{historyUser.incentiveRate || 500}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #F1F5F9', background: '#FFFFFF', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setHistoryUser(null)} style={{ padding: '0.6rem 1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED PAYSLIP MODAL */}
      {payslipUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={24} color="#2563EB" />
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>COMPLAINT RESOLUTION SYSTEM</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>OFFICIAL SALARY & INCENTIVE DISBURSEMENT RECEIPT</div>
              </div>
              <button onClick={() => setPayslipUser(null)} style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', fontSize: '0.82rem', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>EMPLOYEE NAME</div>
                <div style={{ fontWeight: '800', color: '#0F172A' }}>{payslipUser.name}</div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: '4px' }}>ID: {payslipUser.employeeId}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '700' }}>ROLE / DEPT</div>
                <div style={{ fontWeight: '800', color: '#0F172A' }}>{payslipUser.role}</div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: '4px' }}>Dept: {payslipUser.department || 'General'}</div>
              </div>
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '2px dashed #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#475569' }}>Base Monthly Salary</span>
                <strong style={{ color: '#0F172A' }}>₹{payslipUser.baseSalary.toLocaleString()}</strong>
              </div>
              {payslipUser.hra > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569' }}>HRA Allowance</span>
                  <strong style={{ color: '#0F172A' }}>+ ₹{payslipUser.hra.toLocaleString()}</strong>
                </div>
              )}
              {payslipUser.allowances > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569' }}>Special Allowances</span>
                  <strong style={{ color: '#0F172A' }}>+ ₹{payslipUser.allowances.toLocaleString()}</strong>
                </div>
              )}
              {payslipUser.deductions > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#DC2626' }}>PF & Statutory Deductions</span>
                  <strong style={{ color: '#DC2626' }}>- ₹{payslipUser.deductions.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem' }}>
                <span style={{ color: '#16A34A', fontWeight: '700' }}>Resolver Incentive ({payslipUser.resolvedCount || 0} tickets solved)</span>
                <strong style={{ color: '#10B981' }}>+ ₹{Number(payslipUser.earnedIncentive || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A' }}>NET DISBURSED PAY</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', sans-serif" }}>
                ₹{(Number(payslipUser.netBaseSalary || 0) + Number(payslipUser.earnedIncentive || 0)).toLocaleString()}
              </span>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>Ref: <strong>{payslipUser.salaryPaymentRef || 'TXN-DIRECT'}</strong></span> &bull; <span>{payslipUser.salaryPaymentMethod || 'Bank Transfer'}</span>
              </div>
              <span style={{ color: '#16A34A', fontWeight: '700' }}>✓ VERIFIED DISBURSEMENT</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Printer size={15} /> Print / Save PDF Receipt
              </button>
              <button onClick={() => setPayslipUser(null)} style={{ padding: '0.75rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '1.1rem 1.25rem',
  fontSize: '0.72rem',
  fontWeight: '800',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap'
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

export default HRSalaries;
