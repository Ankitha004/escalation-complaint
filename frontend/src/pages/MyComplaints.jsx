import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Inbox,
  ArrowRight,
  Tag
} from 'lucide-react';

const MyComplaints = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

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

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get('/complaints/my');
      const data = res.data || {};
      const list = data.complaints || (Array.isArray(data) ? data : []);
      setComplaints(list.map((c) => {
        let progress = 25;
        let leftColor = '#F59E0B';

        if (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved') {
          progress = 100;
          leftColor = '#16A34A';
        } else if (c.status === 'Pending HR Review' || c.status === 'Pending HR Approval') {
          progress = 90; // Complaint is resolved by TL/Manager, awaiting HR final sign-off
          leftColor = '#8B5CF6';
        } else if (c.status === 'Escalated' || c.status === 'Escalated to Super Admin' || c.escalated) {
          progress = 70;
          leftColor = '#EF4444';
        } else if (c.status === 'In Progress' || c.status === 'Waiting on User') {
          progress = 50;
          leftColor = '#3B82F6';
        } else {
          progress = 25;
          leftColor = '#F59E0B';
        }

        return {
          ...c,
          progress,
          leftColor
        };
      }));
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
  const inProgressCount = complaints.filter(c => ['In Progress', 'Waiting on User', 'Pending HR Review', 'Pending HR Approval'].includes(c.status)).length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated' || c.status === 'Escalated to Super Admin' || c.escalated).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed', 'Approved'].includes(c.status)).length;

  // Extract unique categories dynamically
  const availableCategories = Array.from(new Set(complaints.map(c => c.category).filter(Boolean)));

  // Multi-dimensional filtering logic
  const filtered = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.complaintId || '').toLowerCase().includes(q) ||
      (c.subject || c.title || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.priority || '').toLowerCase().includes(q) ||
      (c.teamLeader || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' 
      ? true 
      : statusFilter === 'Pending'
        ? (c.status === 'Pending' || c.status === 'Submitted')
        : statusFilter === 'In Progress'
          ? (['In Progress', 'Waiting on User', 'Pending HR Review', 'Pending HR Approval'].includes(c.status))
          : statusFilter === 'Escalated'
            ? (c.status === 'Escalated' || c.status === 'Escalated to Super Admin' || c.escalated)
            : (['Resolved', 'Closed', 'Approved'].includes(c.status));

    const matchesPriority = priorityFilter === 'All' ? true : c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' ? true : c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    if (sortBy === 'newest') return dateB - dateA;
    if (sortBy === 'oldest') return dateA - dateB;
    if (sortBy === 'priority') {
      const pWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    return 0;
  });

  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (priorityFilter !== 'All' ? 1 : 0) + (categoryFilter !== 'All' ? 1 : 0) + (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="my-complaints" unreadCount={3} />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER + ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              My Complaints
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              View, search, filter, and track all your submitted complaints.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by ID, subject, category..."
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '2px',
                    display: 'flex'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              style={{ 
                background: showFilterPanel || activeFilterCount > 0 ? '#EFF6FF' : '#FFFFFF', 
                border: showFilterPanel || activeFilterCount > 0 ? '1px solid #3B82F6' : '1px solid #E2E8F0', 
                padding: '0.6rem 0.95rem', 
                borderRadius: '10px', 
                color: showFilterPanel || activeFilterCount > 0 ? '#2563EB' : '#475569', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                fontSize: '0.85rem', 
                fontWeight: '700',
                transition: 'all 0.15s ease'
              }}
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span style={{ background: '#2563EB', color: '#FFF', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>
                  {activeFilterCount}
                </span>
              )}
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

        {/* EXPANDABLE FILTER TOOLBAR */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.85rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(15,23,42,0.03)'
        }}>
          {/* Left: Quick Status Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#64748B', marginRight: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status:</span>
            {[
              { id: 'All', label: 'All', count: totalCount },
              { id: 'Pending', label: 'Pending', count: pendingCount },
              { id: 'In Progress', label: 'In Progress', count: inProgressCount },
              { id: 'Escalated', label: 'Escalated', count: escalatedCount },
              { id: 'Resolved', label: 'Resolved', count: resolvedCount }
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: active ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    background: active ? '#2563EB' : '#F8FAFC',
                    color: active ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: active ? '700' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    background: active ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: active ? '#FFF' : '#64748B',
                    padding: '1px 5px',
                    borderRadius: '6px',
                    fontWeight: '800'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Dropdowns for Priority, Category, and Sort */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '700' }}>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#1E293B', cursor: 'pointer' }}
              >
                <option value="All">All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '700' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#1E293B', cursor: 'pointer' }}
              >
                <option value="All">All</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '700' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#1E293B', cursor: 'pointer' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority</option>
              </select>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY METRICS BAR (5 COLUMNS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          
          {/* Total */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>{totalCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>All complaints</div>
            </div>
          </div>

          {/* Pending */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pending</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>{pendingCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: '600', marginTop: '2px' }}>Awaiting review</div>
            </div>
          </div>

          {/* In Progress */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RotateCw size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>In Progress</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#0284C7', fontWeight: '600', marginTop: '2px' }}>Being resolved</div>
            </div>
          </div>

          {/* Escalated */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Escalated</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>{escalatedCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: '600', marginTop: '2px' }}>Need attention</div>
            </div>
          </div>

          {/* Resolved */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Resolved</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", lineHeight: '1.2' }}>{resolvedCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>Completed</div>
            </div>
          </div>

        </div>

        {/* COMPLAINTS LIST CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#2563EB',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0, fontWeight: '600' }}>Loading complaints...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px dashed #CBD5E1',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={26} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>No Complaints Found</h3>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0, maxWidth: '380px' }}>
                {activeFilterCount > 0 
                  ? "No complaints match your active filter and search criteria. Try adjusting or clearing your filters."
                  : "You haven't filed any complaints yet."}
              </p>
              {activeFilterCount > 0 ? (
                <button
                  onClick={clearAllFilters}
                  style={{
                    marginTop: '0.5rem',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  onClick={() => navigate('/raise-complaint')}
                  style={{
                    marginTop: '0.5rem',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Raise Your First Complaint
                </button>
              )}
            </div>
          ) : (
            filtered
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((item) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jul 29, 2026 • 09:15 AM';
            
            return (
              <div
                key={item._id || item.complaintId}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: item.status === 'Resolved' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                  borderLeft: `5px solid ${item.leftColor || '#F59E0B'}`,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: item.status === 'Resolved' ? '0 4px 14px rgba(16, 185, 129, 0.12)' : '0 2px 8px rgba(15,23,42,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Left metadata */}
                <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                  {(item.status === 'Resolved' || item.status === 'Closed' || item.status === 'Approved') && (
                    <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.45rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: '700', fontSize: '0.78rem', border: '1px solid #A7F3D0' }}>
                      <CheckCircle2 size={16} style={{ color: '#10B981' }} /> 
                      <span>Complaint is resolved (100% Progress)</span>
                    </div>
                  )}

                  {(item.status === 'Pending HR Review' || item.status === 'Pending HR Approval') && (
                    <div style={{ background: '#F5F3FF', color: '#6D28D9', padding: '0.45rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: '700', fontSize: '0.78rem', border: '1px solid #DDD6FE' }}>
                      <Clock size={16} style={{ color: '#8B5CF6' }} /> 
                      <span>Resolution report submitted • Awaiting HR final review ({item.progress || 90}% Progress)</span>
                    </div>
                  )}
                  
                  {/* Top Bar: Ticket ID, Date & Category */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1E293B', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.02em' }}>
                      {item.complaintId}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>•</span>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: '500' }}>{dateStr}</span>
                    {item.category && (
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Tag size={11} />
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Complaint Subject / Title */}
                  <h3 style={{ fontSize: '1.02rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.75rem 0', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: '1.35' }}>
                    {item.subject || item.title}
                  </h3>

                  {/* Countdown Timer if applicable */}
                  {(item.status === 'Pending' || item.status === 'Submitted' || item.status === 'In Progress') && item.escalationDeadline && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <CountdownTimer deadline={item.escalationDeadline} />
                    </div>
                  )}

                  {/* Info Badges Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap', fontSize: '0.78rem', paddingTop: '0.25rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Assigned To</span>
                      <span style={{ fontWeight: '700', color: '#334155' }}>{item.teamLeader || 'TL001'}</span>
                    </div>

                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Priority</span>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700',
                        border: '1px solid',
                        background: item.priority === 'Critical' ? '#FEF2F2' : item.priority === 'High' ? '#FFF7ED' : item.priority === 'Low' ? '#F8FAFC' : '#EFF6FF',
                        color: item.priority === 'Critical' ? '#DC2626' : item.priority === 'High' ? '#C2410C' : item.priority === 'Low' ? '#64748B' : '#2563EB',
                        borderColor: item.priority === 'Critical' ? '#FECACA' : item.priority === 'High' ? '#FED7AA' : item.priority === 'Low' ? '#E2E8F0' : '#BFDBFE'
                      }}>
                        {item.priority || 'Medium'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Status</span>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700',
                        border: '1px solid',
                        background: (item.status === 'Escalated' || item.status === 'Escalated to Super Admin') 
                          ? '#FEF2F2' 
                          : item.status === 'Pending HR Review' || item.status === 'Pending HR Approval'
                            ? '#F5F3FF'
                            : item.status === 'Pending' || item.status === 'Submitted'
                              ? '#FFFBEB' 
                              : item.status === 'In Progress' || item.status === 'Waiting on User'
                                ? '#F0F9FF'
                                : '#ECFDF5',
                        color: (item.status === 'Escalated' || item.status === 'Escalated to Super Admin') 
                          ? '#DC2626' 
                          : item.status === 'Pending HR Review' || item.status === 'Pending HR Approval'
                            ? '#7C3AED'
                            : item.status === 'Pending' || item.status === 'Submitted'
                              ? '#B45309' 
                              : item.status === 'In Progress' || item.status === 'Waiting on User'
                                ? '#0284C7'
                                : '#15803D',
                        borderColor: (item.status === 'Escalated' || item.status === 'Escalated to Super Admin') 
                          ? '#FECACA' 
                          : item.status === 'Pending HR Review' || item.status === 'Pending HR Approval'
                            ? '#DDD6FE'
                            : item.status === 'Pending' || item.status === 'Submitted'
                              ? '#FDE68A' 
                              : item.status === 'In Progress' || item.status === 'Waiting on User'
                                ? '#BAE6FD'
                                : '#A7F3D0'
                      }}>
                        {item.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Circular Progress SVG + View Details Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexShrink: 0 }}>
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
                      border: '1.5px solid #E2E8F0',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      color: '#2563EB',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.05)'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.background = '#EFF6FF'; 
                      e.currentTarget.style.borderColor = '#BFDBFE';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = '#FFFFFF'; 
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            );
          }))}
        </div>

        {/* PAGINATION CONTROLS */}
        {filtered.length > itemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? '#CBD5E1' : '#64748B', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }, (_, idx) => idx + 1).map(pageNum => (
              <button 
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  border: currentPage === pageNum ? 'none' : '1px solid #E2E8F0', 
                  background: currentPage === pageNum ? '#3B82F6' : '#FFF', 
                  color: currentPage === pageNum ? '#FFF' : '#64748B', 
                  fontWeight: '800', 
                  fontSize: '0.82rem', 
                  cursor: 'pointer' 
                }}
              >
                {pageNum}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filtered.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === Math.ceil(filtered.length / itemsPerPage) ? '#CBD5E1' : '#64748B', cursor: currentPage === Math.ceil(filtered.length / itemsPerPage) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}


      </main>
    </div>
  );
};

export default MyComplaints;
