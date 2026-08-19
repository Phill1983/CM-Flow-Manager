import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { joinPdfTextItems, type TextItemLike } from './join-text-items.js';

export type PdfPageText = {
  readonly pageNumber: number;
  readonly text: string;
};

export type PdfTextExtraction = {
  readonly pages: readonly PdfPageText[];
  readonly pageCount: number;
  readonly fullText: string;
  readonly timing: {
    readonly loadMs: number;
    readonly extractMs: number;
    readonly totalMs: number;
  };
};

function configureWorker(): void {
  if (GlobalWorkerOptions.workerSrc) return;
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
}

/**
 * Local PDF.js text-layer extraction. No OCR, no network, no Electron.
 * Caller owns bytes; this module does not read the filesystem.
 */
export async function extractPdfTextFromBytes(bytes: Uint8Array): Promise<PdfTextExtraction> {
  configureWorker();
  const totalStarted = Date.now();
  const loadStarted = Date.now();
  const loading = getDocument({
    data: bytes.slice(),
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    isEvalSupported: false,
    verbosity: 0,
  });
  const doc = await loading.promise;
  const loadMs = Date.now() - loadStarted;
  const extractStarted = Date.now();
  const pages: PdfPageText[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        const items: TextItemLike[] = [];
        for (const item of content.items) {
          if (!('str' in item)) continue;
          items.push({
            str: item.str,
            transform: item.transform,
            height: item.height,
            hasEOL: item.hasEOL,
          });
        }
        const text = joinPdfTextItems(items);
        pages.push({ pageNumber, text });
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await doc.destroy();
  }
  const extractMs = Date.now() - extractStarted;
  return {
    pages,
    pageCount: pages.length,
    fullText: pages.map((page) => page.text).join('\n\f\n'),
    timing: {
      loadMs,
      extractMs,
      totalMs: Date.now() - totalStarted,
    },
  };
}
