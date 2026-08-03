import { createContext } from 'react';
import type { LocaleCode, MessageKey } from './types';

export type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: MessageKey) => string;
  supportedLocales: readonly LocaleCode[];
};

export const I18nContext = createContext<I18nContextValue | null>(null);
