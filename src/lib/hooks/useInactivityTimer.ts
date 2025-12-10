'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseInactivityTimerOptions {
  timeout: number; // in milliseconds
  onLogout: () => void;
  warningTime?: number; // time before logout to show warning (in milliseconds)
  onWarning?: () => void;
}

export function useInactivityTimer({
  timeout,
  onLogout,
  warningTime = 60000, // 1 minute warning by default
  onWarning,
}: UseInactivityTimerOptions) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Set warning timer
    if (onWarning && warningTime < timeout) {
      warningTimeoutRef.current = setTimeout(() => {
        onWarning();
      }, timeout - warningTime);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      onLogout();
    }, timeout);
  }, [timeout, warningTime, onLogout, onWarning]);

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetTimer]);

  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current,
  };
}

