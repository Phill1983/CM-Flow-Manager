import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThemeContextValue, ThemePreference } from './theme-context';

const STORAGE_KEY = 'cmflow.theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
  } catch {
    // ignore
  }
  return 'system';
}

function applyTheme(resolved: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useThemeController(): ThemeContextValue {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  const resolved = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );
}
