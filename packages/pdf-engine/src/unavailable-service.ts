import type {
  PdfEngineService,
  PdfExtractPagesInput,
  PdfExtractPagesResult,
  PdfInspectionResult,
  PdfMergeInput,
  PdfMergeResult,
  PdfUnlockInput,
  PdfUnlockResult,
} from './types';

const UNAVAILABLE_REASON =
  'PDF engine is not available. qpdf was not found on this computer.';

/**
 * Fallback when the bundled/vendored qpdf binary cannot be resolved.
 */
export class UnavailablePdfUnlockService implements PdfEngineService {
  async inspect(_filePath: string): Promise<PdfInspectionResult> {
    return {
      status: 'unavailable',
      reason: UNAVAILABLE_REASON,
    };
  }

  async unlock(_input: PdfUnlockInput): Promise<PdfUnlockResult> {
    return {
      status: 'failed',
      category: 'EngineUnavailable',
      message: UNAVAILABLE_REASON,
    };
  }

  async extractPages(_input: PdfExtractPagesInput): Promise<PdfExtractPagesResult> {
    return {
      status: 'failed',
      category: 'EngineUnavailable',
      message: UNAVAILABLE_REASON,
    };
  }

  async mergePdfs(_input: PdfMergeInput): Promise<PdfMergeResult> {
    return {
      status: 'failed',
      category: 'EngineUnavailable',
      message: UNAVAILABLE_REASON,
    };
  }
}

export function createPdfUnlockService(): PdfEngineService {
  return new UnavailablePdfUnlockService();
}
