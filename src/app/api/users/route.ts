import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, building_id, active, created_at FROM users ORDER BY name').all();
  const buildings = db.prepare('SELECT * FROM buildings ORDER BY name').all();
  return NextResponse.json({ users, buildings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const db = getDb();
  const hash = bcrypt.hashSync(body.password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role, building_id) VALUES (?,?,?,?,?)')
    .run(body.name, body.email, hash, body.role, body.building_id ?? null);
  return NextResponse.json({ id: result.lastInsertRowid });
}
