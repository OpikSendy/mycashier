'use client';

import { useEffect } from 'react';

/**
 * PwaZoomLock component
 * Strictly locks browser zooming (pinch gesture zoom, double-tap zoom, gesture zoom Safari iOS, and ctrl+wheel zoom)
 * while preserving 100% native hardware-accelerated mouse wheel, trackpad, and touch scrolling.
 */
export default function PwaZoomLock() {
  useEffect(() => {
    let lastTouchEnd = 0;

    // 1. Prevent Safari iOS gesture zooming (pinch-to-zoom)
    const handleGesture = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    // 2. Prevent multi-touch touchmove zooming (2+ fingers)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    };

    // 3. Prevent double-tap to zoom on non-input elements
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const target = e.target as HTMLElement | null;

      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isInput && now - lastTouchEnd <= 300 && e.cancelable) {
        // Only prevent default if double tap target is not interactive
        if (target && !target.closest('button, a, select, input, textarea')) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    // 4. Prevent Ctrl + Wheel zoom on desktop/trackpads ONLY when Ctrl key is pressed
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey && e.cancelable) {
        e.preventDefault();
      }
    };

    // Register gesture listeners (Safari iOS vendor specific)
    const nonPassiveOpts: AddEventListenerOptions = { passive: false };

    document.addEventListener('gesturestart', handleGesture, nonPassiveOpts);
    document.addEventListener('gesturechange', handleGesture, nonPassiveOpts);
    document.addEventListener('gestureend', handleGesture, nonPassiveOpts);

    document.addEventListener('touchmove', handleTouchMove, nonPassiveOpts);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheel, nonPassiveOpts);

    return () => {
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return null;
}
