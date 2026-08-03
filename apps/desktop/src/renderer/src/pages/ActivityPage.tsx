import { useI18n } from '@/i18n/useI18n';

export function ActivityPage() {
  const { t } = useI18n();
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4" aria-labelledby="activity-title">
      <h1 id="activity-title" className="text-2xl font-semibold tracking-tight">
        {t('activity.title')}
      </h1>
      <p className="text-muted-foreground">{t('activity.empty')}</p>
    </section>
  );
}
