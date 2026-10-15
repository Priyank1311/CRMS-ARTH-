import React from 'react';
import { Printer, X, CheckCircle, QrCode } from 'lucide-react';

export default function ReceiptModal({ collection, onClose }) {
  if (!collection) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '16px' }}>Collection Receipt</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#f3f4f6', padding: '24px' }}>
          <div className="receipt-paper">
            <div className="receipt-header">
              <h2 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CMRS MICROFINANCE LTD
              </h2>
              <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                Loan Repayment Official Counterfoil
              </p>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px', color: '#111827' }}>
                {collection.receipt_no}
              </div>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Date & Time:</span>
              <span>{new Date(collection.collected_at).toLocaleString('en-IN')}</span>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Customer:</span>
              <span style={{ fontWeight: 600 }}>{collection.customer_name}</span>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Loan Account:</span>
              <span>{collection.loan_account_no}</span>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Installment:</span>
              <span>EMI #{collection.installment_no}</span>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Payment Mode:</span>
              <span style={{ fontWeight: 600, color: collection.payment_mode === 'CASH' ? '#059669' : '#4f46e5' }}>
                {collection.payment_mode}
              </span>
            </div>

            <div className="receipt-total">
              <span>AMOUNT COLLECTED:</span>
              <span>₹{Number(collection.amount_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="receipt-row" style={{ marginTop: '12px' }}>
              <span style={{ color: '#6b7280' }}>Collected By:</span>
              <span>{collection.agent_name}</span>
            </div>

            <div className="receipt-row">
              <span style={{ color: '#6b7280' }}>Status:</span>
              <span style={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                {collection.status.replace('_', ' ')}
              </span>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div style={{ display: 'inline-block', padding: '8px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <QrCode size={54} color="#1f2937" />
              </div>
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                Scan to verify tamper-proof receipt authenticity
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
