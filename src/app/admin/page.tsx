'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminCmsApp from '@/features/admin-cms/AdminCmsApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import AuthGuardModal from '@/components/auth/AuthGuardModal';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, LogOut, Sun, Moon, Globe } from 'lucide-react';

export default function AdminPage() {
  const { authRole, logout, theme, toggleTheme, language, toggleLanguage } = useApp();

  const isAllowed = authRole === 'admin';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-emerald-500 selection:text-slate-950">
      {/* Standalone Admin CMS Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-6 py-3 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex-shrink-0 relative bg-slate-900">
              <Image src="/icon.jpg" alt="MyCashier Logo" width={36} height={36} className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="font-black text-lg text-white leading-none flex items-center gap-2">
                <span>My<span className="text-emerald-400">Cashier</span></span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase">
                  Admin CMS
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                MASTER DATA & SALES ANALYTICS CONTROL
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-colors"
            >
              Mode Pelanggan (PWA)
            </Link>

            {authRole !== 'customer' && (
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar ({authRole})</span>
              </button>
            )}

            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </header>

      {!isAllowed ? (
        <AuthGuardModal requiredRole="admin" title="Admin CMS Master Control" />
      ) : (
        <AdminCmsApp />
      )}

      <AiChatWidget />
    </main>
  );
}
