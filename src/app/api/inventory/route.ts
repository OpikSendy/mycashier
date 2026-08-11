import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { INITIAL_INVENTORY, InventoryItem } from '@/data/initialData';

// In-memory cache for fallback mode
let memoryInventory: InventoryItem[] = [...INITIAL_INVENTORY];

/**
 * GET /api/inventory
 * Returns inventory items and raw material stock levels.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ source: 'fallback', data: memoryInventory });
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id, name, name_en AS "nameEn", category, stock,
        unit, min_threshold AS "minThreshold",
        cost_per_unit AS "costPerUnit", last_restocked AS "lastRestocked"
      FROM inventory
      ORDER BY name ASC
    `) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ source: 'fallback', data: memoryInventory });
    }

    return NextResponse.json({ source: 'database', data: rows });
  } catch (error: any) {
    console.error('[GET /api/inventory]', error.message);
    return NextResponse.json({ source: 'fallback', data: memoryInventory });
  }
}

/**
 * POST /api/inventory
 * Adds a new inventory item or updates stock level.
 */
export async function POST(req: NextRequest) {
  try {
    const item: InventoryItem = await req.json();

    if (isDbConfigured()) {
      const sql = getDb();
      await sql`
        INSERT INTO inventory (
          id, name, name_en, category, stock, unit, min_threshold, cost_per_unit, last_restocked
        ) VALUES (
          ${item.id}, ${item.name}, ${item.nameEn ?? ''}, ${item.category}, ${item.stock},
          ${item.unit}, ${item.minThreshold}, ${item.costPerUnit}, ${item.lastRestocked}
        )
        ON CONFLICT (id) DO UPDATE SET
          stock = EXCLUDED.stock,
          min_threshold = EXCLUDED.min_threshold,
          last_restocked = EXCLUDED.last_restocked
      `;
    }

    // Always update in-memory
    const existingIdx = memoryInventory.findIndex((i) => i.id === item.id);
    if (existingIdx > -1) {
      memoryInventory[existingIdx] = { ...memoryInventory[existingIdx], ...item };
    } else {
      memoryInventory.unshift(item);
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/inventory]', error.message);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

/**
 * PATCH /api/inventory
 * Auto-deducts or restocks item quantities. Body: { id: string, delta: number }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id, delta } = await req.json();

    const existingIdx = memoryInventory.findIndex((i) => i.id === id);
    if (existingIdx > -1) {
      const newStock = Math.max(0, memoryInventory[existingIdx].stock + delta);
      memoryInventory[existingIdx].stock = newStock;
    }

    if (isDbConfigured()) {
      const sql = getDb();
      await sql`
        UPDATE inventory
        SET stock = GREATEST(0, stock + ${delta})
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true, newInventory: memoryInventory });
  } catch (error: any) {
    console.error('[PATCH /api/inventory]', error.message);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
