import React, { useState } from 'react';
import api from '../api/client';
import { X, Send, AlertCircle, CheckSquare, Square } from 'lucide-react';

export default function SubmitCashModal({ collections, onClose, onSuccess }) {
  const [selectedIds, setSelectedIds] = useState(collections.map((c) => c.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === collections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(collections.map((c) => c.id));
    }
  };

  const selectedTotal = collections
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + Number(c.amount_collected), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedIds.length === 0) {
      setError('Please select at least one collection to submit.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/submissions/', {
        collection_ids: selectedIds,
        denominations: { notes: 'Bundle prepared for branch vault' },
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit cash handover.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Submit Cash to Branch Manager</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Batch handover of field collections to branch vault
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={selectAll}>
                {selectedIds.length === collections.length ? 'Deselect All' : 'Select All'}
              </button>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Selected: <strong>{selectedIds.length}</strong> of {collections.length} items
              </div>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginBottom: '18px' }}>
              {collections.map((col) => {
                const isSelected = selectedIds.includes(col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => toggleSelect(col.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isSelected ? <CheckSquare size={18} color="#6366f1" /> : <Square size={18} color="#64748b" />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{col.customer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {col.receipt_no} • {col.loan_account_no} (EMI #{col.installment_no})
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '15px' }}>
                      ₹{Number(col.amount_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 600 }}>Total Declared Handover Amount</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This amount will be verified by the branch manager upon cash count.</p>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                ₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || selectedIds.length === 0}>
              <Send size={16} />
              <span>{submitting ? 'Submitting Batch...' : `Submit Handover Batch (₹${selectedTotal.toLocaleString('en-IN')})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
