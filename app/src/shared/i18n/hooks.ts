import { useContext } from 'react';
import { I18nContext } from './context-types';
import type { Translations } from './translations';

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Convenience hook for just getting translations
export function useTranslations(): Translations {
  return useI18n().t;
}