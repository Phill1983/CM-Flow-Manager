import { getPdfPasswordRemoverModuleInfo } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '@/i18n/useI18n';
import { PasswordRemoverPanel } from './password-remover/PasswordRemoverPanel';

export function PasswordRemoverPage() {
  const { t } = useI18n();
  const info = getPdfPasswordRemoverModuleInfo();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 p-5 pb-8" aria-labelledby="password-remover-title">
      <header className="space-y-1.5">
        <p className="text-[length:var(--cm-text-small)] font-medium uppercase tracking-[0.12em] text-cm-blue">
          {t('nav.pdfTools')}
        </p>
        <h1 id="password-remover-title" className="text-cm-navy">
          {t('passwordRemover.title')}
        </h1>
        <p className="max-w-2xl text-[length:var(--cm-text-body)] text-muted-foreground">
          {t('passwordRemover.lead')}
        </p>
      </header>
      <p className="rounded-md border border-border bg-card px-3 py-2.5 text-[length:var(--cm-text-small)] text-muted-foreground">
        {t('passwordRemover.privacy')}
      </p>
      <PasswordRemoverPanel />
      <p className="text-[length:var(--cm-text-small)] text-muted-foreground">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
