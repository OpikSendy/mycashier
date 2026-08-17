/**
 * Pure ASCII Thermal Receipt Formatter for 58mm (32 cols) and 80mm (48 cols) POS Printers.
 * Includes itemized calculation for Subtotal, Discount, Service Charge, PB1 Tax, Rounding, and Total.
 */

import { Order } from '@/data/initialData';
import { calculateOrderTotals, CashRoundingRule, formatRupiah, TaxEngineSettings } from './taxEngine';

export interface ReceiptOptions {
  paperWidth?: '58mm' | '80mm'; // 58mm = 32 chars, 80mm = 48 chars
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  footerMessage?: string;
  settings?: Partial<TaxEngineSettings>;
  discountAmount?: number;
  voucherCode?: string;
}

/**
 * Center a line of text within the specified column width.
 */
function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPadding = Math.floor((width - text.length) / 2);
  const rightPadding = width - text.length - leftPadding;
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
}

/**
 * Format a two-column row with left text and right aligned text.
 */
function justifyRow(left: string, right: string, width: number): string {
  const availableSpace = width - right.length;
  if (left.length <= availableSpace) {
    return left + ' '.repeat(availableSpace - left.length) + right;
  }
  // If left is too long, truncate it
  const truncatedLeft = left.slice(0, availableSpace - 1);
  return truncatedLeft + ' ' + right;
}

/**
 * Generate clean ASCII text representation of a thermal POS receipt.
 */
export function generateThermalReceiptAscii(
  order: Order,
  options: ReceiptOptions = {}
): string {
  const cols = options.paperWidth === '80mm' ? 48 : 32;
  const storeName = (options.storeName || 'MYCASHIER RESTO').toUpperCase();
  const storeAddress = options.storeAddress || 'Jl. Raya No. 1, Jakarta';
  const dividerDouble = '='.repeat(cols);
  const dividerSingle = '-'.repeat(cols);

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isCash = order.paymentMethod === 'CASH';
  const totals = calculateOrderTotals(
    subtotal,
    options.discountAmount || 0,
    options.settings,
    isCash
  );

  const lines: string[] = [];

  // 1. Header
  lines.push(centerText(storeName, cols));
  lines.push(centerText(storeAddress, cols));
  if (options.storePhone) {
    lines.push(centerText(`Telp: ${options.storePhone}`, cols));
  }
  lines.push(dividerDouble);

  // 2. Metadata
  lines.push(justifyRow('No. Struk:', order.id, cols));
  lines.push(justifyRow('Meja / Lokasi:', order.tableNumber, cols));
  lines.push(justifyRow('Pelanggan:', order.customerName, cols));
  lines.push(justifyRow('Waktu:', order.createdAt, cols));
  lines.push(justifyRow('Pembayaran:', `${order.paymentMethod} (${order.paymentStatus})`, cols));
  lines.push(dividerSingle);

  // 3. Itemized Products
  lines.push(centerText('RINCIAN PESANAN', cols));
  lines.push(dividerSingle);

  order.items.forEach((item) => {
    const itemTotalStr = formatRupiah(item.price * item.quantity);
    lines.push(justifyRow(item.productName, itemTotalStr, cols));

    const qtyDetail = `  ${item.quantity}x @ ${item.price.toLocaleString('id-ID')}`;
    lines.push(qtyDetail);

    if (item.notes && item.notes.trim()) {
      lines.push(`  * ${item.notes.trim()}`);
    }
  });

  lines.push(dividerSingle);

  // 4. Financial Totals Breakdown
  lines.push(justifyRow('Subtotal Menu:', formatRupiah(totals.subtotal), cols));

  if (totals.discountAmount > 0) {
    const discLabel = options.voucherCode
      ? `Diskon (${options.voucherCode}):`
      : 'Diskon Promo:';
    lines.push(justifyRow(discLabel, `-${formatRupiah(totals.discountAmount)}`, cols));
  }

  if (totals.serviceChargeAmount > 0) {
    lines.push(
      justifyRow(`Service Charge (${totals.serviceChargeRate}%):`, formatRupiah(totals.serviceChargeAmount), cols)
    );
  }

  if (totals.taxAmount > 0) {
    lines.push(
      justifyRow(`Pajak Resto PB1 (${totals.taxRate}%):`, formatRupiah(totals.taxAmount), cols)
    );
  }

  if (totals.roundingAdjustment !== 0) {
    const sign = totals.roundingAdjustment > 0 ? '+' : '';
    lines.push(
      justifyRow('Pembulatan Kasir:', `${sign}${formatRupiah(totals.roundingAdjustment)}`, cols)
    );
  }

  lines.push(dividerDouble);
  const finalTotalToDisplay = totals.finalTotal > 0 ? totals.finalTotal : order.totalAmount;
  lines.push(justifyRow('TOTAL LUNAS:', formatRupiah(finalTotalToDisplay), cols));
  lines.push(dividerDouble);

  // 5. Footer & Barcode note
  lines.push('');
  lines.push(centerText('TERIMA KASIH ATAS KUNJUNGAN ANDA!', cols));
  lines.push(centerText(options.footerMessage || 'MyCashier POS & Self-Ordering', cols));
  lines.push(centerText('Simpan struk ini sebagai bukti pembayaran.', cols));
  lines.push('');

  return lines.join('\n');
}
