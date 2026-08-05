'use client';

import React, { useState, useEffect } from 'react';
import OnboardingView from '@/features/onboarding/OnboardingView';
import UserPwaApp from '@/features/user-pwa/UserPwaApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { QrCode, Globe, Sun, Moon, Lock } from 'lucide-react';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const { theme, toggleTheme, language, toggleLanguage, selectedTable, setSelectedTable } = useApp();

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('mycashier_onboarding_seen');
      if (!hasSeen) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch (e) {
      setShowOnboarding(false);
    }
  }, []);

  const handleFinishOnboarding = () => {
    try {
      localStorage.setItem('mycashier_onboarding_seen', 'true');
    } catch (e) {}
    setShowOnboarding(false);
  };

  if (showOnboarding === true) {
    return <OnboardingView onComplete={handleFinishOnboarding} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-emerald-500 selection:text-slate-950 pb-16 touch-manipulation overscroll-none overflow-x-hidden">
      {/* Standalone Customer PWA Top Bar (Zero Admin/Cashier Links Visible) */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 select-none">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex-shrink-0 relative bg-slate-900">
              <Image src="/icon.jpg" alt="MyCashier Logo" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="font-black text-base text-white leading-none">
                My<span className="text-emerald-400">Cashier</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider">
                TABLE SELF-ORDERING PWA
              </p>
            </div>
          </div>

          {/* Right Controls (Table Picker, Language, Theme) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold text-emerald-400"
              >
                {tables.map((tbl) => (
                  <option key={tbl} value={tbl} className="bg-slate-900 text-slate-100">
                    {tbl}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Customer Mobile PWA Application */}
      <UserPwaApp />

      {/* Secret Staff Login Footer Link */}
      <footer className="text-center py-6 text-[10px] text-slate-600 border-t border-slate-900 mt-8">
        <p className="mb-1">MyCashier F&B Self-Ordering System</p>
        <div className="flex justify-center items-center gap-3">
          <Link href="/cashier" className="hover:text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Stasiun Kasir POS</span>
          </Link>
          <span>•</span>
          <Link href="/admin" className="hover:text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Admin Resto CMS</span>
          </Link>
        </div>
      </footer>

      {/* Ask MyCashier AI Assistant */}
      <AiChatWidget />
    </main>
  );
}
