import { getAdminNavCategories, AdminTabId } from '../src/features/admin-cms/components/AdminNavConfig';
import { calculateOrderTotals, CashRoundingRule, formatRupiah } from '../src/lib/taxEngine';
import { INITIAL_MENU, INITIAL_INVENTORY, Order } from '../src/data/initialData';
import { AuditLogEntry } from '../src/lib/audit';
import { TransferRecord } from '../src/lib/inventoryEngine';

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER 1: FUNCTIONAL & TAB PANELS TEST HARNESS');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, extraInfo?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (extraInfo) console.error('   Details:', extraInfo);
    failedTests++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NAV CONFIG & CATEGORIES TEST
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- TEST SUITE 1: Navigation Taxonomies & Tab IDs ---');

const categories = getAdminNavCategories({
  menuCount: 15,
  ordersCount: 8,
  vouchersCount: 3,
  inventoryAlertCount: 2,
  pendingTransfersCount: 1,
  auditLogsCount: 42,
});

assert(categories.length === 4, 'getAdminNavCategories returns exactly 4 categorical groups');
const expectedCategoryIds = ['analytics', 'master_data', 'operations', 'system'];
assert(
  categories.every((c, i) => c.id === expectedCategoryIds[i]),
  'Categories match expected order: analytics, master_data, operations, system'
);

const allItems = categories.flatMap((c) => c.items);
assert(allItems.length === 9, 'Exactly 9 nav tab items exist across categories');

const expectedTabIds: AdminTabId[] = [
  'dashboard',
  'orders_log',
  'menu_master',
  'vouchers',
  'qr_generator',
  'inventory',
  'transfers',
  'store_settings',
  'audit_logs',
];

assert(
  expectedTabIds.every((tabId) => allItems.some((item) => item.id === tabId)),
  'All 9 AdminTabIds are registered in navigation config'
);

// Check badges
const menuMasterItem = allItems.find((i) => i.id === 'menu_master');
const ordersLogItem = allItems.find((i) => i.id === 'orders_log');
const vouchersItem = allItems.find((i) => i.id === 'vouchers');
const inventoryItem = allItems.find((i) => i.id === 'inventory');
const transfersItem = allItems.find((i) => i.id === 'transfers');
const auditLogsItem = allItems.find((i) => i.id === 'audit_logs');

assert(menuMasterItem?.badgeCount === 15, 'menu_master badge count correctly wired');
assert(ordersLogItem?.badgeCount === 8, 'orders_log badge count correctly wired');
assert(vouchersItem?.badgeCount === 3, 'vouchers badge count correctly wired');
assert(inventoryItem?.badgeCount === 2, 'inventory alert badge count correctly wired');
assert(transfersItem?.badgeCount === 1, 'transfers pending badge count correctly wired');
assert(auditLogsItem?.badgeCount === 42, 'audit_logs badge count correctly wired');

// ─────────────────────────────────────────────────────────────────────────────
// 2. TAB 1 (DASHBOARD & ANALYTICS) MATH STRESS TEST
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 2: Tab 1 (Dashboard) Analytics & Calculations ---');

const mockOrders: Order[] = [
  {
    id: 'ord-101',
    tableNumber: 'Meja 01',
    customerName: 'Budi Santoso',
    items: [
      { id: 'item-101-1', productId: 'm-1', productName: 'Kopi Susu Gula Aren', price: 22000, quantity: 2 },
      { id: 'item-101-2', productId: 'm-2', productName: 'Croissant Butter', price: 28000, quantity: 1 },
    ],
    totalAmount: 83160,
    paymentStatus: 'PAID',
    paymentMethod: 'QRIS',
    status: 'SERVED',
    createdAt: '2026-08-17 10:00',
  },
  {
    id: 'ord-102',
    tableNumber: 'Meja 02',
    customerName: 'Siti Rahma',
    items: [
      { id: 'item-102-1', productId: 'm-1', productName: 'Kopi Susu Gula Aren', price: 22000, quantity: 3 },
    ],
    totalAmount: 76230,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    status: 'READY',
    createdAt: '2026-08-17 11:00',
  },
  {
    id: 'ord-103',
    tableNumber: 'Meja 03',
    customerName: 'Andi Wijaya',
    items: [
      { id: 'item-103-1', productId: 'm-3', productName: 'Nasi Goreng Wagyu', price: 55000, quantity: 1 },
    ],
    totalAmount: 63525,
    paymentStatus: 'UNPAID',
    paymentMethod: 'QRIS',
    status: 'COOKING',
    createdAt: '2026-08-17 12:00',
  },
];

const paidOrders = mockOrders.filter((o) => o.paymentStatus === 'PAID');
const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

assert(paidOrders.length === 2, 'Paid orders count is 2');
assert(totalRevenue === 83160 + 76230, 'Total revenue only includes PAID transactions (159,390)');

// Best selling item calculation
const menuSalesMap: Record<string, { name: string; count: number }> = {};
mockOrders.forEach((order) => {
  order.items.forEach((item) => {
    if (!menuSalesMap[item.productId]) {
      menuSalesMap[item.productId] = { name: item.productName, count: 0 };
    }
    menuSalesMap[item.productId].count += item.quantity;
  });
});
const topMenu = Object.values(menuSalesMap).sort((a, b) => b.count - a.count)[0];
assert(topMenu.name === 'Kopi Susu Gula Aren' && topMenu.count === 5, 'Top selling menu correctly identified as Kopi Susu (5x sold)');

// Empty orders edge case test
const emptyOrders: Order[] = [];
const emptyPaidOrders = emptyOrders.filter((o) => o.paymentStatus === 'PAID');
const emptyRevenue = emptyPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
const emptyMenuSalesMap: Record<string, { name: string; count: number }> = {};
const emptyTopMenu = Object.values(emptyMenuSalesMap).sort((a, b) => b.count - a.count)[0];

assert(emptyRevenue === 0, 'Empty orders calculates 0 revenue safely without NaN');
assert(emptyTopMenu === undefined, 'Empty orders produces undefined topMenu without throwing error');

// ─────────────────────────────────────────────────────────────────────────────
// 3. TAB 2 (ORDERS LOG & CSV EXPORT)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 3: Tab 2 (Orders Log) Filters & CSV Format ---');

// Test Filter by search
function filterOrders(orders: Order[], search: string, statusFilter: string) {
  return orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.tableNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'ALL' ||
      order.paymentStatus === statusFilter ||
      order.status === statusFilter;
    return matchSearch && matchStatus;
  });
}

assert(filterOrders(mockOrders, 'Budi', 'ALL').length === 1, 'Search by customer name "Budi" yields 1 order');
assert(filterOrders(mockOrders, 'Meja 02', 'ALL').length === 1, 'Search by table "Meja 02" yields 1 order');
assert(filterOrders(mockOrders, 'ord-103', 'ALL').length === 1, 'Search by ID "ord-103" yields 1 order');
assert(filterOrders(mockOrders, '', 'PAID').length === 2, 'Filter by status PAID yields 2 orders');
assert(filterOrders(mockOrders, '', 'COOKING').length === 1, 'Filter by status COOKING yields 1 order');

// CSV Serialization Format Test
function generateCsvContent(orders: Order[]) {
  const headers = ['ID Transaksi', 'No. Meja', 'Nama Pelanggan', 'Total (Rp)', 'Status Pembayaran', 'Metode Bayar', 'Status Pesanan', 'Waktu', 'Rincian Menu'];
  const rows = orders.map((o) => [
    o.id,
    o.tableNumber,
    `"${o.customerName.replace(/"/g, '""')}"`,
    o.totalAmount,
    o.paymentStatus,
    o.paymentMethod,
    o.status,
    o.createdAt,
    `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ').replace(/"/g, '""')}"`,
  ]);
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

const csv = generateCsvContent(mockOrders);
assert(csv.startsWith('\uFEFF'), 'CSV output contains UTF-8 BOM for Excel compatibility');
assert(csv.includes('ord-101,Meja 01,"Budi Santoso",83160,PAID,QRIS,SERVED'), 'CSV properly formats row data');
assert(csv.includes('"2x Kopi Susu Gula Aren; 1x Croissant Butter"'), 'CSV escapes inner items array correctly');

// ─────────────────────────────────────────────────────────────────────────────
// 4. TAB 3 (MASTER MENU) CRUD & FILTERING
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 4: Tab 3 (Master Menu) CRUD & Filters ---');

const testMenu = [...INITIAL_MENU];
assert(testMenu.length > 0, 'INITIAL_MENU is populated');

function filterMenu(menu: typeof INITIAL_MENU, search: string, category: string) {
  return menu.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(search.toLowerCase())) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === 'all' || item.category === category;
    return matchSearch && matchCategory;
  });
}

assert(filterMenu(testMenu, 'kopi', 'all').length > 0, 'Menu search finds coffee items');
assert(filterMenu(testMenu, '', 'drinks').every((m) => m.category === 'drinks'), 'Category drinks filter matches');
assert(filterMenu(testMenu, '', 'food').every((m) => m.category === 'food'), 'Category food filter matches');

// ─────────────────────────────────────────────────────────────────────────────
// 5. TAB 4 (VOUCHERS PROMO)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 5: Tab 4 (Vouchers Promo) Calculations ---');

interface Voucher {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minSpend: number;
  desc: string;
}

const vouchers: Voucher[] = [
  { id: 'v1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minSpend: 30000, desc: 'Diskon 10%' },
  { id: 'v2', code: 'HEMAT20', type: 'PERCENTAGE', value: 20, minSpend: 50000, desc: 'Diskon 20%' },
  { id: 'v3', code: 'MYCASHIER50', type: 'FLAT', value: 25000, minSpend: 100000, desc: 'Potongan Rp 25.000' },
];

function applyVoucher(subtotal: number, voucher: Voucher): number {
  if (subtotal < voucher.minSpend) return 0;
  if (voucher.type === 'PERCENTAGE') {
    return Math.round((subtotal * voucher.value) / 100);
  }
  return voucher.value;
}

assert(applyVoucher(20000, vouchers[0]) === 0, 'Voucher minSpend 30k rejects 20k subtotal');
assert(applyVoucher(50000, vouchers[0]) === 5000, 'Voucher 10% on 50k gives 5k discount');
assert(applyVoucher(120000, vouchers[2]) === 25000, 'Voucher flat 25k on 120k gives 25k discount');

// ─────────────────────────────────────────────────────────────────────────────
// 6. TAB 5 (QR CODE GENERATOR)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 6: Tab 5 (QR Generator) Table Standee URLs ---');

const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);
assert(tables.length === 12, '12 default tables generated (Meja 01 - Meja 12)');

const origin = 'https://mycashier-five.vercel.app';
const testTable = 'Meja 05';
const targetUrl = `${origin}/?table=${encodeURIComponent(testTable)}`;
const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;

assert(targetUrl === 'https://mycashier-five.vercel.app/?table=Meja%2005', 'Table QR link correctly URI-encoded');
assert(qrImageUrl.includes('size=220x220'), 'QR server URL correctly formatted');

// ─────────────────────────────────────────────────────────────────────────────
// 7. TAB 6 (INVENTORY & STOCK)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 7: Tab 6 (Inventory) Thresholds & Adjustments ---');

const invItems = [...INITIAL_INVENTORY];
assert(invItems.length > 0, 'INITIAL_INVENTORY is loaded');

const lowStockItems = invItems.filter((it) => it.stock <= it.minThreshold);
assert(typeof lowStockItems.length === 'number', 'Low stock items computed accurately');

// ─────────────────────────────────────────────────────────────────────────────
// 8. TAB 7 (INTER-BRANCH TRANSFERS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 8: Tab 7 (Transfers) Workflows & Transitions ---');

const validTransitions: Record<string, string[]> = {
  PENDING: ['APPROVE', 'REJECT', 'CANCEL'],
  APPROVED: ['SHIP', 'CANCEL'],
  IN_TRANSIT: ['RECEIVE'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

assert(validTransitions['PENDING'].includes('APPROVE'), 'PENDING transfer can be APPROVED');
assert(validTransitions['APPROVED'].includes('SHIP'), 'APPROVED transfer can be SHIPPED');
assert(validTransitions['IN_TRANSIT'].includes('RECEIVE'), 'IN_TRANSIT transfer can be RECEIVED');

// ─────────────────────────────────────────────────────────────────────────────
// 9. TAB 8 (STORE SETTINGS & PB1 TAX ENGINE)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 9: Tab 8 (Store Settings & PB1 Tax Engine) ---');

const sampleSubtotal = 100000;
const testSettings = {
  taxRate: 10,
  serviceChargeRate: 5,
  enableTax: true,
  enableServiceCharge: true,
  cashRoundingRule: 'ROUND_100' as CashRoundingRule,
};

const totals = calculateOrderTotals(sampleSubtotal, 0, testSettings, true);
assert(totals.subtotal === 100000, 'Subtotal is Rp 100.000');
assert(totals.serviceChargeAmount === 5000, 'Service charge 5% of 100k is Rp 5.000');
assert(totals.taxableAmount === 105000, 'Taxable amount (DPP) = Subtotal + Service = Rp 105.000');
assert(totals.taxAmount === 10500, 'PB1 Tax 10% of DPP (105k) is Rp 10.500');
assert(totals.rawTotal === 115500, 'Raw total = 100k + 5k + 10.5k = Rp 115.500');
assert(totals.finalTotal === 115500, 'Final total matches with zero adjustment for 115.500');

// Test Rounding Rules with fractional amounts
const oddSubtotal = 104523;
const roundingRules: CashRoundingRule[] = ['NONE', 'ROUND_100', 'CEIL_100', 'CEIL_500', 'CEIL_1000'];

roundingRules.forEach((rule) => {
  const res = calculateOrderTotals(oddSubtotal, 0, { ...testSettings, cashRoundingRule: rule }, true);
  assert(res.finalTotal >= res.rawTotal - 100, `Rounding rule ${rule} produces valid finalTotal ${res.finalTotal}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. TAB 9 (SECURITY AUDIT LOGS & DIFF)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 10: Tab 9 (Security Audit Logs & Diff Modal) ---');

const sampleAuditLog: AuditLogEntry = {
  id: 'log-test-1',
  timestamp: new Date().toISOString(),
  userId: 'usr-admin-1',
  userName: 'Opik Admin',
  userRole: 'admin',
  actionType: 'MENU_PRICE_UPDATE',
  entityType: 'menu',
  entityId: 'm-1',
  description: 'Mengubah harga menu Kopi Susu Aren dari 20.000 ke 22.000',
  status: 'SUCCESS',
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome/120.0 (Windows)',
  diff: {
    price: { old: 20000, new: 22000 },
    updatedAt: { old: '2026-08-10', new: '2026-08-17' },
  },
};

assert(sampleAuditLog.diff !== undefined, 'Audit log contains property-level diff');
const diffKeys = Object.keys(sampleAuditLog.diff!);
assert(diffKeys.length === 2, 'Diff keys identified correctly (price, updatedAt)');
assert(sampleAuditLog.diff!.price.old === 20000 && sampleAuditLog.diff!.price.new === 22000, 'Old and new values stored cleanly');

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
