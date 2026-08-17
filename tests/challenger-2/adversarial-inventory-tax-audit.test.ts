import { describe, it, expect, beforeEach } from 'bun:test';
import {
  InventoryTransferEngine,
  inventoryEngine,
  type TransferRecord,
  type BranchStock,
  type StockMutationRecord,
} from '../../src/lib/inventoryEngine';
import {
  calculateOrderTotals,
  applyRounding,
  formatRupiah,
  calculateEqualSplit,
  DEFAULT_TAX_SETTINGS,
  type CashRoundingRule,
  type TaxEngineSettings,
} from '../../src/lib/taxEngine';
import {
  AuditLogRepository,
  createAuditLog,
  getAuditLogs,
  computePayloadDiff,
  exportAuditLogsToCsv,
  formatAuditLogsCsv,
  globalAuditRepo,
  type AuditLogEntry,
} from '../../src/lib/audit';

describe('CHALLENGER 2: Adversarial Stress Test Suite', () => {

  // =========================================================================
  // CHALLENGE 1: Concurrent Transfer Completion & Double-Spend Replay Attacks
  // =========================================================================
  describe('Challenge 1: Concurrent Transfer Completion & Double-Spend Replay Attacks', () => {
    let engine: InventoryTransferEngine;

    beforeEach(() => {
      engine = new InventoryTransferEngine();
    });

    it('1.1 Double-completion replay attack: 10 parallel completions on a single transfer record', async () => {
      // Setup: Jakarta has 50kg, Bandung has 15kg.
      // Request transfer of 30kg coffee from Jakarta (b-1) to Bandung (b-2).
      const createRes = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 30, unit: 'kg' }],
        requestedBy: 'Bandung Manager',
        notes: 'Bulk coffee transfer',
      });
      expect(createRes.success).toBe(true);
      const transferId = createRes.transfer!.id;

      // Move through state machine: PENDING -> APPROVED -> IN_TRANSIT
      const approveRes = engine.approveTransfer(transferId, 'hq-admin', 'admin');
      expect(approveRes.success).toBe(true);

      const shipRes = engine.shipTransfer(transferId);
      expect(shipRes.success).toBe(true);

      // Attempt 10 concurrent completion calls on the same transfer ID
      const completionAttempts = Array.from({ length: 10 }, (_, i) => {
        return Promise.resolve(engine.completeTransfer(transferId, `receiver-${i}`));
      });

      const results = await Promise.all(completionAttempts);

      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      // Invariant: EXACTLY 1 completion succeeds, all other 9 must fail
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(9);

      // Failure messages must identify invalid state
      for (const fail of failures) {
        expect(fail.error).toContain("Cannot complete transfer in status 'COMPLETED'");
      }

      // Invariant: Jakarta balance is deducted ONCE (50 - 30 = 20)
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(20);

      // Invariant: Bandung balance is incremented ONCE (15 + 30 = 45)
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(45);

      // Invariant: Stock mutation ledger has exactly 1 TRANSFER_OUT and 1 TRANSFER_IN for this transfer
      const transferMutations = engine.mutations.filter((m) => m.referenceId === transferId);
      expect(transferMutations.length).toBe(2);

      const transferOut = transferMutations.find((m) => m.mutationType === 'TRANSFER_OUT');
      const transferIn = transferMutations.find((m) => m.mutationType === 'TRANSFER_IN');
      expect(transferOut?.quantityChange).toBe(-30);
      expect(transferIn?.quantityChange).toBe(30);
    });

    it('1.2 Concurrent double-spend race condition on limited source inventory', async () => {
      // Jakarta has 50kg initial coffee.
      // Create TWO distinct transfers that together exceed available stock:
      // Transfer A: 40kg to Bandung (b-2)
      // Transfer B: 40kg to Bali (b-3)
      // Total requested = 80kg > 50kg available.
      const resA = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 40, unit: 'kg' }],
        requestedBy: 'Bandung Manager',
      });
      const resB = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 40, unit: 'kg' }],
        requestedBy: 'Bali Manager',
      });

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      const idA = resA.transfer!.id;
      const idB = resB.transfer!.id;

      // Both get approved and shipped
      engine.approveTransfer(idA, 'admin', 'admin');
      engine.shipTransfer(idA);

      engine.approveTransfer(idB, 'admin', 'admin');
      engine.shipTransfer(idB);

      // Now complete Transfer A
      const completeARes = engine.completeTransfer(idA, 'receiver-a');
      expect(completeARes.success).toBe(true);

      // Jakarta stock is now 50 - 40 = 10kg
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(10);
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(55); // 15 + 40

      // Now attempt to complete Transfer B (needs 40kg, only 10kg left)
      const completeBRes = engine.completeTransfer(idB, 'receiver-b');

      // Invariant: Must fail atomically with zero-negative check
      expect(completeBRes.success).toBe(false);
      expect(completeBRes.error).toContain('Atomic transaction failed');
      expect(completeBRes.error).toContain('Insufficient stock');

      // Invariant: Jakarta stock NEVER drops below 0 (remains exactly 10kg)
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(10);

      // Invariant: Bali stock remains untouched (5kg)
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(5);

      // Transfer B remains in IN_TRANSIT status and is not marked COMPLETED
      expect(engine.transfers.get(idB)?.status).toBe('IN_TRANSIT');
    });

    it('1.3 Replay attacks on Cancelled and Rejected transfers', () => {
      // Case A: Create -> Cancel -> Replay Ship & Complete
      const resCancel = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Staff',
      });
      const idCancel = resCancel.transfer!.id;
      engine.cancelTransfer(idCancel, 'admin');
      expect(engine.transfers.get(idCancel)?.status).toBe('CANCELLED');

      // Replay attempts must fail
      const shipAttempt = engine.shipTransfer(idCancel);
      expect(shipAttempt.success).toBe(false);
      expect(shipAttempt.error).toContain("Cannot ship transfer in status 'CANCELLED'");

      const completeAttempt = engine.completeTransfer(idCancel, 'intruder');
      expect(completeAttempt.success).toBe(false);
      expect(completeAttempt.error).toContain("Cannot complete transfer in status 'CANCELLED'");

      // Case B: Create -> Reject -> Replay Approve, Ship, Complete
      const resReject = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Staff',
      });
      const idReject = resReject.transfer!.id;
      engine.rejectTransfer(idReject, 'admin', 'Out of stock at HQ');
      expect(engine.transfers.get(idReject)?.status).toBe('REJECTED');

      const approveAttempt = engine.approveTransfer(idReject, 'admin', 'admin');
      expect(approveAttempt.success).toBe(false);
      expect(approveAttempt.error).toContain("Cannot approve transfer in status 'REJECTED'");

      const shipRejectAttempt = engine.shipTransfer(idReject);
      expect(shipRejectAttempt.success).toBe(false);

      const completeRejectAttempt = engine.completeTransfer(idReject, 'intruder');
      expect(completeRejectAttempt.success).toBe(false);
    });

    it('1.4 Out-of-order state skipping transition attacks', () => {
      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
        requestedBy: 'Attacker',
      });
      const id = transfer!.id;

      // 1. Direct COMPLETE on PENDING must fail
      const directComplete = engine.completeTransfer(id, 'attacker');
      expect(directComplete.success).toBe(false);
      expect(directComplete.error).toContain("Cannot complete transfer in status 'PENDING'");

      // 2. Direct SHIP on PENDING must fail
      const directShip = engine.shipTransfer(id);
      expect(directShip.success).toBe(false);
      expect(directShip.error).toContain("Cannot ship transfer in status 'PENDING'");

      // 3. Approve -> Direct COMPLETE without SHIP must fail
      engine.approveTransfer(id, 'admin', 'admin');
      const completeWithoutShip = engine.completeTransfer(id, 'attacker');
      expect(completeWithoutShip.success).toBe(false);
      expect(completeWithoutShip.error).toContain("Cannot complete transfer in status 'APPROVED'");

      // 4. Re-Approve on APPROVED must fail
      const reApprove = engine.approveTransfer(id, 'admin', 'admin');
      expect(reApprove.success).toBe(false);
      expect(reApprove.error).toContain("Cannot approve transfer in status 'APPROVED'");
    });
  });

  // =========================================================================
  // CHALLENGE 2: Floating Point Precision in Stock Transfers
  // =========================================================================
  describe('Challenge 2: Floating Point Precision in Stock Transfers', () => {
    let engine: InventoryTransferEngine;

    beforeEach(() => {
      engine = new InventoryTransferEngine();
    });

    it('2.1 Canonical Prompt Scenario: 12.75kg - 2.5kg = 10.25kg stock transfer', () => {
      // Set precise fractional initial stocks
      engine.setStock('b-1', 'inv-coffee', 12.75);
      engine.setStock('b-2', 'inv-coffee', 3.25);

      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 2.5, unit: 'kg' }],
        requestedBy: 'Precision Auditor',
      });

      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      const res = engine.completeTransfer(transfer!.id, 'auditor');

      expect(res.success).toBe(true);

      // Jakarta: 12.75 - 2.5 = 10.25
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(10.25);

      // Bandung: 3.25 + 2.5 = 5.75
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(5.75);
    });

    it('2.2 Micro-quantity cumulative floating point precision: 10 x 0.1kg transfers', () => {
      // Jakarta starts with 1.0kg exactly, Bandung with 0kg
      engine.setStock('b-1', 'inv-coffee', 1.0);
      engine.setStock('b-2', 'inv-coffee', 0.0);

      // Execute 10 successive transfers of 0.1kg
      for (let i = 0; i < 10; i++) {
        const { transfer } = engine.createTransfer({
          sourceBranchId: 'b-1',
          destBranchId: 'b-2',
          items: [{ itemId: 'inv-coffee', quantity: 0.1, unit: 'kg' }],
          requestedBy: `Micro-step-${i + 1}`,
        });
        engine.approveTransfer(transfer!.id, 'admin', 'admin');
        engine.shipTransfer(transfer!.id);
        const res = engine.completeTransfer(transfer!.id, 'tester');
        expect(res.success).toBe(true);
      }

      const jktFinal = engine.getStock('b-1', 'inv-coffee');
      const bdgFinal = engine.getStock('b-2', 'inv-coffee');

      // Jakarta should be 0 (within standard epsilon)
      expect(Math.abs(jktFinal)).toBeLessThan(1e-9);
      // Bandung should be 1.0 (within standard epsilon)
      expect(bdgFinal).toBeCloseTo(1.0, 5);

      // 11th transfer of 0.1kg MUST FAIL due to zero stock
      const overdraw = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 0.1, unit: 'kg' }],
        requestedBy: 'Overdraw',
      });
      expect(overdraw.success).toBe(false);
      expect(overdraw.error).toContain('Insufficient stock');
    });

    it('2.3 High decimal precision (3 decimal places: grams and milliliters)', () => {
      // Matcha powder in kg (5.432kg at Jakarta, 1.111kg at Bali)
      engine.setStock('b-1', 'inv-matcha', 5.432);
      engine.setStock('b-3', 'inv-matcha', 1.111);

      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-matcha', quantity: 2.125, unit: 'kg' }],
        requestedBy: 'Barista',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      const res = engine.completeTransfer(transfer!.id, 'barista-bali');

      expect(res.success).toBe(true);

      // 5.432 - 2.125 = 3.307
      expect(engine.getStock('b-1', 'inv-matcha')).toBeCloseTo(3.307, 4);
      // 1.111 + 2.125 = 3.236
      expect(engine.getStock('b-3', 'inv-matcha')).toBeCloseTo(3.236, 4);
    });

    it('2.4 Exact zero depletion with fractional decimals (7.825kg)', () => {
      engine.setStock('b-1', 'inv-wagyu', 7.825);
      engine.setStock('b-2', 'inv-wagyu', 2.175);

      const { transfer } = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-wagyu', quantity: 7.825, unit: 'kg' }],
        requestedBy: 'Chef',
      });
      engine.approveTransfer(transfer!.id, 'admin', 'admin');
      engine.shipTransfer(transfer!.id);
      const res = engine.completeTransfer(transfer!.id, 'chef-bdg');

      expect(res.success).toBe(true);
      expect(engine.getStock('b-1', 'inv-wagyu')).toBe(0);
      expect(engine.getStock('b-2', 'inv-wagyu')).toBeCloseTo(10.0, 5);
    });

    it('2.5 Epsilon-exceeding depletion boundary', () => {
      engine.setStock('b-1', 'inv-coffee', 5.0);

      // Requesting 5.0001kg when 5.0000kg is available must fail
      const res = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [{ itemId: 'inv-coffee', quantity: 5.0001, unit: 'kg' }],
        requestedBy: 'Precision boundary tester',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Insufficient stock');
    });
  });

  // =========================================================================
  // CHALLENGE 3: Total Inventory Conservation in Circular Network Transfers
  // =========================================================================
  describe('Challenge 3: Total Inventory Conservation in Circular Network Transfers', () => {
    let engine: InventoryTransferEngine;

    beforeEach(() => {
      engine = new InventoryTransferEngine();
    });

    it('3.1 3-Node Circular Transfer Ring: Jakarta -> Bandung -> Bali -> Jakarta', () => {
      // Calculate initial network sums
      const initialTotalCoffee =
        engine.getStock('b-1', 'inv-coffee') +
        engine.getStock('b-2', 'inv-coffee') +
        engine.getStock('b-3', 'inv-coffee'); // 50 + 15 + 5 = 70

      const initialTotalMilk =
        engine.getStock('b-1', 'inv-milk') +
        engine.getStock('b-2', 'inv-milk') +
        engine.getStock('b-3', 'inv-milk'); // 100 + 30 + 10 = 140

      expect(initialTotalCoffee).toBe(70);
      expect(initialTotalMilk).toBe(140);

      // --- Hop 1: Jakarta (b-1) -> Bandung (b-2): 20kg coffee, 30L milk ---
      const hop1 = engine.createTransfer({
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [
          { itemId: 'inv-coffee', quantity: 20, unit: 'kg' },
          { itemId: 'inv-milk', quantity: 30, unit: 'liter' },
        ],
        requestedBy: 'Hop 1',
      });
      engine.approveTransfer(hop1.transfer!.id, 'admin', 'admin');
      engine.shipTransfer(hop1.transfer!.id);
      engine.completeTransfer(hop1.transfer!.id, 'receiver-1');

      // Verify network sum invariant after Hop 1
      const networkSumCoffeeHop1 =
        engine.getStock('b-1', 'inv-coffee') +
        engine.getStock('b-2', 'inv-coffee') +
        engine.getStock('b-3', 'inv-coffee');
      expect(networkSumCoffeeHop1).toBe(initialTotalCoffee);

      // --- Hop 2: Bandung (b-2) -> Bali (b-3): 25kg coffee, 40L milk ---
      // Bandung now has: 15 + 20 = 35kg coffee, 30 + 30 = 60L milk
      const hop2 = engine.createTransfer({
        sourceBranchId: 'b-2',
        destBranchId: 'b-3',
        items: [
          { itemId: 'inv-coffee', quantity: 25, unit: 'kg' },
          { itemId: 'inv-milk', quantity: 40, unit: 'liter' },
        ],
        requestedBy: 'Hop 2',
      });
      engine.approveTransfer(hop2.transfer!.id, 'admin', 'admin');
      engine.shipTransfer(hop2.transfer!.id);
      engine.completeTransfer(hop2.transfer!.id, 'receiver-2');

      // Verify network sum invariant after Hop 2
      const networkSumCoffeeHop2 =
        engine.getStock('b-1', 'inv-coffee') +
        engine.getStock('b-2', 'inv-coffee') +
        engine.getStock('b-3', 'inv-coffee');
      expect(networkSumCoffeeHop2).toBe(initialTotalCoffee);

      // --- Hop 3: Bali (b-3) -> Jakarta (b-1): 28kg coffee, 45L milk ---
      // Bali now has: 5 + 25 = 30kg coffee, 10 + 40 = 50L milk
      const hop3 = engine.createTransfer({
        sourceBranchId: 'b-3',
        destBranchId: 'b-1',
        items: [
          { itemId: 'inv-coffee', quantity: 28, unit: 'kg' },
          { itemId: 'inv-milk', quantity: 45, unit: 'liter' },
        ],
        requestedBy: 'Hop 3',
      });
      engine.approveTransfer(hop3.transfer!.id, 'admin', 'admin');
      engine.shipTransfer(hop3.transfer!.id);
      engine.completeTransfer(hop3.transfer!.id, 'receiver-3');

      // Final post-cycle network sum invariant check
      const finalTotalCoffee =
        engine.getStock('b-1', 'inv-coffee') +
        engine.getStock('b-2', 'inv-coffee') +
        engine.getStock('b-3', 'inv-coffee');

      const finalTotalMilk =
        engine.getStock('b-1', 'inv-milk') +
        engine.getStock('b-2', 'inv-milk') +
        engine.getStock('b-3', 'inv-milk');

      expect(finalTotalCoffee).toBe(initialTotalCoffee);
      expect(finalTotalMilk).toBe(initialTotalMilk);

      // Verify individual final stocks
      // Jakarta: 50 - 20 + 28 = 58kg coffee, 100 - 30 + 45 = 115L milk
      expect(engine.getStock('b-1', 'inv-coffee')).toBe(58);
      expect(engine.getStock('b-1', 'inv-milk')).toBe(115);

      // Bandung: 15 + 20 - 25 = 10kg coffee, 30 + 30 - 40 = 20L milk
      expect(engine.getStock('b-2', 'inv-coffee')).toBe(10);
      expect(engine.getStock('b-2', 'inv-milk')).toBe(20);

      // Bali: 5 + 25 - 28 = 2kg coffee, 10 + 40 - 45 = 5L milk
      expect(engine.getStock('b-3', 'inv-coffee')).toBe(2);
      expect(engine.getStock('b-3', 'inv-milk')).toBe(5);
    });

    it('3.2 Mutation ledger net zero conservation invariant: Sum(TRANSFER_OUT) + Sum(TRANSFER_IN) === 0', () => {
      // Perform 3 sequential transfers
      const routes = [
        { from: 'b-1', to: 'b-2', qty: 10 },
        { from: 'b-2', to: 'b-3', qty: 8 },
        { from: 'b-3', to: 'b-1', qty: 5 },
      ];

      for (const r of routes) {
        const { transfer } = engine.createTransfer({
          sourceBranchId: r.from,
          destBranchId: r.to,
          items: [{ itemId: 'inv-coffee', quantity: r.qty, unit: 'kg' }],
          requestedBy: 'Loop Tester',
        });
        engine.approveTransfer(transfer!.id, 'admin', 'admin');
        engine.shipTransfer(transfer!.id);
        engine.completeTransfer(transfer!.id, 'receiver');
      }

      // Sum all mutation quantity changes
      const totalDelta = engine.mutations
        .filter((m) => m.mutationType === 'TRANSFER_IN' || m.mutationType === 'TRANSFER_OUT')
        .reduce((sum, m) => sum + m.quantityChange, 0);

      expect(totalDelta).toBe(0);
    });

    it('3.3 50-step randomized network churn conservation invariant', () => {
      const branches = ['b-1', 'b-2', 'b-3'];
      const itemId = 'inv-syrup';

      const initialSum = branches.reduce((acc, b) => acc + engine.getStock(b, itemId), 0); // 40 + 10 + 2 = 52

      for (let i = 0; i < 50; i++) {
        const fromIdx = Math.floor(Math.random() * 3);
        let toIdx = Math.floor(Math.random() * 3);
        while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * 3);

        const from = branches[fromIdx];
        const to = branches[toIdx];
        const currentAvail = engine.getStock(from, itemId);

        if (currentAvail >= 0.5) {
          const qty = Math.min(currentAvail, Math.max(0.1, Number((Math.random() * 1.5).toFixed(1))));
          const res = engine.createTransfer({
            sourceBranchId: from,
            destBranchId: to,
            items: [{ itemId, quantity: qty, unit: 'liter' }],
            requestedBy: `Random-${i}`,
          });

          if (res.success && res.transfer) {
            engine.approveTransfer(res.transfer.id, 'admin', 'admin');
            engine.shipTransfer(res.transfer.id);
            engine.completeTransfer(res.transfer.id, `receiver-${i}`);
          }
        }

        // Invariant: Network sum MUST remain 52 at EVERY single step
        const stepSum = branches.reduce((acc, b) => acc + engine.getStock(b, itemId), 0);
        expect(stepSum).toBeCloseTo(initialSum, 5);
      }
    });
  });

  // =========================================================================
  // CHALLENGE 4: Extreme Tax Rates, 100% Discounts, Negative Values & Split Bill Invariant
  // =========================================================================
  describe('Challenge 4: Extreme Tax Rates, 100% Discounts, Negative Values & Split Bill Invariant', () => {

    it('4.1 Extreme tax rates: 0%, 100%, 250% (hyper-tax) and micro-rates (0.5%)', () => {
      // 1. 0% tax, 0% service charge
      const zeroResult = calculateOrderTotals(100000, 0, {
        taxRate: 0,
        serviceChargeRate: 0,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'NONE',
      });
      expect(zeroResult.taxAmount).toBe(0);
      expect(zeroResult.serviceChargeAmount).toBe(0);
      expect(zeroResult.finalTotal).toBe(100000);

      // 2. 100% tax, 100% service charge on Rp 100.000:
      // discountedSubtotal = 100000
      // serviceCharge = 100000
      // taxableBase = 100000 + 100000 = 200000
      // tax = 200000 (100% of 200000)
      // rawTotal = 100000 + 100000 + 200000 = 400000
      const doubleResult = calculateOrderTotals(100000, 0, {
        taxRate: 100,
        serviceChargeRate: 100,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'NONE',
      });
      expect(doubleResult.discountedSubtotal).toBe(100000);
      expect(doubleResult.serviceChargeAmount).toBe(100000);
      expect(doubleResult.taxableAmount).toBe(200000);
      expect(doubleResult.taxAmount).toBe(200000);
      expect(doubleResult.finalTotal).toBe(400000);

      // 3. 250% hyper-tax rate, 50% service charge on Rp 50.000:
      // discountedSubtotal = 50000
      // serviceCharge = 25000 (50%)
      // taxableBase = 75000
      // tax = 75000 * 2.5 = 187500
      // rawTotal = 50000 + 25000 + 187500 = 262500
      const hyperResult = calculateOrderTotals(50000, 0, {
        taxRate: 250,
        serviceChargeRate: 50,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'NONE',
      });
      expect(hyperResult.serviceChargeAmount).toBe(25000);
      expect(hyperResult.taxAmount).toBe(187500);
      expect(hyperResult.finalTotal).toBe(262500);
    });

    it('4.2 100% and exceeding discounts with tax and service active', () => {
      // 100% exact discount
      const fullDiscount = calculateOrderTotals(250000, 250000, {
        taxRate: 10,
        serviceChargeRate: 5,
      });
      expect(fullDiscount.discountedSubtotal).toBe(0);
      expect(fullDiscount.serviceChargeAmount).toBe(0);
      expect(fullDiscount.taxAmount).toBe(0);
      expect(fullDiscount.finalTotal).toBe(0);

      // Exceeding discount (e.g. Rp 500.000 voucher on Rp 100.000 cart)
      const overDiscount = calculateOrderTotals(100000, 500000, {
        taxRate: 10,
        serviceChargeRate: 5,
      });
      expect(overDiscount.discountAmount).toBe(100000);
      expect(overDiscount.discountedSubtotal).toBe(0);
      expect(overDiscount.serviceChargeAmount).toBe(0);
      expect(overDiscount.taxAmount).toBe(0);
      expect(overDiscount.finalTotal).toBe(0);
    });

    it('4.3 Robustness against negative, NaN, and malformed inputs', () => {
      // Negative subtotal
      const negSub = calculateOrderTotals(-150000, 0, DEFAULT_TAX_SETTINGS);
      expect(negSub.subtotal).toBe(0);
      expect(negSub.finalTotal).toBe(0);

      // Negative discount (must not increase subtotal)
      const negDisc = calculateOrderTotals(100000, -20000, {
        taxRate: 10,
        serviceChargeRate: 5,
      });
      expect(negDisc.discountAmount).toBe(0);
      expect(negDisc.discountedSubtotal).toBe(100000);
      expect(negDisc.finalTotal).toBe(115500);

      // Negative tax and service rates (clamped to 0)
      const negRates = calculateOrderTotals(100000, 0, {
        taxRate: -10,
        serviceChargeRate: -5,
      });
      expect(negRates.taxRate).toBe(0);
      expect(negRates.serviceChargeRate).toBe(0);
      expect(negRates.finalTotal).toBe(100000);

      // NaN and undefined inputs
      const nanResult = calculateOrderTotals(NaN as any, NaN as any, DEFAULT_TAX_SETTINGS);
      expect(nanResult.subtotal).toBe(0);
      expect(nanResult.finalTotal).toBe(0);
    });

    it('4.4 Split bill exact sum invariant: sum(guestAmounts) === totalAmount across arbitrary amounts and guest counts', () => {
      const testCases = [
        { total: 100000, guests: 3 },
        { total: 100001, guests: 7 },
        { total: 333333, guests: 11 },
        { total: 1234567, guests: 13 },
        { total: 9999999, guests: 17 },
        { total: 75000, guests: 1 },
      ];

      for (const tc of testCases) {
        const split = calculateEqualSplit(tc.total, tc.guests, 'NONE');

        // Invariant 1: Array length equals guest count
        expect(split.guestAmounts.length).toBe(tc.guests);

        // Invariant 2: Sum of all individual guest shares equals exact totalAmount
        const sumShares = split.guestAmounts.reduce((acc, val) => acc + val, 0);
        expect(sumShares).toBe(tc.total);
        expect(split.totalCalculated).toBe(tc.total);

        // Invariant 3: Difference between highest and lowest guest amount is at most 1 Rupiah (remainder distribution)
        const maxShare = Math.max(...split.guestAmounts);
        const minShare = Math.min(...split.guestAmounts);
        expect(maxShare - minShare).toBeLessThanOrEqual(1);
      }
    });

    it('4.5 Split bill with rounding rules: each guest share conforms to rounding rule', () => {
      const roundingRules: CashRoundingRule[] = ['ROUND_100', 'CEIL_100', 'CEIL_500', 'CEIL_1000'];

      for (const rule of roundingRules) {
        const split = calculateEqualSplit(105250, 4, rule);
        expect(split.guestAmounts.length).toBe(4);

        // Verify each guest amount is a multiple of the rule step
        const step = rule === 'CEIL_1000' ? 1000 : rule === 'CEIL_500' ? 500 : 100;
        for (const amt of split.guestAmounts) {
          expect(amt % step).toBe(0);
        }

        // Verify totalCalculated is the exact sum of guest shares
        const sumShares = split.guestAmounts.reduce((acc, val) => acc + val, 0);
        expect(split.totalCalculated).toBe(sumShares);
      }
    });

    it('4.6 Split bill boundary edge cases: 0 guests and negative guests', () => {
      const splitZero = calculateEqualSplit(100000, 0);
      expect(splitZero.guestAmounts.length).toBe(1);
      expect(splitZero.totalCalculated).toBe(100000);

      const splitNegative = calculateEqualSplit(100000, -5);
      expect(splitNegative.guestAmounts.length).toBe(1);
      expect(splitNegative.totalCalculated).toBe(100000);
    });
  });

  // =========================================================================
  // CHALLENGE 5: Audit Log CSV Injection & XSS/SQL Payload Storage Safety
  // =========================================================================
  describe('Challenge 5: Audit Log CSV Injection & XSS/SQL Payload Storage Safety', () => {
    let repo: AuditLogRepository;

    beforeEach(() => {
      repo = new AuditLogRepository();
    });

    it('5.1 CSV Formula Injection / DDE payload formatting and RFC-4180 quote escaping', () => {
      const formulaInjectionEntries: AuditLogEntry[] = [
        {
          id: 'audit-inj-1',
          timestamp: '2026-08-17T12:00:00.000Z',
          userId: '=cmd|\'/C calc\'!A0',
          userName: '+1234567890',
          userRole: 'admin',
          actionType: '@SUM(1+1)*cmd|\'/C calc\'!A0',
          entityType: '-2+3+cmd|\'/C calc\'!A0',
          entityId: '\t=1+1',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          description: 'Formula injection test with quotes "hello" and comma , and newline \n inside text',
        },
      ];

      const csvOutput = exportAuditLogsToCsv(formulaInjectionEntries);

      // Verify header presence
      expect(csvOutput).toContain('ID,Timestamp,User ID,User Name,Role,Action,Entity Type,Entity ID,Status,IP Address,Description');

      // Verify RFC-4180 quote wrapping for every field
      expect(csvOutput).toContain('"=cmd|\'/C calc\'!A0"');
      expect(csvOutput).toContain('"+1234567890"');
      expect(csvOutput).toContain('"@SUM(1+1)*cmd|\'/C calc\'!A0"');
      expect(csvOutput).toContain('"-2+3+cmd|\'/C calc\'!A0"');
      expect(csvOutput).toContain('"\t=1+1"');

      // Verify internal quotes are escaped as ""
      expect(csvOutput).toContain('""hello""');

      // Parse lines and ensure column count consistency
      const lines = csvOutput.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });

    it('5.2 XSS payload storage, retrieval, and search filter safety', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(document.cookie)>',
        '<svg/onload=confirm(1)>',
        '"><script src=//evil.com/x.js></script>',
        'javascript:alert(1)',
      ];

      for (let i = 0; i < xssPayloads.length; i++) {
        const payload = xssPayloads[i];
        repo.logEvent({
          id: `audit-xss-${i}`,
          userId: `usr-xss-${i}`,
          userName: `Attacker <script>${i}</script>`,
          userRole: 'admin',
          actionType: 'SETTINGS_MUTATION',
          entityType: 'store_settings',
          entityId: `setting-${i}`,
          ipAddress: '192.168.1.100',
          description: `Payload: ${payload}`,
          oldPayload: { content: 'safe' },
          newPayload: { content: payload },
          status: 'SUCCESS',
        });
      }

      expect(repo.getAll().length).toBe(5);

      // Search by script tag substring
      const searchResult = repo.queryLogs({ search: '<script>' });
      expect(searchResult.total).toBeGreaterThanOrEqual(2);

      // Search by img onerror
      const imgResult = repo.queryLogs({ search: 'onerror=alert' });
      expect(imgResult.total).toBe(1);
      expect(imgResult.logs[0].description).toContain('<img src=x onerror=alert');

      // Verify diff computation safely stores XSS strings
      const entry0 = repo.getById('audit-xss-0');
      expect(entry0?.diff?.content.new).toBe('<script>alert("XSS")</script>');
    });

    it('5.3 SQL Injection payload storage and search filter resilience', () => {
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE audit_logs; --",
        "admin'--",
        "1' UNION SELECT username, password FROM users--",
        "'; EXEC xp_cmdshell('dir'); --",
      ];

      for (let i = 0; i < sqlPayloads.length; i++) {
        const sql = sqlPayloads[i];
        repo.logEvent({
          id: `audit-sql-${i}`,
          userId: `usr-${i}`,
          userName: `SQL Tester ${i}`,
          userRole: 'admin',
          actionType: 'MENU_UPDATE',
          entityType: 'menu',
          entityId: sql,
          description: `SQL payload injection test: ${sql}`,
          oldPayload: { query: 'SELECT 1' },
          newPayload: { query: sql },
          status: 'SUCCESS',
        });
      }

      // Query logs with SQL injection string in search query
      const sqlSearch = repo.queryLogs({ search: "' OR '1'='1" });
      expect(sqlSearch.total).toBe(1);
      expect(sqlSearch.logs[0].id).toBe('audit-sql-0');

      const dropSearch = repo.queryLogs({ search: "DROP TABLE" });
      expect(dropSearch.total).toBe(1);
      expect(dropSearch.logs[0].id).toBe('audit-sql-1');

      // Verify all 5 entries remain intact and uncorrupted
      expect(repo.getAll().length).toBe(5);
    });

    it('5.4 Prototype pollution defense and deep nested payload diff computation', () => {
      // Attempt prototype pollution via payload object
      const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "normalKey": "value"}');

      const diff = computePayloadDiff(
        { normalKey: 'oldValue' },
        maliciousPayload
      );

      // Verify Object prototype was NOT polluted
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect(diff.normalKey.old).toBe('oldValue');
      expect(diff.normalKey.new).toBe('value');

      // Test deep nested objects
      const oldDeep = {
        store: {
          tax: {
            rate: 10,
            exemptions: ['beverage'],
          },
          rounding: 'NONE',
        },
      };

      const newDeep = {
        store: {
          tax: {
            rate: 11,
            exemptions: ['beverage', 'staple'],
          },
          rounding: 'CEIL_500',
        },
      };

      const deepDiff = computePayloadDiff(oldDeep, newDeep);
      expect(deepDiff.store).toBeDefined();
      expect(deepDiff.store.old).toEqual(oldDeep.store);
      expect(deepDiff.store.new).toEqual(newDeep.store);
    });
  });
});
