'use client';
import { useEffect, useState } from 'react';
import { formatDate, statusBadge } from '@/lib/utils';

export default function EmployeesClient() {
  const [data, setData] = useState<any>({ employees: [], buildings: [], categories: [] });
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', building_id: '', category_id: '', join_date: '', leave_date: '', status: 'active' });

  async function load() {
    const params = new URLSearchParams({ search, building, category, status });
    const res = await fetch('/api/employees?' + params);
    const d = await res.json();
    setData(d);
  }

  useEffect(() => { load(); }, [search, building, category, status]);

  function openAdd() {
    setEditEmp(null);
    setForm({ name: '', building_id: data.buildings[0]?.id ?? '', category_id: data.categories[0]?.id ?? '', join_date: new Date().toISOString().split('T')[0], leave_date: '', status: 'active' });
    setShowModal(true);
  }
  function openEdit(emp: any) {
    setEditEmp(emp);
    setForm({ name: emp.name, building_id: emp.building_id, category_id: emp.category_id, join_date: emp.join_date, leave_date: emp.leave_date ?? '', status: emp.status });
    setShowModal(true);
  }

  async function handleSave() {
    const url = editEmp ? `/api/employees/${editEmp.id}` : '/api/employees';
    const method = editEmp ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false); load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-subtitle">{data.employees.length} records found</div>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      <div className="filter-bar">
        <input className="form-input" style={{ width: 220 }} placeholder="Search name or code…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 160 }} value={building} onChange={e => setBuilding(e.target.value)}>
          <option value="">All Buildings</option>
          {data.buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 180 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="left">Left</option>
          <option value="terminated">Terminated</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>Code</th><th>Name</th><th>Building</th><th>Category</th>
              <th>Join Date</th><th>Leave Date</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {data.employees.map((e: any) => (
                <tr key={e.id}>
                  <td><code style={{ background: '#f1f5f9', padding: '.2rem .4rem', borderRadius: 4, fontSize: '.8rem' }}>{e.employee_code}</code></td>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td>{e.building_name}</td>
                  <td>{e.category_name}</td>
                  <td>{formatDate(e.join_date)}</td>
                  <td>{formatDate(e.leave_date)}</td>
                  <td><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                  <td><button className="btn-secondary btn-sm" onClick={() => openEdit(e)}>Edit</button></td>
                </tr>
              ))}
              {data.employees.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.125rem' }}>{editEmp ? 'Edit Employee' : 'Add Employee'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Building</label>
                  <select className="form-select" value={form.building_id} onChange={e => setForm((f: any) => ({ ...f, building_id: e.target.value }))}>
                    {data.buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Category</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm((f: any) => ({ ...f, category_id: e.target.value }))}>
                    {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Join Date</label>
                  <input type="date" className="form-input" value={form.join_date} onChange={e => setForm((f: any) => ({ ...f, join_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Leave Date</label>
                  <input type="date" className="form-input" value={form.leave_date} onChange={e => setForm((f: any) => ({ ...f, leave_date: e.target.value }))} />
                </div>
              </div>
              {editEmp && (
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="left">Left</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
