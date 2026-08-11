'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Download, Printer, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Order } from '@/data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  totalRevenue: number;
}

export default function AiBriefingModal({ isOpen, onClose, orders, totalRevenue }: Props) {
  const { language } = useApp();
  const isEn = language === 'EN';

  const [briefingText, setBriefingText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      // Find top product
      const productMap: Record<string, { name: string; count: number }> = {};
      orders.forEach((o) => {
        o.items.forEach((i) => {
          if (!productMap[i.productId]) productMap[i.productId] = { name: i.productName, count: 0 };
          productMap[i.productId].count += i.quantity;
        });
      });
      const topProduct = Object.values(productMap).sort((a, b) => b.count - a.count)[0] || null;

      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders,
          totalRevenue,
          topProduct,
          lowStockCount: 2,
        }),
      });
      const json = await res.json();
      if (json.result) {
        setBriefingText(json.result);
      }
    } catch (_) {
      setBriefingText('Gagal memuat briefing AI. Pastikan koneksi internet stabil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadMarkdown = () => {
    const blob = new Blob([briefingText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Executive_Daily_Briefing_MyCashier_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 print:border-none print:shadow-none print:max-w-none print:max-h-none print:bg-white print:text-black">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isEn ? 'Executive AI Daily Sales Briefing' : 'Laporan Analisis Executive AI Harian'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'AI-driven revenue insights, operational tips & marketing actions'
                  : 'Analisis cerdas omzet, tren menu terlaris & rekomendasi profit bisnis F&B'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="px-3 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {isEn ? 'Regenerate Briefing' : 'Generasi Ulang'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-sm">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Menyusun analisis bisnis & rekomendasi executive AI...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200 text-xs md:text-sm leading-relaxed space-y-3 print:text-black">
              {briefingText.split('\n').map((line, idx) => {
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-lg font-black text-white print:text-black border-b border-slate-800 pb-2 pt-2">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm font-bold text-indigo-400 print:text-black pt-3">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('* ')) {
                  return (
                    <p key={idx} className="pl-4 text-slate-300 print:text-black">
                      • {line.replace('* ', '')}
                    </p>
                  );
                }
                if (line.trim() === '---') {
                  return <hr key={idx} className="border-slate-800 print:border-slate-300 my-2" />;
                }
                return <p key={idx} className="text-slate-300 print:text-black">{line}</p>;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Executive Briefing Siap Diekspor</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>

      </div>
    </div>
  );
}
