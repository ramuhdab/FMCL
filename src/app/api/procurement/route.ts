import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, APPROVAL_STEPS } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? '';

    let query = `
      SELECT pr.*, ii.name as item_name, ii.size, ii.stock_quantity, u.name as requester_name
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = getDb();

    // Support both single item (legacy) and multi-item array
    const lineItems: { item_id: number; quantity_requested: number; justification: string }[] =
      Array.isArray(body.items) ? body.items : [body];

    if (lineItems.length < 1) {
      return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 });
    }
    if (lineItems.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 items per request.' }, { status: 400 });
    }

    const insertRequest = db.prepare(`
      INSERT INTO procurement_requests (item_id, quantity_requested, justification, status, requested_by)
      VALUES (?, ?, ?, 'pending', ?)
    `);
    const insertApproval = db.prepare(
      'INSERT INTO approvals (procurement_id, step, role, status) VALUES (?, ?, ?, ?)'
    );

    const ids: number[] = [];

    const createAll = db.transaction(() => {
      for (const line of lineItems) {
        const result = insertRequest.run(
          line.item_id,
          line.quantity_requested,
          line.justification?.trim() ?? null,
          session.id
        );
        const procId = result.lastInsertRowid as number;
        ids.push(procId);
        APPROVAL_STEPS.forEach(s =>
          insertApproval.run(procId, s.step, s.role, s.step === 1 ? 'pending' : 'waiting')
        );
      }
    });

    createAll();
    return NextResponse.json({ ids });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
