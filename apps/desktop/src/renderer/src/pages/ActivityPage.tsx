import { useI18n } from '@/i18n/useI18n';
import { EmptyState } from '@/components/cm/primitives';

export function ActivityPage() {
  const { t } = useI18n();
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 p-5 pb-8" aria-labelledby="activity-title">
      <h1 id="activity-title" className="text-cm-navy">
        {t('activity.title')}
      </h1>
      <EmptyState title={t('activity.empty')} />
    </section>
  );
}
