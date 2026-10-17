import React, { useState } from 'react';
import api from '../api/client';
import { X, Landmark, AlertCircle, CheckSquare, Square } from 'lucide-react';

export default function DepositModal({ submissions, vaultBalance, branchId, onClose, onSuccess }) {
  const [selectedIds, setSelectedIds] = useState(submissions.map((s) => s.id));
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNo, setAccountNo] = useState('50200088991122');
  const [refNo, setRefNo] = useState(`CHQ-${Date.now().toString().slice(-6)}`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTotal = submissions
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.verified_amount || s.declared_amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedIds.length === 0) {
      setError('Please select at least one reconciled cash submission to deposit.');
      return;
    }

    if (selectedTotal > vaultBalance) {
      setError(`Cannot deposit ₹${selectedTotal} — Branch vault balance is only ₹${vaultBalance}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bank-deposits/', {
        branch_id: branchId,
        submission_ids: selectedIds,
        bank_name: bankName,
        account_no: accountNo,
        bank_reference_no: refNo,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bank deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Deposit Reconciled Cash to Bank</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Transfer cash from branch vault safe to corporate bank account
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

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Vault Safe Cash</span>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  ₹{Number(vaultBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deposit Total</span>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  ₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Reconciled Batches to Include</label>
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                {submissions.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                    No un-deposited reconciled batches found.
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const isSelected = selectedIds.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        onClick={() => toggleSelect(sub.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isSelected ? <CheckSquare size={16} color="#6366f1" /> : <Square size={16} color="#64748b" />}
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{sub.submission_no}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '8px' }}>({sub.agent_name})</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          ₹{Number(sub.verified_amount || sub.declared_amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <select className="form-select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bank Challan / Slip Reference No. *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC-CHQ-9912048"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Unique transaction identifier provided by bank teller.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || selectedIds.length === 0}
            >
              <Landmark size={16} />
              <span>{submitting ? 'Generating Slip...' : `Create Deposit Slip (₹${selectedTotal.toLocaleString('en-IN')})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
