'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { Order, PaymentMethod, MenuItem } from '@/data/initialData';
import {
  Monitor,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UserCheck,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Cookie,
  Cake,
} from 'lucide-react';
import Image from 'next/image';

export default function CashierPosApp() {
  const { language, menu, orders, cart, addToCart, updateCartQuantity, clearCart, createOrder, markOrderPaid } = useApp();
  const t = TRANSLATIONS[language].cashier;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'snack' | 'dessert'>('all');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');

  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'UNPAID');

  const filteredMenu = menu.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartTax = cartSubtotal * 0.1;
  const cartTotal = cartSubtotal + cartTax;

  const handleCreateWalkInAndPay = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    const newOrder = createOrder(customerNameInput || (language === 'ID' ? 'Tamu Kasir (Walk-in)' : 'Walk-in Guest'), method, true);
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

  const categories = [
    { id: 'all', label: language === 'ID' ? 'Semua' : 'All', icon: Sparkles },
    { id: 'food', label: language === 'ID' ? 'Makanan' : 'Food', icon: UtensilsCrossed },
    { id: 'drinks', label: language === 'ID' ? 'Minuman' : 'Drinks', icon: Coffee },
    { id: 'snack', label: language === 'ID' ? 'Cemilan' : 'Snack', icon: Cookie },
    { id: 'dessert', label: language === 'ID' ? 'Dessert' : 'Dessert', icon: Cake },
  ];

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24 text-slate-800 dark:text-slate-100">
      {/* Friendly Clean POS Banner Header */}
      <div className="mb-6 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 flex-shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-500/20">
              <span>{language === 'ID' ? 'Stasiun Kasir POS Web' : 'Dedicated Web POS Terminal'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {language === 'ID' ? 'Kasir Point of Sale (POS) & Billing' : 'Point of Sale (POS) & Billing Terminal'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ID' ? 'Pencatatan kasir cepat, pemrosesan pembayaran meja & walk-in.' : 'Fast cashier checkout, table payment processing & walk-in billing.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Menu Grid | Right POS Cart & Table Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FAST MENU POS GRID (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Chips */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ID' ? 'Cari cepat nama menu kasir...' : 'Search menu item...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Menu Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.isAvailable}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 text-left transition-all hover:shadow-md shadow-sm disabled:opacity-40 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="h-24 w-full rounded-2xl overflow-hidden mb-2.5 relative bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    <Image src={item.image} alt={item.name} width={200} height={120} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-[10px] text-rose-400 font-black uppercase tracking-wider">
                        Stok Habis
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {language === 'EN' && item.nameEn ? item.nameEn : item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {language === 'EN' && item.descriptionEn ? item.descriptionEn : item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
                    Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  <span className="p-1 rounded-lg bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold group-hover:scale-110 transition-transform">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: POS CART & TABLE QUEUE (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Current POS Transaction Cart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {language === 'ID' ? 'Transaksi POS Cepat (Walk-in)' : 'Walk-in POS Checkout'}
                </h3>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer">
                  {language === 'ID' ? 'Kosongkan' : 'Clear'}
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-medium">
                Klik menu di sebelah kiri untuk menambah pesanan kasir!
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {language === 'EN' && c.item.nameEn ? c.item.nameEn : c.item.name}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black mt-0.5">
                          Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCartQuantity(c.item.id, -1)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs active:scale-95 cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-xs w-4 text-center text-slate-900 dark:text-white">{c.quantity}</span>
                        <button onClick={() => updateCartQuantity(c.item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 flex items-center justify-center font-bold shadow-2xs active:scale-95 cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Pajak Resto (10%):</span>
                    <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total POS:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCreateWalkInAndPay('CASH')}
                    className="py-2.5 px-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Bayar Cash</span>
                  </button>
                  <button
                    onClick={() => handleCreateWalkInAndPay('QRIS')}
                    className="py-2.5 px-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Bayar QRIS</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Table Orders Payment Feed */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Antrean Tagihan Meja Belum Lunas ({unpaidOrders.length})</span>
              </h3>
            </div>

            {unpaidOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada tagihan meja yang pending saat ini.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {unpaidOrders.map((order) => (
                  <div key={order.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                          {order.tableNumber}
                        </span>
                        <span>{order.customerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.id} • {order.createdAt}</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-black mt-0.5">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOrderForPayment(order);
                        setCashAmountPaid(String(order.totalAmount));
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-extrabold text-xs hover:bg-slate-800 cursor-pointer shadow-xs active:scale-95"
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
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <form onSubmit={handleProcessPayment} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pembayaran Kasir: {selectedOrderForPayment.tableNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedOrderForPayment.customerName} • {selectedOrderForPayment.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrderForPayment(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Total Tagihan Kasir Lunas</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                Rp {selectedOrderForPayment.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4 text-emerald-500" /> },
                  { id: 'QRIS', label: 'QRIS', icon: <QrCode className="w-4 h-4 text-cyan-500" /> },
                  { id: 'DEBIT', label: 'EDC Card', icon: <CreditCard className="w-4 h-4 text-indigo-500" /> },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedPaymentMethod === pm.id
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 border-slate-900 dark:border-emerald-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPaymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={cashAmountPaid}
                  onChange={(e) => setCashAmountPaid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-extrabold focus:outline-none focus:border-emerald-500 shadow-sm"
                />
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
                  <span>Kembalian:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Rp {cashChange.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-slate-950" />
              <span>Selesaikan Transaksi &amp; Cetak Struk</span>
            </button>
          </form>
        </div>
      )}

      {/* Receipt Simulator */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
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
              className="w-full py-2.5 bg-slate-900 text-white font-sans font-bold rounded-2xl hover:bg-slate-800 text-xs cursor-pointer"
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
