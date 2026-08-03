import { getPdfPasswordRemoverModuleInfo } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '../i18n/I18nProvider';

export function PasswordRemoverPage() {
  const { t } = useI18n();
  const info = getPdfPasswordRemoverModuleInfo();

  return (
    <section className="page" aria-labelledby="password-remover-title">
      <h1 id="password-remover-title">{t('passwordRemover.title')}</h1>
      <p className="lead">{t('passwordRemover.lead')}</p>
      <p className="notice muted">{t('passwordRemover.privacy')}</p>
      <div className="warn-box" role="status">
        {t('passwordRemover.engineUnavailable')}
      </div>
      <p className="muted">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
