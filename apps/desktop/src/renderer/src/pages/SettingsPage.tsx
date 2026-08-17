import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/useI18n';
import type { LocaleCode } from '@/i18n/types';
import { useTheme } from '@/theme/useTheme';
import type { ThemePreference } from '@/theme/theme-context';
import { UpdatesSection } from './settings/UpdatesSection';

export function SettingsPage() {
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { preference, setPreference } = useTheme();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 p-5 pb-8" aria-labelledby="settings-title">
      <h1 id="settings-title" className="text-cm-navy">
        {t('settings.title')}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-[length:var(--cm-text-h3)]">{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-40 flex-col gap-2">
            <Label htmlFor="language-select">{t('settings.language')}</Label>
            <select
              id="language-select"
              className="flex h-9 rounded-md border border-input bg-background px-3 text-[length:var(--cm-text-body)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={locale}
              onChange={(event) => setLocale(event.target.value as LocaleCode)}
            >
              {supportedLocales.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-40 flex-col gap-2">
            <Label htmlFor="theme-select">{t('settings.theme')}</Label>
            <select
              id="theme-select"
              className="flex h-9 rounded-md border border-input bg-background px-3 text-[length:var(--cm-text-body)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={preference}
              onChange={(event) => setPreference(event.target.value as ThemePreference)}
            >
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
            </select>
          </div>
        </CardContent>
      </Card>
      <UpdatesSection />
    </section>
  );
}
