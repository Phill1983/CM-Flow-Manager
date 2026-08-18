import {
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  validateRepairDocument,
} from '@cm-flow-manager/repair-domain';
import { detectDocumentFormat } from './detect-format.js';
import { parseAudatexDocument } from './parse-audatex.js';
import { parseInvoiceDocument } from './parse-invoice.js';
import type { ExtractionInput, ExtractionResult, ExtractionWarning } from './types.js';

function ocrUnavailable(input: ExtractionInput, warnings: ExtractionWarning[]): ExtractionResult {
  const unavailable = {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    status: 'extraction_unavailable' as const,
    reason: 'ocr_required' as const,
    source: {
      documentId: input.documentId,
      documentType: 'unknown',
      sourceFormat: 'scan_ocr' as const,
      textLayerStatus: 'no' as const,
      ...(input.pageCount !== undefined ? { pageCount: input.pageCount } : {}),
      originalFormatHint: 'image_pdf',
    },
    warnings: ['Text layer missing or insufficient; OCR is required. No fields were invented.'],
  };
  return {
    status: 'OCR_REQUIRED',
    detection: {
      status: 'ocr_required',
      confidence: 'high',
      evidence: ['empty_or_sparse_text_layer'],
    },
    unavailable,
    validation: validateRepairDocument(unavailable),
    warnings,
    timingMs: 0,
  };
}

/**
 * Deterministic repair-document extraction PoC.
 * Input is already-extracted PDF text (qpdf does not extract text).
 * No AI, network, estimate/invoice comparison, or OCR.
 */
export function extractRepairDocument(input: ExtractionInput): ExtractionResult {
  const started = Date.now();
  const warnings: ExtractionWarning[] = [];

  if (!input.documentId || input.text === undefined || input.text === null) {
    return {
      status: 'EXTRACTION_FAILED',
      detection: { status: 'unknown', confidence: 'low', evidence: [] },
      warnings: [{ code: 'invalid_input', message: 'documentId and text are required' }],
      timingMs: Date.now() - started,
    };
  }

  const pageCount = input.pageCount ?? input.pages?.length;
  const detection = detectDocumentFormat(input.text);

  if (detection.status === 'ocr_required') {
    const result = ocrUnavailable({ ...input, pageCount }, warnings);
    return { ...result, detection, timingMs: Date.now() - started };
  }

  if (detection.status === 'unknown' || detection.status === 'ambiguous') {
    return {
      status: 'UNKNOWN_FORMAT',
      detection,
      warnings: [
        {
          code: detection.status === 'ambiguous' ? 'ambiguous_format' : 'unknown_format',
          message:
            detection.status === 'ambiguous'
              ? 'Audatex and invoice markers both present; format left unknown'
              : 'No supported format markers were detected',
        },
      ],
      timingMs: Date.now() - started,
    };
  }

  try {
    const parsed =
      detection.sourceFormat === 'audatex'
        ? parseAudatexDocument(input.documentId, input.text, input.pages, pageCount)
        : parseInvoiceDocument(input.documentId, input.text, input.pages, pageCount);

    const allWarnings = [...warnings, ...parsed.warnings];
    const validation = validateRepairDocument(parsed.document);
    const hasError = validation.issues.some((i) => i.severity === 'error');
    const hasWarning =
      allWarnings.length > 0 || validation.issues.some((i) => i.severity === 'warning');

    let status: ExtractionResult['status'] = 'SUCCESS';
    if (hasError) status = 'INVALID_DOCUMENT';
    else if (hasWarning) status = 'PARTIAL';

    return {
      status,
      detection,
      document: parsed.document,
      validation,
      warnings: allWarnings,
      timingMs: Date.now() - started,
    };
  } catch {
    return {
      status: 'EXTRACTION_FAILED',
      detection,
      warnings: [{ code: 'parser_exception', message: 'Parser failed without producing a document' }],
      timingMs: Date.now() - started,
    };
  }
}
