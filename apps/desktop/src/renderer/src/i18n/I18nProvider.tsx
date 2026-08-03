import type { ReactNode } from 'react';
import { I18nContext } from './i18n-context';
import { useI18nController } from './useI18nController';

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useI18nController();
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
