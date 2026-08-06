import { useEffect, useState } from 'react';
import type { UpdateStatusSnapshot } from '@cm-flow-manager/ipc-contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/useI18n';

function formatCheckedAt(value: string | null, neverLabel: string): string {
  if (!value) return neverLabel;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function UpdatesSection() {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatusSnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void window.cmFlow.getUpdateStatus().then(setStatus);
    return window.cmFlow.onUpdateEvent((event) => {
      if (event.type === 'status') {
        setStatus(event.status);
      } else if (event.type === 'progress') {
        setStatus((prev) => (prev ? { ...prev, downloadProgress: event.percent, state: 'downloading' } : prev));
      } else {
        void window.cmFlow.getUpdateStatus().then(setStatus);
      }
    });
  }, []);

  async function run(action: () => Promise<{ status: UpdateStatusSnapshot }>): Promise<void> {
    setBusy(true);
    try {
      const result = await action();
      setStatus(result.status);
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return null;
  }

  const progress =
    status.downloadProgress !== null && status.state === 'downloading'
      ? `${Math.round(status.downloadProgress)}%`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.updates.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t('settings.updates.currentVersion')}</dt>
            <dd className="font-medium">{status.currentVersion}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('settings.updates.latestVersion')}</dt>
            <dd className="font-medium">{status.latestVersion ?? t('settings.updates.unknown')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('settings.updates.lastChecked')}</dt>
            <dd className="font-medium">
              {formatCheckedAt(status.lastCheckedAt, t('settings.updates.neverChecked'))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('settings.updates.state')}</dt>
            <dd className="font-medium">{status.state}{progress ? ` (${progress})` : ''}</dd>
          </div>
        </dl>

        {!status.packaged ? (
          <p className="text-sm text-muted-foreground">{t('settings.updates.devOnly')}</p>
        ) : null}

        {status.gate.softBlockWorkSurfaces ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            {t('settings.updates.mandatoryNotice')}
          </p>
        ) : null}

        <div className="flex min-w-40 flex-col gap-2">
          <Label htmlFor="update-channel">{t('settings.updates.channel')}</Label>
          <select
            id="update-channel"
            className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={status.channel}
            disabled={busy}
            onChange={(event) => {
              void run(() =>
                window.cmFlow.setUpdateChannel(
                  event.target.value as UpdateStatusSnapshot['channel'],
                ),
              );
            }}
          >
            <option value="alpha">{t('settings.updates.channelAlpha')}</option>
            <option value="beta">{t('settings.updates.channelBeta')}</option>
            <option value="stable">{t('settings.updates.channelStable')}</option>
            <option value="development">{t('settings.updates.channelDevelopment')}</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={status.autoCheckEnabled}
            disabled={busy}
            onChange={(event) => {
              void run(() => window.cmFlow.setUpdateAutoCheck(event.target.checked));
            }}
          />
          {t('settings.updates.autoCheck')}
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || !status.packaged}
            onClick={() => {
              void run(() => window.cmFlow.checkForUpdates());
            }}
          >
            {t('settings.updates.check')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || status.state !== 'available'}
            onClick={() => {
              void run(() => window.cmFlow.downloadUpdate());
            }}
          >
            {t('settings.updates.download')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || status.state !== 'ready-to-install'}
            onClick={() => {
              void run(() => window.cmFlow.installUpdate());
            }}
          >
            {t('settings.updates.installRestart')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !status.releaseNotesUrl}
            onClick={() => {
              void run(() => window.cmFlow.openReleaseNotes());
            }}
          >
            {t('settings.updates.releaseNotes')}
          </Button>
        </div>

        {status.errorCode ? (
          <p className="text-sm text-destructive">
            {t('settings.updates.error')}: {status.errorCode}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
