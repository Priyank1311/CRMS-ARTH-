import React, { useState } from 'react';
import api from '../api/client';
import { IndianRupee, X, AlertCircle } from 'lucide-react';

export default function CollectModal({ schedule, loan, customer, onClose, onSuccess }) {
  const due = Number(schedule.remaining_due || schedule.due_amount);
  const [amount, setAmount] = useState(due);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cash denomination counter
  const [d500, setD500] = useState(0);
  const [d200, setD200] = useState(0);
  const [d100, setD100] = useState(0);

  const calculatedCashTotal = (d500 * 500) + (d200 * 200) + (d100 * 100);

  const handleApplyCashTotal = () => {
    if (calculatedCashTotal > 0) {
      setAmount(calculatedCashTotal);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = Number(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/collections/record/', {
        schedule_id: schedule.id,
        amount: val.toFixed(2),
        payment_mode: paymentMode,
        idempotency_key: crypto.randomUUID(),
        notes: notes || `Field repayment collected for EMI #${schedule.installment_no}`,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Record Loan Repayment</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {customer.full_name} • Loan {loan.loan_account_no}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '12px', marginBottom: '18px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Installment</span>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>EMI #{schedule.installment_no}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance Due</span>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${paymentMode === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMode('CASH')}
                >
                  💵 Cash Repayment
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMode === 'UPI_SANDBOX' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMode('UPI_SANDBOX')}
                >
                  📱 UPI Digital (Sandbox)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount to Collect (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-input"
                style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAmount(due)}>
                  Full Due (₹{due})
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAmount(Math.max(1000, Math.floor(due / 2)))}>
                  Partial (₹{Math.max(1000, Math.floor(due / 2))})
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAmount(due + 2000)}>
                  Advance (+₹2,000)
                </button>
              </div>
            </div>

            {paymentMode === 'CASH' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                  CASH DENOMINATION COUNTER:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>₹500 Notes</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={d500}
                      onChange={(e) => setD500(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>₹200 Notes</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={d200}
                      onChange={(e) => setD200(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>₹100 Notes</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={d100}
                      onChange={(e) => setD100(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </div>
                {calculatedCashTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
                    <span>Counted: <strong>₹{calculatedCashTotal.toLocaleString('en-IN')}</strong></span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleApplyCashTotal}>
                      Use Counted Total
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Field cash collected at customer residence"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Recording...' : `Confirm & Collect ₹${Number(amount || 0).toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
