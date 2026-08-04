'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/features/navbar/Navbar';
import BottomNav from '@/features/navbar/BottomNav';
import OnboardingView from '@/features/onboarding/OnboardingView';
import UserPwaApp from '@/features/user-pwa/UserPwaApp';
import CashierPosApp from '@/features/cashier-pos/CashierPosApp';
import AdminCmsApp from '@/features/admin-cms/AdminCmsApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { activeRole } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeen = localStorage.getItem('mycashier_onboarding_seen');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('mycashier_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  if (!mounted) return null;

  if (showOnboarding && activeRole === 'user_pwa') {
    return <OnboardingView onComplete={handleFinishOnboarding} />;
  }

  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950 pb-16">
      {/* Navigation Header with Role Switcher */}
      <Navbar />

      {/* Role 1: Customer Mobile PWA */}
      {activeRole === 'user_pwa' && <UserPwaApp />}

      {/* Role 2: Dedicated Cashier Web POS Station */}
      {activeRole === 'cashier_pos' && <CashierPosApp />}

      {/* Role 3: Admin CMS Master Control */}
      {activeRole === 'admin_cms' && <AdminCmsApp />}

      {/* Ask MyCashier AI Assistant */}
      <AiChatWidget />

      {/* PWA Mobile Bottom Navigation Bar (Rendered for User PWA mode) */}
      {activeRole === 'user_pwa' && (
        <BottomNav onRestartOnboarding={handleRestartOnboarding} />
      )}
    </main>
  );
}
