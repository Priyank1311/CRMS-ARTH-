import React, { useState } from 'react';
import api from '../api/client';
import { X, CheckCircle, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function SettleModal({ deposit, onClose, onSuccess }) {
  const deposited = Number(deposit.deposited_amount);
  const [creditedAmount, setCreditedAmount] = useState(deposited);
  const [mismatchReason, setMismatchReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const diff = Number(creditedAmount) - deposited;
  const isExact = diff === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isExact && !mismatchReason.trim()) {
      setError('Please provide a reason explaining the bank credit difference.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/bank-deposits/${deposit.id}/settle/`, {
        credited_amount: Number(creditedAmount).toFixed(2),
        mismatch_reason: mismatchReason,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Settlement confirmation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Bank Credit Statement Settlement</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Confirm deposit credit into corporate company bank account
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

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Deposit Slip</span>
                  <div style={{ fontWeight: 700 }}>{deposit.deposit_slip_no}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Branch</span>
                  <div style={{ fontWeight: 600 }}>{deposit.branch_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Bank & Ref</span>
                  <div>{deposit.bank_name} • {deposit.bank_reference_no}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Deposited Amount</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    ₹{deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Actual Credited Amount in Statement (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                value={creditedAmount}
                onChange={(e) => setCreditedAmount(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreditedAmount(deposited)}>
                  Match Deposited (₹{deposited})
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreditedAmount(deposited - 500)}>
                  Simulate Bank Mismatch (-₹500)
                </button>
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '12px',
              border: isExact ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
              background: isExact ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {isExact ? '✅ Clean 100% Reconciliation' : '⚠️ Settlement Discrepancy'}
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isExact ? '#34d399' : '#fb7185',
                }}>
                  {diff !== 0 ? `Diff: -₹${Math.abs(diff).toLocaleString('en-IN')}` : 'Balanced'}
                </span>
              </div>
            </div>

            {!isExact && (
              <div className="form-group">
                <label className="form-label">Bank Mismatch Reason *</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="e.g. Bank teller rejected ₹500 torn/fake note; or bank processing fee deduction"
                  value={mismatchReason}
                  onChange={(e) => setMismatchReason(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isExact ? 'btn-success' : 'btn-danger'}`}
              disabled={submitting}
            >
              <ShieldCheck size={16} />
              <span>{submitting ? 'Confirming...' : isExact ? 'Confirm Settlement' : 'Flag Settlement Mismatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
