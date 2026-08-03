import { useI18n } from '../i18n/I18nProvider';

export function ActivityPage() {
  const { t } = useI18n();
  return (
    <section className="page" aria-labelledby="activity-title">
      <h1 id="activity-title">{t('activity.title')}</h1>
      <p className="muted">{t('activity.empty')}</p>
    </section>
  );
}
