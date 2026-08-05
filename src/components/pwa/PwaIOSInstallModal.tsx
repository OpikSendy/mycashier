'use client';

import React from 'react';
import { Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface PwaIOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaIOSInstallModal({ isOpen, onClose }: PwaIOSInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border border-slate-800 p-6 shadow-2xl shadow-emerald-500/10 text-slate-100 overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30 relative flex-shrink-0 bg-slate-950">
            <Image src="/icon.jpg" alt="MyCashier Logo" width={48} height={48} className="object-cover w-full h-full" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-0.5">
              <Sparkles className="w-3 h-3" /> Install App PWA
            </div>
            <h3 className="text-lg font-black text-white leading-tight">Install MyCashier</h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Pasang aplikasi <strong>MyCashier</strong> ke layar utama iPhone/iPad atau browser Anda tanpa mendownload dari App Store.
        </p>

        {/* Instructions List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0 mt-0.5">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">1. Ketuk Tombol Bagikan (Share)</p>
              <p className="text-[11px] text-slate-400">
                Tekan tombol <span className="text-emerald-400 font-semibold">Share ⎘</span> pada toolbar Safari di bagian bawah/atas browser Anda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">2. Tambahkan ke Layar Utama</p>
              <p className="text-[11px] text-slate-400">
                Gulir ke bawah pada menu opsi lalu pilih <span className="text-cyan-400 font-semibold">&ldquo;Tambah ke Layar Utama&rdquo;</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">3. Konfirmasi &amp; Selesai</p>
              <p className="text-[11px] text-slate-400">
                Ketuk <span className="text-amber-400 font-semibold">&ldquo;Tambah&rdquo;</span> di pojok kanan atas. Ikon MyCashier siap digunakan!
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Saya Mengerti</span>
        </button>
      </div>
    </div>
  );
}
