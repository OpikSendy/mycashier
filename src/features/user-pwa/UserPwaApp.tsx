'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { MenuItem, Order } from '@/data/initialData';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  QrCode,
  X,
  ArrowRight,
  UtensilsCrossed,
  Coffee,
  Cookie,
  Cake,
  Flame,
  ChefHat,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import TablePickerSelect from '@/components/common/TablePickerSelect';

export default function UserPwaApp() {
  const {
    language,
    selectedTable,
    setSelectedTable,
    menu,
    cart,
    addToCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    orders,
  } = useApp();
  const t = TRANSLATIONS[language].customer;

  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'status'>('menu');
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'snack' | 'dessert'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');

  // Mouse Drag to Scroll Handler for Category Chips
  const categoryScrollRef = useRef<HTMLDivElement>(null);
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

  // Filtering Menu
  const searchFilteredMenu = menu.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const popularMenu = searchFilteredMenu.filter((i) => i.isPopular);
  const foodMenu = searchFilteredMenu.filter((i) => i.category === 'food');
  const drinksMenu = searchFilteredMenu.filter((i) => i.category === 'drinks');
  const snackMenu = searchFilteredMenu.filter((i) => i.category === 'snack');
  const dessertMenu = searchFilteredMenu.filter((i) => i.category === 'dessert');

  // Cart Computations
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

  // Helper function to get cart item count for a specific menu item
  const getItemCartQuantity = (itemId: string) => {
    const found = cart.find((c) => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const categories = [
    { id: 'all', label: t.all, icon: Sparkles, color: 'bg-emerald-500 text-white' },
    { id: 'food', label: t.food, icon: UtensilsCrossed, color: 'bg-amber-500/10 text-amber-600' },
    { id: 'drinks', label: t.drinks, icon: Coffee, color: 'bg-cyan-500/10 text-cyan-600' },
    { id: 'snack', label: t.snack, icon: Cookie, color: 'bg-orange-500/10 text-orange-600' },
    { id: 'dessert', label: t.dessert, icon: Cake, color: 'bg-rose-500/10 text-rose-600' },
  ];

  // Vertical Drag-to-Scroll for Desktop Mouse Users
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragScrollTop, setDragScrollTop] = useState(0);

  const handlePageMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, option, .no-scrollbar')) return;
    setIsVerticalDragging(true);
    setDragStartY(e.pageY);
    setDragScrollTop(window.scrollY || document.documentElement.scrollTop);
  };

  const handlePageMouseMove = (e: React.MouseEvent) => {
    if (!isVerticalDragging) return;
    const deltaY = e.pageY - dragStartY;
    window.scrollTo({
      top: dragScrollTop - deltaY,
      behavior: 'instant',
    });
  };

  const handlePageMouseUp = () => setIsVerticalDragging(false);

  return (
    <div
      onMouseDown={handlePageMouseDown}
      onMouseMove={handlePageMouseMove}
      onMouseUp={handlePageMouseUp}
      onMouseLeave={handlePageMouseUp}
      className="w-full max-w-md mx-auto px-4 py-4 pb-28 text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing"
    >
      {/* Friendly Clean Header Banner */}
      <div className="mb-5 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t.tableBadge}
              </p>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {language === 'ID' ? 'Selamat Datang! 👋' : 'Welcome! 👋'}
              </h2>
            </div>
          </div>

          <TablePickerSelect
            value={selectedTable}
            onChange={setSelectedTable}
            options={tables}
          />
        </div>
      </div>

      {/* Navigation Segment Control */}
      <div className="grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-5">
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'menu'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'ID' ? 'Daftar Menu' : 'Menu List'}
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all relative ${
            activeTab === 'cart'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'ID' ? 'Keranjang' : 'Cart'}
          {totalItemCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              {totalItemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'status'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'ID' ? `Pesanan (${myTableOrders.length})` : `Orders (${myTableOrders.length})`}
        </button>
      </div>

      {/* TAB 1: MENU LIST WITH PER-CATEGORY SECTIONS */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchMenu}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Drag-to-Scroll Category Chips Bar */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full cursor-grab active:cursor-grabbing select-none touch-pan-x"
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm scale-105'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* CATEGORY SECTION 1: TOP PICKS / REKOMENDASI */}
          {(activeCategory === 'all' || activeCategory === 'food') && popularMenu.length > 0 && !searchQuery && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Flame className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Paling Favorit (Top Picks)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {popularMenu.length} Pilihan
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {popularMenu.map((item) => (
                  <MenuItemCard
                    key={`popular-${item.id}`}
                    item={item}
                    quantity={getItemCartQuantity(item.id)}
                    language={language}
                    onAdd={() => setSelectedItemForNotes(item)}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY SECTION 2: MAKANAN UTAMA */}
          {(activeCategory === 'all' || activeCategory === 'food') && foodMenu.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <UtensilsCrossed className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {language === 'ID' ? 'Makanan Utama' : 'Main Course Dishes'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {language === 'ID' ? 'Hidangan lezat & mengenyangkan' : 'Delicious & fulfilling main dishes'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {foodMenu.length} {language === 'ID' ? 'Menu' : 'Items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {foodMenu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemCartQuantity(item.id)}
                    language={language}
                    onAdd={() => setSelectedItemForNotes(item)}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY SECTION 3: MINUMAN & BEVERAGES */}
          {(activeCategory === 'all' || activeCategory === 'drinks') && drinksMenu.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                    <Coffee className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {language === 'ID' ? 'Minuman & Kopi' : 'Beverages & Coffee'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {language === 'ID' ? 'Kopi segar, latte & es teh pilihan' : 'Fresh coffee, latte & iced teas'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {drinksMenu.length} {language === 'ID' ? 'Menu' : 'Items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {drinksMenu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemCartQuantity(item.id)}
                    language={language}
                    onAdd={() => setSelectedItemForNotes(item)}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY SECTION 4: CEMILAN & SIDE DISH */}
          {(activeCategory === 'all' || activeCategory === 'snack') && snackMenu.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <Cookie className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {language === 'ID' ? 'Cemilan & Side Dish' : 'Snacks & Side Dishes'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {language === 'ID' ? 'Pastry renyah & makanan ringan' : 'Crispy pastries & light snacks'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {snackMenu.length} {language === 'ID' ? 'Menu' : 'Items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {snackMenu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemCartQuantity(item.id)}
                    language={language}
                    onAdd={() => setSelectedItemForNotes(item)}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY SECTION 5: DESSERT & KUE */}
          {(activeCategory === 'all' || activeCategory === 'dessert') && dessertMenu.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <Cake className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {language === 'ID' ? 'Dessert & Kue' : 'Desserts & Cakes'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {language === 'ID' ? 'Penutup manis & kue keju spesial' : 'Sweet desserts & cheesecake specials'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {dessertMenu.length} {language === 'ID' ? 'Menu' : 'Items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {dessertMenu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemCartQuantity(item.id)}
                    language={language}
                    onAdd={() => setSelectedItemForNotes(item)}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                  />
                ))}
              </div>
            </section>
          )}

          {searchFilteredMenu.length === 0 && (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <ChefHat className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Menu &ldquo;{searchQuery}&rdquo; tidak ditemukan.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-emerald-600"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLEAN CART TAB */}
      {activeTab === 'cart' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Keranjang Pesanan
                </h3>
                <p className="text-[11px] text-slate-500">Pemesanan untuk {selectedTable}</p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  Keranjang Anda masih kosong. Silakan pilih menu enak!
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 text-xs font-bold shadow-sm"
                >
                  Lihat Daftar Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {cart.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {c.item.name}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                          Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}
                        </div>
                        {c.notes && (
                          <div className="text-[10px] text-amber-600 italic mt-0.5">
                            Catatan: {c.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateCartQuantity(c.item.id, -1)}
                          className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs w-5 text-center">{c.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(c.item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 flex items-center justify-center font-bold active:scale-95 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Nama Pemesan (opsional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi (Meja 04)"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Pajak Resto (10%)</span>
                      <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Tagihan</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Rp {cartTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Kirim Pesanan Meja Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLEAN ORDER STATUS TAB */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Status Pesanan ({selectedTable})
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              {myTableOrders.length} Pesanan Aktif
            </span>
          </div>

          {myTableOrders.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada pesanan aktif untuk {selectedTable}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTableOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {order.id}
                      </span>
                      <p className="text-[10px] text-slate-400">{order.createdAt}</p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        order.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : order.status === 'COOKING'
                          ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                          : order.status === 'READY'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      {order.status === 'PENDING'
                        ? 'Menunggu Konfirmasi'
                        : order.status === 'COOKING'
                        ? 'Sedang Dimasak 🍳'
                        : order.status === 'READY'
                        ? 'Siap Diantar 🚀'
                        : order.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          <strong className="text-slate-900 dark:text-white">{it.quantity}x</strong>{' '}
                          {it.productName}
                        </span>
                        <span className="font-semibold">
                          Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs font-black border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <span>Total Tagihan</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Rp {order.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Cart Bar when browsing Menu Tab */}
      {activeTab === 'menu' && totalItemCount > 0 && (
        <aside className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setActiveTab('cart')}
            className="w-full p-3.5 rounded-3xl bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xl shadow-slate-900/20 border border-slate-800 flex items-center justify-between gap-3 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                {totalItemCount}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">
                  Ringkasan Pesanan
                </p>
                <p className="text-xs font-extrabold">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-400 dark:text-slate-100">
              <span>Lanjut ke Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </aside>
      )}

      {/* Item Notes Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleConfirmAddToCart}
            className="w-full max-w-xs p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Catatan: {selectedItemForNotes.name}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedItemForNotes(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Contoh: Less sugar, es sedikit, pedas..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-sm"
              autoFocus
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedItemForNotes(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-500"
              >
                Tambah Pesanan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Clean Menu Item Card Component
interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  language: string;
  onAdd: () => void;
  onUpdateQuantity: (delta: number) => void;
}

function MenuItemCard({ item, quantity, language, onAdd, onUpdateQuantity }: MenuItemCardProps) {
  return (
    <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3.5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative border border-slate-100 dark:border-slate-800">
          <Image
            src={item.image}
            alt={item.name}
            width={70}
            height={70}
            className="object-cover w-full h-full"
          />
          {item.isPopular && (
            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[8px] font-black shadow-xs">
              Top
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
            {item.name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
            {item.description}
          </p>
          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-black mt-1">
            Rp {item.price.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {quantity === 0 ? (
        <button
          onClick={onAdd}
          disabled={!item.isAvailable}
          className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-slate-800 disabled:opacity-40 text-xs font-extrabold active:scale-95 transition-all flex items-center gap-1 flex-shrink-0 shadow-xs cursor-pointer"
          title="Tambah ke Keranjang"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ID' ? 'Tambah' : 'Add'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onUpdateQuantity(-1)}
            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shadow-xs active:scale-95"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-black w-4 text-center text-slate-900 dark:text-white">
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(1)}
            className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 flex items-center justify-center font-bold shadow-xs active:scale-95"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
