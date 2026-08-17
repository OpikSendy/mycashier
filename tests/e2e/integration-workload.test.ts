import { describe, it, expect, beforeEach } from 'bun:test';
import { signJwt, verifyJwtEdge, type AuthSession } from '../../src/lib/jwt';
import { verifyApiAuth, hasRolePermission, DEFAULT_ROLE_PINS } from '../../src/lib/auth';
import { calculateOrderTotals, calculateEqualSplit, formatRupiah } from '../../src/lib/taxEngine';
import { generateThermalReceiptAscii } from '../../src/lib/receipt';
import { InventoryTransferEngine } from './inventory-transfers.test';
import { AuditLogRepository } from './security-audit-logs.test';
import { Order } from '../../src/data/initialData';
import { NextRequest } from 'next/server';

describe('Integration Workload Test Suite (tests/e2e/integration-workload.test.ts)', () => {
  let inventoryEngine: InventoryTransferEngine;
  let auditRepo: AuditLogRepository;

  beforeEach(() => {
    inventoryEngine = new InventoryTransferEngine();
    auditRepo = new AuditLogRepository();
  });

  // Helper for Mock NextRequest
  function createReq(url: string, token?: string, method: string = 'GET', body?: any) {
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (body) headers.set('Content-Type', 'application/json');
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ==========================================
  // SCENARIO 1: CASHIER WALK-IN WITH TAX & CASH ROUNDING
  // ==========================================
  it('Scenario 1: Cashier Walk-in Order with Dynamic Tax & Cash Rounding', async () => {
    // 1. Admin logs in with PIN 8888 and configures store settings
    const adminSession: AuthSession = {
      userId: 'usr-admin-1',
      name: 'Store Owner',
      role: 'admin',
      branchId: 'b-1',
    };
    const adminToken = await signJwt(adminSession);
    const adminVerified = await verifyJwtEdge(adminToken);
    expect(adminVerified?.role).toBe('admin');

    const storeSettings = {
      taxRate: 10,
      serviceChargeRate: 5,
      enableTax: true,
      enableServiceCharge: true,
      cashRoundingRule: 'CEIL_500' as const,
    };

    auditRepo.logEvent({
      userId: adminSession.userId,
      userName: adminSession.name,
      userRole: adminSession.role,
      actionType: 'STORE_SETTINGS_UPDATE',
      entityType: 'store_settings',
      description: 'Configured PB1 Tax 10%, Service Charge 5%, and CEIL_500 rounding',
      newPayload: storeSettings,
      status: 'SUCCESS',
    });

    // 2. Cashier logs in with PIN 1234
    const cashierSession: AuthSession = {
      userId: 'usr-cashier-1',
      name: 'Kasir Budi',
      role: 'cashier',
      branchId: 'b-1',
    };
    const cashierToken = await signJwt(cashierSession);
    const cashierVerified = await verifyJwtEdge(cashierToken);
    expect(cashierVerified?.role).toBe('cashier');

    // 3. Cashier creates order: 2x Nasi Goreng (25.000 ea) + 2x Es Teh (5.000 ea) = Subtotal Rp 60.000
    const items = [
      { id: 'item-1', productId: 'p-1', productName: 'Nasi Goreng', price: 25000, quantity: 2 },
      { id: 'item-2', productId: 'p-2', productName: 'Es Teh Manis', price: 5000, quantity: 2 },
    ];
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    expect(subtotal).toBe(60000);

    // 4. Tax engine computes totals with cash payment
    const totals = calculateOrderTotals(subtotal, 0, storeSettings, true);
    // Subtotal: 60.000
    // Service 5%: 3.000
    // Taxable: 63.000
    // Tax 10%: 6.300
    // Raw Total: 69.300
    // Rounding CEIL_500: 69.500 (+200)
    expect(totals.serviceChargeAmount).toBe(3000);
    expect(totals.taxAmount).toBe(6300);
    expect(totals.rawTotal).toBe(69300);
    expect(totals.roundingAdjustment).toBe(200);
    expect(totals.finalTotal).toBe(69500);

    // 5. Thermal receipt is generated
    const orderRecord: Order = {
      id: 'ORD-POS-2026-001',
      tableNumber: 'Table 01',
      customerName: 'Customer Walk-in',
      items,
      totalAmount: totals.finalTotal,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      createdAt: '2026-08-17 12:00:00',
    };

    const receipt = generateThermalReceiptAscii(orderRecord, {
      paperWidth: '58mm',
      storeName: 'MyCashier Central',
      settings: storeSettings,
    });

    expect(receipt).toContain('Nasi Goreng');
    expect(receipt).toContain('Service Charge (5%):');
    expect(receipt).toContain('Pajak Resto PB1 (10%):');
    expect(receipt).toContain('Pembulatan Kasir:');
    expect(receipt).toContain('Rp 69.500');

    // 6. Audit log records order creation and payment
    auditRepo.logEvent({
      userId: cashierSession.userId,
      userName: cashierSession.name,
      userRole: cashierSession.role,
      actionType: 'ORDER_CHECKOUT_CASH',
      entityType: 'orders',
      entityId: orderRecord.id,
      description: `Completed cash order ${orderRecord.id} total ${formatRupiah(totals.finalTotal)}`,
      newPayload: { subtotal, total: totals.finalTotal, rounding: totals.roundingAdjustment },
      status: 'SUCCESS',
    });

    const logs = auditRepo.queryLogs({ entityType: 'orders' });
    expect(logs.total).toBe(1);
    expect(logs.logs[0].entityId).toBe(orderRecord.id);
  });

  // ==========================================
  // SCENARIO 2: EMERGENCY INTER-BRANCH TRANSFER
  // ==========================================
  it('Scenario 2: Emergency Stock Transfer from Jakarta to Bali Branch & Verification', async () => {
    // Jakarta starts with 50kg Espresso Beans, Bali with 5kg
    expect(inventoryEngine.getStock('b-1', 'inv-coffee')).toBe(50);
    expect(inventoryEngine.getStock('b-3', 'inv-coffee')).toBe(5);

    // 1. Bali Manager requests 20kg transfer
    const reqRes = inventoryEngine.createTransfer({
      sourceBranchId: 'b-1',
      destBranchId: 'b-3',
      items: [{ itemId: 'inv-coffee', quantity: 20, unit: 'kg' }],
      requestedBy: 'Bali Store Supervisor',
      notes: 'Urgent stock for weekend festival',
    });
    expect(reqRes.success).toBe(true);
    const transferId = reqRes.transfer!.id;

    auditRepo.logEvent({
      userId: 'usr-bali-sup',
      userName: 'Bali Supervisor',
      userRole: 'cashier',
      actionType: 'STOCK_TRANSFER_INITIATE',
      entityType: 'transfer',
      entityId: reqRes.transfer!.transferNumber,
      description: 'Requested 20kg Coffee Transfer from Jakarta to Bali',
      status: 'SUCCESS',
    });

    // 2. Admin logs in and approves transfer
    const approveRes = inventoryEngine.approveTransfer(transferId, 'usr-admin-1', 'admin');
    expect(approveRes.success).toBe(true);

    auditRepo.logEvent({
      userId: 'usr-admin-1',
      userName: 'HQ Director',
      userRole: 'admin',
      actionType: 'STOCK_TRANSFER_APPROVE',
      entityType: 'transfer',
      entityId: reqRes.transfer!.transferNumber,
      description: 'Approved transfer request',
      status: 'SUCCESS',
    });

    // 3. Shipment in transit
    inventoryEngine.shipTransfer(transferId);

    // 4. Bali branch receives and marks COMPLETED
    const completeRes = inventoryEngine.completeTransfer(transferId, 'bali-receiver');
    expect(completeRes.success).toBe(true);

    // 5. Verification of atomic balances & mutation ledger
    expect(inventoryEngine.getStock('b-1', 'inv-coffee')).toBe(30); // 50 - 20
    expect(inventoryEngine.getStock('b-3', 'inv-coffee')).toBe(25); // 5 + 20

    const sourceLedger = inventoryEngine.mutations.find(
      (m) => m.branchId === 'b-1' && m.mutationType === 'TRANSFER_OUT'
    );
    expect(sourceLedger?.quantityChange).toBe(-20);

    const destLedger = inventoryEngine.mutations.find(
      (m) => m.branchId === 'b-3' && m.mutationType === 'TRANSFER_IN'
    );
    expect(destLedger?.quantityChange).toBe(20);
  });

  // ==========================================
  // SCENARIO 3: ADMIN MENU PRICE MUTATION & AUDIT
  // ==========================================
  it('Scenario 3: Admin Menu Price Mutation & Audit Trail Verification', async () => {
    // 1. Admin mutates menu price of Wagyu Burger from 85.000 to 95.000
    const oldMenu = { id: 'prod-wagyu', name: 'Signature Wagyu Burger', price: 85000 };
    const newMenu = { id: 'prod-wagyu', name: 'Signature Wagyu Burger', price: 95000 };

    const auditEntry = auditRepo.logEvent({
      userId: 'usr-admin-1',
      userName: 'Executive Chef / Owner',
      userRole: 'admin',
      actionType: 'MENU_PRICE_UPDATE',
      entityType: 'menu',
      entityId: oldMenu.id,
      ipAddress: '192.168.1.10',
      description: `Updated price of ${oldMenu.name} from Rp ${oldMenu.price.toLocaleString()} to Rp ${newMenu.price.toLocaleString()}`,
      oldPayload: oldMenu,
      newPayload: newMenu,
      status: 'SUCCESS',
    });

    // 2. Diff engine verifies exact change
    expect(auditEntry.diff?.price.old).toBe(85000);
    expect(auditEntry.diff?.price.new).toBe(95000);

    // 3. Admin searches audit logs for "Wagyu"
    const searchRes = auditRepo.queryLogs({ search: 'Wagyu' });
    expect(searchRes.total).toBe(1);
    expect(searchRes.logs[0].description).toContain('Wagyu Burger');

    // 4. Cashier creates order with new price
    const orderTotals = calculateOrderTotals(newMenu.price, 0, {
      taxRate: 10,
      serviceChargeRate: 5,
    });
    // Subtotal 95.000, Service 5% (4.750), Tax 10% (9.975) -> Raw: 109.725
    expect(orderTotals.subtotal).toBe(95000);
    expect(orderTotals.serviceChargeAmount).toBe(4750);
    expect(orderTotals.taxAmount).toBe(9975);
    expect(orderTotals.finalTotal).toBe(109725);
  });

  // ==========================================
  // SCENARIO 4: TABLE SPLIT-BILL INTEGRATION
  // ==========================================
  it('Scenario 4: Table Split-Bill with Itemized Tax & Service Charge', async () => {
    // 4 Distinct Items totaling Rp 200.000
    // Group A (Guest 1): 2x Steak (60.000 ea) = 120.000
    // Group B (Guest 2): 2x Pasta (40.000 ea) = 80.000
    const settings = {
      taxRate: 10,
      serviceChargeRate: 5,
      enableTax: true,
      enableServiceCharge: true,
    };

    // Single combined bill calculation:
    const combinedTotals = calculateOrderTotals(200000, 0, settings);
    // Subtotal: 200.000, Service 5%: 10.000, Taxable: 210.000, Tax 10%: 21.000 -> Total: 231.000
    expect(combinedTotals.serviceChargeAmount).toBe(10000);
    expect(combinedTotals.taxAmount).toBe(21000);
    expect(combinedTotals.finalTotal).toBe(231000);

    // Itemized Sub-Bill A:
    const billATotals = calculateOrderTotals(120000, 0, settings);
    // Subtotal 120.000, Service 5%: 6.000, Taxable: 126.000, Tax 10%: 12.600 -> Total: 138.600
    expect(billATotals.serviceChargeAmount).toBe(6000);
    expect(billATotals.taxAmount).toBe(12600);
    expect(billATotals.finalTotal).toBe(138600);

    // Itemized Sub-Bill B:
    const billBTotals = calculateOrderTotals(80000, 0, settings);
    // Subtotal 80.000, Service 5%: 4.000, Taxable: 84.000, Tax 10%: 8.400 -> Total: 92.400
    expect(billBTotals.serviceChargeAmount).toBe(4000);
    expect(billBTotals.taxAmount).toBe(8400);
    expect(billBTotals.finalTotal).toBe(92400);

    // Invariant Verification:
    expect(billATotals.subtotal + billBTotals.subtotal).toBe(combinedTotals.subtotal);
    expect(billATotals.serviceChargeAmount + billBTotals.serviceChargeAmount).toBe(combinedTotals.serviceChargeAmount);
    expect(billATotals.taxAmount + billBTotals.taxAmount).toBe(combinedTotals.taxAmount);
    expect(billATotals.finalTotal + billBTotals.finalTotal).toBe(combinedTotals.finalTotal);
  });

  // ==========================================
  // SCENARIO 5: UNAUTHORIZED MUTATION ATTEMPT BLOCKED & LOGGED
  // ==========================================
  it('Scenario 5: Unauthorized API Mutation Attempt Blocked & Logged', async () => {
    // 1. Unauthenticated request to protected store settings endpoint
    const unauthReq = createReq('http://localhost:3000/api/store-settings', undefined, 'PUT', {
      taxRate: 0,
    });
    const authCheck1 = await verifyApiAuth(unauthReq, ['admin']);
    expect('errorResponse' in authCheck1).toBe(true);
    if ('errorResponse' in authCheck1) {
      expect(authCheck1.errorResponse.status).toBe(401);
    }

    // 2. Cashier session attempting Admin action
    const cashierSession: AuthSession = {
      userId: 'usr-cashier-bad',
      name: 'Cashier Attempting Admin',
      role: 'cashier',
    };
    const cashierToken = await signJwt(cashierSession);
    const cashierReq = createReq('http://localhost:3000/api/store-settings', cashierToken, 'PUT');
    const authCheck2 = await verifyApiAuth(cashierReq, ['admin']);
    expect('errorResponse' in authCheck2).toBe(true);
    if ('errorResponse' in authCheck2) {
      expect(authCheck2.errorResponse.status).toBe(403);
    }

    // 3. Log security failure event in audit trail
    auditRepo.logEvent({
      userId: cashierSession.userId,
      userName: cashierSession.name,
      userRole: cashierSession.role,
      actionType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      entityType: 'store_settings',
      ipAddress: '192.168.1.100',
      description: 'Cashier role attempted to access Admin store settings endpoint',
      status: 'FAILURE',
    });

    const failureLogs = auditRepo.queryLogs({ status: 'FAILURE' });
    expect(failureLogs.total).toBe(1);
    expect(failureLogs.logs[0].actionType).toBe('UNAUTHORIZED_ACCESS_ATTEMPT');
  });
});
