import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HRSidebar from '../components/HRSidebar';
import API from '../services/api';
import { 
  Users, 
  FileText,
  UserCog,
  Building2,
  Menu,
  Bell,
  ChevronDown,
  CalendarDays,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Clock,
  UserCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const HRDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // States for Overview
  const [dashboardStats, setDashboardStats] = useState({
    pendingRegistrations: 0,
    totalStaff: 0,
    totalTeamLeaders: 0,
    totalDepartments: 0,
  });
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [departmentData, setDepartmentData] = useState({});
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState({ stats: {}, members: [] });
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, regsRes, staffRes, attRes] = await Promise.all([
        API.get('/hr/stats').catch(() => ({ data: {} })),
        API.get('/hr/registrations?status=pending').catch(() => ({ data: [] })),
        API.get('/hr/registrations?status=active').catch(() => ({ data: [] })),
        API.get('/attendance/team').catch(() => ({ data: { stats: {}, members: [] } }))
      ]);

      setDashboardStats({
        pendingRegistrations: statsRes.data?.pendingRegistrations || 0,
        totalStaff: statsRes.data?.totalStaff || 0,
        totalTeamLeaders: statsRes.data?.totalTeamLeaders || 0,
        totalDepartments: statsRes.data?.totalDepartments || 0
      });

      setOverallAttendance(attRes.data || { stats: {}, members: [] });

      const regData = regsRes.data || [];
      setPendingRegistrations(regData.slice(0, 4).map(u => ({
        id: u._id,
        regId: u.employeeId || `REG-${u._id.substring(0, 6)}`,
        name: u.name || 'N/A',
        email: u.email || 'N/A',
        department: u.department?.name || u.department || 'General',
        appliedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
        status: u.status || 'Pending HR Review'
      })));

      const staffData = staffRes.data || [];
      setActiveStaff(staffData.slice(0, 5).map(u => ({
        id: u._id,
        employeeId: u.employeeId,
        name: u.name || 'N/A',
        department: u.department?.name || u.department || 'General',
        designation: u.designation || 'Staff',
        teamLeader: u.teamLeaderName || u.teamLeader || 'Unassigned',
        status: u.status || 'Active'
      })));

      try {
        const compRes = await API.get('/hr/complaints');
        setPendingComplaints(compRes.data || []);
      } catch (err) {
        setPendingComplaints([]);
      }

      // Calculate Department Data for Chart
      const deptCount = {};
      staffData.forEach(u => {
        const d = u.department?.name || u.department || 'General';
        deptCount[d] = (deptCount[d] || 0) + 1;
      });
      setDepartmentData(deptCount);

    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userName = user?.name ? user.name.split(' ')[0] : 'Priya';
  const role = user?.role || 'HR';
  
  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(user?.name);

  // Chart Data preparation
  const chartColors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#64748B', '#EC4899'];
  const chartLabels = Object.keys(departmentData);
  const chartValues = Object.values(departmentData);
  
  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues.length > 0 ? chartValues : [1],
        backgroundColor: chartValues.length > 0 ? chartColors.slice(0, chartLabels.length) : ['#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (chartValues.length === 0) return ' No data';
            const value = context.raw;
            const total = context.chart._metasets[context.datasetIndex].total;
            const percentage = Math.round((value / total) * 100) + '%';
            return ` ${context.label}: ${value} (${percentage})`;
          }
        }
      }
    }
  };

  // Mock Notifications
  const mockNotifications = [
    { id: 1, text: '4 new staff registration requests are pending your review.', time: '10 mins ago', icon: Users, color: '#8B5CF6' },
    { id: 2, text: 'Ankitha S\'s leave request is pending your approval.', time: '1 hour ago', icon: CalendarDays, color: '#10B981' },
    { id: 3, text: 'Monthly HR report has been generated.', time: '2 hours ago', icon: FileText, color: '#2563EB' },
  ];

  return (
    <div className="dashboard-layout">
      <HRSidebar activeTab="dashboard" badgeCount={dashboardStats.pendingRegistrations} />

      <div className="dashboard-main animate-fade-in-up">
        
        {/* TOP HEADER */}
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Menu size={20} style={{ color: '#475569', cursor: 'pointer', marginRight: '1.5rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem', fontWeight: '500', background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <CalendarDays size={16} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer', background: '#F8FAFC', padding: '0.5rem', borderRadius: '8px' }}>
              <Bell size={18} style={{ color: '#64748B' }} />
              {dashboardStats.pendingRegistrations > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#EF4444', color: '#FFF', fontSize: '0.6rem', fontWeight: '800', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #FFF' }}>
                  {dashboardStats.pendingRegistrations}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{user?.name || 'Priya Sharma'}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{role}</span>
              </div>
              <ChevronDown size={14} style={{ color: '#64748B' }} />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="dashboard-content-area">
          
          {/* WELCOME BANNER */}
          <div className="welcome-banner hover-lift">
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1E293B', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif" }}>
                Welcome, {userName}! 👋
              </h1>
              <p style={{ color: '#64748B', fontSize: '0.95rem', margin: 0 }}>
                Coordinate pending staff onboarding requests and organizational directories.
              </p>
            </div>
            {/* Decorative Vector */}
            <svg style={{ position: 'absolute', right: 0, top: 0, height: '100%', opacity: 0.8 }} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M400 0H200C250 50 200 150 150 200H400V0Z" fill="#DDE5FD"/>
              <circle cx="320" cy="80" r="40" fill="#2563EB" fillOpacity="0.1" />
              <rect x="260" y="120" width="120" height="60" rx="8" fill="#FFFFFF" fillOpacity="0.6" />
              <path d="M280 140H360M280 160H320" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          {/* METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <StatCard 
              title="Pending Requests" 
              value={dashboardStats.pendingRegistrations} 
              subtitle="Awaiting HR review"
              icon={<FileText size={22} color="#F59E0B" />} 
              iconBg="#FFFBEB" 
              valueColor="#F59E0B"
            />
            <StatCard 
              title="Active Staff" 
              value={dashboardStats.totalStaff} 
              subtitle="Currently active"
              icon={<Users size={22} color="#2563EB" />} 
              iconBg="#EFF6FF" 
              valueColor="#2563EB"
            />
            <StatCard 
              title="Team Leaders" 
              value={dashboardStats.totalTeamLeaders} 
              subtitle="Leading teams"
              icon={<UserCog size={22} color="#8B5CF6" />} 
              iconBg="#F5F3FF" 
              valueColor="#8B5CF6"
            />
          </div>

          {/* OVERALL EMPLOYEE ATTENDANCE CARD */}
          <div className="content-card hover-glow" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} color="#2563EB" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Overall Employee Attendance Today
                </h3>
                <span style={{ background: '#ECFDF5', color: '#16A34A', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                  {overallAttendance?.stats?.presentCount || 0} / {overallAttendance?.stats?.totalMembers || 0} Present
                </span>
              </div>
              <button 
                onClick={() => navigate('/hr-attendance')}
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Full Attendance Directory <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: '700' }}>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Employee</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Department</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Clock-In Time</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Clock-Out Time</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overallAttendance?.members?.length > 0 ? (
                    overallAttendance.members.slice(0, 5).map((item) => (
                      <tr key={item.employee._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 0.75rem', fontWeight: '700', color: '#0F172A' }}>
                          <div>{item.employee?.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '500' }}>ID: {item.employee?.employeeId}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>{item.employee?.role}</td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#64748B' }}>{item.employee?.department?.name || item.employee?.department || 'General'}</td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#15803D', fontWeight: '700' }}>{item.clockIn}</td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#334155', fontWeight: '700' }}>{item.clockOut}</td>
                        <td style={{ padding: '0.75rem 0.75rem' }}>
                          <span style={{ 
                            padding: '3px 8px', 
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
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No attendance records logged today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TWO TABLES ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* PENDING ONBOARDING */}
            <div className="content-card hover-glow" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Pending Onboarding Registrations</h3>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>{dashboardStats.pendingRegistrations} Requests</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" placeholder="Search by Name, Email, Phone or ID..." style={{ width: '100%', padding: '0.45rem 1rem 0.45rem 2rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: '#64748B', cursor: 'pointer' }}>
                  <Filter size={14} /> All Departments
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: '#64748B', cursor: 'pointer' }}>
                  <Filter size={14} /> All Status
                </div>
              </div>

              {pendingRegistrations.length > 0 ? (
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Registration ID</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Full Name</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Email</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Department</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Applied Date</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.25rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRegistrations.map((reg) => (
                        <tr key={reg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#2563EB' }}>{reg.regId}</td>
                          <td style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#0F172A' }}>{reg.name}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#64748B' }}>{reg.email}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#64748B' }}>{reg.department}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#64748B' }}>{reg.appliedDate}</td>
                          <td style={{ padding: '0.75rem 0.25rem' }}>
                            <span style={{ display: 'inline-flex', background: '#FFFBEB', color: '#D97706', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                              Pending HR Review
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.25rem', textAlign: 'right' }}>
                            <button onClick={() => navigate('/pending-registrations')} style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>No pending registrations.</p>
                </div>
              )}
              
              <div style={{ marginTop: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.65rem', color: '#2563EB', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#EFF6FF', borderRadius: '50%', padding: '0.25rem' }}>
                  <Users size={12} />
                </div>
                <span><strong>HR Policy Notice:</strong> Clicking 'View Details' will take you to the separate review page to manage these requests.</span>
              </div>
            </div>

            {/* APPROVED STAFF MANAGEMENT */}
            <div className="content-card hover-glow" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Approved Staff Management</h3>
                  <span style={{ background: '#ECFDF5', color: '#10B981', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>{dashboardStats.totalStaff} Active Staff</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" placeholder="Search by Name, Employee ID, Designation or Team Leader..." style={{ width: '100%', padding: '0.45rem 1rem 0.45rem 2rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: '#64748B', cursor: 'pointer' }}>
                  <Filter size={14} /> All Departments
                </div>
              </div>

              {activeStaff.length > 0 ? (
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Employee ID</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Name</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Department</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Designation</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Assigned Team Leader</th>
                        <th style={{ padding: '0.75rem 0.25rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStaff.map((staff) => (
                        <tr key={staff.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#2563EB' }}>{staff.employeeId}</td>
                          <td style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#0F172A' }}>{staff.name}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#64748B' }}>{staff.department}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#64748B' }}>{staff.designation}</td>
                          <td style={{ padding: '0.75rem 0.25rem', color: '#2563EB', fontWeight: '600' }}>{staff.teamLeader}</td>
                          <td style={{ padding: '0.75rem 0.25rem' }}>
                            <span style={{ display: 'inline-flex', background: '#ECFDF5', color: '#10B981', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>No active staff found.</p>
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <span onClick={() => navigate('/staff-management')} style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  View all staff <ArrowRight size={14} />
                </span>
              </div>
            </div>

          </div>

          {/* COMPLAINTS FOR HR REVIEW */}
          <div className="content-card hover-glow" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Pending Complaints for Final Review</h3>
                <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>{pendingComplaints.length} Pending</span>
              </div>
            </div>

            {pendingComplaints.length > 0 ? (
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '0.75rem 0.25rem' }}>Ticket ID</th>
                      <th style={{ padding: '0.75rem 0.25rem' }}>Requester</th>
                      <th style={{ padding: '0.75rem 0.25rem' }}>Subject</th>
                      <th style={{ padding: '0.75rem 0.25rem' }}>Department</th>
                      <th style={{ padding: '0.75rem 0.25rem' }}>Priority</th>
                      <th style={{ padding: '0.75rem 0.25rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingComplaints.map((c) => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td 
                          onClick={() => navigate(`/hr-complaint-details/${c._id}`)} 
                          style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {c.complaintId}
                        </td>
                        <td style={{ padding: '0.75rem 0.25rem', fontWeight: '700', color: '#0F172A' }}>{c.createdBy?.name || c.staffName || 'Staff Member'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', color: '#334155' }}>{c.subject}</td>
                        <td style={{ padding: '0.75rem 0.25rem', color: '#64748B', fontWeight: '600' }}>{c.responsibleDepartment?.name || c.department || 'General'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', color: c.priority === 'Critical' ? '#DC2626' : '#D97706', fontWeight: '600' }}>{c.priority}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'right' }}>
                          <button onClick={() => navigate(`/hr-complaint-details/${c._id}`)} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Review in Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>No complaints pending HR review.</p>
              </div>
            )}
          </div>

          {/* BOTTOM ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* DEPARTMENT OVERVIEW */}
            <div className="content-card hover-glow" style={{ padding: '1.5rem', marginBottom: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 1.5rem 0', fontFamily: "'Outfit', sans-serif" }}>Department Overview</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
                <div style={{ width: '160px', height: '160px' }}>
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {chartLabels.length > 0 ? chartLabels.map((label, index) => {
                    const count = chartValues[index];
                    const total = chartValues.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: chartColors[index % chartColors.length] }}></span>
                          <span style={{ color: '#475569', fontWeight: '500' }}>{label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', color: '#0F172A' }}>{count}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem', width: '35px', textAlign: 'right' }}>({percentage}%)</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* RECENT NOTIFICATIONS */}
            <div className="content-card hover-glow" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Recent Notifications</h3>
                <span onClick={() => navigate('/notifications')} style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563EB', cursor: 'pointer' }}>View All</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {mockNotifications.map((notif) => (
                  <div key={notif.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: '8px' }}>
                      <notif.icon size={16} color={notif.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#334155', fontWeight: '500', lineHeight: '1.4' }}>{notif.text}</p>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <span onClick={() => navigate('/notifications')} style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  Go to Notifications <ArrowRight size={14} />
                </span>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg, valueColor }) => (
  <div className="stat-card hover-lift" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: valueColor, fontFamily: "'Outfit', sans-serif", lineHeight: '1' }}>
        {value}
      </div>
    </div>
  </div>
);

export default HRDashboard;
