import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifySubmissionModal from '../components/VerifySubmissionModal';
import DepositModal from '../components/DepositModal';
import ReceiptModal from '../components/ReceiptModal';
import {
  Vault,
  Landmark,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  CheckSquare,
  Users,
  Filter,
} from 'lucide-react';

export default function BranchPortal() {
  const { user, refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedSubmissionToVerify, setSelectedSubmissionToVerify] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [receiptToShow, setReceiptToShow] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = [];
      if (statusFilter) queryParams.push(`status=${statusFilter}`);
      if (dateFilter) queryParams.push(`date_from=${dateFilter}&date_to=${dateFilter}`);
      const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const [subsRes, depsRes, discRes, colsRes] = await Promise.all([
        api.get(`/submissions/${qs}`),
        api.get('/bank-deposits/'),
        api.get('/discrepancies/'),
        api.get(`/collections/${qs}`),
      ]);
      setSubmissions(subsRes.data.results || subsRes.data);
      setDeposits(depsRes.data.results || depsRes.data);
      setDiscrepancies(discRes.data.results || discRes.data);
      setCollections(colsRes.data.results || colsRes.data);
      await refreshUser();
    } catch (err) {
      console.error('Failed to load branch portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter]);

  const pendingSubmissions = submissions.filter((s) => s.status === 'PENDING');
  const approvedUndepositedSubmissions = submissions.filter(
    (s) => s.status === 'APPROVED' && !s.bank_deposit
  );

  const totalAgentCashHeld = collections
    .filter((c) => c.status === 'COLLECTED' || c.status === 'SUBMITTED')
    .reduce((sum, c) => sum + Number(c.amount_collected), 0);

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
            Physically verified cash in branch safe
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Cash in Field (In Transit)</span>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            ₹{totalAgentCashHeld.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-subtitle">
            Held by branch field agents awaiting reconciliation
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
            Batches waiting for manager physical cash count
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Branch Discrepancies</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>
            {discrepancies.filter((d) => d.status === 'OPEN').length}
          </div>
          <div className="stat-subtitle">
            Active shortages & discrepancies flagged
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontWeight: 600 }}>Filter View:</span>
        </div>

        <input
          type="date"
          className="form-input"
          style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="COLLECTED">Collected (In Field)</option>
          <option value="SUBMITTED">Submitted / Pending</option>
          <option value="BRANCH_RECONCILED">Reconciled in Vault</option>
          <option value="BANK_DEPOSITED">Deposited in Bank</option>
          <option value="SETTLED">Settled</option>
        </select>

        {(statusFilter || dateFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
            }}
          >
            Clear Filters
          </button>
        )}
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
          className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          Agent Field Collections Log ({collections.length})
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

      {/* Tab 2: Agent Collections */}
      {activeTab === 'collections' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Branch Field Collections & Receipt Stream
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date & Time</th>
                  <th>Agent</th>
                  <th>Borrower</th>
                  <th>Loan & Installment</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr key={col.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{col.receipt_no}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(col.collected_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{col.agent_name}</td>
                    <td>{col.customer_name}</td>
                    <td>{col.loan_account_no} (EMI #{col.installment_no})</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
                        ₹{Number(col.amount_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${col.payment_mode === 'CASH' ? 'badge-emerald' : 'badge-indigo'}`}>
                        {col.payment_mode}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        {col.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setReceiptToShow(col)}
                      >
                        <Eye size={13} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Bank Deposits */}
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

      {/* Tab 4: Discrepancies */}
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

      {/* Receipt Modal */}
      {receiptToShow && (
        <ReceiptModal
          collection={receiptToShow}
          onClose={() => setReceiptToShow(null)}
        />
      )}
    </div>
  );
}
