'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageDirectionProps {
  children: React.ReactNode;
}

export function LanguageDirection({ children }: LanguageDirectionProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update HTML dir attribute after mount to avoid hydration mismatch
    const isRTL = i18n.language === 'ar';
    const direction = isRTL ? 'rtl' : 'ltr';
    
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
    }
  }, [i18n.language]);

  return <>{children}</>;
}

