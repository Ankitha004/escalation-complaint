import React, { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(token, newPassword);
    setSubmitting(false);

    if (result.success) {
      setMessage(result.message);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setError(result.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="full-website-page">
      <PublicNavbar />

      <main className="website-hero-section" style={{ minHeight: 'calc(100vh - 80px)', padding: '4rem 1.5rem' }}>
        <div className="hero-background-mesh">
          <div className="glow-orb orb-1" />
          <div className="glow-orb orb-2" />
          <div className="grid-overlay" />
        </div>

        <div className="auth-single-card auth-card-small animate-scale-up" style={{ margin: '0 auto' }}>
          <div className="auth-header-centered">
            <div className="auth-icon-badge">
              <Lock size={26} />
            </div>
            <h1 className="auth-heading">Reset Account Password</h1>
            <p className="auth-subheading">
              Enter your new secret password below to secure your portal account.
            </p>
          </div>

          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="form-group-custom">
              <label className="form-label-custom">New Password</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control-custom"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm New Password */}
            <div className="form-group-custom">
              <label className="form-label-custom">Confirm New Password</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control-custom"
                  placeholder="Confirm new password"
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

            <button
              type="submit"
              className="btn-primary-enterprise hero-btn"
              disabled={submitting}
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer-text">
            Remembered your password?
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

export default ResetPassword;
