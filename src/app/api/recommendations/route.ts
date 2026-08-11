import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_MENU, MenuItem } from '@/data/initialData';
import { getDb, isDbConfigured } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cartItemIds = (searchParams.get('itemIds') || '').split(',').filter(Boolean);

  try {
    let allMenu: MenuItem[] = INITIAL_MENU;

    if (isDbConfigured()) {
      try {
        const sql = getDb();
        const rows = (await sql`
          SELECT
            id, name, name_en AS "nameEn", category,
            sub_category AS "subCategory", variant_preset AS "variantPreset",
            price, description, description_en AS "descriptionEn",
            image, is_available AS "isAvailable", is_popular AS "isPopular"
          FROM menus
          WHERE is_available = TRUE
        `) as any[];

        if (rows.length > 0) {
          allMenu = rows;
        }
      } catch (_) {
        // Fallback to INITIAL_MENU
      }
    }

    // Filter out items already in cart
    const availablePairings = allMenu.filter((m) => !cartItemIds.includes(m.id) && m.isAvailable);

    // Heuristic Pairing: Find items from complementary categories
    // e.g. If cart has drinks, prioritize food/snack/dessert. If cart has food, prioritize drinks/snack.
    const cartCategories = new Set(
      allMenu.filter((m) => cartItemIds.includes(m.id)).map((m) => m.category)
    );

    const recommendations = availablePairings
      .map((item) => {
        let score = item.isPopular ? 3 : 1;
        // Boost complementary categories
        if (cartCategories.has('drinks') && (item.category === 'snack' || item.category === 'dessert')) score += 5;
        if (cartCategories.has('food') && item.category === 'drinks') score += 5;
        if (cartCategories.size === 0 && item.isPopular) score += 10;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.item);

    return NextResponse.json({
      data: recommendations,
      reasoning: 'AI paired based on category compatibility & popularity matrix',
    });
  } catch (error: any) {
    console.error('[GET /api/recommendations]', error.message);
    return NextResponse.json({ error: 'Failed to compute AI recommendations' }, { status: 500 });
  }
}
