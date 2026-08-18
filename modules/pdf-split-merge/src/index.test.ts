import { describe, expect, it } from 'vitest';
import {
  acceptMergePdfDrop,
  acceptSinglePdfDrop,
  canExtract,
  canMerge,
  formatFileSizeBytes,
  getPdfSplitMergeModuleInfo,
  isSameFilePath,
  mapExtractResult,
  mapMergePrepareFailure,
  mapMergeResult,
  moveItem,
  moveItemToIndex,
  formatPagesForRangeInput,
  pageSlotNumbers,
  resolveThumbnailSelection,
  togglePageSelection,
  withEncryptedFileName,
} from './index';

describe('pdf-split-merge module info', () => {
  it('exposes the combined route', () => {
    const info = getPdfSplitMergeModuleInfo();
    expect(info.engineAvailable).toBe(true);
    expect(info.route).toBe('/pdf-tools/split-merge');
  });
});

describe('drop acceptance', () => {
  it('accepts one PDF for split and rejects multiples', () => {
    expect(acceptSinglePdfDrop([{ name: 'a.PDF' }])).toEqual({ accepted: true });
    expect(acceptSinglePdfDrop([{ name: 'a.pdf' }, { name: 'b.pdf' }]).accepted).toBe(false);
    expect(acceptSinglePdfDrop([{ name: 'a.txt' }]).accepted).toBe(false);
  });

  it('accepts multiple PDFs for merge and rejects mixed types', () => {
    expect(acceptMergePdfDrop([{ name: 'a.pdf' }, { name: 'b.pdf' }]).accepted).toBe(true);
    expect(acceptMergePdfDrop([{ name: 'a.pdf' }, { name: 'b.png' }]).accepted).toBe(false);
    expect(acceptMergePdfDrop([]).accepted).toBe(false);
  });

  it('compares paths case-insensitively', () => {
    expect(isSameFilePath('C:\\Docs\\a.pdf', 'c:/docs/A.pdf')).toBe(true);
  });
});

describe('controls', () => {
  it('requires two files to merge', () => {
    expect(canMerge('ready', 1, 'C:\\out\\merged.pdf')).toBe(false);
    expect(canMerge('ready', 2, 'C:\\out\\merged.pdf')).toBe(true);
    expect(canMerge('processing', 2, 'C:\\out\\merged.pdf')).toBe(false);
  });

  it('blocks extract for encrypted PDFs and invalid ranges', () => {
    const meta = {
      filePath: 'C:\\a.pdf',
      fileName: 'a.pdf',
      fileSizeBytes: 10,
      sourceDirectory: 'C:\\',
      encryptionStatus: 'unencrypted' as const,
      pageCount: 3,
    };
    expect(canExtract('ready', meta, true, 'C:\\a_pages_1.pdf')).toBe(true);
    expect(canExtract('ready', { ...meta, encryptionStatus: 'encrypted' }, true, 'C:\\out.pdf')).toBe(false);
    expect(canExtract('ready', meta, false, 'C:\\out.pdf')).toBe(false);
  });
});

describe('error mapping', () => {
  it('maps extract success and encrypted merge with file name', () => {
    expect(mapExtractResult({ status: 'extracted', destinationPath: 'C:\\out.pdf', pageCount: 2 })).toEqual({
      state: 'success',
      messageKey: 'pdfSplitMerge.split.success',
    });
    expect(
      mapMergeResult({
        status: 'failed',
        category: 'EncryptedPdf',
        message: 'protected',
        fileName: 'secret.pdf',
      }),
    ).toEqual({
      state: 'encrypted',
      messageKey: 'pdfSplitMerge.error.encryptedNamed',
      fileName: 'secret.pdf',
    });
    expect(mapMergePrepareFailure('encrypted_pdf', 'x.pdf').messageKey).toBe(
      'pdfSplitMerge.error.encryptedNamed',
    );
    expect(withEncryptedFileName('File {file} is protected.', 'x.pdf')).toBe('File x.pdf is protected.');
  });
});

describe('reorder and size', () => {
  it('moves items up and down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });

  it('reorders merge files by drag index without duplicating entries', () => {
    const files = [{ path: 'a.pdf' }, { path: 'b.pdf' }, { path: 'c.pdf' }];
    expect(moveItemToIndex(files, 2, 0).map((file) => file.path)).toEqual(['c.pdf', 'a.pdf', 'b.pdf']);
    expect(moveItemToIndex(files, 0, 2).map((file) => file.path)).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  });

  it('moves a selected page before another without changing identities or introducing duplicates', () => {
    expect(moveItemToIndex([5, 1, 2, 3], 3, 1)).toEqual([5, 3, 1, 2]);
    expect(moveItemToIndex([3, 2], 1, 0)).toEqual([2, 3]);
    expect(moveItemToIndex([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
  });

  it('keeps checkbox/click toggle, range input, and drag on one canonical order', () => {
    const fromRange = resolveThumbnailSelection('5,1-3', 10, []);
    expect(fromRange).toEqual([5, 1, 2, 3]);
    const afterClick = togglePageSelection(fromRange, 4);
    expect(afterClick).toEqual([5, 1, 2, 3, 4]);
    expect(formatPagesForRangeInput(afterClick)).toBe('5,1-4');
    const afterDeselect = togglePageSelection(afterClick, 1);
    expect(afterDeselect).toEqual([5, 2, 3, 4]);
    const reselected = togglePageSelection(afterDeselect, 1);
    expect(reselected).toEqual([5, 2, 3, 4, 1]);
    const dragged = moveItemToIndex(fromRange, fromRange.indexOf(3), fromRange.indexOf(1));
    expect(dragged).toEqual([5, 3, 1, 2]);
    expect(formatPagesForRangeInput(dragged)).toBe('5,3,1-2');
    expect(dragged).toEqual([5, 3, 1, 2]);
    expect(new Set(dragged).size).toBe(dragged.length);
    const badges = Object.fromEntries(dragged.map((page, index) => [page, index + 1]));
    expect(badges).toEqual({ 5: 1, 3: 2, 1: 3, 2: 4 });
    expect(dragged[1]).toBe(3);
  });

  it('formats sizes', () => {
    expect(formatFileSizeBytes(2048)).toBe('2 KB');
  });
});

describe('thumbnail selection helpers', () => {
  it('keeps slot count aligned with page count, including large documents', () => {
    expect(pageSlotNumbers(12)).toHaveLength(12);
    const large = pageSlotNumbers(250);
    expect(large).toHaveLength(250);
    expect(large[0]).toBe(1);
    expect(large[249]).toBe(250);
  });

  it('syncs range text with thumbnail toggles', () => {
    const selected = resolveThumbnailSelection('1-3,5', 10, []);
    expect(selected).toEqual([1, 2, 3, 5]);
  });
});
