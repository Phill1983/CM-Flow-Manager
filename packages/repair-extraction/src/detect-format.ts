import type { FormatDetection } from './types.js';

const AUDATEX_MARKERS = [
  { id: 'SYSTEM AUDATEX', re: /SYSTEM\s+AUDATEX/i },
  { id: 'KALKULACJA NAPRAWY', re: /KALKULACJA\s+NAPRAWY/i },
  { id: 'AZT Lack', re: /AZT\s+Lack/i },
] as const;

const INVOICE_MARKERS = [
  { id: 'Faktura VAT', re: /Faktura\s+VAT/i },
  { id: 'KSeF', re: /\bKSeF\b/i },
  { id: 'FV/BL', re: /\bFV\/BL\//i },
  { id: 'Numer KSeF', re: /Numer\s+KSeF/i },
] as const;

/** Alphanumeric budget below which a non-matching extract is treated as image-only. */
const OCR_ALNUM_THRESHOLD = 80;

function collectEvidence(
  text: string,
  markers: readonly { id: string; re: RegExp }[],
): string[] {
  const evidence: string[] = [];
  for (const marker of markers) {
    if (marker.re.test(text)) evidence.push(marker.id);
  }
  return evidence;
}

function alnumCount(text: string): number {
  return (text.match(/[A-Za-z0-9]/g) ?? []).length;
}

/**
 * Conservative detector for the two Phase 4A.2 families plus image-only scans.
 * Does not guess unknown vendor layouts.
 */
export function detectDocumentFormat(text: string): FormatDetection {
  const audatexEvidence = collectEvidence(text, AUDATEX_MARKERS);
  const invoiceEvidence = collectEvidence(text, INVOICE_MARKERS);
  const letters = alnumCount(text);

  const audatexStrong =
    audatexEvidence.includes('SYSTEM AUDATEX') ||
    (audatexEvidence.includes('KALKULACJA NAPRAWY') && audatexEvidence.length >= 2);
  const invoiceStrong =
    invoiceEvidence.includes('Faktura VAT') && invoiceEvidence.length >= 2;

  if (audatexStrong && invoiceStrong) {
    return {
      status: 'ambiguous',
      confidence: 'low',
      evidence: [...audatexEvidence, ...invoiceEvidence],
    };
  }

  if (audatexStrong) {
    return {
      status: 'detected',
      sourceFormat: 'audatex',
      confidence: audatexEvidence.includes('SYSTEM AUDATEX') ? 'high' : 'low',
      evidence: audatexEvidence,
    };
  }

  if (invoiceStrong) {
    return {
      status: 'detected',
      sourceFormat: 'shop_faktura_vat',
      confidence: 'high',
      evidence: invoiceEvidence,
    };
  }

  if (letters < OCR_ALNUM_THRESHOLD && audatexEvidence.length === 0 && invoiceEvidence.length === 0) {
    return {
      status: 'ocr_required',
      confidence: 'high',
      evidence: letters === 0 ? ['empty_text_layer'] : ['sparse_text_layer'],
    };
  }

  return {
    status: 'unknown',
    sourceFormat: 'unknown',
    confidence: 'low',
    evidence: [...audatexEvidence, ...invoiceEvidence],
  };
}
