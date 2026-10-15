import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifySubmissionModal from '../components/VerifySubmissionModal';
import DepositModal from '../components/DepositModal';
import { Vault, Landmark, AlertTriangle, CheckCircle, Clock, Eye, CheckSquare } from 'lucide-react';

export default function BranchPortal() {
  const { user, refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  const [selectedSubmissionToVerify, setSelectedSubmissionToVerify] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, depsRes, discRes] = await Promise.all([
        api.get('/submissions/'),
        api.get('/bank-deposits/'),
        api.get('/discrepancies/'),
      ]);
      setSubmissions(subsRes.data.results || subsRes.data);
      setDeposits(depsRes.data.results || depsRes.data);
      setDiscrepancies(discRes.data.results || discRes.data);
      await refreshUser();
    } catch (err) {
      console.error('Failed to load branch portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingSubmissions = submissions.filter((s) => s.status === 'PENDING');
  const approvedUndepositedSubmissions = submissions.filter(
    (s) => s.status === 'APPROVED' && !s.bank_deposit
  );

  const handleVerifySuccess = () => {
    setSelectedSubmissionToVerify(null);
    fetchData();
  };

  const handleDepositSuccess = () => {
    setIsDepositModalOpen(false);
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Branch Cash Reconciliation & Vault Safe</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Count and verify cash from field agents, manage vault liquidity, and initiate bank deposits
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsDepositModalOpen(true)}
          disabled={approvedUndepositedSubmissions.length === 0}
          style={{ padding: '12px 20px', fontSize: '15px' }}
        >
          <Landmark size={18} />
          <span>Create Bank Deposit Slip ({approvedUndepositedSubmissions.length} batches ready)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Branch Vault Safe Balance</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Vault size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            ₹{Number(user?.vault_cash_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-subtitle">
            Physically reconciled & counted cash in branch safe
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending Agent Handovers</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {pendingSubmissions.length}
          </div>
          <div className="stat-subtitle">
            Awaiting physical count & approval
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Open Discrepancies</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>
            {discrepancies.filter((d) => d.status === 'OPEN').length}
          </div>
          <div className="stat-subtitle">
            Shortages & excess cash incidents flagged
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Inbound Cash Handovers ({submissions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          Bank Deposits & Challans ({deposits.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'discrepancies' ? 'active' : ''}`}
          onClick={() => setActiveTab('discrepancies')}
        >
          Discrepancy Audit Ledger ({discrepancies.length})
        </button>
      </div>

      {/* Tab 1: Submissions */}
      {activeTab === 'submissions' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Agent Cash Handover Verification Queue
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Batch No</th>
                  <th>Agent</th>
                  <th>Declared Amount</th>
                  <th>Verified Amount</th>
                  <th>Receipts Count</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isPending = sub.status === 'PENDING';
                  return (
                    <tr key={sub.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {sub.submission_no}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sub.agent_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {new Date(sub.created_at).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                          ₹{Number(sub.declared_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        {sub.verified_amount ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399' }}>
                            ₹{Number(sub.verified_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Pending Count</span>
                        )}
                      </td>
                      <td>{sub.collection_count} Receipts</td>
                      <td>
                        <span className={`badge ${
                          sub.status === 'APPROVED'
                            ? 'badge-emerald'
                            : sub.status === 'PENDING'
                            ? 'badge-amber'
                            : 'badge-rose'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedSubmissionToVerify(sub)}
                          >
                            <CheckSquare size={14} />
                            <span>Count & Verify</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                            Verified by {sub.verified_by_name || 'Manager'}
                          </span>
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

      {/* Tab 2: Bank Deposits */}
      {activeTab === 'deposits' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
              Bank Deposits & Challan Slips
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => setIsDepositModalOpen(true)}>
              <Landmark size={14} />
              <span>Create New Deposit Slip</span>
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deposit Slip #</th>
                  <th>Bank Name</th>
                  <th>Account No</th>
                  <th>Reference #</th>
                  <th>Deposited Amount</th>
                  <th>Status</th>
                  <th>Settlement Details</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => (
                  <tr key={dep.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {dep.deposit_slip_no}
                    </td>
                    <td style={{ fontWeight: 600 }}>{dep.bank_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{dep.account_no}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{dep.bank_reference_no}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        ₹{Number(dep.deposited_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        dep.status === 'SETTLED'
                          ? 'badge-emerald'
                          : dep.status === 'DEPOSITED'
                          ? 'badge-amber'
                          : 'badge-rose'
                      }`}>
                        {dep.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {dep.settled_amount ? (
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>
                            ₹{Number(dep.settled_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            by {dep.settled_by_name}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>In Bank Clearing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Discrepancies */}
      {activeTab === 'discrepancies' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Cash Discrepancy & Audit Log
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Incident Date</th>
                  <th>Submission Ref</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th>Expected</th>
                  <th>Actual Counted</th>
                  <th>Difference</th>
                  <th>Status</th>
                  <th>Resolution Remarks</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(d.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {d.submission_no}
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.agent_name}</td>
                    <td>
                      <span className={`badge ${d.discrepancy_type === 'SHORTAGE' ? 'badge-rose' : 'badge-amber'}`}>
                        {d.discrepancy_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(d.expected_amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(d.actual_amount).toLocaleString('en-IN')}
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
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '240px' }}>
                      {d.resolution_notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verify Submission Modal */}
      {selectedSubmissionToVerify && (
        <VerifySubmissionModal
          submission={selectedSubmissionToVerify}
          onClose={() => setSelectedSubmissionToVerify(null)}
          onSuccess={handleVerifySuccess}
        />
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <DepositModal
          submissions={approvedUndepositedSubmissions}
          vaultBalance={Number(user?.vault_cash_balance || 0)}
          branchId={user?.branch}
          onClose={() => setIsDepositModalOpen(false)}
          onSuccess={handleDepositSuccess}
        />
      )}
    </div>
  );
}
