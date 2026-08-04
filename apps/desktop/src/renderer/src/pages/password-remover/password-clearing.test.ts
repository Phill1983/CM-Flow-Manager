import { describe, expect, it } from 'vitest';
import {
  shouldClearPasswordAfterOutcome,
  shouldClearPasswordOnFileChange,
  shouldClearPasswordOnReset,
} from '@cm-flow-manager/pdf-password-remover';

describe('password clearing policy', () => {
  it('clears password after success, reset, and file change', () => {
    expect(shouldClearPasswordAfterOutcome('success')).toBe(true);
    expect(shouldClearPasswordOnReset()).toBe(true);
    expect(shouldClearPasswordOnFileChange()).toBe(true);
  });

  it('keeps password for incorrect_password retry', () => {
    expect(shouldClearPasswordAfterOutcome('incorrect_password')).toBe(false);
  });

  it('clears password after non-retry errors', () => {
    expect(shouldClearPasswordAfterOutcome('failed')).toBe(true);
    expect(shouldClearPasswordAfterOutcome('destination_error')).toBe(true);
    expect(shouldClearPasswordAfterOutcome('invalid_pdf')).toBe(true);
  });
});
