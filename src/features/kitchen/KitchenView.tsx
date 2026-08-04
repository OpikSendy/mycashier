'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { OrderStatus } from '@/data/initialData';
import { UtensilsCrossed, Clock, CheckCircle2, Flame, BellRing, ArrowRight } from 'lucide-react';

export default function KitchenView() {
  const { language, orders, updateOrderStatus } = useApp();
  const t = TRANSLATIONS[language].kitchen;

  const getOrdersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

  const columns: { id: OrderStatus; label: string; color: string; icon: React.ReactNode }[] = [
    { id: 'PENDING', label: t.pending, color: 'border-amber-500/40 text-amber-500 bg-amber-500/10', icon: <Clock className="w-4 h-4" /> },
    { id: 'COOKING', label: t.cooking, color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', icon: <Flame className="w-4 h-4" /> },
    { id: 'READY', label: t.ready, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', icon: <BellRing className="w-4 h-4" /> },
    { id: 'SERVED', label: t.served, color: 'border-slate-500/40 text-slate-400 bg-slate-500/10', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>{t.kdsTitle}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          Papan Tiket Antrean Dapur & Bar
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
          {t.kdsSub}
        </p>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colOrders = getOrdersByStatus(col.id);
          return (
            <div key={col.id} className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[600px]">
              <div>
                {/* Column Header */}
                <div className={`p-3 rounded-2xl border ${col.color} flex items-center justify-between mb-4 font-bold text-xs`}>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span>{col.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/40 text-white font-black">
                    {colOrders.length}
                  </span>
                </div>

                {/* Ticket Cards */}
                <div className="space-y-4">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {order.tableNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{order.createdAt}</span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Pemesan: {order.customerName}
                      </div>

                      {/* Items to Cook */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-xs text-slate-800 dark:text-slate-200">
                            <span className="font-black text-emerald-500">{item.quantity}x</span> {item.productName}
                            {item.notes && (
                              <div className="text-[10px] text-amber-500 font-semibold italic pl-4">
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
                            onClick={() => updateOrderStatus(order.id, 'COOKING')}
                            className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{t.markCooking}</span>
                          </button>
                        )}

                        {col.id === 'COOKING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>{t.markReady}</span>
                          </button>
                        )}

                        {col.id === 'READY' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SERVED')}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.markServed}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
