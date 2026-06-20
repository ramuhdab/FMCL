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
  db.prepare(`
    UPDATE employees SET name=?, building_id=?, category_id=?, join_date=?, leave_date=?, status=?
    WHERE id=?
  `).run(body.name, body.building_id, body.category_id, body.join_date, body.leave_date ?? null, body.status, id);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const employee = db.prepare(`
    SELECT e.*, b.name as building_name, ec.name as category_name
    FROM employees e JOIN buildings b ON b.id=e.building_id JOIN employee_categories ec ON ec.id=e.category_id
    WHERE e.id=?
  `).get(id);
  const allocations = db.prepare(`
    SELECT a.*, ii.name as item_name, ii.size, ic.name as category
    FROM allocations a JOIN inventory_items ii ON ii.id=a.item_id JOIN item_categories ic ON ic.id=ii.category_id
    WHERE a.employee_id=? ORDER BY a.allocation_date DESC
  `).all(id);
  const deductions = db.prepare('SELECT * FROM deductions WHERE employee_id=? ORDER BY created_at DESC').all(id);
  return NextResponse.json({ employee, allocations, deductions });
}
