import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import CountdownTimer from '../components/CountdownTimer';
import API from '../services/api';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Clock, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from 'lucide-react';

const MyComplaints = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Default sample complaints matching reference design if API returns empty
  const defaultComplaintsList = [
    {
      _id: '1',
      complaintId: 'CMP0003',
      subject: 'Salary Not Credited for Current Month',
      category: 'Payroll',
      createdAt: '2026-07-29T09:15:00.000Z',
      teamLeader: 'TL001',
      priority: 'Low',
      status: 'Pending',
      progress: 25,
      leftColor: '#F59E0B'
    },
    {
      _id: '2',
      complaintId: 'CMP0002',
      subject: 'Unable to Access Company ERP System',
      category: 'Software',
      createdAt: '2026-07-23T10:30:00.000Z',
      teamLeader: 'Manager',
      priority: 'Critical',
      status: 'Escalated',
      progress: 75,
      leftColor: '#EF4444'
    },
    {
      _id: '3',
      complaintId: 'CMP0001',
      subject: 'Unable to Access Company Email',
      category: 'Software',
      createdAt: '2026-07-23T09:45:00.000Z',
      teamLeader: 'Manager',
      priority: 'High',
      status: 'Escalated',
      progress: 60,
      leftColor: '#EF4444'
    }
  ];

  const [complaints, setComplaints] = useState(defaultComplaintsList);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get('/complaints/my');
      const data = res.data || {};
      const list = data.complaints || (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        setComplaints(list.map((c, i) => ({
          ...c,
          progress: c.status === 'Resolved' || c.status === 'Closed' ? 100 : c.status === 'In Progress' ? 50 : c.status === 'Escalated' ? 70 : 25,
          leftColor: c.status === 'Escalated' ? '#EF4444' : c.status === 'In Progress' ? '#3B82F6' : c.status === 'Resolved' ? '#16A34A' : '#F59E0B'
        })));
      }
    } catch (err) {
      console.warn('Fetch my complaints notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  // Summary Metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const filtered = complaints.filter(c => 
    (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject || c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="my-complaints" unreadCount={3} />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER + ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              My Complaints
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              View and track all your submitted complaints.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem 0.6rem 2.2rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filter Toggle Button */}
            <button style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.6rem 0.85rem', borderRadius: '10px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
              <Filter size={16} />
            </button>

            {/* + New Complaint Action */}
            <button
              onClick={() => navigate('/raise-complaint')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
              }}
            >
              <Plus size={18} />
              <span>New Complaint</span>
            </button>
          </div>
        </div>

        {/* SUMMARY METRICS BAR (5 COLUMNS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          
          {/* Total */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{totalCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>All complaints</div>
            </div>
          </div>

          {/* Pending */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>Pending</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{pendingCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#D97706' }}>Awaiting review</div>
            </div>
          </div>

          {/* In Progress */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RotateCw size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>In Progress</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#0284C7' }}>Being resolved</div>
            </div>
          </div>

          {/* Escalated */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>Escalated</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{escalatedCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#EF4444' }}>Need attention</div>
            </div>
          </div>

          {/* Resolved */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>Resolved</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{resolvedCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#16A34A' }}>Completed</div>
            </div>
          </div>

        </div>

        {/* COMPLAINTS LIST CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jul 29, 2026 • 09:15 AM';
            
            return (
              <div
                key={item._id || item.complaintId}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: item.status === 'Resolved' ? '2px solid #10B981' : '1px solid #E2E8F0',
                  borderLeft: `5px solid ${item.leftColor || '#F59E0B'}`,
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: item.status === 'Resolved' ? '0 0 10px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(15,23,42,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Left metadata */}
                <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                  {item.status === 'Resolved' && (
                    <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <CheckCircle2 size={18} /> Complaint is resolved (100% Progress)
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                      {item.complaintId}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• {dateStr}</span>
                  </div>

                  <h3 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.85rem 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.subject || item.title}
                  </h3>

                  {(item.status === 'Pending' || item.status === 'Submitted' || item.status === 'In Progress') && item.escalationDeadline && (
                    <div style={{ marginBottom: '0.85rem' }}>
                      <CountdownTimer deadline={item.escalationDeadline} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Assigned To</span>
                      <span style={{ fontWeight: '700', color: '#334155' }}>{item.teamLeader || 'TL001'}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Priority</span>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '1px 8px', 
                        borderRadius: '10px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700',
                        background: item.priority === 'Critical' ? '#FEE2E2' : item.priority === 'High' ? '#FFEDD5' : '#EFF6FF',
                        color: item.priority === 'Critical' ? '#DC2626' : item.priority === 'High' ? '#EA580C' : '#2563EB'
                      }}>
                        {item.priority || 'Medium'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Status</span>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '1px 8px', 
                        borderRadius: '10px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700',
                        background: item.status === 'Escalated' ? '#FEE2E2' : item.status === 'Pending' ? '#FEF3C7' : '#DCFCE7',
                        color: item.status === 'Escalated' ? '#DC2626' : item.status === 'Pending' ? '#D97706' : '#16A34A'
                      }}>
                        {item.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Circular Progress SVG + View Details Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  {/* Progress Donut */}
                  <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                      <circle 
                        cx="28" cy="28" r="22" fill="none" 
                        stroke={item.leftColor || '#F59E0B'} 
                        strokeWidth="5" 
                        strokeDasharray="138" 
                        strokeDashoffset={138 - (138 * (item.progress || 25)) / 100}
                        transform="rotate(-90 28 28)"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800', color: '#0F172A' }}>
                      {item.progress || 25}%
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/complaint-details/${item.complaintId || item._id}`)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '10px',
                      color: '#3B82F6',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  >
                    View Details
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* PAGINATION CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#FFF', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
            1
          </button>
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
        </div>

      </main>
    </div>
  );
};

export default MyComplaints;
