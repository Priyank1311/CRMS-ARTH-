import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, FileText, AlertCircle, Calculator } from 'lucide-react';

export default function CreateLoanModal({ customerId, customers, onClose, onSuccess }) {
  const [selectedCustomer, setSelectedCustomer] = useState(customerId || (customers?.[0]?.id || ''));
  const [principal, setPrincipal] = useState(50000);
  const [interestRate, setInterestRate] = useState(15.0);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live calculations
  const p = Number(principal) || 0;
  const r = Number(interestRate) || 0;
  const t = Number(tenureMonths) || 1;
  const totalInterest = (p * r * t) / 1200;
  const totalPayable = p + totalInterest;
  const monthlyEmi = t > 0 ? (totalPayable / t) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer for this loan.');
      return;
    }

    if (p <= 0 || t <= 0) {
      setError('Please enter valid principal amount and tenure.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/loans/', {
        customer_id: selectedCustomer,
        principal_amount: p.toFixed(2),
        interest_rate_pct: r.toFixed(2),
        tenure_months: t,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create loan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Disburse New Loan</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Auto-generate monthly repayment schedules & EMIs
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

            <div className="form-group">
              <label className="form-label">Borrower Account *</label>
              <select
                className="form-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                disabled={Boolean(customerId)}
                required
              >
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Principal Amount (₹) *</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  className="form-input"
                  style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tenure (Months)</label>
              <select
                className="form-select"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(parseInt(e.target.value))}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>

            {/* Live Calculation Card */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Calculator size={16} color="#818cf8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>
                  REPAYMENT SCHEDULE AMORTIZATION PREVIEW:
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Total Interest</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ₹{totalInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Total Payable</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Monthly EMI</span>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399', fontSize: '15px' }}>
                    ₹{monthlyEmi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <FileText size={16} />
              <span>{submitting ? 'Creating Loan...' : `Create Loan & Generate ${tenureMonths} EMIs`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
