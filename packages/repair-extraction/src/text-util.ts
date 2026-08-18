import type { SourceRef } from '@cm-flow-manager/repair-domain';
import type { ExtractedPage } from './types.js';

export function pageForSnippet(
  pages: readonly ExtractedPage[] | undefined,
  snippet: string,
): number | undefined {
  if (!pages || snippet.length === 0) return undefined;
  for (const page of pages) {
    if (page.text.includes(snippet)) return page.pageNumber;
  }
  return undefined;
}

export function makeRef(
  documentId: string,
  section: string,
  rawText: string,
  pages?: readonly ExtractedPage[],
  extra?: { lineId?: string; page?: number },
): SourceRef {
  const page = extra?.page ?? pageForSnippet(pages, rawText);
  return {
    documentId,
    section,
    rawText,
    extractionOrigin: 'parser',
    ...(extra?.lineId ? { lineId: extra.lineId } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

export function firstMatch(text: string, re: RegExp): string | undefined {
  const m = re.exec(text);
  const value = m?.[1]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function allMatches(text: string, re: RegExp): string[] {
  const out: string[] = [];
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = global.exec(text)) !== null) {
    const value = m[1]?.trim();
    if (value) out.push(value);
  }
  return out;
}
