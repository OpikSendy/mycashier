'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { MenuItem, Order } from '@/data/initialData';
import { Search, Plus, Minus, ShoppingBag, Sparkles, CheckCircle2, QrCode, X, ArrowRight, Smartphone } from 'lucide-react';
import Image from 'next/image';

export default function UserPwaApp() {
  const { language, selectedTable, setSelectedTable, menu, cart, addToCart, updateCartQuantity, clearCart, createOrder, orders } = useApp();
  const t = TRANSLATIONS[language].customer;

  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'status'>('menu');
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'dessert' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');

  // Mouse Drag to Scroll Handler for Category Chips
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsMouseDown(false);
  const handleMouseUp = () => setIsMouseDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  const filteredMenu = menu.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartTax = cartSubtotal * 0.1;
  const cartTotal = cartSubtotal + cartTax;
  const totalItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const myTableOrders = orders.filter((o) => o.tableNumber === selectedTable);

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

    createOrder(customerName || 'Pelanggan Meja', 'QRIS', false);
    setCustomerName('');
    setActiveTab('status');
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 select-none touch-manipulation overflow-x-hidden pb-24">
      {/* Table Scan Header */}
      <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Pelanggan PWA
            </div>
            <div className="text-sm font-black text-white">
              Pesan Dari {selectedTable}
            </div>
          </div>
        </div>

        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold border border-slate-700 focus:outline-none cursor-pointer"
        >
          {tables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* PWA Main View Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-5">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'menu'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Daftar Menu
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'cart'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Keranjang
          {totalItemCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 text-[10px] font-black">
              {totalItemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'status'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Status Meja ({myTableOrders.length})
        </button>
      </div>

      {/* TAB 1: MENU LIST */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama makanan atau minuman..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Category Chips */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar w-full cursor-grab active:cursor-grabbing select-none touch-pan-x"
          >
            {[
              { id: 'all', label: 'Semua' },
              { id: 'food', label: 'Makanan' },
              { id: 'drinks', label: 'Minuman' },
              { id: 'snack', label: 'Snack' },
              { id: 'dessert', label: 'Dessert' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu Cards */}
          <div className="space-y-3">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative">
                    <Image src={item.image} alt={item.name} width={60} height={60} className="object-cover w-full h-full" />
                    {item.isPopular && (
                      <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-emerald-500 text-slate-950 text-[8px] font-black">
                        Top
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                    <div className="text-emerald-500 text-xs font-black mt-1">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItemForNotes(item)}
                  disabled={!item.isAvailable}
                  className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 font-bold active:scale-95 transition-all flex-shrink-0"
                  title="Tambah"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CART */}
      {activeTab === 'cart' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Keranjang Pesanan ({selectedTable})
            </h3>

            {cart.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Keranjang Anda masih kosong. Silakan pilih menu!
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {cart.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{c.item.name}</div>
                        <div className="text-emerald-500 font-bold">Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}</div>
                        {c.notes && <div className="text-[10px] text-amber-500 italic">Catatan: {c.notes}</div>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={() => updateCartQuantity(c.item.id, -1)} className="p-1 rounded bg-slate-200 dark:bg-slate-800"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-xs w-4 text-center">{c.quantity}</span>
                        <button onClick={() => updateCartQuantity(c.item.id, 1)} className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Pemesan (opsional)..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500"><span>Subtotal:</span><span>Rp {cartSubtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Pajak (10%):</span><span>Rp {cartTax.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Total:</span><span className="text-emerald-500">Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    Kirim Pesanan Meja Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDER STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Status Pesanan Meja ({selectedTable})
          </h3>

          {myTableOrders.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Belum ada pesanan aktif untuk {selectedTable}.
            </div>
          ) : (
            <div className="space-y-3">
              {myTableOrders.map((order) => (
                <div key={order.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{order.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                      order.status === 'COOKING' ? 'bg-cyan-500/10 text-cyan-400' :
                      order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.productName}</span>
                        <span>Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs font-black border-t border-slate-800 pt-2">
                    <span>Total Tagihan:</span>
                    <span className="text-emerald-500">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleConfirmAddToCart} className="w-full max-w-xs p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xl">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Catatan: {selectedItemForNotes.name}</h4>
            <input
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Contoh: Less sugar, extra pedas..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setSelectedItemForNotes(null)} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold">Batal</button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold">Tambah</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
