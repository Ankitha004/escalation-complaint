import React, { useState, useEffect } from 'react';
import ManagerSidebar from '../components/ManagerSidebar';
import { Users, TrendingUp, Award, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../services/api';

const ManagerPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [activeTLs, setActiveTLs] = useState(0);
  const [topResolver, setTopResolver] = useState('None');

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/tl-performance');
      const tlArray = res.data?.teamLeaders || [];
      
      setActiveTLs(tlArray.length);

      if (tlArray.length > 0) {
        setTopResolver(tlArray[0].name);
      } else {
        setTopResolver('None');
      }

      setPerformanceData(tlArray);
    } catch (err) {
      console.warn('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="performance" />
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            Team Leader Performance
          </h1>
          <button 
            onClick={fetchPerformance} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.04)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>ACTIVE TEAM LEADERS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>{activeTLs}</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '700' }}>TOP RESOLVER</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' }}>{topResolver}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
          {loading ? (
             <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
               <RefreshCw size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
               <div style={{ fontWeight: '700' }}>Calculating Performance Metrics...</div>
             </div>
          ) : performanceData.length === 0 ? (
             <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
               <TrendingUp size={48} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
               <h2 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: '800' }}>No Data Available</h2>
               <p style={{ color: '#64748B' }}>Not enough complaint data assigned to Team Leaders yet.</p>
             </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '1rem 1.5rem' }}>TEAM LEADER</th>
                    <th style={{ padding: '1rem 1.5rem' }}>TOTAL ASSIGNED</th>
                    <th style={{ padding: '1rem 1.5rem' }}>RESOLVED</th>
                    <th style={{ padding: '1rem 1.5rem' }}>ESCALATED</th>
                    <th style={{ padding: '1rem 1.5rem' }}>RESOLUTION RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((tl, index) => {
                    const resRate = tl.total > 0 ? Math.round((tl.resolved / tl.total) * 100) : 0;
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#0F172A' }}>{tl.name}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>{tl.total}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#16A34A', fontWeight: '800' }}>{tl.resolved}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#DC2626', fontWeight: '800' }}>{tl.escalated}</td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${resRate}%`, height: '100%', background: resRate > 75 ? '#16A34A' : resRate > 40 ? '#F59E0B' : '#DC2626' }}></div>
                            </div>
                            <span style={{ fontWeight: '800', fontSize: '0.8rem', minWidth: '35px' }}>{resRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerPerformance;
