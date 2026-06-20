import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, APPROVAL_STEPS } from '@/lib/auth';

const SUPER_ROLES = ['admin', 'managing_director'];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const procurement_id = searchParams.get('procurement_id');

    let query = `
      SELECT a.*, u.name as approver_name, pr.quantity_requested, pr.justification, ii.name as item_name
      FROM approvals a
      JOIN procurement_requests pr ON pr.id=a.procurement_id
      JOIN inventory_items ii ON ii.id=pr.item_id
      LEFT JOIN users u ON u.id=a.approver_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (procurement_id) {
      query += ' AND a.procurement_id=?';
      params.push(procurement_id);
    } else if (SUPER_ROLES.includes(session.role)) {
      query += " AND a.status='pending'";
    } else {
      query += ' AND a.role=? AND a.status=?';
      params.push(session.role, 'pending');
    }
    query += ' ORDER BY a.procurement_id, a.step';

    const approvals = db.prepare(query).all(...params);
    return NextResponse.json({ approvals });
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

    const approval = db.prepare('SELECT * FROM approvals WHERE id=?').get(body.approval_id) as any;
    if (!approval) return NextResponse.json({ error: 'Approval not found' }, { status: 404 });

    const canAction = SUPER_ROLES.includes(session.role) || approval.role === session.role;
    if (!canAction) return NextResponse.json({ error: 'You do not have permission to action this step.' }, { status: 403 });

    if (approval.status !== 'pending') {
      return NextResponse.json({ error: `This step is already ${approval.status} and cannot be actioned.` }, { status: 400 });
    }

    if (!body.action || !['approved', 'rejected'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approved or rejected.' }, { status: 400 });
    }

    if (!body.comments || !body.comments.trim()) {
      return NextResponse.json({ error: 'Comments are required.' }, { status: 400 });
    }

    // Update the approval row
    db.prepare(`
      UPDATE approvals
      SET status=?, approver_id=?, comments=?, actioned_at=datetime('now')
      WHERE id=?
    `).run(body.action, session.id, body.comments.trim(), body.approval_id);

    const pr = db.prepare('SELECT * FROM procurement_requests WHERE id=?').get(approval.procurement_id) as any;

    if (body.action === 'rejected') {
      db.prepare(`UPDATE procurement_requests SET status='rejected', updated_at=datetime('now') WHERE id=?`)
        .run(approval.procurement_id);
      db.prepare(`UPDATE approvals SET status='cancelled' WHERE procurement_id=? AND status='waiting'`)
        .run(approval.procurement_id);
    } else {
      // approved
      const maxStep = APPROVAL_STEPS.length;
      if (approval.step >= maxStep) {
        // Final step — mark approved and add stock
        db.prepare(`UPDATE procurement_requests SET status='approved', updated_at=datetime('now') WHERE id=?`)
          .run(approval.procurement_id);
        db.prepare(`UPDATE inventory_items SET stock_quantity = stock_quantity + ? WHERE id=?`)
          .run(pr.quantity_requested, pr.item_id);
        db.prepare(`INSERT INTO stock_transactions (item_id, type, quantity, reference_id) VALUES (?,?,?,?)`)
          .run(pr.item_id, 'in', pr.quantity_requested, approval.procurement_id);
      } else {
        // Unlock next step
        db.prepare(`UPDATE approvals SET status='pending' WHERE procurement_id=? AND step=?`)
          .run(approval.procurement_id, approval.step + 1);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Approvals POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
