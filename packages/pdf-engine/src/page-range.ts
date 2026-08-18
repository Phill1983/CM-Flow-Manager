/**
 * Deterministic page-selection parser for Split PDF.
 *
 * Policy (Phase 3.7):
 * - Preserve user-requested order (5,1-3 → 5,1,2,3).
 * - Ranges are internally ascending; `3-1` is invalid (not reversed).
 * - Duplicates collapse keeping first occurrence (1,1,2 → 1,2).
 * - Whitespace around commas and hyphens is tolerated.
 * - Output is a list of positive integers — never a raw user string for qpdf.
 */

export type PageRangeErrorCode =
  | 'empty_selection'
  | 'malformed'
  | 'page_zero'
  | 'negative_page'
  | 'start_after_end'
  | 'page_out_of_bounds'
  | 'non_numeric';

export type PageRangeParseResult =
  | { ok: true; pages: readonly number[]; qpdfPagesSpec: string }
  | { ok: false; code: PageRangeErrorCode; message: string };

const TOKEN_RE = /^(\d+)(?:\s*-\s*(\d+))?$/;

function collapseDuplicatesPreserveOrder(pages: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const page of pages) {
    if (seen.has(page)) continue;
    seen.add(page);
    out.push(page);
  }
  return out;
}

export function parsePageRange(raw: string, pageCount?: number): PageRangeParseResult {
  if (typeof raw !== 'string') {
    return { ok: false, code: 'malformed', message: 'Page selection is required.' };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, code: 'empty_selection', message: 'Page selection is empty.' };
  }

  const parts = trimmed.split(',').map((part) => part.trim());
  if (parts.some((part) => part.length === 0)) {
    return { ok: false, code: 'malformed', message: 'Page selection contains an empty token.' };
  }

  const collected: number[] = [];
  for (const part of parts) {
    const match = TOKEN_RE.exec(part);
    if (!match) {
      if (/[^\d\s-]/.test(part)) {
        return { ok: false, code: 'non_numeric', message: 'Page selection contains non-numeric text.' };
      }
      return { ok: false, code: 'malformed', message: 'Page selection is malformed.' };
    }
    const start = Number.parseInt(match[1] ?? '', 10);
    const endRaw = match[2];
    if (!Number.isInteger(start)) {
      return { ok: false, code: 'non_numeric', message: 'Page selection contains non-numeric text.' };
    }
    if (start === 0) {
      return { ok: false, code: 'page_zero', message: 'Page numbers start at 1.' };
    }
    if (start < 0) {
      return { ok: false, code: 'negative_page', message: 'Negative page numbers are not allowed.' };
    }

    if (endRaw === undefined) {
      collected.push(start);
      continue;
    }
    const end = Number.parseInt(endRaw, 10);
    if (!Number.isInteger(end)) {
      return { ok: false, code: 'non_numeric', message: 'Page selection contains non-numeric text.' };
    }
    if (end === 0) {
      return { ok: false, code: 'page_zero', message: 'Page numbers start at 1.' };
    }
    if (end < 0) {
      return { ok: false, code: 'negative_page', message: 'Negative page numbers are not allowed.' };
    }
    if (start > end) {
      return { ok: false, code: 'start_after_end', message: 'Range start must not be greater than range end.' };
    }
    for (let page = start; page <= end; page += 1) {
      collected.push(page);
    }
  }

  const pages = collapseDuplicatesPreserveOrder(collected);
  if (pages.length === 0) {
    return { ok: false, code: 'empty_selection', message: 'Page selection is empty.' };
  }

  if (typeof pageCount === 'number') {
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      return { ok: false, code: 'malformed', message: 'Source page count is invalid.' };
    }
    const outOfBounds = pages.find((page) => page > pageCount);
    if (outOfBounds !== undefined) {
      return {
        ok: false,
        code: 'page_out_of_bounds',
        message: `Page ${outOfBounds} is outside 1–${pageCount}.`,
      };
    }
  }

  return {
    ok: true,
    pages,
    qpdfPagesSpec: pages.join(','),
  };
}

function compressPageRuns(pages: readonly number[]): string[] {
  if (pages.length === 0) return [];
  const chunks: string[] = [];
  let runStart = pages[0] ?? 1;
  let runPrev = runStart;
  for (let i = 1; i <= pages.length; i += 1) {
    const current = pages[i];
    if (current === runPrev + 1) {
      runPrev = current;
      continue;
    }
    chunks.push(runStart === runPrev ? String(runStart) : `${runStart}-${runPrev}`);
    if (current !== undefined) {
      runStart = current;
      runPrev = current;
    }
  }
  return chunks;
}

/** Compress consecutive pages for filenames: 1,2,3,7 → 1-3_7 */
export function formatPagesForFileName(pages: readonly number[], maxLength = 40): string {
  if (pages.length === 0) return 'pages';
  const compact = compressPageRuns(pages).join('_');
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${pages.length}sel`;
}

/** Compress consecutive pages for the Split range field: 5,1,2,3 → 5,1-3 */
export function formatPagesForRangeInput(pages: readonly number[]): string {
  return compressPageRuns(pages).join(',');
}

/** Click-to-toggle: append newly selected pages (preserve order); remove if already selected. */
export function togglePageSelection(pages: readonly number[], page: number): number[] {
  if (!Number.isInteger(page) || page < 1) {
    return [...pages];
  }
  const index = pages.indexOf(page);
  if (index >= 0) {
    return pages.filter((_, i) => i !== index);
  }
  return [...pages, page];
}

export function pageSlotNumbers(pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return [];
  }
  return Array.from({ length: pageCount }, (_, i) => i + 1);
}

/**
 * Highlight set for thumbnails. Empty input clears selection.
 * Invalid in-progress typing keeps the last valid set.
 */
export function resolveThumbnailSelection(
  raw: string,
  pageCount: number | undefined,
  lastValid: readonly number[],
): readonly number[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return [];
  }
  const parsed = parsePageRange(raw, pageCount);
  return parsed.ok ? parsed.pages : lastValid;
}
