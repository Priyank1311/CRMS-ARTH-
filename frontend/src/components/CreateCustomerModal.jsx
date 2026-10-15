import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export default function CreateCustomerModal({ branchId, onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branchId || '');
  const [branches, setBranches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/branches/').then((res) => {
      const list = res.data.results || res.data;
      setBranches(list);
      if (!selectedBranch && list.length > 0) {
        setSelectedBranch(list[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all customer details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/customers/', {
        full_name: fullName,
        phone,
        address,
        branch_id: selectedBranch,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Onboard New Borrower</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Create customer profile with KYC verification
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
              <label className="form-label">Borrower Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rameshwar Patil"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 98111 22334"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 14/B, Gandhi Nagar, Bangalore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Home Branch</label>
              <select
                className="form-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <UserPlus size={16} />
              <span>{submitting ? 'Creating...' : 'Onboard Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
