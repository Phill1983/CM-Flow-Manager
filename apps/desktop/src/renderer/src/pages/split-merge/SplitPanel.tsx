import { formatFileSizeBytes, withEncryptedFileName } from '@cm-flow-manager/pdf-split-merge';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/i18n/useI18n';
import { PdfDropZone } from '@/pages/password-remover/PdfDropZone';
import { PdfThumbnailGrid } from './PdfThumbnailGrid';
import { useSplitFlow } from './useSplitFlow';

export function SplitPanel() {
  const { t } = useI18n();
  const flow = useSplitFlow();
  const [softBlock, setSoftBlock] = useState(false);

  useEffect(() => {
    void window.cmFlow.getUpdateStatus().then((status) => {
      setSoftBlock(status.gate.softBlockWorkSurfaces);
    });
    return window.cmFlow.onUpdateEvent((event) => {
      if (event.type === 'status') {
        setSoftBlock(event.status.gate.softBlockWorkSurfaces);
      }
    });
  }, []);

  const showResult =
    flow.state === 'success' ||
    flow.state === 'invalid_pdf' ||
    flow.state === 'invalid_range' ||
    flow.state === 'encrypted' ||
    flow.state === 'destination_error' ||
    flow.state === 'failed';

  const resultTone = flow.state === 'success' ? 'border-l-emerald-500' : 'border-l-destructive';
  const statusText =
    flow.statusMessageKey === 'pdfSplitMerge.error.encryptedNamed' && flow.statusFileName
      ? withEncryptedFileName(t(flow.statusMessageKey), flow.statusFileName)
      : flow.statusMessageKey
        ? t(flow.statusMessageKey)
        : '';
  const loaded = Boolean(flow.meta);
  const workspaceReady = Boolean(flow.meta && flow.meta.encryptionStatus === 'unencrypted');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[length:var(--cm-text-body)] text-muted-foreground">{t('pdfSplitMerge.split.lead')}</p>
      {softBlock ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {t('updates.softBlockBanner')}{' '}
          <Link className="underline" to="/settings">
            {t('nav.settings')}
          </Link>
        </p>
      ) : null}
      {loaded ? null : (
        <PdfDropZone
          disabled={!flow.selectionEnabled || softBlock}
          onFiles={(files) => void flow.acceptDroppedFiles(files)}
          onSelectClick={() => void flow.selectViaDialog()}
          titleKey="pdfSplitMerge.split.dropTitle"
          hintKey="pdfSplitMerge.split.dropHint"
          activeKey="pdfSplitMerge.split.dropActive"
          selectKey="pdfSplitMerge.split.select"
        />
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusText}
      </div>

      {flow.meta ? (
        <div className={workspaceReady ? 'grid gap-4 lg:grid-cols-2' : undefined}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('pdfSplitMerge.selectedFile')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.fileName')}</span>
                <span className="break-all font-medium">{flow.meta.fileName}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.fileSize')}</span>
                <span>{formatFileSizeBytes(flow.meta.fileSizeBytes)}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.split.pageCount')}</span>
                <span>{flow.meta.pageCount ?? '—'}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.sourceFolder')}</span>
                <span className="break-all">{flow.meta.sourceDirectory}</span>
              </div>
              {flow.meta.encryptionStatus === 'encrypted' ? (
                <p className="text-destructive">{t('pdfSplitMerge.encryptedHint')}</p>
              ) : null}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void flow.selectViaDialog()}
                  disabled={!flow.selectionEnabled || softBlock}
                >
                  {t('pdfSplitMerge.split.select')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {workspaceReady ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('pdfSplitMerge.split.pageSelection')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Label htmlFor="pdf-pages">{t('pdfSplitMerge.split.pageSelection')}</Label>
                <Input
                  id="pdf-pages"
                  value={flow.pageSelection}
                  onChange={(event) => flow.setPageSelection(event.target.value)}
                  disabled={flow.busy || flow.state === 'success'}
                  aria-describedby="pdf-pages-hint"
                  className="w-full max-w-[28rem]"
                />
                <p id="pdf-pages-hint" className="text-sm text-muted-foreground">
                  {t('pdfSplitMerge.split.pageSelectionHint')}
                </p>
                <p className="text-sm text-muted-foreground">{t('pdfSplitMerge.preview.orderHint')}</p>
                <p className="text-sm tabular-nums">
                  {t('pdfSplitMerge.preview.selectedCount')}: {flow.selectedPages.length}
                </p>
                <Label htmlFor="pdf-split-output">{t('pdfSplitMerge.outputPath')}</Label>
                <Input id="pdf-split-output" value={flow.destinationPath} readOnly />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void flow.changeDestination()} disabled={flow.busy}>
                    {t('pdfSplitMerge.changeDestination')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void flow.extract()}
                    disabled={!flow.extractEnabled || flow.busy || softBlock}
                    aria-busy={flow.state === 'processing'}
                  >
                    {t('pdfSplitMerge.split.extract')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {workspaceReady && flow.previewToken && flow.meta?.pageCount ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('pdfSplitMerge.preview.documentPages')}</CardTitle>
            <p className="text-sm tabular-nums text-muted-foreground">
              {t('pdfSplitMerge.preview.selectedCount')}: {flow.selectedPages.length}
            </p>
          </CardHeader>
          <CardContent>
            <PdfThumbnailGrid
              token={flow.previewToken}
              pageCount={flow.meta.pageCount}
              selectedPages={flow.selectedPages}
              selectable={!flow.busy && flow.state !== 'success'}
              disabled={flow.busy || flow.state === 'success'}
              workspace
              onTogglePage={flow.togglePage}
              onReorderPages={flow.reorderPages}
            />
          </CardContent>
        </Card>
      ) : null}

      {flow.state === 'processing' ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4" role="status" aria-live="polite">
            <p>{t('pdfSplitMerge.split.progress')}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showResult && flow.statusMessageKey ? (
        <Card className={`border-l-[3px] ${resultTone}`}>
          <CardContent className="flex flex-col gap-3 pt-4" role="status">
            <p>{statusText}</p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {flow.state === 'success' ? (
                <Button type="button" onClick={() => void flow.openOutputFolder()}>
                  {t('pdfSplitMerge.openOutputFolder')}
                </Button>
              ) : null}
              <Button type="button" variant={flow.state === 'success' ? 'outline' : 'default'} onClick={flow.reset} disabled={flow.busy}>
                {t('pdfSplitMerge.reset')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
