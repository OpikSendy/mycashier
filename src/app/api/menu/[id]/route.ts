import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';

/**
 * PUT /api/menu/[id]
 * Updates an existing menu item.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const {
      name, nameEn, category, subCategory, variantPreset,
      price, description, descriptionEn, image, isAvailable, isPopular,
    } = body;

    const sql = getDb();
    const rows = (await sql`
      UPDATE menus SET
        name            = COALESCE(${name ?? null}, name),
        name_en         = COALESCE(${nameEn ?? null}, name_en),
        category        = COALESCE(${category ?? null}, category),
        sub_category    = COALESCE(${subCategory ?? null}, sub_category),
        variant_preset  = COALESCE(${variantPreset ?? null}, variant_preset),
        price           = COALESCE(${price ?? null}, price),
        description     = COALESCE(${description ?? null}, description),
        description_en  = COALESCE(${descriptionEn ?? null}, description_en),
        image           = COALESCE(${image ?? null}, image),
        is_available    = COALESCE(${isAvailable ?? null}, is_available),
        is_popular      = COALESCE(${isPopular ?? null}, is_popular),
        updated_at      = NOW()
      WHERE id = ${id}
      RETURNING
        id, name, name_en AS "nameEn", category,
        sub_category AS "subCategory", variant_preset AS "variantPreset",
        price, description, description_en AS "descriptionEn",
        image, is_available AS "isAvailable", is_popular AS "isPopular"
    `) as any[];
    const row = rows[0];

    if (!row) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error: any) {
    console.error(`[PUT /api/menu/${id}]`, error.message);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

/**
 * PATCH /api/menu/[id]
 * Toggle availability of a menu item.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const sql = getDb();

    if (typeof body.isAvailable === 'boolean') {
      await sql`
        UPDATE menus SET is_available = ${body.isAvailable}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[PATCH /api/menu/${id}]`, error.message);
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 });
  }
}

/**
 * DELETE /api/menu/[id]
 * Deletes a menu item by ID.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const sql = getDb();
    await sql`DELETE FROM menus WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[DELETE /api/menu/${id}]`, error.message);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
