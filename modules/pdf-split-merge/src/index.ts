/**
 * Domain helpers for PDF Split / Merge.
 * No React/Electron imports — UI lives in the desktop renderer.
 */
export const PDF_SPLIT_MERGE_MODULE_ID = 'pdf-split-merge' as const;

export const PDF_SPLIT_MERGE_ROUTE = '/pdf-tools/split-merge' as const;

export type PdfSplitMergeModuleInfo = {
  id: typeof PDF_SPLIT_MERGE_MODULE_ID;
  route: typeof PDF_SPLIT_MERGE_ROUTE;
  engineAvailable: boolean;
};

export function getPdfSplitMergeModuleInfo(): PdfSplitMergeModuleInfo {
  return {
    id: PDF_SPLIT_MERGE_MODULE_ID,
    route: PDF_SPLIT_MERGE_ROUTE,
    engineAvailable: true,
  };
}

export type { SplitMergeUiState, SplitSourceMeta, MergeFileMeta } from './flow-types';
export { canChangeSelection, canExtract, canMerge, isBusyState } from './flow-types';

export type { SplitMergeErrorMessageKey } from './error-mapping';
export {
  mapExtractResult,
  mapMergePrepareFailure,
  mapMergeResult,
  mapPrepareFailure,
  withEncryptedFileName,
} from './error-mapping';

export type { DroppedFileLike, PdfAcceptance } from './accept-pdf';
export { acceptMergePdfDrop, acceptSinglePdfDrop, hasPdfFileName, isSameFilePath } from './accept-pdf';

export { formatFileSizeBytes } from './format';
export { moveItem, moveItemToIndex } from './reorder';
export { parsePageRange, formatPagesForFileName, formatPagesForRangeInput, togglePageSelection, pageSlotNumbers, resolveThumbnailSelection } from '@cm-flow-manager/pdf-engine/page-range';
