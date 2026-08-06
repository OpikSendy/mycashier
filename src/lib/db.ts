import { neon } from '@neondatabase/serverless';

/**
 * Neon PostgreSQL Serverless Client
 * Falls back gracefully if DATABASE_URL is not configured.
 */

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[MyCashier DB] DATABASE_URL is not set. Please add it to .env.local\n' +
        'Get your connection string from https://neon.tech'
    );
  }

  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }

  return _sql;
}

/** Check if DB is configured (use to gracefully fallback to in-memory) */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
