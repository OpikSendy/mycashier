import { describe, it, expect, beforeEach } from 'bun:test';

export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type MutationType = 'TRANSFER_OUT' | 'TRANSFER_IN' | 'MANUAL_OVERRIDE' | 'RESTOCK' | 'SALE_DEDUCTION';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
}

export interface BranchStock {
  id: string; // branchId:itemId
  branchId: string;
  itemId: string;
  quantity: number;
  minThreshold: number;
  lastRestocked?: string;
}

export interface TransferRequestItem {
  itemId: string;
  quantity: number;
  unit: string;
}

export interface TransferRecord {
  id: string;
  transferNumber: string;
  sourceBranchId: string;
  destBranchId: string;
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  items: TransferRequestItem[];
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface StockMutationRecord {
  id: string;
  branchId: string;
  itemId: string;
  mutationType: MutationType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Enterprise Inventory & Inter-Branch Transfer State Machine Engine
 */
export class InventoryTransferEngine {
  public branches: Map<string, Branch> = new Map();
  public stocks: Map<string, BranchStock> = new Map(); // key: branchId:itemId
  public transfers: Map<string, TransferRecord> = new Map();
  public mutations: StockMutationRecord[] = [];

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    this.branches.clear();
    this.stocks.clear();
    this.transfers.clear();
    this.mutations = [];

    // Seed 3 Branches
    this.branches.set('b-1', {
      id: 'b-1',
      code: 'JKT-01',
      name: 'Cabang Jakarta Pusat',
      city: 'Jakarta',
      address: 'Grand Indonesia Mall, Lt. 3',
    });
    this.branches.set('b-2', {
      id: 'b-2',
      code: 'BDG-01',
      name: 'Cabang Bandung Dago',
      city: 'Bandung',
      address: 'Jl. Ir. H. Juanda No. 88, Dago',
    });
    this.branches.set('b-3', {
      id: 'b-3',
      code: 'DPS-01',
      name: 'Cabang Bali Seminyak',
      city: 'Bali',
      address: 'Jl. Kayu Aya No. 12, Seminyak',
    });

    // Seed initial stock quantities for raw materials
    // Item 1: Coffee Beans (kg) -> Jakarta: 50kg, Bandung: 15kg, Bali: 5kg
    this.setStock('b-1', 'inv-coffee', 50, 5);
    this.setStock('b-2', 'inv-coffee', 15, 5);
    this.setStock('b-3', 'inv-coffee', 5, 5);

    // Item 2: Fresh Milk (liter) -> Jakarta: 100L, Bandung: 30L, Bali: 10L
    this.setStock('b-1', 'inv-milk', 100, 10);
    this.setStock('b-2', 'inv-milk', 30, 10);
    this.setStock('b-3', 'inv-milk', 10, 10);

    // Item 3: Aren Syrup (liter) -> Jakarta: 40L, Bandung: 10L, Bali: 2L
    this.setStock('b-1', 'inv-syrup', 40, 5);
    this.setStock('b-2', 'inv-syrup', 10, 5);
    this.setStock('b-3', 'inv-syrup', 2, 5);
  }

  public getStock(branchId: string, itemId: string): number {
    const key = `${branchId}:${itemId}`;
    return this.stocks.get(key)?.quantity ?? 0;
  }

  public setStock(branchId: string, itemId: string, quantity: number, minThreshold: number = 5) {
    const key = `${branchId}:${itemId}`;
    this.stocks.set(key, {
      id: key,
      branchId,
      itemId,
      quantity,
      minThreshold,
      lastRestocked: new Date().toISOString(),
    });
  }

  public createTransfer(params: {
    sourceBranchId: string;
    destBranchId: string;
    items: TransferRequestItem[];
    requestedBy: string;
    notes?: string;
  }): { success: boolean; transfer?: TransferRecord; error?: string } {
    const { sourceBranchId, destBranchId, items, requestedBy, notes } = params;

    if (!this.branches.has(sourceBranchId)) {
      return { success: false, error: `Source branch '${sourceBranchId}' does not exist.` };
    }
    if (!this.branches.has(destBranchId)) {
      return { success: false, error: `Destination branch '${destBranchId}' does not exist.` };
    }

    if (sourceBranchId === destBranchId) {
      return { success: false, error: 'Self-transfer is forbidden. Source and Destination branches must differ.' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Transfer request must contain at least one item.' };
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return { success: false, error: `Invalid quantity '${item.quantity}' for item '${item.itemId}'. Must be greater than 0.` };
      }
      const available = this.getStock(sourceBranchId, item.itemId);
      if (item.quantity > available) {
        return {
          success: false,
          error: `Insufficient stock for item '${item.itemId}' at source branch. Requested: ${item.quantity}, Available: ${available}.`,
        };
      }
    }

    const transferId = `trf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const transferNumber = `TRF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${this.transfers.size + 1001}`;

    const record: TransferRecord = {
      id: transferId,
      transferNumber,
      sourceBranchId,
      destBranchId,
      status: 'PENDING',
      requestedBy,
      notes,
      items: items.map((it) => ({ ...it })),
      requestedAt: new Date().toISOString(),
    };

    this.transfers.set(transferId, record);
    return { success: true, transfer: record };
  }

  public approveTransfer(transferId: string, approvedBy: string, userRole: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (userRole !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Admin role can approve stock transfers.' };
    }

    if (transfer.status !== 'PENDING') {
      return { success: false, error: `Cannot approve transfer in status '${transfer.status}'. Must be 'PENDING'.` };
    }

    transfer.status = 'APPROVED';
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date().toISOString();
    return { success: true };
  }

  public shipTransfer(transferId: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'APPROVED') {
      return { success: false, error: `Cannot ship transfer in status '${transfer.status}'. Must be 'APPROVED'.` };
    }

    transfer.status = 'IN_TRANSIT';
    transfer.shippedAt = new Date().toISOString();
    return { success: true };
  }

  public completeTransfer(transferId: string, receivedBy: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'IN_TRANSIT') {
      return { success: false, error: `Cannot complete transfer in status '${transfer.status}'. Must be 'IN_TRANSIT'.` };
    }

    // ATOMIC CHECK:
    for (const item of transfer.items) {
      const currentSource = this.getStock(transfer.sourceBranchId, item.itemId);
      if (currentSource < item.quantity) {
        return {
          success: false,
          error: `Atomic transaction failed: Insufficient stock for '${item.itemId}' at source branch during completion. Available: ${currentSource}, Needed: ${item.quantity}.`,
        };
      }
    }

    const now = new Date().toISOString();

    // Deduct & Increment
    for (const item of transfer.items) {
      const sourceBefore = this.getStock(transfer.sourceBranchId, item.itemId);
      const sourceAfter = sourceBefore - item.quantity;
      this.setStock(transfer.sourceBranchId, item.itemId, sourceAfter);

      this.mutations.push({
        id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        branchId: transfer.sourceBranchId,
        itemId: item.itemId,
        mutationType: 'TRANSFER_OUT',
        quantityChange: -item.quantity,
        stockBefore: sourceBefore,
        stockAfter: sourceAfter,
        referenceId: transfer.id,
        notes: `Transfer out to branch ${transfer.destBranchId} (${transfer.transferNumber})`,
        createdBy: receivedBy,
        createdAt: now,
      });

      const destBefore = this.getStock(transfer.destBranchId, item.itemId);
      const destAfter = destBefore + item.quantity;
      this.setStock(transfer.destBranchId, item.itemId, destAfter);

      this.mutations.push({
        id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        branchId: transfer.destBranchId,
        itemId: item.itemId,
        mutationType: 'TRANSFER_IN',
        quantityChange: item.quantity,
        stockBefore: destBefore,
        stockAfter: destAfter,
        referenceId: transfer.id,
        notes: `Transfer in from branch ${transfer.sourceBranchId} (${transfer.transferNumber})`,
        createdBy: receivedBy,
        createdAt: now,
      });
    }

    transfer.status = 'COMPLETED';
    transfer.completedAt = now;
    return { success: true };
  }

  public cancelTransfer(transferId: string, cancelledBy: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      return { success: false, error: `Cannot cancel transfer already in status '${transfer.status}'.` };
    }

    transfer.status = 'CANCELLED';
    transfer.cancelledAt = new Date().toISOString();
    return { success: true };
  }

  public rejectTransfer(transferId: string, rejectedBy: string, reason: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'PENDING') {
      return { success: false, error: `Cannot reject transfer in status '${transfer.status}'. Must be 'PENDING'.` };
    }

    transfer.status = 'REJECTED';
    transfer.notes = reason;
    return { success: true };
  }

  public manualStockOverride(
    branchId: string,
    itemId: string,
    newQuantity: number,
    userId: string,
    reason: string
  ): { success: boolean; error?: string } {
    if (!this.branches.has(branchId)) return { success: false, error: 'Branch not found.' };
    if (newQuantity < 0) return { success: false, error: 'Stock quantity cannot be negative.' };

    const before = this.getStock(branchId, itemId);
    const delta = newQuantity - before;
    this.setStock(branchId, itemId, newQuantity);

    this.mutations.push({
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId,
      itemId,
      mutationType: 'MANUAL_OVERRIDE',
      quantityChange: delta,
      stockBefore: before,
      stockAfter: newQuantity,
      notes: reason,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  public recordRestock(
    branchId: string,
    itemId: string,
    addedQuantity: number,
    userId: string,
    supplierInvoice?: string
  ): { success: boolean; error?: string } {
    if (!this.branches.has(branchId)) return { success: false, error: 'Branch not found.' };
    if (addedQuantity <= 0) return { success: false, error: 'Restock quantity must be positive.' };

    const before = this.getStock(branchId, itemId);
    const after = before + addedQuantity;
    this.setStock(branchId, itemId, after);

    this.mutations.push({
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId,
      itemId,
      mutationType: 'RESTOCK',
      quantityChange: addedQuantity,
      stockBefore: before,
      stockAfter: after,
      notes: supplierInvoice ? `Supplier Restock: ${supplierInvoice}` : 'Regular restock',
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }
}

describe('Inventory & Inter-Branch Transfers Test Suite (tests/e2e/inventory-transfers.test.ts)', () => {
  let engine: InventoryTransferEngine;

  beforeEach(() => {
    engine = new InventoryTransferEngine();
  });

  // ==========================================
  // TIER 1: CORE FEATURE COVERAGE
  // ==========================================
  describe('Tier 1: Core Feature Coverage', () => {
    it('1.1 should correctly initialize multi-branch locations (Jakarta, Bandung, Bali)', () => {
      expect(engine.branches.size).toBe(3);
      expect(engine.branches.get('b-1')?.city).toBe('Jakarta');
      expect(engine.branches.get('b-2')?.city).toBe('Bandung');
      expect(engine.branches.get('b-3')?.city).toBe('Bali');
    });

    it('1.2 should return distinct localized stock quantities per branch', () => {
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(50);
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(15);
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(5);
    });

    it('1.3 should create a stock transfer request in PENDING status', () => {
      const res = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 20, unit: 'kg' }],
        requestedBy: 'Bali Store Manager',
        notes: 'Emergency coffee bean restock',
      });

      expect(res.success).toBe(true);
      expect(res.transfer).toBeDefined();
      expect(res.transfer?.status).toBe('PENDING');
      expect(res.transfer?.transferNumber).toContain('TRF-');
      expect(res.transfer?.items[0].quantity).toBe(20);
    });

    it('1.4 should transition transfer from PENDING to APPROVED by Admin', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-milk', quantity: 10, unit: 'liter' }],
        requestedBy: 'Bandung Lead',
      });

      const res = engine.approveTransfer(transfer!.id, 'admin-owner', 'admin');
      expect(res.success).toBe(true);
      expect(engine.transfers.get(transfer!.id)?.status).toBe('APPROVED');
      expect(engine.transfers.get(transfer!.id)?.approvedBy).toBe('admin-owner');
    });

    it('1.5 should transition transfer from APPROVED to IN_TRANSIT', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-milk', quantity: 10, unit: 'liter' }],
        requestedBy: 'Bandung Lead',
      });
      engine.approveTransfer(transfer!.id, 'admin-owner', 'admin');

      const shipRes = engine.shipTransfer(transfer!.id);
      expect(shipRes.success).toBe(true);
      expect(engine.transfers.get(transfer!.id)?.status).toBe('IN_TRANSIT');
      expect(engine.transfers.get(transfer!.id)?.shippedAt).toBeDefined();
    });

    it('1.6 should transition transfer to COMPLETED and atomically update branch stocks', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 20, unit: 'kg' }],
        requestedBy: 'Bali Manager',
      });

      engine.approveTransfer(transfer!.id, 'admin-owner', 'admin');
      engine.shipTransfer(transfer!.id);
      const completeRes = engine.completeTransfer(transfer!.id, 'bali-receiver');

      expect(completeRes.success).toBe(true);
      expect(engine.transfers.get(transfer!.id)?.status).toBe('COMPLETED');
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(30); // 50 - 20 = 30
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(25); // 5 + 20 = 25
    });

    it('1.7 should append stock mutation ledger records for both branches', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-syrup', quantity: 10, unit: 'liter' }],
        requestedBy: 'Bandung Manager',
      });

      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      engine.completeTransfer(transfer!.id, 'bandung-cashier');

      const sourceMut = engine.mutations.find(
        (m) => m.branchId === 'b-1' && m.mutationType === 'TRANSFER_OUT'
      );
      expect(sourceMut).toBeDefined();
      expect(sourceMut?.quantityChange).toBe(-10);
      expect(sourceMut?.stockBefore).toBe(40);
      expect(sourceMut?.stockAfter).toBe(30);

      const destMut = engine.mutations.find(
        (m) => m.branchId === 'b-2' && m.mutationType === 'TRANSFER_IN'
      );
      expect(destMut).toBeDefined();
      expect(destMut?.quantityChange).toBe(10);
      expect(destMut?.stockBefore).toBe(10);
      expect(destMut?.stockAfter).toBe(20);
    });

    it('1.8 should support RESTOCK mutation logging with supplier notes', () => {
      const res = engine.recordRestock('b-1', 'inv-coffee', 25, 'warehouse-mgr', 'INV-SUPPLIER-881');
      expect(res.success).toBe(true);
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(75); // 50 + 25

      const mut = engine.mutations.find((m) => m.mutationType === 'RESTOCK');
      expect(mut).toBeDefined();
      expect(mut?.quantityChange).toBe(25);
      expect(mut?.notes).toContain('INV-SUPPLIER-881');
    });

    it('1.9 should support REJECTED transition from PENDING with reason', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Bandung',
      });

      const rejRes = engine.rejectTransfer(transfer!.id, 'admin', 'Rejected: Insufficient transport capacity');
      expect(rejRes.success).toBe(true);
      expect(engine.transfers.get(transfer!.id)?.status).toBe('REJECTED');
      expect(engine.transfers.get(transfer!.id)?.notes).toContain('Insufficient transport');
    });
  });

  // ==========================================
  // TIER 2: BOUNDARY & ERROR CONDITIONS
  // ==========================================
  describe('Tier 2: Boundary, Error & Validation Edge Cases', () => {
    it('2.1 should reject transfer request when requested quantity exceeds available stock', () => {
      const res = engine.createTransfer({
        sourceBranchId: 'b-3',
        destBranchId: 'b-1',
        items: [{ itemId: 'inv-coffee', quantity: 50, unit: 'kg' }],
        requestedBy: 'Jakarta Manager',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Insufficient stock');
    });

    it('2.2 should reject self-transfer when source and destination are the same', () => {
      const res = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-1',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Self Tester',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Self-transfer is forbidden');
    });

    it('2.3 should reject transfer with non-existent source branch', () => {
      const res = engine.createTransfer({
        sourceBranchId: 'b-999',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Tester',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('does not exist');
    });

    it('2.4 should reject transfer with empty items list', () => {
      const res = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [],
        requestedBy: 'Tester',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('must contain at least one item');
    });

    it('2.5 should reject transfer with zero or negative item quantity', () => {
      const resZero = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 0, unit: 'kg' }],
        requestedBy: 'Tester',
      });
      expect(resZero.success).toBe(false);

      const resNegative = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: -5, unit: 'kg' }],
        requestedBy: 'Tester',
      });
      expect(resNegative.success).toBe(false);
    });

    it('2.6 should reject approval attempt by non-admin role (e.g. cashier)', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Kasir',
      });

      const res = engine.approveTransfer(transfer!.id, 'usr-cashier', 'cashier');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized. Only Admin role can approve');
    });

    it('2.7 should reject invalid state progression (e.g. completing transfer without shipping)', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Lead',
      });

      const res = engine.completeTransfer(transfer!.id, 'receiver');
      expect(res.success).toBe(false);
      expect(res.error).toContain("Cannot complete transfer in status 'PENDING'");
    });

    it('2.8 should allow cancellation of PENDING transfer without mutating stock balances', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Lead',
      });

      const cancelRes = engine.cancelTransfer(transfer!.id, 'admin');
      expect(cancelRes.success).toBe(true);
      expect(engine.transfers.get(transfer!.id)?.status).toBe('CANCELLED');

      expect(engine.getStock('b-1', 'inv-coffee')).toBe(50);
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(15);
    });

    it('2.9 should reject cancellation of already COMPLETED transfer', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Lead',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      engine.completeTransfer(transfer!.id, 'receiver');

      const cancelRes = engine.cancelTransfer(transfer!.id, 'admin');
      expect(cancelRes.success).toBe(false);
      expect(cancelRes.error).toContain('Cannot cancel transfer already in status');
    });

    it('2.10 should reject manual stock override with negative value', () => {
      const res = engine.manualStockOverride('b-1', 'inv-coffee', -10, 'admin', 'Wrong count');
      expect(res.success).toBe(false);
      expect(res.error).toContain('cannot be negative');
    });
  });

  // ==========================================
  // TIER 3: MULTI-ITEM ATOMIC TRANSACTIONS
  // ==========================================
  describe('Tier 3: Multi-Item Atomic Transactions & Invariants', () => {
    it('3.1 should atomically transfer multiple raw materials in a single transfer', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [
          { itemId: 'inv-coffee', quantity: 15, unit: 'kg' },
          { itemId: 'inv-milk', quantity: 20, unit: 'liter' },
          { itemId: 'inv-syrup', quantity: 10, unit: 'liter' },
        ],
        requestedBy: 'Bandung Multi-Restock',
      });

      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      const res = engine.completeTransfer(transfer!.id, 'bandung-team');
      expect(res.success).toBe(true);

      // Jakarta balances
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(35); // 50 - 15
      expect(engine.getStock('b-1', 'inv-milk')).toBe(80);   // 100 - 20
      expect(engine.getStock('b-1', 'inv-syrup')).toBe(30);  // 40 - 10

      // Bandung balances
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(30); // 15 + 15
      expect(engine.getStock('b-2', 'inv-milk')).toBe(50);   // 30 + 20
      expect(engine.getStock('b-2', 'inv-syrup')).toBe(20);  // 10 + 10

      expect(engine.mutations.length).toBe(6);
    });

    it('3.2 should rollback entire multi-item transfer if one item fails stock invariant', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [
          { itemId: 'inv-coffee', quantity: 10, unit: 'kg' },
          { itemId: 'inv-syrup', quantity: 5, unit: 'liter' },
        ],
        requestedBy: 'Bali Lead',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);

      engine.setStock('b-1', 'inv-syrup', 2);

      const completeRes = engine.completeTransfer(transfer!.id, 'bali-receiver');
      expect(completeRes.success).toBe(false);
      expect(completeRes.error).toContain('Atomic transaction failed');

      expect(engine.getStock('b-1', 'inv-coffee')).toBe(50);
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(5);
    });

    it('3.3 should record manual stock override in ledger with reason and actor', () => {
      const res = engine.manualStockOverride(
        'b-2',
        'inv-milk',
        45,
        'admin-audit',
        'Physical stock count discrepancy (+15L)'
      );

      expect(res.success).toBe(true);
      expect(engine.getStock('b-2', 'inv-milk')).toBe(45);

      const mut = engine.mutations.find((m) => m.mutationType === 'MANUAL_OVERRIDE');
      expect(mut).toBeDefined();
      expect(mut?.stockBefore).toBe(30);
      expect(mut?.stockAfter).toBe(45);
      expect(mut?.quantityChange).toBe(15);
      expect(mut?.notes).toContain('Physical stock count');
    });

    it('3.4 should support 100% exact depletion transfer (transfer all available stock)', () => {
      // Bali has 5kg coffee
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-3',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Bandung Manager',
      });

      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      const res = engine.completeTransfer(transfer!.id, 'bandung-receiver');

      expect(res.success).toBe(true);
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(0); // Exact 0
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(20); // 15 + 5
    });
  });

  // ==========================================
  // TIER 4: REAL-WORLD & ADVERSARIAL WORKLOADS
  // ==========================================
  describe('Tier 4: Real-World Supply Chain & Adversarial Stress', () => {
    it('4.1 should handle emergency Jakarta to Bali stock route under high demand', () => {
      const reqRes = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 25, unit: 'kg' }],
        requestedBy: 'Bali General Manager',
        notes: 'High demand weekend rush expected',
      });
      expect(reqRes.success).toBe(true);
      const transferId = reqRes.transfer!.id;

      engine.approveTransfer(transferId, 'hq-director', 'admin');
      engine.shipTransfer(transferId);
      const completeRes = engine.completeTransfer(transferId, 'bali-inventory-officer');
      expect(completeRes.success).toBe(true);

      expect(engine.getStock('b-1', 'inv-coffee')).toBe(25);
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(30);
    });

    it('4.2 should maintain floating point stock precision without precision drift', () => {
      engine.setStock('b-1', 'inv-coffee', 12.75);
      engine.setStock('b-2', 'inv-coffee', 3.25);

      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 2.5, unit: 'kg' }],
        requestedBy: 'Precision Tester',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      engine.completeTransfer(transfer!.id, 'tester');

      expect(engine.getStock('b-1', 'inv-coffee')).toBeCloseTo(10.25, 5);
      expect(engine.getStock('b-2', 'inv-coffee')).toBeCloseTo(5.75, 5);
    });

    it('4.3 should prevent double-completion attack on a single transfer record', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Lead',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);

      const first = engine.completeTransfer(transfer!.id, 'receiver');
      expect(first.success).toBe(true);

      const second = engine.completeTransfer(transfer!.id, 'receiver');
      expect(second.success).toBe(false);
      expect(second.error).toContain("Cannot complete transfer in status 'COMPLETED'");

      expect(engine.getStock('b-1', 'inv-coffee')).toBe(40);
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(25);
    });

    it('4.4 should handle circular multi-branch rebalance workflow (Jakarta -> Bandung -> Bali -> Jakarta)', () => {
      // 1. Jakarta sends 10kg Coffee to Bandung
      const t1 = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Logistics 1',
      }).transfer!;
      engine.approveTransfer(t1.id, 'admin', 'admin');
      engine.shipTransfer(t1.id);
      engine.completeTransfer(t1.id, 'rec-1');

      // 2. Bandung sends 5kg Coffee to Bali
      const t2 = engine.createTransfer({
        sourceBranchId: 'b-2',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
        requestedBy: 'Logistics 2',
      }).transfer!;
      engine.approveTransfer(t2.id, 'admin', 'admin');
      engine.shipTransfer(t2.id);
      engine.completeTransfer(t2.id, 'rec-2');

      // 3. Bali sends 2kg Coffee back to Jakarta
      const t3 = engine.createTransfer({
        sourceBranchId: 'b-3',
        destBranchId: 'b-1',
        items: [{ itemId: 'inv-coffee', quantity: 2, unit: 'kg' }],
        requestedBy: 'Logistics 3',
      }).transfer!;
      engine.approveTransfer(t3.id, 'admin', 'admin');
      engine.shipTransfer(t3.id);
      engine.completeTransfer(t3.id, 'rec-3');

      // Total network stock must remain exactly 50 + 15 + 5 = 70kg
      const totalStock =
        engine.getStock('b-1', 'inv-coffee') +
        engine.getStock('b-2', 'inv-coffee') +
        engine.getStock('b-3', 'inv-coffee');
      expect(totalStock).toBe(70);
    });
  });
});
