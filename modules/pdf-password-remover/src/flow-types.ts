/**
 * Explicit Phase 3A Password Remover UI processing states.
 */
export type PasswordRemoverUiState =
  | 'idle'
  | 'selecting'
  | 'inspecting'
  | 'ready'
  | 'unlocking'
  | 'success'
  | 'incorrect_password'
  | 'invalid_pdf'
  | 'destination_error'
  | 'cancelled'
  | 'failed';

export type SelectedPdfMeta = {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  sourceDirectory: string;
  encryptionStatus: 'encrypted' | 'unencrypted';
  pageCount?: number;
};

export function isBusyState(state: PasswordRemoverUiState): boolean {
  return state === 'selecting' || state === 'inspecting' || state === 'unlocking';
}

export function canChangeSelection(state: PasswordRemoverUiState): boolean {
  return !isBusyState(state);
}

export function canUnlock(state: PasswordRemoverUiState, passwordRequired: boolean, password: string): boolean {
  const unlockable =
    state === 'ready' ||
    state === 'incorrect_password' ||
    state === 'destination_error' ||
    state === 'failed';
  if (!unlockable) {
    return false;
  }
  if (passwordRequired && password.length === 0) {
    return false;
  }
  return true;
}

export function passwordRequiredFor(meta: SelectedPdfMeta | null): boolean {
  return meta?.encryptionStatus === 'encrypted';
}
