import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import API from '../services/api';
import { 
  Clock, 
  Users, 
  CalendarDays, 
  Search, 
  RefreshCw, 
  Filter,
  CheckCircle2,
  LogOut,
  LogIn,
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';

const HRAttendancePage = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'history'
  const [attendanceData, setAttendanceData] = useState({ stats: {}, members: [] });
  const [historicalLogs, setHistoricalLogs] = useState([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance/team');
      setAttendanceData(res.data || { stats: {}, members: [] });
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalLogs = async () => {
    setLoading(true);
    try {
      const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : '';
      const res = await API.get(`/attendance/all${formattedDate ? `?date=${formattedDate}` : ''}`);
      setHistoricalLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching historical logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'today') {
      fetchTodayAttendance();
    } else {
      fetchHistoricalLogs();
    }
  }, [viewMode, selectedDate]);

  // Filtering for Today's View
  const filteredTodayMembers = (attendanceData?.members || []).filter((item) => {
    const name = item.employee?.name || '';
    const empId = item.employee?.employeeId || '';
    const email = item.employee?.email || '';
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter;
    const matchesRole = roleFilter === 'All Roles' || item.employee?.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Filtering for History View
  const filteredHistoryLogs = (historicalLogs || []).filter((log) => {
    const name = log.employee?.name || '';
    const empId = log.employee?.employeeId || '';
    const email = log.employee?.email || '';
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || log.status === statusFilter;
    const matchesRole = roleFilter === 'All Roles' || log.employee?.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleExportCsv = async () => {
    try {
      const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : '';
      const response = await API.get(`/attendance/export${formattedDate ? `?date=${formattedDate}` : ''}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${selectedDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    }
  };

  const isSuperAdmin = user?.role === 'Super Admin';

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {isSuperAdmin ? (
        <SuperAdminSidebar activeTab="attendance" />
      ) : (
        <HRSidebar activeTab="attendance" />
      )}

      <main className="dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                <Clock size={22} color="#FFFFFF" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Employee Attendance Directory
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  Real-time clock-in monitoring, login timestamps, and employee attendance logs.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#E2E8F0', borderRadius: '10px', padding: '4px', display: 'flex' }}>
              <button
                onClick={() => setViewMode('today')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'today' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'today' ? '#0F172A' : '#64748B',
                  fontWeight: viewMode === 'today' ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'today' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Today's Live Status
              </button>
              <button
                onClick={() => setViewMode('history')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'history' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'history' ? '#0F172A' : '#64748B',
                  fontWeight: viewMode === 'history' ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Historical Logs
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #16A34A', background: '#16A34A', color: '#FFFFFF', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
            >
              Export CSV Report
            </button>

            <button
              onClick={viewMode === 'today' ? fetchTodayAttendance : fetchHistoricalLogs}
              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        {viewMode === 'today' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>TOTAL EMPLOYEES</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                {attendanceData?.stats?.totalMembers || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #DCFCE7', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#166534', letterSpacing: '0.5px' }}>CLOCKED IN (PRESENT)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#15803D', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                {attendanceData?.stats?.presentCount || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #FEF3C7', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#92400E', letterSpacing: '0.5px' }}>NOT CLOCKED IN</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#D97706', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                {attendanceData?.stats?.notClockedInCount || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', letterSpacing: '0.5px' }}>CLOCKED OUT</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#334155', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                {attendanceData?.stats?.clockedOutCount || 0}
              </div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search employee name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', outline: 'none', background: '#F8FAFC' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {viewMode === 'history' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B' }}>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', background: '#F8FAFC' }}
                />
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', background: '#F8FAFC', color: '#334155', fontWeight: '600' }}
            >
              <option value="All Status">All Status</option>
              <option value="Present">Present</option>
              <option value="Not Clocked In">Not Clocked In</option>
              <option value="Late">Late</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', background: '#F8FAFC', color: '#334155', fontWeight: '600' }}
            >
              <option value="All Roles">All Roles</option>
              <option value="Staff">Staff</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
            </select>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {viewMode === 'today' ? "Today's Employee Attendance Logs" : 'Historical Attendance Log Details'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
              Showing {viewMode === 'today' ? filteredTodayMembers.length : filteredHistoryLogs.length} records
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Employee</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Role & Department</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Total Attended</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Login Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Clock-In Time</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Clock-Out Time</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                      Loading attendance logs...
                    </td>
                  </tr>
                ) : viewMode === 'today' ? (
                  filteredTodayMembers.length > 0 ? (
                    filteredTodayMembers.map((item) => (
                      <tr key={item.employee._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.isClockedIn ? '#16A34A' : '#94A3B8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>
                              {item.employee?.name ? item.employee.name.substring(0, 2).toUpperCase() : 'EM'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.employee?.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: <strong style={{ color: '#2563EB' }}>{item.employee?.employeeId}</strong> | {item.employee?.email}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>{item.employee?.role}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.employee?.department?.name || item.employee?.department || 'General'}</div>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#F0FDF4', color: '#166534', border: '1px solid #DCFCE7', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                            <UserCheck size={12} /> {item.totalDaysAttended || 0} Days Present
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontWeight: '600' }}>
                          {item.date}
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', color: item.isClockedIn ? '#15803D' : '#94A3B8', background: item.isClockedIn ? '#F0FDF4' : '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${item.isClockedIn ? '#DCFCE7' : '#E2E8F0'}` }}>
                            <LogIn size={13} /> {item.clockIn}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', color: item.isClockedOut ? '#334155' : '#94A3B8', background: item.isClockedOut ? '#F1F5F9' : '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <LogOut size={13} /> {item.clockOut}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.72rem', 
                            fontWeight: '800',
                            background: item.isClockedIn ? '#DCFCE7' : '#FEF3C7',
                            color: item.isClockedIn ? '#15803D' : '#D97706'
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                        No attendance records found matching your filters.
                      </td>
                    </tr>
                  )
                ) : (
                  filteredHistoryLogs.length > 0 ? (
                    filteredHistoryLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>
                              {log.employee?.name ? log.employee.name.substring(0, 2).toUpperCase() : 'EM'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>{log.employee?.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {log.employee?.employeeId}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>{log.employee?.role}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{log.employee?.department?.name || log.employee?.department || 'N/A'}</div>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#F0FDF4', color: '#166534', border: '1px solid #DCFCE7', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                            <UserCheck size={12} /> {log.totalDaysAttended || 0} Days Present
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontWeight: '600' }}>
                          {log.date}
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem', color: '#15803D', fontWeight: '700' }}>
                          {log.clockIn}
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontWeight: '700' }}>
                          {log.clockOut}
                        </td>

                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.72rem', 
                            fontWeight: '800',
                            background: log.status === 'Present' ? '#DCFCE7' : '#FEF3C7',
                            color: log.status === 'Present' ? '#15803D' : '#D97706'
                          }}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                        No historical attendance logs found.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default HRAttendancePage;
