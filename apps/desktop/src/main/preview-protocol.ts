import { readFile } from 'node:fs/promises';
import { protocol, type Session } from 'electron';
import { basename } from 'node:path';
import { pdfPreviewRegistry } from './preview-registry';
import { PDF_PREVIEW_SCHEME, previewTokenFromUrl } from './preview-url';

export { PDF_PREVIEW_SCHEME, previewUrlForToken } from './preview-url';

export function registerPdfPreviewScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PDF_PREVIEW_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

export function attachPdfPreviewProtocol(session: Session): void {
  session.protocol.handle(PDF_PREVIEW_SCHEME, async (request) => {
    const token = previewTokenFromUrl(request.url);
    if (!token) {
      return new Response('Not found', { status: 404 });
    }
    const filePath = pdfPreviewRegistry.resolve(token);
    if (!filePath) {
      return new Response('Not found', { status: 404 });
    }
    try {
      const bytes = await readFile(filePath);
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(bytes.byteLength),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    } catch {
      console.info(
        '[pdf-preview]',
        JSON.stringify({ level: 'warn', message: 'Preview read failed', file: basename(filePath) }),
      );
      return new Response('Not found', { status: 404 });
    }
  });
}
