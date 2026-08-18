import { stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import type { PdfGrantPreviewResult } from '@cm-flow-manager/ipc-contracts';
import type { PdfEngineService } from '@cm-flow-manager/pdf-engine';
import { hasPdfExtension } from '@cm-flow-manager/file-utils';
import { PdfPreviewRegistry, pdfPreviewRegistry } from './preview-registry';

function isSafePdfAbsolutePath(filePath: unknown): filePath is string {
  return typeof filePath === 'string' && isAbsolute(filePath) && hasPdfExtension(filePath);
}

export async function grantPdfPreview(
  filePath: string,
  pdfService: Pick<PdfEngineService, 'inspect'>,
  registry: PdfPreviewRegistry = pdfPreviewRegistry,
): Promise<PdfGrantPreviewResult> {
  if (!isSafePdfAbsolutePath(filePath)) {
    return { ok: false, code: 'bad_path' };
  }
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return { ok: false, code: 'not_found' };
    }
    const inspection = await pdfService.inspect(filePath);
    if (inspection.status === 'invalid') {
      return { ok: false, code: 'invalid_pdf' };
    }
    if (inspection.status === 'unavailable') {
      return { ok: false, code: 'unavailable' };
    }
    if (inspection.status === 'encrypted') {
      return { ok: false, code: 'encrypted_pdf' };
    }
    return { ok: true, token: registry.grant(filePath) };
  } catch {
    return { ok: false, code: 'not_found' };
  }
}
