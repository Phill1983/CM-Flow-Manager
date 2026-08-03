import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { detectInitialLocale, persistLocale, translate } from './catalog';
import type { LocaleCode, MessageKey } from './types';
import { SUPPORTED_LOCALES } from './types';

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: MessageKey) => string;
  supportedLocales: readonly LocaleCode[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => detectInitialLocale());

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    persistLocale(next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      supportedLocales: SUPPORTED_LOCALES,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
