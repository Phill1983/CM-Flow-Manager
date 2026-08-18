import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { acquirePreviewDocument, releasePreviewDocument } from './pdfjs-preview';

export type PdfPreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export function usePdfPreviewDocument(token: string | null): {
  doc: PDFDocumentProxy | null;
  status: PdfPreviewStatus;
  pdfjsPageCount: number;
} {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<PdfPreviewStatus>(token ? 'loading' : 'idle');

  useEffect(() => {
    if (!token) {
      setDoc(null);
      setStatus('idle');
      return;
    }
    const url = window.cmFlow.previewUrlForToken(token);
    if (!url) {
      setDoc(null);
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setDoc(null);
    void acquirePreviewDocument(url)
      .then((loaded) => {
        if (cancelled) return;
        setDoc(loaded);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setDoc(null);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
      setDoc(null);
      void releasePreviewDocument(url);
    };
  }, [token]);

  return {
    doc,
    status,
    pdfjsPageCount: doc?.numPages ?? 0,
  };
}
