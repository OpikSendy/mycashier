'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import {
  ShieldCheck,
  Plus,
  Trash2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Layers,
  Package,
  QrCode,
  Printer,
  Copy,
  Check,
  X,
  Lock,
} from 'lucide-react';
import Image from 'next/image';

export default function AdminCmsApp() {
  const { language, menu, orders, toggleProductAvailability, addNewMenuItem, deleteMenuItem } = useApp();
  const t = TRANSLATIONS[language].manager;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu_master' | 'orders_log' | 'qr_generator'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<'food' | 'drinks' | 'dessert' | 'snack'>('food');
  const [subCategory, setSubCategory] = useState('');
  const [variantPreset, setVariantPreset] = useState<'drinks' | 'food' | 'snack' | 'dessert' | 'none'>('food');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [image, setImage] = useState('');

  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    addNewMenuItem({
      name,
      nameEn: nameEn || name,
      category,
      subCategory: subCategory || undefined,
      variantPreset,
      price: Number(price),
      description: description || 'Menu berkualitas pilihan restoran.',
      descriptionEn: descriptionEn || description || 'Quality restaurant selected menu.',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isPopular: false,
    });

    setIsAddModalOpen(false);
    setName('');
    setNameEn('');
    setSubCategory('');
    setPrice('');
    setDescription('');
    setDescriptionEn('');
    setImage('');
    setVariantPreset('food');
  };

  const handleCopyQrLink = (tableName: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mycashier-five.vercel.app';
    const link = `${origin}/?table=${encodeURIComponent(tableName)}`;
    navigator.clipboard.writeText(link);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24 text-slate-800 dark:text-slate-100">
      {/* Admin Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin CMS Master Control</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Pusat Pengelolaan Data Master &amp; QR Meja Resto
          </h2>
          <p className="text-xs text-slate-500">
            Full control data menu, QR Code Standee generator meja, &amp; laporan omzet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Master</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'dashboard', label: 'Ringkasan Omzet', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'menu_master', label: `Master Menu (${menu.length})`, icon: <Package className="w-4 h-4" /> },
          { id: 'qr_generator', label: 'Cetak QR Code Meja (12)', icon: <QrCode className="w-4 h-4 text-emerald-500" /> },
          { id: 'orders_log', label: `Log Transaksi (${orders.length})`, icon: <Layers className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                <span>Total Omzet Lunas</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                <span>Transaksi Lunas</span>
                <ShoppingBag className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {paidOrders.length} Pesanan
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                <span>Menu Favorit Resto</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                Kopi Susu Aren Premium
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER MENU CRUD */}
      {activeTab === 'menu_master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                  <Image src={item.image} alt={item.name} width={60} height={60} className="object-cover w-full h-full" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  {item.nameEn && <p className="text-[10px] text-slate-400 italic">{item.nameEn}</p>}
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs font-black mt-0.5">
                    Rp {item.price.toLocaleString('id-ID')}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.category}
                    </span>
                    {item.subCategory && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {item.subCategory}
                      </span>
                    )}
                    {item.variantPreset && item.variantPreset !== 'none' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        +{item.variantPreset}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleProductAvailability(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                    item.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.isAvailable ? 'Tersedia' : 'Stok Habis'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                  title="Hapus Menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TABLE QR CODE GENERATOR & PRINTABLE STANDEES */}
      {activeTab === 'qr_generator' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm mb-1">
                <QrCode className="w-5 h-5" />
                <span>Generator QR Code Meja Fisik</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tempel QR Standee ini di meja restoran. Saat pelanggan scan QR Meja 04, URL otomatis mengarah ke <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 text-emerald-600 font-bold">/?table=Meja%2004</code> dan nomor meja otomatis terkunci paten!
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 cursor-pointer flex-shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Semua Standee Meja</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3">
            {tables.map((tableNum) => {
              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mycashier-five.vercel.app';
              const targetUrl = `${origin}/?table=${encodeURIComponent(tableNum)}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;
              const isCopied = copiedTable === tableNum;

              return (
                <div
                  key={tableNum}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>{tableNum.toUpperCase()}</span>
                    </div>

                    <p className="text-[10px] text-slate-400">Scan untuk Pesan Mandiri</p>

                    <div className="w-40 h-40 mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                      <Image
                        src={qrImageUrl}
                        alt={`QR Code ${tableNum}`}
                        width={160}
                        height={160}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    </div>

                    <p className="text-[9px] font-mono text-slate-400 truncate px-2">
                      {targetUrl}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyQrLink(tableNum)}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Link Tersalin!' : 'Salin Link QR'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER ORDERS LOG */}
      {activeTab === 'orders_log' && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{order.id} — {order.tableNumber} ({order.customerName})</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{order.createdAt} • {order.paymentMethod}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-emerald-500">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Master Menu Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Menu Master Resto
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Menu (Bahasa Indonesia)</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nasi Goreng Special..." className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Menu (English Translation)</label>
              <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Special Fried Rice..." className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori Utama</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500">
                <option value="food">Makanan</option>
                <option value="drinks">Minuman</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sub-Kategori (Spesifik)</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="Contoh: Coffee, Rice Bowl, Pastry..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500 mb-1.5"
              />
              <div className="flex flex-wrap gap-1">
                {['Coffee', 'Non-Coffee', 'Rice Bowl & Nasi', 'Pastry & Bakery', 'Cakes & Sweets', 'Tea & Sparkle', 'Finger Food'].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSubCategory(sc)}
                    className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                  >
                    +{sc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preset Modifiers / Varian Pemesanan</label>
              <select value={variantPreset} onChange={(e) => setVariantPreset(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500">
                <option value="drinks">Minuman (Gula &amp; Es)</option>
                <option value="food">Makanan (Pedas &amp; Telur)</option>
                <option value="snack">Cemilan (Saus)</option>
                <option value="dessert">Dessert (Topping)</option>
                <option value="none">Tanpa Varian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga (Rp)</label>
              <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="35000" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" />
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer">
              Simpan Master Data
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
