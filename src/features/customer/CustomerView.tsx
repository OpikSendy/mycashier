'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { MenuItem } from '@/data/initialData';
import { calculateOrderTotals, formatRupiah } from '@/lib/taxEngine';
import { Search, Plus, Minus, ShoppingBag, Sparkles, CheckCircle2, MessageSquare, QrCode, X, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function CustomerView() {
  const { language, selectedTable, menu, cart, addToCart, updateCartQuantity, clearCart, createOrder, storeSettings } = useApp();
  const t = TRANSLATIONS[language].customer;

  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'dessert' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const filteredMenu = menu.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartTotals = calculateOrderTotals(cartSubtotal, 0, storeSettings, false);
  const cartTotal = cartTotals.finalTotal;
  const totalItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleConfirmAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForNotes) return;
    addToCart(selectedItemForNotes, itemNotes);
    setSelectedItemForNotes(null);
    setItemNotes('');
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder = createOrder(customerName || 'Tamu Meja', 'QRIS', false);
    setIsCartOpen(false);
    setCustomerName('');
    setOrderSuccessMsg(`Pesanan ${newOrder.id} untuk ${selectedTable} berhasil dikirim ke Dapur! Status: PENDING.`);
    setTimeout(() => setOrderSuccessMsg(null), 6000);
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24">
      {/* Table Welcome Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
              <span>{t.tableBadge}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              📍 Anda Memesan Dari: <span className="text-emerald-400">{selectedTable}</span>
            </h2>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-medium">
          Silakan pilih menu makanan & minuman favorit Anda di bawah ini!
        </div>
      </div>

      {/* Success Notification Alert */}
      {orderSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{orderSuccessMsg}</span>
          </div>
          <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Categories & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {[
            { id: 'all', label: t.all },
            { id: 'food', label: t.food },
            { id: 'drinks', label: t.drinks },
            { id: 'snack', label: t.snack },
            { id: 'dessert', label: t.dessert },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchMenu}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 overflow-hidden backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div>
              {/* Image & Badges */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={400}
                  height={250}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {item.isPopular && (
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-md">
                    <Sparkles className="w-3 h-3" />
                    <span>Terlaris</span>
                  </div>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-rose-400 font-bold text-xs">
                    Stok Habis
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors mb-1.5">
                  {item.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Footer Price & Add Button */}
            <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Harga</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={() => setSelectedItemForNotes(item)}
                disabled={!item.isAvailable}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleConfirmAddToCart} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kustomisasi: {selectedItemForNotes.name}
              </h3>
              <button type="button" onClick={() => setSelectedItemForNotes(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.notes}
              </label>
              <input
                type="text"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Contoh: Less sugar, ekstra pedas, pisah es..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForNotes(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
              >
                {t.addToCart}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Bottom Cart Bar (Appears when cart has items) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-xl p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl flex items-center justify-between text-white backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              {totalItemCount}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Pesanan Meja ({selectedTable})</div>
              <div className="text-base font-black text-emerald-400">
                Rp {cartTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <span>Lihat Keranjang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cart Drawer & Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.cartTitle} ({selectedTable})
                  </h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List */}
              <div className="space-y-4 mb-6">
                {cart.map((c, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.item.name}</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Rp {c.item.price.toLocaleString('id-ID')}
                      </p>
                      {c.notes && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                          Catatan: {c.notes}
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(c.item.id, -1)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-white">{c.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(c.item.id, 1)}
                        className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Name Input */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Anda / Tamu Meja
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama pemesan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs mb-6">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.subtotal}</span>
                  <span>{formatRupiah(cartTotals.subtotal)}</span>
                </div>
                {cartTotals.serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.serviceCharge} ({cartTotals.serviceChargeRate}%)</span>
                    <span>{formatRupiah(cartTotals.serviceChargeAmount)}</span>
                  </div>
                )}
                {cartTotals.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.tax} ({cartTotals.taxRate}%)</span>
                    <span>{formatRupiah(cartTotals.taxAmount)}</span>
                  </div>
                )}
                {cartTotals.roundingAdjustment !== 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.rounding}</span>
                    <span>{cartTotals.roundingAdjustment > 0 ? '+' : ''}{formatRupiah(cartTotals.roundingAdjustment)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>{t.total}</span>
                  <span className="text-emerald-500">{formatRupiah(cartTotals.finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t.checkoutBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
