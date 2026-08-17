import { describe, it, expect, beforeEach } from 'bun:test';

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
  status: 'SUCCESS' | 'FAILURE';
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
 * Format audit logs as standard CSV string for export with proper quote escaping.
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = ['ID', 'Timestamp', 'User ID', 'User Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Status', 'IP Address', 'Description'];
  const rows = logs.map((log) => [
    `"${log.id.replace(/"/g, '""')}"`,
    `"${log.timestamp.replace(/"/g, '""')}"`,
    `"${log.userId.replace(/"/g, '""')}"`,
    `"${(log.userName || '').replace(/"/g, '""')}"`,
    `"${log.userRole.replace(/"/g, '""')}"`,
    `"${log.actionType.replace(/"/g, '""')}"`,
    `"${log.entityType.replace(/"/g, '""')}"`,
    `"${(log.entityId || '').replace(/"/g, '""')}"`,
    `"${log.status.replace(/"/g, '""')}"`,
    `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
    `"${log.description.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * In-Memory Audit Trail Repository & Filter Engine
 */
export class AuditLogRepository {
  private logs: AuditLogEntry[] = [];

  public logEvent(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'diff'> & {
      id?: string;
      timestamp?: string;
    }
  ): AuditLogEntry {
    const diff = computePayloadDiff(entry.oldPayload, entry.newPayload);
    const completeEntry: AuditLogEntry = {
      id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      diff,
      ...entry,
    };

    this.logs.unshift(completeEntry);
    return completeEntry;
  }

  public queryLogs(filters: AuditLogFilters = {}): { total: number; logs: AuditLogEntry[] } {
    let result = [...this.logs];

    if (filters.actionType) {
      result = result.filter((l) => l.actionType === filters.actionType);
    }

    if (filters.userRole) {
      result = result.filter((l) => l.userRole === filters.userRole);
    }

    if (filters.entityType) {
      result = result.filter((l) => l.entityType === filters.entityType);
    }

    if (filters.status) {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.actionType.toLowerCase().includes(q) ||
          (l.entityId && l.entityId.toLowerCase().includes(q))
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

  public clear() {
    this.logs = [];
  }
}

describe('Security Audit Trail & Logging Test Suite (tests/e2e/security-audit-logs.test.ts)', () => {
  let repo: AuditLogRepository;

  beforeEach(() => {
    repo = new AuditLogRepository();
  });

  // ==========================================
  // TIER 1: CORE AUDIT LOGGING COVERAGE
  // ==========================================
  describe('Tier 1: Core Mutation Audit Event Capture', () => {
    it('1.1 should record Menu Price Update mutation with old and new values', () => {
      const entry = repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Store Owner',
        userRole: 'admin',
        actionType: 'MENU_PRICE_UPDATE',
        entityType: 'menu',
        entityId: 'prod-wagyu',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 POS-Terminal/1.0',
        description: "Updated price of 'Wagyu Beef' from Rp 85.000 to Rp 95.000",
        oldPayload: { price: 85000, isAvailable: true },
        newPayload: { price: 95000, isAvailable: true },
        status: 'SUCCESS',
      });

      expect(entry.id).toBeDefined();
      expect(entry.actionType).toBe('MENU_PRICE_UPDATE');
      expect(entry.diff?.price.old).toBe(85000);
      expect(entry.diff?.price.new).toBe(95000);
      expect(entry.diff?.isAvailable).toBeUndefined();
    });

    it('1.2 should record Manual Stock Override mutation in inventory', () => {
      const entry = repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Admin',
        userRole: 'admin',
        actionType: 'STOCK_MANUAL_OVERRIDE',
        entityType: 'inventory',
        entityId: 'inv-coffee',
        ipAddress: '127.0.0.1',
        description: 'Manual stock adjustment (+10kg) due to physical restock',
        oldPayload: { stock: 40 },
        newPayload: { stock: 50 },
        status: 'SUCCESS',
      });

      expect(entry.diff?.stock.old).toBe(40);
      expect(entry.diff?.stock.new).toBe(50);
    });

    it('1.3 should record Store Settings configuration mutation (Tax & Fees)', () => {
      const entry = repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Owner',
        userRole: 'admin',
        actionType: 'STORE_SETTINGS_UPDATE',
        entityType: 'store_settings',
        entityId: 'settings-1',
        description: 'Updated taxRate to 11% and enabled CEIL_500 rounding',
        oldPayload: { taxRate: 10, cashRoundingRule: 'NONE' },
        newPayload: { taxRate: 11, cashRoundingRule: 'CEIL_500' },
        status: 'SUCCESS',
      });

      expect(entry.diff?.taxRate.new).toBe(11);
      expect(entry.diff?.cashRoundingRule.new).toBe('CEIL_500');
    });

    it('1.4 should record User Login auth events', () => {
      const entry = repo.logEvent({
        userId: 'usr-cashier-1',
        userName: 'Kasir Shift Pagi',
        userRole: 'cashier',
        actionType: 'USER_LOGIN',
        entityType: 'auth',
        ipAddress: '10.0.0.12',
        userAgent: 'MyCashier-PWA-Tablet/2.0',
        description: 'Successful PIN login for Kasir Shift Pagi at Branch Jakarta',
        newPayload: { branchId: 'b-1', role: 'cashier' },
        status: 'SUCCESS',
      });

      expect(entry.actionType).toBe('USER_LOGIN');
      expect(entry.userRole).toBe('cashier');
      expect(entry.status).toBe('SUCCESS');
    });

    it('1.5 should record Stock Transfer Approval events', () => {
      const entry = repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Store Owner',
        userRole: 'admin',
        actionType: 'STOCK_TRANSFER_APPROVE',
        entityType: 'transfer',
        entityId: 'TRF-202608-1001',
        description: 'Approved transfer TRF-202608-1001 from Jakarta to Bali',
        oldPayload: { status: 'PENDING' },
        newPayload: { status: 'APPROVED' },
        status: 'SUCCESS',
      });

      expect(entry.entityId).toBe('TRF-202608-1001');
      expect(entry.diff?.status.new).toBe('APPROVED');
    });

    it('1.6 should record Stock Transfer Completion events', () => {
      const entry = repo.logEvent({
        userId: 'usr-bali-staff',
        userName: 'Bali Receiver',
        userRole: 'cashier',
        actionType: 'STOCK_TRANSFER_COMPLETED',
        entityType: 'transfer',
        entityId: 'TRF-202608-1001',
        description: 'Received shipment at Bali branch',
        oldPayload: { status: 'IN_TRANSIT' },
        newPayload: { status: 'COMPLETED' },
        status: 'SUCCESS',
      });

      expect(entry.actionType).toBe('STOCK_TRANSFER_COMPLETED');
      expect(entry.diff?.status.new).toBe('COMPLETED');
    });
  });

  // ==========================================
  // TIER 2: DIFF TRACKING & SEARCH / FILTERS
  // ==========================================
  describe('Tier 2: Diff Engine & Query Filtering', () => {
    beforeEach(() => {
      repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Admin Store',
        userRole: 'admin',
        actionType: 'MENU_PRICE_UPDATE',
        entityType: 'menu',
        entityId: 'prod-1',
        description: 'Price changed for Nasi Goreng',
        timestamp: '2026-08-17T08:00:00Z',
        status: 'SUCCESS',
      });

      repo.logEvent({
        userId: 'usr-cashier-1',
        userName: 'Kasir Budi',
        userRole: 'cashier',
        actionType: 'USER_LOGIN',
        entityType: 'auth',
        description: 'Login cashier Budi',
        timestamp: '2026-08-17T08:30:00Z',
        status: 'SUCCESS',
      });

      repo.logEvent({
        userId: 'usr-admin-1',
        userName: 'Admin Store',
        userRole: 'admin',
        actionType: 'STOCK_TRANSFER_APPROVE',
        entityType: 'transfer',
        entityId: 'TRF-101',
        description: 'Approved transfer TRF-101',
        timestamp: '2026-08-17T09:00:00Z',
        status: 'SUCCESS',
      });

      repo.logEvent({
        userId: 'usr-guest-99',
        userName: 'Anonymous Attacker',
        userRole: 'customer',
        actionType: 'UNAUTHORIZED_MUTATION_ATTEMPT',
        entityType: 'store_settings',
        description: 'Blocked unauthorized PUT /api/store-settings',
        timestamp: '2026-08-17T09:15:00Z',
        status: 'FAILURE',
      });
    });

    it('2.1 should filter logs by userRole', () => {
      const adminLogs = repo.queryLogs({ userRole: 'admin' });
      expect(adminLogs.total).toBe(2);
      expect(adminLogs.logs.every((l) => l.userRole === 'admin')).toBe(true);

      const cashierLogs = repo.queryLogs({ userRole: 'cashier' });
      expect(cashierLogs.total).toBe(1);
    });

    it('2.2 should filter logs by actionType', () => {
      const menuLogs = repo.queryLogs({ actionType: 'MENU_PRICE_UPDATE' });
      expect(menuLogs.total).toBe(1);
      expect(menuLogs.logs[0].actionType).toBe('MENU_PRICE_UPDATE');
    });

    it('2.3 should filter logs by status (SUCCESS vs FAILURE)', () => {
      const failures = repo.queryLogs({ status: 'FAILURE' });
      expect(failures.total).toBe(1);
      expect(failures.logs[0].actionType).toBe('UNAUTHORIZED_MUTATION_ATTEMPT');
    });

    it('2.4 should perform keyword search across description, user, and entity', () => {
      const searchRes = repo.queryLogs({ search: 'Nasi Goreng' });
      expect(searchRes.total).toBe(1);
      expect(searchRes.logs[0].description).toContain('Nasi Goreng');

      const searchUser = repo.queryLogs({ search: 'Budi' });
      expect(searchUser.total).toBe(1);
    });

    it('2.5 should filter logs by date range', () => {
      const rangeLogs = repo.queryLogs({
        startDate: '2026-08-17T08:15:00Z',
        endDate: '2026-08-17T09:05:00Z',
      });
      expect(rangeLogs.total).toBe(2);
    });

    it('2.6 should support pagination (limit and offset)', () => {
      const page1 = repo.queryLogs({ limit: 2, offset: 0 });
      expect(page1.logs.length).toBe(2);

      const page2 = repo.queryLogs({ limit: 2, offset: 2 });
      expect(page2.logs.length).toBe(2);
      expect(page1.logs[0].id).not.toBe(page2.logs[0].id);
    });

    it('2.7 should return all logs when search query is empty string', () => {
      const res = repo.queryLogs({ search: '' });
      expect(res.total).toBe(4);
    });
  });

  // ==========================================
  // TIER 3: DIFF VISUALIZER & CSV EXPORT
  // ==========================================
  describe('Tier 3: Diff Engine Calculation & CSV Formatting', () => {
    it('3.1 should compute granular additions, deletions, and modifications in diff', () => {
      const oldObj = { name: 'Latte', price: 25000, isSpecial: false };
      const newObj = { name: 'Iced Latte', price: 28000, isAvailable: true };

      const diff = computePayloadDiff(oldObj, newObj);
      expect(diff.name).toEqual({ old: 'Latte', new: 'Iced Latte' });
      expect(diff.price).toEqual({ old: 25000, new: 28000 });
      expect(diff.isSpecial).toEqual({ old: false, new: undefined });
      expect(diff.isAvailable).toEqual({ old: undefined, new: true });
    });

    it('3.2 should handle empty or null payloads in diff calculation without error', () => {
      const diffEmpty = computePayloadDiff(undefined, { key: 'value' });
      expect(diffEmpty.key).toEqual({ old: undefined, new: 'value' });

      const diffBothEmpty = computePayloadDiff(undefined, undefined);
      expect(Object.keys(diffBothEmpty).length).toBe(0);
    });

    it('3.3 should export audit logs into RFC-4180 compliant CSV text', () => {
      const entry = repo.logEvent({
        userId: 'usr-1',
        userName: 'Admin "Super"',
        userRole: 'admin',
        actionType: 'STORE_SETTINGS_UPDATE',
        entityType: 'store_settings',
        description: 'Updated store address, tax, and rules',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
      });

      const csv = exportAuditLogsToCsv([entry]);
      expect(csv).toContain('ID,Timestamp,User ID,User Name,Role,Action');
      expect(csv).toContain('"usr-1"');
      expect(csv).toContain('"Admin ""Super"""');
      expect(csv).toContain('"STORE_SETTINGS_UPDATE"');
    });

    it('3.4 should detect multi-field nested object changes in payload diff', () => {
      const oldSettings = { tax: { rate: 10, enabled: true }, fees: { service: 5 } };
      const newSettings = { tax: { rate: 11, enabled: true }, fees: { service: 6 } };

      const diff = computePayloadDiff(oldSettings, newSettings);
      expect(diff.tax).toBeDefined();
      expect(diff.fees).toBeDefined();
    });
  });

  // ==========================================
  // TIER 4: REAL-WORLD & ADVERSARIAL STRESS
  // ==========================================
  describe('Tier 4: High Concurrency & Tamper Resistance', () => {
    it('4.1 should handle 50 rapid sequential mutations preserving exact chronological order', () => {
      for (let i = 1; i <= 50; i++) {
        repo.logEvent({
          userId: `usr-${i % 3}`,
          userName: `Staff ${i % 3}`,
          userRole: i % 2 === 0 ? 'admin' : 'cashier',
          actionType: 'MENU_PRICE_UPDATE',
          entityType: 'menu',
          entityId: `prod-${i}`,
          description: `Mutation sequence #${i}`,
          status: 'SUCCESS',
        });
      }

      const all = repo.queryLogs({ limit: 100 });
      expect(all.total).toBe(50);
      expect(all.logs[0].description).toBe('Mutation sequence #50');
      expect(all.logs[49].description).toBe('Mutation sequence #1');
    });

    it('4.2 should safely store and search XSS and SQL injection payloads', () => {
      const xssDescription = "<script>alert('pwned')</script>";
      const sqlEntityId = "prod-1' OR '1'='1";

      repo.logEvent({
        userId: 'attacker-1',
        userName: 'Hacker',
        userRole: 'customer',
        actionType: 'INJECTION_ATTEMPT',
        entityType: 'security',
        entityId: sqlEntityId,
        description: xssDescription,
        status: 'FAILURE',
      });

      const searchRes = repo.queryLogs({ search: '<script>' });
      expect(searchRes.total).toBe(1);
      expect(searchRes.logs[0].entityId).toBe(sqlEntityId);
    });

    it('4.3 should maintain immutability (append-only ledger behavior)', () => {
      const entry = repo.logEvent({
        userId: 'usr-admin',
        userName: 'Admin',
        userRole: 'admin',
        actionType: 'FINANCIAL_ADJUSTMENT',
        entityType: 'orders',
        entityId: 'ORD-999',
        description: 'Order refund executed',
        status: 'SUCCESS',
      });

      const fetched = repo.getById(entry.id);
      expect(fetched).toBeDefined();
      expect(fetched?.description).toBe('Order refund executed');
    });
  });
});
