import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type LocaleCode, type MessageCatalog, type MessageKey } from './types';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { uk } from './locales/uk';

const catalogs: Record<LocaleCode, MessageCatalog> = { pl, uk, en };

const STORAGE_KEY = 'cmflow.locale';

export function isLocaleCode(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function detectInitialLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocaleCode(stored)) {
      return stored;
    }
  } catch {
    // ignore storage failures
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split('-')[0];
    if (base && isLocaleCode(base)) {
      return base;
    }
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: LocaleCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function translate(locale: LocaleCode, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}

export function assertCatalogParity(): void {
  const keys = Object.keys(en) as MessageKey[];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      if (!catalogs[locale][key]) {
        throw new Error(`Missing locale key ${key} in ${locale}`);
      }
    }
  }
}
