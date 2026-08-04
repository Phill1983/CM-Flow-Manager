import { describe, expect, it } from 'vitest';
import { isQpdfSuccessfulExit } from './qpdf-unlock-service';

describe('isQpdfSuccessfulExit', () => {
  it('accepts clean success and warning-only success', () => {
    expect(isQpdfSuccessfulExit(0)).toBe(true);
    expect(isQpdfSuccessfulExit(3)).toBe(true);
  });

  it('rejects error exits', () => {
    expect(isQpdfSuccessfulExit(2)).toBe(false);
    expect(isQpdfSuccessfulExit(1)).toBe(false);
    expect(isQpdfSuccessfulExit(null)).toBe(false);
  });
});
