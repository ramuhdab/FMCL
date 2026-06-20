'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, statusBadge } from '@/lib/utils';

const EMPTY_LINE = () => ({ item_id: '', quantity_requested: 1, justification: '' });

export default function ProcurementClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [lines, setLines] = useState([EMPTY_LINE(), EMPTY_LINE()]);
  const [lineErrors, setLineErrors] = useState<Record<string, string>[]>([{}, {}]);
  const [submitError, setSubmitError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    const params = new URLSearchParams(statusFilter ? { status: statusFilter } : {});
    const [pRes, iRes] = await Promise.all([fetch('/api/procurement?' + params), fetch('/api/inventory')]);
    const pData = await pRes.json();
    const iData = await iRes.json();
    setRequests(pData.requests || []);
    setItems(iData.items || []);
  }

  useEffect(() => { load(); }, [statusFilter]);

  function openModal() {
    setLines([EMPTY_LINE(), EMPTY_LINE()]);
    setLineErrors([{}, {}]);
    setSubmitError('');
    setShowModal(true);
  }

  function updateLine(idx: number, field: string, value: any) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    setLineErrors(prev => prev.map((e, i) => i === idx ? { ...e, [field]: '' } : e));
  }

  function addLine() {
    if (lines.length >= 5) return;
    setLines(prev => [...prev, EMPTY_LINE()]);
    setLineErrors(prev => [...prev, {}]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== idx));
    setLineErrors(prev => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    let valid = true;
    const newErrors = lines.map(line => {
      const e: Record<string, string> = {};
      if (!line.item_id) { e.item_id = 'Select an item'; valid = false; }
      if (!line.quantity_requested || line.quantity_requested < 1) { e.quantity_requested = 'Min 1'; valid = false; }
      if (!line.justification.trim()) { e.justification = 'Required'; valid = false; }
      return e;
    });
    setLineErrors(newErrors);
    return valid;
  }

  async function handleCreate() {
    if (!validate()) return;
    setSubmitError('');
    try {
      const res = await fetch('/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map(l => ({ ...l, quantity_requested: Number(l.quantity_requested) })) }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit.'); return; }
      setShowModal(false);
      load();
    } catch {
      setSubmitError('Unexpected error. Please try again.');
    }
  }

  const stockColor = (qty: number) => qty <= 0 ? '#ef4444' : qty <= 20 ? '#f59e0b' : '#10b981';

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
        <select suppressHydrationWarning className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Req. Qty</th><th>In Stock</th><th>Justification</th><th>Requester</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {requests.map((r: any) => (
              <tr
                key={r.id}
                onClick={r.status === 'pending' ? () => router.push('/approvals') : undefined}
                style={r.status === 'pending' ? { cursor: 'pointer' } : undefined}
                title={r.status === 'pending' ? 'Click to view pending approvals' : undefined}
              >
                <td>#{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.item_name}{r.size ? ` (${r.size})` : ''}</td>
                <td style={{ color: '#1d4ed8', fontWeight: 600 }}>{r.quantity_requested}</td>
                <td><span style={{ fontWeight: 600, color: stockColor(r.stock_quantity) }}>{r.stock_quantity}</span></td>
                <td style={{ maxWidth: 200, color: '#64748b', fontSize: '.875rem' }}>{r.justification || '—'}</td>
                <td>{r.requester_name || '—'}</td>
                <td>{formatDate(r.created_at)}</td>
                <td>
                  <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                  {r.status === 'pending' && <span style={{ marginLeft: '.5rem', fontSize: '.7rem', color: '#3b82f6' }}>→ Approvals</span>}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No requests</td></tr>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '95vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, margin: 0 }}>New Procurement Request</h3>
              <span style={{ fontSize: '.8125rem', color: '#64748b' }}>{lines.length} / 5 items</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '.25rem' }}>
              {lines.map((line, idx) => (
                <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', background: '#f8fafc', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '.8125rem', color: '#475569' }}>Item {idx + 1}</span>
                    {lines.length > 2 && (
                      <button
                        onClick={() => removeLine(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '.8125rem', fontWeight: 600, padding: '.125rem .375rem' }}
                      >✕ Remove</button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.75rem', marginBottom: '.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, marginBottom: '.25rem' }}>
                        Item <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        suppressHydrationWarning
                        className="form-select"
                        value={line.item_id}
                        onChange={e => updateLine(idx, 'item_id', e.target.value)}
                        style={{ borderColor: lineErrors[idx]?.item_id ? '#ef4444' : undefined }}
                      >
                        <option value="">— Select item —</option>
                        {items.map((i: any) => (
                          <option key={i.id} value={i.id}>
                            {i.name}{i.size ? ` (${i.size})` : ''} — Stock: {i.stock_quantity}
                          </option>
                        ))}
                      </select>
                      {lineErrors[idx]?.item_id && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: '.2rem' }}>{lineErrors[idx].item_id}</div>}
                    </div>
                    <div style={{ width: 100 }}>
                      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, marginBottom: '.25rem' }}>
                        Qty <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        suppressHydrationWarning
                        type="number" min={1}
                        className="form-input"
                        value={line.quantity_requested}
                        onChange={e => updateLine(idx, 'quantity_requested', parseInt(e.target.value) || 1)}
                        style={{ borderColor: lineErrors[idx]?.quantity_requested ? '#ef4444' : undefined }}
                      />
                      {lineErrors[idx]?.quantity_requested && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: '.2rem' }}>{lineErrors[idx].quantity_requested}</div>}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, marginBottom: '.25rem' }}>
                      Justification <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      suppressHydrationWarning
                      className="form-input"
                      rows={2}
                      value={line.justification}
                      onChange={e => updateLine(idx, 'justification', e.target.value)}
                      placeholder="Why is this item needed?"
                      style={{ borderColor: lineErrors[idx]?.justification ? '#ef4444' : undefined }}
                    />
                    {lineErrors[idx]?.justification && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: '.2rem' }}>{lineErrors[idx].justification}</div>}
                  </div>
                </div>
              ))}
            </div>

            {lines.length < 5 && (
              <button
                onClick={addLine}
                style={{ marginTop: '1rem', width: '100%', padding: '.625rem', border: '2px dashed #cbd5e1', borderRadius: 8, background: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}
              >
                + Add Another Item {lines.length < 5 ? `(${5 - lines.length} more allowed)` : ''}
              </button>
            )}

            {submitError && (
              <div style={{ color: '#ef4444', fontSize: '.8125rem', marginTop: '.75rem', padding: '.5rem .75rem', background: '#fef2f2', borderRadius: 6 }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>
                Submit {lines.length} Item{lines.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
