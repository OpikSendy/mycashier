import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { inventoryEngine, Branch } from '@/lib/inventoryEngine';

/**
 * GET /api/branches
 * Returns the list of active restaurant branches (Jakarta, Bandung, Bali).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (isDbConfigured()) {
    try {
      const sql = getDb();
      const rows = (await sql`
        SELECT id, code, name, city, address, phone, is_active AS "isActive", created_at AS "createdAt"
        FROM branches
        WHERE is_active = TRUE
        ORDER BY code ASC
      `) as any[];

      if (rows && rows.length > 0) {
        let filtered = rows;
        if (city) {
          filtered = rows.filter((b) => b.city.toLowerCase() === city.toLowerCase());
        }
        return NextResponse.json({ source: 'database', data: filtered });
      }
    } catch (error: any) {
      console.error('[GET /api/branches] Database query failed, falling back to memory:', error.message);
    }
  }

  let branches: Branch[] = inventoryEngine.getBranches();
  if (city) {
    branches = branches.filter((b) => b.city.toLowerCase() === city.toLowerCase());
  }

  return NextResponse.json({ source: 'fallback', data: branches });
}
