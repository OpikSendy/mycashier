import { NextResponse } from 'next/server';
import { cacheEngine, CACHE_KEYS } from '@/lib/redis';
import { INITIAL_MENU } from '@/data/initialData';

export async function GET() {
  try {
    // 1. Check Redis Cache
    const cachedMenu = await cacheEngine.get(CACHE_KEYS.MENU_CATALOG);
    if (cachedMenu) {
      return NextResponse.json({
        source: 'redis_cache',
        data: JSON.parse(cachedMenu),
      });
    }

    // 2. Fallback to Initial Database & Store in Redis for 5 Minutes
    await cacheEngine.set(CACHE_KEYS.MENU_CATALOG, JSON.stringify(INITIAL_MENU), 'EX', 300);

    return NextResponse.json({
      source: 'database',
      data: INITIAL_MENU,
    });
  } catch (error: any) {
    return NextResponse.json({ source: 'error_fallback', data: INITIAL_MENU });
  }
}
