'use client';

import React from 'react';
import Navbar from '@/features/navbar/Navbar';
import AdminCmsApp from '@/features/admin-cms/AdminCmsApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import AuthGuardModal from '@/components/auth/AuthGuardModal';
import { useApp } from '@/context/AppContext';

export default function AdminPage() {
  const { authRole } = useApp();

  const isAllowed = authRole === 'admin';

  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      {!isAllowed ? (
        <AuthGuardModal requiredRole="admin" title="Admin CMS Master Control" />
      ) : (
        <AdminCmsApp />
      )}

      <AiChatWidget />
    </main>
  );
}
