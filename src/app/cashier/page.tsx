'use client';

import React from 'react';
import Navbar from '@/features/navbar/Navbar';
import CashierPosApp from '@/features/cashier-pos/CashierPosApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import AuthGuardModal from '@/components/auth/AuthGuardModal';
import { useApp } from '@/context/AppContext';

export default function CashierPage() {
  const { authRole } = useApp();

  const isAllowed = authRole === 'cashier' || authRole === 'admin';

  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      {!isAllowed ? (
        <AuthGuardModal requiredRole="cashier" title="Stasiun Kasir POS" />
      ) : (
        <CashierPosApp />
      )}

      <AiChatWidget />
    </main>
  );
}
