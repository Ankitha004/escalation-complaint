const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Directories to create
const dirs = [
  'components/common',
  'components/layout',
  'components/cards',
  'components/tables',
  'components/forms',
  'components/modals',
  'hooks',
  'pages/auth',
  'pages/hr',
  'pages/employee',
  'pages/manager',
  'pages/staff',
  'pages/admin'
];

dirs.forEach(d => {
  const fullPath = path.join(srcDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// File moves mapping
// oldPath -> newPath
const fileMoves = {
  'components/Header.jsx': 'components/layout/Header.jsx',
  'components/Sidebar.jsx': 'components/layout/Sidebar.jsx',
  'components/Layout.jsx': 'components/layout/Layout.jsx',
  
  'pages/Login.jsx': 'pages/auth/Login.jsx',
  'pages/Dashboard.jsx': 'pages/hr/HRDashboard.jsx',
  
  'pages/EmployeeList.jsx': 'pages/hr/EmployeeList.jsx',
  'pages/AddEmployee.jsx': 'pages/hr/CreateEmployee.jsx',
  'pages/EmployeeDetails.jsx': 'pages/hr/EmployeeDetails.jsx',
  
  'pages/SupportStaffList.jsx': 'pages/hr/SupportStaffList.jsx',
  'pages/AddSupportStaff.jsx': 'pages/hr/AddSupportStaff.jsx',
  
  'pages/ManagerList.jsx': 'pages/hr/ManagerList.jsx',
  'pages/AddManager.jsx': 'pages/hr/AddManager.jsx',
  
  'pages/DepartmentList.jsx': 'pages/hr/DepartmentList.jsx',
  'pages/AddDepartment.jsx': 'pages/hr/AddDepartment.jsx',
  
  'pages/Notifications.jsx': 'pages/hr/Notifications.jsx',
  'pages/Profile.jsx': 'pages/hr/Profile.jsx'
};

for (const [oldRel, newRel] of Object.entries(fileMoves)) {
  const oldPath = path.join(srcDir, oldRel);
  const newPath = path.join(srcDir, newRel);
  
  if (fs.existsSync(oldPath)) {
    let content = fs.readFileSync(oldPath, 'utf8');
    
    // Update imports based on depth change
    // Most files move from depth 1 (e.g. pages/Login.jsx) to depth 2 (e.g. pages/auth/Login.jsx)
    // So '../context' -> '../../context'
    // '../services' -> '../../services'
    
    if (newRel.startsWith('pages/hr/') || newRel.startsWith('pages/auth/') || newRel.startsWith('components/layout/')) {
      content = content.replace(/\.\.\/context/g, '../../context');
      content = content.replace(/\.\.\/services/g, '../../services');
    }
    
    fs.writeFileSync(newPath, content);
    fs.unlinkSync(oldPath);
    console.log(`Moved ${oldRel} to ${newRel}`);
  } else {
    console.log(`File not found: ${oldRel}`);
  }
}

// Write new App.jsx
const appContent = `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';

import HRDashboard from './pages/hr/HRDashboard';
import EmployeeList from './pages/hr/EmployeeList';
import CreateEmployee from './pages/hr/CreateEmployee';
import EmployeeDetails from './pages/hr/EmployeeDetails';

import SupportStaffList from './pages/hr/SupportStaffList';
import AddSupportStaff from './pages/hr/AddSupportStaff';

import ManagerList from './pages/hr/ManagerList';
import AddManager from './pages/hr/AddManager';

import DepartmentList from './pages/hr/DepartmentList';
import AddDepartment from './pages/hr/AddDepartment';

import Notifications from './pages/hr/Notifications';
import Profile from './pages/hr/Profile';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/hr" element={<Layout />}>
            <Route index element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="dashboard" element={<HRDashboard />} />
            
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/add" element={<CreateEmployee />} />
            <Route path="employees/:id" element={<EmployeeDetails />} />
            
            <Route path="support-staff" element={<SupportStaffList />} />
            <Route path="support-staff/add" element={<AddSupportStaff />} />
            <Route path="support-staff/:id" element={<EmployeeDetails />} />
            
            <Route path="managers" element={<ManagerList />} />
            <Route path="managers/add" element={<AddManager />} />
            <Route path="managers/:id" element={<EmployeeDetails />} />
            
            <Route path="departments" element={<DepartmentList />} />
            <Route path="departments/add" element={<AddDepartment />} />
            
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
`;
fs.writeFileSync(path.join(srcDir, 'App.jsx'), appContent);
console.log('App.jsx updated');
