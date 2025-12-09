'use client';

import { useEffect } from 'react';
import '@/lib/i18n/config';
import { useTranslation } from 'react-i18next';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Detect and apply language after mount to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('i18nextLng');
      if (savedLang && savedLang !== i18n.language) {
        i18n.changeLanguage(savedLang);
      } else if (!savedLang) {
        // If no saved language, detect from browser
        const browserLang = navigator.language.split('-')[0];
        const detectedLang = ['en', 'es', 'fr', 'de', 'zh', 'ar'].includes(browserLang) ? browserLang : 'en';
        if (detectedLang !== i18n.language) {
          i18n.changeLanguage(detectedLang);
        }
      }
      
      // Update HTML lang attribute
      document.documentElement.lang = i18n.language;
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Update HTML lang attribute when language changes
    if (typeof document !== 'undefined' && i18n.language) {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  return <>{children}</>;
}

