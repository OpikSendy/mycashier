'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, LogOut, Store } from 'lucide-react';
import { AdminTabId, NavCategory, NavItem } from './AdminNavConfig';

export interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  language: 'id' | 'en' | 'ID' | 'EN';
  tenantName: string;
  authSession?: { userId?: string; name?: string; role?: string; user?: string } | null;
  onLogout: () => void;
  categories: NavCategory[];
}

export default function AdminMobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  language,
  tenantName,
  authSession,
  onLogout,
  categories,
}: AdminMobileDrawerProps) {
  const isEn = language.toLowerCase() === 'en';
  const userName = authSession?.name || authSession?.user || 'Admin Resto';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (tabId: AdminTabId) => {
    onSelectTab(tabId);
    onClose();
  };

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
        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${badgeColor}`}
      >
        {item.badgeCount}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden print:hidden select-none" role="dialog" aria-modal="true">
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-950 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-left duration-300 ease-out">
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-emerald-500/30 flex-shrink-0 relative bg-slate-900">
              <Image
                src="/icon.jpg"
                alt="MyCashier Logo"
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>My<span className="text-emerald-600 dark:text-emerald-400">Cashier</span></span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Enterprise Menu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories & Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1.5">
              <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isEn ? category.labelEn : category.labelId}
              </div>

              <div className="space-y-1">
                {category.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  const label = isEn ? item.labelEn : item.labelId;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComponent
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive
                              ? 'text-emerald-400 dark:text-slate-950'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      {renderBadge(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile & Logout footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
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
              onClick={() => {
                onClose();
                onLogout();
              }}
              title={isEn ? 'Logout' : 'Keluar Sesi'}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
