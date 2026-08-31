import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Layers, 
  Activity, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  X,
  Clock,
  TrendingUp,
  CheckCircle2,
  Lock
} from 'lucide-react';

const PublicNavbar = () => {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const handleOpenMatrix = () => {
    setModalContent('matrix');
    setModalOpen(true);
  };

  const handleOpenFeatures = () => {
    setModalContent('features');
    setModalOpen(true);
  };

  return (
    <>
      <header className="public-navbar">
        <div className="public-nav-container">
          {/* BRAND LOGO */}
          <Link to="/login" className="public-nav-brand">
            <div className="public-brand-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="public-brand-title">
                Complaint<span className="gradient-text">Portal</span>
              </div>
              <div className="public-brand-subtitle">
                AUTOMATED ESCALATION OS
              </div>
            </div>
          </Link>

          {/* NAV LINKS */}
          <nav className="public-nav-links">
            <button onClick={handleOpenFeatures} className="public-nav-item">
              <Sparkles size={16} color="#8B5CF6" />
              <span>Features</span>
            </button>
            <button onClick={handleOpenMatrix} className="public-nav-item">
              <Layers size={16} color="#3B82F6" />
              <span>SLA Escalation Matrix</span>
            </button>
            <div className="public-nav-item readonly">
              <Building2 size={16} color="#10B981" />
              <span>6 Active Depts</span>
            </div>
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="public-nav-actions">
            <div className="system-status-chip">
              <span className="pulse-dot pulse-dot-emerald" />
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10B981' }}>
                99.9% Uptime SLA
              </span>
            </div>

            {location.pathname === '/register' ? (
              <Link to="/login" className="btn-nav-action primary">
                Sign In
              </Link>
            ) : (
              <Link to="/register" className="btn-nav-action outline">
                Register Account <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* INTERACTIVE FEATURE MODAL */}
      {modalOpen && (
        <div className="public-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="public-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <button className="public-modal-close" onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>

            {modalContent === 'matrix' ? (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(79, 70, 229, 0.12)', color: '#6366F1', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '1rem' }}>
                  <Layers size={14} /> Multi-Tier SLA Escalation Protocol
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  How Automated Escalations Work
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  Our smart cron engine continuously calculates resolution countdown timers based on complaint severity and department SLAs.
                </p>

                <div className="modal-matrix-steps">
                  <div className="matrix-step-item">
                    <div className="step-num">01</div>
                    <div>
                      <div className="step-title">Staff Complaint Submission</div>
                      <div className="step-desc">Ticket created with SLA countdown timer & automatic department routing.</div>
                    </div>
                  </div>

                  <div className="matrix-step-item">
                    <div className="step-num">02</div>
                    <div>
                      <div className="step-title">Team Leader Assignment (Level 1)</div>
                      <div className="step-desc">Assigned Team Leader receives instant alert to resolve within assigned window.</div>
                    </div>
                  </div>

                  <div className="matrix-step-item highlight">
                    <div className="step-num">03</div>
                    <div>
                      <div className="step-title">Auto-Escalation to Department Manager (Level 2)</div>
                      <div className="step-desc">If SLA expires, system automatically reassigns ticket to Department Manager.</div>
                    </div>
                  </div>

                  <div className="matrix-step-item warning">
                    <div className="step-num">04</div>
                    <div>
                      <div className="step-title">HR Escalation Audit (Level 3)</div>
                      <div className="step-desc">Critical breach triggers HR oversight to enforce accountability & resolution.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139, 92, 246, 0.12)', color: '#A78BFA', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '1rem' }}>
                  <Sparkles size={14} /> Platform Capabilities
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Next-Gen Enterprise Features
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Built for speed, transparency, and bulletproof operational governance.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="modal-feature-box">
                    <Clock size={22} color="#60A5FA" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>Real-time Countdown</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Live SLA tracking with automated minute-by-minute evaluation.</div>
                  </div>

                  <div className="modal-feature-box">
                    <TrendingUp size={22} color="#34D399" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>Role-Based Dashboards</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Customized interfaces for Staff, TLs, Managers, and HR.</div>
                  </div>

                  <div className="modal-feature-box">
                    <Lock size={22} color="#F472B6" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>Immutable Audit Logs</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Every status update & escalation step is permanently logged.</div>
                  </div>

                  <div className="modal-feature-box">
                    <CheckCircle2 size={22} color="#FBBF24" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>HR Approval Engine</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Automated employee registration review & department assignments.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PublicNavbar;
