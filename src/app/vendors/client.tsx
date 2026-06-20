'use client';
import { useEffect, useState } from 'react';

export default function VendorsClient() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  async function load() {
    const res = await fetch('/api/vendors');
    const data = await res.json();
    setVendors(data.vendors || []);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false); load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Vendors</div>
          <div className="page-subtitle">Manage uniform and equipment suppliers</div>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ name: '', contact_person: '', email: '', phone: '', address: '' }); setShowModal(true); }}>+ Add Vendor</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
        {vendors.map((v: any) => (
          <div key={v.id} className="card" style={{ borderTop: '3px solid #3b82f6' }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '.5rem' }}>{v.name}</div>
            {v.contact_person && <div style={{ fontSize: '.875rem' }}>👤 {v.contact_person}</div>}
            {v.phone && <div style={{ fontSize: '.875rem', marginTop: '.25rem' }}>📞 {v.phone}</div>}
            {v.email && <div style={{ fontSize: '.875rem', color: '#2563eb', marginTop: '.25rem' }}>✉️ {v.email}</div>}
            {v.address && <div style={{ fontSize: '.8125rem', color: '#64748b', marginTop: '.5rem' }}>{v.address}</div>}
          </div>
        ))}
        {vendors.length === 0 && <div style={{ color: '#94a3b8', padding: '2rem' }}>No vendors yet</div>}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Add Vendor</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[{ key: 'name', label: 'Company Name *' }, { key: 'contact_person', label: 'Contact Person' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>{f.label}</label>
                  <input className="form-input" value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                </div>
              ))}
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
