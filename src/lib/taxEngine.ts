/**
 * Pure Dynamic Tax, Service Charge, Voucher Discount, and Cash Rounding Engine
 * Compliant with Indonesian F&B Tax (PB1 - Pajak Barang dan Jasa Tertentu) Regulations.
 */

export type CashRoundingRule = 'NONE' | 'ROUND_100' | 'CEIL_100' | 'CEIL_500' | 'CEIL_1000';

export interface TaxEngineSettings {
  taxRate: number;              // PB1 Resto Tax % (e.g. 10 for 10%)
  serviceChargeRate: number;    // Service Charge % (e.g. 5 for 5%)
  enableTax: boolean;           // Whether PB1 tax is active (default true)
  enableServiceCharge: boolean; // Whether Service Charge is active (default true)
  cashRoundingRule: CashRoundingRule; // Cash rounding mode (default 'NONE')
}

export interface TaxCalculationResult {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  serviceChargeAmount: number;
  serviceChargeRate: number;
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  rawTotal: number;
  roundingAdjustment: number;
  finalTotal: number;
}

export const DEFAULT_TAX_SETTINGS: TaxEngineSettings = {
  taxRate: 10,
  serviceChargeRate: 5,
  enableTax: true,
  enableServiceCharge: true,
  cashRoundingRule: 'NONE',
};

/**
 * Apply rounding rule to an amount.
 */
export function applyRounding(
  amount: number,
  rule: CashRoundingRule = 'NONE'
): { rounded: number; adjustment: number } {
  if (amount <= 0 || rule === 'NONE') {
    return { rounded: amount, adjustment: 0 };
  }

  let rounded = amount;
  switch (rule) {
    case 'ROUND_100':
      rounded = Math.round(amount / 100) * 100;
      break;
    case 'CEIL_100':
      rounded = Math.ceil(amount / 100) * 100;
      break;
    case 'CEIL_500':
      rounded = Math.ceil(amount / 500) * 500;
      break;
    case 'CEIL_1000':
      rounded = Math.ceil(amount / 1000) * 1000;
      break;
    default:
      rounded = amount;
      break;
  }

  return {
    rounded,
    adjustment: rounded - amount,
  };
}

/**
 * Calculate order totals including subtotal, discount, service charge, PB1 tax, and cash rounding.
 *
 * Indonesian F&B tax law (PB1 / Pajak Restoran):
 * 1. Subtotal is reduced by voucher discount: discountedSubtotal = max(0, subtotal - discount)
 * 2. Service charge is computed on discountedSubtotal: (discountedSubtotal * serviceChargeRate) / 100
 * 3. Taxable base = discountedSubtotal + serviceChargeAmount
 * 4. PB1 Tax = (taxableBase * taxRate) / 100
 * 5. Raw total = discountedSubtotal + serviceChargeAmount + taxAmount
 * 6. Final total is rounded according to store cashRoundingRule (if cash payment or enforced).
 */
export function calculateOrderTotals(
  subtotal: number,
  discountAmount: number = 0,
  settings: Partial<TaxEngineSettings> = {},
  isCashPayment: boolean = false
): TaxCalculationResult {
  const safeSubtotal = Math.max(0, Math.round(subtotal || 0));
  const safeDiscount = Math.max(0, Math.min(safeSubtotal, Math.round(discountAmount || 0)));
  const discountedSubtotal = Math.max(0, safeSubtotal - safeDiscount);

  const enableTax = settings.enableTax ?? true;
  const enableServiceCharge = settings.enableServiceCharge ?? true;
  const taxRate = enableTax ? Math.max(0, Number(settings.taxRate ?? 10)) : 0;
  const serviceChargeRate = enableServiceCharge ? Math.max(0, Number(settings.serviceChargeRate ?? 5)) : 0;
  const roundingRule: CashRoundingRule = settings.cashRoundingRule ?? 'NONE';

  // 1. Service Charge
  const serviceChargeAmount = serviceChargeRate > 0
    ? Math.round((discountedSubtotal * serviceChargeRate) / 100)
    : 0;

  // 2. PB1 Resto Tax (applied to discounted subtotal + service charge)
  const taxableAmount = discountedSubtotal + serviceChargeAmount;
  const taxAmount = taxRate > 0
    ? Math.round((taxableAmount * taxRate) / 100)
    : 0;

  // 3. Raw total before cash rounding
  const rawTotal = discountedSubtotal + serviceChargeAmount + taxAmount;

  // 4. Cash rounding adjustment
  // Apply rounding if cash payment or if a rounding rule is configured for the store
  let finalTotal = rawTotal;
  let roundingAdjustment = 0;

  if (roundingRule !== 'NONE' || isCashPayment) {
    const { rounded, adjustment } = applyRounding(rawTotal, roundingRule);
    finalTotal = rounded;
    roundingAdjustment = adjustment;
  }

  return {
    subtotal: safeSubtotal,
    discountAmount: safeDiscount,
    discountedSubtotal,
    serviceChargeAmount,
    serviceChargeRate,
    taxableAmount,
    taxAmount,
    taxRate,
    rawTotal,
    roundingAdjustment,
    finalTotal,
  };
}

/**
 * Format currency in Indonesian Rupiah string (e.g. "Rp 45.000").
 */
export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount || 0).toLocaleString('id-ID')}`;
}

/**
 * Calculate Equal Split Bill with remainder distribution.
 * If total / guests does not divide evenly, distribute remainder cleanly.
 */
export function calculateEqualSplit(
  totalAmount: number,
  guestCount: number,
  roundingRule: CashRoundingRule = 'NONE'
): { perGuestAmount: number; totalCalculated: number; guestAmounts: number[] } {
  const count = Math.max(1, Math.floor(guestCount || 1));
  if (count === 1) {
    const rounded = applyRounding(totalAmount, roundingRule).rounded;
    return { perGuestAmount: rounded, totalCalculated: rounded, guestAmounts: [rounded] };
  }

  const basePerGuest = Math.floor(totalAmount / count);
  const remainder = totalAmount - basePerGuest * count;

  const guestAmounts = Array.from({ length: count }, (_, i) => {
    const raw = basePerGuest + (i < remainder ? 1 : 0);
    return applyRounding(raw, roundingRule).rounded;
  });

  const perGuestAmount = guestAmounts[0];
  const totalCalculated = guestAmounts.reduce((sum, val) => sum + val, 0);

  return {
    perGuestAmount,
    totalCalculated,
    guestAmounts,
  };
}
