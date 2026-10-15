import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, FileCode, Wallet, Vault } from 'lucide-react';

export default function Navbar({ onRefresh }) {
  const { user, role } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-logo">₹</div>
          <div className="brand-text">
            <h1>CMRS FinTech</h1>
            <p>Cash Management & Reconciliation System</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {role === 'COLLECTION_AGENT' && user?.cash_in_hand !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Wallet size={18} color="#60a5fa" />
              <div>
                <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>Unsubmitted Cash in Hand</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  ₹{Number(user.cash_in_hand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {role === 'BRANCH_MANAGER' && user?.vault_cash_balance !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <Vault size={18} color="#34d399" />
              <div>
                <div style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 600 }}>Branch Vault Safe Balance</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  ₹{Number(user.vault_cash_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          <a
            href="http://127.0.0.1:8000/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileCode size={15} />
            <span>OpenAPI / Swagger</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
