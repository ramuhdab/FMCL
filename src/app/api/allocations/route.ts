import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calcTenureDays, calcDeductionAmount } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const employee_id = searchParams.get('employee_id');

  let query = `
    SELECT a.*, e.name as employee_name, e.employee_code, ii.name as item_name, ii.size,
           b.name as building_name, ec.name as category_name
    FROM allocations a
    JOIN employees e ON e.id=a.employee_id
    JOIN inventory_items ii ON ii.id=a.item_id
    JOIN buildings b ON b.id=e.building_id
    JOIN employee_categories ec ON ec.id=e.category_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (employee_id) { query += ' AND a.employee_id=?'; params.push(employee_id); }
  query += ' ORDER BY a.allocation_date DESC LIMIT 200';

  const allocations = db.prepare(query).all(...params);
  return NextResponse.json({ allocations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  // Check stock
  const item = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(body.item_id) as any;
  if (!item || item.stock_quantity < body.quantity) {
    return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO allocations (employee_id, item_id, quantity, allocation_date, status, issued_by, notes)
    VALUES (?, ?, ?, ?, 'issued', ?, ?)
  `).run(body.employee_id, body.item_id, body.quantity, body.allocation_date, session.id, body.notes ?? null);

  // Deduct from stock
  db.prepare('UPDATE inventory_items SET stock_quantity = stock_quantity - ? WHERE id=?').run(body.quantity, body.item_id);
  db.prepare('INSERT INTO stock_transactions (item_id, type, quantity, reference_id, created_by) VALUES (?,?,?,?,?)')
    .run(body.item_id, 'out', body.quantity, result.lastInsertRowid, session.id);

  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json(); // { id, action: 'return' | 'deduct', return_date? }
  const db = getDb();

  const alloc = db.prepare(`
    SELECT a.*, e.join_date, e.leave_date, ii.unit_cost FROM allocations a
    JOIN employees e ON e.id=a.employee_id JOIN inventory_items ii ON ii.id=a.item_id WHERE a.id=?
  `).get(body.id) as any;

  if (!alloc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'return') {
    db.prepare('UPDATE allocations SET status=?, return_date=? WHERE id=?').run('returned', body.return_date, body.id);
    db.prepare('UPDATE inventory_items SET stock_quantity = stock_quantity + ? WHERE id=?').run(alloc.quantity, alloc.item_id);
    db.prepare('INSERT INTO stock_transactions (item_id, type, quantity, reference_id, created_by) VALUES (?,?,?,?,?)')
      .run(alloc.item_id, 'return', alloc.quantity, body.id, session.id);
  } else if (body.action === 'deduct') {
    const tenureDays = calcTenureDays(alloc.join_date, alloc.leave_date);
    const amount = calcDeductionAmount(alloc.unit_cost * alloc.quantity, tenureDays);
    db.prepare('UPDATE allocations SET status=? WHERE id=?').run('deducted', body.id);
    db.prepare('INSERT INTO deductions (employee_id, allocation_id, amount, reason, tenure_days) VALUES (?,?,?,?,?)')
      .run(alloc.employee_id, body.id, amount, `Uniform deduction - ${tenureDays} days tenure`, tenureDays);
  }

  return NextResponse.json({ ok: true });
}
