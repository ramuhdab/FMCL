'use client';
import { useEffect, useState } from 'react';
import { formatDate, statusBadge } from '@/lib/utils';

export default function AllocationsClient() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ employee_id: '', item_id: '', quantity: 1, allocation_date: '', notes: '' });

  async function load() {
    const [aRes, eRes, iRes] = await Promise.all([
      fetch('/api/allocations'),
      fetch('/api/employees?status=active'),
      fetch('/api/inventory'),
    ]);
    const aData = await aRes.json();
    const eData = await eRes.json();
    const iData = await iRes.json();
    setAllocations(aData.allocations || []);
    setEmployees(eData.employees || []);
    setItems(iData.items || []);
  }

  useEffect(() => { load(); }, []);

  async function handleIssue() {
    const res = await fetch('/api/allocations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Error issuing item'); return; }
    setShowModal(false); load();
  }

  async function handleAction(id: number, action: string) {
    const return_date = new Date().toISOString().split('T')[0];
    await fetch('/api/allocations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, return_date }) });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Allocations</div>
          <div className="page-subtitle">Track uniform issuance to employees</div>
        </div>
        <button className="btn-primary" onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          setForm({ employee_id: employees[0]?.id ?? '', item_id: items[0]?.id ?? '', quantity: 1, allocation_date: today, notes: '' });
          setShowModal(true);
        }}>+ Issue Item</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>Employee</th><th>Code</th><th>Building</th><th>Item</th>
              <th>Qty</th><th>Issued On</th><th>Return Date</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {allocations.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.employee_name}</td>
                  <td><code style={{ background: '#f1f5f9', padding: '.2rem .4rem', borderRadius: 4, fontSize: '.75rem' }}>{a.employee_code}</code></td>
                  <td>{a.building_name}</td>
                  <td>{a.item_name} {a.size && `(${a.size})`}</td>
                  <td>{a.quantity}</td>
                  <td>{formatDate(a.allocation_date)}</td>
                  <td>{formatDate(a.return_date)}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                  <td style={{ display: 'flex', gap: '.375rem' }}>
                    {a.status === 'issued' && (
                      <>
                        <button className="btn-secondary btn-sm" onClick={() => handleAction(a.id, 'return')}>Return</button>
                        <button className="btn-danger btn-sm" onClick={() => handleAction(a.id, 'deduct')}>Deduct</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {allocations.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No allocations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.125rem' }}>Issue Item to Employee</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Employee</label>
                <select suppressHydrationWarning className="form-select" value={form.employee_id} onChange={e => setForm((f: any) => ({ ...f, employee_id: e.target.value }))}>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Item</label>
                <select suppressHydrationWarning className="form-select" value={form.item_id} onChange={e => setForm((f: any) => ({ ...f, item_id: e.target.value }))}>
                  {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} {i.size ? `(${i.size})` : ''} — Stock: {i.stock_quantity}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Quantity</label>
                  <input suppressHydrationWarning type="number" min={1} className="form-input" value={form.quantity} onChange={e => setForm((f: any) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Issue Date</label>
                  <input suppressHydrationWarning type="date" className="form-input" value={form.allocation_date} onChange={e => setForm((f: any) => ({ ...f, allocation_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Notes</label>
                <input suppressHydrationWarning className="form-input" placeholder="Optional notes…" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleIssue}>Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
