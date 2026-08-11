'use client';

import React from 'react';
import { Order } from '@/data/initialData';
import { Printer, X, CheckCircle2, QrCode } from 'lucide-react';
import Image from 'next/image';

interface ThermalReceiptModalProps {
  order: Order | null;
  storeName?: string;
  storeAddress?: string;
  taxRate?: number;
  onClose: () => void;
}

export default function ThermalReceiptModal({
  order,
  storeName = 'MyCashier Resto',
  storeAddress = 'Jl. Raya No. 1, Jakarta',
  taxRate = 10,
  onClose,
}: ThermalReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Struk Bukti Pembayaran Thermal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 58mm POS Receipt Thermal Container */}
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
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.paymentMethod} ({order.paymentStatus})</span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
            <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Item Pesanan</div>
            {order.items.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <div className="font-bold flex justify-between">
                  <span>{item.productName}</span>
                  <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[9px] text-slate-500 pl-2">
                  {item.quantity}x @ Rp {item.price.toLocaleString('id-ID')}
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
              <span>Subtotal:</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Pajak Resto ({taxRate}%):</span>
              <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-black text-xs pt-1 text-slate-900 dark:text-white">
              <span>TOTAL LUNAS:</span>
              <span className="text-emerald-600 dark:text-emerald-400">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
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
              MyCashier POS & Self-Ordering System
            </div>
          </div>
        </div>

        {/* Modal Bottom Print Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Tutup
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
