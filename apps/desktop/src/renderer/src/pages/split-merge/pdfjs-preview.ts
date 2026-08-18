import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const MAX_CONCURRENT_RENDERS = 3;
const DEFAULT_THUMBNAIL_WIDTH_PX = 112;
export const WORKSPACE_THUMBNAIL_WIDTH_PX = 168;
export const INSPECT_PAGE_WIDTH_PX = 720;
export const THUMBNAIL_VIRTUALIZE_AFTER = 80;

const workerReady: Promise<void> = (async () => {
  // Chromium still checks script-src for blob workers. Prefer a same-origin URL in Vite.
  // Packaged file:// builds fetch the bundled worker and wrap it as a JS blob.
  const pageProtocol = typeof window === 'undefined' ? '' : window.location.protocol;
  const sameOriginHttp =
    (pageProtocol === 'http:' || pageProtocol === 'https:') &&
    (pdfWorkerSrc.startsWith('/') || pdfWorkerSrc.startsWith('./'));
  if (
    pdfWorkerSrc.startsWith('http:') ||
    pdfWorkerSrc.startsWith('https:') ||
    pdfWorkerSrc.startsWith('blob:') ||
    sameOriginHttp
  ) {
    GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    return;
  }
  const response = await fetch(pdfWorkerSrc);
  if (!response.ok) {
    throw new Error('PDF worker is unavailable.');
  }
  const bytes = await response.arrayBuffer();
  const blob = new Blob([bytes], { type: 'text/javascript' });
  GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
})();

type CacheEntry = {
  refs: number;
  promise: Promise<PDFDocumentProxy>;
};

const documents = new Map<string, CacheEntry>();

type QueueItem = {
  run: () => Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
};

const queue: QueueItem[] = [];
let activeRenders = 0;

function pumpQueue(): void {
  while (activeRenders < MAX_CONCURRENT_RENDERS && queue.length > 0) {
    const item = queue.shift();
    if (!item) return;
    activeRenders += 1;
    void item
      .run()
      .then(item.resolve, item.reject)
      .finally(() => {
        activeRenders -= 1;
        pumpQueue();
      });
  }
}

function enqueueRender(run: () => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    queue.push({ run, resolve, reject });
    pumpQueue();
  });
}

export async function acquirePreviewDocument(url: string): Promise<PDFDocumentProxy> {
  await workerReady;
  const existing = documents.get(url);
  if (existing) {
    existing.refs += 1;
    return existing.promise;
  }
  const promise = getDocument({
    url,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    isEvalSupported: false,
  }).promise;
  documents.set(url, { refs: 1, promise });
  try {
    return await promise;
  } catch (error) {
    documents.delete(url);
    throw error;
  }
}

export async function releasePreviewDocument(url: string): Promise<void> {
  const entry = documents.get(url);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  documents.delete(url);
  try {
    const doc = await entry.promise;
    await doc.destroy();
  } catch {
    // Load failed or already destroyed.
  }
}

export async function renderPdfThumbnail(input: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  signal: AbortSignal;
  widthPx?: number;
}): Promise<void> {
  await enqueueRender(async () => {
    if (input.signal.aborted) return;
    const page = await input.doc.getPage(input.pageNumber);
    try {
      if (input.signal.aborted) return;
      const unscaled = page.getViewport({ scale: 1 });
      const targetWidth = input.widthPx ?? DEFAULT_THUMBNAIL_WIDTH_PX;
      const scale = targetWidth / Math.max(unscaled.width, 1);
      const viewport = page.getViewport({ scale });
      const context = input.canvas.getContext('2d', { alpha: false });
      if (!context) {
        throw new Error('Canvas 2D context is unavailable.');
      }
      input.canvas.width = Math.ceil(viewport.width);
      input.canvas.height = Math.ceil(viewport.height);
      const task = page.render({ canvasContext: context, viewport });
      await task.promise;
    } finally {
      page.cleanup();
    }
  });
}

export function previewCacheSize(): number {
  return documents.size;
}
