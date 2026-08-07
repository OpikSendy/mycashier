'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOrderNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (e) {
        console.warn('Notification permission request failed:', e);
      }
    }
    return 'denied' as NotificationPermission;
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            icon: '/icon.jpg',
            badge: '/icon.jpg',
            ...options,
          });
        } catch (e) {
          console.warn('Failed to send notification:', e);
        }
      }
    },
    []
  );

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}
