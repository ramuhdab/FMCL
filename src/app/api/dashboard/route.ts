import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const totalEmployees = (db.prepare("SELECT COUNT(*) as c FROM employees WHERE status='active'").get() as any).c;
  const totalItems = (db.prepare('SELECT COUNT(*) as c FROM inventory_items').get() as any).c;
  const lowStock = (db.prepare('SELECT COUNT(*) as c FROM inventory_items WHERE stock_quantity <= low_stock_threshold').get() as any).c;
  const pendingProcurement = (db.prepare("SELECT COUNT(*) as c FROM procurement_requests WHERE status='pending'").get() as any).c;
  const totalAllocations = (db.prepare("SELECT COUNT(*) as c FROM allocations WHERE status='issued'").get() as any).c;
  const pendingDeductions = (db.prepare("SELECT COUNT(*) as c FROM deductions WHERE status='pending'").get() as any).c;

  const recentAllocations = db.prepare(`
    SELECT a.id, e.name as employee_name, ii.name as item_name, a.quantity, a.allocation_date, a.status
    FROM allocations a
    JOIN employees e ON e.id = a.employee_id
    JOIN inventory_items ii ON ii.id = a.item_id
    ORDER BY a.created_at DESC LIMIT 5
  `).all();

  const lowStockItems = db.prepare(`
    SELECT ii.name, ii.size, ii.stock_quantity, ii.low_stock_threshold, ic.name as category
    FROM inventory_items ii JOIN item_categories ic ON ic.id = ii.category_id
    WHERE ii.stock_quantity <= ii.low_stock_threshold ORDER BY ii.stock_quantity ASC LIMIT 5
  `).all();

  const byBuilding = db.prepare(`
    SELECT b.name, COUNT(e.id) as count
    FROM buildings b LEFT JOIN employees e ON e.building_id = b.id AND e.status='active'
    GROUP BY b.id ORDER BY b.name
  `).all();

  return NextResponse.json({
    stats: { totalEmployees, totalItems, lowStock, pendingProcurement, totalAllocations, pendingDeductions },
    recentAllocations,
    lowStockItems,
    byBuilding,
  });
}
