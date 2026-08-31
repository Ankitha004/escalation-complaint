import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import HRSalaries from './pages/HRSalaries';
import SuperAdminComplaints from './pages/SuperAdminComplaints';
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

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Role-based Dashboard Route (Resolved post-login) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* HR Module Routes */}
          <Route path="/pending-registrations" element={<PendingRegistrations />} />
          <Route path="/registration-details/:id" element={<RegistrationDetails />} />
          <Route path="/staff-management" element={<StaffManagementPage />} />
          <Route path="/team-leaders" element={<TeamLeadersPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/hr-leaves" element={<LeaveApprovalsPage />} />
          <Route path="/hr-salaries" element={<HRSalaries />} />
          <Route path="/incentives-salary" element={<HRSalaries />} />
          <Route path="/hr-complaints" element={<HRComplaints />} />
          <Route path="/hr-complaint-details/:id" element={<HRComplaintDetails />} />
          <Route path="/superadmin-complaints" element={<SuperAdminComplaints />} />
          <Route path="/superadmin-sla" element={<SuperAdminSLA />} />
          <Route path="/superadmin-performance" element={<SuperAdminPerformance />} />
          <Route path="/superadmin-resolved" element={<SuperAdminResolved />} />
          <Route path="/superadmin-settings" element={<SuperAdminSettings />} />
          <Route path="/superadmin-notifications" element={<SuperAdminNotifications />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Staff Complaint Module Routes */}
          <Route path="/raise-complaint" element={<RaiseComplaint />} />
          <Route path="/my-complaints" element={<MyComplaints />} />
          <Route path="/track-complaint" element={<TrackComplaint />} />
          <Route path="/complaint-details/:id" element={<ComplaintDetails />} />
          <Route path="/staff-profile" element={<StaffProfile />} />
          <Route path="/profile" element={<StaffProfile />} />

          {/* Team Leader Complaint Module Routes */}
          <Route path="/tl-assigned-complaints" element={<TeamLeaderDashboard initialTab="assigned" />} />
          <Route path="/tl-all-complaints" element={<TeamLeaderDashboard initialTab="complaints" />} />
          <Route path="/tl-escalated-complaints" element={<TeamLeaderDashboard initialTab="sla" />} />
          <Route path="/tl-reports" element={<TLPlaceholderPage title="Team Reports" activeTab="tl-reports" />} />
          
          <Route path="/tl-team-members" element={<TeamLeaderDashboard initialTab="my_staff" />} />
          <Route path="/tl-performance" element={<TLPlaceholderPage title="Team Performance" activeTab="tl-performance" />} />
          
          <Route path="/tl-leaves" element={<TeamLeaderDashboard initialTab="leaves" />} />
          <Route path="/tl-leave-calendar" element={<TLPlaceholderPage title="Leave Calendar" activeTab="tl-leave-calendar" />} />
          
          <Route path="/tl-announcements" element={<TLPlaceholderPage title="Announcements" activeTab="tl-announcements" />} />
          <Route path="/tl-profile" element={<StaffProfile />} />

          {/* Legacy routes for TL to not break existing links */}
          <Route path="/tl-complaints" element={<TeamLeaderDashboard initialTab="complaints" />} />
          <Route path="/tl-sla-monitoring" element={<TeamLeaderDashboard initialTab="sla" />} />
          <Route path="/tl-complaint-details/:id" element={<TLComplaintDetails />} />

          {/* Manager Complaint Module Routes */}
          <Route path="/manager-complaints" element={<ManagerDashboard initialTab="complaints" />} />
          <Route path="/manager-complaint-details/:id" element={<ManagerComplaintDetails />} />
          <Route path="/manager-performance" element={<ManagerPerformance />} />
          <Route path="/manager-sla" element={<ManagerSLA />} />
          <Route path="/manager-leaves" element={<ManagerDashboard initialTab="leaves" />} />
          <Route path="/manager-resolved" element={<ManagerResolved />} />
          <Route path="/manager-settings" element={<ManagerSettings />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
