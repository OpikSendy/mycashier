import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { inventoryEngine, TransferStatus, TransferRequestItem } from '@/lib/inventoryEngine';

/**
 * GET /api/inventory/transfers
 * Returns a list of inter-branch inventory transfer requests.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceBranch = searchParams.get('sourceBranch') || undefined;
  const destBranch = searchParams.get('destBranch') || undefined;
  const status = (searchParams.get('status') as TransferStatus) || undefined;

  if (isDbConfigured()) {
    try {
      const sql = getDb();
      const rows = (await sql`
        SELECT
          t.id,
          t.transfer_number AS "transferNumber",
          t.source_branch_id AS "sourceBranchId",
          t.dest_branch_id AS "destBranchId",
          t.status,
          t.requested_by AS "requestedBy",
          t.approved_by AS "approvedBy",
          t.notes,
          t.requested_at AS "requestedAt",
          t.approved_at AS "approvedAt",
          t.shipped_at AS "shippedAt",
          t.completed_at AS "completedAt",
          t.cancelled_at AS "cancelledAt"
        FROM inventory_transfers t
        ORDER BY t.requested_at DESC
      `) as any[];

      if (rows && rows.length > 0) {
        // Fetch items for each transfer
        const transferIds = rows.map((r) => r.id);
        const itemRows = (await sql`
          SELECT
            transfer_id AS "transferId",
            item_id AS "itemId",
            quantity_requested AS "quantity",
            unit
          FROM inventory_transfer_items
          WHERE transfer_id = ANY(${transferIds})
        `) as any[];

        const itemsByTransfer = new Map<string, TransferRequestItem[]>();
        for (const item of itemRows) {
          const list = itemsByTransfer.get(item.transferId) || [];
          list.push({
            itemId: item.itemId,
            quantity: Number(item.quantity),
            unit: item.unit,
          });
          itemsByTransfer.set(item.transferId, list);
        }

        let enriched = rows.map((r) => ({
          ...r,
          items: itemsByTransfer.get(r.id) || [],
        }));

        if (sourceBranch) {
          enriched = enriched.filter((t) => t.sourceBranchId === sourceBranch);
        }
        if (destBranch) {
          enriched = enriched.filter((t) => t.destBranchId === destBranch);
        }
        if (status) {
          enriched = enriched.filter((t) => t.status === status);
        }

        return NextResponse.json({ source: 'database', data: enriched });
      }
    } catch (error: any) {
      console.error('[GET /api/inventory/transfers] DB query failed, using memory engine:', error.message);
    }
  }

  const transfers = inventoryEngine.getTransfers({
    sourceBranchId: sourceBranch,
    destBranchId: destBranch,
    status,
  });

  return NextResponse.json({ source: 'fallback', data: transfers });
}

/**
 * POST /api/inventory/transfers
 * Creates a new Inter-Branch Transfer request in PENDING status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceBranchId, destBranchId, items, requestedBy, notes } = body;

    if (!sourceBranchId || !destBranchId) {
      return NextResponse.json(
        { error: 'sourceBranchId and destBranchId are required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Transfer request must contain at least one item.' },
        { status: 400 }
      );
    }

    const res = inventoryEngine.createTransfer({
      sourceBranchId,
      destBranchId,
      items,
      requestedBy: requestedBy || 'Branch Supervisor',
      notes,
    });

    if (!res.success || !res.transfer) {
      return NextResponse.json({ error: res.error || 'Failed to create transfer' }, { status: 400 });
    }

    if (isDbConfigured()) {
      try {
        const sql = getDb();
        const trf = res.transfer;
        await sql`
          INSERT INTO inventory_transfers (
            id, transfer_number, source_branch_id, dest_branch_id, status, requested_by, notes, requested_at
          ) VALUES (
            ${trf.id}, ${trf.transferNumber}, ${trf.sourceBranchId}, ${trf.destBranchId},
            ${trf.status}, ${trf.requestedBy}, ${trf.notes ?? null}, ${trf.requestedAt}
          )
        `;

        for (const item of trf.items) {
          const itemId = `ti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          await sql`
            INSERT INTO inventory_transfer_items (
              id, transfer_id, item_id, quantity_requested, unit
            ) VALUES (
              ${itemId}, ${trf.id}, ${item.itemId}, ${item.quantity}, ${item.unit}
            )
          `;
        }
      } catch (dbErr: any) {
        console.error('[POST /api/inventory/transfers] DB insert error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, data: res.transfer }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/inventory/transfers]', error.message);
    return NextResponse.json({ error: 'Failed to create stock transfer' }, { status: 500 });
  }
}
