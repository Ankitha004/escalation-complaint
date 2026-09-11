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

  const rawRole = (user?.role || 'Employee').trim();
  const roleLower = rawRole.toLowerCase();

  // Role Based Dashboard Rendering
  if (roleLower === 'manager' || roleLower.includes('manager')) {
    return <ManagerDashboard />;
  }
  if (roleLower === 'super admin' || roleLower === 'superadmin' || roleLower.includes('super admin')) {
    return <SuperAdminDashboard />;
  }
  if (roleLower === 'hr' || roleLower.includes('hr')) {
    return <HRDashboard />;
  }
  if (roleLower === 'team leader' || roleLower === 'teamleader' || roleLower.includes('team leader') || roleLower.includes('leader')) {
    return <TeamLeaderDashboard />;
  }
  
  return <StaffDashboard />;
};

export default Dashboard;
