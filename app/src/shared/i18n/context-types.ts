import { createContext } from 'react';
import type { Language, Translations } from './translations';

export interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);