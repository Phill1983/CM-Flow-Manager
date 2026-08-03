import { NavLink, Outlet } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '../i18n/I18nProvider';

export function AppShell() {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t('app.name')}>
        <div className="brand">{t('app.name')}</div>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            {t('nav.dashboard')}
          </NavLink>
          <div className="nav-group">
            <div className="nav-group-label">{t('nav.pdfTools')}</div>
            <div className="nav-sub">
              <NavLink to={PDF_PASSWORD_REMOVER_ROUTE}>{t('nav.passwordRemover')}</NavLink>
            </div>
          </div>
          <NavLink to="/activity">{t('nav.activity')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <NavLink to="/about">{t('nav.about')}</NavLink>
        </nav>
        <div className="sidebar-footer muted">{t('common.comingLater')}</div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
