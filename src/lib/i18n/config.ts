import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import zhTranslations from './locales/zh.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  zh: { translation: zhTranslations },
  ar: { translation: arTranslations },
};

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Initialize i18n only once
if (!i18n.isInitialized) {
  const initOptions: any = {
    resources,
    fallbackLng: 'en',
    lng: 'en', // Always start with English for SSR consistency
    supportedLngs: ['en', 'es', 'fr', 'de', 'zh', 'ar'],
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
      bindI18n: 'languageChanged', // Bind to languageChanged event
      bindI18nStore: 'added removed', // Bind to store events
    },
  };

  // Always use initReactI18next for React integration
  i18n.use(initReactI18next);

  // Only add detection configuration on client side
  if (isClient) {
    initOptions.detection = {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    };
    
    // Use LanguageDetector on client side
    i18n.use(LanguageDetector);
  }

  // Initialize i18n
  i18n.init(initOptions);
}

export default i18n;

