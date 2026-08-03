import { getPdfPasswordRemoverModuleInfo } from '@cm-flow-manager/pdf-password-remover';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';

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
      <Card className="border-l-[3px] border-l-amber-500">
        <CardContent className="pt-4" role="status">
          {t('passwordRemover.engineUnavailable')}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
