/**
 * Domain metadata for PDF Password Remover.
 * No React/Electron imports — UI lives in the desktop renderer for Phase 1 placeholder.
 */
export const PDF_PASSWORD_REMOVER_MODULE_ID = 'pdf-password-remover' as const;

export const PDF_PASSWORD_REMOVER_ROUTE = '/pdf-tools/password-remover' as const;

export type PdfPasswordRemoverModuleInfo = {
  id: typeof PDF_PASSWORD_REMOVER_MODULE_ID;
  route: typeof PDF_PASSWORD_REMOVER_ROUTE;
  /** Phase 1: engine is contract-only / unavailable. */
  engineAvailable: false;
};

export function getPdfPasswordRemoverModuleInfo(): PdfPasswordRemoverModuleInfo {
  return {
    id: PDF_PASSWORD_REMOVER_MODULE_ID,
    route: PDF_PASSWORD_REMOVER_ROUTE,
    engineAvailable: false,
  };
}
