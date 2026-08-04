import type { PasswordRemoverUiState } from './flow-types';

/**
 * Password must stay in component memory only.
 * Clear after success, reset, file change, and most errors.
 * Keep on incorrect_password so the user can retry without retyping from scratch
 * (they may still edit or clear manually).
 */
export function shouldClearPasswordAfterOutcome(state: PasswordRemoverUiState): boolean {
  if (state === 'incorrect_password') {
    return false;
  }
  return (
    state === 'success' ||
    state === 'invalid_pdf' ||
    state === 'destination_error' ||
    state === 'failed' ||
    state === 'cancelled'
  );
}

export function shouldClearPasswordOnFileChange(): boolean {
  return true;
}

export function shouldClearPasswordOnReset(): boolean {
  return true;
}
