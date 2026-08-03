import { Link } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '../i18n/I18nProvider';

export function DashboardPage() {
  const { t } = useI18n();

  return (
    <section className="page" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">{t('dashboard.title')}</h1>
      <p className="lead">{t('dashboard.lead')}</p>
      <p className="notice muted">{t('dashboard.privacy')}</p>

      <div className="grid-2">
        <section className="panel" aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title">{t('dashboard.quickActions')}</h2>
          <div className="actions">
            <Link className="button button-primary" to={PDF_PASSWORD_REMOVER_ROUTE}>
              {t('dashboard.openPasswordRemover')}
            </Link>
          </div>
        </section>

        <section className="panel" aria-labelledby="local-status-title">
          <h2 id="local-status-title">{t('dashboard.localStatus')}</h2>
          <div className="status-pill" role="status">
            <span className="status-dot warn" aria-hidden="true" />
            <span>{t('dashboard.localStatusValue')}</span>
          </div>
        </section>
      </div>

      <section className="panel" aria-labelledby="recent-title">
        <h2 id="recent-title">{t('dashboard.recentActivity')}</h2>
        <p className="muted">{t('dashboard.recentEmpty')}</p>
      </section>
    </section>
  );
}
