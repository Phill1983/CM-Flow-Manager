import { formatFileSizeBytes } from '@cm-flow-manager/pdf-password-remover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/i18n/useI18n';
import { PdfDropZone } from './PdfDropZone';
import { usePasswordRemoverFlow } from './usePasswordRemoverFlow';

export function PasswordRemoverPanel() {
  const { t } = useI18n();
  const flow = usePasswordRemoverFlow();

  const showResult =
    flow.state === 'success' ||
    flow.state === 'incorrect_password' ||
    flow.state === 'invalid_pdf' ||
    flow.state === 'destination_error' ||
    flow.state === 'failed' ||
    flow.state === 'cancelled';

  const resultTone =
    flow.state === 'success'
      ? 'border-l-emerald-500'
      : flow.state === 'incorrect_password' ||
          flow.state === 'invalid_pdf' ||
          flow.state === 'destination_error' ||
          flow.state === 'failed'
        ? 'border-l-destructive'
        : 'border-l-amber-500';

  return (
    <div className="flex flex-col gap-4">
      <PdfDropZone
        disabled={!flow.selectionEnabled}
        onFiles={(files) => void flow.acceptDroppedFiles(files)}
        onSelectClick={() => void flow.selectViaDialog()}
      />

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {flow.statusMessageKey ? t(flow.statusMessageKey) : ''}
      </div>

      {flow.state === 'inspecting' || flow.state === 'selecting' ? (
        <Card>
          <CardContent className="pt-4" role="status">
            {flow.state === 'inspecting'
              ? t('passwordRemover.status.inspecting')
              : t('passwordRemover.selectPdf')}
          </CardContent>
        </Card>
      ) : null}

      {flow.meta ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('passwordRemover.selectedFile')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <span className="text-muted-foreground">{t('passwordRemover.fileName')}</span>
              <span className="break-all font-medium">{flow.meta.fileName}</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <span className="text-muted-foreground">{t('passwordRemover.fileSize')}</span>
              <span>{formatFileSizeBytes(flow.meta.fileSizeBytes)}</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <span className="text-muted-foreground">{t('passwordRemover.sourceFolder')}</span>
              <span className="break-all">{flow.meta.sourceDirectory}</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <span className="text-muted-foreground">{t('passwordRemover.encryptionStatus')}</span>
              <span>
                {flow.meta.encryptionStatus === 'encrypted'
                  ? t('passwordRemover.encrypted')
                  : t('passwordRemover.unencrypted')}
              </span>
            </div>
            {flow.meta.encryptionStatus === 'unencrypted' ? (
              <p className="text-muted-foreground">{t('passwordRemover.unencryptedHint')}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {flow.meta && flow.passwordRequired ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            <Label htmlFor="pdf-password">{t('passwordRemover.password')}</Label>
            <div className="flex gap-2">
              <Input
                id="pdf-password"
                type={flow.showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={flow.password}
                onChange={(event) => flow.setPassword(event.target.value)}
                disabled={flow.busy || flow.state === 'success'}
                aria-required="true"
                aria-describedby="pdf-password-hint"
              />
              <Button
                type="button"
                variant="outline"
                onClick={flow.toggleShowPassword}
                disabled={flow.busy || flow.state === 'success'}
              >
                {flow.showPassword
                  ? t('passwordRemover.passwordHide')
                  : t('passwordRemover.passwordShow')}
              </Button>
            </div>
            <p id="pdf-password-hint" className="text-sm text-muted-foreground">
              {t('passwordRemover.passwordRequired')}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {flow.meta ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Label htmlFor="pdf-output">{t('passwordRemover.outputPath')}</Label>
            <Input id="pdf-output" value={flow.destinationPath} readOnly />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void flow.changeDestination()}
                disabled={flow.busy}
              >
                {t('passwordRemover.changeDestination')}
              </Button>
              <Button
                type="button"
                onClick={() => void flow.unlock()}
                disabled={!flow.unlockEnabled || flow.busy}
                aria-busy={flow.state === 'unlocking'}
              >
                {flow.passwordRequired
                  ? t('passwordRemover.unlock')
                  : t('passwordRemover.unlockCopy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {flow.state === 'unlocking' ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4" role="status" aria-live="polite">
            <p>{t('passwordRemover.progress')}</p>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showResult && flow.statusMessageKey ? (
        <Card className={`border-l-[3px] ${resultTone}`}>
          <CardContent className="flex flex-col gap-3 pt-4" role="status">
            <p>{t(flow.statusMessageKey)}</p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {flow.state === 'success' ? (
                <Button type="button" onClick={() => void flow.openOutputFolder()}>
                  {t('passwordRemover.openOutputFolder')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant={flow.state === 'success' ? 'outline' : 'default'}
                onClick={flow.reset}
                disabled={flow.busy}
              >
                {t('passwordRemover.reset')}
              </Button>
              {flow.state === 'incorrect_password' ||
              flow.state === 'destination_error' ||
              flow.state === 'failed' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void flow.unlock()}
                  disabled={!flow.unlockEnabled || flow.busy || !flow.meta}
                >
                  {flow.passwordRequired
                    ? t('passwordRemover.unlock')
                    : t('passwordRemover.unlockCopy')}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {flow.meta && flow.state === 'ready' ? (
        <div className="flex">
          <Button type="button" variant="ghost" onClick={flow.reset} disabled={flow.busy}>
            {t('passwordRemover.reset')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
