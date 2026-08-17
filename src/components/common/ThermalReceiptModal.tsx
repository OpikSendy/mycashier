'use client';

import React, { useState } from 'react';
import { Order } from '@/data/initialData';
import { Printer, X, CheckCircle2, QrCode, Copy, Check, FileText } from 'lucide-react';
import Image from 'next/image';
import { calculateOrderTotals, formatRupiah, TaxEngineSettings } from '@/lib/taxEngine';
import { generateThermalReceiptAscii } from '@/lib/receipt';

interface ThermalReceiptModalProps {
  order: Order | null;
  storeName?: string;
  storeAddress?: string;
  taxRate?: number;
  serviceChargeRate?: number;
  discountAmount?: number;
  voucherCode?: string;
  settings?: Partial<TaxEngineSettings>;
  onClose: () => void;
}

export default function ThermalReceiptModal({
  order,
  storeName = 'MyCashier Resto',
  storeAddress = 'Jl. Raya No. 1, Jakarta',
  taxRate,
  serviceChargeRate,
  discountAmount = 0,
  voucherCode,
  settings,
  onClose,
}: ThermalReceiptModalProps) {
  const [copiedAscii, setCopiedAscii] = useState(false);
  const [showAsciiPreview, setShowAsciiPreview] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isCash = order.paymentMethod === 'CASH';
  const effectiveSettings: Partial<TaxEngineSettings> = {
    ...settings,
    ...(taxRate !== undefined && { taxRate }),
    ...(serviceChargeRate !== undefined && { serviceChargeRate }),
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateOrderTotals(
    subtotal,
    discountAmount,
    effectiveSettings,
    isCash
  );

  const asciiReceiptText = generateThermalReceiptAscii(order, {
    storeName,
    storeAddress,
    discountAmount,
    voucherCode,
    settings: effectiveSettings,
  });

  const handleCopyAscii = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(asciiReceiptText);
      setCopiedAscii(true);
      setTimeout(() => setCopiedAscii(false), 2000);
    }
  };

  const finalTotalAmount = totals.finalTotal > 0 ? totals.finalTotal : order.totalAmount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Struk Bukti Pembayaran Thermal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAsciiPreview(!showAsciiPreview)}
              title="Toggle ASCII Raw View"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showAsciiPreview ? 'Struk' : 'ASCII'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 58mm POS Receipt Container or Raw ASCII Container */}
        {showAsciiPreview ? (
          <div className="p-4 overflow-y-auto font-mono text-[10px] text-emerald-400 bg-slate-950 space-y-2 max-h-[65vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Raw ASCII 58mm Stream:</span>
              <button
                onClick={handleCopyAscii}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedAscii ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAscii ? 'Disalin!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-tight">{asciiReceiptText}</pre>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto font-mono text-[11px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 space-y-3 print:p-0 print:text-black">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-10 h-10 mx-auto rounded-full overflow-hidden relative bg-slate-900 mb-1">
                <Image src="/icon.jpg" alt="Logo" width={40} height={40} className="object-cover w-full h-full" />
              </div>
              <div className="font-black text-sm uppercase tracking-wider">{storeName}</div>
              <div className="text-[10px] text-slate-500">{storeAddress}</div>
              <div className="text-[9px] text-slate-400">=================================</div>
            </div>

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-slate-900 dark:text-white">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Meja / Lokasi:</span>
                <span className="font-bold text-slate-900 dark:text-white">{order.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900 dark:text-white">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{order.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {order.paymentMethod} ({order.paymentStatus})
                </span>
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Item Pesanan</div>
              {order.items.map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="font-bold flex justify-between">
                    <span>{item.productName}</span>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 pl-2">
                    {item.quantity}x @ {item.price.toLocaleString('id-ID')}
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-amber-600 italic pl-2">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Menu:</span>
                <span>{formatRupiah(totals.subtotal)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Promo {voucherCode ? `(${voucherCode})` : ''}:</span>
                  <span>- {formatRupiah(totals.discountAmount)}</span>
                </div>
              )}

              {totals.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge ({totals.serviceChargeRate}%):</span>
                  <span>{formatRupiah(totals.serviceChargeAmount)}</span>
                </div>
              )}

              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Pajak Resto PB1 ({totals.taxRate}%):</span>
                  <span>{formatRupiah(totals.taxAmount)}</span>
                </div>
              )}

              {totals.roundingAdjustment !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Pembulatan Kasir:</span>
                  <span>{totals.roundingAdjustment > 0 ? '+' : ''}{formatRupiah(totals.roundingAdjustment)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-xs pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <span>TOTAL LUNAS:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(finalTotalAmount)}</span>
              </div>
            </div>

            {/* Barcode & Footer Message */}
            <div className="text-center pt-2 space-y-2">
              <div className="w-24 h-24 mx-auto p-1 bg-white rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Terima Kasih Atas Kunjungan Anda!
              </div>
              <div className="text-[8px] text-slate-400">
                MyCashier POS &amp; Self-Ordering System
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Print Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 print:hidden">
          <button
            onClick={handleCopyAscii}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedAscii ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAscii ? 'Tersalin!' : 'Copy Struk'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
