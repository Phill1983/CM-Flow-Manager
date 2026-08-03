import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

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
    <section className="page" aria-labelledby="about-title">
      <h1 id="about-title">{t('about.title')}</h1>
      <p>
        {t('about.version')}: <strong>{version}</strong>
      </p>
      <p className="muted">{t('about.localOnly')}</p>
    </section>
  );
}
