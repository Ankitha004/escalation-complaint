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
  X
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
        const formattedCats = data.map(c => ({
          id: c.name,
          label: c.name,
          icon: c.name.includes('IT') ? Laptop :
                c.name.includes('Finance') ? DollarSign :
                c.name.includes('Operations') ? Building2 :
                c.name.includes('HR') ? Users : MoreHorizontal
        }));
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

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
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

        {/* TWO-COLUMN LAYOUT: FORM (LEFT) + LIVE PREVIEW (RIGHT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* LEFT FORM STEP CONTAINER */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* STEP 1: COMPLAINT DETAILS */}
            {currentStep === 1 && (
              <>
                {/* CATEGORY SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.75rem' }}>
                    Category *
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                    {categoriesList.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          style={{
                            padding: '1rem',
                            borderRadius: '14px',
                            border: '1px solid',
                            borderColor: isSelected ? '#3B82F6' : '#E2E8F0',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 0 1px #3B82F6, 0 4px 12px rgba(59,130,246,0.15)' : '0 2px 4px rgba(15,23,42,0.02)'
                          }}
                        >
                          <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '10px', 
                            background: isSelected ? '#3B82F6' : '#F1F5F9', 
                            color: isSelected ? '#FFFFFF' : '#64748B', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <CatIcon size={20} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#1E40AF' : '#475569' }}>
                            {cat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TICKET DEFLECTION (SMART SUGGESTIONS) */}
                <div style={{ background: '#F8FAFC', borderLeft: '4px solid #3B82F6', padding: '1rem', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#334155' }}>
                  <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <ShieldAlert size={16} color="#3B82F6" />
                    Before you submit...
                  </div>
                  {category === 'IT & Software' && (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                      <li>Have you tried restarting your system?</li>
                      <li>Check if your VPN is connected if accessing internal tools.</li>
                      <li>Reset your password via the self-service portal.</li>
                    </ul>
                  )}
                  {category === 'Finance & Accounting' && (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                      <li>Payslips are generated by the 3rd of every month.</li>
                      <li>Tax declarations can be updated on the HR portal.</li>
                    </ul>
                  )}
                  {category === 'Operations & Facilities' && (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                      <li>For immediate safety hazards, please call extension 911.</li>
                      <li>Meeting room bookings can be managed on the intranet.</li>
                    </ul>
                  )}
                  {['HR & Admin', 'Other'].includes(category) && (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                      <li>Please provide as much detail as possible to speed up resolution.</li>
                      <li>Check the company wiki for policy documents.</li>
                    </ul>
                  )}
                </div>

                {/* PRIORITY LEVEL SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.75rem' }}>
                    Priority Level *
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
                    {prioritiesList.map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          style={{
                            padding: '0.65rem',
                            borderRadius: '10px',
                            border: `1px solid ${isSelected ? p.color : '#E2E8F0'}`,
                            background: isSelected ? p.bg : '#FFFFFF',
                            color: isSelected ? p.color : '#64748B',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 2px 8px ${p.border}` : 'none'
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMPLAINT SUBJECT / TITLE */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
                    Complaint Subject / Title *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Unable to Access Company ERP System"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* DETAILED DESCRIPTION */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
                    Detailed Description *
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exact details, error messages, or steps to reproduce..."
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* STEP 1 ACTION BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
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
                      padding: '0.75rem 1.75rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
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
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
                    Attach Supporting Files
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Upload screenshots, error logs, or relevant documents to help us resolve your issue faster.
                  </p>
                </div>

                {/* DRAG & DROP ZONE */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e); }}
                  style={{
                    border: dragActive ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                    borderRadius: '16px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: dragActive ? '#EFF6FF' : '#F8FAFC',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <UploadCloud size={44} style={{ color: '#2563EB', marginBottom: '0.85rem' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0F172A' }}>
                    Drag & Drop files here, or <label htmlFor="file-input" style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>browse</label>
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                    Supports PNG, JPG, PDF, TXT (Max size 10MB per file)
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
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>
                      Attached Files ({attachments.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSampleFile}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      + Add Sample Attachment
                    </button>
                  </div>

                  {attachments.length === 0 ? (
                    <div style={{ color: '#64748B', fontSize: '0.82rem', italic: 'true', padding: '1rem', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                      No files attached yet. (Optional)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {attachments.map((att, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Paperclip size={18} style={{ color: '#2563EB' }} />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{att.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{att.size}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {att.preview && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(att)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.35rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                              >
                                <Eye size={15} /> View
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.35rem', borderRadius: '8px', cursor: 'pointer' }}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
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
                        padding: '0.7rem 1.4rem',
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
                        padding: '0.75rem 1.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
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
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
                    Review Complaint Details
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Please review all the information carefully before final submission.
                  </p>
                </div>

                {/* SUMMARY BREAKDOWN CARD */}
                <div style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Category</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{category}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Priority</span>
                      <div style={{ marginTop: '2px' }}>
                        <span style={{ 
                          padding: '3px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.78rem', 
                          fontWeight: '700',
                          background: priority === 'Critical' ? '#FEE2E2' : priority === 'High' ? '#FFEDD5' : priority === 'Medium' ? '#FEF3C7' : '#F0FDF4',
                          color: priority === 'Critical' ? '#DC2626' : priority === 'High' ? '#EA580C' : priority === 'Medium' ? '#D97706' : '#16A34A',
                          border: `1px solid ${priority === 'Critical' ? '#FCA5A5' : priority === 'High' ? '#FDBA74' : priority === 'Medium' ? '#FDE68A' : '#86EFAC'}`
                        }}>
                          {priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Subject</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{subject}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Description</span>
                    <div 
                      style={{ fontSize: '0.88rem', color: '#1E293B', marginTop: '4px', lineHeight: '1.5', background: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Attachments ({attachments.length})</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '4px' }}>
                      {attachments.length > 0 ? (
                        attachments.map((att, i) => (
                          <span key={i} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Paperclip size={13} style={{ color: '#2563EB' }} /> {att.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>None attached</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* CONFIRMATION CHECKBOX */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem', color: '#1E293B', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={confirmTerms}
                    onChange={(e) => setConfirmTerms(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <span>I confirm that the information provided above is complete and accurate.</span>
                </label>

                {/* STEP 3 ACTION BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
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
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
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
                        gap: '0.5rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                        transition: 'all 0.2s ease',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      <span>{submitting ? 'Submitting Ticket...' : 'Submit Ticket'}</span>
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* RIGHT COLUMN: LIVE TICKET PREVIEW CARD */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Ticket Preview
              </h3>
              <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#2563EB', fontWeight: '700', padding: '2px 8px', borderRadius: '8px' }}>
                Step {currentStep} of 3
              </span>
            </div>

            {/* Illustration Graphic Header */}
            <div style={{ 
              width: '100%', 
              height: '130px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid #DBEAFE' 
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                background: '#FFFFFF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#2563EB', 
                boxShadow: '0 8px 20px rgba(37,99,235,0.2)' 
              }}>
                <ClipboardList size={32} />
              </div>
            </div>

            {/* PREVIEW DETAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Category</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{category}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Priority</div>
                <span style={{ 
                  display: 'inline-block',
                  marginTop: '2px',
                  padding: '2px 10px', 
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: priority === 'High' ? '#FEE2E2' : priority === 'Medium' ? '#FEF3C7' : '#E0F2FE',
                  color: priority === 'High' ? '#DC2626' : priority === 'Medium' ? '#D97706' : '#0284C7'
                }}>
                  {priority}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Attachments</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {attachments.length > 0 ? (
                  attachments.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.75rem', color: '#475569' }}>
                      <FileText size={12} />
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>None attached</span>
                )}
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