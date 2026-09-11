import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B', fontFamily: 'sans-serif', fontWeight: '600' }}>
        Verifying portal authorization...
      </div>
    );
  }

  // If unauthenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').trim();
  const roleLower = role.toLowerCase();

  // If allowedRoles is empty or contains the role, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  const isAllowed = allowedRoles.some(allowed => {
    const aLower = allowed.toLowerCase();
    if (aLower === 'super admin' || aLower === 'superadmin') {
      return roleLower.includes('super admin') || roleLower === 'superadmin';
    }
    if (aLower === 'hr') {
      return roleLower.includes('hr');
    }
    if (aLower === 'manager') {
      return roleLower.includes('manager');
    }
    if (aLower === 'team leader' || aLower === 'teamleader') {
      return roleLower.includes('team leader') || roleLower.includes('leader');
    }
    if (aLower === 'staff' || aLower === 'employee') {
      return roleLower === 'staff' || roleLower === 'employee';
    }
    return roleLower === aLower;
  });

  if (!isAllowed) {
    // Prevent cross-portal access by redirecting user strictly to their own portal dashboard
    if (roleLower.includes('super admin') || roleLower === 'superadmin') {
      return <Navigate to="/superadmin-dashboard" replace />;
    }
    if (roleLower.includes('hr')) {
      return <Navigate to="/hr-dashboard" replace />;
    }
    if (roleLower.includes('manager')) {
      return <Navigate to="/manager-dashboard" replace />;
    }
    if (roleLower.includes('team leader') || roleLower.includes('leader')) {
      return <Navigate to="/tl-dashboard" replace />;
    }
    return <Navigate to="/my-complaints" replace />;
  }

  return children;
};

export default ProtectedRoute;
