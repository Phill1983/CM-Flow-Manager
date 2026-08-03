import { describe, expect, it } from 'vitest';
import {
  areSameResolvedPath,
  buildUnlockedFileName,
  hasPdfExtension,
  sanitizePathForLogs,
} from './index';

describe('file-utils', () => {
  it('detects pdf extension case-insensitively', () => {
    expect(hasPdfExtension('a.PDF')).toBe(true);
    expect(hasPdfExtension('a.txt')).toBe(false);
  });

  it('builds unlocked and collision names', () => {
    expect(buildUnlockedFileName('report.pdf')).toBe('report_unlocked.pdf');
    expect(buildUnlockedFileName('report.pdf', 2)).toBe('report_unlocked_2.pdf');
  });

  it('sanitizes paths to basename for logs', () => {
    expect(sanitizePathForLogs('D:/docs/secret/file.pdf')).toBe('file.pdf');
  });

  it('compares resolved paths on Windows case-insensitively', () => {
    expect(areSameResolvedPath('C:/Temp/a.pdf', 'c:\\Temp\\a.pdf')).toBe(true);
  });
});
