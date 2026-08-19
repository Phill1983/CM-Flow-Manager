import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildCase4a203Estimate,
  buildCase4a203Invoice,
  moneyFromMajorString,
  normalizePartNumberDeterministic,
  sourceValue,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates, evaluatePartRelationPair } from './index.js';

function partLine(
  lineId: string,
  raw: string,
  opts: {
    description?: string;
    qty?: string;
    unit?: string;
    lineNet?: string;
    unitPrice?: string;
  } = {},
): PartLine {
  const norm = normalizePartNumberDeterministic(raw);
  return {
    lineId,
    rawPartNumber: sourceValue(raw, { certainty: 'observed' }),
    partNumberNormalization: norm,
    ...(opts.description
      ? { description: sourceValue(opts.description, { certainty: 'observed' }) }
      : {}),
    ...(opts.qty ? { quantity: sourceValue(opts.qty, { certainty: 'observed' }) } : {}),
    ...(opts.unit ? { unit: sourceValue(opts.unit, { certainty: 'observed' }) } : {}),
    ...(opts.lineNet
      ? { lineNet: sourceValue(moneyFromMajorString('PLN', opts.lineNet), { certainty: 'observed' }) }
      : {}),
    ...(opts.unitPrice
      ? {
          unitNetPrice: sourceValue(moneyFromMajorString('PLN', opts.unitPrice), {
            certainty: 'observed',
          }),
        }
      : {}),
  };
}

function readPackageSrc(): string {
  const dir = new URL('.', import.meta.url);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => readFileSync(new URL(name, dir), 'utf8'))
    .join('\n');
}

describe('analyzePartRelationCandidates', () => {
  it('1. exact normalized numbers', () => {
    const est = partLine('e1', '2547201700');
    const inv = partLine('i1', '2547201700');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('exact');
    expect(candidate.reasonCodes).toContain('normalized_numbers_equal');
    expect(candidate.status).toBe('candidate');
  });

  it('2. whitespace/punctuation format variant', () => {
    const est = partLine('e1', '254 720 1700');
    const inv = partLine('i1', '254-720-1700');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('format_variant_candidate');
    expect(candidate.reasonCodes).toContain('formatting_only_difference');
  });

  it('3. leading-A prefix candidate (A123456 vs 123456)', () => {
    const est = partLine('e1', '123456');
    const inv = partLine('i1', 'A123456');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('prefix_variant_candidate');
    expect(candidate.reasonCodes).toContain('leading_a_prefix_removed');
    expect(candidate.reasonCodes).toContain('normalized_core_equal');
    expect(candidate.evidence.leadingPrefixRemoved).toBe('A');
  });

  it('4. prefix candidate remains unconfirmed (status candidate, not confirmed)', () => {
    const est = partLine('e1', '0007271300');
    const inv = partLine('i1', 'A0007271300');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('prefix_variant_candidate');
    expect(candidate.status).toBe('candidate');
    expect(candidate.relation).not.toBe('exact');
  });

  it('5. non-A prefix does not auto-match (B123456 vs 123456)', () => {
    const est = partLine('e1', '123456');
    const inv = partLine('i1', 'B123456');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
    expect(candidate.reasonCodes).toContain('different_core');
  });

  it('6. different core remains unresolved (A123456 vs A123457)', () => {
    const est = partLine('e1', 'A123456');
    const inv = partLine('i1', 'A123457');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
  });

  it('7. same description alone does not match unrelated numbers', () => {
    const est = partLine('e1', '1111111111', { description: 'SENSOR ABS' });
    const inv = partLine('i1', '2222222222', { description: 'SENSOR ABS' });
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
  });

  it('8. same price alone does not match unrelated numbers', () => {
    const est = partLine('e1', '1111111111', { lineNet: '99.00', unitPrice: '99.00' });
    const inv = partLine('i1', '2222222222', { lineNet: '99.00', unitPrice: '99.00' });
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
    expect(candidate.reasonCodes).not.toContain('line_net_similar');
  });

  it('9. quantity supports candidate but does not prove it', () => {
    const est = partLine('e1', '0007271300', { qty: '1' });
    const inv = partLine('i1', 'A0007271300', { qty: '1' });
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('prefix_variant_candidate');
    expect(candidate.reasonCodes).toContain('quantity_equal');
    expect(candidate.status).toBe('candidate');
  });

  it('10. duplicate line IDs preserved in pairwise candidates', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
    const sealCandidates = analysis.candidates.filter(
      (c) => c.relation === 'prefix_variant_candidate',
    );
    const leftIds = new Set(sealCandidates.map((c) => c.leftLineId));
    const rightIds = new Set(sealCandidates.map((c) => c.rightLineId));
    expect(leftIds).toEqual(new Set(['part-seal-f', 'part-seal-r']));
    expect(rightIds).toEqual(new Set(['inv-seal-1', 'inv-seal-2']));
    expect(sealCandidates).toHaveLength(4);
  });

  it('11. many-to-many ambiguity flagged on CASE-4A2-03 seals', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
    expect(analysis.counts.ambiguousCandidates).toBe(4);
    expect(
      analysis.candidates.every(
        (c) =>
          c.relation !== 'prefix_variant_candidate' ||
          c.reasonCodes.includes('many_to_many_ambiguity'),
      ),
    ).toBe(true);
  });

  it('12. provenance preserved on candidates', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
    const sample = analysis.candidates.find((c) => c.leftLineId === 'part-seal-f');
    expect(sample?.leftRawNumber).toBe('000 727 1300');
    expect(sample?.rightRawNumber).toBe('A0007271300');
    expect(sample?.leftNormalizedNumber).toBe('0007271300');
    expect(sample?.rightNormalizedNumber).toBe('A0007271300');
  });

  it('13. no supersession inference (A123 vs A456 unresolved)', () => {
    const est = partLine('e1', 'A123000');
    const inv = partLine('i1', 'A456000');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
  });

  it('14. no aftermarket inference (OEM vs supplier number unresolved)', () => {
    const est = partLine('e1', '0007271300');
    const inv = partLine('i1', 'SUP-7271300');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
  });

  it('15. no AI/network dependency in package source', () => {
    const src = readPackageSrc();
    expect(src).not.toMatch(/openai|anthropic|fetch\s*\(|embeddings|llm|web.?search/i);
    expect(src).not.toContain('supersession');
  });

  it('16. CASE-4A2-03 sanitized A-prefix pattern', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    expect(validation.partMatches.matched).toHaveLength(0);
    expect(validation.partMatches.estimateOnly).toHaveLength(3);
    expect(validation.partMatches.invoiceOnly).toHaveLength(2);

    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
    expect(analysis.baseline.estimateOnlyLineCount).toBe(3);
    expect(analysis.baseline.invoiceOnlyLineCount).toBe(2);
    expect(analysis.counts.prefixVariantCandidates).toBe(4);
    expect(analysis.counts.unresolvedPairs).toBe(2);

    const example = analysis.candidates.find(
      (c) => c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1',
    );
    expect(example?.relation).toBe('prefix_variant_candidate');
    expect(example?.confidence).toBe('high');
    expect(example?.reasonCodes).toEqual(
      expect.arrayContaining(['leading_a_prefix_removed', 'normalized_core_equal', 'quantity_equal']),
    );
    expect(example?.explanation).toContain("leading 'A' prefix");
  });

  it('12345 vs 123456 remains unresolved', () => {
    const est = partLine('e1', '12345');
    const inv = partLine('i1', '123456');
    const candidate = evaluatePartRelationPair({ estimateLine: est, invoiceLine: inv });
    expect(candidate.relation).toBe('unresolved');
  });
});

describe('architectural invariants', () => {
  it('does not modify repair-domain normalizer contract', () => {
    expect(normalizePartNumberDeterministic('000 727 1300').normalizedPartNumber).toBe('0007271300');
    expect(normalizePartNumberDeterministic('A0007271300').normalizedPartNumber).toBe('A0007271300');
  });

  it('4D baseline still leaves A-prefix pairs unmatched', () => {
    const validation = validateInvoiceAgainstEstimate(buildCase4a203Estimate(), buildCase4a203Invoice());
    expect(validation.partMatches.matched).toHaveLength(0);
  });
});
