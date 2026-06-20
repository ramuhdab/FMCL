import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';

  let query = `
    SELECT ii.*, ic.name as category_name, v.name as vendor_name
    FROM inventory_items ii
    JOIN item_categories ic ON ic.id = ii.category_id
    LEFT JOIN vendors v ON v.id = ii.vendor_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (category) { query += ' AND ii.category_id = ?'; params.push(category); }
  if (search) { query += ' AND ii.name LIKE ?'; params.push(`%${search}%`); }
  query += ' ORDER BY ic.name, ii.name';

  const items = db.prepare(query).all(...params);
  const categories = db.prepare('SELECT * FROM item_categories ORDER BY name').all();
  const vendors = db.prepare('SELECT * FROM vendors WHERE active=1 ORDER BY name').all();
  return NextResponse.json({ items, categories, vendors });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'tech_manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO inventory_items (name, category_id, vendor_id, size, unit, unit_cost, stock_quantity, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(body.name, body.category_id, body.vendor_id ?? null, body.size ?? null, body.unit ?? 'piece',
    body.unit_cost, body.stock_quantity ?? 0, body.low_stock_threshold ?? 20);
  return NextResponse.json({ id: result.lastInsertRowid });
}
