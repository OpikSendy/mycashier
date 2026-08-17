'use client';

import React from 'react';
import {
  Menu,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Wifi,
  WifiOff,
  Sparkles,
  QrCode,
  Plus,
  Store,
  Building2,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { AdminTabId, NavCategory, NavItem } from './AdminNavConfig';
import { Tenant, Branch } from '@/context/AppContext';

export interface AdminHeaderProps {
  activeTab: AdminTabId;
  categories: NavCategory[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobileDrawer: () => void;
  language: 'id' | 'en' | 'ID' | 'EN';
  onToggleLanguage: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isDbConnected: boolean;
  activeTenant: Tenant;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
  activeBranch?: Branch;
  branches?: Branch[];
  onSelectBranch?: (branch: Branch) => void;
  onOpenAiBriefing?: () => void;
  onOpenTableMap?: () => void;
  onOpenNewStoreModal?: () => void;
  onOpenAddMenuModal?: () => void;
  onLogout?: () => void;
}

export default function AdminHeader({
  activeTab,
  categories,
  isCollapsed,
  onToggleCollapse,
  onOpenMobileDrawer,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  isDbConnected,
  activeTenant,
  tenants,
  onSelectTenant,
  activeBranch,
  branches,
  onSelectBranch,
  onOpenAiBriefing,
  onOpenTableMap,
  onOpenNewStoreModal,
  onOpenAddMenuModal,
  onLogout,
}: AdminHeaderProps) {
  const isEn = language.toLowerCase() === 'en';

  // Find active category and item for dynamic breadcrumbs
  let currentCategory: NavCategory | undefined;
  let currentItem: NavItem | undefined;

  for (const cat of categories) {
    const found = cat.items.find((item) => item.id === activeTab);
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
    : activeTab;

  const ItemIcon = currentItem?.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-6 py-2.5 select-none shadow-xs print:hidden">
      <div className="flex items-center justify-between gap-3">
        {/* ─── LEFT: MOBILE HAMBURGER & DYNAMIC BREADCRUMB ───────────────── */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Dynamic Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="hidden sm:inline-block font-semibold hover:text-slate-700 dark:hover:text-slate-200">
              Admin CMS
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 hidden sm:inline-block" />
            <span className="hidden lg:inline-block font-medium truncate">
              {categoryLabel}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 hidden lg:inline-block" />
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold truncate">
              {ItemIcon && <ItemIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
              <span className="truncate">{itemLabel}</span>
            </div>
          </nav>
        </div>

        {/* ─── RIGHT: GLOBAL SELECTORS & ACTIONS ─────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Multi-Tenant SaaS Store Switcher */}
          {tenants && tenants.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs">
              <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <select
                value={activeTenant?.id}
                onChange={(e) => {
                  const found = tenants.find((t) => t.id === e.target.value);
                  if (found) onSelectTenant(found);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {tenants.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {t.name} ({t.plan})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multi-Branch Outlet Selector */}
          {branches && branches.length > 0 && onSelectBranch && (
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <select
                value={activeBranch?.id}
                onChange={(e) => {
                  const found = branches.find((b) => b.id === e.target.value);
                  if (found) onSelectBranch(found);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {branches.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Database Connection Status Pill */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
              isDbConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isDbConnected ? (
              <span className="hidden md:inline">PostgreSQL Connected</span>
            ) : (
              <span className="hidden md:inline">In-Memory Mode</span>
            )}
            <span className="md:hidden">{isDbConnected ? 'DB OK' : 'Memory'}</span>
          </div>

          {/* Quick Action: AI Daily Briefing */}
          {onOpenAiBriefing && (
            <button
              onClick={onOpenAiBriefing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              title="AI Executive Daily Briefing"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
              <span className="hidden sm:inline">AI Briefing</span>
            </button>
          )}

          {/* Quick Action: Table Standee QR */}
          {onOpenTableMap && (
            <button
              onClick={onOpenTableMap}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              title="Denah Meja & QR Standee"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Denah Meja</span>
            </button>
          )}

          {/* Quick Action: Add Menu */}
          {onOpenAddMenuModal && (
            <button
              onClick={onOpenAddMenuModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title="Tambah Menu Master"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Add Menu' : 'Tambah Menu'}</span>
            </button>
          )}

          {/* Quick Action: Register New Store */}
          {onOpenNewStoreModal && (
            <button
              onClick={onOpenNewStoreModal}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-800 font-bold text-xs items-center gap-1.5 border border-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Registrasi Restoran Baru"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">+ Resto Baru</span>
            </button>
          )}

          {/* Language Switcher Toggle */}
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            title="Switch Language (ID/EN)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
