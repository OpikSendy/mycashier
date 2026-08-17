import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AdminTabId,
  getAdminNavCategories,
} from '../src/features/admin-cms/components/AdminNavConfig';
import AdminSidebar from '../src/features/admin-cms/components/AdminSidebar';
import AdminHeader from '../src/features/admin-cms/components/AdminHeader';
import AdminMobileDrawer from '../src/features/admin-cms/components/AdminMobileDrawer';
import { INITIAL_TENANTS, Tenant } from '../src/context/AppContext';

describe('Adversarial & Edge-Case Stress Testing Suite', () => {
  const allCategories = getAdminNavCategories({
    menuCount: 9999,
    ordersCount: 0,
    vouchersCount: 50,
    inventoryAlertCount: 12,
    pendingTransfersCount: 99,
    auditLogsCount: 5000,
  });

  // ─── 1. USER PROFILE EDGE CASES (Initials & Fallbacks) ──────────────────────
  describe('User Profile & Auth Session Stress Testing', () => {
    it('handles null authSession gracefully with default name and initials', () => {
      const props = {
        activeTab: 'dashboard' as AdminTabId,
        onSelectTab: mock(() => {}),
        isCollapsed: false,
        onToggleCollapse: mock(() => {}),
        language: 'id' as const,
        tenantName: 'Test Resto',
        authSession: null,
        onLogout: mock(() => {}),
        categories: allCategories,
      };

      const htmlExpanded = renderToStaticMarkup(React.createElement(AdminSidebar, props));
      expect(htmlExpanded).toContain('Admin Resto');
      expect(htmlExpanded).toContain('AR'); // Initials of Admin Resto

      const htmlCollapsed = renderToStaticMarkup(
        React.createElement(AdminSidebar, { ...props, isCollapsed: true })
      );
      expect(htmlCollapsed).toContain('AR');
    });

    it('handles single-word username, special characters, and long names', () => {
      const testCases = [
        { name: 'Cher', expectedInitial: 'C' },
        { name: 'Budi Santoso Nugroho', expectedInitial: 'BS' },
        { name: '123 Number User', expectedInitial: '1N' },
        { name: '   ', expectedInitial: 'AD' }, // fallback
      ];

      testCases.forEach(({ name, expectedInitial }) => {
        const props = {
          activeTab: 'dashboard' as AdminTabId,
          onSelectTab: mock(() => {}),
          isCollapsed: false,
          onToggleCollapse: mock(() => {}),
          language: 'id' as const,
          tenantName: 'Resto',
          authSession: { name, role: 'admin' },
          onLogout: mock(() => {}),
          categories: allCategories,
        };
        const html = renderToStaticMarkup(React.createElement(AdminSidebar, props));
        expect(html).toContain(expectedInitial);
      });
    });
  });

  // ─── 2. ALL 9 TABS ACTIVE STATE HIGHLIGHT VERIFICATION ───────────────────────
  describe('Active Tab Highlight & Badge Variance in Sidebar & Drawer', () => {
    const tabs: AdminTabId[] = [
      'dashboard',
      'orders_log',
      'menu_master',
      'vouchers',
      'qr_generator',
      'inventory',
      'transfers',
      'store_settings',
      'audit_logs',
    ];

    tabs.forEach((tab) => {
      it(`should correctly render active tab highlight for "${tab}" in sidebar`, () => {
        const props = {
          activeTab: tab,
          onSelectTab: mock(() => {}),
          isCollapsed: false,
          onToggleCollapse: mock(() => {}),
          language: 'id' as const,
          tenantName: 'Resto',
          authSession: { name: 'Admin', role: 'admin' },
          onLogout: mock(() => {}),
          categories: allCategories,
        };

        const html = renderToStaticMarkup(React.createElement(AdminSidebar, props));
        // Active tab receives active background styling
        expect(html).toContain('bg-slate-900 text-white dark:bg-emerald-500');
      });

      it(`should correctly render active tab highlight for "${tab}" in mobile drawer`, () => {
        const props = {
          isOpen: true,
          onClose: mock(() => {}),
          activeTab: tab,
          onSelectTab: mock(() => {}),
          language: 'en' as const,
          tenantName: 'Resto',
          authSession: { name: 'Admin', role: 'admin' },
          onLogout: mock(() => {}),
          categories: allCategories,
        };

        const html = renderToStaticMarkup(React.createElement(AdminMobileDrawer, props));
        expect(html).toContain('bg-slate-900 text-white dark:bg-emerald-500');
      });
    });
  });

  // ─── 3. TENANT & BRANCH SWITCHER EDGE CASES ──────────────────────────────────
  describe('Tenant & Branch Selectors Edge Cases in Header', () => {
    it('handles empty tenants array without crashing', () => {
      const props = {
        activeTab: 'dashboard' as AdminTabId,
        categories: allCategories,
        isCollapsed: false,
        onToggleCollapse: mock(() => {}),
        onOpenMobileDrawer: mock(() => {}),
        language: 'id' as const,
        onToggleLanguage: mock(() => {}),
        theme: 'light' as const,
        onToggleTheme: mock(() => {}),
        isDbConnected: true,
        activeTenant: INITIAL_TENANTS[0],
        tenants: [] as Tenant[],
        onSelectTenant: mock(() => {}),
      };

      const html = renderToStaticMarkup(React.createElement(AdminHeader, props));
      expect(html).toBeDefined();
      expect(html).toContain('Admin CMS');
    });

    it('handles undefined branches and undefined onSelectBranch without crashing', () => {
      const props = {
        activeTab: 'dashboard' as AdminTabId,
        categories: allCategories,
        isCollapsed: false,
        onToggleCollapse: mock(() => {}),
        onOpenMobileDrawer: mock(() => {}),
        language: 'id' as const,
        onToggleLanguage: mock(() => {}),
        theme: 'light' as const,
        onToggleTheme: mock(() => {}),
        isDbConnected: true,
        activeTenant: INITIAL_TENANTS[0],
        tenants: INITIAL_TENANTS,
        onSelectTenant: mock(() => {}),
        branches: undefined,
        onSelectBranch: undefined,
      };

      const html = renderToStaticMarkup(React.createElement(AdminHeader, props));
      expect(html).toBeDefined();
      expect(html).not.toContain('Cabang Jakarta Pusat');
    });

    it('handles optional modal triggers when omitted', () => {
      const props = {
        activeTab: 'dashboard' as AdminTabId,
        categories: allCategories,
        isCollapsed: false,
        onToggleCollapse: mock(() => {}),
        onOpenMobileDrawer: mock(() => {}),
        language: 'id' as const,
        onToggleLanguage: mock(() => {}),
        theme: 'light' as const,
        onToggleTheme: mock(() => {}),
        isDbConnected: true,
        activeTenant: INITIAL_TENANTS[0],
        tenants: INITIAL_TENANTS,
        onSelectTenant: mock(() => {}),
        onOpenAiBriefing: undefined,
        onOpenTableMap: undefined,
        onOpenNewStoreModal: undefined,
        onOpenAddMenuModal: undefined,
      };

      const html = renderToStaticMarkup(React.createElement(AdminHeader, props));
      expect(html).toBeDefined();
      expect(html).not.toContain('AI Briefing');
      expect(html).not.toContain('Denah Meja');
      expect(html).not.toContain('Tambah Menu');
      expect(html).not.toContain('+ Resto Baru');
    });
  });

  // ─── 4. LANGUAGE NORMALIZATION ACROSS ALL COMPONENTS ─────────────────────────
  describe('Language Normalization Testing', () => {
    const langVariants: Array<'id' | 'en' | 'ID' | 'EN'> = ['id', 'en', 'ID', 'EN'];

    langVariants.forEach((lang) => {
      it(`renders sidebar correctly with language variant "${lang}"`, () => {
        const props = {
          activeTab: 'dashboard' as AdminTabId,
          onSelectTab: mock(() => {}),
          isCollapsed: false,
          onToggleCollapse: mock(() => {}),
          language: lang,
          tenantName: 'Resto',
          authSession: { name: 'Admin', role: 'admin' },
          onLogout: mock(() => {}),
          categories: allCategories,
        };

        const html = renderToStaticMarkup(React.createElement(AdminSidebar, props));
        const isEn = lang.toLowerCase() === 'en';
        if (isEn) {
          expect(html).toContain('Analytics &amp; Dashboard');
        } else {
          expect(html).toContain('Analitik &amp; Dashboard');
        }
      });

      it(`renders header correctly with language variant "${lang}"`, () => {
        const props = {
          activeTab: 'menu_master' as AdminTabId,
          categories: allCategories,
          isCollapsed: false,
          onToggleCollapse: mock(() => {}),
          onOpenMobileDrawer: mock(() => {}),
          language: lang,
          onToggleLanguage: mock(() => {}),
          theme: 'light' as const,
          onToggleTheme: mock(() => {}),
          isDbConnected: true,
          activeTenant: INITIAL_TENANTS[0],
          tenants: INITIAL_TENANTS,
          onSelectTenant: mock(() => {}),
        };

        const html = renderToStaticMarkup(React.createElement(AdminHeader, props));
        const isEn = lang.toLowerCase() === 'en';
        if (isEn) {
          expect(html).toContain('Menu &amp; Category Master');
          expect(html).toContain('<span>EN</span>');
        } else {
          expect(html).toContain('Master Menu &amp; Kategori');
          expect(html).toContain('<span>ID</span>');
        }
      });
    });
  });

  // ─── 5. CATEGORY GROUP TAXONOMY INTEGRITY ────────────────────────────────────
  describe('Category Group Taxonomy Integrity', () => {
    it('always generates all 4 categorical groups with 9 distinct items', () => {
      const cats = getAdminNavCategories();
      expect(cats.length).toBe(4);
      expect(cats.map((c) => c.id)).toEqual(['analytics', 'master_data', 'operations', 'system']);

      const allItemIds = cats.flatMap((c) => c.items.map((i) => i.id));
      expect(allItemIds.length).toBe(9);
      const uniqueIds = new Set(allItemIds);
      expect(uniqueIds.size).toBe(9);

      // Verify each item has non-empty labels in both languages
      cats.forEach((cat) => {
        expect(cat.labelId.length).toBeGreaterThan(0);
        expect(cat.labelEn.length).toBeGreaterThan(0);
        cat.items.forEach((item) => {
          expect(item.labelId.length).toBeGreaterThan(0);
          expect(item.labelEn.length).toBeGreaterThan(0);
          expect(item.icon).toBeDefined();
        });
      });
    });
  });
});
