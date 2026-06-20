import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, APPROVAL_STEPS } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? '';

  let query = `
    SELECT pr.*, ii.name as item_name, ii.size, u.name as requester_name
    FROM procurement_requests pr
    JOIN inventory_items ii ON ii.id=pr.item_id
    LEFT JOIN users u ON u.id=pr.requested_by
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) { query += ' AND pr.status=?'; params.push(status); }
  query += ' ORDER BY pr.created_at DESC';

  const requests = db.prepare(query).all(...params);
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO procurement_requests (item_id, quantity_requested, justification, status, requested_by)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(body.item_id, body.quantity_requested, body.justification ?? null, session.id);

  const procId = result.lastInsertRowid;

  // Create approval workflow steps — only step 1 is 'pending', rest are 'waiting'
  const insertApproval = db.prepare(
    'INSERT INTO approvals (procurement_id, step, role, status) VALUES (?, ?, ?, ?)'
  );
  APPROVAL_STEPS.forEach(s => insertApproval.run(procId, s.step, s.role, s.step === 1 ? 'pending' : 'waiting'));

  return NextResponse.json({ id: procId });
}
