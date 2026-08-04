'use client';

import React from 'react';
import Navbar from '@/features/navbar/Navbar';
import CashierPosApp from '@/features/cashier-pos/CashierPosApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';

export default function CashierPage() {
  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />
      <CashierPosApp />
      <AiChatWidget />
    </main>
  );
}
