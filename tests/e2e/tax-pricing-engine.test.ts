import { describe, it, expect } from 'bun:test';
import {
  calculateOrderTotals,
  applyRounding,
  formatRupiah,
  calculateEqualSplit,
  DEFAULT_TAX_SETTINGS,
  type CashRoundingRule,
  type TaxEngineSettings,
} from '../../src/lib/taxEngine';
import { generateThermalReceiptAscii } from '../../src/lib/receipt';
import { Order } from '../../src/data/initialData';

describe('Tax & Pricing Engine Test Suite (tests/e2e/tax-pricing-engine.test.ts)', () => {
  const sampleOrder: Order = {
    id: 'ORD-TEST-1001',
    tableNumber: 'Table 04',
    customerName: 'Budi Santoso',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Nasi Goreng Spesial',
        price: 35000,
        quantity: 2,
        notes: 'Pedas sedang, tanpa timun',
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Es Teh Manis',
        price: 8000,
        quantity: 2,
      },
    ],
    totalAmount: 86000,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    createdAt: '2026-08-17 12:30:00',
  };

  // ==========================================
  // TIER 1: CORE FEATURE COVERAGE
  // ==========================================
  describe('Tier 1: Core Calculation Feature Coverage', () => {
    it('1.1 should calculate standard 10% PB1 tax and 5% service charge on Rp 100.000 subtotal', () => {
      const result = calculateOrderTotals(100000, 0, {
        taxRate: 10,
        serviceChargeRate: 5,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'NONE',
      });

      expect(result.subtotal).toBe(100000);
      expect(result.discountAmount).toBe(0);
      expect(result.discountedSubtotal).toBe(100000);
      expect(result.serviceChargeAmount).toBe(5000);
      expect(result.taxableAmount).toBe(105000);
      expect(result.taxAmount).toBe(10500);
      expect(result.rawTotal).toBe(115500);
      expect(result.roundingAdjustment).toBe(0);
      expect(result.finalTotal).toBe(115500);
    });

    it('1.2 should apply voucher discount before calculating service charge and PB1 tax', () => {
      const result = calculateOrderTotals(100000, 20000, {
        taxRate: 10,
        serviceChargeRate: 5,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'NONE',
      });

      expect(result.subtotal).toBe(100000);
      expect(result.discountAmount).toBe(20000);
      expect(result.discountedSubtotal).toBe(80000);
      expect(result.serviceChargeAmount).toBe(4000);
      expect(result.taxableAmount).toBe(84000);
      expect(result.taxAmount).toBe(8400);
      expect(result.finalTotal).toBe(92400);
    });

    it('1.3 should apply Cash Rounding Rule: NONE', () => {
      const { rounded, adjustment } = applyRounding(92455, 'NONE');
      expect(rounded).toBe(92455);
      expect(adjustment).toBe(0);
    });

    it('1.4 should apply Cash Rounding Rule: ROUND_100', () => {
      expect(applyRounding(92440, 'ROUND_100').rounded).toBe(92400);
      expect(applyRounding(92450, 'ROUND_100').rounded).toBe(92500);
      expect(applyRounding(92480, 'ROUND_100').rounded).toBe(92500);
      expect(applyRounding(92480, 'ROUND_100').adjustment).toBe(20);
    });

    it('1.5 should apply Cash Rounding Rule: CEIL_100', () => {
      expect(applyRounding(92401, 'CEIL_100').rounded).toBe(92500);
      expect(applyRounding(92400, 'CEIL_100').rounded).toBe(92400);
      expect(applyRounding(92401, 'CEIL_100').adjustment).toBe(99);
    });

    it('1.6 should apply Cash Rounding Rule: CEIL_500', () => {
      expect(applyRounding(92100, 'CEIL_500').rounded).toBe(92500);
      expect(applyRounding(92500, 'CEIL_500').rounded).toBe(92500);
      expect(applyRounding(92501, 'CEIL_500').rounded).toBe(93000);
      expect(applyRounding(92100, 'CEIL_500').adjustment).toBe(400);
    });

    it('1.7 should apply Cash Rounding Rule: CEIL_1000', () => {
      expect(applyRounding(92001, 'CEIL_1000').rounded).toBe(93000);
      expect(applyRounding(92000, 'CEIL_1000').rounded).toBe(92000);
      expect(applyRounding(92999, 'CEIL_1000').rounded).toBe(93000);
      expect(applyRounding(92001, 'CEIL_1000').adjustment).toBe(999);
    });

    it('1.8 should apply cash rounding when isCashPayment is true', () => {
      const resultCash = calculateOrderTotals(60000, 0, {
        cashRoundingRule: 'CEIL_500',
      }, true);

      expect(resultCash.rawTotal).toBe(69300);
      expect(resultCash.roundingAdjustment).toBe(200);
      expect(resultCash.finalTotal).toBe(69500);

      const resultNonCash = calculateOrderTotals(60000, 0, {
        cashRoundingRule: 'NONE',
      }, false);
      expect(resultNonCash.finalTotal).toBe(69300);
    });

    it('1.9 should format numbers into Indonesian Rupiah string correctly', () => {
      expect(formatRupiah(100000)).toBe('Rp 100.000');
      expect(formatRupiah(25500)).toBe('Rp 25.500');
      expect(formatRupiah(0)).toBe('Rp 0');
    });

    it('1.10 should calculate Equal Split Bill with remainder distribution', () => {
      const split = calculateEqualSplit(100000, 3, 'NONE');
      expect(split.guestAmounts.length).toBe(3);
      expect(split.totalCalculated).toBe(100000);
      expect(split.guestAmounts[0]).toBe(33334);
      expect(split.guestAmounts[1]).toBe(33333);
      expect(split.guestAmounts[2]).toBe(33333);
    });
  });

  // ==========================================
  // TIER 2: BOUNDARY, EXTREME & CORNER CASES
  // ==========================================
  describe('Tier 2: Boundary, Extreme & Corner Cases', () => {
    it('2.1 should produce 0 tax when enableTax is false', () => {
      const result = calculateOrderTotals(50000, 0, {
        enableTax: false,
        enableServiceCharge: true,
        serviceChargeRate: 5,
      });
      expect(result.taxAmount).toBe(0);
      expect(result.serviceChargeAmount).toBe(2500);
      expect(result.finalTotal).toBe(52500);
    });

    it('2.2 should produce 0 service charge when enableServiceCharge is false', () => {
      const result = calculateOrderTotals(50000, 0, {
        enableTax: true,
        enableServiceCharge: false,
        taxRate: 10,
      });
      expect(result.serviceChargeAmount).toBe(0);
      expect(result.taxableAmount).toBe(50000);
      expect(result.taxAmount).toBe(5000);
      expect(result.finalTotal).toBe(55000);
    });

    it('2.3 should return subtotal when both tax and service charge are disabled', () => {
      const result = calculateOrderTotals(75000, 0, {
        enableTax: false,
        enableServiceCharge: false,
      });
      expect(result.serviceChargeAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.finalTotal).toBe(75000);
    });

    it('2.4 should handle 100% discount with zero final total', () => {
      const result = calculateOrderTotals(50000, 50000, DEFAULT_TAX_SETTINGS);
      expect(result.discountedSubtotal).toBe(0);
      expect(result.serviceChargeAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it('2.5 should clamp discount exceeding subtotal at subtotal', () => {
      const result = calculateOrderTotals(40000, 999999, DEFAULT_TAX_SETTINGS);
      expect(result.discountAmount).toBe(40000);
      expect(result.discountedSubtotal).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it('2.6 should return 0 for empty cart / zero subtotal', () => {
      const result = calculateOrderTotals(0, 0, DEFAULT_TAX_SETTINGS);
      expect(result.subtotal).toBe(0);
      expect(result.serviceChargeAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it('2.7 should handle negative subtotal by clamping safely to 0', () => {
      const result = calculateOrderTotals(-5000, 0, DEFAULT_TAX_SETTINGS);
      expect(result.subtotal).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it('2.8 should handle high-value catering order (Rp 50.000.000) accurately', () => {
      const result = calculateOrderTotals(50000000, 5000000, {
        taxRate: 10,
        serviceChargeRate: 5,
        cashRoundingRule: 'CEIL_1000',
      });
      expect(result.discountedSubtotal).toBe(45000000);
      expect(result.serviceChargeAmount).toBe(2250000);
      expect(result.taxAmount).toBe(4725000);
      expect(result.finalTotal).toBe(51975000);
    });

    it('2.9 should handle fractional price and tax calculation with integer rounding', () => {
      const result = calculateOrderTotals(13333, 0, {
        taxRate: 10,
        serviceChargeRate: 5,
      });
      expect(result.serviceChargeAmount).toBe(667);
      expect(result.taxableAmount).toBe(14000);
      expect(result.taxAmount).toBe(1400);
      expect(result.finalTotal).toBe(15400);
    });

    it('2.10 should calculate Equal Split for 1 guest returning exact total', () => {
      const split = calculateEqualSplit(75000, 1);
      expect(split.perGuestAmount).toBe(75000);
      expect(split.guestAmounts).toEqual([75000]);
    });
  });

  // ==========================================
  // TIER 3: THERMAL RECEIPT & ITEMIZATION
  // ==========================================
  describe('Tier 3: Thermal Receipt Formatter & Itemized Rows', () => {
    it('3.1 should generate 58mm (32 columns) ASCII receipt with correct width', () => {
      const receipt = generateThermalReceiptAscii(sampleOrder, {
        paperWidth: '58mm',
        storeName: 'MyCashier Jakarta',
        storeAddress: 'Jl. Sudirman No. 10',
      });

      expect(typeof receipt).toBe('string');
      const lines = receipt.split('\n');
      lines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(32);
      });
    });

    it('3.2 should generate 80mm (48 columns) ASCII receipt with correct width', () => {
      const receipt = generateThermalReceiptAscii(sampleOrder, {
        paperWidth: '80mm',
        storeName: 'MyCashier Bali Flagship',
        storeAddress: 'Jl. Sunset Road, Seminyak',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(48);
      });
    });

    it('3.3 should display itemized tax, service charge, and rounding in receipt text', () => {
      const receipt = generateThermalReceiptAscii(sampleOrder, {
        paperWidth: '58mm',
        discountAmount: 10000,
        voucherCode: 'HEMAT10K',
        settings: {
          taxRate: 10,
          serviceChargeRate: 5,
          cashRoundingRule: 'CEIL_500',
        },
      });

      expect(receipt).toContain('Diskon (HEMAT10K):');
      expect(receipt).toContain('Service Charge (5%):');
      expect(receipt).toContain('Pajak Resto PB1 (10%):');
      expect(receipt).toContain('TOTAL LUNAS:');
      expect(receipt).toContain('Nasi Goreng Spesial');
      expect(receipt).toContain('Es Teh Manis');
      expect(receipt).toContain('Pedas sedang, tanpa timun');
    });

    it('3.4 should omit discount row from receipt when discount is 0', () => {
      const receipt = generateThermalReceiptAscii(sampleOrder, {
        discountAmount: 0,
      });
      expect(receipt).not.toContain('Diskon');
    });

    it('3.5 should contain store metadata and polite footer message in 80mm format', () => {
      const receipt = generateThermalReceiptAscii(sampleOrder, {
        paperWidth: '80mm',
        storePhone: '08123456789',
        footerMessage: 'Selamat Menikmati Hidangan!',
      });
      expect(receipt).toContain('Telp: 08123456789');
      expect(receipt).toContain('Selamat Menikmati Hidangan!');
      expect(receipt).toContain('TERIMA KASIH ATAS KUNJUNGAN ANDA!');
    });
  });

  // ==========================================
  // TIER 4: REAL-WORLD POS INTEGRATION
  // ==========================================
  describe('Tier 4: Complex Multi-Item & Split-Bill Workflows', () => {
    it('4.1 should calculate multi-item checkout with promo, service, tax and cash rounding', () => {
      const subtotal = 450000 + 75000 + 45000;
      const result = calculateOrderTotals(subtotal, 50000, {
        taxRate: 10,
        serviceChargeRate: 5,
        enableTax: true,
        enableServiceCharge: true,
        cashRoundingRule: 'CEIL_1000',
      }, true);

      expect(result.subtotal).toBe(570000);
      expect(result.discountedSubtotal).toBe(520000);
      expect(result.serviceChargeAmount).toBe(26000);
      expect(result.taxAmount).toBe(54600);
      expect(result.rawTotal).toBe(600600);
      expect(result.roundingAdjustment).toBe(400);
      expect(result.finalTotal).toBe(601000);
    });

    it('4.2 should maintain split-bill invariant: sum of individual equal split bills equals total', () => {
      const totalAmount = 175450;
      for (const guests of [2, 3, 4, 5, 7, 10]) {
        const split = calculateEqualSplit(totalAmount, guests, 'NONE');
        const sum = split.guestAmounts.reduce((a, b) => a + b, 0);
        expect(sum).toBe(totalAmount);
      }
    });

    it('4.3 should verify Indonesian F&B tax law property: tax is computed on (subtotal + service)', () => {
      const subtotal = 200000;
      const serviceRate = 6;
      const taxRate = 10;

      const result = calculateOrderTotals(subtotal, 0, {
        taxRate,
        serviceChargeRate: serviceRate,
        enableTax: true,
        enableServiceCharge: true,
      });

      const expectedService = 200000 * 0.06; // 12.000
      const expectedTax = (200000 + expectedService) * 0.10; // 21.200
      expect(result.serviceChargeAmount).toBe(expectedService);
      expect(result.taxAmount).toBe(expectedTax);
    });
  });
});
