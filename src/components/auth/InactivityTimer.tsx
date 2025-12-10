'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInactivityTimer } from '@/lib/hooks/useInactivityTimer';
import { useTranslation } from 'react-i18next';

const INACTIVITY_TIMEOUT = 12 * 60 * 1000; // 12 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout (at 10 minutes)

export function InactivityTimer() {
  const { logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowWarning(false);
    logout();
  };

  const handleWarning = () => {
    setShowWarning(true);
    let remaining = Math.ceil(WARNING_TIME / 1000);
    setTimeRemaining(remaining);
    
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Update time remaining every second
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 1000);
  };

  const handleStayLoggedIn = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowWarning(false);
    setTimeRemaining(0);
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  useInactivityTimer({
    timeout: INACTIVITY_TIMEOUT,
    warningTime: WARNING_TIME,
    onLogout: handleLogout,
    onWarning: handleWarning,
  });

  // Only show timer when user is authenticated
  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-secondary-900">
                {t('auth.inactivityWarning', 'Session Timeout Warning')}
              </h3>
              <p className="text-sm text-secondary-600">
                {t('auth.inactivityMessage', 'You will be logged out due to inactivity')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            {t('auth.inactivityCountdown', 'Logging out in {{seconds}} seconds...', {
              seconds: Math.ceil(timeRemaining)
            })}
          </p>
          <div className="mt-2 w-full bg-amber-200 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeRemaining / (WARNING_TIME / 1000)) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            {t('auth.stayLoggedIn', 'Stay Logged In')}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors font-semibold"
          >
            {t('auth.logoutNow', 'Logout Now')}
          </button>
        </div>
      </div>
    </div>
  );
}

