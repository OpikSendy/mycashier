import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';

const DEFAULT_SETTINGS = {
  id: 1,
  name: 'MyCashier Resto',
  logoUrl: '/icon.jpg',
  address: 'Jl. Raya No. 1, Jakarta',
  taxRate: 10,
};

/**
 * GET /api/store-settings
 * Returns store configuration. Fallback to defaults if DB not configured.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ source: 'fallback', data: DEFAULT_SETTINGS });
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id,
        name,
        logo_url  AS "logoUrl",
        address,
        tax_rate  AS "taxRate"
      FROM store_settings
      LIMIT 1
    `) as any[];
    const row = rows[0];

    return NextResponse.json({ source: 'database', data: row ?? DEFAULT_SETTINGS });
  } catch (error: any) {
    console.error('[GET /api/store-settings]', error.message);
    return NextResponse.json({ source: 'fallback', data: DEFAULT_SETTINGS });
  }
}

/**
 * PUT /api/store-settings
 * Updates store configuration (upsert on first row).
 * Body: { name?, logoUrl?, address?, taxRate? }
 */
export async function PUT(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { name, logoUrl, address, taxRate } = body;

    const sql = getDb();

    const rows = (await sql`
      UPDATE store_settings SET
        name      = COALESCE(${name ?? null}, name),
        logo_url  = COALESCE(${logoUrl ?? null}, logo_url),
        address   = COALESCE(${address ?? null}, address),
        tax_rate  = COALESCE(${taxRate ?? null}, tax_rate),
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        id, name, logo_url AS "logoUrl", address, tax_rate AS "taxRate"
    `) as any[];
    const row = rows[0];

    return NextResponse.json({ data: row });
  } catch (error: any) {
    console.error('[PUT /api/store-settings]', error.message);
    return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
  }
}
