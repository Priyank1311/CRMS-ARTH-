import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, History, IndianRupee, Eye, Calendar, AlertCircle } from 'lucide-react';

export default function RepaymentHistoryModal({ loan, onClose, onSelectReceipt }) {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loan) {
      api.get(`/loans/${loan.id}/repayment_history/`).then((res) => {
        setHistoryData(res.data);
        setLoading(false);
      });
    }
  }, [loan]);

  if (!loan) return null;

  const schedules = historyData?.loan?.schedules || loan.schedules || [];
  const collections = historyData?.collections || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Loan Schedule & Repayment History</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {loan.customer?.full_name} • Loan Account {loan.loan_account_no}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Principal</span>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ₹{Number(loan.principal_amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Payable</span>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ₹{Number(loan.total_payable).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Paid</span>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                ₹{Number(loan.total_paid).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Outstanding Balance</span>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                ₹{Number(loan.outstanding_amount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Repayment Schedules */}
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Installment Schedules ({schedules.length} EMIs)
          </h3>
          <div className="table-container" style={{ marginBottom: '24px', maxHeight: '200px' }}>
            <table>
              <thead>
                <tr>
                  <th>EMI #</th>
                  <th>Due Date</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Total Due</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch) => (
                  <tr key={sch.id}>
                    <td style={{ fontWeight: 700 }}>EMI #{sch.installment_no}</td>
                    <td>{sch.due_date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(sch.principal_component).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(sch.interest_component).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{Number(sch.due_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>₹{Number(sch.paid_amount).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${
                        sch.status === 'PAID'
                          ? 'badge-emerald'
                          : sch.status === 'PARTIALLY_PAID'
                          ? 'badge-amber'
                          : sch.status === 'OVERDUE'
                          ? 'badge-rose'
                          : 'badge-indigo'
                      }`}>
                        {sch.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Past Collection Receipts */}
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Repayment Receipts Log ({collections.length} Collections)
          </h3>
          <div className="table-container" style={{ maxHeight: '180px' }}>
            {collections.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                No repayments collected yet for this loan account.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Installment</th>
                    <th>Amount Collected</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col) => (
                    <tr key={col.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{col.receipt_no}</td>
                      <td>{new Date(col.collected_at).toLocaleDateString('en-IN')}</td>
                      <td>EMI #{col.installment_no}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
                        ₹{Number(col.amount_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                          onClick={() => onSelectReceipt(col)}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
