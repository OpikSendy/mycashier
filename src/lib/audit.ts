import { getDb, isDbConfigured } from '@/lib/db';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  oldPayload?: Record<string, any>;
  newPayload?: Record<string, any>;
  diff?: Record<string, { old: any; new: any }>;
  status?: 'SUCCESS' | 'FAILURE';
}

export interface AuditLogFilters {
  actionType?: string;
  userRole?: string;
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: 'SUCCESS' | 'FAILURE';
  limit?: number;
  offset?: number;
}

/**
 * Pure Utility to compute property-level diffs between old and new JSON payloads.
 */
export function computePayloadDiff(
  oldPayload?: Record<string, any>,
  newPayload?: Record<string, any>
): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};
  const oldKeys = Object.keys(oldPayload || {});
  const newKeys = Object.keys(newPayload || {});
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

  for (const key of allKeys) {
    const oldVal = oldPayload ? oldPayload[key] : undefined;
    const newVal = newPayload ? newPayload[key] : undefined;

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  return diff;
}

/**
 * Format audit logs as standard CSV string for export with RFC-4180 quote escaping.
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'User Name',
    'Role',
    'Action',
    'Entity Type',
    'Entity ID',
    'Status',
    'IP Address',
    'Description',
  ];

  const rows = logs.map((log) => [
    `"${(log.id || '').replace(/"/g, '""')}"`,
    `"${(log.timestamp || '').replace(/"/g, '""')}"`,
    `"${(log.userId || '').replace(/"/g, '""')}"`,
    `"${(log.userName || '').replace(/"/g, '""')}"`,
    `"${(log.userRole || '').replace(/"/g, '""')}"`,
    `"${(log.actionType || '').replace(/"/g, '""')}"`,
    `"${(log.entityType || '').replace(/"/g, '""')}"`,
    `"${(log.entityId || '').replace(/"/g, '""')}"`,
    `"${(log.status || 'SUCCESS').replace(/"/g, '""')}"`,
    `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
    `"${(log.description || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/** Alias for exportAuditLogsToCsv */
export const formatAuditLogsCsv = exportAuditLogsToCsv;

/**
 * In-Memory Audit Trail Repository & Filter Engine
 */
export class AuditLogRepository {
  private logs: AuditLogEntry[] = [];

  constructor(initialLogs: AuditLogEntry[] = []) {
    this.logs = [...initialLogs];
  }

  public logEvent(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'diff'> & {
      id?: string;
      timestamp?: string;
      diff?: Record<string, { old: any; new: any }>;
      status?: 'SUCCESS' | 'FAILURE';
    }
  ): AuditLogEntry {
    const diff = entry.diff || computePayloadDiff(entry.oldPayload, entry.newPayload);
    const completeEntry: AuditLogEntry = {
      id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      status: entry.status || 'SUCCESS',
      ...entry,
      diff,
    };

    this.logs.unshift(completeEntry);
    return completeEntry;
  }

  public queryLogs(filters: AuditLogFilters = {}): { total: number; logs: AuditLogEntry[] } {
    let result = [...this.logs];

    if (filters.actionType && filters.actionType !== 'ALL') {
      result = result.filter((l) => l.actionType === filters.actionType);
    }

    if (filters.userRole && filters.userRole !== 'ALL') {
      result = result.filter((l) => l.userRole === filters.userRole);
    }

    if (filters.entityType && filters.entityType !== 'ALL') {
      result = result.filter((l) => l.entityType === filters.entityType);
    }

    if (filters.status && filters.status !== ('ALL' as any)) {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.actionType.toLowerCase().includes(q) ||
          (l.entityId && l.entityId.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) ||
          (l.userId && l.userId.toLowerCase().includes(q))
      );
    }

    if (filters.startDate) {
      result = result.filter((l) => l.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter((l) => l.timestamp <= filters.endDate!);
    }

    const total = result.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = result.slice(offset, offset + limit);

    return { total, logs: paginated };
  }

  public getById(id: string): AuditLogEntry | undefined {
    return this.logs.find((l) => l.id === id);
  }

  public getAll(): AuditLogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
  }
}

// Initial demo seed entries
const INITIAL_DEMO_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-demo-1',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    userId: 'usr-admin-master',
    userName: 'Owner Resto',
    userRole: 'admin',
    actionType: 'STORE_SETTINGS_UPDATE',
    entityType: 'store_settings',
    entityId: 'settings-1',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    description: 'Inisialisasi konfigurasi pajak PB1 (10%) dan Service Charge (5%)',
    oldPayload: { taxRate: 10, serviceChargeRate: 0, cashRoundingRule: 'NONE' },
    newPayload: { taxRate: 10, serviceChargeRate: 5, cashRoundingRule: 'CEIL_500' },
    diff: {
      serviceChargeRate: { old: 0, new: 5 },
      cashRoundingRule: { old: 'NONE', new: 'CEIL_500' },
    },
    status: 'SUCCESS',
  },
  {
    id: 'audit-demo-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'usr-admin-master',
    userName: 'Owner Resto',
    userRole: 'admin',
    actionType: 'MENU_PRICE_UPDATE',
    entityType: 'menu',
    entityId: 'prod-wagyu',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 POS-Admin/2.0',
    description: "Update harga 'Wagyu Beef Steak' dari Rp 85.000 menjadi Rp 95.000",
    oldPayload: { price: 85000, name: 'Wagyu Beef Steak' },
    newPayload: { price: 95000, name: 'Wagyu Beef Steak' },
    diff: {
      price: { old: 85000, new: 95000 },
    },
    status: 'SUCCESS',
  },
  {
    id: 'audit-demo-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    userId: 'usr-cashier-1',
    userName: 'Kasir Shift Pagi',
    userRole: 'cashier',
    actionType: 'USER_LOGIN',
    entityType: 'auth',
    entityId: 'session-cashier',
    ipAddress: '192.168.1.50',
    userAgent: 'MyCashier-POS-Tablet/1.0',
    description: 'Login sukses Kasir Shift Pagi dengan Quick PIN',
    newPayload: { branchId: 'b-1', role: 'cashier' },
    diff: {},
    status: 'SUCCESS',
  },
];

// Global in-memory audit store
export const globalAuditRepo = new AuditLogRepository(INITIAL_DEMO_LOGS);

/**
 * Extract Client IP and User Agent from request
 */
export function extractReqMetadata(req: NextRequest | Request): { ipAddress: string; userAgent: string } {
  let ipAddress = '127.0.0.1';
  let userAgent = '';

  try {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      ipAddress = forwarded.split(',')[0].trim();
    } else {
      const realIp = req.headers.get('x-real-ip');
      if (realIp) {
        ipAddress = realIp.trim();
      }
    }
    userAgent = req.headers.get('user-agent') || '';
  } catch (_) {
    // ignore
  }

  return { ipAddress, userAgent };
}

/**
 * Create an audit log record, saving to in-memory buffer and PostgreSQL database if available.
 */
export async function createAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'diff'> & {
    id?: string;
    timestamp?: string;
    diff?: Record<string, { old: any; new: any }>;
    status?: 'SUCCESS' | 'FAILURE';
  }
): Promise<AuditLogEntry> {
  const completeEntry = globalAuditRepo.logEvent(entry);

  if (isDbConfigured()) {
    try {
      const sql = getDb();
      // Ensure audit_logs table exists
      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id              VARCHAR(50)   PRIMARY KEY,
          timestamp       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          user_id         VARCHAR(50)   NOT NULL,
          user_name       VARCHAR(100)  NOT NULL,
          user_role       VARCHAR(20)   NOT NULL,
          action_type     VARCHAR(50)   NOT NULL,
          entity_type     VARCHAR(50)   NOT NULL,
          entity_id       VARCHAR(50),
          ip_address      VARCHAR(50)   DEFAULT '127.0.0.1',
          user_agent      TEXT          DEFAULT '',
          description     TEXT          NOT NULL,
          old_payload     JSONB,
          new_payload     JSONB,
          diff            JSONB,
          status          VARCHAR(20)   NOT NULL DEFAULT 'SUCCESS',
          created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        INSERT INTO audit_logs (
          id, timestamp, user_id, user_name, user_role, action_type,
          entity_type, entity_id, ip_address, user_agent, description,
          old_payload, new_payload, diff, status
        ) VALUES (
          ${completeEntry.id},
          ${completeEntry.timestamp},
          ${completeEntry.userId},
          ${completeEntry.userName},
          ${completeEntry.userRole},
          ${completeEntry.actionType},
          ${completeEntry.entityType},
          ${completeEntry.entityId || null},
          ${completeEntry.ipAddress || '127.0.0.1'},
          ${completeEntry.userAgent || ''},
          ${completeEntry.description},
          ${completeEntry.oldPayload ? JSON.stringify(completeEntry.oldPayload) : null},
          ${completeEntry.newPayload ? JSON.stringify(completeEntry.newPayload) : null},
          ${completeEntry.diff ? JSON.stringify(completeEntry.diff) : null},
          ${completeEntry.status || 'SUCCESS'}
        )
      `;
    } catch (error: any) {
      console.warn('[createAuditLog] Failed to persist to PostgreSQL, using in-memory log:', error.message);
    }
  }

  return completeEntry;
}

/**
 * Query audit logs with pagination and multi-dimensional filters.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<{ total: number; logs: AuditLogEntry[] }> {
  if (!isDbConfigured()) {
    return globalAuditRepo.queryLogs(filters);
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id,
        timestamp,
        user_id AS "userId",
        user_name AS "userName",
        user_role AS "userRole",
        action_type AS "actionType",
        entity_type AS "entityType",
        entity_id AS "entityId",
        ip_address AS "ipAddress",
        user_agent AS "userAgent",
        description,
        old_payload AS "oldPayload",
        new_payload AS "newPayload",
        diff,
        status
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 500
    `) as any[];

    if (!rows || rows.length === 0) {
      return globalAuditRepo.queryLogs(filters);
    }

    const mappedLogs: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
      userId: r.userId,
      userName: r.userName,
      userRole: r.userRole,
      actionType: r.actionType,
      entityType: r.entityType,
      entityId: r.entityId || undefined,
      ipAddress: r.ipAddress || undefined,
      userAgent: r.userAgent || undefined,
      description: r.description,
      oldPayload: typeof r.oldPayload === 'string' ? JSON.parse(r.oldPayload) : r.oldPayload || undefined,
      newPayload: typeof r.newPayload === 'string' ? JSON.parse(r.newPayload) : r.newPayload || undefined,
      diff: typeof r.diff === 'string' ? JSON.parse(r.diff) : r.diff || undefined,
      status: r.status || 'SUCCESS',
    }));

    const tempRepo = new AuditLogRepository(mappedLogs);
    return tempRepo.queryLogs(filters);
  } catch (error: any) {
    console.warn('[getAuditLogs] DB query failed, falling back to in-memory:', error.message);
    return globalAuditRepo.queryLogs(filters);
  }
}
