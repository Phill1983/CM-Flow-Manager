export type SplitMergeUiState =
  | 'idle'
  | 'selecting'
  | 'inspecting'
  | 'ready'
  | 'processing'
  | 'success'
  | 'invalid_pdf'
  | 'invalid_range'
  | 'encrypted'
  | 'destination_error'
  | 'cancelled'
  | 'failed';

export type SplitSourceMeta = {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  sourceDirectory: string;
  encryptionStatus: 'encrypted' | 'unencrypted';
  pageCount?: number;
};

export type MergeFileMeta = {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  sourceDirectory: string;
  pageCount: number;
};

export function isBusyState(state: SplitMergeUiState): boolean {
  return state === 'selecting' || state === 'inspecting' || state === 'processing';
}

export function canChangeSelection(state: SplitMergeUiState): boolean {
  return !isBusyState(state);
}

export function canExtract(
  state: SplitMergeUiState,
  meta: SplitSourceMeta | null,
  rangeValid: boolean,
  destinationPath: string,
): boolean {
  if (!meta || !destinationPath || !rangeValid) return false;
  if (meta.encryptionStatus === 'encrypted') return false;
  if (!meta.pageCount || meta.pageCount < 1) return false;
  return (
    state === 'ready' ||
    state === 'invalid_range' ||
    state === 'destination_error' ||
    state === 'failed'
  );
}

export function canMerge(state: SplitMergeUiState, fileCount: number, destinationPath: string): boolean {
  if (fileCount < 2 || !destinationPath) return false;
  return state === 'ready' || state === 'destination_error' || state === 'failed';
}
