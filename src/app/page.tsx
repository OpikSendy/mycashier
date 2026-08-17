'use client';

import React, { useState, useEffect, Suspense } from 'react';
import OnboardingView from '@/features/onboarding/OnboardingView';
import UserPwaApp from '@/features/user-pwa/UserPwaApp';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import QuickPinPadModal from '@/components/auth/QuickPinPadModal';
import Link from 'next/link';
import Image from 'next/image';
import { useApp, UserRole } from '@/context/AppContext';
import { QrCode, Globe, Sun, Moon, Lock, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import PwaInstallButton from '@/components/pwa/PwaInstallButton';

function AuthRequiredListener() {
  const searchParams = useSearchParams();
  const authRequired = searchParams.get('authRequired') as UserRole | null;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (authRequired && ['cashier', 'kitchen', 'admin'].includes(authRequired)) {
      setIsOpen(true);
    }
  }, [authRequired]);

  if (!isOpen || !authRequired) return null;

  return (
    <QuickPinPadModal
      requiredRole={authRequired}
      initialRole={authRequired}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      redirectOnSuccess={`/${authRequired}`}
    />
  );
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const { theme, toggleTheme, language, toggleLanguage, selectedTable, setSelectedTable, branches, activeBranch, setActiveBranch } = useApp();

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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 relative selection:bg-emerald-500 selection:text-slate-950 pb-4 overflow-x-hidden overflow-y-auto">
      {/* Standalone Customer PWA Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 select-none shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Active Branch Selector */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-emerald-500/30 flex-shrink-0 relative bg-slate-900">
              <Image src="/icon.jpg" alt="MyCashier Logo" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="font-black text-base text-slate-900 dark:text-white leading-none">
                My<span className="text-emerald-600 dark:text-emerald-400">Cashier</span>
              </h1>
              <div className="relative mt-0.5">
                <select
                  value={activeBranch.id}
                  onChange={(e) => {
                    const found = branches.find((b) => b.id === e.target.value);
                    if (found) setActiveBranch(found);
                  }}
                  className="bg-transparent text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider focus:outline-none cursor-pointer pr-3"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      📍 {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Controls (PWA Install, Language, Theme) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <PwaInstallButton />

            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1 shadow-2xs"
              title="Ganti Bahasa"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Customer Mobile PWA Application */}
      <ErrorBoundary fallbackTitle="Kendala Aplikasi Pemesanan Mandiri">
        <UserPwaApp />
      </ErrorBoundary>

      {/* Native App Bottom Spacer */}
      <footer className="text-center py-6 text-[11px] font-bold text-slate-400">
        <p>Powered by MyCashier PWA</p>
      </footer>

      {/* Ask MyCashier AI Assistant */}
      <AiChatWidget />

      {/* URL Auth Required Modal Guard */}
      <Suspense fallback={null}>
        <AuthRequiredListener />
      </Suspense>
    </main>
  );
}
