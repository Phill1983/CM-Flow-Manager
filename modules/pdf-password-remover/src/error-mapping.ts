import type { PdfUnlockResult } from '@cm-flow-manager/pdf-engine';
import type { PasswordRemoverUiState } from './flow-types';

/** i18n keys for Password Remover user-facing errors (must exist in all catalogs). */
export type PasswordRemoverErrorMessageKey =
  | 'passwordRemover.error.incorrectPassword'
  | 'passwordRemover.error.invalidPdf'
  | 'passwordRemover.error.sourceUnavailable'
  | 'passwordRemover.error.destinationUnavailable'
  | 'passwordRemover.error.destinationCollision'
  | 'passwordRemover.error.unsupportedEncryption'
  | 'passwordRemover.error.engineUnavailable'
  | 'passwordRemover.error.unexpected'
  | 'passwordRemover.error.unsupportedFile'
  | 'passwordRemover.error.openFolderFailed'
  | 'passwordRemover.error.multipleFiles';

export type UnlockOutcomeMapping = {
  state: PasswordRemoverUiState;
  messageKey: PasswordRemoverErrorMessageKey | 'passwordRemover.status.success';
};

export function mapUnlockResult(result: PdfUnlockResult): UnlockOutcomeMapping {
  if (result.status === 'unlocked') {
    return { state: 'success', messageKey: 'passwordRemover.status.success' };
  }
  if (result.status === 'incorrect_password') {
    return {
      state: 'incorrect_password',
      messageKey: 'passwordRemover.error.incorrectPassword',
    };
  }

  switch (result.category) {
    case 'InvalidPdf':
      return { state: 'invalid_pdf', messageKey: 'passwordRemover.error.invalidPdf' };
    case 'SourceFileNotFound':
    case 'SourceFileAccess':
      return { state: 'failed', messageKey: 'passwordRemover.error.sourceUnavailable' };
    case 'DestinationAccess':
      return { state: 'destination_error', messageKey: 'passwordRemover.error.destinationUnavailable' };
    case 'DestinationExists':
      return { state: 'destination_error', messageKey: 'passwordRemover.error.destinationCollision' };
    case 'UnsupportedEncryption':
      return { state: 'failed', messageKey: 'passwordRemover.error.unsupportedEncryption' };
    case 'EngineUnavailable':
      return { state: 'failed', messageKey: 'passwordRemover.error.engineUnavailable' };
    case 'Cancelled':
      return { state: 'cancelled', messageKey: 'passwordRemover.error.unexpected' };
    case 'PdfProcessing':
    case 'Internal':
    default:
      return { state: 'failed', messageKey: 'passwordRemover.error.unexpected' };
  }
}

export type PrepareFailureCode =
  | 'invalid_pdf'
  | 'unavailable'
  | 'not_found'
  | 'bad_path'
  | 'destination_error';

export function mapPrepareFailure(code: PrepareFailureCode): {
  state: PasswordRemoverUiState;
  messageKey: PasswordRemoverErrorMessageKey;
} {
  switch (code) {
    case 'invalid_pdf':
      return { state: 'invalid_pdf', messageKey: 'passwordRemover.error.invalidPdf' };
    case 'not_found':
      return { state: 'failed', messageKey: 'passwordRemover.error.sourceUnavailable' };
    case 'unavailable':
      return { state: 'failed', messageKey: 'passwordRemover.error.engineUnavailable' };
    case 'destination_error':
      return { state: 'destination_error', messageKey: 'passwordRemover.error.destinationCollision' };
    case 'bad_path':
    default:
      return { state: 'failed', messageKey: 'passwordRemover.error.unexpected' };
  }
}

/** Never return raw technical strings to the UI. */
export function isSafeUserFacingErrorKey(key: string): key is PasswordRemoverErrorMessageKey {
  return key.startsWith('passwordRemover.error.');
}
