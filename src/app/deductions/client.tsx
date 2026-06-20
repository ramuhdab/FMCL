'use client';
import { useEffect, useState } from 'react';
import { formatDate, statusBadge } from '@/lib/utils';

export default function DeductionsClient() {
  const [deductions, setDeductions] = useState<any[]>([]);

  async function load() {
    const res = await fetch('/api/deductions');
    const data = await res.json();
    setDeductions(data.deductions || []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: number, status: string) {
    await fetch('/api/deductions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  }

  const total = deductions.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Salary Deductions</div>
          <div className="page-subtitle">Track and process uniform cost recoveries</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.75rem 1.25rem', textAlign: 'right' }}>
          <div style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL PENDING</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Employee</th><th>Code</th><th>Reason</th><th>Tenure (Days)</th><th>Amount (₹)</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {deductions.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.employee_name}</td>
                  <td><code style={{ background: '#f1f5f9', padding: '.2rem .4rem', borderRadius: 4, fontSize: '.75rem' }}>{d.employee_code}</code></td>
                  <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.reason}</td>
                  <td>{d.tenure_days ?? '—'}</td>
                  <td style={{ fontWeight: 700, color: '#ef4444' }}>₹{d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{formatDate(d.created_at)}</td>
                  <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                  <td style={{ display: 'flex', gap: '.375rem' }}>
                    {d.status === 'pending' && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => updateStatus(d.id, 'processed')}>Process</button>
                        <button className="btn-secondary btn-sm" onClick={() => updateStatus(d.id, 'waived')}>Waive</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {deductions.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No deductions recorded</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginTop: '1.5rem', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <h4 style={{ fontWeight: 700, color: '#0369a1', marginBottom: '.5rem' }}>📋 Deduction Policy</h4>
        <ul style={{ color: '#0369a1', fontSize: '.875rem', paddingLeft: '1.25rem' }}>
          <li>Leave within <strong>1 week</strong>: Full uniform cost recovered</li>
          <li>Leave after 1 week: Prorated deduction based on tenure</li>
          <li>Day 1 (OJT): Client-funded, no deduction</li>
          <li>Recovery starts from <strong>Day 2</strong> onwards</li>
        </ul>
      </div>
    </div>
  );
}
