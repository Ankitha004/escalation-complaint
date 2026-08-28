import React from 'react';
import TLSidebar from '../components/TLSidebar';
import { Construction } from 'lucide-react';

const TLPlaceholderPage = ({ title, activeTab }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TLSidebar activeTab={activeTab} />
      <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FFFFFF', padding: '3rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Construction size={40} color="#2563EB" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0' }}>
            {title}
          </h2>
          <p style={{ color: '#64748B', lineHeight: '1.6', margin: 0 }}>
            This section is currently under construction and will be available in a future update. Check back soon for new features!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TLPlaceholderPage;
