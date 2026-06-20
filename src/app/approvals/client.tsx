'use client';
import { useEffect, useState } from 'react';
import { formatDate, roleLabel } from '@/lib/utils';

export default function ApprovalsClient() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/approvals');
    const data = await res.json();
    setApprovals(data.approvals || []);
  }

  useEffect(() => { load(); }, []);

  function openModal(approval: any, act: 'approved' | 'rejected') {
    setSelected(approval); setAction(act); setComment(''); setError(''); setShowModal(true);
  }

  async function handleAction() {
    if (!comment.trim()) { setError('Comments are required before submitting.'); return; }
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: selected.id, action, comments: comment.trim() }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) { setError(data.error || `Server error (${res.status}). Please try again.`); return; }
      setShowModal(false); load();
    } catch {
      setError('Unexpected error. Please refresh and try again.');
    }
  }

  const stockColor = (qty: number) => qty <= 0 ? '#ef4444' : qty <= 20 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Pending Approvals</div>
          <div className="page-subtitle">Procurement requests awaiting your approval</div>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
          <div style={{ fontWeight: 600, color: '#64748b' }}>No pending approvals for your role</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {approvals.map((a: any) => (
            <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Request #{a.procurement_id}</span>
                  <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '.2rem .5rem', fontSize: '.75rem', fontWeight: 600 }}>
                    Step {a.step} of 4
                  </span>
                  <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '.2rem .5rem', fontSize: '.75rem' }}>
                    {roleLabel(a.role)}
                  </span>
                </div>
                <div style={{ color: '#374151', fontWeight: 600, fontSize: '1rem' }}>{a.item_name}</div>
                <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '.875rem', marginTop: '.375rem', flexWrap: 'wrap' }}>
                  <span>Requested Qty: <strong style={{ color: '#1d4ed8' }}>{a.quantity_requested}</strong></span>
                  <span>Available Stock: <strong style={{ color: stockColor(a.stock_quantity) }}>{a.stock_quantity}</strong></span>
                  <span>Submitted: {formatDate(a.created_at)}</span>
                </div>
                {a.justification && (
                  <div style={{ color: '#64748b', fontSize: '.875rem', marginTop: '.375rem', fontStyle: 'italic' }}>
                    "{a.justification}"
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <button className="btn-primary" onClick={() => openModal(a, 'approved')}>✓ Approve</button>
                <button className="btn-danger" onClick={() => openModal(a, 'rejected')}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: action === 'approved' ? '#10b981' : '#ef4444' }}>
              {action === 'approved' ? '✓ Approve Request' : '✗ Reject Request'}
            </h3>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.875rem' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '.25rem' }}>{selected?.item_name}</div>
              <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b' }}>
                <span>Requested: <strong style={{ color: '#1d4ed8' }}>{selected?.quantity_requested}</strong></span>
                <span>In Stock: <strong style={{ color: stockColor(selected?.stock_quantity) }}>{selected?.stock_quantity}</strong></span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>
                Comments <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                suppressHydrationWarning
                className="form-input"
                rows={3}
                value={comment}
                onChange={e => { setComment(e.target.value); if (e.target.value.trim()) setError(''); }}
                placeholder={action === 'rejected' ? 'Reason for rejection (required)…' : 'Remarks (required)…'}
                style={{ borderColor: error ? '#ef4444' : undefined }}
              />
              {error && <div style={{ color: '#ef4444', fontSize: '.8125rem', marginTop: '.375rem' }}>{error}</div>}
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className={action === 'approved' ? 'btn-primary' : 'btn-danger'} onClick={handleAction}>
                Confirm {action === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
