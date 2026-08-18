import { pageSlotNumbers } from '@cm-flow-manager/pdf-split-merge';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import { PdfPageThumbnail } from './PdfPageThumbnail';
import { INSPECT_PAGE_WIDTH_PX, THUMBNAIL_VIRTUALIZE_AFTER, renderPdfThumbnail } from './pdfjs-preview';
import { usePdfPreviewDocument } from './usePdfPreviewDocument';

const COMPACT_COLS = 5;
const COMPACT_CELL_HEIGHT = 124;
const WORKSPACE_MIN_COL_PX = 160;
const WORKSPACE_GAP_PX = 8;
const WORKSPACE_CELL_HEIGHT = 280;

type PdfThumbnailGridProps = {
  token: string | null;
  pageCount: number;
  selectedPages: readonly number[];
  selectable: boolean;
  disabled: boolean;
  onTogglePage?: (pageNumber: number) => void;
  onReorderPages?: (fromPage: number, toPage: number) => void;
  maxSlots?: number;
  compact?: boolean;
  workspace?: boolean;
};

export function PdfThumbnailGrid({
  token,
  pageCount,
  selectedPages,
  selectable,
  disabled,
  onTogglePage,
  onReorderPages,
  maxSlots,
  compact = false,
  workspace = false,
}: PdfThumbnailGridProps) {
  const { t } = useI18n();
  const { doc, status } = usePdfPreviewDocument(token);
  const selected = useMemo(() => new Set(selectedPages), [selectedPages]);
  const outputPosition = useMemo(() => {
    const map = new Map<number, number>();
    selectedPages.forEach((page, index) => {
      map.set(page, index + 1);
    });
    return map;
  }, [selectedPages]);
  const slots = useMemo(() => {
    const all = pageSlotNumbers(pageCount);
    return typeof maxSlots === 'number' ? all.slice(0, Math.max(0, maxSlots)) : all;
  }, [maxSlots, pageCount]);
  const virtualize = slots.length > THUMBNAIL_VIRTUALIZE_AFTER;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inspectDialogRef = useRef<HTMLDialogElement>(null);
  const [inspectPage, setInspectPage] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(288);
  const [viewportWidth, setViewportWidth] = useState(800);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = (): void => {
      setViewportHeight(scroller.clientHeight);
      setViewportWidth(scroller.clientWidth);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [token, pageCount]);

  useEffect(() => {
    setInspectPage(null);
  }, [token]);

  useEffect(() => {
    const dialog = inspectDialogRef.current;
    if (!dialog) return;
    if (inspectPage !== null) {
      if (!dialog.open) dialog.showModal();
      window.requestAnimationFrame(() => {
        dialog.querySelector(`[data-inspect-page="${inspectPage}"]`)?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    if (dialog.open) dialog.close();
  }, [inspectPage]);

  const cols = workspace
    ? Math.max(1, Math.floor((viewportWidth + WORKSPACE_GAP_PX) / (WORKSPACE_MIN_COL_PX + WORKSPACE_GAP_PX)))
    : COMPACT_COLS;
  const cellHeight = workspace ? WORKSPACE_CELL_HEIGHT : COMPACT_CELL_HEIGHT;

  const windowed = useMemo(() => {
    if (!virtualize) {
      return { pages: slots, paddingTop: 0, paddingBottom: 0 };
    }
    const rows = Math.ceil(slots.length / cols);
    const startRow = Math.max(0, Math.floor(scrollTop / cellHeight) - 1);
    const visibleRows = Math.ceil(viewportHeight / cellHeight) + 2;
    const endRow = Math.min(rows, startRow + visibleRows);
    return {
      pages: slots.slice(startRow * cols, Math.min(slots.length, endRow * cols)),
      paddingTop: startRow * cellHeight,
      paddingBottom: Math.max(0, rows - endRow) * cellHeight,
    };
  }, [cellHeight, cols, scrollTop, slots, virtualize, viewportHeight]);

  if (!token || pageCount < 1) {
    return null;
  }

  const gridClass = compact && windowed.pages.length <= 1
    ? undefined
    : workspace && !virtualize
      ? 'grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]'
      : 'grid gap-2';
  const gridStyle =
    compact && windowed.pages.length <= 1
      ? undefined
      : workspace && !virtualize
        ? undefined
        : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col gap-2">
      {!compact && !workspace ? (
        <p className="text-sm text-muted-foreground">
          {t('pdfSplitMerge.preview.pageCount')}: {pageCount}
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-destructive">{t('pdfSplitMerge.preview.unavailable')}</p>
      ) : null}
      <div
        ref={scrollerRef}
        className={
          compact || slots.length <= 1
            ? undefined
            : workspace
              ? 'max-h-[min(70vh,52rem)] overflow-auto rounded-md border border-border bg-muted/30 p-3'
              : 'max-h-72 overflow-auto rounded-md border border-border bg-muted/30 p-2'
        }
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ paddingTop: windowed.paddingTop, paddingBottom: windowed.paddingBottom }}>
          <div className={gridClass} style={gridStyle}>
            {windowed.pages.map((pageNumber) => (
              <PdfPageThumbnail
                key={pageNumber}
                doc={doc}
                pageNumber={pageNumber}
                selected={selected.has(pageNumber)}
                selectable={selectable}
                disabled={disabled}
                failed={status === 'error'}
                workspace={workspace}
                outputPosition={outputPosition.get(pageNumber)}
                draggableSelected={Boolean(workspace && onReorderPages)}
                loadingLabel={t('pdfSplitMerge.preview.loading')}
                errorLabel={t('pdfSplitMerge.preview.error')}
                pageLabel={`${t('pdfSplitMerge.preview.page')} ${pageNumber}`}
                selectLabel={`${t('pdfSplitMerge.preview.selectPage')} ${pageNumber}`}
                outputPositionLabel={
                  selected.has(pageNumber)
                    ? `${t('pdfSplitMerge.preview.outputPosition')} ${outputPosition.get(pageNumber) ?? ''}`
                    : undefined
                }
                onToggle={onTogglePage ?? (() => undefined)}
                onInspect={doc ? (page) => setInspectPage(page) : undefined}
                onReorder={onReorderPages}
                onMoveInOrder={
                  onReorderPages
                    ? (page, direction) => {
                        const index = selectedPages.indexOf(page);
                        const target = selectedPages[index + direction];
                        if (target !== undefined) onReorderPages(page, target);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
      <dialog
        ref={inspectDialogRef}
        className="cm-app-dialog"
        onClose={() => setInspectPage(null)}
        onCancel={() => setInspectPage(null)}
        onClick={(event) => {
          if (event.target === inspectDialogRef.current) setInspectPage(null);
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {t('pdfSplitMerge.preview.inspectTitle')}
            {inspectPage !== null ? ` · ${t('pdfSplitMerge.preview.page')} ${inspectPage}` : ''}
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setInspectPage(null)}>
            {t('pdfSplitMerge.preview.closeInspect')}
          </Button>
        </div>
        {doc && inspectPage !== null ? (
          <div className="cm-app-dialog-scroll flex max-h-[min(78vh,52rem)] flex-col gap-4 overflow-auto pr-1">
            {pageSlotNumbers(pageCount).map((pageNumber) => (
              <section key={pageNumber} data-inspect-page={pageNumber} className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  {t('pdfSplitMerge.preview.page')} {pageNumber}
                </p>
                <PdfPageInspectCanvas
                  doc={doc}
                  pageNumber={pageNumber}
                  loadingLabel={t('pdfSplitMerge.preview.loading')}
                  errorLabel={t('pdfSplitMerge.preview.error')}
                />
              </section>
            ))}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function PdfPageInspectCanvas({
  doc,
  pageNumber,
  loadingLabel,
  errorLabel,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  loadingLabel: string;
  errorLabel: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      {
        root: host.closest('.cm-app-dialog-scroll') as Element | null,
        rootMargin: '160px',
        threshold: 0.01,
      },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const controller = new AbortController();
    setStatus('loading');
    void renderPdfThumbnail({
      doc,
      pageNumber,
      canvas,
      signal: controller.signal,
      widthPx: INSPECT_PAGE_WIDTH_PX,
    })
      .then(() => {
        if (!controller.signal.aborted) setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => {
      controller.abort();
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [doc, pageNumber, visible]);

  return (
    <div
      ref={hostRef}
      className="relative flex min-h-[12rem] items-center justify-center overflow-hidden rounded-md bg-muted p-2"
    >
      <canvas ref={canvasRef} className="mx-auto h-auto max-h-[min(78vh,56rem)] max-w-full" />
      {status !== 'ready' ? (
        <span className="absolute inset-x-2 text-center text-sm text-muted-foreground">
          {status === 'error' ? errorLabel : loadingLabel}
        </span>
      ) : null}
    </div>
  );
}
