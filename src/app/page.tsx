'use client';

import React from 'react';
import Navbar from '@/features/navbar/Navbar';
import CustomerView from '@/features/customer/CustomerView';
import CashierView from '@/features/cashier/CashierView';
import KitchenView from '@/features/kitchen/KitchenView';
import ManagerView from '@/features/manager/ManagerView';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { activeView } = useApp();

  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar />

      {/* Dynamic Module Views */}
      {activeView === 'customer' && <CustomerView />}
      {activeView === 'cashier' && <CashierView />}
      {activeView === 'kitchen' && <KitchenView />}
      {activeView === 'manager' && <ManagerView />}

      {/* Floating Ask MyCashier AI Assistant */}
      <AiChatWidget />
    </main>
  );
}
