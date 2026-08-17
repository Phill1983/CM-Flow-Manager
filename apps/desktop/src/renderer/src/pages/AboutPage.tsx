import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent } from '@/components/ui/card';

export function AboutPage() {
  const { t } = useI18n();
  const [version, setVersion] = useState('…');
  const [productName, setProductName] = useState('CM Flow Manager');

  useEffect(() => {
    let cancelled = false;
    void window.cmFlow.getVersion().then((result) => {
      if (!cancelled) {
        setVersion(result.version);
        setProductName(result.name);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 p-5 pb-8" aria-labelledby="about-title">
      <h1 id="about-title" className="text-cm-navy">
        {t('about.title')}
      </h1>
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4 text-[length:var(--cm-text-body)]">
          <p className="text-[length:var(--cm-text-h3)] font-semibold text-cm-navy">{productName}</p>
          <p>
            {t('about.version')}: <strong>{version}</strong>
          </p>
          <p className="text-muted-foreground">{t('about.localOnly')}</p>
        </CardContent>
      </Card>
    </section>
  );
}
