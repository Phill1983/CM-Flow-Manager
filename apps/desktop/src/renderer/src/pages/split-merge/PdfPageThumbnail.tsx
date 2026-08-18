import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import { renderPdfThumbnail, WORKSPACE_THUMBNAIL_WIDTH_PX } from './pdfjs-preview';

const SPLIT_PAGE_DRAG_TYPE = 'text/plain';
const INSPECT_CLICK_DELAY_MS = 220;

type PdfPageThumbnailProps = {
  doc: PDFDocumentProxy | null;
  pageNumber: number;
  selected: boolean;
  selectable: boolean;
  disabled: boolean;
  failed?: boolean;
  workspace?: boolean;
  outputPosition?: number;
  draggableSelected?: boolean;
  loadingLabel: string;
  errorLabel: string;
  pageLabel: string;
  selectLabel: string;
  outputPositionLabel?: string;
  onToggle: (pageNumber: number) => void;
  onInspect?: (pageNumber: number) => void;
  onReorder?: (fromPage: number, toPage: number) => void;
  onMoveInOrder?: (pageNumber: number, direction: -1 | 1) => void;
};

export function PdfPageThumbnail({
  doc,
  pageNumber,
  selected,
  selectable,
  disabled,
  failed = false,
  workspace = false,
  outputPosition,
  draggableSelected = false,
  loadingLabel,
  errorLabel,
  pageLabel,
  selectLabel,
  outputPositionLabel,
  onToggle,
  onInspect,
  onReorder,
  onMoveInOrder,
}: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const skipClickAfterDrag = useRef(false);
  const clickTimer = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [thumbStatus, setThumbStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: '160px', threshold: 0.01 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimer.current !== null) {
        window.clearTimeout(clickTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible || !doc || !canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const controller = new AbortController();
    setThumbStatus('loading');
    void renderPdfThumbnail({
      doc,
      pageNumber,
      canvas,
      signal: controller.signal,
      widthPx: workspace ? WORKSPACE_THUMBNAIL_WIDTH_PX : undefined,
    })
      .then(() => {
        if (!controller.signal.aborted) setThumbStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setThumbStatus('error');
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
  }, [doc, pageNumber, visible, workspace]);

  const canInteract = selectable && !disabled;
  const canDrag = workspace && draggableSelected && canInteract && selected;

  const activateToggle = (): void => {
    if (canInteract) onToggle(pageNumber);
  };

  const clearClickTimer = (): void => {
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  };

  return (
    <div
      ref={hostRef}
      role="button"
      tabIndex={canInteract ? 0 : -1}
      aria-pressed={selectable ? selected : undefined}
      aria-label={pageLabel}
      aria-grabbed={canDrag ? dragging : undefined}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        skipClickAfterDrag.current = true;
        setDragging(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(SPLIT_PAGE_DRAG_TYPE, String(pageNumber));
      }}
      onDragEnd={() => {
        setDragging(false);
        setDropTarget(false);
        window.setTimeout(() => {
          skipClickAfterDrag.current = false;
        }, 0);
      }}
      onDragOver={(event) => {
        if (!canDrag || !onReorder) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(true);
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(event) => {
        if (!canDrag || !onReorder) return;
        event.preventDefault();
        setDropTarget(false);
        const raw = event.dataTransfer.getData(SPLIT_PAGE_DRAG_TYPE);
        const fromPage = Number.parseInt(raw, 10);
        if (Number.isInteger(fromPage) && fromPage >= 1) {
          onReorder(fromPage, pageNumber);
        }
      }}
      onClick={() => {
        if (skipClickAfterDrag.current) return;
        if (!onInspect || !canInteract) {
          activateToggle();
          return;
        }
        clearClickTimer();
        clickTimer.current = window.setTimeout(() => {
          clickTimer.current = null;
          activateToggle();
        }, INSPECT_CLICK_DELAY_MS);
      }}
      onDoubleClick={(event) => {
        if (!onInspect) return;
        event.preventDefault();
        clearClickTimer();
        onInspect(pageNumber);
      }}
      onKeyDown={(event) => {
        if (!canInteract) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateToggle();
          return;
        }
        if (!selected || !onMoveInOrder) return;
        if (!(event.altKey || event.ctrlKey)) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          onMoveInOrder(pageNumber, -1);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          onMoveInOrder(pageNumber, 1);
        }
      }}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md border bg-card p-1 text-left transition-colors',
        workspace ? 'w-full min-w-[10rem]' : 'w-[5.5rem]',
        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/40' : 'border-border',
        canInteract ? 'cursor-pointer hover:border-primary/70' : onInspect ? 'cursor-zoom-in' : 'cursor-default',
        disabled ? 'opacity-60' : '',
        dragging ? 'opacity-50' : '',
        dropTarget ? 'ring-2 ring-primary' : '',
      )}
    >
      <div
        className={cn(
          'relative flex w-full items-center justify-center overflow-hidden rounded-sm bg-muted',
          workspace ? 'min-h-[13.5rem]' : 'h-[4.75rem]',
        )}
      >
        {workspace && selectable ? (
          <input
            type="checkbox"
            checked={selected}
            disabled={!canInteract}
            aria-hidden="true"
            tabIndex={-1}
            title={selectLabel}
            className="absolute left-1 top-1 z-10 h-4 w-4 accent-primary"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              activateToggle();
            }}
          />
        ) : null}
        {workspace && selected && outputPosition !== undefined ? (
          <span
            className="absolute right-1 top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground"
            title={outputPositionLabel}
          >
            {outputPosition}
          </span>
        ) : null}
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-full max-w-full" />
        {failed || thumbStatus !== 'ready' ? (
          <span className="absolute inset-x-1 text-center text-[10px] text-muted-foreground">
            {failed || thumbStatus === 'error' ? errorLabel : loadingLabel}
          </span>
        ) : null}
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pageNumber}</span>
    </div>
  );
}
