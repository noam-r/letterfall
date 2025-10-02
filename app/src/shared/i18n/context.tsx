import type { ReactNode } from 'react';
import { translations, type Language } from './translations';
import { I18nContext, type I18nContextType } from './context-types';

interface I18nProviderProps {
  children: ReactNode;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function I18nProvider({ children, language, onLanguageChange }: I18nProviderProps) {
  const t = translations[language] ?? translations.en;
  const isRTL = language === 'he';

  const contextValue: I18nContextType = {
    language,
    t,
    setLanguage: onLanguageChange,
    isRTL,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}
