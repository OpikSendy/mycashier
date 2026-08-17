'use client';

import React from 'react';
import AdminCmsApp from '@/features/admin-cms/AdminCmsApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import QuickPinPadModal from '@/components/auth/QuickPinPadModal';
import { useApp } from '@/context/AppContext';

export default function AdminPage() {
  const { authRole } = useApp();
  const isAllowed = authRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {!isAllowed ? (
        <QuickPinPadModal requiredRole="admin" title="Admin CMS Master Control" />
      ) : (
        <AdminCmsApp />
      )}
      <AiChatWidget />
    </div>
  );
}
