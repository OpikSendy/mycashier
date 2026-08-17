import { describe, it, expect } from 'bun:test';
import {
  calculateOrderTotals,
  applyRounding,
  calculateEqualSplit,
  formatRupiah,
  CashRoundingRule,
} from '../src/lib/taxEngine';
import { generateThermalReceiptAscii } from '../src/lib/receipt';
import { Order } from '../src/data/initialData';

describe('Tax & Fee Calculation Engine (taxEngine.ts)', () => {
  it('calculates standard Indonesian PB1 tax (10%) and Service Charge (5%)', () => {
    // Subtotal = 100,000
    // Discount = 0
    // Service Charge (5%) = 5,000
    // Taxable base (Subtotal + Service Charge) = 105,000
    // PB1 Tax (10%) = 10,500
    // Raw Total = 100,000 + 5,000 + 10,500 = 115,500
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

  it('correctly applies voucher discount before service charge and PB1 tax', () => {
    // Subtotal = 100,000, Discount = 20,000
    // Discounted Subtotal = 80,000
    // Service Charge (5%) = 4,000
    // Taxable base = 80,000 + 4,000 = 84,000
    // PB1 Tax (10%) = 8,400
    // Raw Total = 80,000 + 4,000 + 8,400 = 92,400
    const result = calculateOrderTotals(100000, 20000, {
      taxRate: 10,
      serviceChargeRate: 5,
      enableTax: true,
      enableServiceCharge: true,
      cashRoundingRule: 'NONE',
    });

    expect(result.discountedSubtotal).toBe(80000);
    expect(result.serviceChargeAmount).toBe(4000);
    expect(result.taxableAmount).toBe(84000);
    expect(result.taxAmount).toBe(8400);
    expect(result.rawTotal).toBe(92400);
    expect(result.finalTotal).toBe(92400);
  });

  it('handles toggling tax and service charge off', () => {
    const result = calculateOrderTotals(100000, 0, {
      taxRate: 10,
      serviceChargeRate: 5,
      enableTax: false,
      enableServiceCharge: false,
      cashRoundingRule: 'NONE',
    });

    expect(result.serviceChargeAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.finalTotal).toBe(100000);
  });

  it('handles custom tax and service charge percentages', () => {
    // Subtotal = 200,000
    // Service Charge (7.5%) = 15,000
    // Taxable base = 215,000
    // PB1 Tax (11%) = 23,650
    // Total = 200,000 + 15,000 + 23,650 = 238,650
    const result = calculateOrderTotals(200000, 0, {
      taxRate: 11,
      serviceChargeRate: 7.5,
      enableTax: true,
      enableServiceCharge: true,
      cashRoundingRule: 'NONE',
    });

    expect(result.serviceChargeAmount).toBe(15000);
    expect(result.taxableAmount).toBe(215000);
    expect(result.taxAmount).toBe(23650);
    expect(result.finalTotal).toBe(238650);
  });

  describe('Cash Rounding Rules', () => {
    it('NONE leaves amount untouched', () => {
      const res = applyRounding(115555, 'NONE');
      expect(res.rounded).toBe(115555);
      expect(res.adjustment).toBe(0);
    });

    it('ROUND_100 rounds to nearest 100', () => {
      expect(applyRounding(115549, 'ROUND_100').rounded).toBe(115500);
      expect(applyRounding(115550, 'ROUND_100').rounded).toBe(115600);
      expect(applyRounding(115550, 'ROUND_100').adjustment).toBe(50);
    });

    it('CEIL_100 rounds up to next 100', () => {
      expect(applyRounding(115501, 'CEIL_100').rounded).toBe(115600);
      expect(applyRounding(115500, 'CEIL_100').rounded).toBe(115500);
      expect(applyRounding(115510, 'CEIL_100').adjustment).toBe(90);
    });

    it('CEIL_500 rounds up to next 500', () => {
      expect(applyRounding(115100, 'CEIL_500').rounded).toBe(115500);
      expect(applyRounding(115500, 'CEIL_500').rounded).toBe(115500);
      expect(applyRounding(115501, 'CEIL_500').rounded).toBe(116000);
    });

    it('CEIL_1000 rounds up to next 1,000', () => {
      expect(applyRounding(115200, 'CEIL_1000').rounded).toBe(116000);
      expect(applyRounding(115000, 'CEIL_1000').rounded).toBe(115000);
      expect(applyRounding(115001, 'CEIL_1000').rounded).toBe(116000);
    });
  });

  describe('Equal Split Bill Calculation', () => {
    it('splits evenly among guests with zero remainder', () => {
      const split = calculateEqualSplit(100000, 4, 'NONE');
      expect(split.perGuestAmount).toBe(25000);
      expect(split.guestAmounts).toEqual([25000, 25000, 25000, 25000]);
      expect(split.totalCalculated).toBe(100000);
    });

    it('handles rounding in equal split', () => {
      const split = calculateEqualSplit(100000, 3, 'CEIL_100');
      // 100000 / 3 = 33333, ceil 100 = 33400
      expect(split.perGuestAmount).toBe(33400);
    });
  });

  describe('Receipt Generator (receipt.ts)', () => {
    it('produces valid ASCII formatted receipt text', () => {
      const mockOrder: Order = {
        id: 'ORD-9999',
        tableNumber: 'Meja 04',
        customerName: 'Budi Santoso',
        totalAmount: 115500,
        status: 'PENDING',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        createdAt: '12:30:00',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Nasi Goreng Wagyu',
            price: 45000,
            quantity: 2,
            notes: 'Pedas sedang',
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Es Teh Manis',
            price: 10000,
            quantity: 1,
            notes: 'Less ice',
          },
        ],
      };

      const ascii = generateThermalReceiptAscii(mockOrder, {
        storeName: 'MyCashier Resto',
        storeAddress: 'Jl. Sudirman No. 10',
        settings: {
          taxRate: 10,
          serviceChargeRate: 5,
          enableTax: true,
          enableServiceCharge: true,
          cashRoundingRule: 'ROUND_100',
        },
      });

      expect(ascii).toContain('MYCASHIER RESTO');
      expect(ascii).toContain('ORD-9999');
      expect(ascii).toContain('Meja 04');
      expect(ascii).toContain('Nasi Goreng Wagyu');
      expect(ascii).toContain('Subtotal Menu:');
      expect(ascii).toContain('Service Charge (5%):');
      expect(ascii).toContain('Pajak Resto PB1 (10%):');
      expect(ascii).toContain('TOTAL LUNAS:');
    });
  });
});
