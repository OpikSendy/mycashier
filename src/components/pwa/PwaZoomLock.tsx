'use client';

import { useEffect } from 'react';

/**
 * PwaZoomLock component
 * Strictly locks browser zooming (pinch gesture zoom, double-tap zoom, gesture zoom Safari iOS, and ctrl+wheel zoom)
 * to provide a seamless native app experience in PWA mode.
 */
export default function PwaZoomLock() {
  useEffect(() => {
    let lastTouchEnd = 0;

    // 1. Prevent Safari iOS gesture zooming (pinch-to-zoom)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 2. Prevent multi-touch touchmove zooming (2+ fingers)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Prevent double-tap to zoom on non-input elements
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const target = e.target as HTMLElement | null;
      
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );

      if (!isInput && now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // 4. Prevent Ctrl + Wheel zoom on desktop/trackpads
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Add passive: false to allow e.preventDefault()
    const options: AddEventListenerOptions = { passive: false };

    // Register gesture listeners (Safari iOS vendor specific)
    document.addEventListener('gesturestart', handleGesture, options);
    document.addEventListener('gesturechange', handleGesture, options);
    document.addEventListener('gestureend', handleGesture, options);

    // Register touch & wheel listeners
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    window.addEventListener('wheel', handleWheel, options);

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
