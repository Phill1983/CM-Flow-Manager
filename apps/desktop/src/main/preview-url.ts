import { isPdfPreviewToken } from '@cm-flow-manager/ipc-contracts';

export const PDF_PREVIEW_SCHEME = 'cmflow-pdf';

export function previewUrlForToken(token: string): string {
  return `${PDF_PREVIEW_SCHEME}://preview/${token}`;
}

export function previewTokenFromUrl(requestUrl: string): string | null {
  try {
    const url = new URL(requestUrl);
    if (url.protocol !== `${PDF_PREVIEW_SCHEME}:`) {
      return null;
    }
    const fromPath = url.pathname.replace(/^\//, '').split('/')[0] ?? '';
    if (isPdfPreviewToken(fromPath)) {
      return fromPath;
    }
    if (isPdfPreviewToken(url.hostname)) {
      return url.hostname;
    }
    return null;
  } catch {
    return null;
  }
}
