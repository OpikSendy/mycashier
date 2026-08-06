/**
 * MyCashier — Database Seed Script
 * Seeds initial menu data to Neon PostgreSQL.
 * Run with: bun run src/lib/seed.ts
 *
 * Make sure DATABASE_URL is set in .env.local first!
 */

import { neon } from '@neondatabase/serverless';
import { INITIAL_MENU } from '../data/initialData';

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please add it to .env.local');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  console.log('🌱 Starting MyCashier database seed...\n');

  // Count existing menus
  const existing = await sql`SELECT COUNT(*) as count FROM menus`;
  const count = Number(existing[0].count);

  if (count > 0) {
    console.log(`ℹ️  Database already has ${count} menu items. Skipping seed.`);
    console.log('   To re-seed, run: DELETE FROM menus; first in Neon SQL Editor.\n');
    process.exit(0);
  }

  // Insert all menu items
  console.log(`📋 Inserting ${INITIAL_MENU.length} menu items...\n`);

  for (const item of INITIAL_MENU) {
    await sql`
      INSERT INTO menus (
        id, name, name_en, category, sub_category, variant_preset,
        price, description, description_en, image, is_available, is_popular
      ) VALUES (
        ${item.id},
        ${item.name},
        ${item.nameEn ?? null},
        ${item.category},
        ${item.subCategory ?? null},
        ${item.variantPreset ?? 'none'},
        ${item.price},
        ${item.description},
        ${item.descriptionEn ?? null},
        ${item.image},
        ${item.isAvailable},
        ${item.isPopular ?? false}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`  ✅ ${item.name}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`   ${INITIAL_MENU.length} menu items inserted into Neon PostgreSQL.`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
