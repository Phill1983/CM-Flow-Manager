import { describe, expect, it } from 'vitest';
import { detectDocumentFormat } from './detect-format.js';
import { loadFixture } from './load-fixture.js';

describe('format detection', () => {
  it('detects Audatex from SYSTEM AUDATEX evidence', () => {
    const d = detectDocumentFormat(loadFixture('audatex-02.txt'));
    expect(d.status).toBe('detected');
    expect(d.sourceFormat).toBe('audatex');
    expect(d.evidence).toContain('SYSTEM AUDATEX');
  });

  it('detects shop Faktura VAT / KSeF family', () => {
    const d = detectDocumentFormat(loadFixture('invoice-03.txt'));
    expect(d.status).toBe('detected');
    expect(d.sourceFormat).toBe('shop_faktura_vat');
    expect(d.evidence).toContain('Faktura VAT');
  });

  it('does not guess when markers from both families are present', () => {
    const d = detectDocumentFormat('SYSTEM AUDATEX\nFaktura VAT\nKSeF\nFV/BL/1/26');
    expect(d.status).toBe('ambiguous');
    expect(d.sourceFormat).toBeUndefined();
  });

  it('marks sparse scans as ocr_required', () => {
    expect(detectDocumentFormat(loadFixture('ocr-scan.txt')).status).toBe('ocr_required');
  });

  it('leaves unknown digital text unknown', () => {
    expect(detectDocumentFormat(loadFixture('unknown-letter.txt')).status).toBe('unknown');
  });
});
