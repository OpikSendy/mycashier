'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/features/navbar/Navbar';
import BottomNav from '@/features/navbar/BottomNav';
import OnboardingView from '@/features/onboarding/OnboardingView';
import UserPwaApp from '@/features/user-pwa/UserPwaApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';

export default function Home() {
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

      {/* Role 1: Customer Mobile PWA App */}
      <UserPwaApp />

      {/* Floating Ask MyCashier AI Assistant */}
      <AiChatWidget />

      {/* PWA Mobile Bottom Navigation Bar */}
      <BottomNav onRestartOnboarding={handleRestartOnboarding} />
    </main>
  );
}
