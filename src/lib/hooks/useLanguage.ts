import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();

  // Map i18n language codes to speech recognition language codes
  const getSpeechLanguage = (): string => {
    const langMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ar: 'ar-SA',
    };
    return langMap[i18n.language] || 'en-US';
  };

  // Check if current language is RTL
  const isRTL = (): boolean => {
    return i18n.language === 'ar';
  };

  // Get current language direction
  const getDirection = (): 'ltr' | 'rtl' => {
    return isRTL() ? 'rtl' : 'ltr';
  };

  return {
    language: i18n.language,
    getSpeechLanguage,
    isRTL,
    getDirection,
  };
}

