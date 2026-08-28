import React, { useState, useEffect } from 'react';
import ManagerSidebar from '../components/ManagerSidebar';
import { CheckCircle2, Search, RefreshCw, Eye } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const ManagerResolved = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResolved = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/complaints');
      const list = res.data?.complaints || (Array.isArray(res.data) ? res.data : []);
      
      const approvedOnly = list.filter(c => c.status === 'Approved' || c.status === 'Closed' || c.status === 'Resolved');
      setResolvedTickets(approvedOnly);
    } catch (err) {
      console.warn('Failed to fetch resolved tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolved();
  }, []);

  const filteredTickets = resolvedTickets.filter(c => 
    (c.complaintId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject || c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.staffName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="approved" />
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              Resolved Tickets Log
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Search and review the historical log of all tickets that have been approved.
            </p>
          </div>
          <button 
            onClick={fetchResolved} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.04)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
        
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
           
           <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
               <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
               <input
                 type="text"
                 placeholder="Search resolved tickets by ID, Staff, or Subject..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{
                   width: '100%', padding: '0.65rem 1rem 0.65rem 2.6rem', borderRadius: '10px',
                   border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none',
                   color: '#0F172A', boxSizing: 'border-box'
                 }}
               />
             </div>
             <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
               {filteredTickets.length} Tickets Found
             </div>
           </div>

           {loading ? (
             <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
               <RefreshCw size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
               <div style={{ fontWeight: '700' }}>Loading archive...</div>
             </div>
           ) : filteredTickets.length === 0 ? (
             <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
               <CheckCircle2 size={48} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
               <h2 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: '800' }}>No Tickets Found</h2>
               <p style={{ color: '#64748B' }}>We couldn't find any resolved tickets matching your search.</p>
             </div>
           ) : (
             <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '1rem 1.5rem' }}>TICKET ID</th>
                      <th style={{ padding: '1rem 1.5rem' }}>STAFF NAME</th>
                      <th style={{ padding: '1rem 1.5rem' }}>SUBJECT</th>
                      <th style={{ padding: '1rem 1.5rem' }}>RESOLVED DATE</th>
                      <th style={{ padding: '1rem 1.5rem' }}>STATUS</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((c) => (
                      <tr key={c._id || c.complaintId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#0F172A' }}>{c.complaintId}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#334155' }}>{c.staffName}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#0F172A', maxWidth: '300px' }}>{c.subject || c.title}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>
                           {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <span style={{ padding: '4px 10px', background: '#F0FDF4', color: '#16A34A', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #86EFAC' }}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/manager-complaint-details/${c.complaintId || c._id}`)}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default ManagerResolved;
