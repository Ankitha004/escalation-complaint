import React, { useState, useEffect } from 'react';
import ManagerSidebar from '../components/ManagerSidebar';
import { PieChart, Clock, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import API from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ManagerSLA = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState([]);
  const [slaData, setSlaData] = useState({ labels: [], data: [] });

  const fetchSLAData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/complaints');
      const list = res.data?.complaints || (Array.isArray(res.data) ? res.data : []);
      
      const escalatedOnly = list.filter(c => c.status === 'Escalated' || c.status === 'Pending');
      setEscalations(escalatedOnly);

      const dateMap = {};
      escalatedOnly.forEach(c => {
        const d = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + 1;
      });

      const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a + ', 2026') - new Date(b + ', 2026'));
      
      setSlaData({
        labels: sortedDates,
        data: sortedDates.map(d => dateMap[d])
      });
    } catch (err) {
      console.warn('Failed to fetch SLA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLAData();
  }, []);

  const chartData = {
    labels: slaData.labels,
    datasets: [
      {
        label: 'SLA Breaches (Escalated Tickets)',
        data: slaData.data,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#DC2626',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' } } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { weight: 'bold' } } },
      x: { ticks: { font: { weight: 'bold' } } }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <ManagerSidebar activeTab="sla_reports" />
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              SLA Analytics
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Track SLA breaches and identify risk patterns across your department.
            </p>
          </div>
          <button 
            onClick={fetchSLAData} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,23,42,0.04)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
        
        {/* Chart Section */}
        <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#DC2626" /> SLA Breach Timeline
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : slaData.labels.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '700' }}>
                No SLA Breaches Found!
              </div>
            )}
          </div>
        </div>

        {/* At Risk Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
           <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>Tickets Currently At Risk</h3>
           </div>
           
           {loading ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
               <RefreshCw size={24} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} /> Loading...
             </div>
           ) : escalations.length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: '700' }}>
               No pending escalations. Great job!
             </div>
           ) : (
             <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '1rem 1.5rem' }}>TICKET ID</th>
                      <th style={{ padding: '1rem 1.5rem' }}>SUBJECT</th>
                      <th style={{ padding: '1rem 1.5rem' }}>CATEGORY</th>
                      <th style={{ padding: '1rem 1.5rem' }}>PRIORITY</th>
                      <th style={{ padding: '1rem 1.5rem' }}>ESCALATED ON</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escalations.map((c) => (
                      <tr key={c._id || c.complaintId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#DC2626' }}>{c.complaintId}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0F172A', maxWidth: '300px' }}>{c.subject || c.title}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontWeight: '600' }}>{c.category}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800' }}>
                          <span style={{ color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#EA580C' : '#D97706' }}>
                            {c.priority}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/manager-complaint-details/${c.complaintId || c._id}`)}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            Review <ArrowRight size={14} />
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

export default ManagerSLA;
