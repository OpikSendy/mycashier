'use client';

import React from 'react';
import { Download, Check, Sparkles } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import PwaIOSInstallModal from './PwaIOSInstallModal';

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export default function PwaInstallButton({ className = '', variant = 'compact' }: PwaInstallButtonProps) {
  const { isInstalled, showIOSModal, setShowIOSModal, promptInstall } = usePwaInstall();

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span className="text-[11px]">App Terpasang</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={promptInstall}
        className={`relative group overflow-hidden px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${className}`}
        title="Pasang Aplikasi MyCashier ke layar utama HP / Desktop"
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>{variant === 'full' ? 'Install Aplikasi MyCashier' : 'Install App'}</span>
        <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
      </button>

      <PwaIOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
}
