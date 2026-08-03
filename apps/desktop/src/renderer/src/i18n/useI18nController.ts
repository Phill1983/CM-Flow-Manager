import { useCallback, useMemo, useState } from 'react';
import { detectInitialLocale, persistLocale, translate } from './catalog';
import type { I18nContextValue } from './i18n-context';
import type { LocaleCode } from './types';
import { SUPPORTED_LOCALES } from './types';

export function useI18nController(): I18nContextValue {
  const [locale, setLocaleState] = useState<LocaleCode>(() => detectInitialLocale());

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    persistLocale(next);
    document.documentElement.lang = next;
  }, []);

  return useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      supportedLocales: SUPPORTED_LOCALES,
    }),
    [locale, setLocale],
  );
}
