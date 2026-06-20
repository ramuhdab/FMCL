import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const vendors = getDb().prepare('SELECT * FROM vendors ORDER BY name').all();
  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'tech_manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO vendors (name, contact_person, email, phone, address) VALUES (?,?,?,?,?)')
    .run(body.name, body.contact_person ?? null, body.email ?? null, body.phone ?? null, body.address ?? null);
  return NextResponse.json({ id: result.lastInsertRowid });
}
