'use client';

import React from 'react';
import Navbar from '@/features/navbar/Navbar';
import AdminCmsApp from '@/features/admin-cms/AdminCmsApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';

export default function AdminPage() {
  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />
      <AdminCmsApp />
      <AiChatWidget />
    </main>
  );
}
