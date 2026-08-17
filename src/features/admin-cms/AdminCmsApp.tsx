'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { MenuItem, InventoryItem, INITIAL_INVENTORY } from '@/data/initialData';
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
  ArrowRightLeft,
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
  Receipt,
  Calculator,
  Eye,
  History,
  RefreshCw,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertTriangle,
  Building2,
  Truck,
  TrendingDown,
} from 'lucide-react';

import { calculateOrderTotals, CashRoundingRule, formatRupiah } from '@/lib/taxEngine';
import { AuditLogEntry } from '@/lib/audit';
import { TransferRecord } from '@/lib/inventoryEngine';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminMobileDrawer from './components/AdminMobileDrawer';
import { AdminTabId, getAdminNavCategories } from './components/AdminNavConfig';
import InventoryManagerModal from './InventoryManagerModal';
import TableMapModal from './TableMapModal';
import AiBriefingModal from './AiBriefingModal';
import AuditDiffModal from './AuditDiffModal';
import TransferHubModal from './TransferHubModal';

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
            <option value="drinks">Minuman (Gula &amp; Es)</option>
            <option value="food">Makanan (Pedas &amp; Telur)</option>
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

// ─── Main Admin CMS Container ───────────────────────────────────────────────
export default function AdminCmsApp() {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    authSession,
    logout,
    menu,
    orders,
    toggleProductAvailability,
    addNewMenuItem,
    updateMenuItem,
    deleteMenuItem,
    storeSettings,
    updateStoreSettings,
    isDbConnected,
    tenants,
    activeTenant,
    setActiveTenant,
    registerNewTenant,
    branches,
    activeBranch,
    setActiveBranch,
  } = useApp();

  const isEn = language.toLowerCase() === 'en';

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isTransferHubOpen, setIsTransferHubOpen] = useState(false);
  const [isTableMapOpen, setIsTableMapOpen] = useState(false);
  const [isAiBriefingOpen, setIsAiBriefingOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  // Multi-Tenant New Store Form State
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    city: 'Jakarta Pusat',
    plan: 'PRO' as 'FREE' | 'PRO' | 'ENTERPRISE',
  });

  // Vouchers state
  const [vouchersList, setVouchersList] = useState<any[]>([
    { id: 'v1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minSpend: 30000, desc: 'Diskon 10% khusus pengunjung baru' },
    { id: 'v2', code: 'HEMAT20', type: 'PERCENTAGE', value: 20, minSpend: 50000, desc: 'Diskon 20% hemat banget' },
    { id: 'v3', code: 'MYCASHIER50', type: 'FLAT', value: 25000, minSpend: 100000, desc: 'Potongan Rp 25.000 makan bersama' },
  ]);
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    value: 10,
    minSpend: 50000,
    desc: '',
  });

  // Security Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState('ALL');
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLogEntry | null>(null);

  // Inventory & Transfer State for embedded tabs
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranch?.id || 'b-1');

  const [transfersList, setTransfersList] = useState<TransferRecord[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState('ALL');

  // Shared menu form state (used by both Add & Edit modals)
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
  const [settingsTaxRate, setSettingsTaxRate] = useState(String(storeSettings.taxRate ?? 10));
  const [settingsServiceChargeRate, setSettingsServiceChargeRate] = useState(String(storeSettings.serviceChargeRate ?? 5));
  const [settingsEnableTax, setSettingsEnableTax] = useState(storeSettings.enableTax ?? true);
  const [settingsEnableServiceCharge, setSettingsEnableServiceCharge] = useState(storeSettings.enableServiceCharge ?? true);
  const [settingsCashRoundingRule, setSettingsCashRoundingRule] = useState<CashRoundingRule>(storeSettings.cashRoundingRule ?? 'NONE');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [simulatedSubtotal, setSimulatedSubtotal] = useState(100000);

  // Menu Search & Filter in menu_master tab
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');

  // Orders Log Search & Filter
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('ALL');

  useEffect(() => {
    setSettingsName(storeSettings.name);
    setSettingsLogoUrl(storeSettings.logoUrl);
    setSettingsAddress(storeSettings.address);
    setSettingsTaxRate(String(storeSettings.taxRate ?? 10));
    setSettingsServiceChargeRate(String(storeSettings.serviceChargeRate ?? 5));
    setSettingsEnableTax(storeSettings.enableTax ?? true);
    setSettingsEnableServiceCharge(storeSettings.enableServiceCharge ?? true);
    setSettingsCashRoundingRule(storeSettings.cashRoundingRule ?? 'NONE');
  }, [storeSettings]);

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditSearch) params.set('search', auditSearch);
      if (auditRoleFilter !== 'ALL') params.set('userRole', auditRoleFilter);
      if (auditActionFilter !== 'ALL') params.set('actionType', auditActionFilter);
      if (auditStatusFilter !== 'ALL') params.set('status', auditStatusFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Inventory for active branch
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch(`/api/inventory?branchId=${selectedBranchId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setInventoryItems(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch Transfers
  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const res = await fetch('/api/inventory/transfers');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setTransfersList(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [auditSearch, auditRoleFilter, auditActionFilter, auditStatusFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else if (activeTab === 'transfers') {
      fetchTransfers();
    }
  }, [activeTab, selectedBranchId]);

  // Calculations & Analytics
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

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

  const lowStockCount = inventoryItems.filter((it) => it.stock <= it.minThreshold).length;
  const pendingTransfersCount = transfersList.filter(
    (t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'IN_TRANSIT'
  ).length;

  // Nav taxonomy with dynamic badge counts
  const categories = getAdminNavCategories({
    menuCount: menu.length,
    ordersCount: orders.length,
    vouchersCount: vouchersList.length,
    inventoryAlertCount: lowStockCount > 0 ? lowStockCount : undefined,
    pendingTransfersCount: pendingTransfersCount > 0 ? pendingTransfersCount : undefined,
    auditLogsCount: auditLogs.length > 0 ? auditLogs.length : undefined,
  });

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
      serviceChargeRate: Number(settingsServiceChargeRate),
      enableTax: settingsEnableTax,
      enableServiceCharge: settingsEnableServiceCharge,
      cashRoundingRule: settingsCashRoundingRule,
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

  const handleAdjustStock = async (itemId: string, delta: number) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_STOCK',
          branchId: selectedBranchId,
          itemId,
          delta,
          reason: 'Manual adjustment from Enterprise Admin CMS',
        }),
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const handleTransferAction = async (transferId: string, action: string) => {
    try {
      const res = await fetch(`/api/inventory/transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: authSession?.userId || 'admin-user',
          userName: authSession?.name || 'Admin Resto',
          userRole: authSession?.role || 'admin',
        }),
      });
      if (res.ok) {
        fetchTransfers();
        fetchInventory();
      }
    } catch (err) {
      console.error('Failed to update transfer:', err);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

  // Filtered menu for menu_master tab
  const filteredMenu = menu.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(menuSearch.toLowerCase())) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchCategory = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
    return matchSearch && matchCategory;
  });

  // Filtered orders for orders_log tab
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(ordersSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(ordersSearch.toLowerCase()) ||
      order.tableNumber.toLowerCase().includes(ordersSearch.toLowerCase());
    const matchStatus =
      ordersStatusFilter === 'ALL' ||
      order.paymentStatus === ordersStatusFilter ||
      order.status === ordersStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered inventory for inventory tab
  const filteredInventory = inventoryItems.filter((it) => {
    const matchSearch =
      it.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (it.nameEn && it.nameEn.toLowerCase().includes(inventorySearch.toLowerCase()));
    const matchCat = inventoryCategoryFilter === 'all' || it.category === inventoryCategoryFilter;
    return matchSearch && matchCat;
  });

  const BRANCH_NAMES: Record<string, string> = {
    'b-1': 'Cabang Jakarta Pusat',
    'b-2': 'Cabang Bandung Dago',
    'b-3': 'Cabang Bali Seminyak',
    'branch-jkt': 'Cabang Jakarta Pusat',
    'branch-bdg': 'Cabang Bandung Dago',
    'branch-bali': 'Cabang Bali Seminyak',
  };

  // Filtered transfers for transfers tab
  const filteredTransfers = transfersList.filter((tr) => {
    const matchSearch =
      tr.id.toLowerCase().includes(transferSearch.toLowerCase()) ||
      tr.transferNumber.toLowerCase().includes(transferSearch.toLowerCase()) ||
      (tr.requestedBy && tr.requestedBy.toLowerCase().includes(transferSearch.toLowerCase())) ||
      (tr.notes && tr.notes.toLowerCase().includes(transferSearch.toLowerCase()));
    const matchStatus = transferStatusFilter === 'ALL' || tr.status === transferStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ─── 1. COLLAPSIBLE ENTERPRISE SIDEBAR ─────────────────────────────── */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        language={language}
        tenantName={activeTenant?.name || 'MyCashier Resto'}
        authSession={authSession}
        onLogout={logout}
        categories={categories}
      />

      {/* ─── 2. RESPONSIVE MOBILE SLIDE-OVER DRAWER ────────────────────────── */}
      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        language={language}
        tenantName={activeTenant?.name || 'MyCashier Resto'}
        authSession={authSession}
        onLogout={logout}
        categories={categories}
      />

      {/* ─── 3. WORKSPACE CONTAINER (HEADER + PADDED CONTENT CANVAS) ───────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <AdminHeader
          activeTab={activeTab}
          categories={categories}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          language={language}
          onToggleLanguage={toggleLanguage}
          theme={theme}
          onToggleTheme={toggleTheme}
          isDbConnected={isDbConnected}
          activeTenant={activeTenant}
          tenants={tenants}
          onSelectTenant={setActiveTenant}
          activeBranch={activeBranch}
          branches={branches}
          onSelectBranch={setActiveBranch}
          onOpenAiBriefing={() => setIsAiBriefingOpen(true)}
          onOpenTableMap={() => setIsTableMapOpen(true)}
          onOpenNewStoreModal={() => setIsNewStoreModalOpen(true)}
          onOpenAddMenuModal={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          onLogout={logout}
        />

        {/* Padded Content Canvas */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-950 p-4 md:p-8 no-scrollbar pb-28">
          {/* ──────────────────────────────────────────────────────────────────
              TAB 1: DASHBOARD & ANALYTICS
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Total Revenue (Paid)' : 'Total Omzet Lunas'}</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isEn ? `from ${paidOrders.length} paid orders` : `dari ${paidOrders.length} transaksi lunas`}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Paid Transactions' : 'Transaksi Lunas'}</span>
                    <ShoppingBag className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {paidOrders.length} {isEn ? 'Orders' : 'Pesanan'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isEn ? `out of ${orders.length} total orders` : `dari ${orders.length} total pesanan`}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Best Selling Menu' : 'Menu Terlaris'}</span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {topMenu ? topMenu.name : '—'}
                  </div>
                  {topMenu && (
                    <p className="text-[10px] text-slate-400 mt-1">{topMenu.count}x {isEn ? 'sold' : 'terjual'}</p>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Active Catalog Items' : 'Total Menu Aktif'}</span>
                    <Package className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {menu.length} <span className="text-xs font-bold text-slate-400">{isEn ? 'items' : 'item'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {menu.filter((m) => m.isAvailable).length} {isEn ? 'available now' : 'tersedia saat ini'}
                  </p>
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
                        <span>{isEn ? 'Restaurant Revenue Trend (Last 7 Days)' : 'Tren Pendapatan Resto (7 Hari Terakhir)'}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {isEn ? 'Daily gross revenue estimation from paid transactions' : 'Statistik estimasi omzet harian berdasarkan pesanan lunas'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                      Realtime Sync
                    </span>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { day: isEn ? 'Mon' : 'Sen', revenue: Math.round(totalRevenue * 0.35) || 120000 },
                        { day: isEn ? 'Tue' : 'Sel', revenue: Math.round(totalRevenue * 0.55) || 180000 },
                        { day: isEn ? 'Wed' : 'Rab', revenue: Math.round(totalRevenue * 0.45) || 150000 },
                        { day: isEn ? 'Thu' : 'Kam', revenue: Math.round(totalRevenue * 0.75) || 240000 },
                        { day: isEn ? 'Fri' : 'Jum', revenue: Math.round(totalRevenue * 0.85) || 270000 },
                        { day: isEn ? 'Sat' : 'Sab', revenue: Math.round(totalRevenue * 1.15) || 360000 },
                        { day: isEn ? 'Today' : 'Hari Ini', revenue: totalRevenue || 300000 },
                      ]}>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${(val/1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, isEn ? 'Revenue' : 'Omzet']}
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
                        <span>{isEn ? 'Payment Methods Split' : 'Distribusi Metode Bayar'}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {isEn ? 'Percentage of CASH vs QRIS vs EDC transactions' : 'Persentase transaksi CASH vs QRIS vs EDC'}
                      </p>
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

              {/* DB Status Banner Card */}
              <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                isDbConnected
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}>
                <Database className="w-4 h-4 flex-shrink-0" />
                <div>
                  {isDbConnected
                    ? (isEn ? '✅ Connected to PostgreSQL (Neon). All menu, orders, and configuration persist permanently.' : '✅ Data tersimpan di PostgreSQL (Neon). Menu & pesanan baru akan persist permanen.')
                    : (isEn ? '⚠️ Running in in-memory mode. Add DATABASE_URL to your environment for full persistence.' : '⚠️ Berjalan dalam mode in-memory. Tambahkan DATABASE_URL di .env.local untuk persistensi data penuh.')}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 2: ORDERS LOG (TRANSACTIONS & EXPORT CSV)
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'orders_log' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-500" />
                    <span>{isEn ? `Transaction History (${orders.length})` : `Riwayat Semua Pesanan (${orders.length})`}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEn ? 'Download report records in Excel / CSV spreadsheet format' : 'Unduh data laporan transaksi dalam format file CSV / Excel'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={handleExportCsv}
                    disabled={orders.length === 0}
                    className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isEn ? 'Export CSV Report' : 'Ekspor CSV Laporan'}</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder={isEn ? 'Search by Order ID, Table, Customer...' : 'Cari ID Transaksi, Meja, Nama Pelanggan...'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={ordersStatusFilter}
                  onChange={(e) => setOrdersStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
                  <option value="PAID">PAID (Lunas)</option>
                  <option value="UNPAID">UNPAID (Belum Bayar)</option>
                  <option value="COOKING">COOKING (Sedang Dimasak)</option>
                  <option value="READY">READY (Siap Saji)</option>
                  <option value="SERVED">SERVED (Tersaji)</option>
                </select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  {isEn ? 'No transaction records found.' : 'Belum ada transaksi ditemukan.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {order.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {order.tableNumber}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            ({order.customerName})
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-2">
                          <span>{order.createdAt}</span>
                          <span>•</span>
                          <span className="font-semibold">{order.paymentMethod}</span>
                          <span>•</span>
                          <span>{order.items.length} item(s)</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xl">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'SERVED' || order.status === 'COMPLETED'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              : order.status === 'READY'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : order.status === 'COOKING'
                              ? 'bg-cyan-500/15 text-cyan-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 3: MASTER MENU CRUD
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'menu_master' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header bar with filters & Add button */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-500" />
                    <span>{isEn ? `Master Menu & Catalog (${menu.length})` : `Master Menu & Katalog Resto (${menu.length})`}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEn ? 'Manage prices, food availability status, photos & presets' : 'Kelola harga, status ketersediaan makanan, foto & preset'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                    className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isEn ? 'Add New Menu' : 'Tambah Menu Baru'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Pills */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder={isEn ? 'Search menu name, sub-category...' : 'Cari nama menu, sub-kategori...'}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: isEn ? 'All' : 'Semua' },
                    { id: 'food', label: isEn ? 'Food' : 'Makanan' },
                    { id: 'drinks', label: isEn ? 'Drinks' : 'Minuman' },
                    { id: 'snack', label: 'Snack' },
                    { id: 'dessert', label: 'Dessert' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setMenuCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        menuCategoryFilter === cat.id
                          ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                        <Image src={item.image} alt={item.name} width={60} height={60} className="object-cover w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                        {item.nameEn && <p className="text-[10px] text-slate-400 italic truncate">{item.nameEn}</p>}
                        <div className="text-emerald-600 dark:text-emerald-400 text-xs font-black mt-0.5">
                          Rp {item.price.toLocaleString('id-ID')}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {item.category}
                          </span>
                          {item.subCategory && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate max-w-[100px]">
                              {item.subCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                          title={isEn ? 'Edit Menu' : 'Edit Menu'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          title={isEn ? 'Delete Menu' : 'Hapus Menu'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleProductAvailability(item.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                          item.isAvailable
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {item.isAvailable ? (isEn ? 'Available' : 'Tersedia') : (isEn ? 'Sold Out' : 'Stok Habis')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 4: VOUCHERS PROMO MANAGER
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {isEn ? `Promotional Vouchers (${vouchersList.length})` : `Pengelolaan Kupon Diskon Resto (${vouchersList.length})`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isEn ? 'Manage active coupon codes usable by self-ordering customers & POS cashiers' : 'Atur kode promo aktif yang dapat digunakan pelanggan & kasir POS'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddVoucher(!showAddVoucher)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEn ? 'Add Voucher' : 'Tambah Kupon Baru'}</span>
                </button>
              </div>

              {/* Add Voucher Inline Form */}
              {showAddVoucher && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newVoucherForm.code) return;
                    setVouchersList([
                      ...vouchersList,
                      {
                        id: `v-${Date.now()}`,
                        code: newVoucherForm.code.toUpperCase(),
                        type: newVoucherForm.type,
                        value: Number(newVoucherForm.value),
                        minSpend: Number(newVoucherForm.minSpend),
                        desc: newVoucherForm.desc || 'Promo Diskon Restoran',
                      },
                    ]);
                    setShowAddVoucher(false);
                    setNewVoucherForm({ code: '', type: 'PERCENTAGE', value: 10, minSpend: 50000, desc: '' });
                  }}
                  className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-in fade-in"
                >
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                    {isEn ? 'Create New Promo Voucher' : 'Buat Kupon Promo Baru'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className={labelCls}>Kode Voucher *</label>
                      <input
                        type="text"
                        required
                        value={newVoucherForm.code}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, code: e.target.value.toUpperCase() })}
                        placeholder="Contoh: MERDEKA45"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Tipe Diskon</label>
                      <select
                        value={newVoucherForm.type}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, type: e.target.value as any })}
                        className={inputCls}
                      >
                        <option value="PERCENTAGE">Persentase (%)</option>
                        <option value="FLAT">Nominal Flat (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Nilai Diskon *</label>
                      <input
                        type="number"
                        required
                        value={newVoucherForm.value}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, value: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Min. Belanja (Rp)</label>
                      <input
                        type="number"
                        value={newVoucherForm.minSpend}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, minSpend: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Deskripsi Singkat</label>
                    <input
                      type="text"
                      value={newVoucherForm.desc}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, desc: e.target.value })}
                      placeholder="Diskon spesial merayakan hari kemerdekaan..."
                      className={inputCls}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddVoucher(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Simpan Kupon
                    </button>
                  </div>
                </form>
              )}

              {/* Vouchers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vouchersList.map((v) => (
                  <div key={v.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-mono font-black uppercase tracking-wider">
                        {v.code}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10">
                        {v.type === 'PERCENTAGE' ? `Diskon ${v.value}%` : `Potongan Rp ${v.value.toLocaleString('id-ID')}`}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                      {v.desc}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span>Min. Belanja:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Rp {(v.minSpend || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 5: TABLE QR CODE GENERATOR (STANDEE)
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'qr_generator' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm mb-1">
                    <QrCode className="w-5 h-5" />
                    <span>{isEn ? 'Physical Table QR Standee Generator' : 'Generator QR Code Meja Fisik'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {isEn ? 'Stick these QR Standees on dining tables. Customers scan → URL automatically locks to the table number!' : 'Tempel QR Standee ini di meja restoran. Scan QR → URL otomatis terkunci ke nomor meja!'}
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 cursor-pointer flex-shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isEn ? 'Print All Table Standees' : 'Cetak Semua Standee Meja'}</span>
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
                        <p className="text-[10px] text-slate-400">
                          {isEn ? 'Scan for Self-Ordering' : 'Scan untuk Pesan Mandiri'}
                        </p>
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
                        <span>{isCopied ? (isEn ? 'Link Copied!' : 'Link Tersalin!') : (isEn ? 'Copy QR Link' : 'Salin Link QR')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 6: INVENTORY & STOCK MANAGEMENT (OPERATIONS)
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {isEn ? 'Stock & Raw Materials Control' : 'Manajemen Stok & Bahan Baku'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isEn ? 'Safety threshold alerts, real-time quantity adjustments & branch inventory' : 'Peringatan batas minimum stok, penyesuaian kuantitas & inventori cabang'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Branch selector for inventory */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIsInventoryModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Full Inventory Hub' : 'Kelola Lengkap'}</span>
                  </button>
                </div>
              </div>

              {/* Low stock alert banner if any */}
              {lowStockCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    {isEn
                      ? `Attention: ${lowStockCount} raw material item(s) are below safety minimum threshold!`
                      : `Perhatian: ${lowStockCount} bahan baku berada di bawah ambang batas minimum keselamatan!`}
                  </span>
                </div>
              )}

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder={isEn ? 'Search raw materials, packaging...' : 'Cari bahan baku, kemasan...'}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: isEn ? 'All' : 'Semua' },
                    { id: 'raw_material', label: isEn ? 'Raw Materials' : 'Bahan Baku' },
                    { id: 'beverage_base', label: isEn ? 'Beverage Base' : 'Sirup & Kopi' },
                    { id: 'packaging', label: isEn ? 'Packaging' : 'Kemasan & Cup' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setInventoryCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        inventoryCategoryFilter === cat.id
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Table */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">{isEn ? 'Item Name' : 'Nama Bahan Baku'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Category' : 'Kategori'}</th>
                        <th className="px-4 py-3.5 text-center">{isEn ? 'Current Stock' : 'Stok Saat Ini'}</th>
                        <th className="px-4 py-3.5 text-center">{isEn ? 'Safety Threshold' : 'Batas Aman'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Cost / Unit' : 'HPP / Unit'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Status' : 'Kondisi'}</th>
                        <th className="px-4 py-3.5 text-center">{isEn ? 'Quick Adjust' : 'Penyesuaian'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredInventory.map((item) => {
                        const isCritical = item.stock <= item.minThreshold;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                              {item.nameEn && <div className="text-[10px] text-slate-400 italic">{item.nameEn}</div>}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                                {item.stock}
                              </span>{' '}
                              <span className="text-[10px] text-slate-400">{item.unit}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                                {item.minThreshold} {item.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                              Rp {item.costPerUnit.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isCritical ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" /> {isEn ? 'Low Stock' : 'Menipis'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> {isEn ? 'Optimal' : 'Aman'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleAdjustStock(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 hover:text-rose-600 text-slate-700 dark:text-slate-300 font-black text-xs cursor-pointer transition-colors"
                                  title="Kurangi 1 unit"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-600 text-slate-700 dark:text-slate-300 font-black text-xs cursor-pointer transition-colors"
                                  title="Tambah 1 unit"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 7: INTER-BRANCH TRANSFERS (OPERATIONS)
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'transfers' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {isEn ? `Inter-Branch Transfer Hub (${transfersList.length})` : `Hub Transfer Stok Antar Cabang (${transfersList.length})`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isEn ? 'Manage shipment approvals, in-transit manifests & multi-outlet inventory rebalancing' : 'Kelola persetujuan pengiriman, manifest transit & rebalancing inventori outlet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTransferHubOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isEn ? 'Initiate Transfer' : 'Inisiasi Transfer Baru'}</span>
                  </button>
                </div>
              </div>

              {/* Transfer requests list */}
              <div className="space-y-3">
                {filteredTransfers.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    {isEn ? 'No transfer records found.' : 'Belum ada catatan transfer antar cabang.'}
                  </div>
                ) : (
                  filteredTransfers.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                            {tr.transferNumber || tr.id}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {tr.items && tr.items.length > 0
                              ? tr.items.map((it) => `${it.itemName || it.itemId} (${it.quantity} ${it.unit})`).join(', ')
                              : 'Transfer Item'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="text-slate-700 dark:text-slate-200 font-semibold">
                            {BRANCH_NAMES[tr.sourceBranchId] || tr.sourceBranchId}
                          </span>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-slate-700 dark:text-slate-200 font-semibold">
                            {BRANCH_NAMES[tr.destBranchId] || tr.destBranchId}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400">
                          {isEn ? 'Requested by:' : 'Diajukan oleh:'} {tr.requestedBy} • {tr.requestedAt}
                          {tr.notes && <span className="italic ml-2 font-medium">({tr.notes})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          tr.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : tr.status === 'IN_TRANSIT'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : tr.status === 'APPROVED'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : tr.status === 'CANCELLED' || tr.status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {tr.status}
                        </span>

                        {tr.status === 'PENDING' && (
                          <button
                            onClick={() => handleTransferAction(tr.id, 'APPROVE')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Approve' : 'Setujui'}</span>
                          </button>
                        )}

                        {tr.status === 'APPROVED' && (
                          <button
                            onClick={() => handleTransferAction(tr.id, 'SHIP')}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Ship Manifest' : 'Kirim Barang'}</span>
                          </button>
                        )}

                        {tr.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleTransferAction(tr.id, 'RECEIVE')}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Confirm Receipt' : 'Konfirmasi Terima'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 8: STORE SETTINGS & PB1 TAX CONFIGURATION
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'store_settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
              {/* Settings Form Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {isEn ? 'Store Settings & Tax (PB1)' : 'Pengaturan Toko & Pajak (PB1)'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isEn ? 'Configure restaurant profile, PB1 Restaurant Tax, Service Charge, and Cash Rounding Rules' : 'Konfigurasi profil restoran, PB1 Tax, Service Charge, dan Pembulatan Tunai'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-5">
                    {/* Store Profile Section */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3.5">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Store className="w-4 h-4 text-indigo-500" />
                        <span>{isEn ? 'Restaurant Profile' : 'Profil Restoran'}</span>
                      </div>

                      <div>
                        <label className={labelCls}>{isEn ? 'Store / Restaurant Name' : 'Nama Toko / Restoran'}</label>
                        <input
                          type="text"
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          placeholder="MyCashier Resto"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>{isEn ? 'Store / Outlet Address' : 'Alamat Toko / Outlet'}</label>
                        <input
                          type="text"
                          value={settingsAddress}
                          onChange={(e) => setSettingsAddress(e.target.value)}
                          placeholder="Jl. Raya No. 1, Jakarta"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>{isEn ? 'Logo Image URL' : 'URL Logo Toko'}</label>
                        <input
                          type="text"
                          value={settingsLogoUrl}
                          onChange={(e) => setSettingsLogoUrl(e.target.value)}
                          placeholder="/icon.jpg atau https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Tax & Fee Configuration Section */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-4">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Percent className="w-4 h-4 text-emerald-500" />
                        <span>{isEn ? 'Tax (PB1) & Service Charge' : 'Pajak (PB1) & Biaya Layanan'}</span>
                      </div>

                      {/* PB1 Tax Toggle & Input */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {isEn ? 'Restaurant Tax (PB1)' : 'Pajak Restoran (PB1)'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isEn ? 'Regional goods & services tax (PBJT F&B)' : 'Pajak Daerah Barang & Jasa Tertentu (PBJT F&B)'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsEnableTax(!settingsEnableTax)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              settingsEnableTax
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {settingsEnableTax ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                            <span>{settingsEnableTax ? (isEn ? 'Active' : 'Aktif') : (isEn ? 'Inactive' : 'Non-Aktif')}</span>
                          </button>
                        </div>

                        {settingsEnableTax && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {isEn ? 'PB1 Rate (%):' : 'Persentase PB1 (%):'}
                            </label>
                            <div className="flex-1 relative">
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
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Service Charge Toggle & Input */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {isEn ? 'Service Charge' : 'Biaya Layanan (Service Charge)'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isEn ? 'Hospitality staff & operational service fee' : 'Biaya servis restoran untuk staf & operasional'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsEnableServiceCharge(!settingsEnableServiceCharge)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              settingsEnableServiceCharge
                                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {settingsEnableServiceCharge ? <ToggleRight className="w-4 h-4 text-indigo-500" /> : <ToggleLeft className="w-4 h-4" />}
                            <span>{settingsEnableServiceCharge ? (isEn ? 'Active' : 'Aktif') : (isEn ? 'Inactive' : 'Non-Aktif')}</span>
                          </button>
                        </div>

                        {settingsEnableServiceCharge && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {isEn ? 'Service Fee (%):' : 'Persentase Servis (%):'}
                            </label>
                            <div className="flex-1 relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={settingsServiceChargeRate}
                                onChange={(e) => setSettingsServiceChargeRate(e.target.value)}
                                placeholder="5"
                                className={inputCls}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cash Rounding Rule Selector */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{isEn ? 'POS Cash Rounding Rule' : 'Aturan Pembulatan Kasir (Cash Rounding)'}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {isEn ? 'Fractional Coins' : 'Uang Pecahan'}
                          </span>
                        </label>
                        <select
                          value={settingsCashRoundingRule}
                          onChange={(e) => setSettingsCashRoundingRule(e.target.value as CashRoundingRule)}
                          className={inputCls}
                        >
                          <option value="NONE">Tanpa Pembulatan (Nominal Persis Rp 1)</option>
                          <option value="ROUND_100">Bulatkan ke 100 Terdekat (Contoh: 10.450 -&gt; 10.500)</option>
                          <option value="CEIL_100">Bulatkan ke Atas 100 (Ceil 100) (Contoh: 10.010 -&gt; 10.100)</option>
                          <option value="CEIL_500">Bulatkan ke Atas 500 (Ceil 500) (Contoh: 10.100 -&gt; 10.500)</option>
                          <option value="CEIL_1000">Bulatkan ke Atas 1.000 (Ceil 1.000) (Contoh: 10.200 -&gt; 11.000)</option>
                        </select>
                        <p className="text-[10px] text-slate-400">
                          {isEn ? 'Helps cashier prevent coin shortage during physical cash payment.' : 'Membantu kasir menghindari kekurangan koin saat pembayaran tunai.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className={`w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                        settingsSaved
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 hover:bg-slate-800'
                      }`}
                    >
                      {settingsSaved ? (
                        <><Check className="w-4 h-4" /> {isEn ? 'Settings Saved Successfully!' : 'Pengaturan Berhasil Disimpan!'}</>
                      ) : settingsSaving ? (
                        <span>{isEn ? 'Saving Configuration...' : 'Menyimpan Konfigurasi...'}</span>
                      ) : (
                        <><Settings className="w-4 h-4" /> {isEn ? 'Save Store Settings' : 'Simpan Perubahan Toko'}</>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Live Preview Calculation Simulation Card */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">Live Preview Simulasi</h4>
                        <p className="text-[10px] text-slate-400">Kalkulasi Pajak &amp; Biaya Realtime</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Dynamic Engine
                    </span>
                  </div>

                  {/* Sample Subtotal Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Simulasi Subtotal Menu:</span>
                      <span className="text-emerald-400 font-bold">{formatRupiah(simulatedSubtotal)}</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50000, 100000, 155550, 250000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimulatedSubtotal(val)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            simulatedSubtotal === val
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {val >= 1000 ? `${val / 1000}k` : val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      step="500"
                      value={simulatedSubtotal}
                      onChange={(e) => setSimulatedSubtotal(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Live Calculation Engine Output */}
                  {(() => {
                    const previewTotals = calculateOrderTotals(
                      simulatedSubtotal,
                      0,
                      {
                        taxRate: Number(settingsTaxRate),
                        serviceChargeRate: Number(settingsServiceChargeRate),
                        enableTax: settingsEnableTax,
                        enableServiceCharge: settingsEnableServiceCharge,
                        cashRoundingRule: settingsCashRoundingRule,
                      },
                      true
                    );

                    return (
                      <div className="space-y-2.5 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800 font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal Menu:</span>
                          <span className="text-slate-200">{formatRupiah(previewTotals.subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Service Charge ({previewTotals.serviceChargeRate}%):</span>
                          <span className={previewTotals.serviceChargeAmount > 0 ? 'text-indigo-400' : 'text-slate-600'}>
                            {formatRupiah(previewTotals.serviceChargeAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Dasar Pajak (DPP):</span>
                          <span className="text-slate-400">{formatRupiah(previewTotals.taxableAmount)}</span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Pajak Resto PB1 ({previewTotals.taxRate}%):</span>
                          <span className={previewTotals.taxAmount > 0 ? 'text-amber-400' : 'text-slate-600'}>
                            {formatRupiah(previewTotals.taxAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Total Sebelum Bulat:</span>
                          <span className="text-slate-300">{formatRupiah(previewTotals.rawTotal)}</span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Pembulatan ({settingsCashRoundingRule}):</span>
                          <span className={previewTotals.roundingAdjustment !== 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'}>
                            {previewTotals.roundingAdjustment > 0 ? '+' : ''}{formatRupiah(previewTotals.roundingAdjustment)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                          <span>TOTAL LUNAS KASIR:</span>
                          <span className="text-emerald-400 text-base">{formatRupiah(previewTotals.finalTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mini Receipt Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
                    <div className="text-center font-bold text-slate-300">{settingsName.toUpperCase()}</div>
                    <div className="text-center text-[9px] text-slate-500">{settingsAddress}</div>
                    <div className="text-center text-[9px] text-slate-600">--------------------------------</div>
                    <div className="flex justify-between">
                      <span>PB1 ({settingsEnableTax ? `${settingsTaxRate}%` : 'OFF'}):</span>
                      <span>{settingsEnableTax ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service ({settingsEnableServiceCharge ? `${settingsServiceChargeRate}%` : 'OFF'}):</span>
                      <span>{settingsEnableServiceCharge ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounding:</span>
                      <span>{settingsCashRoundingRule}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 9: SECURITY AUDIT TRAIL & ACTIVITY LEDGER
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Total Recorded Logs' : 'Total Aktivitas Tercatat'}</span>
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {auditLogs.length}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Append-only security log ledger</p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Master Menu Mutations' : 'Mutasi Master Menu'}</span>
                    <Package className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {auditLogs.filter((l) => l.entityType === 'menu').length}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Price updates, create, delete' : 'Perubahan harga, create, delete'}</p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Store & Tax Configurations' : 'Konfigurasi Toko & Pajak'}</span>
                    <Settings className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {auditLogs.filter((l) => l.entityType === 'store_settings').length}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">PB1, Service charge &amp; Rounding</p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-medium">
                    <span>{isEn ? 'Security & Auth Events' : 'Keamanan & Sesi Login'}</span>
                    <Lock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {auditLogs.filter((l) => l.entityType === 'auth' || l.status === 'FAILURE').length}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'PIN login, logout, security incidents' : 'Login PIN, logout, insiden keamanan'}</p>
                </div>
              </div>

              {/* Search, Filter & Action Toolbar */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Keyword Search */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder={isEn ? 'Search description, actor, ID, IP...' : 'Cari deskripsi, aktor, ID, atau IP...'}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent focus:border-indigo-500"
                    />
                    {auditSearch && (
                      <button
                        type="button"
                        onClick={() => setAuditSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filters & Export Button */}
                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                    {/* Role Filter */}
                    <select
                      value={auditRoleFilter}
                      onChange={(e) => setAuditRoleFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">{isEn ? 'All Roles' : 'Semua Role'}</option>
                      <option value="admin">Admin CMS</option>
                      <option value="cashier">Kasir POS</option>
                      <option value="kitchen">Chef Dapur</option>
                      <option value="customer">Pelanggan</option>
                    </select>

                    {/* Action Filter */}
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">{isEn ? 'All Action Types' : 'Semua Tipe Aksi'}</option>
                      <option value="MENU_PRICE_UPDATE">Update Harga Menu</option>
                      <option value="MENU_CREATE">Tambah Menu Baru</option>
                      <option value="MENU_DELETE">Hapus Menu</option>
                      <option value="MENU_TOGGLE_AVAILABILITY">Toggle Ketersediaan</option>
                      <option value="STORE_SETTINGS_UPDATE">Update Pengaturan Toko</option>
                      <option value="USER_LOGIN">User Login</option>
                      <option value="LOGIN_FAILURE">Login Gagal</option>
                      <option value="USER_LOGOUT">User Logout</option>
                      <option value="STOCK_TRANSFER_INITIATE">Inisiasi Transfer Stok</option>
                      <option value="STOCK_TRANSFER_APPROVE">Persetujuan Transfer Stok</option>
                      <option value="STOCK_TRANSFER_COMPLETED">Transfer Selesai</option>
                      <option value="STOCK_MANUAL_OVERRIDE">Penyesuaian Manual Stok</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={auditStatusFilter}
                      onChange={(e) => setAuditStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
                      <option value="SUCCESS">SUKSES (Success)</option>
                      <option value="FAILURE">GAGAL (Failure)</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                      title={isEn ? 'Reload Audit Logs' : 'Muat Ulang Data Log'}
                    >
                      <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* CSV Export Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('format', 'csv');
                        if (auditSearch) params.set('search', auditSearch);
                        if (auditRoleFilter !== 'ALL') params.set('userRole', auditRoleFilter);
                        if (auditActionFilter !== 'ALL') params.set('actionType', auditActionFilter);
                        if (auditStatusFilter !== 'ALL') params.set('status', auditStatusFilter);
                        window.open(`/api/audit-logs?${params.toString()}`, '_blank');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Export CSV' : 'Ekspor CSV'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Audit Logs Table */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">{isEn ? 'Timestamp' : 'Waktu Kejadian'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Actor & Role' : 'Aktor & Role'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Action Type' : 'Tipe Aksi'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Target Entity' : 'Entitas Target'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Mutation Description' : 'Deskripsi Mutasi'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'Status' : 'Status'}</th>
                        <th className="px-4 py-3.5">{isEn ? 'IP & Device' : 'IP & Device'}</th>
                        <th className="px-4 py-3.5 text-center">{isEn ? 'Diff Inspect' : 'Inspeksi Diff'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => {
                          const dateObj = new Date(log.timestamp);
                          const isFailure = log.status === 'FAILURE';

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                  {log.userName || log.userId}
                                </div>
                                <div className="mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                      log.userRole === 'admin'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                        : log.userRole === 'cashier'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : log.userRole === 'kitchen'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                                    }`}
                                  >
                                    {log.userRole.toUpperCase()}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                    log.actionType.includes('DELETE') || log.actionType.includes('FAILURE')
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                      : log.actionType.includes('UPDATE') || log.actionType.includes('OVERRIDE')
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                      : log.actionType.includes('CREATE') || log.actionType.includes('LOGIN')
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                  }`}
                                >
                                  {log.actionType}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                                  {log.entityType}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                  {log.entityId || 'Global'}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 max-w-xs">
                                <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                                  {log.description}
                                </p>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {isFailure ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <XCircle className="w-3 h-3" /> GAGAL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> SUKSES
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                  {log.ipAddress || '127.0.0.1'}
                                </div>
                                <div className="text-[9px] text-slate-400 truncate max-w-[100px]" title={log.userAgent}>
                                  {log.userAgent ? log.userAgent.split(' ')[0] : 'Browser/POS'}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLogForDiff(log);
                                    setIsDiffModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 mx-auto border border-indigo-500/30 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Diff</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                            <p className="font-bold text-sm">Tidak ada log aktivitas audit ditemukan</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {auditSearch || auditRoleFilter !== 'ALL' || auditActionFilter !== 'ALL' || auditStatusFilter !== 'ALL'
                                ? 'Coba sesuaikan kata kunci atau filter pencarian Anda.'
                                : 'Log mutasi audit akan muncul otomatis saat ada aktivitas.'}
                            </p>
                            {(auditSearch || auditRoleFilter !== 'ALL' || auditActionFilter !== 'ALL' || auditStatusFilter !== 'ALL') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAuditSearch('');
                                  setAuditRoleFilter('ALL');
                                  setAuditActionFilter('ALL');
                                  setAuditStatusFilter('ALL');
                                }}
                                className="mt-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                              >
                                Reset Semua Filter
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          ALL MODALS (RETAINED FULLY FUNCTIONAL)
      ─────────────────────────────────────────────────────────────────── */}

      {/* 1. Add Menu Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEn ? 'Add New Master Menu' : 'Tambah Menu Master Resto'}
                </h3>
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
              {isEn ? 'Save Menu to Catalog' : 'Simpan Menu Baru ke Master Data'}
            </button>
          </form>
        </div>
      )}

      {/* 2. Edit Menu Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{isEn ? 'Edit Menu' : 'Edit Menu'}</h3>
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
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
                {isEn ? 'Save Changes' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Inventory Stock Manager Modal */}
      <InventoryManagerModal
        isOpen={isInventoryModalOpen}
        onClose={() => {
          setIsInventoryModalOpen(false);
          fetchInventory();
        }}
      />

      {/* 4. Inter-Branch Transfer Hub Modal */}
      <TransferHubModal
        isOpen={isTransferHubOpen}
        onClose={() => {
          setIsTransferHubOpen(false);
          fetchTransfers();
          fetchInventory();
        }}
        onStockUpdated={() => {
          fetchTransfers();
          fetchInventory();
        }}
      />

      {/* 5. Table Floor Map & QR Standee Modal */}
      <TableMapModal
        isOpen={isTableMapOpen}
        onClose={() => setIsTableMapOpen(false)}
        orders={orders}
      />

      {/* 6. Executive AI Daily Sales Briefing Modal */}
      <AiBriefingModal
        isOpen={isAiBriefingOpen}
        onClose={() => setIsAiBriefingOpen(false)}
        orders={orders}
        totalRevenue={totalRevenue}
      />

      {/* 7. Security Audit Trail Diff Visualizer Modal */}
      <AuditDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => {
          setIsDiffModalOpen(false);
          setSelectedLogForDiff(null);
        }}
        log={selectedLogForDiff}
      />

      {/* 8. New Store Multi-Tenant Registration Modal */}
      {isNewStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newStoreForm.name) return;
              await registerNewTenant({
                name: newStoreForm.name,
                slug: newStoreForm.slug || newStoreForm.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                logo: '/icon.jpg',
                tagline: newStoreForm.tagline || 'Restoran SaaS Mandiri',
                plan: newStoreForm.plan,
                primaryColor: '#10b981',
                city: newStoreForm.city,
              });
              setIsNewStoreModalOpen(false);
              setNewStoreForm({ name: '', slug: '', tagline: '', city: 'Jakarta Pusat', plan: 'PRO' });
            }}
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isEn ? 'Register New SaaS Store' : 'Registrasi Resto SaaS Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isEn ? 'Register a new branch / store into Multi-Tenant system' : 'Daftarkan restoran baru ke dalam sistem Multi-Tenant'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isEn ? 'Restaurant Name *' : 'Nama Restoran *'}
                </label>
                <input
                  type="text"
                  required
                  value={newStoreForm.name}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                  placeholder="Contoh: Kopi Kenangan / Pizza House"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isEn ? 'Domain Slug URL' : 'Domain Slug URL (Unik)'}
                </label>
                <input
                  type="text"
                  value={newStoreForm.slug}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, slug: e.target.value })}
                  placeholder="Contoh: kopi-kenangan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isEn ? 'Tagline / Description' : 'Tagline / Deskripsi Resto'}
                </label>
                <input
                  type="text"
                  value={newStoreForm.tagline}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, tagline: e.target.value })}
                  placeholder="Contoh: Specialty Espresso & Pastry"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isEn ? 'City / Branch' : 'Kota / Cabang'}
                  </label>
                  <input
                    type="text"
                    value={newStoreForm.city}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isEn ? 'Subscription Plan' : 'Paket Subskripsi'}
                  </label>
                  <select
                    value={newStoreForm.plan}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, plan: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 focus:outline-none"
                  >
                    <option value="FREE">FREE DEMO</option>
                    <option value="PRO">PRO RESTO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer transition-all"
              >
                {isEn ? '+ Register Store' : '+ Registrasi Resto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
