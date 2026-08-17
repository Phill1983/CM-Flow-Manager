import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  absMoney,
  absoluteDifference,
  addMoney,
  assertSameCurrency,
  buildCase4a202Estimate,
  buildCase4a202Invoice,
  buildCase4a203Estimate,
  buildCase4a203Invoice,
  buildUnknownSparseDocument,
  case4a201EstimateUnavailable,
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  canonicalJsonReplacer,
  compareMoney,
  deserializeMoney,
  isExtractionUnavailable,
  moneyEquals,
  moneyFromMajorString,
  moneyToMajorString,
  multiplyMoneyByRatio,
  normalizePartNumberDeterministic,
  ratioFromPercentMajor,
  resolveLabourHours,
  serializeMoney,
  subtractMoney,
  validateRepairDocument,
  type CanonicalRepairDocument,
} from '../index.js';

describe('money precision', () => {
  it('stores PLN via integer minor units', () => {
    const m = moneyFromMajorString('PLN', '19802.70');
    expect(m.minorUnits).toBe(1_980_270n);
    expect(moneyToMajorString(m)).toBe('19802.70');
  });

  it('does not drift the way IEEE-754 0.1+0.2 does', () => {
    const sum = addMoney(moneyFromMajorString('PLN', '0.10'), moneyFromMajorString('PLN', '0.20'));
    expect(moneyToMajorString(sum)).toBe('0.30');
    expect(0.1 + 0.2).not.toBe(0.3);
  });

  it('supports compare, equality, and absolute difference', () => {
    const a = moneyFromMajorString('PLN', '0.01');
    const b = moneyFromMajorString('PLN', '0.03');
    expect(compareMoney(a, b)).toBe(-1);
    expect(moneyEquals(a, moneyFromMajorString('PLN', '0.01'))).toBe(true);
    expect(moneyToMajorString(absoluteDifference(a, b))).toBe('0.02');
    expect(absMoney(subtractMoney(a, b)).minorUnits).toBe(2n);
  });

  it('refuses mixed-currency arithmetic', () => {
    const pln = moneyFromMajorString('PLN', '1.00');
    const eur = moneyFromMajorString('EUR', '1.00');
    expect(() => assertSameCurrency(pln, eur)).toThrow(/Currency mismatch/);
    expect(() => addMoney(pln, eur)).toThrow(/Currency mismatch/);
    expect(moneyEquals(pln, eur)).toBe(false);
  });

  it('round-trips through JSON-safe serialization', () => {
    const original = moneyFromMajorString('PLN', '38.40');
    const json = JSON.stringify(serializeMoney(original));
    const restored = deserializeMoney(JSON.parse(json) as { currency: string; minorUnits: string });
    expect(moneyEquals(original, restored)).toBe(true);
    expect(JSON.stringify(original, canonicalJsonReplacer)).toContain('"minorUnits":"3840"');
  });

  it('multiplies by percent with half-up rounding', () => {
    const base = moneyFromMajorString('PLN', '589.04');
    const twoPercent = ratioFromPercentMajor('2.0');
    const result = multiplyMoneyByRatio(base, twoPercent);
    expect(moneyToMajorString(result)).toBe('11.78');
  });
});

describe('part numbers', () => {
  it('keeps raw and normalized forms (fixture F)', () => {
    const spaced = normalizePartNumberDeterministic('254 720 1700');
    expect(spaced.rawPartNumber).toBe('254 720 1700');
    expect(spaced.normalizedPartNumber).toBe('2547201700');
    const line = buildCase4a203Estimate().parts?.find((p) => p.lineId === 'part-door-f');
    expect(line?.rawPartNumber?.value).toBe('254 720 1700');
    expect(line?.partNumberNormalization?.normalizedPartNumber).toBe('2547201700');
  });

  it('does not treat A-prefix as the same part as unprefixed compact form', () => {
    const spaced = normalizePartNumberDeterministic('254 720 1700');
    const prefixed = normalizePartNumberDeterministic('A2547201700');
    expect(spaced.normalizedPartNumber).not.toBe(prefixed.normalizedPartNumber);
  });

  it('allows duplicate part numbers as separate lines', () => {
    const doc = buildCase4a203Invoice();
    const seals = (doc.parts ?? []).filter((p) => p.rawPartNumber?.value === 'A0007271300');
    expect(seals).toHaveLength(2);
    expect(seals[0]?.lineId).not.toBe(seals[1]?.lineId);
  });
});

describe('SourceRef preservation', () => {
  it('keeps source coordinates on values', () => {
    const inv = buildCase4a202Invoice();
    const labour = inv.labour?.[0];
    expect(labour?.lineNet?.source?.documentId).toBe('CASE-4A2-02-invoice');
    expect(labour?.lineNet?.source?.section).toBe('labour');
    expect(labour?.lineNet?.source?.rawText).toContain('rbg');
  });
});

describe('labour JC/RBG conversion', () => {
  it('resolves 10 JC = 1 RBG from document-local conversion', () => {
    const hours = resolveLabourHours({
      quantityMajor: '66',
      sourceUnit: 'JC',
      conversion: {
        sourceUnit: 'JC',
        targetUnit: 'RBG',
        sourceUnitsPerTargetUnit: { numerator: 10n, denominator: 1n },
        certainty: 'observed',
      },
    });
    expect(hours.status).toBe('resolved');
    expect(hours.hours).toBe('6.6');
  });

  it('resolves 12 JC = 1 RBG from document-local conversion', () => {
    const hours = resolveLabourHours({
      quantityMajor: '230',
      sourceUnit: 'JC',
      conversion: {
        sourceUnit: 'JC',
        targetUnit: 'RBG',
        sourceUnitsPerTargetUnit: { numerator: 12n, denominator: 1n },
        certainty: 'observed',
      },
    });
    expect(hours.status).toBe('resolved');
    expect(hours.hours).toBe('19.1666');
  });

  it('lets 10 JC and 12 JC documents coexist without global config', () => {
    const c02 = buildCase4a202Estimate().labourUnitConversions?.[0];
    const c03 = buildCase4a203Estimate().labourUnitConversions?.[0];
    expect(c02?.sourceUnitsPerTargetUnit.numerator).toBe(10n);
    expect(c03?.sourceUnitsPerTargetUnit.numerator).toBe(12n);
    expect(c02?.source?.rawText).toContain('10 JC');
    expect(c03?.source?.rawText).toContain('12 JC');
  });

  it('does not hardcode a universal JC/RBG factor in labour.ts', () => {
    const source = readFileSync(new URL('./labour.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/10n\s*,\s*denominator:\s*1n/);
    expect(source).not.toMatch(/JC_PER_RBG/);
    expect(source).not.toMatch(/DEFAULT_.*JC/);
  });

  it('leaves hours unresolved when conversion is missing', () => {
    const hours = resolveLabourHours({
      quantityMajor: '66',
      sourceUnit: 'JC',
    });
    expect(hours.status).toBe('unresolved');
    expect(hours.hours).toBeUndefined();
  });

  it('does not treat usl lump labour as hours', () => {
    const lump = buildCase4a203Invoice().labour?.[0];
    expect(lump?.sourceUnit?.value).toBe('usl');
    expect(lump?.presentation).toBe('lump');
    expect(lump?.normalizedHours?.status).toBe('unresolved');
  });

  it('preserves invoice rbg labour as rbg (fixture C)', () => {
    const rbg = buildCase4a202Invoice().labour?.[0];
    expect(rbg?.sourceUnit?.value).toBe('rbg');
    expect(rbg?.quantity?.value).toBe('6.60');
    expect(rbg?.presentation).toBe('detail');
  });
});

describe('normalia and VAT are not universal policy', () => {
  it('supports explicit percentage with inferred certainty notes', () => {
    const n = buildCase4a202Estimate().normalia?.[0];
    expect(n?.percent?.value).toBe('2.0');
    expect(n?.calculationMethod).toBe('explicit_percent_of_base');
    expect(n?.certainty).toBe('inferred');
  });

  it('supports unknown formula without inventing 2%', () => {
    const n = buildCase4a203Invoice().normalia?.[0];
    expect(n?.calculationMethod).toBe('unknown');
    expect(n?.percent).toBeUndefined();
    expect(n?.certainty).toBe('unknown');
  });

  it('stores tax rate from document, not a package constant', () => {
    const est = buildCase4a202Estimate();
    expect(est.totals?.tax?.taxRate?.value).toBe('23');
    const alt: CanonicalRepairDocument = {
      ...est,
      totals: {
        ...est.totals,
        tax: {
          taxRate: { value: '8', certainty: 'observed' },
          taxAmount: { value: moneyFromMajorString('PLN', '1.00') },
        },
      },
    };
    expect(validateRepairDocument(alt).ok).toBe(true);
    expect(alt.totals?.tax?.taxRate?.value).toBe('8');
  });
});

describe('document type vs source format', () => {
  it('keeps estimate type independent of Audatex format', () => {
    const est = buildCase4a202Estimate();
    expect(est.source.documentType).toBe('estimate');
    expect(est.source.sourceFormat).toBe('audatex');
    const inv = buildCase4a202Invoice();
    expect(inv.source.documentType).toBe('invoice');
    expect(inv.source.sourceFormat).toBe('shop_faktura_vat');
  });
});

describe('unknown / missing values', () => {
  it('does not turn a missing amount into zero (fixture E)', () => {
    const sparse = buildUnknownSparseDocument();
    expect(sparse.parts?.[0]?.lineNet).toBeUndefined();
    expect(sparse.labour?.[0]?.lineNet).toBeUndefined();
    expect(sparse.totals).toBeUndefined();
    expect(validateRepairDocument(sparse).ok).toBe(true);
  });

  it('allows documents with minimal optional fields', () => {
    const minimal: CanonicalRepairDocument = {
      schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
      source: { documentId: 'min-1', documentType: 'invoice' },
      currency: 'PLN',
    };
    expect(validateRepairDocument(minimal).ok).toBe(true);
  });
});

describe('extensions', () => {
  it('preserves unknown/extension fields', () => {
    const est = buildCase4a202Estimate();
    expect(est.extensions?.unknownFields?.[0]?.key).toBe('audatex.eur_pln_rate');
  });
});

describe('validation & fixtures', () => {
  it('validates canonical documents', () => {
    for (const doc of [
      buildCase4a202Estimate(),
      buildCase4a202Invoice(),
      buildCase4a203Estimate(),
      buildCase4a203Invoice(),
      buildUnknownSparseDocument(),
    ]) {
      const result = validateRepairDocument(doc);
      expect(result.ok, JSON.stringify(result.issues)).toBe(true);
      expect(doc.schemaVersion).toBe(1);
    }
  });

  it('represents CASE-4A2-01 estimate as OCR-required unavailable', () => {
    expect(isExtractionUnavailable(case4a201EstimateUnavailable)).toBe(true);
    expect(case4a201EstimateUnavailable.reason).toBe('ocr_required');
    expect(validateRepairDocument(case4a201EstimateUnavailable).ok).toBe(true);
    expect('parts' in case4a201EstimateUnavailable).toBe(false);
  });

  it('rejects invalid conversion divisor', () => {
    const bad: CanonicalRepairDocument = {
      schemaVersion: 1,
      source: { documentId: 'x', documentType: 'estimate' },
      currency: 'PLN',
      labourUnitConversions: [
        {
          sourceUnit: 'JC',
          targetUnit: 'RBG',
          sourceUnitsPerTargetUnit: { numerator: 10n, denominator: 0n },
          certainty: 'observed',
        },
      ],
    };
    const result = validateRepairDocument(bad);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'conversion_denominator_zero')).toBe(true);
  });

  it('fixtures are sanitized (no obvious PII tokens)', () => {
    const blob = JSON.stringify(
      [
        buildCase4a202Estimate(),
        buildCase4a202Invoice(),
        buildCase4a203Estimate(),
        buildCase4a203Invoice(),
        case4a201EstimateUnavailable,
        buildUnknownSparseDocument(),
      ],
      canonicalJsonReplacer,
    );
    expect(blob).not.toMatch(/WE9GR10|WY788FL|TMAJD|W1NKM|Arval|Chwalib/i);
    expect(blob).toContain('[REDACTED]');
  });
});
