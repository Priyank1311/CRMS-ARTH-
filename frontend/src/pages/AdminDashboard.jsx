import React, { useState, useEffect } from 'react';
import api from '../api/client';
import SettleModal from '../components/SettleModal';
import RepaymentHistoryModal from '../components/RepaymentHistoryModal';
import CreateCustomerModal from '../components/CreateCustomerModal';
import CreateLoanModal from '../components/CreateLoanModal';
import ReceiptModal from '../components/ReceiptModal';
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
  UserPlus,
  FilePlus,
  Filter,
  Eye,
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [deposits, setDeposits] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');

  // Modals state
  const [selectedDepositToSettle, setSelectedDepositToSettle] = useState(null);
  const [loanForHistory, setLoanForHistory] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [receiptToShow, setReceiptToShow] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = [];
      if (selectedBranch) params.push(`branch_id=${selectedBranch}`);
      if (dateFrom) params.push(`date_from=${dateFrom}`);
      if (dateTo) params.push(`date_to=${dateTo}`);
      if (statusFilter) params.push(`status=${statusFilter}`);
      const qs = params.length > 0 ? `?${params.join('&')}` : '';

      const [metricsRes, branchesRes, depositsRes, discRes, auditRes, loansRes, custRes] = await Promise.all([
        api.get(`/dashboard/metrics/${qs}`),
        api.get('/branches/'),
        api.get(`/bank-deposits/${qs}`),
        api.get(`/discrepancies/${qs}`),
        api.get('/audit-logs/'),
        api.get(`/loans/${qs}`),
        api.get('/customers/'),
      ]);
      setMetrics(metricsRes.data);
      setBranches(branchesRes.data.results || branchesRes.data);
      setDeposits(depositsRes.data.results || depositsRes.data);
      setDiscrepancies(discRes.data.results || discRes.data);
      setAuditLogs(auditRes.data.results || auditRes.data);
      setLoans(loansRes.data.results || loansRes.data);
      setCustomers(custRes.data.results || custRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, dateFrom, dateTo, statusFilter]);

  const handleSettleSuccess = () => {
    setSelectedDepositToSettle(null);
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Finance & Treasury HQ Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Executive cash management lifecycle, nationwide liquidity pipeline, and bank statement settlements
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsCustomerModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>Onboard Customer</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsLoanModalOpen(true)}
          >
            <FilePlus size={16} />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontWeight: 600 }}>Filter Nationwide Data:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color="var(--text-dim)" />
          <select
            className="form-select"
            style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>From:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>To:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '170px', padding: '6px 12px', fontSize: '13px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DEPOSITED">In Clearing (Deposited)</option>
          <option value="SETTLED">Settled</option>
          <option value="SETTLEMENT_MISMATCH">Settlement Mismatch</option>
        </select>

        {(selectedBranch || dateFrom || dateTo || statusFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedBranch('');
              setDateFrom('');
              setDateTo('');
              setStatusFilter('');
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* 5-Stage Financial Liquidity Funnel */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '16px' }}>
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
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Loan Portfolio & Amortization Schedules ({loans.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'discrepancies' ? 'active' : ''}`}
          onClick={() => setActiveTab('discrepancies')}
        >
          Discrepancies & Audit Flags ({discrepancies.length})
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

      {/* Tab 2: Loan Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
              Nationwide Loan Accounts & Outstanding Balances
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCustomerModalOpen(true)}>
                <UserPlus size={14} />
                <span>New Borrower</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsLoanModalOpen(true)}>
                <FilePlus size={14} />
                <span>Create Loan</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Loan Account #</th>
                  <th>Borrower</th>
                  <th>Branch</th>
                  <th>Principal</th>
                  <th>Total Payable</th>
                  <th>Total Paid</th>
                  <th>Outstanding Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{l.loan_account_no}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.customer?.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{l.customer?.customer_code}</div>
                    </td>
                    <td>{l.customer?.branch_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(l.principal_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(l.total_payable).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>
                      ₹{Number(l.total_paid).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fbbf24' }}>
                        ₹{Number(l.outstanding_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'ACTIVE' ? 'badge-emerald' : 'badge-neutral'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setLoanForHistory(l)}
                      >
                        <History size={13} />
                        <span>Schedules</span>
                      </button>
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

      {/* Tab 4: Audit Logs */}
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

      {/* Onboard Customer Modal */}
      {isCustomerModalOpen && (
        <CreateCustomerModal
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={() => {
            setIsCustomerModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Create Loan Modal */}
      {isLoanModalOpen && (
        <CreateLoanModal
          customers={customers}
          onClose={() => setIsLoanModalOpen(false)}
          onSuccess={() => {
            setIsLoanModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Repayment History Modal */}
      {loanForHistory && (
        <RepaymentHistoryModal
          loan={loanForHistory}
          onClose={() => setLoanForHistory(null)}
          onSelectReceipt={(receipt) => {
            setLoanForHistory(null);
            setReceiptToShow(receipt);
          }}
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
