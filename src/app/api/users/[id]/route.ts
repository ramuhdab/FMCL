import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  if (body.password) {
    db.prepare('UPDATE users SET name=?, email=?, role=?, building_id=?, password_hash=?, active=? WHERE id=?')
      .run(body.name, body.email, body.role, body.building_id ?? null, bcrypt.hashSync(body.password, 10), body.active ?? 1, id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=?, building_id=?, active=? WHERE id=?')
      .run(body.name, body.email, body.role, body.building_id ?? null, body.active ?? 1, id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('UPDATE users SET active=0 WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
