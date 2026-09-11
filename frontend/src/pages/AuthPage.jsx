import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  UserCheck,
  Crown,
  Briefcase,
  Lock, 
  Mail, 
  Phone, 
  Building, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Bell,
  ClipboardList,
  ArrowRight,
  Check,
  Shield,
  Info
} from 'lucide-react';

const AuthPage = () => {
  const [activeView, setActiveView] = useState('login'); // 'login' | 'register'
  
  // Selected Role State ('Staff' | 'HR' | 'Team Leader' | 'Manager')
  const [selectedRole, setSelectedRole] = useState('Staff');

  // Login State
  const [loginEmployeeId, setLoginEmployeeId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('IT & Software');
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTouched, setRegTouched] = useState({});
  const [regErrors, setRegErrors] = useState({});

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Field Validation Helper
  const validateRegisterField = (name, value, currentPassword = regPassword) => {
    let err = '';
    switch (name) {
      case 'regFullName':
        if (!value.trim()) err = 'Full name is required';
        else if (value.trim().length < 3) err = 'Name must be at least 3 characters';
        else if (!/^[a-zA-Z\s]+$/.test(value.trim())) err = 'Full name can only contain letters and spaces';
        break;
      case 'regEmail':
        if (!value.trim()) err = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) err = 'Enter a valid email address';
        break;
      case 'regPhone':
        if (!value.trim()) err = 'Phone number is required';
        else if (value.trim().length !== 10 || !/^[0-9]{10}$/.test(value.trim())) err = 'Phone number must be exactly 10 digits';
        break;
      case 'regJobTitle':
        if (!value.trim()) err = 'Job title is required';
        else if (value.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) err = 'Enter a valid job title, not an email address';
        else if (value.trim().length < 2) err = 'Job title must be at least 2 characters';
        break;
      case 'regPassword':
        if (!value) err = 'Password is required';
        else if (value.length < 6) err = 'Password must be at least 6 characters';
        break;
      case 'regConfirmPassword':
        if (!value) err = 'Please confirm your password';
        else if (value !== currentPassword) err = 'Passwords do not match';
        break;
      default:
        break;
    }
    return err;
  };

  const handleFieldChange = (field, rawValue) => {
    let value = rawValue;

    // Strict input filtering per field
    if (field === 'regFullName') {
      // Only allow letters and spaces
      value = rawValue.replace(/[^a-zA-Z\s]/g, '');
      setRegFullName(value);
    } else if (field === 'regPhone') {
      // Only allow numeric digits and strictly max 10 digits
      value = rawValue.replace(/\D/g, '').slice(0, 10);
      setRegPhone(value);
    } else if (field === 'regEmail') {
      setRegEmail(value);
    } else if (field === 'regDepartment') {
      setRegDepartment(value);
    } else if (field === 'regJobTitle') {
      setRegJobTitle(value);
    } else if (field === 'regPassword') {
      setRegPassword(value);
      if (regTouched.regConfirmPassword) {
        setRegErrors(prev => ({
          ...prev,
          regConfirmPassword: validateRegisterField('regConfirmPassword', regConfirmPassword, value)
        }));
      }
    } else if (field === 'regConfirmPassword') {
      setRegConfirmPassword(value);
    }

    if (regTouched[field]) {
      const err = validateRegisterField(field, value);
      setRegErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleFieldBlur = (field, value) => {
    setRegTouched(prev => ({ ...prev, [field]: true }));
    const err = validateRegisterField(field, value);
    setRegErrors(prev => ({ ...prev, [field]: err }));
  };

  // Password Strength Indicator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#E2E8F0' };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, label: 'Weak', color: '#F43F5E' };
    if (score <= 50) return { score: 50, label: 'Fair', color: '#FB923C' };
    if (score <= 75) return { score: 75, label: 'Good', color: '#3B82F6' };
    return { score: 100, label: 'Strong', color: '#10B981' };
  };

  // Role Configuration Cards
  const roles = [
    {
      id: 'Staff',
      title: 'Staff',
      icon: User,
      color: '#6366F1',
      defaultEmpId: 'EMP3833'
    },
    {
      id: 'HR',
      title: 'HR',
      icon: UserCheck,
      color: '#10B981',
      defaultEmpId: 'HR001'
    },
    {
      id: 'Team Leader',
      title: 'Team Leader',
      icon: Crown,
      color: '#F59E0B',
      defaultEmpId: 'TL001'
    },
    {
      id: 'Manager',
      title: 'Manager',
      icon: Briefcase,
      color: '#3B82F6',
      defaultEmpId: 'MGR001'
    }
  ];

  const departments = [
    'IT & Software',
    'Operations & Facilities',
    'Finance & Accounting',
    'Sales & Marketing',
    'Customer Support'
  ];

  // Role Selection Handler
  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    const defaultEmpIds = roles.map(r => r.defaultEmpId);
    if (!loginEmployeeId || defaultEmpIds.includes(loginEmployeeId)) {
      if (roleItem.defaultEmpId) {
        setLoginEmployeeId(roleItem.defaultEmpId);
      }
    }
    setError('');
  };

  // LOGIN SUBMIT HANDLER
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!loginEmployeeId || !loginPassword) {
      setError('Please enter your Employee ID and Password.');
      setSubmitting(false);
      return;
    }

    if (loginEmployeeId.length < 3) {
      setError('Employee ID / Email must be at least 3 characters.');
      setSubmitting(false);
      return;
    }

    const result = await login(loginEmployeeId, loginPassword);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || result.error || 'Invalid Employee ID or password.');
      setSubmitting(false);
    }
  };

  // REGISTER SUBMIT HANDLER WITH FULL VALIDATION
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const errors = {
      regFullName: validateRegisterField('regFullName', regFullName),
      regEmail: validateRegisterField('regEmail', regEmail),
      regPhone: validateRegisterField('regPhone', regPhone),
      regJobTitle: validateRegisterField('regJobTitle', regJobTitle),
      regPassword: validateRegisterField('regPassword', regPassword),
      regConfirmPassword: validateRegisterField('regConfirmPassword', regConfirmPassword, regPassword)
    };

    setRegTouched({
      regFullName: true,
      regEmail: true,
      regPhone: true,
      regJobTitle: true,
      regPassword: true,
      regConfirmPassword: true
    });
    setRegErrors(errors);

    const hasError = Object.values(errors).some(err => err !== '');
    if (hasError) {
      setError('Please fix all highlighted validation errors before submitting.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: regFullName,
      email: regEmail,
      phone: regPhone,
      department: regDepartment,
      jobTitle: regJobTitle,
      password: regPassword,
      role: selectedRole
    };

    const result = await register(payload);

    if (result.success) {
      setSuccess('Registration request submitted! Your account is pending HR approval.');
      setSubmitting(false);
      setTimeout(() => {
        setActiveView('login');
        setSuccess('');
      }, 2500);
    } else {
      setError(result.message || result.error || 'Failed to submit registration request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="role-login-container">
      {/* SPLIT SCREEN CARD MATCHING USER SCREENSHOT */}
      <div className="role-login-card">
        {/* LEFT SIDE: HERO PANEL */}
        <div className="role-hero-panel">
            <div>
              {/* Header Brand */}
              <div className="hero-header-brand">
                <div className="hero-brand-icon-box">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="hero-brand-title">CMS</div>
                  <div className="hero-brand-sub">Complaint Management System</div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="hero-main-heading">
                Better Complaints.<br />
                <span className="hero-gradient-text">Smarter Resolutions.</span>
              </h1>
              <p className="hero-main-subtext">
                A modern way to raise complaints, track progress, automate escalations and ensure timely resolutions.
              </p>

              {/* 4 Feature Items */}
              <div className="hero-features-list">
                <div className="hero-feature-item">
                  <div className="hero-feature-icon-box" style={{ background: 'rgba(37, 99, 235, 0.2)', color: '#60A5FA' }}>
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <div className="hero-feature-title">Track in Real-time</div>
                    <div className="hero-feature-desc">Monitor every complaint at every step.</div>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <div className="hero-feature-icon-box" style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#C084FC' }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <div className="hero-feature-title">Automated Escalation</div>
                    <div className="hero-feature-desc">Never miss an SLA with smart escalation rules.</div>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <div className="hero-feature-icon-box" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div className="hero-feature-title">Role Based Access</div>
                    <div className="hero-feature-desc">Secure access for Staff, HR, Team Leaders & Managers.</div>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <div className="hero-feature-icon-box" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <div className="hero-feature-title">Reports & Insights</div>
                    <div className="hero-feature-desc">Get data-driven insights and make better decisions.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM LAPTOP & DECORATION ILLUSTRATION */}
            <div className="hero-laptop-mockup-wrapper">
              <svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Laptop Body & Screen */}
                <rect x="50" y="10" width="340" height="185" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                <rect x="58" y="18" width="324" height="169" rx="6" fill="#FFFFFF" />
                
                {/* Dashboard Screen Content */}
                <rect x="58" y="18" width="324" height="24" fill="#1E293B" />
                <circle cx="70" cy="30" r="3.5" fill="#EF4444" />
                <circle cx="80" cy="30" r="3.5" fill="#F59E0B" />
                <circle cx="90" cy="30" r="3.5" fill="#10B981" />
                
                {/* Dashboard Metric Boxes */}
                <rect x="68" y="50" width="65" height="38" rx="6" fill="#EFF6FF" stroke="#BFDBFE" />
                <text x="100.5" y="65" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600">Total</text>
                <text x="100.5" y="80" textAnchor="middle" fill="#1E40AF" fontSize="13" fontWeight="800">120</text>
                
                <rect x="141" y="50" width="65" height="38" rx="6" fill="#EEF2FF" stroke="#C7D2FE" />
                <text x="173.5" y="65" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600">In-Progress</text>
                <text x="173.5" y="80" textAnchor="middle" fill="#4338CA" fontSize="13" fontWeight="800">45</text>
                
                <rect x="214" y="50" width="65" height="38" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                <text x="246.5" y="65" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600">Resolved</text>
                <text x="246.5" y="80" textAnchor="middle" fill="#047857" fontSize="13" fontWeight="800">75</text>
                
                <rect x="287" y="50" width="65" height="38" rx="6" fill="#FEF2F2" stroke="#FECACA" />
                <text x="319.5" y="65" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600">Escalated</text>
                <text x="319.5" y="80" textAnchor="middle" fill="#B91C1C" fontSize="13" fontWeight="800">08</text>
                
                {/* Mockup Table Lines */}
                <rect x="68" y="100" width="304" height="14" rx="4" fill="#F8FAFC" />
                <circle cx="78" cy="107" r="2.5" fill="#3B82F6" />
                <rect x="88" y="104" width="110" height="6" rx="3" fill="#CBD5E1" />

                <rect x="68" y="118" width="304" height="14" rx="4" fill="#F8FAFC" />
                <circle cx="78" cy="125" r="2.5" fill="#10B981" />
                <rect x="88" y="122" width="130" height="6" rx="3" fill="#CBD5E1" />

                <rect x="68" y="136" width="304" height="14" rx="4" fill="#F8FAFC" />
                <circle cx="78" cy="143" r="2.5" fill="#F59E0B" />
                <rect x="88" y="140" width="90" height="6" rx="3" fill="#CBD5E1" />

                <rect x="68" y="154" width="304" height="14" rx="4" fill="#F8FAFC" />
                <circle cx="78" cy="161" r="2.5" fill="#EF4444" />
                <rect x="88" y="158" width="140" height="6" rx="3" fill="#CBD5E1" />

                {/* Laptop Base */}
                <path d="M20 195 H420 L435 206 H5 L20 195 Z" fill="#94A3B8" />
                <rect x="180" y="195" width="80" height="4" rx="2" fill="#64748B" />

                {/* Plant on Left */}
                <path d="M28 178 L38 220 H10 L20 178 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M24 178 C12 150 2 140 8 128 C20 136 26 162 24 178 Z" fill="#10B981" />
                <path d="M24 178 C32 146 42 138 38 124 C25 134 22 160 24 178 Z" fill="#059669" />

                {/* Mug on Right */}
                <rect x="398" y="186" width="28" height="30" rx="5" fill="#1D4ED8" />
                <path d="M426 193 C433 193 433 205 426 205" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
                <path d="M412 195 L417 197 L417 202 C417 205 412 208 412 208 C412 208 407 205 407 202 L407 197 L412 195 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* RIGHT SIDE: DYNAMIC FORM PANEL */}
          <div className="role-form-panel" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
            {activeView === 'login' ? (
              <div className="role-form-wrapper">
              <div className="form-header-center">
                <div className="form-top-icon-badge">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="form-header-title">Welcome Back! 👋</h2>
                <p className="form-header-sub">Login to your account to continue</p>
                <div className="form-decorative-pill" />
              </div>

              {error && (
                <div className="alert-box alert-danger" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert-box alert-success" style={{ marginBottom: '1.25rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                {/* Account Role Selection Grid */}
                <div className="role-selection-section">
                  <label className="role-selection-label">Select Your Role</label>
                  <div className="role-cards-grid">
                    {roles.map((role) => {
                      const RoleIcon = role.icon;
                      const isActive = selectedRole === role.id;
                      return (
                        <div
                          key={role.id}
                          className={`role-select-card ${isActive ? 'active' : ''}`}
                          onClick={() => handleRoleSelect(role)}
                        >
                          <RoleIcon
                            size={22}
                            className="role-card-icon"
                            style={{ color: isActive ? '#6366F1' : role.color }}
                          />
                          <div className="role-card-title" style={{ color: isActive ? '#6366F1' : '#334155' }}>{role.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Employee ID / Email Input */}
                <div className="role-input-group">
                  <label className="role-input-label">Employee ID / Email</label>
                  <div className="role-input-wrapper">
                    <Mail className="role-input-icon" size={18} />
                    <input
                      type="text"
                      className="role-input-field"
                      placeholder="Enter your Employee ID or Email"
                      value={loginEmployeeId}
                      onChange={(e) => setLoginEmployeeId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="role-input-group">
                  <label className="role-input-label">Password</label>
                  <div className="role-input-wrapper">
                    <Lock className="role-input-icon" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="role-input-field"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="role-eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot Password */}
                <div className="role-options-row">
                  <label className="role-remember-label">
                    <input
                      type="checkbox"
                      className="role-remember-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="/forgot-password" className="role-forgot-link">
                    Forgot Password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="role-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>Authenticating Access...</>
                  ) : (
                    <>Login <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="role-footer-text">
                Don't have an account? 
                <button
                  type="button"
                  className="role-footer-link"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setActiveView('register');
                  }}
                >
                  Register Here
                </button>
              </div>
              </div>
            ) : (
              /* REGISTER VIEW IN SPLIT LAYOUT */
              <div className="role-form-wrapper" style={{ maxWidth: '680px', margin: '2rem 0', padding: '2.5rem' }}>
                <div className="register-header">
            <div className="register-icon-badge">
              <UserPlus size={28} />
            </div>
            <h1 className="register-title">Create Your Account</h1>
            <p className="register-subtitle">
              Fill in your details below to request access to the system.
            </p>
          </div>

          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} noValidate>
            {/* Account Role Selection Grid */}
            <div className="register-role-section">
              <label className="register-field-label">Select Account Role</label>
              <div className="register-role-cards-grid">
                {roles.map((role) => {
                  const RoleIcon = role.icon;
                  const isActive = selectedRole === role.id;
                  return (
                    <div
                      key={role.id}
                      className={`register-role-card ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      {isActive && (
                        <div className="register-role-badge">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                      <RoleIcon
                        size={20}
                        className="register-role-icon"
                        style={{ color: isActive ? '#6366F1' : role.color }}
                      />
                      <div className="register-role-title">{role.title}</div>
                      <div className="register-role-sub">{role.subtitle}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="register-two-col">
              {/* Full Name */}
              <div className="register-field-group">
                <label className="register-field-label">Full Name <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regFullName ? (regErrors.regFullName ? 'invalid' : 'valid') : ''}`}>
                  <User className="register-field-icon" size={18} />
                  <input
                    type="text"
                    name="regFullName"
                    id="regFullName"
                    autoComplete="name"
                    className="register-input-control"
                    placeholder="e.g. Alex Morgan"
                    value={regFullName}
                    onChange={(e) => handleFieldChange('regFullName', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regFullName', e.target.value)}
                  />
                  {regTouched.regFullName && !regErrors.regFullName && (
                    <CheckCircle2 className="field-status-icon valid" size={16} />
                  )}
                </div>
                {regTouched.regFullName && regErrors.regFullName && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regFullName}</span>
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="register-field-group">
                <label className="register-field-label">Email Address <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regEmail ? (regErrors.regEmail ? 'invalid' : 'valid') : ''}`}>
                  <Mail className="register-field-icon" size={18} />
                  <input
                    type="email"
                    name="regEmail"
                    id="regEmail"
                    autoComplete="email"
                    className="register-input-control"
                    placeholder="e.g. alex@company.com"
                    value={regEmail}
                    onChange={(e) => handleFieldChange('regEmail', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regEmail', e.target.value)}
                  />
                  {regTouched.regEmail && !regErrors.regEmail && (
                    <CheckCircle2 className="field-status-icon valid" size={16} />
                  )}
                </div>
                {regTouched.regEmail && regErrors.regEmail && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regEmail}</span>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="register-field-group">
                <label className="register-field-label">Phone Number <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regPhone ? (regErrors.regPhone ? 'invalid' : 'valid') : ''}`}>
                  <Phone className="register-field-icon" size={18} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="regPhone"
                    id="regPhone"
                    maxLength={10}
                    autoComplete="tel"
                    className="register-input-control"
                    placeholder="10 digit mobile number"
                    value={regPhone}
                    onChange={(e) => handleFieldChange('regPhone', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regPhone', e.target.value)}
                  />
                  {regTouched.regPhone && !regErrors.regPhone && (
                    <CheckCircle2 className="field-status-icon valid" size={16} />
                  )}
                </div>
                {regTouched.regPhone && regErrors.regPhone && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regPhone}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="register-field-group">
                <label className="register-field-label">Department <span className="req-star">*</span></label>
                <div className="register-input-wrapper valid">
                  <Building className="register-field-icon" size={18} />
                  <select
                    name="regDepartment"
                    id="regDepartment"
                    className="register-input-control register-select"
                    value={regDepartment}
                    onChange={(e) => handleFieldChange('regDepartment', e.target.value)}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Job Title / Designation */}
              <div className="register-field-group">
                <label className="register-field-label">Job Title <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regJobTitle ? (regErrors.regJobTitle ? 'invalid' : 'valid') : ''}`}>
                  <Briefcase className="register-field-icon" size={18} />
                  <input
                    type="text"
                    name="regJobTitle"
                    id="regJobTitle"
                    autoComplete="off"
                    className="register-input-control"
                    placeholder="e.g. Software Engineer"
                    value={regJobTitle}
                    onChange={(e) => handleFieldChange('regJobTitle', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regJobTitle', e.target.value)}
                  />
                  {regTouched.regJobTitle && !regErrors.regJobTitle && (
                    <CheckCircle2 className="field-status-icon valid" size={16} />
                  )}
                </div>
                {regTouched.regJobTitle && regErrors.regJobTitle && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regJobTitle}</span>
                  </div>
                )}
              </div>

              {/* Account Role Dropdown (Secondary indicator) */}
              <div className="register-field-group">
                <label className="register-field-label">Selected Role</label>
                <div className="register-input-wrapper valid">
                  <UserCheck className="register-field-icon" size={18} />
                  <select
                    className="register-input-control register-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              {/* Password Field */}
              <div className="register-field-group">
                <label className="register-field-label">Password <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regPassword ? (regErrors.regPassword ? 'invalid' : 'valid') : ''}`}>
                  <Lock className="register-field-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="register-input-control"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => handleFieldChange('regPassword', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="register-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="pwd-strength-container">
                    <div className="pwd-strength-header">
                      <span>Password Strength:</span>
                      <span style={{ color: getPasswordStrength(regPassword).color, fontWeight: 700 }}>
                        {getPasswordStrength(regPassword).label}
                      </span>
                    </div>
                    <div className="pwd-strength-track">
                      <div
                        className="pwd-strength-bar"
                        style={{
                          width: `${getPasswordStrength(regPassword).score}%`,
                          backgroundColor: getPasswordStrength(regPassword).color
                        }}
                      />
                    </div>
                  </div>
                )}

                {regTouched.regPassword && regErrors.regPassword && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regPassword}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="register-field-group">
                <label className="register-field-label">Confirm Password <span className="req-star">*</span></label>
                <div className={`register-input-wrapper ${regTouched.regConfirmPassword ? (regErrors.regConfirmPassword ? 'invalid' : 'valid') : ''}`}>
                  <Lock className="register-field-icon" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="register-input-control"
                    placeholder="Confirm your password"
                    value={regConfirmPassword}
                    onChange={(e) => handleFieldChange('regConfirmPassword', e.target.value)}
                    onBlur={(e) => handleFieldBlur('regConfirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="register-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {regConfirmPassword && !regErrors.regConfirmPassword && (
                  <div className="field-validation-msg success">
                    <CheckCircle2 size={13} />
                    <span>Passwords match</span>
                  </div>
                )}
                {regTouched.regConfirmPassword && regErrors.regConfirmPassword && (
                  <div className="field-validation-msg error">
                    <AlertCircle size={13} />
                    <span>{regErrors.regConfirmPassword}</span>
                  </div>
                )}
              </div>
            </div>

            {/* HR Approval Notice Box */}
            <div className="hr-notice-box-enhanced">
              <div className="hr-notice-icon-circle">
                <Info size={20} />
              </div>
              <div className="hr-notice-content">
                <div className="hr-notice-title">HR Verification Required</div>
                <div className="hr-notice-desc">
                  Your registration request will be reviewed by HR. After approval, your official Employee ID will be generated and emailed to you.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="register-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>Submitting Request...</>
              ) : (
                <>Submit Registration <UserPlus size={19} /></>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="register-footer-text">
            Already have an account?
            <button
              type="button"
              className="register-footer-link"
              onClick={() => {
                setError('');
                setSuccess('');
                setActiveView('login');
              }}
            >
              Login Here <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default AuthPage;

