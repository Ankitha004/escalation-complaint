import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { forgotPassword } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const result = await forgotPassword(email);
    setSubmitting(false);

    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.message || 'Failed to send reset link.');
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
              <KeyRound size={26} />
            </div>
            <h1 className="auth-heading">Forgot Password?</h1>
            <p className="auth-subheading">
              Enter your registered corporate email address and we'll send you an instant reset link.
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
            <div className="form-group-custom">
              <label className="form-label-custom">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon-left" size={18} />
                <input
                  type="email"
                  className="form-control-custom"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-enterprise hero-btn"
              disabled={submitting}
            >
              {submitting ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer-text">
            <Link to="/login" className="auth-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ForgotPassword;
