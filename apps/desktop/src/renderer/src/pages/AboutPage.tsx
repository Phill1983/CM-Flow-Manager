import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';

export function AboutPage() {
  const { t } = useI18n();
  const [version, setVersion] = useState('…');

  useEffect(() => {
    let cancelled = false;
    void window.cmFlow.getVersion().then((result) => {
      if (!cancelled) {
        setVersion(result.version);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4" aria-labelledby="about-title">
      <h1 id="about-title" className="text-2xl font-semibold tracking-tight">
        {t('about.title')}
      </h1>
      <p>
        {t('about.version')}: <strong>{version}</strong>
      </p>
      <p className="text-muted-foreground">{t('about.localOnly')}</p>
    </section>
  );
}
