import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Lock, 
  Eye, 
  EyeOff, 
  Info,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('IT & Software');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const departments = [
    'IT & Software',
    'Human Resources',
    'Operations & Facilities',
    'Finance & Accounting',
    'Sales & Marketing',
    'Customer Support'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (fullName.length < 3) {
      setError('Full name must be at least 3 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      setError('Phone number must contain at least 10 digits.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: fullName,
      email,
      phone,
      department,
      password
    };

    const result = await register(payload);

    if (result.success) {
      setSuccess('Registration request submitted! Your account is pending HR review.');
      setSubmitting(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error || result.message || 'Failed to submit registration request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="full-website-page">
      <PublicNavbar />

      <main className="website-hero-section" style={{ minHeight: 'calc(100vh - 80px)', padding: '3rem 1.5rem' }}>
        <div className="hero-background-mesh">
          <div className="glow-orb orb-1" />
          <div className="glow-orb orb-2" />
          <div className="grid-overlay" />
        </div>

        <div className="auth-single-card animate-scale-up" style={{ margin: '0 auto', maxWidth: '840px' }}>
          <div className="auth-header-centered">
            <div className="auth-icon-badge">
              <UserPlus size={26} />
            </div>
            <h1 className="auth-heading">Employee Account Registration</h1>
            <p className="auth-subheading">
              Request access to the Complaint Escalation System. Accounts are reviewed & verified by HR.
            </p>
          </div>

          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="two-column-grid">
              {/* Full Name */}
              <div className="form-group-custom">
                <label className="form-label-custom">Full Name</label>
                <div className="input-icon-wrapper">
                  <User className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group-custom">
                <label className="form-label-custom">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon-left" size={18} />
                  <input
                    type="email"
                    className="form-control-custom"
                    placeholder="Enter your corporate email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group-custom">
                <label className="form-label-custom">Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone className="input-icon-left" size={18} />
                  <input
                    type="tel"
                    className="form-control-custom"
                    placeholder="Enter your contact phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div className="form-group-custom">
                <label className="form-label-custom">Primary Department</label>
                <div className="input-icon-wrapper">
                  <Building className="input-icon-left" size={18} />
                  <select
                    className="form-control-custom"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="form-group-custom">
                <label className="form-label-custom">Password</label>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control-custom"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group-custom">
                <label className="form-label-custom">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control-custom"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* HR Notice Box */}
            <div className="hr-notice-box">
              <Info className="hr-notice-icon" size={20} />
              <span>
                Your registration request will be reviewed by HR. After approval, your official Employee ID will be generated, a Team Leader assigned, and you'll receive notification via email.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-enterprise hero-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting Registration...' : <>Submit Registration Request <UserPlus size={18} /></>}
            </button>
          </form>

          <div className="auth-footer-text">
            Already have an account?
            <Link to="/login" className="auth-footer-link">
              Sign In Here
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Register;
