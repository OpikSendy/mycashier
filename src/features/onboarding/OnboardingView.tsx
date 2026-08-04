'use client';

import React, { useState } from 'react';
import { ShoppingBag, Sparkles, ShieldCheck, QrCode, ArrowRight, ChevronLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface OnboardingViewProps {
  onComplete: () => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const { selectedTable, setSelectedTable } = useApp();

  const tables = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-slate-50 to-emerald-50/30 dark:from-[#0b0f19] dark:to-[#0f172a] text-slate-900 dark:text-slate-100 select-none">
      {/* Top Header Logo */}
      <div className="flex justify-center pt-4">
        <div className="flex items-center gap-2 font-black text-xl text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            MC
          </div>
          <span>My<span className="text-emerald-500">Cashier</span></span>
        </div>
      </div>

      {/* Slide Content */}
      <div className="max-w-sm mx-auto w-full text-center my-auto py-8">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-xl">
              <ShoppingBag className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Selamat Datang di MyCashier
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Platform Kasir Online & Pemesanan Mandiri Meja F&B terpadu. Cepat, instan, dan terintegrasi dari meja ke dapur.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center shadow-xl">
              <Sparkles className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                100% Terintegrasi & Instan
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Pesanan dari meja pelanggan langsung diteruskan ke papan dapur (KDS) dan kasir tanpa antrean panjang.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-xl">
              <QrCode className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Satu Langkah Terakhir
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Pilih nomor meja Anda untuk memulai pemesanan mandiri:
              </p>

              <div className="pt-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
                >
                  {tables.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action & Pagination Dots */}
      <div className="max-w-sm mx-auto w-full space-y-6 pb-6">
        {/* Dots */}
        <div className="flex justify-center items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === i
                  ? 'w-8 bg-emerald-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              if (step < 3) {
                setStep((s) => s + 1);
              } else {
                onComplete();
              }
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <span>{step === 3 ? 'Mulai Sekarang' : 'Lanjut'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
