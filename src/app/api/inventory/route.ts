import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { INITIAL_INVENTORY, InventoryItem } from '@/data/initialData';
import { inventoryEngine } from '@/lib/inventoryEngine';

// In-memory catalog
let memoryCatalog: InventoryItem[] = [...INITIAL_INVENTORY];

/**
 * GET /api/inventory
 * Returns inventory items and stock levels, optionally filtered by branchId.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || 'b-1';

  if (isDbConfigured()) {
    try {
      const sql = getDb();
      // Try joining inventory_items with branch_stocks
      const rows = (await sql`
        SELECT
          i.id,
          i.name,
          i.name_en AS "nameEn",
          i.category,
          COALESCE(bs.quantity, 0) AS stock,
          i.unit,
          COALESCE(bs.min_threshold, i.min_threshold) AS "minThreshold",
          i.cost_per_unit AS "costPerUnit",
          COALESCE(TO_CHAR(bs.last_restocked, 'YYYY-MM-DD'), '2026-08-01') AS "lastRestocked",
          ${branchId} AS "branchId"
        FROM inventory_items i
        LEFT JOIN branch_stocks bs ON bs.item_id = i.id AND (bs.branch_id = ${branchId} OR bs.branch_id = ${inventoryEngine.normalizeBranchId(branchId)})
        ORDER BY i.name ASC
      `) as any[];

      if (rows && rows.length > 0) {
        return NextResponse.json({ source: 'database', branchId, data: rows });
      }
    } catch (error: any) {
      console.error('[GET /api/inventory] DB Query failed, falling back to engine:', error.message);
    }
  }

  // Fallback mode using InventoryTransferEngine
  const itemsWithBranchStock: InventoryItem[] = memoryCatalog.map((catItem) => {
    const stockQty = inventoryEngine.getStock(branchId, catItem.id);
    return {
      ...catItem,
      stock: stockQty,
      branchId,
    };
  });

  return NextResponse.json({
    source: 'fallback',
    branchId,
    data: itemsWithBranchStock,
  });
}

/**
 * POST /api/inventory
 * Adds a new inventory item and initializes stock across branches.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: InventoryItem = {
      id: body.id || `inv-${Date.now()}`,
      name: body.name,
      nameEn: body.nameEn || body.name,
      category: body.category || 'raw_material',
      stock: Number(body.stock) || 0,
      unit: body.unit || 'kg',
      minThreshold: Number(body.minThreshold) || 1,
      costPerUnit: Number(body.costPerUnit) || 0,
      lastRestocked: body.lastRestocked || new Date().toISOString().split('T')[0],
    };

    const targetBranch = body.branchId || 'b-1';
    inventoryEngine.setStock(targetBranch, item.id, item.stock, item.minThreshold);

    if (isDbConfigured()) {
      try {
        const sql = getDb();
        await sql`
          INSERT INTO inventory_items (
            id, name, name_en, category, unit, min_threshold, cost_per_unit
          ) VALUES (
            ${item.id}, ${item.name}, ${item.nameEn ?? ''}, ${item.category},
            ${item.unit}, ${item.minThreshold}, ${item.costPerUnit}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            name_en = EXCLUDED.name_en,
            min_threshold = EXCLUDED.min_threshold,
            cost_per_unit = EXCLUDED.cost_per_unit,
            updated_at = NOW()
        `;

        await sql`
          INSERT INTO branch_stocks (
            id, branch_id, item_id, quantity, min_threshold, last_restocked
          ) VALUES (
            ${`${targetBranch}:${item.id}`}, ${targetBranch}, ${item.id}, ${item.stock}, ${item.minThreshold}, NOW()
          )
          ON CONFLICT (branch_id, item_id) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            min_threshold = EXCLUDED.min_threshold,
            last_restocked = NOW()
        `;
      } catch (dbErr: any) {
        console.error('[POST /api/inventory] DB Insert error:', dbErr.message);
      }
    }

    // Always update in-memory catalog
    const existingIdx = memoryCatalog.findIndex((i) => i.id === item.id);
    if (existingIdx > -1) {
      memoryCatalog[existingIdx] = { ...memoryCatalog[existingIdx], ...item };
    } else {
      memoryCatalog.unshift(item);
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/inventory]', error.message);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

/**
 * PATCH /api/inventory
 * Adjusts, restocks, or overrides inventory quantities at a specific branch.
 * Body: { branchId?: string, id?: string, itemId?: string, delta?: number, action?: 'RESTOCK' | 'OVERRIDE', newQuantity?: number, addedQuantity?: number, reason?: string, userId?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const branchId = body.branchId || 'b-1';
    const itemId = body.itemId || body.id;
    const userId = body.userId || body.userName || 'admin-user';
    const reason = body.reason || body.notes || 'Inventory Stock Adjustment';

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    if (body.action === 'OVERRIDE' && typeof body.newQuantity === 'number') {
      const res = inventoryEngine.manualStockOverride(branchId, itemId, body.newQuantity, userId, reason);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    } else if (body.action === 'RESTOCK' && typeof body.addedQuantity === 'number') {
      const res = inventoryEngine.recordRestock(branchId, itemId, body.addedQuantity, userId, body.supplierInvoice);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    } else if (typeof body.delta === 'number') {
      const current = inventoryEngine.getStock(branchId, itemId);
      const newQty = Math.max(0, current + body.delta);
      if (body.delta > 0) {
        inventoryEngine.recordRestock(branchId, itemId, body.delta, userId, reason);
      } else {
        inventoryEngine.manualStockOverride(branchId, itemId, newQty, userId, reason);
      }
    }

    if (isDbConfigured()) {
      try {
        const sql = getDb();
        const finalStock = inventoryEngine.getStock(branchId, itemId);
        await sql`
          INSERT INTO branch_stocks (
            id, branch_id, item_id, quantity, min_threshold, last_restocked
          ) VALUES (
            ${`${branchId}:${itemId}`}, ${branchId}, ${itemId}, ${finalStock}, 5, NOW()
          )
          ON CONFLICT (branch_id, item_id) DO UPDATE SET
            quantity = ${finalStock},
            last_restocked = NOW(),
            updated_at = NOW()
        `;
      } catch (dbErr: any) {
        console.error('[PATCH /api/inventory] DB update failed:', dbErr.message);
      }
    }

    const updatedCatalog: InventoryItem[] = memoryCatalog.map((catItem) => ({
      ...catItem,
      stock: inventoryEngine.getStock(branchId, catItem.id),
      branchId,
    }));

    return NextResponse.json({
      success: true,
      branchId,
      itemId,
      currentStock: inventoryEngine.getStock(branchId, itemId),
      newInventory: updatedCatalog,
    });
  } catch (error: any) {
    console.error('[PATCH /api/inventory]', error.message);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
