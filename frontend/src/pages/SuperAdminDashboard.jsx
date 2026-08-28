import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  ShieldCheck, 
  Building2, 
  Activity,
  UserCheck,
  RefreshCw,
  LogOut,
  CalendarDays,
  Check,
  XCircle,
  Users,
  DollarSign,
  ClipboardList,
  BarChart2,
  Settings,
  Bell,
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const SuperAdminDashboard = ({ initialTab = 'overview' }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set tab based on router state or prop
  const getTab = () => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return initialTab || 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTab());
  const [stats, setStats] = useState({
    complaints: { total: 0, resolved: 0, escalated: 0, pending: 0 },
    users: { teamLeaders: 0, staff: 0, departments: 0 }
  });
  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  useEffect(() => {
    setActiveTab(getTab());
  }, [initialTab, location.state]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await API.get('/leaves');
      setLeavesList(res.data || []);
    } catch (err) {
      console.error('Backend fetch error for leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleLeaveDecision = async (leaveId, decision) => {
    try {
      const res = await API.put(`/leaves/${leaveId}/status`, { status: decision });
      alert(res.data.message || `Leave ${decision} successfully!`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing leave decision.');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeaves();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      <SuperAdminSidebar activeTab={activeTab} />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {activeTab === 'leaves' ? 'System-Wide Leave Register' : 'Welcome back, Super Admin! 🛡️'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              {activeTab === 'leaves' ? 'Monitor and authorize leaves requests across all departments.' : 'Global System Overview'}
            </p>
          </div>

          <button onClick={() => { fetchStats(); fetchLeaves(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading || loadingLeaves ? 'spin-icon' : ''} /> Refresh Data
          </button>
        </div>

        {activeTab === 'leaves' ? (
          /* LEAVE APPROVALS TAB */
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                    <th style={{ padding: '1rem' }}>Employee</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Duration</th>
                    <th style={{ padding: '1rem' }}>Reason</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesList.map((leave, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{leave.employee?.name || 'Unknown'}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {leave.employee?.employeeId}</span>
                      </td>
                      <td style={{ padding: '1rem', color: '#334155', fontWeight: '700' }}>{leave.type}</td>
                      <td style={{ padding: '1rem', color: '#64748B' }}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748B' }}>{leave.reason}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          background: leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                          color: leave.status === 'Approved' ? '#10B981' : leave.status === 'Rejected' ? '#EF4444' : '#F59E0B', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800' 
                        }}>
                          {leave.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {leave.status.startsWith('Pending') && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleLeaveDecision(leave._id, 'Approved')}
                              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(leave._id, 'Rejected')}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leavesList.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No leaves requested.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* STANDARD OVERVIEW METRICS */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1.4rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>TOTAL COMPLAINTS</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2563EB', marginTop: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>{stats.complaints.total}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.4rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>RESOLVED TICKETS</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginTop: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>{stats.complaints.resolved}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.4rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>ESCALATED TICKETS</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444', marginTop: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>{stats.complaints.escalated}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.4rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>TOTAL DEPARTMENTS</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>{stats.users.departments}</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
