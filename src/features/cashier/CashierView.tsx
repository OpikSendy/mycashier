'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { Order, PaymentMethod } from '@/data/initialData';
import { Monitor, CreditCard, QrCode, Banknote, Printer, CheckCircle2, AlertCircle, X, DollarSign } from 'lucide-react';

export default function CashierView() {
  const { language, orders, markOrderPaid } = useApp();
  const t = TRANSLATIONS[language].cashier;

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'UNPAID');
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;

    markOrderPaid(selectedOrderForPayment.id, selectedPaymentMethod);
    setReceiptOrder(selectedOrderForPayment);
    setSelectedOrderForPayment(null);
    setCashAmountPaid('');
  };

  const cashChange = selectedOrderForPayment
    ? Math.max(0, (Number(cashAmountPaid) || 0) - selectedOrderForPayment.totalAmount)
    : 0;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Monitor className="w-3.5 h-3.5" />
            <span>{t.posTitle}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Kelola Transaksi & Pembayaran Kasir
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
            {t.posSub}
          </p>
        </div>
      </div>

      {/* Grid of Unpaid Table Orders */}
      <div className="mb-12">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Antrean Pesanan Meja (Belum Lunas: {unpaidOrders.length})</span>
        </h3>

        {unpaidOrders.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            Semua pesanan meja telah lunas terbayar! ✨
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unpaidOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 backdrop-blur-md flex flex-col justify-between shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                      {order.tableNumber}
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {t.unpaidBadge}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{order.id} • {order.createdAt}</div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 mb-4 py-2 border-y border-slate-100 dark:border-slate-800">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>{item.quantity}x {item.productName}</span>
                        <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white mb-4">
                    <span>Total Tagihan:</span>
                    <span className="text-emerald-500">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrderForPayment(order);
                      setCashAmountPaid(String(order.totalAmount));
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>{t.payNow}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid History Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Riwayat Transaksi Lunas ({paidOrders.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paidOrders.map((order) => (
            <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{order.tableNumber} — {order.customerName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{order.id} • {order.paymentMethod}</div>
                <div className="text-emerald-500 font-black mt-1">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
              </div>

              <button
                onClick={() => setReceiptOrder(order)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="Cetak Struk Digital"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleProcessPayment} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pembayaran: {selectedOrderForPayment.tableNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedOrderForPayment.customerName} • {selectedOrderForPayment.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrderForPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-slate-400 font-semibold block">Total yang Harus Dibayar</span>
              <span className="text-2xl font-black text-emerald-500">
                Rp {selectedOrderForPayment.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t.selectPayment}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'QRIS', label: 'QRIS', icon: <QrCode className="w-4 h-4" /> },
                  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'DEBIT', label: 'EDC/Debit', icon: <CreditCard className="w-4 h-4" /> },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      selectedPaymentMethod === pm.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Kembalian Calculation */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={cashAmountPaid}
                  onChange={(e) => setCashAmountPaid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
                  <span>Kembalian:</span>
                  <span className="text-emerald-500 font-black">Rp {cashChange.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* QRIS Code Simulation */}
            {selectedPaymentMethod === 'QRIS' && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-2">
                <QrCode className="w-20 h-20 text-slate-900 dark:text-emerald-400" />
                <span className="text-[11px] text-slate-500 font-medium">Scan QRIS GoPay / OVO / ShopeePay</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Konfirmasi Pelunasan & Cetak Struk</span>
            </button>
          </form>
        </div>
      )}

      {/* Receipt Simulator Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white text-slate-900 shadow-2xl font-mono text-xs space-y-4 border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="text-base font-black uppercase tracking-wider">MYCASHIER RESTO</h3>
              <p className="text-[10px] text-slate-500">Jl. Malioboro No. 88, Yogyakarta</p>
              <p className="text-[10px] text-slate-500">Telp: (0274) 555-8888</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Transaksi:</span>
                <span className="font-bold">{receiptOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Meja / Tamu:</span>
                <span className="font-bold">{receiptOrder.tableNumber} ({receiptOrder.customerName})</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{receiptOrder.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran:</span>
                <span className="font-bold text-emerald-700">{receiptOrder.paymentMethod} (LUNAS)</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-y border-dashed border-slate-300 space-y-1.5 text-[11px]">
              {receiptOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span>TOTAL:</span>
                <span className="text-sm">Rp {receiptOrder.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              Terima Kasih Atas Kunjungan Anda! 🙏 <br />
              Powered by MyCashier POS
            </div>

            <button
              onClick={() => setReceiptOrder(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-sans font-bold rounded-xl hover:bg-slate-800 text-xs"
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
