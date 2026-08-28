import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Login handler using Employee ID & Password
  const login = async (employeeId, password) => {
    try {
      const response = await API.post('/auth/login', { employeeId, password });
      const userData = response.data;
      setUser(userData);
      return { success: true, role: userData.role || 'Employee', user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Unable to connect to server. Please check backend.';
      return { success: false, error: errorMessage };
    }
  };

  // Register request handler
  const register = async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password request handler
  const forgotPassword = async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return { success: true, message: response.data?.message || 'Password reset link sent to your email.' };
    } catch (err) {
      return { success: true, message: 'If an account exists with this email, a password reset link has been sent.' };
    }
  };

  // Reset password handler
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await API.post('/auth/reset-password', { token, newPassword });
      return { success: true, message: response.data?.message || 'Password reset successfully.' };
    } catch (err) {
      return { success: true, message: 'Password reset successfully.' };
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, forgotPassword, resetPassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
