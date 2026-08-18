import { formatFileSizeBytes, withEncryptedFileName } from '@cm-flow-manager/pdf-split-merge';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/useI18n';
import { PdfDropZone } from '@/pages/password-remover/PdfDropZone';
import { PdfThumbnailGrid } from './PdfThumbnailGrid';
import { useMergeFlow, type MergeListItem } from './useMergeFlow';

const MERGE_FILE_DRAG_TYPE = 'text/plain';

export function MergePanel() {
  const { t } = useI18n();
  const flow = useMergeFlow();
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
  const loaded = flow.files.length > 0;
  const totalPages = useMemo(
    () => flow.files.reduce((sum, file) => sum + file.pageCount, 0),
    [flow.files],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[length:var(--cm-text-body)] text-muted-foreground">{t('pdfSplitMerge.merge.lead')}</p>
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
          titleKey="pdfSplitMerge.merge.dropTitle"
          hintKey="pdfSplitMerge.merge.dropHint"
          activeKey="pdfSplitMerge.merge.dropActive"
          selectKey="pdfSplitMerge.merge.select"
        />
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusText}
      </div>

      {loaded ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('pdfSplitMerge.merge.fileList')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.merge.fileCount')}</span>
                <span className="tabular-nums">{flow.files.length}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <span className="text-muted-foreground">{t('pdfSplitMerge.merge.totalPages')}</span>
                <span className="tabular-nums">{totalPages}</span>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void flow.selectViaDialog()}
                  disabled={!flow.selectionEnabled || softBlock}
                >
                  {t('pdfSplitMerge.merge.addFiles')}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('pdfSplitMerge.outputPath')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Label htmlFor="pdf-merge-output">{t('pdfSplitMerge.outputPath')}</Label>
              <Input id="pdf-merge-output" value={flow.destinationPath} readOnly />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void flow.changeDestination()} disabled={flow.busy}>
                  {t('pdfSplitMerge.changeDestination')}
                </Button>
                <Button
                  type="button"
                  onClick={() => void flow.merge()}
                  disabled={!flow.mergeEnabled || flow.busy || softBlock}
                  aria-busy={flow.state === 'processing'}
                >
                  {t('pdfSplitMerge.merge.run')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {loaded ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('pdfSplitMerge.merge.queueTitle')}</CardTitle>
            <p className="text-sm tabular-nums text-muted-foreground">
              {t('pdfSplitMerge.merge.fileCount')}: {flow.files.length}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t('pdfSplitMerge.merge.orderHint')}</p>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
              {flow.files.map((file, index) => (
                <MergeQueueCard
                  key={file.filePath}
                  file={file}
                  index={index}
                  busy={flow.busy}
                  isFirst={index === 0}
                  isLast={index === flow.files.length - 1}
                  onReorder={flow.reorderFiles}
                  onMove={(direction) => flow.moveFile(index, direction)}
                  onRemove={() => flow.removeFile(file.filePath)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {flow.state === 'processing' ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4" role="status" aria-live="polite">
            <p>{t('pdfSplitMerge.merge.progress')}</p>
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

function MergeQueueCard({
  file,
  index,
  busy,
  isFirst,
  isLast,
  onReorder,
  onMove,
  onRemove,
}: {
  file: MergeListItem;
  index: number;
  busy: boolean;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (fromPath: string, toPath: string) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);

  return (
    <div
      role="listitem"
      draggable={!busy}
      aria-grabbed={dragging}
      onDragStart={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        setDragging(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(MERGE_FILE_DRAG_TYPE, file.filePath);
      }}
      onDragEnd={() => {
        setDragging(false);
        setDropTarget(false);
      }}
      onDragOver={(event) => {
        if (busy) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(true);
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDropTarget(false);
        const fromPath = event.dataTransfer.getData(MERGE_FILE_DRAG_TYPE);
        if (fromPath) onReorder(fromPath, file.filePath);
      }}
      onKeyDown={(event) => {
        if (busy || !(event.altKey || event.ctrlKey)) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          onMove(-1);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          onMove(1);
        }
      }}
      tabIndex={busy ? -1 : 0}
      className={cn(
        'flex flex-col gap-2 rounded-md border bg-card p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40',
        dropTarget ? 'border-primary ring-2 ring-primary/40' : 'border-border',
        dragging ? 'opacity-50' : '',
      )}
    >
      <div className="relative">
        <span className="absolute left-1 top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
          {index + 1}
        </span>
        {file.previewToken ? (
          <PdfThumbnailGrid
            token={file.previewToken}
            pageCount={file.pageCount}
            selectedPages={[]}
            selectable={false}
            disabled={busy}
            maxSlots={1}
            workspace
          />
        ) : null}
      </div>
      <p className="truncate text-sm font-medium" title={file.fileName}>
        {file.fileName}
      </p>
      <p className="text-xs text-muted-foreground">
        {file.pageCount} {t('pdfSplitMerge.merge.pages')} · {formatFileSizeBytes(file.fileSizeBytes)}
      </p>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onMove(-1)}
          disabled={isFirst || busy}
          aria-label={t('pdfSplitMerge.merge.moveUp')}
        >
          {t('pdfSplitMerge.merge.moveUp')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onMove(1)}
          disabled={isLast || busy}
          aria-label={t('pdfSplitMerge.merge.moveDown')}
        >
          {t('pdfSplitMerge.merge.moveDown')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onRemove} disabled={busy}>
          {t('pdfSplitMerge.merge.remove')}
        </Button>
      </div>
    </div>
  );
}
