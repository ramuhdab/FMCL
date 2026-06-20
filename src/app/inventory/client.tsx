'use client';
import { useEffect, useState } from 'react';

export default function InventoryClient() {
  const [data, setData] = useState<any>({ items: [], categories: [], vendors: [] });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdj, setStockAdj] = useState({ item_id: 0, qty: 0, notes: '' });
  const [form, setForm] = useState<any>({ name: '', category_id: '', vendor_id: '', size: '', unit: 'piece', unit_cost: 0, stock_quantity: 0, low_stock_threshold: 20 });

  async function load() {
    const params = new URLSearchParams({ search, category });
    const res = await fetch('/api/inventory?' + params);
    setData(await res.json());
  }

  useEffect(() => { load(); }, [search, category]);

  function openAdd() {
    setEditItem(null);
    setForm({ name: '', category_id: data.categories[0]?.id ?? '', vendor_id: '', size: '', unit: 'piece', unit_cost: 0, stock_quantity: 0, low_stock_threshold: 20 });
    setShowModal(true);
  }
  function openEdit(item: any) {
    setEditItem(item);
    setForm({ name: item.name, category_id: item.category_id, vendor_id: item.vendor_id ?? '', size: item.size ?? '', unit: item.unit, unit_cost: item.unit_cost, stock_quantity: item.stock_quantity, low_stock_threshold: item.low_stock_threshold });
    setShowModal(true);
  }

  async function handleSave() {
    const url = editItem ? `/api/inventory/${editItem.id}` : '/api/inventory';
    const method = editItem ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false); load();
  }

  async function handleStockAdj() {
    await fetch(`/api/inventory/${stockAdj.item_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_adjustment: stockAdj.qty, notes: stockAdj.notes }),
    });
    setShowStockModal(false); load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">{data.items.length} items across {data.categories.length} categories</div>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Item</button>
      </div>

      <div className="filter-bar">
        <input className="form-input" style={{ width: 220 }} placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 200 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>Item Name</th><th>Category</th><th>Size</th><th>Vendor</th>
              <th>Unit Cost (₹)</th><th>Stock</th><th>Min Stock</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {data.items.map((item: any) => {
                const isLow = item.stock_quantity <= item.low_stock_threshold;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.category_name}</td>
                    <td>{item.size || '—'}</td>
                    <td>{item.vendor_name || '—'}</td>
                    <td>₹{item.unit_cost.toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? '#ef4444' : '#10b981', fontSize: '1rem' }}>{item.stock_quantity}</span>
                    </td>
                    <td>{item.low_stock_threshold}</td>
                    <td>
                      <span className={`badge ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '.375rem' }}>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                      <button className="btn-primary btn-sm" onClick={() => { setStockAdj({ item_id: item.id, qty: 0, notes: '' }); setShowStockModal(true); }}>+/−</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Del</button>
                    </td>
                  </tr>
                );
              })}
              {data.items.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.125rem' }}>{editItem ? 'Edit Item' : 'Add Inventory Item'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Item Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Category</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm((f: any) => ({ ...f, category_id: e.target.value }))}>
                    {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Vendor</label>
                  <select className="form-select" value={form.vendor_id} onChange={e => setForm((f: any) => ({ ...f, vendor_id: e.target.value }))}>
                    <option value="">No vendor</option>
                    {data.vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Size</label>
                  <input className="form-input" placeholder="M, L, XL, 8…" value={form.size} onChange={e => setForm((f: any) => ({ ...f, size: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Unit Cost (₹)</label>
                  <input type="number" className="form-input" value={form.unit_cost} onChange={e => setForm((f: any) => ({ ...f, unit_cost: parseFloat(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Min Stock</label>
                  <input type="number" className="form-input" value={form.low_stock_threshold} onChange={e => setForm((f: any) => ({ ...f, low_stock_threshold: parseInt(e.target.value) }))} />
                </div>
              </div>
              {!editItem && (
                <div>
                  <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Initial Stock</label>
                  <input type="number" className="form-input" value={form.stock_quantity} onChange={e => setForm((f: any) => ({ ...f, stock_quantity: parseInt(e.target.value) }))} />
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

      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Adjust Stock</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Quantity (+ add, − remove)</label>
                <input type="number" className="form-input" value={stockAdj.qty} onChange={e => setStockAdj(s => ({ ...s, qty: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, marginBottom: '.375rem' }}>Notes</label>
                <input className="form-input" value={stockAdj.notes} onChange={e => setStockAdj(s => ({ ...s, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleStockAdj}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
