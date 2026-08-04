'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { Order, PaymentMethod, MenuItem } from '@/data/initialData';
import { Monitor, CreditCard, QrCode, Banknote, Printer, CheckCircle2, AlertCircle, X, Search, Plus, Minus, Trash2, ShoppingCart, UserCheck } from 'lucide-react';
import Image from 'next/image';

export default function CashierPosApp() {
  const { language, menu, orders, cart, addToCart, updateCartQuantity, clearCart, createOrder, markOrderPaid } = useApp();
  const t = TRANSLATIONS[language].cashier;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');

  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'UNPAID');

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartTax = cartSubtotal * 0.1;
  const cartTotal = cartSubtotal + cartTax;

  const handleCreateWalkInAndPay = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    const newOrder = createOrder(customerNameInput || 'Walk-in Guest', method, true);
    setReceiptOrder(newOrder);
    setCustomerNameInput('');
  };

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
      {/* POS Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Monitor className="w-4 h-4" />
            <span>Dedicated Web POS Station</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Kasir Point of Sale (POS) & Billing Terminal
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan kasir cepat, pemrosesan pembayaran, & pemotongan stok otomatis.
          </p>
        </div>
      </div>

      {/* Main Split Layout: Left Menu Grid | Right POS Cart & Table Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FAST MENU POS GRID (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari cepat nama menu kasir..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.isAvailable}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left transition-all hover:scale-[1.02] shadow-sm disabled:opacity-40 flex flex-col justify-between"
              >
                <div>
                  <div className="h-20 w-full rounded-xl overflow-hidden mb-2 relative bg-slate-800">
                    <Image src={item.image} alt={item.name} width={200} height={120} className="object-cover w-full h-full" />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-rose-400 font-bold">
                        Stok Habis
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                </div>
                <div className="text-emerald-500 font-black text-xs mt-2">
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: POS CART & TABLE QUEUE (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Current POS Transaction Cart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Transaksi POS Cepat (Walk-in)
                </h3>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[10px] text-rose-400 hover:underline">
                  Kosongkan
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Klik menu di sebelah kiri untuk menambah ke kasir!
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{c.item.name}</div>
                        <div className="text-[11px] text-emerald-500">Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCartQuantity(c.item.id, -1)} className="p-1 rounded bg-slate-200 dark:bg-slate-800"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-xs w-4 text-center">{c.quantity}</span>
                        <button onClick={() => updateCartQuantity(c.item.id, 1)} className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500"><span>Subtotal:</span><span>Rp {cartSubtotal.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Pajak (10%):</span><span>Rp {cartTax.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total POS:</span><span className="text-emerald-500">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCreateWalkInAndPay('CASH')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Bayar Cash</span>
                  </button>
                  <button
                    onClick={() => handleCreateWalkInAndPay('QRIS')}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Bayar QRIS</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Table Orders Payment Feed */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Antrean Pembayaran Meja ({unpaidOrders.length})</span>
            </h3>

            {unpaidOrders.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                Tidak ada tagihan meja yang pending.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {unpaidOrders.map((order) => (
                  <div key={order.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">{order.tableNumber} — {order.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.id}</div>
                      <div className="text-emerald-500 font-bold mt-0.5">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrderForPayment(order);
                        setCashAmountPaid(String(order.totalAmount));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                    >
                      Proses
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-slate-400 font-semibold block">Total Tagihan Kasir</span>
              <span className="text-2xl font-black text-emerald-500">
                Rp {selectedOrderForPayment.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'QRIS', label: 'QRIS', icon: <QrCode className="w-4 h-4" /> },
                  { id: 'DEBIT', label: 'EDC', icon: <CreditCard className="w-4 h-4" /> },
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

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesaikan Transaksi & Cetak Struk</span>
            </button>
          </form>
        </div>
      )}

      {/* Receipt Simulator */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white text-slate-900 shadow-2xl font-mono text-xs space-y-4 border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="text-base font-black uppercase tracking-wider">MYCASHIER POS STATION</h3>
              <p className="text-[10px] text-slate-500">Struk Pembayaran Kasir Lunas</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span>No. Transaksi:</span><span className="font-bold">{receiptOrder.id}</span></div>
              <div className="flex justify-between"><span>Pelanggan/Meja:</span><span className="font-bold">{receiptOrder.tableNumber} ({receiptOrder.customerName})</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{receiptOrder.createdAt}</span></div>
              <div className="flex justify-between"><span>Metode Bayar:</span><span className="font-bold text-emerald-700">{receiptOrder.paymentMethod} (LUNAS)</span></div>
            </div>

            <div className="py-2 border-y border-dashed border-slate-300 space-y-1.5 text-[11px]">
              {receiptOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span>TOTAL LUNAS:</span>
              <span className="text-sm">Rp {receiptOrder.totalAmount.toLocaleString('id-ID')}</span>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-500">
              *Stok Barang Otomatis Terpotong*
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
