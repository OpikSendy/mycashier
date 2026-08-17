'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Monitor, UtensilsCrossed, ShieldCheck, HelpCircle } from 'lucide-react';

interface BottomNavProps {
  onRestartOnboarding: () => void;
}

export default function BottomNav({ onRestartOnboarding }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'User PWA', path: '/', icon: <ShoppingBag className="w-5 h-5" /> },
    { href: '/cashier', label: 'Kasir POS', path: '/cashier', icon: <Monitor className="w-5 h-5" /> },
    { href: '/kitchen', label: 'Dapur KDS', path: '/kitchen', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { href: '/admin', label: 'Admin CMS', path: '/admin', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-2 px-3 flex items-center justify-around select-none shadow-2xl">
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1 rounded-xl ${
              isActive
                ? 'text-emerald-500 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-emerald-500/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={onRestartOnboarding}
        className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1"
        title="Info / Onboarding"
      >
        <div className="p-1">
          <HelpCircle className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-semibold">Info</span>
      </button>
    </nav>
  );
}
