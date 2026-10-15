import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleSwitcherBanner from './components/RoleSwitcherBanner';
import Navbar from './components/Navbar';
import AgentPortal from './pages/AgentPortal';
import BranchPortal from './pages/BranchPortal';
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { role, loading } = useAuth();

  return (
    <div className="app-container">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading Financial Data & Role Context...</p>
          </div>
        ) : (
          <>
            {role === 'COLLECTION_AGENT' && <AgentPortal />}
            {role === 'BRANCH_MANAGER' && <BranchPortal />}
            {role === 'FINANCE_ADMIN' && <AdminDashboard />}
          </>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
        <p>CMRS — Cash Management & Reconciliation System • Enterprise Lending Solution</p>
        <p style={{ marginTop: '4px' }}>Strict Decimal Precision • Concurrency Safe • Tamper-proof Audit Trails</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
