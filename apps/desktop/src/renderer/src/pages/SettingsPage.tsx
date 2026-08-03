import { useI18n } from '../i18n/I18nProvider';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import type { LocaleCode } from '../i18n/types';

export function SettingsPage() {
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { preference, setPreference } = useTheme();

  return (
    <section className="page" aria-labelledby="settings-title">
      <h1 id="settings-title">{t('settings.title')}</h1>
      <div className="panel toolbar">
        <label className="field" htmlFor="language-select">
          {t('settings.language')}
          <select
            id="language-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as LocaleCode)}
          >
            {supportedLocales.map((code) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="theme-select">
          {t('settings.theme')}
          <select
            id="theme-select"
            value={preference}
            onChange={(event) => setPreference(event.target.value as ThemePreference)}
          >
            <option value="system">{t('settings.themeSystem')}</option>
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
          </select>
        </label>
      </div>
    </section>
  );
}
