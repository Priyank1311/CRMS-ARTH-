import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Building2, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';

export default function RoleSwitcherBanner() {
  const { user, role, switchRole, logout, loading } = useAuth();

  return (
    <div className="role-banner">
      <div className="role-banner-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            DEMO ROLE SWITCHER:
          </span>
          <div className="role-chips">
            <button
              className={`role-chip ${role === 'COLLECTION_AGENT' ? 'active active-agent' : ''}`}
              onClick={() => switchRole('COLLECTION_AGENT')}
              disabled={loading}
            >
              <UserCheck size={16} />
              <span>Field Agent (Ramesh)</span>
            </button>

            <button
              className={`role-chip ${role === 'BRANCH_MANAGER' ? 'active active-manager' : ''}`}
              onClick={() => switchRole('BRANCH_MANAGER')}
              disabled={loading}
            >
              <Building2 size={16} />
              <span>Branch Mgr (Priya)</span>
            </button>

            <button
              className={`role-chip ${role === 'FINANCE_ADMIN' ? 'active active-admin' : ''}`}
              onClick={() => switchRole('FINANCE_ADMIN')}
              disabled={loading}
            >
              <ShieldCheck size={16} />
              <span>Finance HQ (Vikram)</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Logged in as:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {user.first_name} {user.last_name}
              </span>
              {user.branch_name && (
                <span className="badge badge-indigo">
                  {user.branch_name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
