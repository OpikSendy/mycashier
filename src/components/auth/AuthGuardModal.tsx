'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp, UserRole, ROLE_PINS } from '@/context/AppContext';

interface AuthGuardModalProps {
  requiredRole: 'cashier' | 'admin';
  title: string;
}

export default function AuthGuardModal({ requiredRole, title }: AuthGuardModalProps) {
  const router = useRouter();
  const { loginAs } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoPin = ROLE_PINS[requiredRole];

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAs(requiredRole, pin);
    if (!success) {
      setErrorMsg(`PIN ${requiredRole.toUpperCase()} salah. Gunakan PIN demo: ${demoPin}`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleQuickDemoLogin = () => {
    setPin(demoPin);
    loginAs(requiredRole, demoPin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
        {/* Lock Icon Header */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Akses Dibatasi — RBAC Protection</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Autentikasi {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Anda harus masuk sebagai {requiredRole.toUpperCase()} untuk mengakses area ini.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Input Form */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Masukkan PIN {requiredRole.toUpperCase()}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-center tracking-widest text-lg focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali Ke User</span>
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masuk {requiredRole.toUpperCase()}</span>
            </button>
          </div>
        </form>

        {/* Demo PIN Shortcut Box */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 text-[11px]">
            PIN Demo {requiredRole.toUpperCase()}: <strong className="text-emerald-500 font-bold">{demoPin}</strong>
          </span>
          <button
            onClick={handleQuickDemoLogin}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400"
          >
            1-Klik Masuk Demo
          </button>
        </div>
      </div>
    </div>
  );
}
