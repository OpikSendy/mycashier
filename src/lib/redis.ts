import Redis from 'ioredis';

// High-Speed Memory Fallback Cache if Redis URL is not set
class LocalMemoryCache {
  private cache = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, durationSeconds?: number): Promise<'OK'> {
    const ttl = (durationSeconds || 300) * 1000;
    this.cache.set(key, { value, expiresAt: Date.now() + ttl });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }
}

let redisClient: Redis | LocalMemoryCache;

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

if (REDIS_URL && typeof window === 'undefined') {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
    });
    redisClient.on('error', (err) => {
      console.warn('Redis connection warning, switching to high-speed memory fallback cache:', err.message);
    });
  } catch (e) {
    redisClient = new LocalMemoryCache();
  }
} else {
  redisClient = new LocalMemoryCache();
}

export const cacheEngine = redisClient;

export const CACHE_KEYS = {
  MENU_CATALOG: 'mycashier:menu:catalog',
  ORDERS_LIST: 'mycashier:orders:list',
  SALES_ANALYTICS: 'mycashier:analytics:sales',
};
