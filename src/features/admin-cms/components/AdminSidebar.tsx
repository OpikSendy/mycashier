'use client';

import React from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Store,
  Sparkles,
} from 'lucide-react';
import { AdminTabId, NavCategory, NavItem } from './AdminNavConfig';

export interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  language: 'id' | 'en' | 'ID' | 'EN';
  tenantName: string;
  authSession?: { userId?: string; name?: string; role?: string; user?: string } | null;
  onLogout: () => void;
  categories: NavCategory[];
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  language,
  tenantName,
  authSession,
  onLogout,
  categories,
}: AdminSidebarProps) {
  const isEn = language.toLowerCase() === 'en';
  const userName = authSession?.name || authSession?.user || 'Admin Resto';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  const renderBadge = (item: NavItem) => {
    if (item.badgeCount === undefined || item.badgeCount === null) return null;
    let badgeColor = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    if (item.badgeVariant === 'emerald') {
      badgeColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    } else if (item.badgeVariant === 'amber') {
      badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    } else if (item.badgeVariant === 'rose') {
      badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
    } else if (item.badgeVariant === 'indigo') {
      badgeColor = 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30';
    }

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums transition-all ${badgeColor}`}
      >
        {item.badgeCount}
      </span>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 select-none print:hidden transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-[76px]' : 'w-[268px]'
      }`}
      aria-label="Admin Enterprise Sidebar"
    >
      {/* ─── BRAND HEADER ────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm border border-emerald-500/30 flex-shrink-0 relative bg-slate-900 flex items-center justify-center">
            <Image
              src="/icon.jpg"
              alt="MyCashier Logo"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  My<span className="text-emerald-600 dark:text-emerald-400">Cashier</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                Admin CMS Panel
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? (isEn ? 'Expand sidebar' : 'Buka sidebar') : (isEn ? 'Collapse sidebar' : 'Tutup sidebar')}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ─── NAVIGATION CATEGORIES & ITEMS ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5 no-scrollbar">
        {categories.map((category, catIdx) => (
          <div key={category.id} className="space-y-1">
            {/* Category Header */}
            {!isCollapsed ? (
              <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isEn ? category.labelEn : category.labelId}
              </div>
            ) : (
              catIdx > 0 && <div className="my-2 border-t border-slate-200/80 dark:border-slate-800" />
            )}

            {/* Category Items */}
            <div className="space-y-1">
              {category.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                const label = isEn ? item.labelEn : item.labelId;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                        isCollapsed
                          ? 'justify-center p-2.5'
                          : 'px-3 py-2.5 justify-between'
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComponent
                          className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                            isActive
                              ? isCollapsed
                                ? 'text-white dark:text-slate-950'
                                : 'text-emerald-400 dark:text-slate-950'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="text-xs truncate text-left">
                            {label}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && renderBadge(item)}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="fixed left-[84px] ml-1 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700 flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-black">
                            {isEn ? category.labelEn : category.labelId}
                          </span>
                          <span className="font-bold">{label}</span>
                        </div>
                        {item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white ml-1">
                            {item.badgeCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── BOTTOM USER PROFILE & TENANT BADGE ────────────────────────────── */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        {!isCollapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userName}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                    <Store className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{tenantName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title={isEn ? 'Logout' : 'Keluar Sesi'}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs cursor-pointer"
              title={`${userName} (${tenantName})`}
            >
              {userInitials}
            </div>
            <button
              onClick={onLogout}
              title={isEn ? 'Logout' : 'Keluar Sesi'}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
