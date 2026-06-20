import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const building = searchParams.get('building') ?? '';
  const category = searchParams.get('category') ?? '';
  const status = searchParams.get('status') ?? 'active';

  let query = `
    SELECT e.*, b.name as building_name, ec.name as category_name
    FROM employees e
    JOIN buildings b ON b.id = e.building_id
    JOIN employee_categories ec ON ec.id = e.category_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) { query += ' AND e.status = ?'; params.push(status); }
  if (building) { query += ' AND e.building_id = ?'; params.push(building); }
  if (category) { query += ' AND e.category_id = ?'; params.push(category); }
  if (search) { query += ' AND (e.name LIKE ? OR e.employee_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY e.name';

  const employees = db.prepare(query).all(...params);
  const buildings = db.prepare('SELECT * FROM buildings ORDER BY name').all();
  const categories = db.prepare('SELECT * FROM employee_categories ORDER BY name').all();
  return NextResponse.json({ employees, buildings, categories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'tech_manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();

  // Auto-generate employee code
  const count = (db.prepare('SELECT COUNT(*) as c FROM employees').get() as any).c;
  const employee_code = body.employee_code || `EMP${String(count + 1).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO employees (employee_code, name, building_id, category_id, join_date, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(employee_code, body.name, body.building_id, body.category_id, body.join_date);

  return NextResponse.json({ id: result.lastInsertRowid, employee_code });
}
