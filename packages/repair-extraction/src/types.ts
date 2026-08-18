import type {
  CanonicalRepairDocument,
  DocumentValidationResult,
  ExtractionUnavailableDocument,
  SourceFormat,
} from '@cm-flow-manager/repair-domain';

export type ExtractedPage = {
  readonly pageNumber: number;
  readonly text: string;
};

export type ExtractionStatus =
  | 'SUCCESS'
  | 'PARTIAL'
  | 'UNKNOWN_FORMAT'
  | 'OCR_REQUIRED'
  | 'INVALID_DOCUMENT'
  | 'EXTRACTION_FAILED';

export type FormatDetectionStatus = 'detected' | 'unknown' | 'ambiguous' | 'ocr_required';

export type FormatDetection = {
  readonly status: FormatDetectionStatus;
  readonly sourceFormat?: SourceFormat;
  readonly confidence: 'high' | 'low';
  readonly evidence: readonly string[];
};

export type ExtractionWarning = {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
};

export type ExtractionInput = {
  readonly documentId: string;
  readonly text: string;
  readonly pages?: readonly ExtractedPage[];
  readonly pageCount?: number;
};

export type ExtractionResult = {
  readonly status: ExtractionStatus;
  readonly detection: FormatDetection;
  readonly document?: CanonicalRepairDocument;
  readonly unavailable?: ExtractionUnavailableDocument;
  readonly validation?: DocumentValidationResult;
  readonly warnings: readonly ExtractionWarning[];
  readonly timingMs: number;
};
