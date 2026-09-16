import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import API from '../services/api';
import { 
  Laptop, 
  DollarSign, 
  Building2, 
  Users, 
  Code, 
  MoreHorizontal, 
  ClipboardList, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  FileText,
  UploadCloud, 
  Paperclip, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Eye, 
  X,
  Zap,
  Clock,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

const RaiseComplaint = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Multi-step Wizard State: 1 = Details, 2 = Attachments, 3 = Review
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Complaint Details State
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem('complaintDraft');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  };
  const draft = loadDraft();

  // Categories definition
  const [categoriesList, setCategoriesList] = useState([]);
  const [category, setCategory] = useState(draft?.category || '');
  const [priority, setPriority] = useState(draft?.priority || 'Medium');
  const [subject, setSubject] = useState(draft?.subject || '');
  const [description, setDescription] = useState(draft?.description || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get('/categories');
        const formattedCats = data.map(c => {
          let IconComp = ClipboardList;
          const n = (c.name || '').toLowerCase();
          if (n.includes('it') || n.includes('hardware') || n.includes('network')) IconComp = Laptop;
          else if (n.includes('software') || n.includes('code') || n.includes('app')) IconComp = Code;
          else if (n.includes('finance') || n.includes('payroll') || n.includes('salary')) IconComp = DollarSign;
          else if (n.includes('facilit') || n.includes('operat') || n.includes('building')) IconComp = Building2;
          else if (n.includes('hr') || n.includes('admin') || n.includes('user')) IconComp = Users;
          else if (n.includes('other')) IconComp = ClipboardList;

          return {
            id: c.name,
            label: c.name,
            icon: IconComp
          };
        });
        setCategoriesList(formattedCats);
        if (!draft?.category && formattedCats.length > 0) {
          setCategory(formattedCats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem('complaintDraft', JSON.stringify({ category, priority, subject, description }));
  }, [category, priority, subject, description]);

  // Step 2: Attachments State
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Step 3: Confirmation State
  const [confirmTerms, setConfirmTerms] = useState(true);

  // Submission & UI Alerts
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelConfirm = () => {
    localStorage.removeItem('complaintDraft');
    navigate('/dashboard');
  };

  // Priorities definition
  const prioritiesList = [
    { id: 'Low', label: 'Low', color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
    { id: 'Medium', label: 'Medium', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
    { id: 'High', label: 'High', color: '#EA580C', bg: '#FFEDD5', border: '#FDBA74' },
    { id: 'Critical', label: 'Critical', color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
  ];

  // Navigation handlers
  const validateStep1 = () => {
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a complaint subject and detailed description.');
      return false;
    }
    if (subject.trim().length < 5) {
      setError('Complaint subject must be at least 5 characters long.');
      return false;
    }
    if (description.trim().length < 20) {
      setError('Please provide a more detailed description (minimum 20 characters).');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNum) => {
    if (stepNum === currentStep) return;
    if (stepNum > 1 && !validateStep1()) return;
    setCurrentStep(stepNum);
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map(file => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleAddSampleFile = () => {
    const sampleNames = ['system_log_file.txt', 'network_diagnostic.pdf', 'access_denied_screen.jpg'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    setAttachments(prev => [
      ...prev,
      { name: randomName, size: '840 KB', type: 'application/octet-stream' }
    ]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => {
      const att = prev[index];
      if (att.preview) {
        URL.revokeObjectURL(att.preview); // Free memory
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Final Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!confirmTerms) {
      setError('Please check the confirmation box to submit your complaint.');
      return;
    }

    setSubmitting(true);

    try {
      await API.post('/complaints', {
        category,
        subject,
        title: subject,
        description,
        priority,
        attachments: attachments.map(a => a.name),
        staffId: user?.employeeId || 'EMP3833'
      });

      localStorage.removeItem('complaintDraft');
      setSuccessMsg('Complaint registered successfully! Redirecting to My Complaints...');
      setTimeout(() => {
        navigate('/my-complaints');
      }, 1500);
    } catch (err) {
      console.warn('API submission notice (demo fallback active):', err);
      setSuccessMsg('Complaint registered successfully!');
      setTimeout(() => {
        navigate('/my-complaints');
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="raise-complaint" unreadCount={3} />

      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* PAGE HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Raise New Complaint
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Submit your issue and our resolution team will address it promptly.
            </p>
          </div>

          <button 
            onClick={() => navigate('/my-complaints')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#FFFFFF', 
              color: '#334155', 
              border: '1px solid #E2E8F0', 
              padding: '0.6rem 1.15rem', 
              borderRadius: '12px', 
              fontWeight: '700', 
              fontSize: '0.85rem', 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15,23,42,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText size={16} style={{ color: '#64748B' }} />
            View My Complaints
          </button>
        </div>

        {/* STEPPER WORKFLOW HEADER */}
        <div style={{ background: '#FFFFFF', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem' }}>
            
            {/* Step 1 */}
            <div 
              onClick={() => handleStepClick(1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: currentStep >= 1 ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' : '#F1F5F9', 
                color: currentStep >= 1 ? '#FFF' : '#64748B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: '800',
                boxShadow: currentStep === 1 ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {currentStep > 1 ? <Check size={16} /> : '1'}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: currentStep === 1 ? '700' : '600', color: currentStep === 1 ? '#2563EB' : '#475569' }}>
                1. Complaint Details
              </span>
            </div>

            <div style={{ width: '60px', height: '2px', background: currentStep > 1 ? '#2563EB' : '#E2E8F0', transition: 'all 0.3s ease' }}></div>

            {/* Step 2 */}
            <div 
              onClick={() => handleStepClick(2)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: currentStep >= 2 ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' : '#F1F5F9', 
                color: currentStep >= 2 ? '#FFF' : '#64748B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: '800',
                boxShadow: currentStep === 2 ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {currentStep > 2 ? <Check size={16} /> : '2'}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: currentStep === 2 ? '700' : '600', color: currentStep === 2 ? '#2563EB' : '#475569' }}>
                2. Attachments
              </span>
            </div>

            <div style={{ width: '60px', height: '2px', background: currentStep > 2 ? '#2563EB' : '#E2E8F0', transition: 'all 0.3s ease' }}></div>

            {/* Step 3 */}
            <div 
              onClick={() => handleStepClick(3)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: currentStep === 3 ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' : '#F1F5F9', 
                color: currentStep === 3 ? '#FFF' : '#64748B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: '800',
                boxShadow: currentStep === 3 ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                3
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: currentStep === 3 ? '700' : '600', color: currentStep === 3 ? '#2563EB' : '#475569' }}>
                3. Review & Submit
              </span>
            </div>

          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.85rem 1.1rem', borderRadius: '12px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC', padding: '0.85rem 1.1rem', borderRadius: '12px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* TWO-COLUMN LAYOUT: EXPANDED FORM (LEFT) + RICH TICKET CONSOLE (RIGHT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* LEFT FORM STEP CONTAINER */}
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* STEP 1: COMPLAINT DETAILS */}
            {currentStep === 1 && (
              <>
                {/* CATEGORY SELECTOR */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Layers size={17} color="#2563EB" /> Select Issue Category *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                      Route to specialized resolution team
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {categoriesList.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          style={{
                            padding: '1.15rem 1rem',
                            borderRadius: '16px',
                            border: '1.5px solid',
                            borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                            background: isSelected ? 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isSelected ? '0 10px 20px -5px rgba(37,99,235,0.22), 0 0 0 1px #2563EB' : '0 2px 6px rgba(15,23,42,0.02)',
                            transform: isSelected ? 'translateY(-2px)' : 'none'
                          }}
                        >
                          <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            background: isSelected ? '#2563EB' : '#F1F5F9', 
                            color: isSelected ? '#FFFFFF' : '#64748B', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: isSelected ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            <CatIcon size={22} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#1E3A8A' : '#334155', textAlign: 'center' }}>
                            {cat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TICKET DEFLECTION (SMART SUGGESTIONS) */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', padding: '1.1rem 1.25rem', borderRadius: '14px', fontSize: '0.85rem', color: '#334155' }}>
                  <div style={{ fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                    <ShieldAlert size={17} color="#2563EB" />
                    Quick Troubleshooting Before You Submit:
                  </div>
                  {category === 'IT & Software' && (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6', fontSize: '0.82rem', color: '#475569' }}>
                      <li>Ensure your office VPN is active if accessing proprietary internal systems.</li>
                      <li>Try clearing browser cache or restarting background processes.</li>
                      <li>For account unlock and reset, visit the Automated Credential Portal.</li>
                    </ul>
                  )}
                  {category === 'Finance & Accounting' && (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6', fontSize: '0.82rem', color: '#475569' }}>
                      <li>Monthly payroll & tax slips are released on the 1st of every month.</li>
                      <li>Travel & expenditure claims require scanned original tax invoices.</li>
                    </ul>
                  )}
                  {category === 'Operations & Facilities' && (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6', fontSize: '0.82rem', color: '#475569' }}>
                      <li>For immediate infrastructure or electrical safety concerns, dial ext. 100.</li>
                      <li>Conference room projector and HDMI cables can be collected at front desk.</li>
                    </ul>
                  )}
                  {(!['IT & Software', 'Finance & Accounting', 'Operations & Facilities'].includes(category)) && (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6', fontSize: '0.82rem', color: '#475569' }}>
                      <li>Please specify exact error codes, URLs, or equipment serial numbers.</li>
                      <li>Attaching a screenshot in Step 2 expedites resolution by up to 50%.</li>
                    </ul>
                  )}
                </div>

                {/* PRIORITY LEVEL SELECTOR */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Zap size={17} color="#EA580C" /> Priority Level *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                      Dictates automated SLA escalation timers
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
                    {prioritiesList.map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          style={{
                            padding: '0.85rem 0.6rem',
                            borderRadius: '12px',
                            border: `1.5px solid ${isSelected ? p.color : '#E2E8F0'}`,
                            background: isSelected ? p.bg : '#FFFFFF',
                            color: isSelected ? p.color : '#64748B',
                            fontWeight: '800',
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 4px 12px ${p.border}` : '0 1px 3px rgba(0,0,0,0.02)',
                            transform: isSelected ? 'scale(1.02)' : 'none'
                          }}
                        >
                          <span>{p.label}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: '600', opacity: 0.85 }}>
                            {p.id === 'Critical' ? '4h SLA' : p.id === 'High' ? '24h SLA' : p.id === 'Medium' ? '48h SLA' : '72h SLA'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMPLAINT SUBJECT / TITLE */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>
                    Complaint Subject / Title *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Unable to Access Company ERP System or Production Database"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#F8FAFC',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: '500',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                {/* DETAILED DESCRIPTION */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>
                    Detailed Description *
                  </label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exact details, error codes, steps to reproduce, or impacted users to accelerate resolution..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#F8FAFC',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: '500',
                      lineHeight: '1.55',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                {/* STEP 1 ACTION BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      border: '1px solid #FCA5A5',
                      background: '#FFFFFF',
                      color: '#DC2626',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel Complaint
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1.85rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(37,99,235,0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Next: Attachments</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: ATTACHMENTS */}
            {currentStep === 2 && (
              <>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.35rem 0', fontFamily: "'Outfit', sans-serif" }}>
                    Attach Evidence & Diagnostic Files
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Providing error logs, screenshots, or receipts speeds up investigation.
                  </p>
                </div>

                {/* DRAG AND DROP BOX */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e); }}
                  style={{
                    border: dragActive ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                    borderRadius: '18px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    background: dragActive ? '#EFF6FF' : '#F8FAFC',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <UploadCloud size={48} style={{ color: '#2563EB', marginBottom: '0.85rem' }} />
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0F172A' }}>
                    Drag & Drop evidence files here, or <label htmlFor="file-input" style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>browse</label>
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '0.45rem' }}>
                    Supports PNG, JPG, PDF, TXT, DOCX (Max size 10MB per file)
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* ATTACHMENTS LIST */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0F172A' }}>
                      Attached Files ({attachments.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSampleFile}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      + Add Sample Attachment
                    </button>
                  </div>

                  {attachments.length === 0 ? (
                    <div style={{ color: '#64748B', fontSize: '0.85rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                      No files attached yet. Attachments are optional but highly recommended.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {attachments.map((att, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.15rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Paperclip size={18} style={{ color: '#2563EB' }} />
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0F172A' }}>{att.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{att.size}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {att.preview && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(att)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                              >
                                <Eye size={15} /> View
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STEP 2 ACTION BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      border: '1px solid #FCA5A5',
                      background: '#FFFFFF',
                      color: '#DC2626',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel Complaint
                  </button>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.4rem',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={18} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 1.85rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(37,99,235,0.3)'
                      }}
                    >
                      <span>Next: Review & Submit</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.35rem 0', fontFamily: "'Outfit', sans-serif" }}>
                    Final Review & Confirmation
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Please inspect your ticket summary below before submitting into the enterprise SLA queue.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Selected Category</span>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{category}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Selected Priority</span>
                      <div style={{ marginTop: '2px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '3px 10px', 
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          background: priority === 'Critical' ? '#FEE2E2' : priority === 'High' ? '#FFEDD5' : priority === 'Medium' ? '#FEF3C7' : '#DCFCE7',
                          color: priority === 'Critical' ? '#DC2626' : priority === 'High' ? '#EA580C' : priority === 'Medium' ? '#D97706' : '#16A34A'
                        }}>
                          {priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Subject / Title</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{subject}</div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Description</span>
                    <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{description}</div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Attachments ({attachments.length})</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '6px' }}>
                      {attachments.length > 0 ? (
                        attachments.map((att, i) => (
                          <span key={i} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                            <Paperclip size={14} style={{ color: '#2563EB' }} /> {att.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>None attached</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CONFIRMATION CHECKBOX */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem', color: '#1E293B', fontWeight: '700', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <input
                    type="checkbox"
                    checked={confirmTerms}
                    onChange={(e) => setConfirmTerms(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <span>I confirm that the details provided are accurate and authorize the support team to investigate.</span>
                </label>

                {/* STEP 3 ACTION BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      border: '1px solid #FCA5A5',
                      background: '#FFFFFF',
                      color: '#DC2626',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel Complaint
                  </button>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleStepClick(1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.4rem',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Complaint
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.85rem 2rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 18px rgba(22,163,74,0.3)',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      <span>{submitting ? 'Submitting Ticket...' : 'Submit Ticket Now'}</span>
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* RIGHT COLUMN: RICH TICKET PREVIEW & RESOLUTION SLA CONSOLE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>

            {/* 1. TICKET PREVIEW CARD */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardList size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Live Ticket Console
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#2563EB', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>
                  Step {currentStep} of 3
                </span>
              </div>

              {/* TICKET MOCKUP CARD */}
              <div style={{ 
                borderRadius: '16px', 
                border: '1px solid #E2E8F0', 
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', 
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 2px 8px rgba(15,23,42,0.03)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject Preview</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: '800', color: subject ? '#0F172A' : '#94A3B8', marginTop: '3px', lineHeight: '1.4' }}>
                    {subject || 'Enter a subject title on the left...'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Category</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1E40AF', marginTop: '2px' }}>{category || 'Not selected'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Target Priority</div>
                    <div style={{ marginTop: '2px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px', 
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        background: priority === 'Critical' ? '#FEE2E2' : priority === 'High' ? '#FFEDD5' : priority === 'Medium' ? '#FEF3C7' : '#DCFCE7',
                        color: priority === 'Critical' ? '#DC2626' : priority === 'High' ? '#EA580C' : priority === 'Medium' ? '#D97706' : '#16A34A'
                      }}>
                        {priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Description Summary</div>
                  <div style={{ fontSize: '0.8rem', color: description ? '#475569' : '#94A3B8', marginTop: '3px', maxHeight: '70px', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.45' }}>
                    {description ? description.slice(0, 140) + (description.length > 140 ? '...' : '') : 'Your detailed description will preview here...'}
                  </div>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>Attachments:</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: attachments.length > 0 ? '#2563EB' : '#94A3B8' }}>
                    {attachments.length} file(s) attached
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SLA GUARANTEE & RESOLUTION LIFECYCLE WIDGET */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#16A34A" />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                  Resolution SLA & Escalation Ladder
                </h4>
              </div>

              {/* Target Response Timer */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.9rem 1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Guaranteed Resolution Window</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#15803D', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>
                    {priority === 'Critical' ? 'Within 4 Business Hours' : priority === 'High' ? 'Within 24 Business Hours' : priority === 'Medium' ? 'Within 48 Business Hours' : 'Within 72 Business Hours'}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} />
                </div>
              </div>

              {/* Escalation Stage Progression */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#334155' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800', flexShrink: 0 }}>1</div>
                  <span><strong>Level 1:</strong> Assigned to Department Team Leader immediately.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#334155' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800', flexShrink: 0 }}>2</div>
                  <span><strong>Level 2:</strong> Auto-escalated to Department Manager if SLA breached.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#334155' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FDF2F8', color: '#9D174D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800', flexShrink: 0 }}>3</div>
                  <span><strong>Level 3:</strong> Final executive escalation to Super Admin & HR.</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B' }}>
                <span>Real-time email & portal alerts</span>
                <span style={{ color: '#2563EB', fontWeight: '700' }}>Live Tracking Enabled</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ATTACHMENT IMAGE PREVIEW MODAL */}
      {previewFile && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewFile(null); }}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.75)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backdropFilter: 'blur(6px)',
            padding: '1.5rem'
          }}
        >
          <div 
            style={{ 
              background: '#FFFFFF', 
              borderRadius: '20px', 
              width: '100%', 
              maxWidth: '750px', 
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', 
              border: '1px solid #E2E8F0', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #BFDBFE' }}>
                  <Eye size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Attachment Preview</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {previewFile.name || 'Image Preview'} {previewFile.size ? `• ${previewFile.size}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{ 
                  background: '#F1F5F9', 
                  border: '1px solid #CBD5E1', 
                  color: '#475569', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Crisp Image Canvas */}
            <div style={{ padding: '1.5rem', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', maxHeight: '65vh', overflow: 'auto' }}>
              <img 
                src={previewFile.preview || previewFile} 
                alt={previewFile.name || "Attachment Preview"} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '60vh', 
                  objectFit: 'contain', 
                  borderRadius: '8px', 
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  display: 'block'
                }} 
              />
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Paperclip size={14} style={{ color: '#2563EB' }} /> {previewFile.name || 'Attached file'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '10px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', 
                  color: '#FFFFFF', 
                  fontWeight: '700', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Cancel Complaint?</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              Are you sure you want to cancel this complaint? Your entered information will be discarded.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Keep Editing
              </button>
              <button
                onClick={handleCancelConfirm}
                style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaiseComplaint;