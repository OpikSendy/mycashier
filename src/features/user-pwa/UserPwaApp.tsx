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
  Lock,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import TablePickerSelect from '@/components/common/TablePickerSelect';
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard';

export default function UserPwaApp() {
  const {
    language,
    selectedTable,
    setSelectedTable,
    menu,
    menuLoading,
    cart,
    addToCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    markOrderPaid,
    orders,
  } = useApp();
  const t = TRANSLATIONS[language].customer;

  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'status'>('menu');
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'snack' | 'dessert'>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedVariantChips, setSelectedVariantChips] = useState<Record<string, string>>({});

  // Promo Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number; desc: string } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Dynamic QRIS Self-Pay State
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisOrder, setQrisOrder] = useState<Order | null>(null);
  const [qrisCountdown, setQrisCountdown] = useState(30);

  // Table Lock via QR Scan URL Query Param (?table=Meja%2004 or ?table=04)
  const [isTableLocked, setIsTableLocked] = useState<boolean>(false);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tableParam = params.get('table');
        if (tableParam) {
          let formatted = tableParam.trim();
          if (/^\d+$/.test(formatted)) {
            formatted = `Meja ${formatted.padStart(2, '0')}`;
          } else if (!formatted.toLowerCase().startsWith('meja')) {
            formatted = `Meja ${formatted}`;
          }
          setSelectedTable(formatted);
          setIsTableLocked(true);
        }
      }
    } catch (e) {}
  }, [setSelectedTable]);

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

  // Extract available subCategories for activeCategory
  const availableSubCategories = Array.from(
    new Set(
      menu
        .filter((i) => activeCategory === 'all' || i.category === activeCategory)
        .map((i) => i.subCategory)
        .filter((s): s is string => Boolean(s))
    )
  );

  // Filtering Menu by Search, Main Category & Sub Category
  const searchFilteredMenu = menu.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubCat = activeSubCategory === 'all' || item.subCategory === activeSubCategory;
    return matchesSearch && matchesSubCat;
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

    const chipParts = Object.values(selectedVariantChips).filter(Boolean);
    const combinedNotes = [chipParts.join(', '), itemNotes.trim()].filter(Boolean).join(' | ');

    addToCart(selectedItemForNotes, combinedNotes);
    setSelectedItemForNotes(null);
    setItemNotes('');
    setSelectedVariantChips({});
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
      className="w-full max-w-md mx-auto px-4 py-4 pb-12 text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing"
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

          {isTableLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black shadow-2xs">
              <Lock className="w-3.5 h-3.5" />
              <span>{selectedTable} ({language === 'ID' ? 'Terkunci QR' : 'QR Locked'})</span>
            </div>
          ) : (
            <TablePickerSelect
              value={selectedTable}
              onChange={setSelectedTable}
              options={tables}
            />
          )}
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
        <div className="space-y-4">
          {/* Member Loyalty Pass Card Widget */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/50 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                  🏆
                </div>
                <div>
                  <div className="text-xs font-black text-white">Budi Santoso</div>
                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <span>🥈 SILVER MEMBER</span>
                    <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">Active</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-400">120 Points</div>
                <div className="text-[9px] text-slate-400">1 Poin = Rp 10.000</div>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Progress ke GOLD Tier</span>
                <span className="font-bold text-amber-400">80% (30 poin lagi)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full w-[80%]" />
              </div>
            </div>
          </div>

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
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setActiveSubCategory('all');
                  }}
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

          {/* Sub-Category Filter Chips Bar */}
          {availableSubCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full select-none pt-0.5">
              <button
                onClick={() => setActiveSubCategory('all')}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  activeSubCategory === 'all'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {language === 'ID' ? 'Semua Sub-Kategori' : 'All Sub-Categories'}
              </button>
              {availableSubCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubCategory(sub)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    activeSubCategory === sub
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Skeleton Loading State */}
          {menuLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ─── SUB-CATEGORY ACTIVE: Premium Filtered Section View ─── */}
          {!menuLoading && activeSubCategory !== 'all' && (() => {
            const subCatItems = searchFilteredMenu.filter((i) => i.subCategory === activeSubCategory);
            return (
              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Premium gradient sub-category header */}
                <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-cyan-900/20 border border-emerald-500/20 dark:border-emerald-700/30 shadow-sm">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/25 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-80">
                          {language === 'ID' ? 'Sub-Kategori Aktif' : 'Active Sub-Category'}
                        </p>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {activeSubCategory}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        {subCatItems.length} {language === 'ID' ? 'menu' : 'items'}
                      </span>
                      <button
                        onClick={() => setActiveSubCategory('all')}
                        className="p-1.5 rounded-xl bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                        title="Hapus filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {subCatItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {subCatItems.map((item) => (
                      <MenuItemCard
                        key={`subcat-${item.id}`}
                        item={item}
                        quantity={getItemCartQuantity(item.id)}
                        language={language}
                        onAdd={() => setSelectedItemForNotes(item)}
                        onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <ChefHat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">
                      {language === 'ID' ? `Tidak ada menu untuk "${activeSubCategory}"` : `No items for "${activeSubCategory}"`}
                    </p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* ─── DEFAULT: Per-Category Sections (hanya tampil saat tidak ada sub-cat filter aktif) ─── */}
          {activeSubCategory === 'all' && (
            <>
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
            </>
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

                {/* AI Smart Upselling Section */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 dark:border-emerald-700/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>AI Rekomendasi: Sering Dibeli Bersama</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Paired</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {menu
                      .filter((m) => !cart.some((c) => c.item.id === m.id) && m.isAvailable)
                      .slice(0, 3)
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 w-52 shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                            <Image src={rec.image} alt={rec.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                              {rec.name}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                              Rp {rec.price.toLocaleString('id-ID')}
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(rec)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] shadow-2xs active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                          >
                            + Tambah
                          </button>
                        </div>
                      ))}
                  </div>
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
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-sm mb-3"
                    />
                  </div>

                  {/* Promo Voucher Input & Badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Kupon Promo Diskon</span>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase">Coba: WELCOME10 / HEMAT20</span>
                    </label>

                    {appliedVoucher ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            🎉 Kupon {appliedVoucher.code} Aktif!
                          </div>
                          <div className="text-[10px] text-slate-500">{appliedVoucher.desc}</div>
                        </div>
                        <button
                          onClick={() => setAppliedVoucher(null)}
                          className="text-[10px] font-bold text-rose-500 hover:underline px-2 py-1"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => {
                            setVoucherCode(e.target.value.toUpperCase());
                            setVoucherError('');
                          }}
                          placeholder="Masukkan kode kupon..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={voucherLoading || !voucherCode}
                          onClick={async () => {
                            setVoucherLoading(true);
                            setVoucherError('');
                            try {
                              const res = await fetch('/api/vouchers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ code: voucherCode, subtotal: cartSubtotal }),
                              });
                              const json = await res.json();
                              if (!res.ok) {
                                setVoucherError(json.error || 'Gagal memproses kupon');
                              } else {
                                setAppliedVoucher({
                                  code: json.voucher.code,
                                  discount: json.discountAmount,
                                  desc: json.voucher.description,
                                });
                                setVoucherCode('');
                              }
                            } catch (_) {
                              setVoucherError('Gagal menghubungkan ke layanan kupon');
                            } finally {
                              setVoucherLoading(false);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs disabled:opacity-50 cursor-pointer transition-all shadow-2xs"
                        >
                          {voucherLoading ? 'Proses...' : 'Gunakan'}
                        </button>
                      </div>
                    )}

                    {voucherError && (
                      <div className="text-[10px] text-rose-500 font-bold px-1">{voucherError}</div>
                    )}
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
                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Diskon Kupon ({appliedVoucher.code})</span>
                        <span>- Rp {appliedVoucher.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Tagihan</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Rp {Math.max(0, cartTotal - (appliedVoucher?.discount || 0)).toLocaleString('id-ID')}
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
                    <div>
                      <div className="text-[10px] text-slate-400 font-normal">Total Tagihan</div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {order.paymentStatus === 'UNPAID' ? (
                      <button
                        onClick={() => {
                          setQrisOrder(order);
                          setShowQrisModal(true);
                          setQrisCountdown(30);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Bayar QRIS Instant</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
                        ✓ LUNAS ({order.paymentMethod})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic QRIS Self-Payment Modal Simulator */}
      {showQrisModal && qrisOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Pembayaran QRIS Mandiri</span>
              </div>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-xs text-slate-400 font-bold hover:underline"
              >
                Tutup
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500">Total Pembayaran Tagihan:</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                Rp {qrisOrder.totalAmount.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Scan via GoPay, OVO, Dana, ShopeePay, BCA, Mandiri</div>
            </div>

            {/* Simulated QR Code Barcode */}
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500/40 inline-block shadow-inner relative">
              <QrCode className="w-40 h-40 text-slate-900 mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] shadow-sm">
                  MYCASHIER QRIS
                </div>
              </div>
            </div>

            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 bg-amber-500/10 py-1.5 rounded-xl border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Sisa Waktu QRIS: 30 Detik</span>
            </div>

            <button
              onClick={() => {
                markOrderPaid(qrisOrder.id, 'QRIS');
                setShowQrisModal(false);
                setQrisOrder(null);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              ✨ Simulasi Bayar QRIS (Sukses)
            </button>
          </div>
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

      {/* Interactive Item Customization Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleConfirmAddToCart}
            className="w-full max-w-sm p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative border border-slate-200/50">
                  <Image
                    src={selectedItemForNotes.image}
                    alt={selectedItemForNotes.name}
                    width={50}
                    height={50}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {language === 'EN' && selectedItemForNotes.nameEn ? selectedItemForNotes.nameEn : selectedItemForNotes.name}
                  </h4>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Rp {selectedItemForNotes.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedItemForNotes(null);
                  setSelectedVariantChips({});
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar">
              {/* CATEGORY 1: DRINKS VARIANTS (Sugar & Ice) */}
              {(selectedItemForNotes.variantPreset === 'drinks' || selectedItemForNotes.category === 'drinks') && (
                <>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'ID' ? 'Level Gula (Sugar Level)' : 'Sugar Level'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Normal Sugar', label: language === 'ID' ? 'Gula Normal' : 'Normal Sugar' },
                        { id: 'Less Sugar (50%)', label: language === 'ID' ? 'Less Sugar (50%)' : 'Less Sugar (50%)' },
                        { id: 'No Sugar (0%)', label: language === 'ID' ? 'Tanpa Gula (0%)' : 'No Sugar (0%)' },
                      ].map((opt) => {
                        const isSelected = selectedVariantChips['sugar'] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariantChips((prev) => ({
                                ...prev,
                                sugar: isSelected ? '' : opt.id,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'ID' ? 'Level Es (Ice Level)' : 'Ice Level'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Normal Ice', label: language === 'ID' ? 'Es Normal' : 'Normal Ice' },
                        { id: 'Less Ice', label: language === 'ID' ? 'Less Ice (Es Sedikit)' : 'Less Ice' },
                        { id: 'No Ice', label: language === 'ID' ? 'Tanpa Es' : 'No Ice' },
                      ].map((opt) => {
                        const isSelected = selectedVariantChips['ice'] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariantChips((prev) => ({
                                ...prev,
                                ice: isSelected ? '' : opt.id,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* CATEGORY 2: FOOD VARIANTS (Spiciness & Egg) */}
              {(selectedItemForNotes.variantPreset === 'food' || selectedItemForNotes.category === 'food') && (
                <>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'ID' ? 'Tingkat Pedas' : 'Spiciness Level'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Tidak Pedas', label: language === 'ID' ? 'Tidak Pedas' : 'Not Spicy' },
                        { id: 'Pedas Sedang 🌶️', label: language === 'ID' ? 'Pedas Sedang 🌶️' : 'Medium Spicy 🌶️' },
                        { id: 'Extra Pedas 🔥', label: language === 'ID' ? 'Extra Pedas 🔥' : 'Extra Spicy 🔥' },
                      ].map((opt) => {
                        const isSelected = selectedVariantChips['spicy'] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariantChips((prev) => ({
                                ...prev,
                                spicy: isSelected ? '' : opt.id,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'ID' ? 'Pilihan Telur' : 'Egg Preference'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Telur Matang', label: language === 'ID' ? 'Telur Matang' : 'Well Done Egg' },
                        { id: 'Setengah Matang', label: language === 'ID' ? 'Setengah Matang' : 'Half Cooked Egg' },
                      ].map((opt) => {
                        const isSelected = selectedVariantChips['egg'] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariantChips((prev) => ({
                                ...prev,
                                egg: isSelected ? '' : opt.id,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* CATEGORY 3: SNACK VARIANTS (Sauce & Toppings) */}
              {(selectedItemForNotes.variantPreset === 'snack' || selectedItemForNotes.category === 'snack') && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'ID' ? 'Pilihan Saus' : 'Sauce Option'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'Mayo Garlic', label: 'Mayo Garlic' },
                      { id: 'Extra Saus Sambal', label: language === 'ID' ? 'Extra Saus Sambal' : 'Extra Chili Sauce' },
                      { id: 'Tanpa Saus', label: language === 'ID' ? 'Tanpa Saus' : 'No Sauce' },
                    ].map((opt) => {
                      const isSelected = selectedVariantChips['sauce'] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedVariantChips((prev) => ({
                              ...prev,
                              sauce: isSelected ? '' : opt.id,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Freeform Notes Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'ID' ? 'Catatan Tambahan Khusus (Opsional)' : 'Additional Custom Request'}
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder={language === 'ID' ? 'Contoh: Es dipisah, jangan pakai bawang...' : 'Example: Extra ice separately...'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-sm border border-slate-200/80 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemForNotes(null);
                  setSelectedVariantChips({});
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                {language === 'ID' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 text-xs font-extrabold shadow-md hover:bg-slate-800 cursor-pointer active:scale-98 transition-all"
              >
                {language === 'ID' ? 'Tambah ke Pesanan' : 'Add to Cart'}
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
          {/* Badge overlay: sub-category (top-right) & popular (top-left) */}
          {item.isPopular && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[8px] font-black shadow-xs leading-none">
              Top
            </span>
          )}
          {item.subCategory && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-sm text-white text-[7px] font-black shadow-xs leading-none truncate max-w-[52px]">
              {item.subCategory}
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
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="text-emerald-600 dark:text-emerald-400 text-xs font-black">
              Rp {item.price.toLocaleString('id-ID')}
            </div>
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
