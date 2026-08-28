import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';
import HRDashboard from './HRDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';
import StaffDashboard from './StaffDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // If user is not logged in, redirect directly to Login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || 'Employee';

  // Role Based Dashboard Rendering
  switch (role) {
    case 'Manager':
      return <ManagerDashboard />;
    case 'Super Admin':
      return <SuperAdminDashboard />;
    case 'HR':
      return <HRDashboard />;
    case 'Team Leader':
      return <TeamLeaderDashboard />;
    case 'Staff':
    case 'Support Staff':
    case 'Employee':
    default:
      return <StaffDashboard />;
  }
};

export default Dashboard;
