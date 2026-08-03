import { NavLink, Outlet } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/useI18n';

function navClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'block rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive && 'border border-border bg-card text-foreground',
  );
}

export function AppShell() {
  const { t } = useI18n();

  return (
    <div className="grid h-full min-h-full grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-4 border-r border-border bg-sidebar p-3" aria-label={t('app.name')}>
        <div className="px-2 py-1 text-base font-bold tracking-tight text-sidebar-foreground">
          {t('app.name')}
        </div>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          <NavLink to="/" end className={navClassName}>
            {t('nav.dashboard')}
          </NavLink>
          <div className="mt-1">
            <div className="px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              {t('nav.pdfTools')}
            </div>
            <div className="flex flex-col gap-0.5 pl-2">
              <NavLink to={PDF_PASSWORD_REMOVER_ROUTE} className={navClassName}>
                {t('nav.passwordRemover')}
              </NavLink>
            </div>
          </div>
          <NavLink to="/activity" className={navClassName}>
            {t('nav.activity')}
          </NavLink>
          <NavLink to="/settings" className={navClassName}>
            {t('nav.settings')}
          </NavLink>
          <NavLink to="/about" className={navClassName}>
            {t('nav.about')}
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 p-2">
          <Separator />
          <p className="text-xs text-muted-foreground">{t('common.comingLater')}</p>
        </div>
      </aside>
      <main className="overflow-auto p-5 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
