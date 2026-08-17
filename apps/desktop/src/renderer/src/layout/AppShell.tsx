import { Outlet } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '@/i18n/useI18n';
import type { LocaleCode } from '@/i18n/types';
import { useTheme } from '@/theme/useTheme';
import type { ThemePreference } from '@/theme/theme-context';
import cmMarkUrl from '@/assets/cm-ui/logo/cm-app-icon.png';
import sidebarBgUrl from '@/assets/cm-ui/graphics/sidebar-bg.jpg';
import { SidebarItem } from '@/components/cm/SidebarItem';
import {
  IconAbout,
  IconChart,
  IconDashboard,
  IconGlobe,
  IconMoon,
  IconPdf,
  IconScales,
  IconSettings,
  IconUpdates,
  IconUser,
  IconWrench,
} from '@/components/cm/icons';

export function AppShell() {
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { preference, setPreference } = useTheme();

  return (
    <div className="grid h-full min-h-full grid-cols-[minmax(15.5rem,17.5%)_1fr] bg-cm-light-gray">
      <aside
        className="relative flex flex-col overflow-hidden bg-cm-navy px-3.5 py-6 text-white"
        aria-label={t('app.name')}
      >
        <div
          className="pointer-events-none absolute inset-x-[-18%] bottom-[-8%] h-[22rem] opacity-[0.28]"
          style={{
            backgroundImage: `url(${sidebarBgUrl})`,
            backgroundSize: '170%',
            backgroundPosition: 'center bottom',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />

        <div className="relative z-10 flex items-center gap-3.5 px-2 pb-2 pt-1">
          <img
            src={cmMarkUrl}
            alt=""
            width={52}
            height={52}
            className="size-[3.25rem] object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            aria-hidden="true"
          />
          <div className="min-w-0 text-[1.05rem] font-bold uppercase leading-[1.05] tracking-[0.05em]">
            <span className="text-white">Flow</span>
            <br />
            <span className="italic text-cm-yellow">Manager</span>
          </div>
        </div>

        <nav className="relative z-10 mt-10 flex flex-col gap-1.5" aria-label="Primary">
          <SidebarItem to="/" end icon={<IconDashboard />} label={t('nav.dashboard')} />
          <SidebarItem to={PDF_PASSWORD_REMOVER_ROUTE} icon={<IconPdf />} label={t('nav.pdfTools')} />
          <SidebarItem disabled icon={<IconWrench />} label={t('nav.repairIntelligence')} title={t('common.comingLater')} />
          <SidebarItem disabled icon={<IconScales />} label={t('nav.comparisons')} title={t('common.comingLater')} />
          <SidebarItem disabled icon={<IconChart />} label={t('nav.reports')} title={t('common.comingLater')} />

          <div className="my-3 border-t border-white/12" />

          <SidebarItem to="/settings" icon={<IconSettings />} label={t('nav.settings')} />
          <SidebarItem to="/settings" icon={<IconUpdates />} label={t('nav.updates')} />
          <SidebarItem to="/about" icon={<IconAbout />} label={t('nav.about')} />
        </nav>

        <div className="relative z-10 mt-auto rounded-lg border border-white/10 bg-black/20 px-3.5 py-3.5 backdrop-blur-[1px]">
          <div className="flex items-center gap-2.5 text-[0.8rem] text-white/80">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-cm-yellow text-cm-navy shadow">
              <IconSettings className="size-3.5" />
            </span>
            {t('nav.contactUs')}
          </div>
          <a
            href="tel:+48224985605"
            className="mt-2 block pl-9 text-[1.05rem] font-bold tracking-wide text-cm-yellow hover:underline"
          >
            +48 22 498 56 05
          </a>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-end gap-0.5 border-b border-border bg-white px-4 text-[length:var(--cm-text-body)] text-cm-navy">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 hover:bg-cm-light-gray">
            <IconMoon className="size-4 text-cm-blue" />
            <span className="font-medium">{t('shell.theme')}</span>
            <select
              className="bg-transparent outline-none"
              value={preference}
              onChange={(e) => setPreference(e.target.value as ThemePreference)}
              aria-label={t('settings.theme')}
            >
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-cm-light-gray">
            <IconGlobe className="size-4 text-cm-blue" />
            <select
              className="bg-transparent font-semibold outline-none"
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              aria-label={t('settings.language')}
            >
              {supportedLocales.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground" title={t('shell.user')}>
            <IconUser className="size-4" />
            <span>{t('shell.user')}</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto bg-cm-light-gray">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
