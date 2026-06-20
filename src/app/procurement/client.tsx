'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, statusBadge } from '@/lib/utils';

export default function ProcurementClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ item_id: '', quantity_requested: 1, justification: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    const params = new URLSearchParams(statusFilter ? { status: statusFilter } : {});
    const [pRes, iRes] = await Promise.all([fetch('/api/procurement?' + params), fetch('/api/inventory')]);
    const pData = await pRes.json();
    const iData = await iRes.json();
    setRequests(pData.requests || []);
    setItems(iData.items || []);
  }

  useEffect(() => { load(); }, [statusFilter]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.item_id) e.item_id = 'Please select an item.';
    if (!form.quantity_requested || form.quantity_requested < 1) e.quantity_requested = 'Quantity must be at least 1.';
    if (!form.justification.trim()) e.justification = 'Justification is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    const res = await fetch('/api/procurement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, justification: form.justification.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErrors({ justification: data.error || 'Failed to submit request.' }); return; }
    setShowModal(false); load();
  }

  function openModal() {
    setForm({ item_id: items[0]?.id ?? '', quantity_requested: 1, justification: '' });
    setErrors({});
    setShowModal(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Procurement</div>
          <div className="page-subtitle">Manage purchase requests and approvals</div>
        </div>
        <button className="btn-primary" onClick={openModal}>+ New Request</button>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Justification</th><th>Requester</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {requests.map((r: any) => (
              <tr
                key={r.id}
                onClick={r.status === 'pending' ? () => router.push('/approvals') : undefined}
                style={r.status === 'pending' ? { cursor: 'pointer' } : undefined}
                title={r.status === 'pending' ? 'Click to view pending approvals' : undefined}
              >
                <td>#{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.item_name}</td>
                <td>{r.quantity_requested}</td>
                <td style={{ maxWidth: 220, color: '#64748b', fontSize: '.875rem' }}>{r.justification || '—'}</td>
                <td>{r.requester_name || '—'}</td>
                <td>{formatDate(r.created_at)}</td>
                <td>
                  <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                  {r.status === 'pending' && (
                    <span style={{ marginLeft: '.5rem', fontSize: '.7rem', color: '#3b82f6' }}>→ Approvals</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>4-Step Approval Workflow</h3>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['Tech Manager', 'Senior Manager', 'Finance Manager', 'Managing Director'].map((role, i) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 8, padding: '.5rem .875rem', fontWeight: 600, fontSize: '.875rem' }}>{i + 1}. {role}</div>
              {i < 3 && <span style={{ color: '#94a3b8' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>New Procurement Request</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>

              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>
                  Item <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  suppressHydrationWarning
                  className="form-select"
                  value={form.item_id}
                  onChange={e => { setForm((f: any) => ({ ...f, item_id: e.target.value })); setErrors(v => ({ ...v, item_id: '' })); }}
                  style={{ borderColor: errors.item_id ? '#ef4444' : undefined }}
                >
                  <option value="">— Select an item —</option>
                  {items.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name}{i.size ? ` (${i.size})` : ''} — Stock: {i.stock_quantity}</option>
                  ))}
                </select>
                {errors.item_id && <div style={{ color: '#ef4444', fontSize: '.8125rem', marginTop: '.25rem' }}>{errors.item_id}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>
                  Quantity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  suppressHydrationWarning
                  type="number" min={1}
                  className="form-input"
                  value={form.quantity_requested}
                  onChange={e => { setForm((f: any) => ({ ...f, quantity_requested: parseInt(e.target.value) || '' })); setErrors(v => ({ ...v, quantity_requested: '' })); }}
                  style={{ borderColor: errors.quantity_requested ? '#ef4444' : undefined }}
                />
                {errors.quantity_requested && <div style={{ color: '#ef4444', fontSize: '.8125rem', marginTop: '.25rem' }}>{errors.quantity_requested}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>
                  Justification <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  suppressHydrationWarning
                  className="form-input"
                  rows={4}
                  value={form.justification}
                  onChange={e => { setForm((f: any) => ({ ...f, justification: e.target.value })); setErrors(v => ({ ...v, justification: '' })); }}
                  placeholder="Describe why this procurement is needed…"
                  style={{ borderColor: errors.justification ? '#ef4444' : undefined }}
                />
                {errors.justification && <div style={{ color: '#ef4444', fontSize: '.8125rem', marginTop: '.25rem' }}>{errors.justification}</div>}
              </div>

            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
