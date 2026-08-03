import { existsSync } from 'node:fs';
import type { PdfUnlockService } from './types';
import { UnavailablePdfUnlockService } from './unavailable-service';
import { QpdfUnlockService, resolveQpdfExecutable, type QpdfUnlockServiceOptions } from './qpdf-unlock-service';

export type {
  PdfInspectionResult,
  PdfUnlockInput,
  PdfUnlockResult,
  PdfUnlockService,
} from './types';
export { UnavailablePdfUnlockService } from './unavailable-service';
export {
  QpdfUnlockService,
  resolveQpdfExecutable,
  type PdfEngineLogEvent,
  type PdfEngineLogger,
  type QpdfUnlockServiceOptions,
} from './qpdf-unlock-service';

/**
 * Prefer real qpdf adapter when a local/vendor binary is present; otherwise unavailable mock.
 */
export function createPdfUnlockService(options: QpdfUnlockServiceOptions = {}): PdfUnlockService {
  const qpdfPath = resolveQpdfExecutable(options.qpdfPath);
  if (!qpdfPath || !existsSync(qpdfPath)) {
    return new UnavailablePdfUnlockService();
  }
  return new QpdfUnlockService({ ...options, qpdfPath });
}
