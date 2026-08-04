import { Link } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';

export function DashboardPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title" className="text-2xl font-semibold tracking-tight">
        {t('dashboard.title')}
      </h1>
      <p className="text-muted-foreground">{t('dashboard.lead')}</p>
      <p className="border-l-[3px] border-primary pl-3 text-sm text-muted-foreground">
        {t('dashboard.privacy')}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Card aria-labelledby="quick-actions-title">
          <CardHeader>
            <CardTitle id="quick-actions-title">{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={PDF_PASSWORD_REMOVER_ROUTE}>{t('dashboard.openPasswordRemover')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card aria-labelledby="local-status-title">
          <CardHeader>
            <CardTitle id="local-status-title">{t('dashboard.localStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-sm"
              role="status"
            >
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{t('dashboard.localStatusValue')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card aria-labelledby="recent-title">
        <CardHeader>
          <CardTitle id="recent-title">{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('dashboard.recentEmpty')}</p>
        </CardContent>
      </Card>
    </section>
  );
}
