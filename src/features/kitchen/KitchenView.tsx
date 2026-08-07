'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { OrderStatus } from '@/data/initialData';
import { UtensilsCrossed, Clock, CheckCircle2, Flame, BellRing, Volume2 } from 'lucide-react';

/** Web Audio API chime generator for kitchen alerts (no external MP3 asset needed) */
function playKitchenChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) {}
}

export default function KitchenView() {
  const { language, orders, updateOrderStatus } = useApp();
  const t = TRANSLATIONS[language].kitchen;

  // Live timer tick every 1 second
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    playKitchenChime();
  };

  /** Calculate elapsed seconds from createdAt time string HH:MM:SS or fallback timestamp */
  const getElapsedSeconds = (createdAtStr: string): number => {
    try {
      const parts = createdAtStr.split(':');
      if (parts.length === 3) {
        const orderDate = new Date();
        orderDate.setHours(Number(parts[0]), Number(parts[1]), Number(parts[2]), 0);
        const diffMs = Math.max(0, now - orderDate.getTime());
        return Math.floor(diffMs / 1000);
      }
    } catch (_) {}
    return 120; // default 2 mins if unparseable
  };

  /** Format seconds to MM:SS string */
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  /** Return badge class based on elapsed time threshold */
  const getTimerBadgeClass = (seconds: number): string => {
    if (seconds < 600) {
      // < 10 mins: Green
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (seconds < 1200) {
      // 10 - 20 mins: Amber
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else {
      // > 20 mins: Urgent Red
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse font-black';
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

  const columns: { id: OrderStatus; label: string; color: string; icon: React.ReactNode }[] = [
    { id: 'PENDING', label: t.pending, color: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10', icon: <Clock className="w-4 h-4" /> },
    { id: 'COOKING', label: t.cooking, color: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10', icon: <Flame className="w-4 h-4" /> },
    { id: 'READY', label: t.ready, color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', icon: <BellRing className="w-4 h-4" /> },
    { id: 'SERVED', label: t.served, color: 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24 text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="mb-6 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 flex-shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1 border border-amber-500/20">
              <span>{t.kdsTitle}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {language === 'ID' ? 'Papan Tiket Antrean Dapur & Bar' : 'Kitchen & Bar Ticket Display System'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.kdsSub}
            </p>
          </div>
        </div>
        <button
          onClick={playKitchenChime}
          className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-2xs"
          title="Tes Suara Chime Dapur"
        >
          <Volume2 className="w-4 h-4 text-emerald-500" />
          <span>Tes Chime Notif</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colOrders = getOrdersByStatus(col.id);
          return (
            <div key={col.id} className="p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between min-h-[600px] shadow-xs">
              <div>
                {/* Column Header */}
                <div className={`p-3 rounded-2xl border ${col.color} flex items-center justify-between mb-4 font-extrabold text-xs shadow-2xs`}>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span>{col.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-950 font-black text-slate-900 dark:text-white shadow-2xs">
                    {colOrders.length}
                  </span>
                </div>

                {/* Ticket Cards */}
                <div className="space-y-4">
                  {colOrders.map((order) => {
                    const elapsedSecs = getElapsedSeconds(order.createdAt);
                    const timerBadgeClass = getTimerBadgeClass(elapsedSecs);

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:shadow-md transition-all relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {order.tableNumber}
                          </span>

                          {/* Live Elapsed Stopwatch Badge */}
                          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border font-mono font-extrabold ${timerBadgeClass}`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(elapsedSecs)}</span>
                          </div>
                        </div>

                        <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{language === 'ID' ? 'Pemesan:' : 'Customer:'} {order.customerName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{order.createdAt}</span>
                        </div>

                        {/* Items to Cook */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-xs text-slate-800 dark:text-slate-200">
                              <span className="font-black text-emerald-600 dark:text-emerald-400">{item.quantity}x</span> {item.productName}
                              {item.notes && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold italic pl-3.5 mt-0.5">
                                  ↳ {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="pt-2">
                          {col.id === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'COOKING')}
                              className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <Flame className="w-4 h-4" />
                              <span>{t.markCooking}</span>
                            </button>
                          )}

                          {col.id === 'COOKING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'READY')}
                              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <BellRing className="w-4 h-4" />
                              <span>{t.markReady}</span>
                            </button>
                          )}

                          {col.id === 'READY' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'SERVED')}
                              className="w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>{t.markServed}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
