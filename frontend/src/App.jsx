import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import PendingRegistrations from './pages/PendingRegistrations';
import RegistrationDetails from './pages/RegistrationDetails';
import StaffManagementPage from './pages/StaffManagementPage';
import TeamLeadersPage from './pages/TeamLeadersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import HRSalaries from './pages/HRSalaries';
import SuperAdminComplaints from './pages/SuperAdminComplaints';
import SuperAdminComplaintDetails from './pages/SuperAdminComplaintDetails';
import SuperAdminSLA from './pages/SuperAdminSLA';
import SuperAdminPerformance from './pages/SuperAdminPerformance';
import SuperAdminResolved from './pages/SuperAdminResolved';
import SuperAdminSettings from './pages/SuperAdminSettings';
import SuperAdminNotifications from './pages/SuperAdminNotifications';

// Staff Complaint Module Pages
import RaiseComplaint from './pages/RaiseComplaint';
import MyComplaints from './pages/MyComplaints';
import TrackComplaint from './pages/TrackComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import StaffProfile from './pages/StaffProfile';

// Team Leader Module Pages
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import TLComplaintDetails from './pages/TLComplaintDetails';
import TLReportsPage from './pages/TLReportsPage';
import TLPerformancePage from './pages/TLPerformancePage';
import TLPlaceholderPage from './pages/TLPlaceholderPage';

// Manager Module Pages
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerComplaintDetails from './pages/ManagerComplaintDetails';
import ManagerPerformance from './pages/ManagerPerformance';
import ManagerSLA from './pages/ManagerSLA';
import ManagerResolved from './pages/ManagerResolved';
import ManagerSettings from './pages/ManagerSettings';

// HR Module Pages
import HRDashboard from './pages/HRDashboard';
import HRComplaints from './pages/HRComplaints';
import HRComplaintDetails from './pages/HRComplaintDetails';
import HRAttendancePage from './pages/HRAttendancePage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Role-based General Dashboard & Shared Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR', 'Manager', 'Team Leader', 'Staff']}><Dashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR', 'Manager', 'Team Leader', 'Staff']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR', 'Manager', 'Team Leader', 'Staff']}><StaffProfile /></ProtectedRoute>} />

          {/* Super Admin Module Routes (Strictly Super Admin Only) */}
          <Route path="/superadmin-dashboard" element={<ProtectedRoute allowedRoles={['Super Admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/superadmin-complaints" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminComplaints /></ProtectedRoute>} />
          <Route path="/superadmin-complaint-details/:id" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminComplaintDetails /></ProtectedRoute>} />
          <Route path="/superadmin-sla" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminSLA /></ProtectedRoute>} />
          <Route path="/superadmin-performance" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminPerformance /></ProtectedRoute>} />
          <Route path="/superadmin-resolved" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminResolved /></ProtectedRoute>} />
          <Route path="/superadmin-settings" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminSettings /></ProtectedRoute>} />
          <Route path="/superadmin-notifications" element={<ProtectedRoute allowedRoles={['Super Admin']}><SuperAdminNotifications /></ProtectedRoute>} />

          {/* HR Module Routes (HR & Super Admin Only) */}
          <Route path="/hr-dashboard" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRDashboard /></ProtectedRoute>} />
          <Route path="/hr-attendance" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRAttendancePage /></ProtectedRoute>} />
          <Route path="/pending-registrations" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><PendingRegistrations /></ProtectedRoute>} />
          <Route path="/registration-details/:id" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><RegistrationDetails /></ProtectedRoute>} />
          <Route path="/staff-management" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><StaffManagementPage /></ProtectedRoute>} />
          <Route path="/team-leaders" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><TeamLeadersPage /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><DepartmentsPage /></ProtectedRoute>} />
          <Route path="/hr-leaves" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><LeaveApprovalsPage /></ProtectedRoute>} />
          <Route path="/hr-incentives" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRSalaries /></ProtectedRoute>} />
          <Route path="/hr-salaries" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRSalaries /></ProtectedRoute>} />
          <Route path="/incentives-salary" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRSalaries /></ProtectedRoute>} />
          <Route path="/hr-complaints" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRComplaints /></ProtectedRoute>} />
          <Route path="/hr-complaint-details/:id" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRComplaintDetails /></ProtectedRoute>} />
          <Route path="/hr complaint details/:id" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRComplaintDetails /></ProtectedRoute>} />
          <Route path="/hr_complaint_details/:id" element={<ProtectedRoute allowedRoles={['HR', 'Super Admin']}><HRComplaintDetails /></ProtectedRoute>} />

          {/* Manager Module Routes (Manager Only) */}
          <Route path="/manager-dashboard" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="overview" /></ProtectedRoute>} />
          <Route path="/manager-complaints" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="complaints" /></ProtectedRoute>} />
          <Route path="/manager-escalated" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="escalated" /></ProtectedRoute>} />
          <Route path="/manager escalated" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="escalated" /></ProtectedRoute>} />
          <Route path="/manager_escalated" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="escalated" /></ProtectedRoute>} />
          <Route path="/manager-complaint-details/:id" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerComplaintDetails /></ProtectedRoute>} />
          <Route path="/manager-performance" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerPerformance /></ProtectedRoute>} />
          <Route path="/manager-sla" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerSLA /></ProtectedRoute>} />
          <Route path="/manager-leaves" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard initialTab="leaves" /></ProtectedRoute>} />
          <Route path="/manager-resolved" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerResolved /></ProtectedRoute>} />
          <Route path="/manager-settings" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerSettings /></ProtectedRoute>} />

          {/* Team Leader Module Routes (Team Leader Only) */}
          <Route path="/tl-dashboard" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="overview" /></ProtectedRoute>} />
          <Route path="/tl-assigned-complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="assigned" /></ProtectedRoute>} />
          <Route path="/tl-all-complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="complaints" /></ProtectedRoute>} />
          <Route path="/tl-escalated-complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="sla" /></ProtectedRoute>} />
          <Route path="/tl escalated complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="sla" /></ProtectedRoute>} />
          <Route path="/tl_escalated_complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="sla" /></ProtectedRoute>} />
          <Route path="/tl escalated-complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="sla" /></ProtectedRoute>} />
          <Route path="/tl-reports" element={<ProtectedRoute allowedRoles={['Team Leader']}><TLReportsPage /></ProtectedRoute>} />
          <Route path="/tl-team-members" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="my_staff" /></ProtectedRoute>} />
          <Route path="/tl-performance" element={<ProtectedRoute allowedRoles={['Team Leader']}><TLPerformancePage /></ProtectedRoute>} />
          <Route path="/tl-leaves" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="leaves" /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR', 'Manager', 'Team Leader', 'Staff']}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/tl-announcements" element={<ProtectedRoute allowedRoles={['Team Leader', 'Super Admin', 'HR', 'Manager']}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/tl-profile" element={<ProtectedRoute allowedRoles={['Team Leader']}><StaffProfile /></ProtectedRoute>} />
          <Route path="/tl-complaints" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="complaints" /></ProtectedRoute>} />
          <Route path="/tl-sla-monitoring" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamLeaderDashboard initialTab="sla" /></ProtectedRoute>} />
          <Route path="/tl-complaint-details/:id" element={<ProtectedRoute allowedRoles={['Team Leader', 'Super Admin', 'HR', 'Manager']}><TLComplaintDetails /></ProtectedRoute>} />

          {/* Staff Module Routes (Staff Only) */}
          <Route path="/raise-complaint" element={<ProtectedRoute allowedRoles={['Staff']}><RaiseComplaint /></ProtectedRoute>} />
          <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['Staff']}><MyComplaints /></ProtectedRoute>} />
          <Route path="/track-complaint" element={<ProtectedRoute allowedRoles={['Staff']}><TrackComplaint /></ProtectedRoute>} />
          <Route path="/complaint-details/:id" element={<ProtectedRoute allowedRoles={['Staff']}><ComplaintDetails /></ProtectedRoute>} />
          <Route path="/staff-profile" element={<ProtectedRoute allowedRoles={['Staff']}><StaffProfile /></ProtectedRoute>} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
