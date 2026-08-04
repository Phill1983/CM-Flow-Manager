import { getPdfPasswordRemoverModuleInfo } from '@cm-flow-manager/pdf-password-remover';
import { useI18n } from '@/i18n/useI18n';
import { PasswordRemoverPanel } from './password-remover/PasswordRemoverPanel';

export function PasswordRemoverPage() {
  const { t } = useI18n();
  const info = getPdfPasswordRemoverModuleInfo();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4" aria-labelledby="password-remover-title">
      <h1 id="password-remover-title" className="text-2xl font-semibold tracking-tight">
        {t('passwordRemover.title')}
      </h1>
      <p className="text-muted-foreground">{t('passwordRemover.lead')}</p>
      <p className="border-l-[3px] border-primary pl-3 text-sm text-muted-foreground">
        {t('passwordRemover.privacy')}
      </p>
      <PasswordRemoverPanel />
      <p className="text-sm text-muted-foreground">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
