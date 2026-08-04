import { describe, expect, it } from 'vitest';
import {
  canChangeSelection,
  canUnlock,
  isBusyState,
  mapUnlockResult,
  type PasswordRemoverUiState,
} from '@cm-flow-manager/pdf-password-remover';

/**
 * UI-adjacent control matrix for Phase 3A.
 * Full React mount tests are deferred; behavior is enforced via these rules + hook.
 */
describe('Password Remover control disabling matrix', () => {
  const busyStates: PasswordRemoverUiState[] = ['selecting', 'inspecting', 'unlocking'];

  it('marks processing states as busy and blocks selection', () => {
    for (const state of busyStates) {
      expect(isBusyState(state)).toBe(true);
      expect(canChangeSelection(state)).toBe(false);
    }
  });

  it('allows reset-friendly states to change selection', () => {
    for (const state of ['idle', 'ready', 'success', 'failed', 'incorrect_password'] as const) {
      expect(canChangeSelection(state)).toBe(true);
    }
  });

  it('prevents duplicate unlock while unlocking', () => {
    expect(canUnlock('unlocking', true, 'pw')).toBe(false);
  });
});

describe('Password Remover localized outcomes', () => {
  it('never surfaces raw stderr-like unlock messages as keys', () => {
    const mapped = mapUnlockResult({
      status: 'failed',
      category: 'PdfProcessing',
      message: 'qpdf: invalid password\nstack',
    });
    expect(mapped.messageKey.startsWith('passwordRemover.')).toBe(true);
    expect(mapped.messageKey.includes('qpdf')).toBe(false);
    expect(mapped.messageKey.includes('stack')).toBe(false);
  });
});
