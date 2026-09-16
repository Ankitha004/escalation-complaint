import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  Menu,
  CalendarDays,
  Bell,
  ChevronDown,
  RefreshCw, 
  Inbox, 
  Check, 
  XCircle 
} from 'lucide-react';

const LeaveApprovalsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [leavesList, setLeavesList] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ pendingRegistrations: 0 });

  const fetchStats = async () => {
    try {
      const statsRes = await API.get('/hr/stats');
      setDashboardStats({
        pendingRegistrations: statsRes.data?.pendingRegistrations || 0
      });
    } catch (e) {}
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await API.get('/leaves');
      setLeavesList(res.data || []);
    } catch (err) {
      console.warn('Leaves fetch notice:', err);
      setLeavesList([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeaves();
  }, []);

  const handleLeaveDecision = async (leaveId, decision) => {
    try {
      await API.put(`/leaves/${leaveId}/status`, { status: decision });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing leave decision.');
    }
  };

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
        <SuperAdminSidebar activeTab="leaves" />
      ) : (
        <HRSidebar activeTab="leaves" badgeCount={dashboardStats.pendingRegistrations} />
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
              {dashboardStats.pendingRegistrations > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: '800', padding: '2px 5px', borderRadius: '50%', border: '2px solid #FFF' }}>
                  {dashboardStats.pendingRegistrations}
                </span>
              )}
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

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif" }}>
                  Leave Approval & Quota Center
                </h1>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                  Track leave quotas, balance allocations, and employee leave requests.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Filter:</span>
                  <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', cursor: 'pointer' }}>
                    <option value="all">All Departments</option>
                  </select>
                </div>
                <button onClick={fetchLeaves} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', color: '#FFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <RefreshCw size={15} className={loadingLeaves ? 'spin-icon' : ''} /> Refresh Data
                </button>
              </div>
            </div>

            {/* LEAVE QUOTA ALLOCATION CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Earned Leave (EL) Quota</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>6 Days / Year</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Annual Standard Allocation</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medical Leave Quota</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>6 Days / Year</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Medical & Health Allocation</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Annual Limit</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>12 Days Total</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Strict Yearly Policy Cap</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Leaves Pending</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7C3AED', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                  {leavesList.filter(l => l.status?.startsWith('Pending')).length} Requests
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Awaiting Action</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '1.25rem' }}>Employee</th>
                      <th style={{ padding: '1.25rem' }}>Type</th>
                      <th style={{ padding: '1.25rem' }}>Duration</th>
                      <th style={{ padding: '1.25rem' }}>Reason</th>
                      <th style={{ padding: '1.25rem' }}>Status</th>
                      <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavesList.map((leave, i) => (
                      <tr key={leave._id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{leave.employee?.name || 'Unknown'}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {leave.employee?.employeeId}</span>
                        </td>
                        <td style={{ padding: '1.25rem', color: '#334155', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{leave.type}</span>
                            {leave.salaryDeductionAmount > 0 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 7px', borderRadius: '6px' }}>
                                -₹{leave.salaryDeductionAmount.toLocaleString('en-IN')} ({leave.deductionDays}d deduct)
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem', color: '#475569' }}>
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1.25rem', color: '#475569' }}>{leave.reason}</td>
                        <td style={{ padding: '1.25rem' }}>
                          {leave.status === 'Approved' ? (
                            <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>Approved</span>
                          ) : leave.status === 'Rejected' ? (
                            <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>Rejected</span>
                          ) : (
                            <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>Pending Approval</span>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                          {leave.status.startsWith('Pending') ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleLeaveDecision(leave._id, 'Approved')}
                                style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => handleLeaveDecision(leave._id, 'Rejected')}
                                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '600' }}>Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {leavesList.length === 0 && !loadingLeaves && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748B' }}>
                          <Inbox size={32} style={{ color: '#94A3B8', margin: '0 auto 0.5rem auto' }} />
                          <p style={{ margin: 0 }}>No leave requests found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeaveApprovalsPage;
