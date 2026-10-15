import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import CollectModal from '../components/CollectModal';
import ReceiptModal from '../components/ReceiptModal';
import SubmitCashModal from '../components/SubmitCashModal';
import { Wallet, IndianRupee, Users, Send, CheckCircle2, Clock, Eye } from 'lucide-react';

export default function AgentPortal() {
  const { user, refreshUser } = useAuth();
  const [loans, setLoans] = useState([]);
  const [collections, setCollections] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('loans');

  // Modals state
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, collectionsRes, summaryRes] = await Promise.all([
        api.get('/loans/'),
        api.get('/collections/'),
        api.get('/collections/daily_summary/'),
      ]);
      setLoans(loansRes.data.results || loansRes.data);
      setCollections(collectionsRes.data.results || collectionsRes.data);
      setDailySummary(summaryRes.data);
      await refreshUser();
    } catch (err) {
      console.error('Failed to load agent portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unsubmittedCollections = collections.filter((c) => c.status === 'COLLECTED');

  const handleOpenCollect = (schedule, loan, customer) => {
    setSelectedSchedule(schedule);
    setSelectedLoan(loan);
    setSelectedCustomer(customer);
  };

  const handleCollectSuccess = (newCollection) => {
    setSelectedSchedule(null);
    setReceiptToShow(newCollection);
    fetchData();
  };

  const handleSubmitSuccess = () => {
    setIsSubmitModalOpen(false);
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Field Agent Collections Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Collect repayments from assigned borrowers and submit daily cash to branch
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsSubmitModalOpen(true)}
          disabled={unsubmittedCollections.length === 0}
          style={{ padding: '12px 20px', fontSize: '15px' }}
        >
          <Send size={18} />
          <span>Submit Cash to Branch ({unsubmittedCollections.length} pending)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Cash in Hand (Unsubmitted)</span>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            ₹{Number(dailySummary?.unsubmitted_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-subtitle">
            {dailySummary?.unsubmitted_count || 0} collections held in transit
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Today's Collections</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            ₹{Number(dailySummary?.today_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-subtitle">
            {dailySummary?.today_count || 0} payments collected today
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Assigned Borrowers</span>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">
            {loans.length}
          </div>
          <div className="stat-subtitle">
            Active loan accounts in field territory
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          Assigned Borrowers & Repayment Schedules ({loans.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          My Collections History ({collections.length})
        </button>
      </div>

      {/* Tab 1: Assigned Borrowers */}
      {activeTab === 'loans' && (
        <div className="card">
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Active Loan Schedules & Collection Actions
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Loan Account</th>
                  <th>Outstanding</th>
                  <th>Next Due EMI</th>
                  <th>Due Date</th>
                  <th>Due Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const pendingSchedules = (loan.schedules || []).filter(
                    (s) => s.status === 'PENDING' || s.status === 'PARTIALLY_PAID' || s.status === 'OVERDUE'
                  );
                  const nextSch = pendingSchedules[0];

                  return (
                    <tr key={loan.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.customer.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {loan.customer.phone} • {loan.customer.address}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {loan.loan_account_no}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          ₹{Number(loan.outstanding_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        {nextSch ? (
                          <span className={`badge ${nextSch.status === 'OVERDUE' ? 'badge-rose' : 'badge-amber'}`}>
                            EMI #{nextSch.installment_no} ({nextSch.status.replace('_', ' ')})
                          </span>
                        ) : (
                          <span className="badge badge-emerald">Loan Paid Off</span>
                        )}
                      </td>
                      <td>
                        {nextSch ? nextSch.due_date : '—'}
                      </td>
                      <td>
                        {nextSch ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fbbf24' }}>
                            ₹{Number(nextSch.remaining_due || nextSch.due_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          '₹0.00'
                        )}
                      </td>
                      <td>
                        {nextSch && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenCollect(nextSch, loan, loan.customer)}
                          >
                            <IndianRupee size={14} />
                            <span>Collect Cash</span>
                          </button>
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

      {/* Tab 2: Collections History */}
      {activeTab === 'collections' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
              Recent Receipts Issued
            </h2>
            {unsubmittedCollections.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsSubmitModalOpen(true)}>
                <Send size={14} />
                <span>Submit {unsubmittedCollections.length} Items to Branch</span>
              </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Borrower</th>
                  <th>Loan & Installment</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Lifecycle Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => {
                  let statusBadge = 'badge-emerald';
                  if (col.status === 'COLLECTED') statusBadge = 'badge-cyan';
                  if (col.status === 'SUBMITTED') statusBadge = 'badge-amber';
                  if (col.status === 'BANK_DEPOSITED') statusBadge = 'badge-indigo';

                  return (
                    <tr key={col.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {col.receipt_no}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(col.collected_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{col.customer_name}</td>
                      <td>
                        {col.loan_account_no} (EMI #{col.installment_no})
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          ₹{Number(col.amount_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${col.payment_mode === 'CASH' ? 'badge-emerald' : 'badge-indigo'}`}>
                          {col.payment_mode}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>
                          {col.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReceiptToShow(col)}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Modal */}
      {selectedSchedule && (
        <CollectModal
          schedule={selectedSchedule}
          loan={selectedLoan}
          customer={selectedCustomer}
          onClose={() => setSelectedSchedule(null)}
          onSuccess={handleCollectSuccess}
        />
      )}

      {/* Receipt Modal */}
      {receiptToShow && (
        <ReceiptModal
          collection={receiptToShow}
          onClose={() => setReceiptToShow(null)}
        />
      )}

      {/* Submit Cash Handover Modal */}
      {isSubmitModalOpen && (
        <SubmitCashModal
          collections={unsubmittedCollections}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
}
