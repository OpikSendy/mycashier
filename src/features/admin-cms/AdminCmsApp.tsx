'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { MenuItem } from '@/data/initialData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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
  Pencil,
  Settings,
  Database,
  Wifi,
  WifiOff,
  Percent,
  MapPin,
  Store,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Download,
  Tag,
  Boxes,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import InventoryManagerModal from './InventoryManagerModal';
import TableMapModal from './TableMapModal';
import AiBriefingModal from './AiBriefingModal';

// ─── Shared preset data ──────────────────────────────────────────────────────
const SUB_CATEGORY_PRESETS = [
  'Coffee', 'Non-Coffee', 'Rice Bowl & Nasi',
  'Pastry & Bakery', 'Cakes & Sweets', 'Tea & Sparkle', 'Finger Food',
];

// ─── MenuFormFields component (shared by Add & Edit modals) ─────────────────
interface MenuFormFieldsProps {
  name: string; setName: (v: string) => void;
  nameEn: string; setNameEn: (v: string) => void;
  category: 'food' | 'drinks' | 'dessert' | 'snack'; setCategory: (v: any) => void;
  subCategory: string; setSubCategory: (v: string) => void;
  variantPreset: 'drinks' | 'food' | 'snack' | 'dessert' | 'none'; setVariantPreset: (v: any) => void;
  price: string; setPrice: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  descriptionEn: string; setDescriptionEn: (v: string) => void;
  image: string; setImage: (v: string) => void;
}

function MenuFormFields({
  name, setName, nameEn, setNameEn, category, setCategory,
  subCategory, setSubCategory, variantPreset, setVariantPreset,
  price, setPrice, description, setDescription, descriptionEn, setDescriptionEn,
  image, setImage,
}: MenuFormFieldsProps) {
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 no-scrollbar">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nama (ID) *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kopi Susu Aren..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Name (EN)</label>
          <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Palm Sugar Latte..." className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Kategori Utama *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            <option value="food">Makanan</option>
            <option value="drinks">Minuman</option>
            <option value="snack">Snack</option>
            <option value="dessert">Dessert</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Preset Varian</label>
          <select value={variantPreset} onChange={(e) => setVariantPreset(e.target.value)} className={inputCls}>
            <option value="drinks">Minuman (Gula & Es)</option>
            <option value="food">Makanan (Pedas & Telur)</option>
            <option value="snack">Cemilan (Saus)</option>
            <option value="dessert">Dessert (Topping)</option>
            <option value="none">Tanpa Varian</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Sub-Kategori</label>
        <input
          type="text"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          placeholder="Coffee, Rice Bowl, Pastry..."
          className={`${inputCls} mb-2`}
        />
        <div className="flex flex-wrap gap-1.5">
          {SUB_CATEGORY_PRESETS.map((sc) => {
            const isSelected = subCategory === sc;
            return (
              <button
                key={sc}
                type="button"
                onClick={() => setSubCategory(isSelected ? '' : sc)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {isSelected && <span className="text-[9px] font-black">✓</span>}
                <span>{sc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls}>Harga (Rp) *</label>
        <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="35000" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Deskripsi (ID)</label>
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat menu..." className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Description (EN)</label>
        <textarea rows={2} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Short menu description..." className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>URL Gambar</label>
        <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className={inputCls} />
        {image && (
          <div className="mt-2 w-full h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
            <Image src={image} alt="Preview" fill className="object-cover" unoptimized onError={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminCmsApp() {
  const {
    language, menu, orders,
    toggleProductAvailability, addNewMenuItem, updateMenuItem, deleteMenuItem,
    storeSettings, updateStoreSettings, isDbConnected,
  } = useApp();
  const t = TRANSLATIONS[language].manager;

  type AdminTab = 'dashboard' | 'menu_master' | 'orders_log' | 'qr_generator' | 'vouchers' | 'store_settings';
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Vouchers state
  const [vouchersList, setVouchersList] = useState<any[]>([
    { id: 'v1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minSpend: 30000, desc: 'Diskon 10% khusus pengunjung baru' },
    { id: 'v2', code: 'HEMAT20', type: 'PERCENTAGE', value: 20, minSpend: 50000, desc: 'Diskon 20% hemat banget' },
    { id: 'v3', code: 'MYCASHIER50', type: 'FLAT', value: 25000, minSpend: 100000, desc: 'Potongan Rp 25.000 makan bersama' },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isTableMapOpen, setIsTableMapOpen] = useState(false);
  const [isAiBriefingOpen, setIsAiBriefingOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  // Shared form state (used by both Add & Edit modals)
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<'food' | 'drinks' | 'dessert' | 'snack'>('food');
  const [subCategory, setSubCategory] = useState('');
  const [variantPreset, setVariantPreset] = useState<'drinks' | 'food' | 'snack' | 'dessert' | 'none'>('food');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [image, setImage] = useState('');

  // Store settings form state
  const [settingsName, setSettingsName] = useState(storeSettings.name);
  const [settingsLogoUrl, setSettingsLogoUrl] = useState(storeSettings.logoUrl);
  const [settingsAddress, setSettingsAddress] = useState(storeSettings.address);
  const [settingsTaxRate, setSettingsTaxRate] = useState(String(storeSettings.taxRate));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Compute top menu from real order data
  const menuSalesMap: Record<string, { name: string; count: number }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!menuSalesMap[item.productId]) {
        menuSalesMap[item.productId] = { name: item.productName, count: 0 };
      }
      menuSalesMap[item.productId].count += item.quantity;
    });
  });
  const topMenu = Object.values(menuSalesMap).sort((a, b) => b.count - a.count)[0];

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  const resetForm = () => {
    setName(''); setNameEn(''); setCategory('food'); setSubCategory('');
    setVariantPreset('food'); setPrice(''); setDescription('');
    setDescriptionEn(''); setImage('');
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setNameEn(item.nameEn ?? '');
    setCategory(item.category);
    setSubCategory(item.subCategory ?? '');
    setVariantPreset(item.variantPreset ?? 'none');
    setPrice(String(item.price));
    setDescription(item.description);
    setDescriptionEn(item.descriptionEn ?? '');
    setImage(item.image);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    await addNewMenuItem({
      name, nameEn: nameEn || name, category,
      subCategory: subCategory || undefined, variantPreset,
      price: Number(price),
      description: description || 'Menu berkualitas pilihan restoran.',
      descriptionEn: descriptionEn || description || 'Quality restaurant selected menu.',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true, isPopular: false,
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !name || !price) return;
    await updateMenuItem(editingItem.id, {
      name, nameEn: nameEn || name, category,
      subCategory: subCategory || undefined, variantPreset,
      price: Number(price), description, descriptionEn, image,
    });
    setEditingItem(null);
    resetForm();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    await updateStoreSettings({
      name: settingsName,
      logoUrl: settingsLogoUrl,
      address: settingsAddress,
      taxRate: Number(settingsTaxRate),
    });
    setSettingsSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleCopyQrLink = (tableName: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mycashier-five.vercel.app';
    const link = `${origin}/?table=${encodeURIComponent(tableName)}`;
    navigator.clipboard.writeText(link);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = ['ID Transaksi', 'No. Meja', 'Nama Pelanggan', 'Total (Rp)', 'Status Pembayaran', 'Metode Bayar', 'Status Pesanan', 'Waktu', 'Rincian Menu'];
    const rows = orders.map((o) => [
      o.id,
      o.tableNumber,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.totalAmount,
      o.paymentStatus,
      o.paymentMethod,
      o.status,
      o.createdAt,
      `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Transaksi_MyCashier_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* DB Connection Indicator */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isDbConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
          }`}>
            {isDbConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isDbConnected ? 'PostgreSQL Connected' : 'In-Memory Mode'}</span>
          </div>

          <button
            onClick={() => setIsAiBriefingOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
            <span>AI Daily Briefing</span>
          </button>

          <button
            onClick={() => setIsTableMapOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Denah Meja &amp; QR Standee</span>
          </button>

          <button
            onClick={() => setIsInventoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Stok &amp; Bahan Baku</span>
          </button>

          <button
            onClick={() => { setIsAddModalOpen(true); resetForm(); }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'dashboard', label: 'Ringkasan Omzet', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'menu_master', label: `Master Menu (${menu.length})`, icon: <Package className="w-4 h-4" /> },
          { id: 'qr_generator', label: 'QR Code Meja', icon: <QrCode className="w-4 h-4 text-emerald-500" /> },
          { id: 'orders_log', label: `Log Transaksi (${orders.length})`, icon: <Layers className="w-4 h-4" /> },
          { id: 'vouchers', label: `Kupon Promo (${vouchersList.length})`, icon: <Tag className="w-4 h-4 text-amber-500" /> },
          { id: 'store_settings', label: 'Pengaturan Toko', icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
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
              <p className="text-[10px] text-slate-400 mt-1">dari {paidOrders.length} transaksi lunas</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                <span>Transaksi Lunas</span>
                <ShoppingBag className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {paidOrders.length} Pesanan
              </div>
              <p className="text-[10px] text-slate-400 mt-1">dari {orders.length} total pesanan</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                <span>Menu Terlaris</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
                {topMenu ? topMenu.name : '—'}
              </div>
              {topMenu && (
                <p className="text-[10px] text-slate-400 mt-1">{topMenu.count}x terjual</p>
              )}
            </div>
          </div>

          {/* Interactive Recharts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Bar Chart (2 cols) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span>Tren Pendapatan Resto (7 Hari Terakhir)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Statistik estimasi omzet harian berdasarkan pesanan lunas</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                  Realtime Sync
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { day: 'Sen', revenue: Math.round(totalRevenue * 0.35) || 120000 },
                    { day: 'Sel', revenue: Math.round(totalRevenue * 0.55) || 180000 },
                    { day: 'Rab', revenue: Math.round(totalRevenue * 0.45) || 150000 },
                    { day: 'Kam', revenue: Math.round(totalRevenue * 0.75) || 240000 },
                    { day: 'Jum', revenue: Math.round(totalRevenue * 0.85) || 270000 },
                    { day: 'Sab', revenue: Math.round(totalRevenue * 1.15) || 360000 },
                    { day: 'Hari Ini', revenue: totalRevenue || 300000 },
                  ]}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${(val/1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omzet']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Breakdown Pie Chart (1 col) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-cyan-500" />
                    <span>Distribusi Metode Bayar</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Persentase transaksi CASH vs QRIS vs EDC</p>
                </div>
              </div>

              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'CASH', value: orders.filter((o) => o.paymentMethod === 'CASH').length || 3, color: '#10b981' },
                        { name: 'QRIS', value: orders.filter((o) => o.paymentMethod === 'QRIS').length || 5, color: '#06b6d4' },
                        { name: 'EDC Card', value: orders.filter((o) => o.paymentMethod === 'DEBIT').length || 1, color: '#6366f1' },
                      ]}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {['#10b981', '#06b6d4', '#6366f1'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400">CASH</div>
                  <div className="text-xs font-black text-emerald-500">
                    {orders.filter((o) => o.paymentMethod === 'CASH').length}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400">QRIS</div>
                  <div className="text-xs font-black text-cyan-500">
                    {orders.filter((o) => o.paymentMethod === 'QRIS').length}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400">EDC</div>
                  <div className="text-xs font-black text-indigo-500">
                    {orders.filter((o) => o.paymentMethod === 'DEBIT').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DB Status Card */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            isDbConnected
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}>
            <Database className="w-4 h-4 flex-shrink-0" />
            <div>
              {isDbConnected
                ? '✅ Data tersimpan di PostgreSQL (Neon). Menu & pesanan baru akan persist setelah refresh.'
                : '⚠️ Berjalan dalam mode in-memory. Tambahkan DATABASE_URL di .env.local untuk persistensi data penuh.'}
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

              <div className="flex flex-col items-end gap-1.5">
                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                  title="Edit Menu"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {/* Availability Toggle */}
                <button
                  onClick={() => toggleProductAvailability(item.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap ${
                    item.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.isAvailable ? 'Tersedia' : 'Stok Habis'}
                </button>
                {/* Delete Button */}
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  title="Hapus Menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TABLE QR CODE GENERATOR */}
      {activeTab === 'qr_generator' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm mb-1">
                <QrCode className="w-5 h-5" />
                <span>Generator QR Code Meja Fisik</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tempel QR Standee ini di meja restoran. Scan QR → URL otomatis terkunci ke nomor meja!
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
                      <Image src={qrImageUrl} alt={`QR Code ${tableNum}`} width={160} height={160} className="object-contain w-full h-full" unoptimized />
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 truncate px-2">{targetUrl}</p>
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
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Riwayat Semua Pesanan ({orders.length})</h3>
              <p className="text-[10px] text-slate-400">Unduh data laporan transaksi dalam format file CSV / Excel</p>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={orders.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Laporan</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">Belum ada transaksi.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{order.id} — {order.tableNumber} ({order.customerName})</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{order.createdAt} • {order.paymentMethod}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{order.items.length} item(s)</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-500">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {order.paymentStatus}
                  </span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                    order.status === 'SERVED' || order.status === 'COMPLETED'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      : order.status === 'READY'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : order.status === 'COOKING'
                      ? 'bg-cyan-500/10 text-cyan-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: VOUCHERS PROMO MANAGER */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Pengelolaan Kupon Diskon Resto</h3>
                  <p className="text-[10px] text-slate-400">Atur kode promo aktif yang dapat digunakan pelanggan & kasir</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vouchersList.map((v) => (
                <div key={v.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-black uppercase tracking-wider">
                      {v.code}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                      {v.type === 'PERCENTAGE' ? `Diskon ${v.value}%` : `Potongan Rp ${v.value.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                    {v.desc}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <span>Min. Belanja:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Rp {(v.minSpend || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'store_settings' && (
        <div className="max-w-lg">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Pengaturan Toko</h3>
                <p className="text-[10px] text-slate-400">Konfigurasi nama, pajak, dan profil restoran</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className={labelCls}>
                  <Store className="w-3 h-3 inline mr-1" />
                  Nama Toko / Restoran
                </label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="MyCashier Resto"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Alamat Toko
                </label>
                <input
                  type="text"
                  value={settingsAddress}
                  onChange={(e) => setSettingsAddress(e.target.value)}
                  placeholder="Jl. Raya No. 1, Jakarta"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <Percent className="w-3 h-3 inline mr-1" />
                  Persentase Pajak Resto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settingsTaxRate}
                  onChange={(e) => setSettingsTaxRate(e.target.value)}
                  placeholder="10"
                  className={inputCls}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Pajak {settingsTaxRate}% akan ditambahkan ke setiap transaksi (subtotal × {(1 + Number(settingsTaxRate)/100).toFixed(2)})
                </p>
              </div>

              <div>
                <label className={labelCls}>URL Logo Toko</label>
                <input
                  type="text"
                  value={settingsLogoUrl}
                  onChange={(e) => setSettingsLogoUrl(e.target.value)}
                  placeholder="/icon.jpg atau https://..."
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  settingsSaved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 hover:bg-slate-800'
                }`}
              >
                {settingsSaved ? (
                  <><Check className="w-4 h-4" /> Pengaturan Tersimpan!</>
                ) : settingsSaving ? (
                  <span>Menyimpan...</span>
                ) : (
                  <><Settings className="w-4 h-4" /> Simpan Pengaturan Toko</>
                )}
              </button>
            </form>
          </div>

          {/* DB info */}
          <div className={`p-3 rounded-2xl border text-[10px] flex items-start gap-2 ${
            isDbConnected
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}>
            <Database className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {isDbConnected
                ? 'Pengaturan disimpan ke PostgreSQL (Neon) dan persist setelah refresh.'
                : 'Mode in-memory: pengaturan hilang saat refresh. Tambahkan DATABASE_URL ke .env.local.'}
            </span>
          </div>
        </div>
      )}

      {/* ─── ADD MENU MODAL ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Menu Master Resto</h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <MenuFormFields
              name={name} setName={setName} nameEn={nameEn} setNameEn={setNameEn}
              category={category} setCategory={setCategory} subCategory={subCategory} setSubCategory={setSubCategory}
              variantPreset={variantPreset} setVariantPreset={setVariantPreset}
              price={price} setPrice={setPrice} description={description} setDescription={setDescription}
              descriptionEn={descriptionEn} setDescriptionEn={setDescriptionEn}
              image={image} setImage={setImage}
            />

            <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all">
              Simpan Menu Baru ke Master Data
            </button>
          </form>
        </div>
      )}

      {/* ─── EDIT MENU MODAL ────────────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Menu</h3>
                  <p className="text-[10px] text-slate-400">{editingItem.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setEditingItem(null); resetForm(); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <MenuFormFields
              name={name} setName={setName} nameEn={nameEn} setNameEn={setNameEn}
              category={category} setCategory={setCategory} subCategory={subCategory} setSubCategory={setSubCategory}
              variantPreset={variantPreset} setVariantPreset={setVariantPreset}
              price={price} setPrice={setPrice} description={description} setDescription={setDescription}
              descriptionEn={descriptionEn} setDescriptionEn={setDescriptionEn}
              image={image} setImage={setImage}
            />

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setEditingItem(null); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Stock Manager Modal */}
      <InventoryManagerModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
      />

      {/* Table Floor Map & QR Standee Modal */}
      <TableMapModal
        isOpen={isTableMapOpen}
        onClose={() => setIsTableMapOpen(false)}
        orders={orders}
      />

      {/* Executive AI Daily Sales Briefing Modal */}
      <AiBriefingModal
        isOpen={isAiBriefingOpen}
        onClose={() => setIsAiBriefingOpen(false)}
        orders={orders}
        totalRevenue={totalRevenue}
      />
    </div>
  );
}
