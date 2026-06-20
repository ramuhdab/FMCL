import AppShell from '@/app/components/AppShell';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate, statusBadge } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await getSession();
  const db = getDb();

  const totalEmployees = (db.prepare("SELECT COUNT(*) as c FROM employees WHERE status='active'").get() as any).c;
  const totalItems = (db.prepare('SELECT COUNT(*) as c FROM inventory_items').get() as any).c;
  const lowStock = (db.prepare('SELECT COUNT(*) as c FROM inventory_items WHERE stock_quantity <= low_stock_threshold').get() as any).c;
  const pendingProcurement = (db.prepare("SELECT COUNT(*) as c FROM procurement_requests WHERE status='pending'").get() as any).c;
  const activeAllocations = (db.prepare("SELECT COUNT(*) as c FROM allocations WHERE status='issued'").get() as any).c;
  const pendingDeductions = (db.prepare("SELECT COUNT(*) as c FROM deductions WHERE status='pending'").get() as any).c;

  const recentAllocations = db.prepare(`
    SELECT a.id, e.name as employee_name, ii.name as item_name, a.quantity, a.allocation_date, a.status
    FROM allocations a JOIN employees e ON e.id=a.employee_id JOIN inventory_items ii ON ii.id=a.item_id
    ORDER BY a.created_at DESC LIMIT 5
  `).all() as any[];

  const lowStockItems = db.prepare(`
    SELECT ii.name, ii.size, ii.stock_quantity, ii.low_stock_threshold, ic.name as category
    FROM inventory_items ii JOIN item_categories ic ON ic.id=ii.category_id
    WHERE ii.stock_quantity <= ii.low_stock_threshold ORDER BY ii.stock_quantity ASC LIMIT 6
  `).all() as any[];

  const byBuilding = db.prepare(`
    SELECT b.name, COUNT(e.id) as count FROM buildings b
    LEFT JOIN employees e ON e.building_id=b.id AND e.status='active'
    GROUP BY b.id ORDER BY b.name
  `).all() as any[];

  const stats = [
    { label: 'Active Employees', value: totalEmployees, icon: '👷', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Inventory Items', value: totalItems, icon: '📦', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Low Stock Alerts', value: lowStock, icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pending Approvals', value: pendingProcurement, icon: '🛒', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Active Allocations', value: activeAllocations, icon: '🔄', color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Pending Deductions', value: pendingDeductions, icon: '💰', color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {session?.name}. Here&apos;s your inventory overview.</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeftColor: s.color }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: '.25rem' }}>{s.value}</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Recent Allocations */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Recent Allocations</h3>
          {recentAllocations.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '.875rem' }}>No allocations yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr>
                  <th>Employee</th><th>Item</th><th>Date</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {recentAllocations.map((a: any) => (
                    <tr key={a.id}>
                      <td>{a.employee_name}</td>
                      <td>{a.item_name}</td>
                      <td>{formatDate(a.allocation_date)}</td>
                      <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>⚠️ Low Stock Items</h3>
          {lowStockItems.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '.875rem' }}>All stock levels are healthy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {lowStockItems.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{item.name} {item.size && `(${item.size})`}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '1.125rem' }}>{item.stock_quantity}</div>
                    <div style={{ fontSize: '.7rem', color: '#94a3b8' }}>min: {item.low_stock_threshold}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employees by Building */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Active Employees by Building</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '.75rem' }}>
          {byBuilding.map((b: any) => (
            <div key={b.name} style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1' }}>{b.count}</div>
              <div style={{ fontSize: '.8125rem', color: '#334155', fontWeight: 500 }}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
