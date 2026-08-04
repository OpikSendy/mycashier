'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/features/navbar/Navbar';
import BottomNav from '@/features/navbar/BottomNav';
import OnboardingView from '@/features/onboarding/OnboardingView';
import UserPwaApp from '@/features/user-pwa/UserPwaApp';
import AiChatWidget from '@/features/ai-assistant/AiChatWidget';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('mycashier_onboarding_seen');
      if (!hasSeen) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch (e) {
      setShowOnboarding(false);
    }
  }, []);

  const handleFinishOnboarding = () => {
    try {
      localStorage.setItem('mycashier_onboarding_seen', 'true');
    } catch (e) {}
    setShowOnboarding(false);
  };

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  if (showOnboarding === true) {
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
