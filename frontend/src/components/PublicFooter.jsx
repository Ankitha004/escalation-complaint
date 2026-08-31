import React from 'react';
import { ShieldCheck, Lock, Activity, Heart, ExternalLink } from 'lucide-react';

const PublicFooter = () => {
  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div className="footer-grid">
          {/* COLUMN 1: BRAND */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="footer-brand-icon">
                <ShieldCheck size={20} />
              </div>
              <span className="footer-brand-text">ComplaintPortal</span>
            </div>
            <p className="footer-desc">
              Automated multi-level SLA escalation engine designed for rapid complaint resolution, 100% operational transparency, and enterprise governance.
            </p>
            <div className="footer-badges">
              <div className="footer-badge">
                <Lock size={12} /> SOC2 Type II SLA Compliant
              </div>
              <div className="footer-badge">
                <Activity size={12} color="#10B981" /> 24/7 Automated Cron Active
              </div>
            </div>
          </div>

          {/* COLUMN 2: ARCHITECTURE & MODULES */}
          <div className="footer-col">
            <div className="footer-heading">Escalation Engine</div>
            <ul className="footer-links">
              <li><span className="footer-dot" /> Level 1: Staff Complaint Ticket</li>
              <li><span className="footer-dot" /> Level 2: Team Leader Resolution</li>
              <li><span className="footer-dot" /> Level 3: Manager SLA Re-assignment</li>
              <li><span className="footer-dot" /> Level 4: HR Audit</li>
            </ul>
          </div>

          {/* COLUMN 3: DEPARTMENTS */}
          <div className="footer-col">
            <div className="footer-heading">Supported Departments</div>
            <ul className="footer-links">
              <li><span className="footer-dot" /> IT & Software Operations</li>
              <li><span className="footer-dot" /> Human Resources & Payroll</li>
              <li><span className="footer-dot" /> Facilities & Workplace</li>
              <li><span className="footer-dot" /> Finance & Accounting</li>
            </ul>
          </div>

          {/* COLUMN 4: ENTERPRISE METRICS */}
          <div className="footer-col">
            <div className="footer-heading">System Metrics</div>
            <div className="footer-metric-card">
              <div className="metric-val">99.8%</div>
              <div className="metric-lbl">Target Resolution Compliance</div>
            </div>
            <div className="footer-metric-card" style={{ marginTop: '0.65rem' }}>
              <div className="metric-val">&lt; 24h</div>
              <div className="metric-lbl">Average Ticket Lifecycle</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © {new Date().getFullYear()} ComplaintPortal Enterprise v2.4 • Automated Escalation System. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <span className="footer-sub-link">SLA Terms</span>
            <span className="footer-sub-link">Security</span>
            <span className="footer-sub-link">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
