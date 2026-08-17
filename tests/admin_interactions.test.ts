import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AdminTabId,
  getAdminNavCategories,
  NavCategory,
  NavItem,
} from '../src/features/admin-cms/components/AdminNavConfig';
import AdminSidebar from '../src/features/admin-cms/components/AdminSidebar';
import AdminHeader from '../src/features/admin-cms/components/AdminHeader';
import AdminMobileDrawer from '../src/features/admin-cms/components/AdminMobileDrawer';
import { INITIAL_TENANTS, INITIAL_BRANCHES } from '../src/context/AppContext';

// ─── 1. BREADCRUMB CALCULATION TEST HARNESS ──────────────────────────────────
describe('Admin Breadcrumb Calculation Suite', () => {
  const categories = getAdminNavCategories();

  function resolveBreadcrumb(tab: AdminTabId, lang: 'id' | 'en' | 'ID' | 'EN', cats: NavCategory[]) {
    const isEn = lang.toLowerCase() === 'en';
    let currentCategory: NavCategory | undefined;
    let currentItem: NavItem | undefined;

    for (const cat of cats) {
      const found = cat.items.find((item) => item.id === tab);
      if (found) {
        currentCategory = cat;
        currentItem = found;
        break;
      }
    }

    const categoryLabel = currentCategory
      ? isEn
        ? currentCategory.labelEn
        : currentCategory.labelId
      : 'Admin';

    const itemLabel = currentItem
      ? isEn
        ? currentItem.labelEn
        : currentItem.labelId
      : tab;

    return {
      categoryLabel,
      itemLabel,
      icon: currentItem?.icon,
      categoryFound: Boolean(currentCategory),
      itemFound: Boolean(currentItem),
    };
  }

  it('should resolve all 9 tabs to their exact category and label in Indonesian (ID)', () => {
    const expected = [
      { tab: 'dashboard' as AdminTabId, category: 'Analitik & Dashboard', item: 'Ringkasan Omzet & Chart' },
      { tab: 'orders_log' as AdminTabId, category: 'Analitik & Dashboard', item: 'Riwayat Transaksi' },
      { tab: 'menu_master' as AdminTabId, category: 'Master Data & Katalog', item: 'Master Menu & Kategori' },
      { tab: 'vouchers' as AdminTabId, category: 'Master Data & Katalog', item: 'Kupon Promo & Diskon' },
      { tab: 'qr_generator' as AdminTabId, category: 'Master Data & Katalog', item: 'Denah Meja & Standee QR' },
      { tab: 'inventory' as AdminTabId, category: 'Operasional & Stok', item: 'Stok & Bahan Baku' },
      { tab: 'transfers' as AdminTabId, category: 'Operasional & Stok', item: 'Transfer Antar Cabang' },
      { tab: 'store_settings' as AdminTabId, category: 'Sistem & Keamanan', item: 'Pengaturan Toko & PB1' },
      { tab: 'audit_logs' as AdminTabId, category: 'Sistem & Keamanan', item: 'Audit Trail & Keamanan' },
    ];

    expected.forEach(({ tab, category, item }) => {
      const resolved = resolveBreadcrumb(tab, 'id', categories);
      expect(resolved.categoryFound).toBe(true);
      expect(resolved.itemFound).toBe(true);
      expect(resolved.categoryLabel).toBe(category);
      expect(resolved.itemLabel).toBe(item);
      expect(resolved.icon).toBeDefined();
    });
  });

  it('should resolve all 9 tabs to their exact category and label in English (EN)', () => {
    const expected = [
      { tab: 'dashboard' as AdminTabId, category: 'Analytics & Dashboard', item: 'Revenue & Analytics' },
      { tab: 'orders_log' as AdminTabId, category: 'Analytics & Dashboard', item: 'Transaction History' },
      { tab: 'menu_master' as AdminTabId, category: 'Master Data & Catalog', item: 'Menu & Category Master' },
      { tab: 'vouchers' as AdminTabId, category: 'Master Data & Catalog', item: 'Promo Vouchers & Discount' },
      { tab: 'qr_generator' as AdminTabId, category: 'Master Data & Catalog', item: 'Table Floor & QR Standee' },
      { tab: 'inventory' as AdminTabId, category: 'Operations & Stock', item: 'Stock & Raw Materials' },
      { tab: 'transfers' as AdminTabId, category: 'Operations & Stock', item: 'Inter-Branch Transfers' },
      { tab: 'store_settings' as AdminTabId, category: 'System & Security', item: 'Store Settings & Tax' },
      { tab: 'audit_logs' as AdminTabId, category: 'System & Security', item: 'Audit Trail & Security' },
    ];

    expected.forEach(({ tab, category, item }) => {
      const resolved = resolveBreadcrumb(tab, 'EN', categories);
      expect(resolved.categoryFound).toBe(true);
      expect(resolved.itemFound).toBe(true);
      expect(resolved.categoryLabel).toBe(category);
      expect(resolved.itemLabel).toBe(item);
      expect(resolved.icon).toBeDefined();
    });
  });

  it('should handle fallback gracefully on invalid tab id', () => {
    // @ts-expect-error test invalid tab
    const resolved = resolveBreadcrumb('unknown_tab' as AdminTabId, 'ID', categories);
    expect(resolved.categoryFound).toBe(false);
    expect(resolved.itemFound).toBe(false);
    expect(resolved.categoryLabel).toBe('Admin');
    expect(resolved.itemLabel).toBe('unknown_tab');
  });
});

// ─── 2. SIDEBAR RENDERING & COLLAPSE TEST SUITE ──────────────────────────────
describe('Admin Sidebar Interactive Flow Suite', () => {
  const categories = getAdminNavCategories({
    menuCount: 42,
    ordersCount: 15,
    vouchersCount: 3,
    inventoryAlertCount: 2,
    pendingTransfersCount: 1,
    auditLogsCount: 120,
  });

  const baseProps = {
    activeTab: 'dashboard' as AdminTabId,
    onSelectTab: mock(() => {}),
    isCollapsed: false,
    onToggleCollapse: mock(() => {}),
    language: 'id' as const,
    tenantName: 'MyCashier Resto Utama',
    authSession: { name: 'Super Admin', role: 'admin', user: 'admin@mycashier.com' },
    onLogout: mock(() => {}),
    categories,
  };

  it('should render expanded sidebar with 268px width class and full labels', () => {
    const html = renderToStaticMarkup(React.createElement(AdminSidebar, baseProps));
    expect(html).toContain('w-[268px]');
    expect(html).toContain('MyCashier');
    expect(html).toContain('Enterprise');
    expect(html).toContain('Admin CMS Panel');
    expect(html).toContain('Analitik &amp; Dashboard');
    expect(html).toContain('Ringkasan Omzet &amp; Chart');
    expect(html).toContain('Super Admin');
    expect(html).toContain('MyCashier Resto Utama');
    // Badge counts should be rendered in expanded mode
    expect(html).toContain('42');
    expect(html).toContain('15');
  });

  it('should render collapsed sidebar with 76px width class and tooltips', () => {
    const collapsedProps = { ...baseProps, isCollapsed: true };
    const html = renderToStaticMarkup(React.createElement(AdminSidebar, collapsedProps));
    expect(html).toContain('w-[76px]');
    // Brand title text is hidden in collapsed mode
    expect(html).not.toContain('Admin CMS Panel');
    // Floating tooltip container exists for collapsed hover
    expect(html).toContain('fixed left-[84px]');
    // Tooltip includes category and item label
    expect(html).toContain('Analitik &amp; Dashboard');
    expect(html).toContain('Ringkasan Omzet &amp; Chart');
    expect(html).toContain('uppercase');
    // Avatar initials present
    expect(html).toContain('SA');
  });

  it('should support English labels and title attributes', () => {
    const enProps = { ...baseProps, language: 'en' as const, isCollapsed: false };
    const html = renderToStaticMarkup(React.createElement(AdminSidebar, enProps));
    expect(html).toContain('Analytics &amp; Dashboard');
    expect(html).toContain('Revenue &amp; Analytics');
    expect(html).toContain('title="Collapse sidebar"');
  });

  it('should switch collapse title when collapsed in Indonesian', () => {
    const collapsedIdProps = { ...baseProps, language: 'id' as const, isCollapsed: true };
    const html = renderToStaticMarkup(React.createElement(AdminSidebar, collapsedIdProps));
    expect(html).toContain('title="Buka sidebar"');
  });
});

// ─── 3. MOBILE SLIDE-OVER DRAWER TEST SUITE ──────────────────────────────────
describe('Admin Mobile Slide-Over Drawer Interactive Suite', () => {
  const categories = getAdminNavCategories({
    menuCount: 10,
    ordersCount: 5,
  });

  const baseProps = {
    isOpen: true,
    onClose: mock(() => {}),
    activeTab: 'menu_master' as AdminTabId,
    onSelectTab: mock(() => {}),
    language: 'id' as const,
    tenantName: 'Kopi Kenangan Mantan',
    authSession: { name: 'Store Manager', role: 'admin' },
    onLogout: mock(() => {}),
    categories,
  };

  it('should return null when isOpen is false', () => {
    const closedProps = { ...baseProps, isOpen: false };
    const html = renderToStaticMarkup(React.createElement(AdminMobileDrawer, closedProps));
    expect(html).toBe('');
  });

  it('should render slide-over drawer with backdrop and tab items when isOpen is true', () => {
    const html = renderToStaticMarkup(React.createElement(AdminMobileDrawer, baseProps));
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    // Backdrop blur overlay
    expect(html).toContain('backdrop-blur-xs');
    // Slide-in drawer container
    expect(html).toContain('slide-in-from-left');
    expect(html).toContain('w-72');
    // Active tab styling (menu_master is active)
    expect(html).toContain('Master Menu &amp; Kategori');
    expect(html).toContain('Store Manager');
    expect(html).toContain('Kopi Kenangan Mantan');
  });

  it('should render in English when language is EN', () => {
    const enProps = { ...baseProps, language: 'en' as const };
    const html = renderToStaticMarkup(React.createElement(AdminMobileDrawer, enProps));
    expect(html).toContain('Master Data &amp; Catalog');
    expect(html).toContain('Menu &amp; Category Master');
  });
});

// ─── 4. ADMIN HEADER & GLOBAL SELECTORS TEST SUITE ───────────────────────────
describe('Admin Header & Global Selectors Interactive Suite', () => {
  const categories = getAdminNavCategories();

  const mockTenantSelect = mock((_t: Tenant) => {});
  const mockBranchSelect = mock((_b: Branch) => {});
  const mockToggleLang = mock(() => {});
  const mockToggleTheme = mock(() => {});
  const mockToggleCollapse = mock(() => {});
  const mockOpenDrawer = mock(() => {});
  const mockOpenAi = mock(() => {});
  const mockOpenTableMap = mock(() => {});
  const mockOpenNewStore = mock(() => {});
  const mockOpenAddMenu = mock(() => {});

  const baseProps = {
    activeTab: 'inventory' as AdminTabId,
    categories,
    isCollapsed: false,
    onToggleCollapse: mockToggleCollapse,
    onOpenMobileDrawer: mockOpenDrawer,
    language: 'id' as const,
    onToggleLanguage: mockToggleLang,
    theme: 'dark' as const,
    onToggleTheme: mockToggleTheme,
    isDbConnected: true,
    activeTenant: INITIAL_TENANTS[0],
    tenants: INITIAL_TENANTS,
    onSelectTenant: mockTenantSelect,
    activeBranch: INITIAL_BRANCHES[0],
    branches: INITIAL_BRANCHES,
    onSelectBranch: mockBranchSelect,
    onOpenAiBriefing: mockOpenAi,
    onOpenTableMap: mockOpenTableMap,
    onOpenNewStoreModal: mockOpenNewStore,
    onOpenAddMenuModal: mockOpenAddMenu,
  };

  it('should render header with breadcrumbs matching active tab (inventory)', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('Admin CMS');
    expect(html).toContain('Operasional &amp; Stok');
    expect(html).toContain('Stok &amp; Bahan Baku');
  });

  it('should render Multi-Tenant SaaS Store Switcher with all tenant options', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('MyCashier Resto Utama (ENTERPRISE)');
    expect(html).toContain('Kopi Kenangan Mantan (PRO)');
    expect(html).toContain('Burger &amp; Co. Artisanal (PRO)');
    expect(html).toContain('Ramen Ya! Authentic Noodle (ENTERPRISE)');
  });

  it('should render Branch Selector with all branch options', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('Cabang Jakarta Pusat');
    expect(html).toContain('Cabang Bandung Dago');
    expect(html).toContain('Cabang Bali Seminyak');
  });

  it('should render DB status pill as connected when isDbConnected is true', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('PostgreSQL Connected');
    expect(html).toContain('bg-emerald-500 animate-pulse');
  });

  it('should render DB status pill as In-Memory when isDbConnected is false', () => {
    const offlineProps = { ...baseProps, isDbConnected: false };
    const html = renderToStaticMarkup(React.createElement(AdminHeader, offlineProps));
    expect(html).toContain('In-Memory Mode');
    expect(html).toContain('bg-amber-500');
  });

  it('should render theme toggle with Sun icon when theme is dark', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('title="Switch to Light Mode"');
  });

  it('should render theme toggle with Moon icon when theme is light', () => {
    const lightProps = { ...baseProps, theme: 'light' as const };
    const html = renderToStaticMarkup(React.createElement(AdminHeader, lightProps));
    expect(html).toContain('title="Switch to Dark Mode"');
  });

  it('should render language toggle with ID / EN', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('<span>ID</span>');

    const enProps = { ...baseProps, language: 'en' as const };
    const enHtml = renderToStaticMarkup(React.createElement(AdminHeader, enProps));
    expect(enHtml).toContain('<span>EN</span>');
  });

  it('should render quick action triggers: AI Briefing, Table Map, Add Menu, New Store', () => {
    const html = renderToStaticMarkup(React.createElement(AdminHeader, baseProps));
    expect(html).toContain('AI Briefing');
    expect(html).toContain('Denah Meja');
    expect(html).toContain('Tambah Menu');
    expect(html).toContain('+ Resto Baru');
  });
});
