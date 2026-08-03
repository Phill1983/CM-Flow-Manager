import { useState } from 'react';
import { getPdfPasswordRemoverModuleInfo } from '@cm-flow-manager/pdf-password-remover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/useI18n';

type PocResult = {
  kind: 'inspect' | 'unlock';
  payload: unknown;
};

/**
 * Temporary Phase 2 developer control.
 * Visible only in Vite development builds. Replace with Phase 3 product UI later.
 */
function Phase2DeveloperUnlockPanel() {
  const [sourcePath, setSourcePath] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PocResult | null>(null);

  async function chooseSource(): Promise<void> {
    const dialog = await window.cmFlow.openPdfDialog();
    if (!dialog.canceled && dialog.filePath) {
      setSourcePath(dialog.filePath);
      const base = dialog.filePath.replace(/\.pdf$/i, '_unlocked.pdf');
      setDestinationPath(base);
    }
  }

  async function chooseDestination(): Promise<void> {
    const dialog = await window.cmFlow.savePdfDialog(destinationPath || undefined);
    if (!dialog.canceled && dialog.filePath) {
      setDestinationPath(dialog.filePath);
    }
  }

  async function runInspect(): Promise<void> {
    if (!sourcePath) return;
    setBusy(true);
    try {
      const payload = await window.cmFlow.inspectPdf(sourcePath);
      setResult({ kind: 'inspect', payload });
    } finally {
      setBusy(false);
    }
  }

  async function runUnlock(): Promise<void> {
    if (!sourcePath || !destinationPath) return;
    setBusy(true);
    try {
      const payload = await window.cmFlow.unlockPdf({
        sourcePath,
        destinationPath,
        password,
      });
      setResult({ kind: 'unlock', payload });
    } finally {
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <Card className="border-dashed border-amber-500/70">
      <CardHeader>
        <CardTitle className="text-base">Phase 2 developer unlock (temporary)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Development-only proof of concept. Password is cleared after unlock and is never persisted.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="poc-source">Source PDF</Label>
          <div className="flex gap-2">
            <Input id="poc-source" value={sourcePath} readOnly placeholder="Choose a PDF…" />
            <Button type="button" variant="outline" onClick={() => void chooseSource()} disabled={busy}>
              Browse
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="poc-dest">Destination PDF</Label>
          <div className="flex gap-2">
            <Input id="poc-dest" value={destinationPath} readOnly placeholder="Choose output…" />
            <Button type="button" variant="outline" onClick={() => void chooseDestination()} disabled={busy}>
              Save as
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="poc-password">Password</Label>
          <Input
            id="poc-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void runInspect()} disabled={busy || !sourcePath}>
            Inspect
          </Button>
          <Button type="button" onClick={() => void runUnlock()} disabled={busy || !sourcePath || !destinationPath}>
            Unlock
          </Button>
        </div>
        {result ? (
          <pre className="overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PasswordRemoverPage() {
  const { t } = useI18n();
  const info = getPdfPasswordRemoverModuleInfo();
  const showDeveloperPanel = import.meta.env.DEV;

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4" aria-labelledby="password-remover-title">
      <h1 id="password-remover-title" className="text-2xl font-semibold tracking-tight">
        {t('passwordRemover.title')}
      </h1>
      <p className="text-muted-foreground">{t('passwordRemover.lead')}</p>
      <p className="border-l-[3px] border-primary pl-3 text-sm text-muted-foreground">
        {t('passwordRemover.privacy')}
      </p>
      {showDeveloperPanel ? (
        <Phase2DeveloperUnlockPanel />
      ) : (
        <Card className="border-l-[3px] border-l-amber-500">
          <CardContent className="pt-4" role="status">
            {t('passwordRemover.engineUnavailable')}
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
