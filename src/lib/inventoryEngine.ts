/**
 * MyCashier Enterprise Multi-Branch Inventory & Inter-Branch Transfer State Machine Engine
 * Handles branch-level inventory stocks, transfer workflows, atomic quantity adjustments, and mutation ledger.
 */

export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type MutationType = 'TRANSFER_OUT' | 'TRANSFER_IN' | 'MANUAL_OVERRIDE' | 'RESTOCK' | 'SALE_DEDUCTION' | 'WASTE_ADJUSTMENT';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  isActive?: boolean;
}

export interface InventoryMasterItem {
  id: string;
  name: string;
  nameEn?: string;
  category: 'raw_material' | 'packaging' | 'beverage_base';
  unit: 'kg' | 'liter' | 'pack' | 'pcs' | 'gram';
  minThreshold: number;
  costPerUnit: number;
}

export interface BranchStock {
  id: string; // branchId:itemId
  branchId: string;
  itemId: string;
  quantity: number;
  minThreshold: number;
  lastRestocked?: string;
  updatedAt?: string;
}

export interface TransferRequestItem {
  itemId: string;
  quantity: number;
  unit: string;
  itemName?: string;
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
  updatedAt?: string;
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

export class InventoryTransferEngine {
  public branches: Map<string, Branch> = new Map();
  public masterItems: Map<string, InventoryMasterItem> = new Map();
  public stocks: Map<string, BranchStock> = new Map(); // key: `${branchId}:${itemId}`
  public transfers: Map<string, TransferRecord> = new Map();
  public mutations: StockMutationRecord[] = [];

  constructor() {
    this.seedDefaults();
  }

  /**
   * Helper to normalize branch IDs so both 'b-1' and 'branch-jkt' can be resolved.
   */
  public normalizeBranchId(branchId: string): string {
    if (!branchId) return 'b-1';
    const clean = branchId.trim().toLowerCase();
    if (clean === 'branch-jkt' || clean === 'b-1' || clean === 'jakarta') return 'b-1';
    if (clean === 'branch-bdg' || clean === 'b-2' || clean === 'bandung') return 'b-2';
    if (clean === 'branch-bali' || clean === 'b-3' || clean === 'bali' || clean === 'dps') return 'b-3';
    return branchId;
  }

  /**
   * Helper to normalize item IDs (e.g. 'inv-coffee' <-> 'inv-1')
   */
  public normalizeItemId(itemId: string): string {
    if (!itemId) return 'inv-coffee';
    const clean = itemId.trim().toLowerCase();
    if (clean === 'inv-1' || clean === 'inv-coffee' || clean === 'coffee') return 'inv-coffee';
    if (clean === 'inv-2' || clean === 'inv-milk' || clean === 'milk') return 'inv-milk';
    if (clean === 'inv-3' || clean === 'inv-syrup' || clean === 'syrup') return 'inv-syrup';
    if (clean === 'inv-4' || clean === 'inv-wagyu' || clean === 'wagyu') return 'inv-wagyu';
    if (clean === 'inv-5' || clean === 'inv-matcha' || clean === 'matcha') return 'inv-matcha';
    if (clean === 'inv-6' || clean === 'inv-cup' || clean === 'cup') return 'inv-cup';
    return itemId;
  }

  public seedDefaults() {
    this.branches.clear();
    this.masterItems.clear();
    this.stocks.clear();
    this.transfers.clear();
    this.mutations = [];

    // Seed 3 Branches (supporting both b-* and branch-* IDs)
    const branchList: Branch[] = [
      {
        id: 'b-1',
        code: 'JKT-01',
        name: 'Cabang Jakarta Pusat',
        city: 'Jakarta',
        address: 'Grand Indonesia Mall, Lt. 3',
        phone: '021-23580001',
        isActive: true,
      },
      {
        id: 'b-2',
        code: 'BDG-01',
        name: 'Cabang Bandung Dago',
        city: 'Bandung',
        address: 'Jl. Ir. H. Juanda No. 88, Dago',
        phone: '022-4200002',
        isActive: true,
      },
      {
        id: 'b-3',
        code: 'DPS-01',
        name: 'Cabang Bali Seminyak',
        city: 'Bali',
        address: 'Jl. Kayu Aya No. 12, Seminyak',
        phone: '0361-730003',
        isActive: true,
      },
    ];

    for (const b of branchList) {
      this.branches.set(b.id, b);
    }
    // Also register aliases
    this.branches.set('branch-jkt', { ...branchList[0], id: 'branch-jkt' });
    this.branches.set('branch-bdg', { ...branchList[1], id: 'branch-bdg' });
    this.branches.set('branch-bali', { ...branchList[2], id: 'branch-bali' });

    // Seed Master Inventory Items
    const items: InventoryMasterItem[] = [
      {
        id: 'inv-coffee',
        name: 'Biji Kopi House Blend Arabica',
        nameEn: 'Arabica Coffee Beans House Blend',
        category: 'raw_material',
        unit: 'kg',
        minThreshold: 5.0,
        costPerUnit: 180000,
      },
      {
        id: 'inv-milk',
        name: 'Susu Fresh Milk Pasteurisasi',
        nameEn: 'Pasteurized Fresh Whole Milk',
        category: 'beverage_base',
        unit: 'liter',
        minThreshold: 10.0,
        costPerUnit: 22000,
      },
      {
        id: 'inv-syrup',
        name: 'Sirup Gula Aren Organik',
        nameEn: 'Organic Palm Sugar Syrup',
        category: 'beverage_base',
        unit: 'liter',
        minThreshold: 5.0,
        costPerUnit: 45000,
      },
      {
        id: 'inv-wagyu',
        name: 'Daging Sapi Wagyu Slide SL',
        nameEn: 'Sliced Wagyu Beef Grade A',
        category: 'raw_material',
        unit: 'kg',
        minThreshold: 5.0,
        costPerUnit: 250000,
      },
      {
        id: 'inv-matcha',
        name: 'Uji Matcha Powder Impor',
        nameEn: 'Imported Uji Matcha Powder',
        category: 'raw_material',
        unit: 'kg',
        minThreshold: 1.0,
        costPerUnit: 420000,
      },
      {
        id: 'inv-cup',
        name: 'Paper Cup Takeaway 12oz',
        nameEn: 'Takeaway Paper Cups 12oz',
        category: 'packaging',
        unit: 'pcs',
        minThreshold: 100,
        costPerUnit: 800,
      },
    ];

    for (const item of items) {
      this.masterItems.set(item.id, item);
      this.masterItems.set(item.id.replace('inv-', 'inv-1'), item); // alias if needed
    }

    // Seed initial stock quantities per branch
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

    // Item 4: Wagyu Beef (kg) -> Jakarta: 25kg, Bandung: 10kg, Bali: 8kg
    this.setStock('b-1', 'inv-wagyu', 25, 5);
    this.setStock('b-2', 'inv-wagyu', 10, 5);
    this.setStock('b-3', 'inv-wagyu', 8, 5);

    // Item 5: Matcha (kg) -> Jakarta: 5kg, Bandung: 2kg, Bali: 1kg
    this.setStock('b-1', 'inv-matcha', 5, 1);
    this.setStock('b-2', 'inv-matcha', 2, 1);
    this.setStock('b-3', 'inv-matcha', 1, 1);

    // Item 6: Paper Cup (pcs) -> Jakarta: 500pcs, Bandung: 200pcs, Bali: 150pcs
    this.setStock('b-1', 'inv-cup', 500, 100);
    this.setStock('b-2', 'inv-cup', 200, 100);
    this.setStock('b-3', 'inv-cup', 150, 100);
  }

  public getStock(branchId: string, itemId: string): number {
    const key = `${branchId}:${itemId}`;
    if (this.stocks.has(key)) {
      return this.stocks.get(key)!.quantity;
    }
    // Fallback check with normalized IDs
    const normB = this.normalizeBranchId(branchId);
    const normI = this.normalizeItemId(itemId);
    const altKey = `${normB}:${normI}`;
    return this.stocks.get(altKey)?.quantity ?? 0;
  }

  public setStock(branchId: string, itemId: string, quantity: number, minThreshold: number = 5) {
    const key = `${branchId}:${itemId}`;
    const now = new Date().toISOString();
    const stockObj: BranchStock = {
      id: key,
      branchId,
      itemId,
      quantity,
      minThreshold,
      lastRestocked: now,
      updatedAt: now,
    };
    this.stocks.set(key, stockObj);

    // Mirror to normalized alias if branchId or itemId has alias
    const normB = this.normalizeBranchId(branchId);
    const normI = this.normalizeItemId(itemId);
    if (normB !== branchId || normI !== itemId) {
      const altKey = `${normB}:${normI}`;
      this.stocks.set(altKey, { ...stockObj, id: altKey, branchId: normB, itemId: normI });
    }
  }

  public getAllStocks(branchId?: string): BranchStock[] {
    const result: BranchStock[] = [];
    const targetBranch = branchId ? this.normalizeBranchId(branchId) : null;

    for (const [key, stock] of this.stocks.entries()) {
      if (!targetBranch || this.normalizeBranchId(stock.branchId) === targetBranch) {
        // Exclude duplicate alias keys from return array
        if (stock.branchId.startsWith('b-') || !branchId) {
          result.push(stock);
        }
      }
    }
    return result;
  }

  public getBranches(): Branch[] {
    return [
      this.branches.get('b-1')!,
      this.branches.get('b-2')!,
      this.branches.get('b-3')!,
    ].filter(Boolean);
  }

  /**
   * Create Inter-Branch Transfer Request
   */
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

    if (sourceBranchId === destBranchId || this.normalizeBranchId(sourceBranchId) === this.normalizeBranchId(destBranchId)) {
      return { success: false, error: 'Self-transfer is forbidden. Source and Destination branches must differ.' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Transfer request must contain at least one item.' };
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return {
          success: false,
          error: `Invalid quantity '${item.quantity}' for item '${item.itemId}'. Must be greater than 0.`,
        };
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
      updatedAt: new Date().toISOString(),
    };

    this.transfers.set(transferId, record);
    return { success: true, transfer: record };
  }

  /**
   * Approve Transfer (Admin only)
   */
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
    transfer.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Ship Transfer (Moves to IN_TRANSIT)
   */
  public shipTransfer(transferId: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'APPROVED') {
      return { success: false, error: `Cannot ship transfer in status '${transfer.status}'. Must be 'APPROVED'.` };
    }

    transfer.status = 'IN_TRANSIT';
    transfer.shippedAt = new Date().toISOString();
    transfer.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Complete Transfer (Atomic deduction at source and increment at destination)
   */
  public completeTransfer(transferId: string, receivedBy: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'IN_TRANSIT') {
      return { success: false, error: `Cannot complete transfer in status '${transfer.status}'. Must be 'IN_TRANSIT'.` };
    }

    // ATOMIC VALIDATION: verify all source items have sufficient stock
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

    // Atomic Deduct & Increment
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
    transfer.updatedAt = now;
    return { success: true };
  }

  /**
   * Cancel Transfer
   */
  public cancelTransfer(transferId: string, cancelledBy: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      return { success: false, error: `Cannot cancel transfer already in status '${transfer.status}'.` };
    }

    transfer.status = 'CANCELLED';
    transfer.cancelledAt = new Date().toISOString();
    transfer.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Reject Transfer (From PENDING only)
   */
  public rejectTransfer(transferId: string, rejectedBy: string, reason: string): { success: boolean; error?: string } {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return { success: false, error: 'Transfer record not found.' };

    if (transfer.status !== 'PENDING') {
      return { success: false, error: `Cannot reject transfer in status '${transfer.status}'. Must be 'PENDING'.` };
    }

    transfer.status = 'REJECTED';
    transfer.notes = reason;
    transfer.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Manual Stock Override Ledger Adjustment
   */
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

  /**
   * Restock Mutation Entry
   */
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

  /**
   * Query Transfers with optional filters
   */
  public getTransfers(filters?: {
    sourceBranchId?: string;
    destBranchId?: string;
    status?: TransferStatus;
  }): TransferRecord[] {
    let list = Array.from(this.transfers.values());

    if (filters?.sourceBranchId) {
      const norm = this.normalizeBranchId(filters.sourceBranchId);
      list = list.filter((t) => this.normalizeBranchId(t.sourceBranchId) === norm);
    }
    if (filters?.destBranchId) {
      const norm = this.normalizeBranchId(filters.destBranchId);
      list = list.filter((t) => this.normalizeBranchId(t.destBranchId) === norm);
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }

    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Query Mutations Ledger
   */
  public getMutations(branchId?: string, itemId?: string): StockMutationRecord[] {
    let list = [...this.mutations];
    if (branchId) {
      const norm = this.normalizeBranchId(branchId);
      list = list.filter((m) => this.normalizeBranchId(m.branchId) === norm);
    }
    if (itemId) {
      const norm = this.normalizeItemId(itemId);
      list = list.filter((m) => this.normalizeItemId(m.itemId) === norm);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Global Singleton Instance
export const inventoryEngine = new InventoryTransferEngine();
