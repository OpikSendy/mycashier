'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/features/navbar/Navbar';
import BottomNav from '@/features/navbar/BottomNav';
import OnboardingView from '@/features/onboarding/OnboardingView';
import CustomerView from '@/features/customer/CustomerView';
import CashierView from '@/features/cashier/CashierView';
import KitchenView from '@/features/kitchen/KitchenView';
import ManagerView from '@/features/manager/ManagerView';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { activeView } = useApp();
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

  if (showOnboarding) {
    return <OnboardingView onComplete={handleFinishOnboarding} />;
  }

  return (
    <main className="min-h-screen relative selection:bg-emerald-500 selection:text-slate-950 pb-16">
      {/* Navigation Header */}
      <Navbar />

      {/* Dynamic Module Views */}
      {activeView === 'customer' && <CustomerView />}
      {activeView === 'cashier' && <CashierView />}
      {activeView === 'kitchen' && <KitchenView />}
      {activeView === 'manager' && <ManagerView />}

      {/* Floating Ask MyCashier AI Assistant */}
      <AiChatWidget />

      {/* PWA Mobile Bottom Navigation Bar */}
      <BottomNav onRestartOnboarding={handleRestartOnboarding} />
    </main>
  );
}
