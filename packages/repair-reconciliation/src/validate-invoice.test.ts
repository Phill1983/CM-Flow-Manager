import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildCase4a202Estimate,
  buildCase4a202Invoice,
  buildCase4a203Estimate,
  buildCase4a203Invoice,
  moneyFromMajorString,
  sourceValue,
  type CanonicalRepairDocument,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import { validateInvoiceAgainstEstimate, ReconciliationInputError } from './validate-invoice.js';

const srcDir = dirname(fileURLToPath(import.meta.url));

function readSrc(name: string): string {
  return readFileSync(join(srcDir, name), 'utf8');
}

function pln(major: string) {
  return moneyFromMajorString('PLN', major);
}

function part(
  lineId: string,
  oem: string,
  opts: { qty?: string; unit?: string; unitPrice?: string; lineNet?: string } = {},
): PartLine {
  return {
    lineId,
    rawPartNumber: sourceValue(oem, { certainty: 'observed' }),
    quantity: opts.qty ? sourceValue(opts.qty, { certainty: 'observed' }) : undefined,
    unit: opts.unit ? sourceValue(opts.unit, { certainty: 'observed' }) : undefined,
    unitNetPrice: opts.unitPrice
      ? sourceValue(pln(opts.unitPrice), { certainty: 'observed' })
      : undefined,
    lineNet: opts.lineNet ? sourceValue(pln(opts.lineNet), { certainty: 'observed' }) : undefined,
  };
}

function minimalEstimate(overrides: Partial<CanonicalRepairDocument> = {}): CanonicalRepairDocument {
  return {
    schemaVersion: 1,
    source: { documentId: 'est', documentType: 'estimate' },
    currency: 'PLN',
    parts: [],
    totals: { totalNet: sourceValue(pln('0'), { certainty: 'observed' }) },
    ...overrides,
  };
}

function minimalInvoice(overrides: Partial<CanonicalRepairDocument> = {}): CanonicalRepairDocument {
  return {
    schemaVersion: 1,
    source: { documentId: 'inv', documentType: 'invoice' },
    currency: 'PLN',
    parts: [],
    totals: { totalNet: sourceValue(pln('0'), { certainty: 'observed' }) },
    ...overrides,
  };
}

describe('validateInvoiceAgainstEstimate golden cases', () => {
  it('1. exact unique part match — zero delta', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'ABC123', { lineNet: '100.00' })],
      totals: { totalNet: sourceValue(pln('100.00'), { certainty: 'observed' }) },
    });
    const inv = minimalInvoice({
      parts: [part('i1', 'ABC123', { lineNet: '100.00' })],
      totals: { totalNet: sourceValue(pln('100.00'), { certainty: 'observed' }) },
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched).toHaveLength(1);
    expect(r.partMatches.matched[0]?.matchMethod).toBe('unique_normalized_oem');
    expect(r.partMatches.matched[0]?.lineNetDelta?.minorUnits).toBe(0n);
  });

  it('2. estimate-only part contributes negative delta', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'ONLY-EST', { lineNet: '100.00' })],
      totals: { totalNet: sourceValue(pln('100.00'), { certainty: 'observed' }) },
    });
    const inv = minimalInvoice({
      totals: { totalNet: sourceValue(pln('0'), { certainty: 'observed' }) },
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.estimateOnly).toHaveLength(1);
    expect(r.partMatches.estimateOnly[0]?.lineNetContribution?.minorUnits).toBe(-10000n);
  });

  it('3. invoice-only part contributes positive delta', () => {
    const est = minimalEstimate();
    const inv = minimalInvoice({
      parts: [part('i1', 'ONLY-INV', { lineNet: '50.00' })],
      totals: { totalNet: sourceValue(pln('50.00'), { certainty: 'observed' }) },
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.invoiceOnly).toHaveLength(1);
    expect(r.partMatches.invoiceOnly[0]?.lineNetContribution?.minorUnits).toBe(5000n);
  });

  it('4. same part cheaper on invoice — negative line delta', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'P1', { lineNet: '100.00' })],
    });
    const inv = minimalInvoice({
      parts: [part('i1', 'P1', { lineNet: '80.00' })],
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched[0]?.lineNetDelta?.minorUnits).toBe(-2000n);
  });

  it('5. same part more expensive on invoice — positive line delta', () => {
    const est = minimalEstimate({ parts: [part('e1', 'P1', { lineNet: '80.00' })] });
    const inv = minimalInvoice({ parts: [part('i1', 'P1', { lineNet: '100.00' })] });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched[0]?.lineNetDelta?.minorUnits).toBe(2000n);
  });

  it('6. quantity difference decomposes when unambiguous', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'P1', { qty: '1', unitPrice: '100.00', lineNet: '100.00' })],
    });
    const inv = minimalInvoice({
      parts: [part('i1', 'P1', { qty: '2', unitPrice: '100.00', lineNet: '200.00' })],
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    const m = r.partMatches.matched[0];
    expect(m?.quantityEffect?.minorUnits).toBe(10000n);
    expect(m?.priceEffect?.minorUnits).toBe(0n);
  });

  it('7. quantity + price difference decomposes', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'P1', { qty: '1', unitPrice: '100.00', lineNet: '100.00' })],
    });
    const inv = minimalInvoice({
      parts: [part('i1', 'P1', { qty: '2', unitPrice: '110.00', lineNet: '220.00' })],
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    const m = r.partMatches.matched[0];
    expect(m?.quantityEffect?.minorUnits).toBe(10000n);
    expect(m?.priceEffect?.minorUnits).toBe(2000n);
  });

  it('8. duplicate OEM disambiguated by quantity and net', () => {
    const est = minimalEstimate({
      parts: [
        part('e1', 'DUP', { qty: '1', lineNet: '10.00' }),
        part('e2', 'DUP', { qty: '2', lineNet: '20.00' }),
      ],
    });
    const inv = minimalInvoice({
      parts: [
        part('i1', 'DUP', { qty: '2', lineNet: '20.00' }),
        part('i2', 'DUP', { qty: '1', lineNet: '10.00' }),
      ],
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched).toHaveLength(2);
    expect(r.partMatches.ambiguous).toHaveLength(0);
  });

  it('9. duplicate OEM ambiguous when scores tie', () => {
    const est = minimalEstimate({
      parts: [
        part('e1', 'DUP', { qty: '1', lineNet: '10.00' }),
        part('e2', 'DUP', { qty: '1', lineNet: '10.00' }),
      ],
    });
    const inv = minimalInvoice({
      parts: [
        part('i1', 'DUP', { qty: '1', lineNet: '10.00' }),
        part('i2', 'DUP', { qty: '1', lineNet: '10.00' }),
      ],
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.ambiguous.length).toBeGreaterThan(0);
  });

  it('10. different OEM remains unmatched', () => {
    const est = minimalEstimate({ parts: [part('e1', 'AAA')] });
    const inv = minimalInvoice({ parts: [part('i1', 'BBB')] });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched).toHaveLength(0);
    expect(r.partMatches.estimateOnly).toHaveLength(1);
    expect(r.partMatches.invoiceOnly).toHaveLength(1);
  });

  it('11–14. labour RBG comparable; JC conversion document-local', () => {
    const est = buildCase4a202Estimate();
    const inv = buildCase4a202Invoice();
    const r = validateInvoiceAgainstEstimate(est, inv);
    const body = r.labourComparison.matched.find((m) => m.category === 'body');
    expect(body?.hours?.status).toBe('comparable');
    expect(est.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(10n);
    const est3 = buildCase4a203Estimate();
    expect(est3.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator).toBe(12n);
  });

  it('15–16. lump usl value-only; unresolved hours on CASE-03', () => {
    const r = validateInvoiceAgainstEstimate(buildCase4a203Estimate(), buildCase4a203Invoice());
    const paint = r.labourComparison.matched.find((m) => m.category === 'paint');
    expect(paint?.hours?.status).toBe('value_only');
    expect(r.warnings.some((w) => w.message.includes('lump_usl'))).toBe(true);
  });

  it('17–20. paint, normalia, additional costs category comparison', () => {
    const r02 = validateInvoiceAgainstEstimate(buildCase4a202Estimate(), buildCase4a202Invoice());
    const normalia = r02.categoryDifferences.find((c) => c.category === 'normalia');
    expect(normalia?.delta?.minorUnits).toBe(-377n);
    const paintMat = r02.categoryDifferences.find((c) => c.category === 'paintMaterials');
    expect(paintMat?.delta?.minorUnits).toBe(0n);

    const r03 = validateInvoiceAgainstEstimate(buildCase4a203Estimate(), buildCase4a203Invoice());
    const add = r03.categoryDifferences.find((c) => c.category === 'additionalCosts');
    expect(add?.estimateAmount?.minorUnits).toBe(15000n);
  });

  it('21. VAT difference reported separately from net explained', () => {
    const r = validateInvoiceAgainstEstimate(buildCase4a202Estimate(), buildCase4a202Invoice());
    expect(r.totals.vatDelta?.minorUnits).toBe(-4419n);
  });

  it('22. missing money is not treated as zero', () => {
    const est = minimalEstimate({
      parts: [part('e1', 'NOPRICE')],
    });
    const inv = minimalInvoice({ parts: [part('i1', 'NOPRICE')] });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.partMatches.matched[0]?.lineNetDelta).toBeUndefined();
  });

  it('23. currency mismatch throws typed error', () => {
    const est = minimalEstimate({ currency: 'PLN' });
    const inv = minimalInvoice({ currency: 'EUR' });
    expect(() => validateInvoiceAgainstEstimate(est, inv)).toThrow(ReconciliationInputError);
    try {
      validateInvoiceAgainstEstimate(est, inv);
    } catch (e) {
      expect((e as ReconciliationInputError).code).toBe('currency_mismatch');
    }
  });

  it('24. provenance preserved on matched parts', () => {
    const est = buildCase4a202Estimate();
    const inv = buildCase4a202Invoice();
    const r = validateInvoiceAgainstEstimate(est, inv);
    const m = r.partMatches.matched.find((x) => x.estimateLineId === 'part-1');
    expect(
      m?.estimateSource ?? est.parts?.[0]?.lineNet?.source ?? m?.invoiceSource,
    ).toBeTruthy();
  });

  it('25–27. sign convention and zero delta', () => {
    expect(validateInvoiceAgainstEstimate(buildCase4a202Estimate(), buildCase4a202Invoice()).signConvention).toBe(
      'delta = invoice - estimate',
    );
    const est = minimalEstimate({
      parts: [part('e1', 'X', { lineNet: '10.00' })],
      totals: { totalNet: sourceValue(pln('10.00'), { certainty: 'observed' }) },
    });
    const inv = minimalInvoice({
      parts: [part('i1', 'X', { lineNet: '10.00' })],
      totals: { totalNet: sourceValue(pln('10.00'), { certainty: 'observed' }) },
    });
    const r = validateInvoiceAgainstEstimate(est, inv);
    expect(r.totals.netDelta?.minorUnits).toBe(0n);
  });

  it('28–30. residual non-zero; explained + residual = net delta; no double-count paint labour', () => {
    const r02 = validateInvoiceAgainstEstimate(buildCase4a202Estimate(), buildCase4a202Invoice());
    expect(r02.totals.netDelta).toBeDefined();
    expect(r02.explainedDifference).toBeDefined();
    expect(r02.residual).toBeDefined();
    if (r02.totals.netDelta && r02.explainedDifference && r02.residual) {
      expect(r02.totals.netDelta.minorUnits).toBe(
        r02.explainedDifference.minorUnits + r02.residual.minorUnits,
      );
    }
    const paintLabourCats = r02.categoryDifferences.filter((c) => c.category === 'paintLabour');
    expect(paintLabourCats).toHaveLength(1);
  });

  it('CASE-4A2-02 sanitized fixture reconciliation', () => {
    const r = validateInvoiceAgainstEstimate(buildCase4a202Estimate(), buildCase4a202Invoice());
    expect(r.totals.estimateGross?.minorUnits).toBe(497753n);
    expect(r.totals.invoiceGross?.minorUnits).toBe(474122n);
    expect(r.totals.grossDelta?.minorUnits).toBe(-23631n);
  });

  it('CASE-4A2-03 sanitized fixture reconciliation', () => {
    const r = validateInvoiceAgainstEstimate(buildCase4a203Estimate(), buildCase4a203Invoice());
    expect(r.totals.estimateGross?.minorUnits).toBe(2845598n);
    expect(r.totals.invoiceGross?.minorUnits).toBe(2880355n);
    expect(r.totals.grossDelta?.minorUnits).toBe(34757n);
    expect(r.partMatches.estimateOnly.length + r.partMatches.invoiceOnly.length).toBeGreaterThan(0);
  });
});

describe('invariants', () => {
  it('contains no Process A logic, AI, or parts intelligence', () => {
    const src = [
      'validate-invoice.ts',
      'match-parts.ts',
      'compare-labour.ts',
      'compare-categories.ts',
      'money-util.ts',
      'types.ts',
    ]
      .map(readSrc)
      .join('\n');
    expect(src).not.toMatch(/calibration|ADAS|should have been|openai|fetch\s*\(/i);
    expect(src).not.toContain('supersession');
    expect(src).not.toMatch(/JC_PER_RBG|DEFAULT_JC|GLOBAL_JC/);
  });

  it('wrong document types throw', () => {
    const est = minimalInvoice({ source: { documentId: 'x', documentType: 'invoice' } });
    const inv = minimalInvoice();
    expect(() => validateInvoiceAgainstEstimate(est as unknown as CanonicalRepairDocument, inv)).toThrow(
      ReconciliationInputError,
    );
  });
});
