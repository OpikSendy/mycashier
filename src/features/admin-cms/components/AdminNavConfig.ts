import React from 'react';
import {
  TrendingUp,
  Layers,
  UtensilsCrossed,
  Tag,
  QrCode,
  Boxes,
  ArrowRightLeft,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Receipt,
  Package,
} from 'lucide-react';

export type AdminTabId =
  | 'dashboard'
  | 'orders_log'
  | 'menu_master'
  | 'vouchers'
  | 'qr_generator'
  | 'inventory'
  | 'transfers'
  | 'store_settings'
  | 'audit_logs';

export interface NavItem {
  id: AdminTabId;
  labelId: string;
  labelEn: string;
  shortLabelId?: string;
  shortLabelEn?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeVariant?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate';
  descriptionId?: string;
  descriptionEn?: string;
}

export interface NavCategory {
  id: string;
  labelId: string;
  labelEn: string;
  items: NavItem[];
}

export interface NavBadgeCounts {
  menuCount?: number;
  ordersCount?: number;
  vouchersCount?: number;
  inventoryAlertCount?: number;
  pendingTransfersCount?: number;
  auditLogsCount?: number;
}

export function getAdminNavCategories(counts?: NavBadgeCounts): NavCategory[] {
  return [
    {
      id: 'analytics',
      labelId: 'Analitik & Dashboard',
      labelEn: 'Analytics & Dashboard',
      items: [
        {
          id: 'dashboard',
          labelId: 'Ringkasan Omzet & Chart',
          labelEn: 'Revenue & Analytics',
          shortLabelId: 'Dashboard',
          shortLabelEn: 'Dashboard',
          icon: LayoutDashboard,
          descriptionId: 'Statistik omzet 7 hari & distribusi pembayaran',
          descriptionEn: '7-day revenue trend & payment distribution',
        },
        {
          id: 'orders_log',
          labelId: 'Riwayat Transaksi',
          labelEn: 'Transaction History',
          shortLabelId: 'Log Pesanan',
          shortLabelEn: 'Orders Log',
          icon: Receipt,
          badgeCount: counts?.ordersCount,
          badgeVariant: 'indigo',
          descriptionId: 'Semua pesanan lunas & ekspor CSV Excel',
          descriptionEn: 'All paid orders & CSV Excel export',
        },
      ],
    },
    {
      id: 'master_data',
      labelId: 'Master Data & Katalog',
      labelEn: 'Master Data & Catalog',
      items: [
        {
          id: 'menu_master',
          labelId: 'Master Menu & Kategori',
          labelEn: 'Menu & Category Master',
          shortLabelId: 'Master Menu',
          shortLabelEn: 'Menu Master',
          icon: Package,
          badgeCount: counts?.menuCount,
          badgeVariant: 'emerald',
          descriptionId: 'Kelola harga, foto, varian & status stok',
          descriptionEn: 'Manage pricing, photos, variants & availability',
        },
        {
          id: 'vouchers',
          labelId: 'Kupon Promo & Diskon',
          labelEn: 'Promo Vouchers & Discount',
          shortLabelId: 'Kupon Promo',
          shortLabelEn: 'Vouchers',
          icon: Tag,
          badgeCount: counts?.vouchersCount,
          badgeVariant: 'amber',
          descriptionId: 'Kelola kode diskon persentase & nominal flat',
          descriptionEn: 'Manage percentage & flat discount codes',
        },
        {
          id: 'qr_generator',
          labelId: 'Denah Meja & Standee QR',
          labelEn: 'Table Floor & QR Standee',
          shortLabelId: 'QR Standee',
          shortLabelEn: 'QR Standee',
          icon: QrCode,
          descriptionId: 'Cetak QR Code fisik standee meja self-order',
          descriptionEn: 'Print physical QR Standees for self-ordering',
        },
      ],
    },
    {
      id: 'operations',
      labelId: 'Operasional & Stok',
      labelEn: 'Operations & Stock',
      items: [
        {
          id: 'inventory',
          labelId: 'Stok & Bahan Baku',
          labelEn: 'Stock & Raw Materials',
          shortLabelId: 'Stok Bahan',
          shortLabelEn: 'Inventory',
          icon: Boxes,
          badgeCount: counts?.inventoryAlertCount,
          badgeVariant: 'rose',
          descriptionId: 'Safety threshold alert, batch in/out & HPP',
          descriptionEn: 'Safety threshold alert, stock intake & COGS',
        },
        {
          id: 'transfers',
          labelId: 'Transfer Antar Cabang',
          labelEn: 'Inter-Branch Transfers',
          shortLabelId: 'Transfer Stok',
          shortLabelEn: 'Transfers',
          icon: ArrowRightLeft,
          badgeCount: counts?.pendingTransfersCount,
          badgeVariant: 'amber',
          descriptionId: 'Hub transfer antar outlet, approval & tracking',
          descriptionEn: 'Inter-outlet stock transfer, approval & tracking',
        },
      ],
    },
    {
      id: 'system',
      labelId: 'Sistem & Keamanan',
      labelEn: 'System & Security',
      items: [
        {
          id: 'store_settings',
          labelId: 'Pengaturan Toko & PB1',
          labelEn: 'Store Settings & Tax',
          shortLabelId: 'Pengaturan',
          shortLabelEn: 'Settings',
          icon: Settings,
          descriptionId: 'Profil toko, Pajak PB1, Service charge & Cash rounding',
          descriptionEn: 'Store profile, PB1 Tax, Service fee & Cash rounding',
        },
        {
          id: 'audit_logs',
          labelId: 'Audit Trail & Keamanan',
          labelEn: 'Audit Trail & Security',
          shortLabelId: 'Audit Logs',
          shortLabelEn: 'Audit Logs',
          icon: ShieldCheck,
          badgeCount: counts?.auditLogsCount,
          badgeVariant: 'slate',
          descriptionId: 'Catatan mutasi data tamper-evident & JSON diff',
          descriptionEn: 'Tamper-evident mutation ledger & JSON diff',
        },
      ],
    },
  ];
}
