'use client';
import { useEffect, useState } from 'react';
import { statusBadge } from '@/lib/utils';

const ROLES = ['admin','tech_manager','senior_manager','finance_manager','managing_director','staff'];
const ROLE_LABELS: Record<string,string> = { admin:'Admin', tech_manager:'Tech Manager', senior_manager:'Senior Manager', finance_manager:'Finance Manager', managing_director:'Managing Director', staff:'Staff' };

export default function AdminClient() {
  const [data, setData] = useState<any>({ users: [], buildings: [] });
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', email: '', password: '', role: 'staff', building_id: '', active: 1 });

  async function load() {
    const res = await fetch('/api/users');
    if (res.ok) setData(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'staff', building_id: '', active: 1 }); setShowModal(true); }
  function openEdit(u: any) { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, building_id: u.building_id ?? '', active: u.active }); setShowModal(true); }

  async function handleSave() {
    const url = editUser ? `/api/users/${editUser.id}` : '/api/users';
    await fetch(url, { method: editUser ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false); load();
  }
  async function handleDeactivate(id: number) {
    if (!confirm('Deactivate this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' }); load();
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">User Administration</div><div className="page-subtitle">Manage system users and roles</div></div>
        <button className="btn-primary" onClick={openAdd}>+ Add User</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Building</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: '#2563eb' }}>{u.email}</td>
                  <td><span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '.2rem .5rem', fontSize: '.75rem', fontWeight: 600 }}>{ROLE_LABELS[u.role] ?? u.role}</span></td>
                  <td>{data.buildings.find((b: any) => b.id === u.building_id)?.name || '—'}</td>
                  <td><span className={`badge ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ display: 'flex', gap: '.375rem' }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    {u.active ? <button className="btn-danger btn-sm" onClick={() => handleDeactivate(u.id)}>Deactivate</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>{editUser ? 'Edit User' : 'Add User'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div><label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Full Name</label><input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
              <div><label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Password {editUser && '(blank = no change)'}</label><input type="password" className="form-input" value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select></div>
                <div><label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Building</label>
                  <select className="form-select" value={form.building_id} onChange={e => setForm((f: any) => ({ ...f, building_id: e.target.value }))}>
                    <option value="">All Buildings</option>
                    {data.buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select></div>
              </div>
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
