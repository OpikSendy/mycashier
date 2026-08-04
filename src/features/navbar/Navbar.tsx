'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Smartphone, Monitor, ShieldCheck, Sun, Moon, Globe, QrCode } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, toggleLanguage, selectedTable, setSelectedTable } = useApp();

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  const navLinks = [
    { href: '/', label: 'User Mobile PWA', path: '/', icon: <Smartphone className="w-4 h-4" /> },
    { href: '/cashier', label: 'Kasir POS Station', path: '/cashier', icon: <Monitor className="w-4 h-4" /> },
    { href: '/admin', label: 'Admin CMS Master', path: '/admin', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 select-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center text-slate-950 font-extrabold text-sm">
            <span className="bg-slate-950 text-emerald-400 w-full h-full rounded-[10px] flex items-center justify-center font-black">
              MC
            </span>
          </div>
          <div>
            <h1 className="font-black text-base md:text-lg text-slate-900 dark:text-white leading-none">
              My<span className="text-emerald-500 dark:text-emerald-400">Cashier</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              MULTI-ROUTE F&B PLATFORM
            </p>
          </div>
        </Link>

        {/* Real Next.js Route Navigation Links */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Table Selector (Visible in User PWA Route '/') */}
          {pathname === '/' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-bold"
              >
                {tables.map((tbl) => (
                  <option key={tbl} value={tbl} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {tbl}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
            title="Switch Language (ID / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{language}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
