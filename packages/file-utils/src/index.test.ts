import { describe, expect, it } from 'vitest';
import {
  areSameResolvedPath,
  buildExtractedFileName,
  buildMergedFileName,
  buildUnlockedFileName,
  hasPdfExtension,
  sanitizeFileNamePart,
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

  it('builds extract and merge names with collision suffixes', () => {
    expect(buildExtractedFileName('EA2612744 - Decyzja.pdf', '1-3_7')).toBe(
      'EA2612744 - Decyzja_pages_1-3_7.pdf',
    );
    expect(buildExtractedFileName('report.pdf', '1', 2)).toBe('report_pages_1_2.pdf');
    expect(buildExtractedFileName('source.pdf', 'pages')).toBe('source_pages.pdf');
    expect(buildExtractedFileName('source.pdf', '')).toBe('source_pages.pdf');
    expect(buildMergedFileName()).toBe('merged.pdf');
    expect(buildMergedFileName(2)).toBe('merged_2.pdf');
  });

  it('sanitizes illegal filename characters', () => {
    expect(sanitizeFileNamePart('a<b>:c')).toBe('a_b__c');
  });
});
