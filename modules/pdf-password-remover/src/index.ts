/**
 * Domain metadata and Phase 3A flow helpers for PDF Password Remover.
 * No React/Electron imports — UI lives in the desktop renderer.
 */
export const PDF_PASSWORD_REMOVER_MODULE_ID = 'pdf-password-remover' as const;

export const PDF_PASSWORD_REMOVER_ROUTE = '/pdf-tools/password-remover' as const;

export type PdfPasswordRemoverModuleInfo = {
  id: typeof PDF_PASSWORD_REMOVER_MODULE_ID;
  route: typeof PDF_PASSWORD_REMOVER_ROUTE;
  /** Phase 3A: product UI uses the qpdf-backed service via allowlisted IPC. */
  engineAvailable: boolean;
};

export function getPdfPasswordRemoverModuleInfo(): PdfPasswordRemoverModuleInfo {
  return {
    id: PDF_PASSWORD_REMOVER_MODULE_ID,
    route: PDF_PASSWORD_REMOVER_ROUTE,
    engineAvailable: true,
  };
}

export type {
  PasswordRemoverUiState,
  SelectedPdfMeta,
} from './flow-types';
export {
  canChangeSelection,
  canUnlock,
  isBusyState,
  passwordRequiredFor,
} from './flow-types';

export type { PasswordRemoverErrorMessageKey, PrepareFailureCode, UnlockOutcomeMapping } from './error-mapping';
export { isSafeUserFacingErrorKey, mapPrepareFailure, mapUnlockResult } from './error-mapping';

export type { DroppedFileLike, PdfAcceptance } from './accept-pdf';
export { acceptSinglePdfDrop, hasPdfFileName } from './accept-pdf';

export { formatFileSizeBytes } from './format';

export {
  shouldClearPasswordAfterOutcome,
  shouldClearPasswordOnFileChange,
  shouldClearPasswordOnReset,
} from './password-policy';

export type {
  CaseFolderMatch,
  CaseFolderResolver,
  ExtractedPlateCandidate,
  PlateNormalizer,
  VehiclePlateExtractor,
} from './phase3b-contracts';
