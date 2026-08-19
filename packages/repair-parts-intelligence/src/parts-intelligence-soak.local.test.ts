import { describe, expect, it } from 'vitest';
import { buildCase4a203Estimate, buildCase4a203Invoice } from '@cm-flow-manager/repair-domain';
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates } from './index.js';

describe('parts intelligence soak (sanitized CASE-4A2-03)', () => {
  it('reports sanitized unmatched counts and prefix-variant candidates', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);

    expect(analysis.baseline.estimateOnlyLineCount).toBe(3);
    expect(analysis.baseline.invoiceOnlyLineCount).toBe(2);
    expect(analysis.counts.prefixVariantCandidates).toBe(4);
    expect(analysis.counts.ambiguousCandidates).toBe(4);
    expect(analysis.counts.unresolvedPairs).toBeGreaterThan(0);

    const prefixSample = analysis.candidates.find(
      (c) => c.relation === 'prefix_variant_candidate' && c.leftLineId === 'part-seal-f',
    );
    expect(prefixSample).toMatchObject({
      leftNormalizedNumber: '0007271300',
      rightNormalizedNumber: 'A0007271300',
      relation: 'prefix_variant_candidate',
      status: 'ambiguous',
    });
  });
});
