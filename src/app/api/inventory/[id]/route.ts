import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'tech_manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (body.stock_adjustment !== undefined) {
    // Stock adjustment (add/remove)
    const item = db.prepare('SELECT stock_quantity FROM inventory_items WHERE id=?').get(id) as any;
    const newQty = item.stock_quantity + body.stock_adjustment;
    db.prepare('UPDATE inventory_items SET stock_quantity=? WHERE id=?').run(newQty, id);
    db.prepare('INSERT INTO stock_transactions (item_id, type, quantity, notes, created_by) VALUES (?,?,?,?,?)')
      .run(id, body.stock_adjustment > 0 ? 'in' : 'adjustment', Math.abs(body.stock_adjustment), body.notes ?? null, session.id);
    return NextResponse.json({ ok: true, new_quantity: newQty });
  }

  db.prepare(`
    UPDATE inventory_items SET name=?, category_id=?, vendor_id=?, size=?, unit=?, unit_cost=?, low_stock_threshold=? WHERE id=?
  `).run(body.name, body.category_id, body.vendor_id ?? null, body.size ?? null, body.unit ?? 'piece',
    body.unit_cost, body.low_stock_threshold ?? 20, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('DELETE FROM inventory_items WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
