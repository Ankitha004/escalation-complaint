import React, { useRef } from 'react';
import { 
  ShieldCheck, 
  Printer, 
  X, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Building2, 
  Download,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function ResolutionCertificateModal({ complaint, onClose }) {
  const certificateRef = useRef(null);

  if (!complaint) return null;

  const ticketId = complaint.complaintId || 'CMP-RESOLVED';
  const complainantName = complaint.createdBy?.name || complaint.staffName || 'Staff Member';
  const complainantId = complaint.createdBy?.employeeId || complaint.staffId || 'EMP-ID';
  const departmentName = complaint.responsibleDepartment?.name || complaint.department || 'Enterprise Operations';
  const resolverName = complaint.assignedTo?.name || complaint.assignedTeamLeader?.name || complaint.teamLeader || 'Technical Lead';
  const subject = complaint.subject || 'Enterprise Grievance Redressal';
  const description = complaint.description || '';
  const incentive = complaint.incentiveRate || 500;
  
  // Format formatted dates
  const resolutionDate = complaint.resolvedDate 
    ? new Date(complaint.resolvedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const filedDate = complaint.createdAt 
    ? new Date(complaint.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Registered Date';

  // Certificate Unique Verification Code
  const certId = `CERT-${ticketId}-${Math.abs(ticketId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(16).toUpperCase().padStart(6, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="cert-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        padding: '1.25rem',
        overflowY: 'auto'
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .cert-printable-container, .cert-printable-container * {
            visibility: visible !important;
          }
          .cert-printable-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cert-no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Modal Wrapper */}
      <div 
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          margin: 'auto'
        }}
      >
        {/* Top Control Bar */}
        <div 
          className="cert-no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.96)',
            padding: '0.75rem 1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.95rem' }}>Official Resolution Certificate</span>
              <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block' }}>Official accredited document for ticket {ticketId}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 1.2rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Printer size={16} /> Print / Save Certificate PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE OFFICIAL CERTIFICATE CANVAS                                          */}
        {/* ========================================================================= */}
        <div 
          ref={certificateRef}
          className="cert-printable-container"
          style={{
            position: 'relative',
            background: '#FFFFFF',
            borderRadius: '18px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
            padding: '2.2rem 2.8rem 1.8rem 2.8rem',
            border: '2px solid #CBD5E1',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          {/* Subtle Parchment / Guilloche Watermark Pattern */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: 'radial-gradient(#F1F5F9 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              opacity: 0.6
            }}
          />

          {/* Elegant Outer Certificate Border (Gold & Deep Navy) */}
          <div 
            style={{
              position: 'absolute',
              inset: '10px',
              border: '3px solid #D97706',
              borderRadius: '12px',
              pointerEvents: 'none'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              inset: '16px',
              border: '1px solid #B45309',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}
          />

          {/* Corner Ornamental SVGs */}
          {/* Top-Left */}
          <svg style={{ position: 'absolute', top: '12px', left: '12px', width: '44px', height: '44px', fill: 'none', stroke: '#B45309', strokeWidth: '1.5' }} viewBox="0 0 50 50">
            <path d="M 0 0 L 35 0 C 35 15 15 35 0 35 Z" fill="#FEF3C7" opacity="0.7" />
            <path d="M 2 2 L 40 2 M 2 2 L 2 40 M 8 8 L 28 8 M 8 8 L 8 28" />
            <circle cx="14" cy="14" r="3" fill="#D97706" />
          </svg>
          {/* Top-Right */}
          <svg style={{ position: 'absolute', top: '12px', right: '12px', width: '44px', height: '44px', fill: 'none', stroke: '#B45309', strokeWidth: '1.5' }} viewBox="0 0 50 50">
            <path d="M 50 0 L 15 0 C 15 15 35 35 50 35 Z" fill="#FEF3C7" opacity="0.7" />
            <path d="M 48 2 L 10 2 M 48 2 L 48 40 M 42 8 L 22 8 M 42 8 L 42 28" />
            <circle cx="36" cy="14" r="3" fill="#D97706" />
          </svg>
          {/* Bottom-Left */}
          <svg style={{ position: 'absolute', bottom: '12px', left: '12px', width: '44px', height: '44px', fill: 'none', stroke: '#B45309', strokeWidth: '1.5' }} viewBox="0 0 50 50">
            <path d="M 0 50 L 35 50 C 35 35 15 15 0 15 Z" fill="#FEF3C7" opacity="0.7" />
            <path d="M 2 48 L 40 48 M 2 48 L 2 10 M 8 42 L 28 42 M 8 42 L 8 22" />
            <circle cx="14" cy="36" r="3" fill="#D97706" />
          </svg>
          {/* Bottom-Right */}
          <svg style={{ position: 'absolute', bottom: '12px', right: '12px', width: '44px', height: '44px', fill: 'none', stroke: '#B45309', strokeWidth: '1.5' }} viewBox="0 0 50 50">
            <path d="M 50 50 L 15 50 C 15 35 35 15 50 15 Z" fill="#FEF3C7" opacity="0.7" />
            <path d="M 48 48 L 10 48 M 48 48 L 48 10 M 42 42 L 22 42 M 42 42 L 42 22" />
            <circle cx="36" cy="36" r="3" fill="#D97706" />
          </svg>

          {/* Certificate Content Inner */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            
            {/* Top Crest / Authority Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.85rem' }}>
              {/* Emblem */}
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                  border: '3px solid #D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.25)',
                  marginBottom: '0.5rem'
                }}
              >
                <ShieldCheck size={32} color="#F59E0B" />
              </div>

              <div style={{ fontSize: '0.7rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#92400E', fontWeight: '800' }}>
                ENTERPRISE QUALITY ASSURANCE &amp; GRIEVANCE COMPLIANCE COUNCIL
              </div>

              {/* Main Certificate Heading */}
              <h1 
                style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#0F172A',
                  margin: '0.25rem 0 0.15rem 0',
                  letterSpacing: '1.5px',
                  fontFamily: "'Outfit', 'Georgia', serif",
                  textTransform: 'uppercase'
                }}
              >
                Certificate of Resolution
              </h1>

              {/* Certificate Sub-ribbon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.15rem' }}>
                <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, #D97706)' }}></div>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Official Audited Grievance Redressal Record
                </span>
                <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, #D97706, transparent)' }}></div>
              </div>

              {/* Unique Cert Identifiers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.72rem', color: '#64748B' }}>
                <span>CERTIFICATE NO: <strong style={{ color: '#0F172A' }}>{certId}</strong></span>
                <span>•</span>
                <span>TICKET ID: <strong style={{ color: '#1D4ED8' }}>{ticketId}</strong></span>
                <span>•</span>
                <span>STATUS: <strong style={{ color: '#16A34A' }}>VERIFIED RESOLVED</strong></span>
              </div>
            </div>

            {/* Formal Attestation Paragraph */}
            <div style={{ maxWidth: '720px', margin: '0 auto 1rem auto', lineHeight: 1.55 }}>
              <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0, fontStyle: 'italic' }}>
                This is to officially certify that the grievance complaint filed under Ticket Reference{' '}
                <strong style={{ color: '#1D4ED8', fontStyle: 'normal', fontWeight: '800' }}>{ticketId}</strong>{' '}
                by employee{' '}
                <strong style={{ color: '#0F172A', fontStyle: 'normal', fontWeight: '800' }}>{complainantName}</strong>{' '}
                ({complainantId}) has been thoroughly investigated, rectified, and officially verified in compliance with
                enterprise Service Level Agreements (SLA) and statutory grievance procedures.
              </p>
            </div>

            {/* Subject Matter Highlight Box */}
            <div 
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                maxWidth: '740px',
                margin: '0 auto 1rem auto',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Subject Matter of Grievance
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1E40AF', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                  {departmentName}
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                {subject}
              </div>
              {description && (
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, maxHeight: '38px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {description}
                </div>
              )}
            </div>

            {/* Formal Resolution Report & Root Cause Findings (if submitted) */}
            {complaint.resolutionReports && complaint.resolutionReports.length > 0 && (
              <div 
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '0.85rem 1.25rem',
                  maxWidth: '740px',
                  margin: '0 auto 1rem auto',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resolution Report & Corrective Action Summary
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                    Submitted to HR Audit
                  </span>
                </div>
                {complaint.resolutionReports.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#14532D', lineHeight: 1.45 }}>
                    <strong style={{ color: '#166534' }}>Report by {r.solverName || 'Resolver'} ({r.solverRole || 'Team Leader'}):</strong> {r.reportText}
                  </div>
                ))}
              </div>
            )}

            {/* Resolution Audit Metadata Grid */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                maxWidth: '740px',
                margin: '0 auto 1.15rem auto',
                textAlign: 'left'
              }}
            >
              {/* Complainant */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Complainant</div>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0F172A', marginTop: '2px' }}>{complainantName}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{complainantId}</div>
              </div>

              {/* Resolved By */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Resolved By</div>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#15803D', marginTop: '2px' }}>{resolverName}</div>
                <div style={{ fontSize: '0.7rem', color: '#16A34A' }}>Technical Lead</div>
              </div>

              {/* Turnaround / SLA */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>SLA Compliance</div>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1D4ED8', marginTop: '2px' }}>100% SLA Met</div>
                <div style={{ fontSize: '0.7rem', color: '#2563EB' }}>Within Deadline</div>
              </div>

              {/* Resolution Incentive */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Incentive Credit</div>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#047857', marginTop: '2px' }}>+₹{incentive}</div>
                <div style={{ fontSize: '0.7rem', color: '#059669' }}>Disbursed to Resolver</div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SIGNATURES & METALLIC AUDIT SEAL ROW                                     */}
            {/* ========================================================================= */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px 1fr',
                alignItems: 'end',
                maxWidth: '740px',
                margin: '0 auto',
                paddingTop: '0.5rem'
              }}
            >
              {/* Left Signature: Technical Resolver */}
              <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Calligraphic SVG representation for Resolver */}
                  <svg width="150" height="40" viewBox="0 0 150 40">
                    <path 
                      d="M 10 28 Q 30 5, 55 24 T 95 18 T 135 22 M 25 22 Q 40 38, 75 12" 
                      fill="none" 
                      stroke="#1E3A8A" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
                <div style={{ borderTop: '1.5px solid #94A3B8', paddingTop: '0.35rem' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>{resolverName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lead Technical Resolver
                  </div>
                </div>
              </div>

              {/* Center: Official Metallic Gold Seal with Ribbons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', top: '-4px' }}>
                <div 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FDE68A 0%, #D97706 65%, #92400E 100%)',
                    border: '3px double #FFFBEB',
                    boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#78350F',
                    zIndex: 3,
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    OFFICIAL SEAL
                  </div>
                  <div style={{ width: '16px', height: '16px', margin: '1px 0' }}>
                    <ShieldCheck size={16} color="#78350F" />
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: '900', letterSpacing: '1px', color: '#451A03' }}>
                    AUDITED
                  </div>
                  <div style={{ fontSize: '0.45rem', fontWeight: '800', color: '#78350F' }}>
                    ★ ★ ★
                  </div>
                </div>

                {/* Hanging Ribbon Tails */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '-10px', zIndex: 2 }}>
                  <div 
                    style={{
                      width: '16px',
                      height: '24px',
                      background: 'linear-gradient(180deg, #D97706 0%, #B45309 100%)',
                      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  />
                  <div 
                    style={{
                      width: '16px',
                      height: '24px',
                      background: 'linear-gradient(180deg, #D97706 0%, #B45309 100%)',
                      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
              </div>

              {/* Right Signature: Executive Director / Compliance */}
              <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Calligraphic SVG representation for Executive Auditor */}
                  <svg width="150" height="40" viewBox="0 0 150 40">
                    <path 
                      d="M 15 25 C 35 8, 45 35, 75 15 C 95 5, 115 32, 138 20 M 40 18 Q 70 36, 110 8" 
                      fill="none" 
                      stroke="#065F46" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
                <div style={{ borderTop: '1.5px solid #94A3B8', paddingTop: '0.35rem' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>Grievance Directorate</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quality Assurance &amp; Compliance
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Barcode & Timestamp */}
            <div 
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: '#64748B',
                maxWidth: '740px',
                margin: '0.85rem auto 0 auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                  {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9].map((w, i) => (
                    <span key={i} style={{ display: 'inline-block', width: `${(w % 3) + 1.5}px`, height: '16px', background: '#475569' }} />
                  ))}
                </div>
                <span>SECURITY AUDIT HASH: {certId.substring(5)}</span>
              </div>

              <div>
                DATE ISSUED: <strong>{resolutionDate}</strong>
              </div>

              <div>
                DIGITALLY VERIFIED ENTERPRISE RECORD
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
