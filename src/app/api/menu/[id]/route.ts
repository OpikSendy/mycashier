import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { createAuditLog, extractReqMetadata } from '@/lib/audit';

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
    const { ipAddress, userAgent } = extractReqMetadata(req);
    const {
      name, nameEn, category, subCategory, variantPreset,
      price, description, descriptionEn, image, isAvailable, isPopular,
    } = body;

    const sql = getDb();

    // Fetch existing menu before update to calculate diff
    const existingRows = (await sql`
      SELECT
        id, name, name_en AS "nameEn", category,
        sub_category AS "subCategory", variant_preset AS "variantPreset",
        price, description, description_en AS "descriptionEn",
        image, is_available AS "isAvailable", is_popular AS "isPopular"
      FROM menus
      WHERE id = ${id}
    `) as any[];
    const oldItem = existingRows[0];

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

    const isPriceChanged = oldItem && oldItem.price !== row.price;
    const actionType = isPriceChanged ? 'MENU_PRICE_UPDATE' : 'MENU_UPDATE';
    const actionDesc = isPriceChanged
      ? `Update harga '${row.name}': Rp ${Number(oldItem.price).toLocaleString('id-ID')} -> Rp ${Number(row.price).toLocaleString('id-ID')}`
      : `Update menu master '${row.name}' (${row.id})`;

    await createAuditLog({
      userId: 'usr-admin-cms',
      userName: 'Admin Store',
      userRole: 'admin',
      actionType,
      entityType: 'menu',
      entityId: id,
      ipAddress,
      userAgent,
      description: actionDesc,
      oldPayload: oldItem,
      newPayload: row,
      status: 'SUCCESS',
    });

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
    const { ipAddress, userAgent } = extractReqMetadata(req);
    const sql = getDb();

    if (typeof body.isAvailable === 'boolean') {
      await sql`
        UPDATE menus SET is_available = ${body.isAvailable}, updated_at = NOW()
        WHERE id = ${id}
      `;

      await createAuditLog({
        userId: 'usr-admin-cms',
        userName: 'Admin Store',
        userRole: 'admin',
        actionType: 'MENU_TOGGLE_AVAILABILITY',
        entityType: 'menu',
        entityId: id,
        ipAddress,
        userAgent,
        description: `Mengubah status ketersediaan menu '${id}' menjadi ${body.isAvailable ? 'TERSEDIA' : 'HABIS'}`,
        oldPayload: { isAvailable: !body.isAvailable },
        newPayload: { isAvailable: body.isAvailable },
        status: 'SUCCESS',
      });
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const sql = getDb();
    const { ipAddress, userAgent } = extractReqMetadata(req);

    // Fetch existing menu before delete
    const existingRows = (await sql`
      SELECT id, name, price, category FROM menus WHERE id = ${id}
    `) as any[];
    const oldItem = existingRows[0];

    await sql`DELETE FROM menus WHERE id = ${id}`;

    await createAuditLog({
      userId: 'usr-admin-cms',
      userName: 'Admin Store',
      userRole: 'admin',
      actionType: 'MENU_DELETE',
      entityType: 'menu',
      entityId: id,
      ipAddress,
      userAgent,
      description: `Menghapus menu '${oldItem?.name || id}' dari sistem`,
      oldPayload: oldItem,
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[DELETE /api/menu/${id}]`, error.message);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}

