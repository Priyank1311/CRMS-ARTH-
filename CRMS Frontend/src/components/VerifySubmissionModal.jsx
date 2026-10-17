import React, { useState } from 'react';
import api from '../api/client';
import { X, CheckCircle, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function VerifySubmissionModal({ submission, onClose, onSuccess }) {
  const declared = Number(submission.declared_amount);
  const [countedAmount, setCountedAmount] = useState(declared);
  const [action, setAction] = useState('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const diff = Number(countedAmount) - declared;
  const isBalanced = diff === 0;
  const isShortage = diff < 0;
  const isExcess = diff > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (action === 'REJECT' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejecting this cash submission.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/submissions/${submission.id}/verify/`, {
        action,
        counted_amount: Number(countedAmount || 0).toFixed(2),
        rejection_reason: rejectionReason,
        resolution_notes: resolutionNotes || `Verified by branch manager during physical count.`,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Branch Cash Reconciliation</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Verify physical cash received from {submission.agent_name}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submission Batch</span>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{submission.submission_no}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {submission.collection_count} Receipts Bundled
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agent Declared Amount</span>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8', marginTop: '2px' }}>
                  ₹{declared.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Manager Verification Decision</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${action === 'APPROVE' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setAction('APPROVE')}
                >
                  <CheckCircle size={16} />
                  <span>Count & Approve</span>
                </button>
                <button
                  type="button"
                  className={`btn ${action === 'REJECT' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setAction('REJECT')}
                >
                  <AlertTriangle size={16} />
                  <span>Reject Submission</span>
                </button>
              </div>
            </div>

            {action === 'APPROVE' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Physically Counted Cash Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                    value={countedAmount}
                    onChange={(e) => setCountedAmount(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCountedAmount(declared)}>
                      Exact Match (₹{declared})
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCountedAmount(declared - 1500)}>
                      Simulate Shortage (-₹1,500)
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: isBalanced
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : isShortage
                    ? '1px solid rgba(244, 63, 94, 0.3)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
                  background: isBalanced
                    ? 'rgba(16, 185, 129, 0.08)'
                    : isShortage
                    ? 'rgba(244, 63, 94, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {isBalanced && '✅ Exact Match — No Discrepancy'}
                      {isShortage && '⚠️ Cash Shortage Detected'}
                      {isExcess && 'ℹ️ Cash Excess Detected'}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isBalanced ? '#34d399' : isShortage ? '#fb7185' : '#fbbf24',
                    }}>
                      {diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : diff < 0 ? `-₹${Math.abs(diff).toLocaleString('en-IN')}` : '₹0.00'}
                    </span>
                  </div>
                  {!isBalanced && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      A formal Discrepancy record will be created automatically in the branch discrepancy ledger.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Manager Resolution Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Physical count confirmed in branch vault presence"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="State the reason (e.g. Envelope seal tampered, counterfeit notes suspected, missing denominations)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Collections will revert back to the field agent's unsubmitted queue for audit and re-submission.
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${action === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
              disabled={submitting}
            >
              {submitting
                ? 'Processing...'
                : action === 'APPROVE'
                ? `Confirm & Credit Vault (+₹${Number(countedAmount || 0).toLocaleString('en-IN')})`
                : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
