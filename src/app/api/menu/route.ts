import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { INITIAL_MENU } from '@/data/initialData';
import { createAuditLog, extractReqMetadata } from '@/lib/audit';

/**
 * GET /api/menu
 * Returns all menu items. Falls back to INITIAL_MENU if DB not configured.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ source: 'fallback', data: INITIAL_MENU });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        id, name, name_en AS "nameEn", category,
        sub_category AS "subCategory", variant_preset AS "variantPreset",
        price, description, description_en AS "descriptionEn",
        image, is_available AS "isAvailable", is_popular AS "isPopular"
      FROM menus
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ source: 'database', data: rows });
  } catch (error: any) {
    console.error('[GET /api/menu] DB error, falling back:', error.message);
    return NextResponse.json({ source: 'fallback', data: INITIAL_MENU });
  }
}

/**
 * POST /api/menu
 * Creates a new menu item.
 * Body: Omit<MenuItem, 'id'>
 */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { ipAddress, userAgent } = extractReqMetadata(req);
    const {
      name, nameEn, category, subCategory, variantPreset,
      price, description, descriptionEn, image, isAvailable, isPopular,
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'name, price, category are required' }, { status: 400 });
    }

    const sql = getDb();
    const id = `prod-${Date.now()}`;

    const rows = (await sql`
      INSERT INTO menus (
        id, name, name_en, category, sub_category, variant_preset,
        price, description, description_en, image, is_available, is_popular
      ) VALUES (
        ${id}, ${name}, ${nameEn ?? null}, ${category},
        ${subCategory ?? null}, ${variantPreset ?? 'none'},
        ${price}, ${description ?? ''}, ${descriptionEn ?? null},
        ${image ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'},
        ${isAvailable ?? true}, ${isPopular ?? false}
      )
      RETURNING
        id, name, name_en AS "nameEn", category,
        sub_category AS "subCategory", variant_preset AS "variantPreset",
        price, description, description_en AS "descriptionEn",
        image, is_available AS "isAvailable", is_popular AS "isPopular"
    `) as any[];
    const row = rows[0];

    // Record audit log for menu item creation
    await createAuditLog({
      userId: 'usr-admin-cms',
      userName: 'Admin Store',
      userRole: 'admin',
      actionType: 'MENU_CREATE',
      entityType: 'menu',
      entityId: id,
      ipAddress,
      userAgent,
      description: `Menambahkan menu baru '${name}' seharga Rp ${Number(price).toLocaleString('id-ID')}`,
      newPayload: row,
      status: 'SUCCESS',
    });

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/menu]', error.message);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

