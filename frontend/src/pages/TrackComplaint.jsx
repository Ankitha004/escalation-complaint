import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/StaffSidebar';
import API from '../services/api';
import { calculateSLATimeLeft } from '../utils/slaUtils';
import { 
  Search,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const TrackComplaint = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState([]);

  const getStepLevel = (status) => {
    switch (status) {
      case 'Submitted':
      case 'Pending': return 1;
      case 'In Progress': return 2;
      case 'Escalated': return 3;
      case 'Resolved':
      case 'Closed': return 4;
      default: return 1;
    }
  };

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get('/complaints/my');
      const data = res.data || {};
      const list = data.complaints || (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        setComplaints(list);
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

  const filtered = complaints.filter(c => 
    (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject || c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <StaffSidebar activeTab="track-complaint" unreadCount={3} />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER + SEARCH */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Track Complaint
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Monitor the lifecycle and resolution progress of your tickets.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by ID or Subject..."
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
          </div>
        </div>

        {/* COMPLAINTS TRACKER LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <p>Loading complaints...</p>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#FFF', padding: '3rem', textAlign: 'center', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <p style={{ color: '#64748B' }}>No complaints found matching your search.</p>
            </div>
          ) : (
            filtered.map(c => {
              const stepLevel = getStepLevel(c.status);
              const isResolved = c.status === 'Resolved' || c.status === 'Closed';
              
              return (
                <div key={c._id || c.complaintId} style={{ background: '#FFFFFF', borderRadius: '16px', border: isResolved ? '2px solid #10B981' : '1px solid #E2E8F0', padding: '1.5rem', boxShadow: isResolved ? '0 0 10px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(15,23,42,0.03)' }}>
                  
                  {isResolved && (
                    <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <CheckCircle2 size={18} /> Complaint is resolved (100% Progress)
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ 
                        background: '#EEF2FF', 
                        color: '#4F46E5', 
                        padding: '3px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        fontWeight: '800', 
                        marginRight: '0.75rem' 
                      }}>
                        {c.complaintId}
                      </span>
                      <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0F172A' }}>{c.subject || c.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800',
                        background: c.priority === 'Critical' ? '#FEE2E2' : '#EFF6FF',
                        color: c.priority === 'Critical' ? '#DC2626' : '#2563EB'
                      }}>
                        {c.priority || 'Medium'} Priority
                      </span>
                      <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                        ⏱ {calculateSLATimeLeft(c.createdAt || new Date(), c.priority || 'Medium', c.status, c.totalPausedDuration)}
                      </span>
                    </div>
                  </div>

                  {/* REAL VERTICAL TIMELINE TRACKER */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0.5rem 0 0.5rem', position: 'relative' }}>
                    {c.timeline && c.timeline.length > 0 ? (
                      c.timeline.map((event, index) => {
                        const isLast = index === c.timeline.length - 1;
                        return (
                          <div key={index} style={{ display: 'flex', gap: '1.25rem', position: 'relative', paddingBottom: isLast ? '0' : '1.75rem' }}>
                            {/* Vertical Line */}
                            {!isLast && (
                              <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '0', width: '2px', background: '#E2E8F0', zIndex: 0 }}></div>
                            )}
                            
                            {/* Dot */}
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: isLast ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' : '#F1F5F9', 
                              border: isLast ? 'none' : '2px solid #CBD5E1',
                              color: isLast ? '#FFF' : 'transparent',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              position: 'relative', 
                              zIndex: 1,
                              flexShrink: 0,
                              boxShadow: isLast ? '0 0 0 4px rgba(79, 70, 229, 0.1)' : 'none'
                            }}>
                              {isLast && <Check size={14} strokeWidth={3} />}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, marginTop: '-2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isLast ? '#0F172A' : '#475569' }}>
                                  {event.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
                                  {event.timestamp ? new Date(event.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </div>
                              {event.description && (
                                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem', lineHeight: '1.4' }}>
                                  {event.description}
                                </div>
                              )}
                              {event.updatedByName && (
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }}></span>
                                  Updated by {event.updatedByName}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, flexShrink: 0, boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)' }}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div style={{ flex: 1, marginTop: '-2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0F172A' }}>Complaint Raised</div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>Waiting for team leader assignment.</div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
};

export default TrackComplaint;
