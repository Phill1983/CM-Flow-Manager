import type { PdfExtractPagesResult, PdfMergeResult, PdfToolFailureCategory } from '@cm-flow-manager/pdf-engine';
import type { SplitMergeUiState } from './flow-types';

export type SplitMergeErrorMessageKey =
  | 'pdfSplitMerge.error.invalidPdf'
  | 'pdfSplitMerge.error.encrypted'
  | 'pdfSplitMerge.error.encryptedNamed'
  | 'pdfSplitMerge.error.invalidPageRange'
  | 'pdfSplitMerge.error.pageOutOfBounds'
  | 'pdfSplitMerge.error.notEnoughFiles'
  | 'pdfSplitMerge.error.duplicateFile'
  | 'pdfSplitMerge.error.sourceUnavailable'
  | 'pdfSplitMerge.error.destinationUnavailable'
  | 'pdfSplitMerge.error.destinationCollision'
  | 'pdfSplitMerge.error.engineUnavailable'
  | 'pdfSplitMerge.error.unexpected'
  | 'pdfSplitMerge.error.unsupportedFile'
  | 'pdfSplitMerge.error.multipleFiles'
  | 'pdfSplitMerge.error.openFolderFailed';

export type OutcomeMapping = {
  state: SplitMergeUiState;
  messageKey: SplitMergeErrorMessageKey | 'pdfSplitMerge.split.success' | 'pdfSplitMerge.merge.success';
  fileName?: string;
};

function mapToolCategory(category: PdfToolFailureCategory): OutcomeMapping {
  switch (category) {
    case 'InvalidPdf':
      return { state: 'invalid_pdf', messageKey: 'pdfSplitMerge.error.invalidPdf' };
    case 'EncryptedPdf':
      return { state: 'encrypted', messageKey: 'pdfSplitMerge.error.encrypted' };
    case 'InvalidPageRange':
      return { state: 'invalid_range', messageKey: 'pdfSplitMerge.error.invalidPageRange' };
    case 'PageOutOfBounds':
      return { state: 'invalid_range', messageKey: 'pdfSplitMerge.error.pageOutOfBounds' };
    case 'NotEnoughFiles':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.notEnoughFiles' };
    case 'DuplicateFile':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.duplicateFile' };
    case 'SourceFileNotFound':
    case 'SourceFileAccess':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.sourceUnavailable' };
    case 'DestinationAccess':
      return { state: 'destination_error', messageKey: 'pdfSplitMerge.error.destinationUnavailable' };
    case 'DestinationExists':
      return { state: 'destination_error', messageKey: 'pdfSplitMerge.error.destinationCollision' };
    case 'EngineUnavailable':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.engineUnavailable' };
    default:
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.unexpected' };
  }
}

export function mapExtractResult(result: PdfExtractPagesResult): OutcomeMapping {
  if (result.status === 'extracted') {
    return { state: 'success', messageKey: 'pdfSplitMerge.split.success' };
  }
  const mapped = mapToolCategory(result.category);
  return { ...mapped, fileName: result.fileName };
}

export function mapMergeResult(result: PdfMergeResult): OutcomeMapping {
  if (result.status === 'merged') {
    return { state: 'success', messageKey: 'pdfSplitMerge.merge.success' };
  }
  const mapped = mapToolCategory(result.category);
  if (mapped.state === 'encrypted' && result.fileName) {
    return {
      state: 'encrypted',
      messageKey: 'pdfSplitMerge.error.encryptedNamed',
      fileName: result.fileName,
    };
  }
  return { ...mapped, fileName: result.fileName };
}

export type PrepareFailureCode =
  | 'invalid_pdf'
  | 'unavailable'
  | 'not_found'
  | 'bad_path'
  | 'destination_error'
  | 'encrypted_pdf';

export function mapPrepareFailure(code: PrepareFailureCode): {
  state: SplitMergeUiState;
  messageKey: SplitMergeErrorMessageKey;
} {
  switch (code) {
    case 'invalid_pdf':
      return { state: 'invalid_pdf', messageKey: 'pdfSplitMerge.error.invalidPdf' };
    case 'encrypted_pdf':
      return { state: 'encrypted', messageKey: 'pdfSplitMerge.error.encrypted' };
    case 'not_found':
    case 'bad_path':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.sourceUnavailable' };
    case 'unavailable':
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.engineUnavailable' };
    case 'destination_error':
      return { state: 'destination_error', messageKey: 'pdfSplitMerge.error.destinationCollision' };
    default:
      return { state: 'failed', messageKey: 'pdfSplitMerge.error.unexpected' };
  }
}

export function mapMergePrepareFailure(
  code: PrepareFailureCode,
  fileName?: string,
): OutcomeMapping {
  const mapped = mapPrepareFailure(code);
  if (code === 'encrypted_pdf' && fileName) {
    return {
      state: 'encrypted',
      messageKey: 'pdfSplitMerge.error.encryptedNamed',
      fileName,
    };
  }
  return { ...mapped, fileName };
}

export function withEncryptedFileName(template: string, fileName: string): string {
  return template.replace('{file}', fileName);
}
