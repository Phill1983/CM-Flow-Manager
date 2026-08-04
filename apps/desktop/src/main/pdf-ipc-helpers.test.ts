import { describe, expect, it } from 'vitest';
import { isSafeAbsolutePath, isSafePdfAbsolutePath } from './pdf-ipc-helpers';

describe('pdf IPC path guards', () => {
  it('accepts absolute PDF paths only', () => {
    expect(isSafePdfAbsolutePath('C:\\\\docs\\\\a.pdf')).toBe(true);
    expect(isSafePdfAbsolutePath('C:\\\\docs\\\\a.PDF')).toBe(true);
    expect(isSafePdfAbsolutePath('relative.pdf')).toBe(false);
    expect(isSafePdfAbsolutePath('C:\\\\docs\\\\a.txt')).toBe(false);
    expect(isSafePdfAbsolutePath(null)).toBe(false);
  });

  it('accepts absolute folder targets for open-folder', () => {
    expect(isSafeAbsolutePath('C:\\\\output')).toBe(true);
    expect(isSafeAbsolutePath('../etc')).toBe(false);
    expect(isSafeAbsolutePath('')).toBe(false);
  });
});
