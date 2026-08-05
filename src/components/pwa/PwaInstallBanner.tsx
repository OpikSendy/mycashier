'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import PwaIOSInstallModal from './PwaIOSInstallModal';

export default function PwaInstallBanner() {
  const { isInstalled, showIOSModal, setShowIOSModal, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    // Check if user dismissed banner in this session
    try {
      const isDismissed = sessionStorage.getItem('mycashier_pwa_banner_dismissed');
      if (!isDismissed && !isInstalled) {
        setDismissed(false);
      }
    } catch (e) {
      if (!isInstalled) setDismissed(false);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('mycashier_pwa_banner_dismissed', 'true');
    } catch (e) {}
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      <aside className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-300 pointer-events-auto">
        <div className="relative rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-4 shadow-2xl shadow-emerald-500/15 flex items-center justify-between gap-3 text-slate-100 overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          {/* App Icon & Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex-shrink-0 relative bg-slate-950">
              <Image src="/icon.jpg" alt="MyCashier Logo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-white truncate">Install MyCashier</h4>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Akses cepat tanpa browser &amp; hemat kuota
              </p>
            </div>
          </div>

          {/* Action & Dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={promptInstall}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Tutup Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <PwaIOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
}
