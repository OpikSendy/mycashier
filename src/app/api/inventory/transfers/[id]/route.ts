import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { inventoryEngine } from '@/lib/inventoryEngine';

/**
 * GET /api/inventory/transfers/[id]
 * Retrieve single transfer record by ID.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const transfer = inventoryEngine.transfers.get(id);

  if (!transfer) {
    return NextResponse.json({ error: `Transfer record '${id}' not found.` }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: transfer });
}

/**
 * PATCH /api/inventory/transfers/[id]
 * Handles state machine transitions: APPROVE, SHIP, RECEIVE/COMPLETE, CANCEL, REJECT.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = (body.action || '').toUpperCase();
    const userId = body.userId || body.userName || 'admin-user';
    const userRole = body.userRole || body.role || 'admin';
    const notes = body.notes || body.reason || '';

    const transfer = inventoryEngine.transfers.get(id);
    if (!transfer) {
      return NextResponse.json({ error: `Transfer record '${id}' not found.` }, { status: 404 });
    }

    let result: { success: boolean; error?: string } = { success: false, error: 'Invalid action' };

    switch (action) {
      case 'APPROVE': {
        if (userRole !== 'admin') {
          return NextResponse.json(
            { error: 'Unauthorized. Only Admin role can approve stock transfers.' },
            { status: 403 }
          );
        }
        result = inventoryEngine.approveTransfer(id, userId, userRole);
        break;
      }

      case 'SHIP': {
        result = inventoryEngine.shipTransfer(id);
        break;
      }

      case 'RECEIVE':
      case 'COMPLETE': {
        result = inventoryEngine.completeTransfer(id, userId);
        break;
      }

      case 'CANCEL': {
        result = inventoryEngine.cancelTransfer(id, userId);
        break;
      }

      case 'REJECT': {
        result = inventoryEngine.rejectTransfer(id, userId, notes || 'Transfer rejected by admin');
        break;
      }

      default: {
        return NextResponse.json(
          { error: `Unknown transfer action '${action}'. Allowed: APPROVE, SHIP, RECEIVE, CANCEL, REJECT.` },
          { status: 400 }
        );
      }
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If DB is configured, sync transfer state & atomic branch stocks
    if (isDbConfigured()) {
      try {
        const sql = getDb();
        const updated = inventoryEngine.transfers.get(id)!;
        await sql`
          UPDATE inventory_transfers
          SET
            status = ${updated.status},
            approved_by = ${updated.approvedBy ?? null},
            approved_at = ${updated.approvedAt ? new Date(updated.approvedAt) : null},
            shipped_at = ${updated.shippedAt ? new Date(updated.shippedAt) : null},
            completed_at = ${updated.completedAt ? new Date(updated.completedAt) : null},
            cancelled_at = ${updated.cancelledAt ? new Date(updated.cancelledAt) : null},
            notes = ${updated.notes ?? null},
            updated_at = NOW()
          WHERE id = ${id}
        `;

        if (action === 'RECEIVE' || action === 'COMPLETE') {
          for (const item of updated.items) {
            const srcQty = inventoryEngine.getStock(updated.sourceBranchId, item.itemId);
            const dstQty = inventoryEngine.getStock(updated.destBranchId, item.itemId);

            await sql`
              UPDATE branch_stocks
              SET quantity = ${srcQty}, updated_at = NOW()
              WHERE branch_id = ${updated.sourceBranchId} AND item_id = ${item.itemId}
            `;

            await sql`
              INSERT INTO branch_stocks (
                id, branch_id, item_id, quantity, min_threshold, last_restocked, updated_at
              ) VALUES (
                ${`${updated.destBranchId}:${item.itemId}`}, ${updated.destBranchId}, ${item.itemId}, ${dstQty}, 5, NOW(), NOW()
              )
              ON CONFLICT (branch_id, item_id) DO UPDATE SET
                quantity = ${dstQty},
                last_restocked = NOW(),
                updated_at = NOW()
            `;
          }
        }
      } catch (dbErr: any) {
        console.error('[PATCH /api/inventory/transfers/[id]] DB sync error:', dbErr.message);
      }
    }

    const updatedTransfer = inventoryEngine.transfers.get(id);
    return NextResponse.json({ success: true, data: updatedTransfer });
  } catch (error: any) {
    console.error('[PATCH /api/inventory/transfers/[id]]', error.message);
    return NextResponse.json({ error: 'Failed to update stock transfer' }, { status: 500 });
  }
}
