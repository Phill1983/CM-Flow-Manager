import { existsSync } from 'node:fs';
import type { PdfEngineService } from './types';
import { UnavailablePdfUnlockService } from './unavailable-service';
import { QpdfUnlockService, resolveQpdfExecutable, type QpdfUnlockServiceOptions } from './qpdf-unlock-service';

export type {
  PdfEngineService,
  PdfExtractPagesInput,
  PdfExtractPagesResult,
  PdfInspectionResult,
  PdfMergeInput,
  PdfMergeResult,
  PdfToolFailureCategory,
  PdfUnlockInput,
  PdfUnlockResult,
  PdfUnlockService,
} from './types';
export { parsePageRange, formatPagesForFileName, formatPagesForRangeInput, togglePageSelection, pageSlotNumbers, resolveThumbnailSelection } from './page-range';
export type { PageRangeErrorCode, PageRangeParseResult } from './page-range';
export { UnavailablePdfUnlockService } from './unavailable-service';
export {
  QpdfUnlockService,
  resolveQpdfExecutable,
  listQpdfCandidatePaths,
  isQpdfSuccessfulExit,
  type PdfEngineLogEvent,
  type PdfEngineLogger,
  type QpdfUnlockServiceOptions,
} from './qpdf-unlock-service';

/**
 * Prefer real qpdf adapter when a local/vendor binary is present; otherwise unavailable mock.
 */
export function createPdfUnlockService(options: QpdfUnlockServiceOptions = {}): PdfEngineService {
  const qpdfPath = resolveQpdfExecutable(options.qpdfPath);
  if (!qpdfPath || !existsSync(qpdfPath)) {
    return new UnavailablePdfUnlockService();
  }
  return new QpdfUnlockService({ ...options, qpdfPath });
}
