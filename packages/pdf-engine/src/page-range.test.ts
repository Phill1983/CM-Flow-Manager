import { describe, expect, it } from 'vitest';
import { formatPagesForFileName, formatPagesForRangeInput, pageSlotNumbers, parsePageRange, resolveThumbnailSelection, togglePageSelection } from './page-range';

describe('parsePageRange', () => {
  it('parses a single page', () => {
    expect(parsePageRange('1')).toEqual({ ok: true, pages: [1], qpdfPagesSpec: '1' });
  });

  it('parses a contiguous range', () => {
    expect(parsePageRange('1-3')).toEqual({ ok: true, pages: [1, 2, 3], qpdfPagesSpec: '1,2,3' });
  });

  it('parses a comma list', () => {
    expect(parsePageRange('1,3,5')).toEqual({ ok: true, pages: [1, 3, 5], qpdfPagesSpec: '1,3,5' });
  });

  it('parses mixed ranges', () => {
    expect(parsePageRange('1-3,5,8-10')).toEqual({
      ok: true,
      pages: [1, 2, 3, 5, 8, 9, 10],
      qpdfPagesSpec: '1,2,3,5,8,9,10',
    });
  });

  it('tolerates whitespace', () => {
    expect(parsePageRange(' 1 - 3 , 5 ')).toEqual({
      ok: true,
      pages: [1, 2, 3, 5],
      qpdfPagesSpec: '1,2,3,5',
    });
  });

  it('preserves requested order', () => {
    expect(parsePageRange('5,1-3')).toEqual({
      ok: true,
      pages: [5, 1, 2, 3],
      qpdfPagesSpec: '5,1,2,3',
    });
  });

  it('collapses duplicates keeping first occurrence', () => {
    expect(parsePageRange('1,1,2')).toEqual({ ok: true, pages: [1, 2], qpdfPagesSpec: '1,2' });
    expect(parsePageRange('3,1-3')).toEqual({ ok: true, pages: [3, 1, 2], qpdfPagesSpec: '3,1,2' });
  });

  it('rejects empty and garbage', () => {
    expect(parsePageRange('').ok).toBe(false);
    expect(parsePageRange('   ').ok).toBe(false);
    const zero = parsePageRange('0');
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.code).toBe('page_zero');
    expect(parsePageRange('-1').ok).toBe(false);
    expect(parsePageRange('abc').ok).toBe(false);
    expect(parsePageRange('1-').ok).toBe(false);
    expect(parsePageRange('-3').ok).toBe(false);
    const reversed = parsePageRange('3-1');
    expect(reversed.ok).toBe(false);
    if (!reversed.ok) expect(reversed.code).toBe('start_after_end');
    expect(parsePageRange('1,,3').ok).toBe(false);
    expect(parsePageRange('1-a').ok).toBe(false);
  });

  it('rejects pages above pageCount', () => {
    const result = parsePageRange('1,9', 5);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('page_out_of_bounds');
  });

  it('accepts last page equal to pageCount', () => {
    expect(parsePageRange('5', 5)).toEqual({ ok: true, pages: [5], qpdfPagesSpec: '5' });
  });
});

describe('formatPagesForFileName', () => {
  it('compresses consecutive pages', () => {
    expect(formatPagesForFileName([1, 2, 3, 7])).toBe('1-3_7');
  });

  it('shortens very long selections', () => {
    const pages = Array.from({ length: 80 }, (_, i) => i + 1);
    expect(formatPagesForFileName(pages).length).toBeLessThanOrEqual(40);
  });

  it('uses a placeholder label for empty selection (filename builder must not double pages)', () => {
    expect(formatPagesForFileName([])).toBe('pages');
  });
});

describe('thumbnail selection sync', () => {
  it('formats range input from thumbnail order', () => {
    expect(formatPagesForRangeInput([1, 2, 3, 5])).toBe('1-3,5');
    expect(formatPagesForRangeInput([5, 1, 2, 3])).toBe('5,1-3');
    expect(formatPagesForRangeInput([])).toBe('');
  });

  it('round-trips range text through parser and formatter', () => {
    const parsed = parsePageRange('1-3,5,8-10');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(formatPagesForRangeInput(parsed.pages)).toBe('1-3,5,8-10');
  });

  it('toggles append and deselect while preserving order', () => {
    expect(togglePageSelection([], 2)).toEqual([2]);
    expect(togglePageSelection([1, 3], 5)).toEqual([1, 3, 5]);
    expect(togglePageSelection([1, 3, 5], 3)).toEqual([1, 5]);
  });

  it('keeps range → thumbnails and thumbnails → range aligned for non-contiguous sets', () => {
    const fromRange = parsePageRange('1-3,5');
    expect(fromRange.ok).toBe(true);
    if (!fromRange.ok) return;
    expect([...fromRange.pages]).toEqual([1, 2, 3, 5]);
    const afterClickFour = togglePageSelection(fromRange.pages, 4);
    expect(afterClickFour).toEqual([1, 2, 3, 5, 4]);
    expect(formatPagesForRangeInput(afterClickFour)).toBe('1-3,5,4');
    const afterDeselectTwo = togglePageSelection(afterClickFour, 2);
    expect(afterDeselectTwo).toEqual([1, 3, 5, 4]);
    expect(formatPagesForRangeInput(afterDeselectTwo)).toBe('1,3,5,4');
  });

  it('matches thumbnail slot count to page count, including a large document', () => {
    expect(pageSlotNumbers(10)).toHaveLength(10);
    expect(pageSlotNumbers(10)?.[0]).toBe(1);
    expect(pageSlotNumbers(10)?.[9]).toBe(10);
    const large = pageSlotNumbers(250);
    expect(large).toHaveLength(250);
    expect(large[249]).toBe(250);
  });

  it('clears highlights on empty input and keeps last valid while typing is invalid', () => {
    expect(resolveThumbnailSelection('', 10, [1, 2])).toEqual([]);
    expect(resolveThumbnailSelection('1-3,5', 10, [])).toEqual([1, 2, 3, 5]);
    expect(resolveThumbnailSelection('1-3,', 10, [1, 2, 3])).toEqual([1, 2, 3]);
  });
});
