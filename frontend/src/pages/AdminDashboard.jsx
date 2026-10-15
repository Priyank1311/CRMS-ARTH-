import React, { useState, useEffect } from 'react';
import api from '../api/client';
import SettleModal from '../components/SettleModal';
import {
  TrendingUp,
  Wallet,
  Vault,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  History,
  Building2,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deposits, setDeposits] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedDepositToSettle, setSelectedDepositToSettle] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch ? `?branch_id=${selectedBranch}` : '';
      const [metricsRes, branchesRes, depositsRes, discRes, auditRes] = await Promise.all([
        api.get(`/dashboard/metrics/${branchParam}`),
        api.get('/branches/'),
        api.get('/bank-deposits/'),
        api.get('/discrepancies/'),
        api.get('/audit-logs/'),
      ]);
      setMetrics(metricsRes.data);
      setBranches(branchesRes.data.results || branchesRes.data);
      setDeposits(depositsRes.data.results || depositsRes.data);
      setDiscrepancies(discRes.data.results || discRes.data);
      setAuditLogs(auditRes.data.results || auditRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const handleSettleSuccess = () => {
    setSelectedDepositToSettle(null);
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Branch Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Finance & Treasury HQ Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Executive cash management lifecycle, liquidity pipeline, and bank statement settlement
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={18} color="var(--text-muted)" />
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches (Nationwide)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5-Stage Financial Liquidity Funnel */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '16px' }}>
          FINTECH CASH RECONCILIATION LIFECYCLE (END-TO-END LIQUIDITY PIPELINE)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Stage 1: Expected */}
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>1. Expected Due</span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f8fafc', marginTop: '4px' }}>
              ₹{Number(metrics?.expected_collections || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Borrower EMIs Pending</span>
          </div>

          {/* Stage 2: In Field */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>2. Cash in Field (Transit)</span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#60a5fa', marginTop: '4px' }}>
              ₹{Number(metrics?.cash_held_by_agents || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Held by Field Agents</span>
          </div>

          {/* Stage 3: Branch Vault */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 600 }}>3. Cash in Vaults</span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399', marginTop: '4px' }}>
              ₹{Number(metrics?.cash_in_branch_vaults || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Reconciled in Branch Safes</span>
          </div>

          {/* Stage 4: Bank Clearing */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#fde68a', textTransform: 'uppercase', fontWeight: 600 }}>4. In Bank Clearing</span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24', marginTop: '4px' }}>
              ₹{Number(metrics?.bank_deposits_in_clearing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Deposited (Challan Issued)</span>
          </div>

          {/* Stage 5: Settled */}
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <span style={{ fontSize: '11px', color: '#c4b5fd', textTransform: 'uppercase', fontWeight: 600 }}>5. Settled Liquidity</span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a78bfa', marginTop: '4px' }}>
              ₹{Number(metrics?.settled_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Credited to Corporate Account</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          Bank Statement Settlement Queue ({deposits.filter((d) => d.status !== 'SETTLED').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'discrepancies' ? 'active' : ''}`}
          onClick={() => setActiveTab('discrepancies')}
        >
          System Discrepancies & Audit Flags ({discrepancies.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Immutable Audit Log Stream ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Bank Settlements Queue */}
      {activeTab === 'pipeline' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Corporate Bank Statement Reconciliation
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deposit Slip #</th>
                  <th>Branch</th>
                  <th>Bank Name</th>
                  <th>Reference #</th>
                  <th>Deposit Date</th>
                  <th>Deposited Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => {
                  const isSettled = dep.status === 'SETTLED';
                  const isMismatch = dep.status === 'SETTLEMENT_MISMATCH';

                  return (
                    <tr key={dep.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {dep.deposit_slip_no}
                      </td>
                      <td style={{ fontWeight: 600 }}>{dep.branch_name}</td>
                      <td>{dep.bank_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{dep.bank_reference_no}</td>
                      <td>{dep.deposit_date}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          ₹{Number(dep.deposited_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          isSettled ? 'badge-emerald' : isMismatch ? 'badge-rose' : 'badge-amber'
                        }`}>
                          {dep.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {!isSettled ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedDepositToSettle(dep)}
                          >
                            <FileCheck2 size={14} />
                            <span>Reconcile Statement Credit</span>
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
                            <ShieldCheck size={16} />
                            <span>Settled (₹{Number(dep.settled_amount).toLocaleString('en-IN')})</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Discrepancies */}
      {activeTab === 'discrepancies' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            System-Wide Cash Discrepancies
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Incident Date</th>
                  <th>Branch</th>
                  <th>Agent</th>
                  <th>Submission Ref</th>
                  <th>Type</th>
                  <th>Difference Amount</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{d.branch_name}</td>
                    <td>{d.agent_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{d.submission_no}</td>
                    <td>
                      <span className={`badge ${d.discrepancy_type === 'SHORTAGE' ? 'badge-rose' : 'badge-amber'}`}>
                        {d.discrepancy_type}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: d.discrepancy_type === 'SHORTAGE' ? '#fb7185' : '#fbbf24',
                      }}>
                        {d.discrepancy_type === 'SHORTAGE' ? '-' : '+'}₹{Number(d.difference_amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${d.status === 'RESOLVED' ? 'badge-emerald' : 'badge-rose'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '260px' }}>
                      {d.resolution_notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Tamper-Proof Financial Action Audit Trail
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.performed_by_name || 'System'}</td>
                    <td>
                      <span className="badge badge-indigo">
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {log.entity_type}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '300px' }}>
                      {JSON.stringify(log.payload_after || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {selectedDepositToSettle && (
        <SettleModal
          deposit={selectedDepositToSettle}
          onClose={() => setSelectedDepositToSettle(null)}
          onSuccess={handleSettleSuccess}
        />
      )}
    </div>
  );
}
