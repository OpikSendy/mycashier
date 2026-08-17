'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  Monitor,
  UtensilsCrossed,
  Delete,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp, UserRole, ROLE_PINS } from '@/context/AppContext';
import { DEFAULT_ROLE_PINS, ROLE_DISPLAY_NAMES } from '@/lib/auth';

interface QuickPinPadModalProps {
  requiredRole?: UserRole;
  initialRole?: UserRole;
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (role: UserRole) => void;
  redirectOnSuccess?: string;
}

// ── Web Audio API Tactile Sound Engine ────────────────────────────────
function playFeedbackSound(type: 'click' | 'success' | 'error' | 'clear') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      // Pleasant double chime: C5 -> G5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } else if (type === 'error') {
      // Low thud buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'clear') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (_) {}
}

export default function QuickPinPadModal({
  requiredRole,
  initialRole = 'cashier',
  title,
  isOpen = true,
  onClose,
  onSuccess,
  redirectOnSuccess,
}: QuickPinPadModalProps) {
  const router = useRouter();
  const { loginAs, authRole } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    requiredRole || initialRole || 'cashier'
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const maxPinLength = 4;
  const demoPin = DEFAULT_ROLE_PINS[selectedRole] || ROLE_PINS[selectedRole as keyof typeof ROLE_PINS] || '1234';

  const roleConfigs: { id: UserRole; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    {
      id: 'cashier',
      label: 'Kasir POS',
      icon: <Monitor className="w-4 h-4" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'kitchen',
      label: 'Dapur KDS',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'admin',
      label: 'Admin CMS',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
    },
  ];

  // If requiredRole is enforced, restrict tabs
  const visibleRoles = requiredRole
    ? roleConfigs.filter((r) => r.id === requiredRole || r.id === 'admin')
    : roleConfigs;

  // ── Authenticate PIN ────────────────────────────────────────────────
  const submitPin = useCallback(
    async (pinToSubmit: string, targetRole: UserRole) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setErrorMsg(null);

      try {
        const success = await loginAs(targetRole, pinToSubmit);

        if (success) {
          if (soundEnabled) playFeedbackSound('success');
          if (onSuccess) {
            onSuccess(targetRole);
          }
          if (redirectOnSuccess) {
            router.push(redirectOnSuccess);
          } else if (targetRole === 'cashier') {
            router.push('/cashier');
          } else if (targetRole === 'kitchen') {
            router.push('/kitchen');
          } else if (targetRole === 'admin') {
            router.push('/admin');
          }
          if (onClose) onClose();
        } else {
          if (soundEnabled) playFeedbackSound('error');
          setIsShaking(true);
          setErrorMsg(`PIN untuk ${ROLE_DISPLAY_NAMES[targetRole] || targetRole} tidak valid.`);
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 800);
        }
      } catch (err: any) {
        if (soundEnabled) playFeedbackSound('error');
        setIsShaking(true);
        setErrorMsg('Gagal memverifikasi PIN. Silakan coba lagi.');
        setTimeout(() => setIsShaking(false), 800);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, loginAs, soundEnabled, onSuccess, redirectOnSuccess, router, onClose]
  );

  // ── Auto-submit when 4 digits are entered ────────────────────────────
  useEffect(() => {
    if (pin.length === maxPinLength) {
      submitPin(pin, selectedRole);
    }
  }, [pin, selectedRole, submitPin]);

  // ── Handle Keypad Button Click ──────────────────────────────────────
  const handleDigitPress = (digit: string) => {
    if (pin.length < maxPinLength && !isSubmitting) {
      if (soundEnabled) playFeedbackSound('click');
      setPin((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isSubmitting) {
      if (soundEnabled) playFeedbackSound('click');
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    if (pin.length > 0) {
      if (soundEnabled) playFeedbackSound('clear');
      setPin('');
      setErrorMsg(null);
    }
  };

  const handleDemoQuickLogin = () => {
    if (soundEnabled) playFeedbackSound('click');
    setPin(demoPin);
    submitPin(demoPin, selectedRole);
  };

  // ── Physical Keyboard Event Listener ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      } else if (e.key === 'Enter' && pin.length > 0) {
        submitPin(pin, selectedRole);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, selectedRole, isSubmitting, soundEnabled]);

  if (!isOpen) return null;

  const currentRoleConfig = roleConfigs.find((r) => r.id === selectedRole) || roleConfigs[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div
        className={`w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 transition-transform duration-200 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header & Sound Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (onClose ? onClose() : router.push('/'))}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>PIN Access Guard</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'Matikan Suara Chime' : 'Nyalakan Suara Chime'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          {visibleRoles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  if (selectedRole !== role.id) {
                    if (soundEnabled) playFeedbackSound('click');
                    setSelectedRole(role.id);
                    setPin('');
                    setErrorMsg(null);
                  }
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm scale-102 border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <div className={isSelected ? role.color : ''}>{role.icon}</div>
                <span className="text-[11px] leading-tight">{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Title & Target Info */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {title || `Autentikasi ${ROLE_DISPLAY_NAMES[selectedRole]}`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Masukkan 4-digit PIN keamanan staf
          </p>
        </div>

        {/* Animated PIN Dots Visualizer */}
        <div className="flex items-center justify-center gap-4 py-2">
          {Array.from({ length: maxPinLength }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-500 dark:bg-emerald-400 scale-125 shadow-md shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center justify-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-center">{errorMsg}</span>
          </div>
        )}

        {/* 3x4 Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isSubmitting}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-95 text-slate-800 dark:text-slate-100 font-black text-xl flex items-center justify-center transition-all border border-slate-200/80 dark:border-slate-700/60 shadow-xs cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-slate-500 dark:text-slate-400 font-bold text-xs flex flex-col items-center justify-center transition-all border border-slate-200/80 dark:border-slate-700/60 active:scale-95 cursor-pointer disabled:opacity-40"
            title="Hapus Semua"
          >
            <RotateCcw className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Clear</span>
          </button>

          {/* Digit 0 */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isSubmitting}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-95 text-slate-800 dark:text-slate-100 font-black text-xl flex items-center justify-center transition-all border border-slate-200/80 dark:border-slate-700/60 shadow-xs cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 text-slate-500 dark:text-slate-400 font-bold text-xs flex flex-col items-center justify-center transition-all border border-slate-200/80 dark:border-slate-700/60 active:scale-95 cursor-pointer disabled:opacity-40"
            title="Hapus Digit Terakhir"
          >
            <Delete className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Hapus</span>
          </button>
        </div>

        {/* 1-Click Demo PIN Shortcut */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            PIN Demo {ROLE_DISPLAY_NAMES[selectedRole].split(' ')[0]}:{' '}
            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {demoPin}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleDemoQuickLogin}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[10px] flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            <span>1-Klik Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
