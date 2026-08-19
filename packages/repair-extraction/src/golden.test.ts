import { describe, expect, it } from 'vitest';
import { moneyToMajorString } from '@cm-flow-manager/repair-domain';
import {
  extractRepairDocument,
  extractionInputFromPages,
  parseDecimalString,
  parseSourceMoney,
} from './index.js';
import { loadFixture } from './load-fixture.js';

describe('money parsing', () => {
  it('accepts observed source formats without Number()', () => {
    expect(moneyToMajorString(parseSourceMoney('PLN', '1234.56')!)).toBe('1234.56');
    expect(moneyToMajorString(parseSourceMoney('PLN', '1 234,56')!)).toBe('1234.56');
    expect(moneyToMajorString(parseSourceMoney('PLN', '1 234.56')!)).toBe('1234.56');
    expect(moneyToMajorString(parseSourceMoney('PLN', '180,00 zł')!)).toBe('180.00');
    expect(moneyToMajorString(parseSourceMoney('PLN', '120.00*')!)).toBe('120.00');
  });

  it('does not turn parse failure or missing values into zero', () => {
    expect(parseSourceMoney('PLN', 'abc')).toBeUndefined();
    expect(parseSourceMoney('PLN', '')).toBeUndefined();
    expect(parseSourceMoney('PLN', '   ')).toBeUndefined();
    expect(parseDecimalString(undefined)).toBeUndefined();
    const zero = parseSourceMoney('PLN', '0.00');
    expect(zero?.minorUnits).toBe(0n);
  });
});

describe('golden AUDATEX 02', () => {
  const result = extractRepairDocument({
    documentId: 'CASE-4A2-02-estimate',
    text: loadFixture('audatex-02.txt'),
    pageCount: 6,
  });

  it('detects Audatex and extracts identifiers, parts, labour, 10 JC/RBG, normalia, totals', () => {
    expect(result.detection.status).toBe('detected');
    expect(result.detection.sourceFormat).toBe('audatex');
    expect(result.document).toBeDefined();
    const doc = result.document!;
    expect(doc.caseReference?.estimateNumber?.value).toBe('SAN-CLAIM-02');
    expect(doc.vehicle?.plate?.value).toBe('TESTPL02');
    expect(doc.vehicle?.vin?.value).toBe('REDACTEDVIN0000001');
    expect(doc.vehicle?.make?.value).toBe('Hyundai');
    expect(doc.vehicle?.model?.value).toBe('Tucson');
    expect(doc.labourUnitConversions).toHaveLength(1);
    expect(doc.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(10n);
    expect(doc.labourUnitConversions?.[0]?.source?.rawText).toMatch(/10\s*JC\s*=\s*1\s*RBG/i);
    expect(doc.parts?.some((p) => p.rawPartNumber?.value === '96001A2000')).toBe(true);
    expect(doc.parts?.some((p) => p.rawPartNumber?.value === '86130N7000')).toBe(true);
    expect(doc.labour?.some((l) => l.sourceUnit?.value === 'JC')).toBe(true);
    const body = doc.labour?.find((l) => l.category?.value === 'body');
    expect(body?.normalizedHours?.status).toBe('resolved');
    expect(body?.normalizedHours?.hours).toMatch(/^6\.6/);
    expect(doc.normalia?.[0]?.amountNet && moneyToMajorString(doc.normalia[0].amountNet.value)).toBe('11.78');
    expect(doc.normalia?.[0]?.percent?.value).toBe('2.0');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('4046.77');
    expect(doc.totals?.tax?.taxAmount && moneyToMajorString(doc.totals.tax.taxAmount.value)).toBe('930.76');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('4977.53');
  });
});

describe('golden AUDATEX 03', () => {
  const result = extractRepairDocument({
    documentId: 'CASE-4A2-03-estimate',
    text: loadFixture('audatex-03.txt'),
    pageCount: 8,
  });

  it('detects Audatex with duplicate parts, 12 JC/RBG, paint materials, totals', () => {
    expect(result.detection.sourceFormat).toBe('audatex');
    const doc = result.document!;
    expect(doc.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(12n);
    const seals = doc.parts?.filter((p) => p.rawPartNumber?.value === '000 727 1300') ?? [];
    expect(seals.length).toBe(2);
    expect(seals[0]?.lineId).not.toBe(seals[1]?.lineId);
    const door = doc.parts?.find((p) => p.rawPartNumber?.value === '254 720 1700');
    expect(door?.partNumberNormalization?.normalizedPartNumber).toBe('2547201700');
    expect(door?.rawPartNumber?.value).toBe('254 720 1700');
    const paintLab = doc.labour?.find((l) => l.category?.value === 'paint');
    expect(paintLab?.normalizedHours?.status).toBe('unresolved');
    expect(paintLab?.normalizedHours?.reason).toBe('conflicting_paint_jc_labels_on_source');
    expect(doc.paint?.paintMaterialsNet && moneyToMajorString(doc.paint.paintMaterialsNet.value)).toBe('2787.07');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('23134.94');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('28455.98');
    expect(result.warnings.some((w) => w.code === 'conflicting_jc_labels')).toBe(true);
  });
});

describe('golden INVOICE 02', () => {
  const result = extractRepairDocument({
    documentId: 'CASE-4A2-02-invoice',
    text: loadFixture('invoice-02.txt'),
    pageCount: 2,
  });

  it('extracts identifiers, parts, rbg labour, normalia, materials, totals', () => {
    const doc = result.document!;
    expect(doc.source.sourceFormat).toBe('shop_faktura_vat');
    expect(doc.caseReference?.invoiceNumber?.value).toBe('FV/BL/0002/26');
    expect(doc.caseReference?.ksefNumber?.value).toMatch(/^0000000000-/);
    const body = doc.labour?.find((l) => l.category?.value === 'body');
    expect(body?.sourceUnit?.value).toBe('rbg');
    expect(body?.quantity?.value).toBe('6.60');
    expect(body?.normalizedHours?.hours).toBe('6.60');
    expect(body?.lineNet && moneyToMajorString(body.lineNet.value)).toBe('1188.00');
    expect(doc.parts?.some((p) => p.rawPartNumber?.value === '96001A2000')).toBe(true);
    expect(doc.normalia?.[0]?.amountNet && moneyToMajorString(doc.normalia[0].amountNet.value)).toBe('8.01');
    expect(doc.materials?.[0]?.kind?.value).toBe('paint_materials');
    expect(doc.materials?.[0]?.lineNet && moneyToMajorString(doc.materials[0].lineNet.value)).toBe('1213.95');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('3854.65');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('4741.22');
  });
});

describe('golden INVOICE 03', () => {
  const result = extractRepairDocument({
    documentId: 'CASE-4A2-03-invoice',
    text: loadFixture('invoice-03.txt'),
    pageCount: 2,
  });

  it('keeps duplicate OEM lines, usl lump labour, materials, totals, and bleed uncertainty', () => {
    const doc = result.document!;
    const dup = doc.parts?.filter((p) => p.rawPartNumber?.value === 'A0007271300') ?? [];
    expect(dup.length).toBe(2);
    expect(dup[0]?.lineId).not.toBe(dup[1]?.lineId);
    const body = doc.labour?.find((l) => l.category?.value === 'body');
    expect(body?.sourceUnit?.value).toBe('usl');
    expect(body?.presentation).toBe('lump');
    expect(body?.normalizedHours?.status).toBe('unresolved');
    expect(doc.materials?.[0]?.lineNet && moneyToMajorString(doc.materials[0].lineNet.value)).toBe('2787.07');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('23417.52');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('28803.55');
    expect(result.warnings.some((w) => w.code === 'column_bleed_unresolved')).toBe(true);
    const normalia = doc.normalia?.[0];
    expect(normalia?.amountNet).toBeUndefined();
    expect(normalia?.certainty).toBe('unknown');
  });
});

describe('golden OCR CASE', () => {
  const result = extractRepairDocument({
    documentId: 'CASE-4A2-01-estimate',
    text: loadFixture('ocr-scan.txt'),
    pageCount: 5,
  });

  it('returns OCR_REQUIRED and does not invent a canonical document', () => {
    expect(result.status).toBe('OCR_REQUIRED');
    expect(result.document).toBeUndefined();
    expect(result.unavailable?.reason).toBe('ocr_required');
    expect(result.unavailable?.source.textLayerStatus).toBe('no');
    expect(result.detection.status).toBe('ocr_required');
  });
});

describe('page-aware input', () => {
  it('keeps SourceRef.page when pages are supplied', () => {
    const page1 = 'SYSTEM AUDATEX\nKALKULACJA NAPRAWY NR SAN-CLAIM-02\nNr rejestracyjny: TESTPL02';
    const page2 = loadFixture('audatex-02.txt');
    const result = extractRepairDocument(
      extractionInputFromPages('paged-02', [
        { pageNumber: 1, text: page1 },
        { pageNumber: 2, text: page2 },
      ]),
    );
    expect(result.document?.caseReference?.estimateNumber?.source?.page).toBe(1);
    expect(result.document?.labourUnitConversions?.[0]?.source?.page).toBe(2);
  });
});

describe('PDF.js layout AUDATEX 02', () => {
  const result = extractRepairDocument({
    documentId: 'pdfjs-audatex-02',
    text: loadFixture('audatex-pdfjs-02.txt'),
    pageCount: 6,
  });

  it('parses single-space tables, letter-spaced totals, and 10 JC=1 RBG', () => {
    const doc = result.document!;
    expect(result.detection.sourceFormat).toBe('audatex');
    expect(doc.vehicle?.vin?.value).toBe('REDACTEDVIN0000001');
    expect(doc.vehicle?.plate?.value).toBe('TESTPL02');
    expect(doc.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(10n);
    expect(doc.parts?.some((p) => p.rawPartNumber?.value === '96001A2000')).toBe(true);
    expect(doc.parts?.find((p) => p.rawPartNumber?.value === '8112637010')?.quantity?.value).toBe('14');
    expect(doc.labour?.length).toBeGreaterThanOrEqual(2);
    expect(doc.normalia?.[0]?.amountNet && moneyToMajorString(doc.normalia[0].amountNet.value)).toBe('11.78');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('4046.77');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('4977.53');
  });
});

describe('PDF.js layout AUDATEX 03', () => {
  const result = extractRepairDocument({
    documentId: 'pdfjs-audatex-03',
    text: loadFixture('audatex-pdfjs-03.txt'),
    pageCount: 8,
  });

  it('keeps duplicate catalog lines, 12 JC=1 RBG, and conflicting paint JC labels', () => {
    const doc = result.document!;
    expect(doc.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(12n);
    const seals = doc.parts?.filter((p) => p.rawPartNumber?.value === '0007271300') ?? [];
    expect(seals.length).toBe(2);
    expect(seals[0]?.lineId).not.toBe(seals[1]?.lineId);
    expect(result.warnings.some((w) => w.code === 'conflicting_jc_labels')).toBe(true);
    expect(doc.paint?.paintMaterialsNet && moneyToMajorString(doc.paint.paintMaterialsNet.value)).toBe('2787.07');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('23134.94');
  });
});

describe('PDF.js layout INVOICE 02', () => {
  const result = extractRepairDocument({
    documentId: 'pdfjs-invoice-02',
    text: loadFixture('invoice-pdfjs-02.txt'),
    pageCount: 2,
  });

  it('parses unit-before-qty columns and comma-separated part codes', () => {
    const doc = result.document!;
    expect(doc.source.sourceFormat).toBe('shop_faktura_vat');
    const body = doc.labour?.find((l) => l.category?.value === 'body');
    expect(body?.quantity?.value).toBe('6.60');
    expect(body?.lineNet && moneyToMajorString(body.lineNet.value)).toBe('1188.00');
    expect(doc.parts?.some((p) => p.rawPartNumber?.value === '96001A2000')).toBe(true);
    expect(doc.parts?.find((p) => p.rawPartNumber?.value === '8112637010')?.quantity?.value).toBe('14.00');
    expect(doc.totals?.totalNet && moneyToMajorString(doc.totals.totalNet.value)).toBe('3854.65');
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('4741.22');
  });
});

describe('PDF.js layout INVOICE 03', () => {
  const result = extractRepairDocument({
    documentId: 'pdfjs-invoice-03',
    text: loadFixture('invoice-pdfjs-03.txt'),
    pageCount: 2,
  });

  it('keeps usł lump hours unresolved, wrapped part lines, and duplicate OEM rows', () => {
    const doc = result.document!;
    const body = doc.labour?.find((l) => l.category?.value === 'body');
    expect(body?.sourceUnit?.value).toBe('usl');
    expect(body?.presentation).toBe('lump');
    expect(body?.normalizedHours?.status).toBe('unresolved');
    const dup = doc.parts?.filter((p) => p.rawPartNumber?.value === 'A0007271300') ?? [];
    expect(dup.length).toBe(2);
    expect(doc.additionalCosts?.[0]?.kind?.value).toBe('additional');
    expect(doc.additionalCosts?.[0]?.lineNet && moneyToMajorString(doc.additionalCosts[0].lineNet.value)).toBe('60.00');
    expect(result.warnings.some((w) => w.code === 'unclassified_line')).toBe(false);
    expect(doc.totals?.totalGross && moneyToMajorString(doc.totals.totalGross.value)).toBe('28803.55');
  });
});
