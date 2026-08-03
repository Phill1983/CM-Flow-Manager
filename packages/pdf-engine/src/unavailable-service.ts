import type { PdfInspectionResult, PdfUnlockInput, PdfUnlockResult, PdfUnlockService } from './types';

/**
 * PHASE 1 MOCK — deliberately unavailable.
 * Real qpdf adapter arrives in Phase 2. Do not treat this as a working unlocker.
 */
export class UnavailablePdfUnlockService implements PdfUnlockService {
  async inspect(_filePath: string): Promise<PdfInspectionResult> {
    return {
      status: 'unavailable',
      reason: 'PDF unlock engine is not available in Phase 1. qpdf arrives in Phase 2.',
    };
  }

  async unlock(_input: PdfUnlockInput): Promise<PdfUnlockResult> {
    return {
      status: 'failed',
      category: 'EngineUnavailable',
      message: 'PDF unlock engine is not available in Phase 1. qpdf arrives in Phase 2.',
    };
  }
}

export function createPdfUnlockService(): PdfUnlockService {
  return new UnavailablePdfUnlockService();
}
