import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractRepairDocument, parseSourceMoney } from './index.js';
import { normalizePartNumberDeterministic } from '@cm-flow-manager/repair-domain';
import { loadFixture } from './load-fixture.js';

const srcDir = dirname(fileURLToPath(import.meta.url));

function readSrc(name: string): string {
  return readFileSync(join(srcDir, name), 'utf8');
}

describe('invariants', () => {
  it('lets 10 JC and 12 JC documents coexist with no global conversion constant', () => {
    const src = `${readSrc('parse-audatex.ts')}\n${readSrc('extract.ts')}\n${readSrc('parse-invoice.ts')}`;
    expect(src).not.toMatch(/JC_PER_RBG|DEFAULT_JC|GLOBAL_JC/);
    expect(src).not.toMatch(/numerator:\s*10n/);
    expect(src).not.toMatch(/numerator:\s*12n/);

    const ten = extractRepairDocument({
      documentId: 'inv-10',
      text: loadFixture('audatex-02.txt'),
    });
    const twelve = extractRepairDocument({
      documentId: 'inv-12',
      text: loadFixture('audatex-03.txt'),
    });
    expect(ten.document?.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(10n);
    expect(twelve.document?.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(12n);
  });

  it('treats missing money as absent, not zero', () => {
    const doc = extractRepairDocument({
      documentId: 'unpriced',
      text: loadFixture('audatex-02.txt'),
    }).document!;
    const unpriced = doc.parts?.find((p) => p.rawPartNumber?.value === 'UNPRICED1');
    expect(unpriced).toBeDefined();
    expect(unpriced?.lineNet).toBeUndefined();
    expect(parseSourceMoney('PLN', 'not-money')).toBeUndefined();
  });

  it('keeps duplicate OEM lines and raw part numbers after lexical normalization', () => {
    const doc = extractRepairDocument({
      documentId: 'dups',
      text: loadFixture('audatex-03.txt'),
    }).document!;
    const seals = doc.parts?.filter((p) => p.rawPartNumber?.value === '000 727 1300') ?? [];
    expect(seals).toHaveLength(2);
    expect(seals[0]?.partNumberNormalization?.normalizedPartNumber).toBe('0007271300');
    expect(seals[0]?.rawPartNumber?.value).toBe('000 727 1300');
    const lexical = normalizePartNumberDeterministic('A 000 727 13 00');
    expect(lexical.normalizedPartNumber).toBe('A0007271300');
    expect(lexical.rawPartNumber).toBe('A 000 727 13 00');
  });

  it('preserves parser provenance on extracted values', () => {
    const doc = extractRepairDocument({
      documentId: 'prov-02',
      text: loadFixture('invoice-02.txt'),
    }).document!;
    expect(doc.rootSource?.extractionOrigin).toBe('parser');
    expect(doc.rootSource?.documentId).toBe('prov-02');
    const part = doc.parts?.[0];
    expect(part?.source?.extractionOrigin).toBe('parser');
    expect(part?.rawPartNumber?.source?.rawText).toBeTruthy();
  });

  it('leaves unknown formats unknown and does not parse them as empty valid documents', () => {
    const result = extractRepairDocument({
      documentId: 'letter',
      text: loadFixture('unknown-letter.txt'),
    });
    expect(result.status).toBe('UNKNOWN_FORMAT');
    expect(result.detection.status).toBe('unknown');
    expect(result.document).toBeUndefined();
  });

  it('does not compare estimate against invoice or compute price variance', () => {
    const src = `${readSrc('extract.ts')}\n${readSrc('parse-audatex.ts')}\n${readSrc('parse-invoice.ts')}\n${readSrc('index.ts')}`;
    expect(src).not.toContain('function reconcile');
    expect(src).not.toContain('totalGross -');
    expect(src).not.toContain('invoiceMinusEstimate');
    const estimate = extractRepairDocument({
      documentId: 'e',
      text: loadFixture('audatex-02.txt'),
    });
    const invoice = extractRepairDocument({
      documentId: 'i',
      text: loadFixture('invoice-02.txt'),
    });
    expect(estimate.document?.source.documentType).toBe('estimate');
    expect(invoice.document?.source.documentType).toBe('invoice');
  });

  it('does not perform parts equivalence or call AI / network', () => {
    const src = `${readSrc('extract.ts')}\n${readSrc('parse-audatex.ts')}\n${readSrc('parse-invoice.ts')}\n${readSrc('detect-format.ts')}`;
    expect(src).not.toContain('openai');
    expect(src).not.toContain('anthropic');
    expect(src).not.toContain('chatgpt');
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/https:\/\//);
    expect(src).not.toContain('supersession');
  });

  it('does not treat OCR-required input as an empty valid document', () => {
    const result = extractRepairDocument({
      documentId: 'ocr',
      text: loadFixture('ocr-scan.txt'),
      pageCount: 5,
    });
    expect(result.status).toBe('OCR_REQUIRED');
    expect(result.document).toBeUndefined();
    expect(result.unavailable?.status).toBe('extraction_unavailable');
  });

  it('records extraction timing without pathological delay on sanitized samples', () => {
    const result = extractRepairDocument({
      documentId: 'timing',
      text: loadFixture('invoice-03.txt'),
    });
    expect(result.timingMs).toBeLessThan(2000);
  });
});
