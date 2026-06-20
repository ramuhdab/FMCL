import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const deductions = getDb().prepare(`
    SELECT d.*, e.name as employee_name, e.employee_code
    FROM deductions d JOIN employees e ON e.id=d.employee_id
    ORDER BY d.created_at DESC
  `).all();
  return NextResponse.json({ deductions });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'finance_manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  getDb().prepare('UPDATE deductions SET status=? WHERE id=?').run(body.status, body.id);
  return NextResponse.json({ ok: true });
}
