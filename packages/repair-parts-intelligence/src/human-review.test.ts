import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildCase4a203Estimate,
  buildCase4a203Invoice,
} from '@cm-flow-manager/repair-domain';
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates } from './analyze-candidates.js';
import { buildCandidateId } from './candidate-id.js';
import {
  confirmPartRelation,
  rejectPartRelation,
  toHumanConfirmedPartOverride,
} from './human-review.js';
import { HumanReviewError } from './human-review-types.js';
import type { PartRelationCandidate } from './types.js';

const REVIEWER = { displayName: 'Reviewer A', emailOrId: 'reviewer-a@local' };

const TS = '2026-08-19T12:00:00.000Z';

function prefixCandidate(
  leftLineId: string,
  rightLineId: string,
  leftRaw = '0007271300',
  rightRaw = 'A0007271300',
  status: PartRelationCandidate['status'] = 'candidate',
): PartRelationCandidate {
  return {
    leftLineId,
    rightLineId,
    leftRawNumber: leftRaw,
    rightRawNumber: rightRaw,
    leftNormalizedNumber: '0007271300',
    rightNormalizedNumber: 'A0007271300',
    relation: 'prefix_variant_candidate',
    confidence: 'high',
    reasonCodes: ['leading_a_prefix_removed', 'normalized_core_equal'],
    evidence: { leadingPrefixRemoved: 'A', normalizedCore: '0007271300' },
    status,
  };
}

function readPackageSrc(): string {
  const dir = new URL('.', import.meta.url);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => readFileSync(new URL(name, dir), 'utf8'))
    .join('\n');
}

describe('human part relation review', () => {
  it('1. confirm valid candidate', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const confirmed = confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS, note: 'ok' });
    expect(confirmed.knowledgeStatus).toBe('approved');
    expect(confirmed.estimateLineId).toBe('part-seal-f');
    expect(confirmed.invoiceLineId).toBe('inv-seal-1');
    expect(confirmed.confirmedBy).toEqual(REVIEWER);
    expect(confirmed.confirmedAt).toBe(TS);
  });

  it('2. reject valid candidate', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const rejected = rejectPartRelation(candidate, REVIEWER, {
      rejectedAt: TS,
      reason: 'different physical part',
    });
    expect(rejected.sourceCandidateId).toBe(buildCandidateId(candidate));
    expect(rejected.candidateSnapshot.leftLineId).toBe('part-seal-f');
    expect(rejected.rejectedBy).toEqual(REVIEWER);
  });

  it('3. reviewer required', () => {
    const candidate = prefixCandidate('e1', 'i1');
    expect(() => confirmPartRelation(candidate, { displayName: '', emailOrId: 'x' })).toThrow(
      HumanReviewError,
    );
  });

  it('4. source candidate preserved', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const confirmed = confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS });
    expect(confirmed.sourceCandidateId).toBe(buildCandidateId(candidate));
  });

  it('5. evidence preserved', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const confirmed = confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS });
    expect(confirmed.evidenceSnapshot.leadingPrefixRemoved).toBe('A');
    expect(confirmed.reasonCodesSnapshot).toContain('leading_a_prefix_removed');
  });

  it('6. timestamp/reviewer stored', () => {
    const confirmed = confirmPartRelation(prefixCandidate('e1', 'i1'), REVIEWER, {
      confirmedAt: TS,
    });
    expect(confirmed.confirmedAt).toBe(TS);
    expect(confirmed.confirmedBy.emailOrId).toBe('reviewer-a@local');
  });

  it('7. high confidence does NOT auto-confirm', () => {
    const candidate = prefixCandidate('e1', 'i1');
    expect(candidate.confidence).toBe('high');
    expect(candidate.status).toBe('candidate');
    expect(() => confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS })).not.toThrow();
    expect(candidate.relation).toBe('prefix_variant_candidate');
  });

  it('8. ambiguous group cannot bulk-confirm — only explicit pair confirmed', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const validation = validateInvoiceAgainstEstimate(estimate, invoice);
    const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
    const ambiguous = analysis.candidates.filter((c) => c.status === 'ambiguous');
    expect(ambiguous.length).toBe(4);

    const confirmedOne = confirmPartRelation(
      ambiguous.find((c) => c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1')!,
      REVIEWER,
      { confirmedAt: TS },
    );
    expect(confirmedOne.estimateLineId).toBe('part-seal-f');
    expect(confirmedOne.invoiceLineId).toBe('inv-seal-1');

    const otherPairs = ambiguous.filter(
      (c) => !(c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1'),
    );
    for (const other of otherPairs) {
      expect(other.status).toBe('ambiguous');
    }
  });

  it('9. explicit ambiguous pair can be confirmed', () => {
    const candidate = prefixCandidate('part-seal-r', 'inv-seal-2', undefined, undefined, 'ambiguous');
    const confirmed = confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS });
    expect(confirmed.estimateLineId).toBe('part-seal-r');
    expect(confirmed.invoiceLineId).toBe('inv-seal-2');
  });

  it('10. rejected candidate never becomes trusted', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    rejectPartRelation(candidate, REVIEWER, { rejectedAt: TS });
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const baseline = validateInvoiceAgainstEstimate(estimate, invoice);
    const withRejectedAsOverride = validateInvoiceAgainstEstimate(estimate, invoice, {
      confirmedPartRelations: [candidate as unknown as never],
    });
    expect(withRejectedAsOverride.partMatches.matched.length).toBe(baseline.partMatches.matched.length);
  });

  it('11. default 4D result unchanged without overrides', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const a = validateInvoiceAgainstEstimate(estimate, invoice);
    const b = validateInvoiceAgainstEstimate(estimate, invoice, {});
    expect(b.partMatches).toEqual(a.partMatches);
    expect(b.totals.netDelta?.minorUnits).toBe(a.totals.netDelta?.minorUnits);
    expect(b.residual?.minorUnits).toBe(a.residual?.minorUnits);
  });

  it('12. confirmed relation may influence 4D', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const analysis = analyzePartRelationCandidates(
      validateInvoiceAgainstEstimate(estimate, invoice),
      estimate,
      invoice,
    );
    const pair1 = analysis.candidates.find(
      (c) => c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1',
    )!;
    const pair2 = analysis.candidates.find(
      (c) => c.leftLineId === 'part-seal-r' && c.rightLineId === 'inv-seal-2',
    )!;
    const overrides = [
      toHumanConfirmedPartOverride(confirmPartRelation(pair1, REVIEWER, { confirmedAt: TS })),
      toHumanConfirmedPartOverride(confirmPartRelation(pair2, REVIEWER, { confirmedAt: TS })),
    ];
    const result = validateInvoiceAgainstEstimate(estimate, invoice, {
      confirmedPartRelations: overrides,
    });
    expect(result.partMatches.matched).toHaveLength(2);
    expect(result.partMatches.matched.every((m) => m.matchMethod === 'human_confirmed')).toBe(true);
    expect(result.partMatches.estimateOnly).toHaveLength(1);
    expect(result.partMatches.invoiceOnly).toHaveLength(0);
  });

  it('13. candidate alone cannot influence 4D', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const baseline = validateInvoiceAgainstEstimate(estimate, invoice);
    const withCandidate = validateInvoiceAgainstEstimate(estimate, invoice, {
      confirmedPartRelations: [candidate as unknown as never],
    });
    expect(withCandidate.partMatches.matched.length).toBe(baseline.partMatches.matched.length);
  });

  it('14. conflicting confirmed relations warned', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const override = {
      relationId: 'confirmed:1',
      estimateLineId: 'part-seal-f',
      invoiceLineId: 'inv-seal-1',
      leftNormalizedNumber: '0007271300',
      rightNormalizedNumber: 'A0007271300',
      sourceCandidateId: 'c1',
    };
    const result = validateInvoiceAgainstEstimate(estimate, invoice, {
      confirmedPartRelations: [override, { ...override, relationId: 'confirmed:2', sourceCandidateId: 'c2' }],
    });
    expect(result.warnings.some((w) => w.code === 'human_override_invalid')).toBe(true);
    expect(result.partMatches.matched.filter((m) => m.matchMethod === 'human_confirmed')).toHaveLength(1);
  });

  it('15. duplicates remain line-safe', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const analysis = analyzePartRelationCandidates(
      validateInvoiceAgainstEstimate(estimate, invoice),
      estimate,
      invoice,
    );
    const confirmed = [
      confirmPartRelation(
        analysis.candidates.find(
          (c) => c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1',
        )!,
        REVIEWER,
        { confirmedAt: TS },
      ),
      confirmPartRelation(
        analysis.candidates.find(
          (c) => c.leftLineId === 'part-seal-r' && c.rightLineId === 'inv-seal-2',
        )!,
        REVIEWER,
        { confirmedAt: TS },
      ),
    ];
    expect(new Set(confirmed.map((c) => c.estimateLineId)).size).toBe(2);
    expect(new Set(confirmed.map((c) => c.invoiceLineId)).size).toBe(2);
  });

  it('16. provenance preserved on confirmed record', () => {
    const candidate = prefixCandidate('part-seal-f', 'inv-seal-1');
    const confirmed = confirmPartRelation(candidate, REVIEWER, { confirmedAt: TS });
    expect(confirmed.leftRawNumber).toBe('0007271300');
    expect(confirmed.rightRawNumber).toBe('A0007271300');
    expect(confirmed.leftNormalizedNumber).toBe('0007271300');
  });

  it('17. no AI/network in human review layer', () => {
    const src = readPackageSrc();
    expect(src).not.toMatch(/openai|fetch\s*\(|embeddings|llm/i);
  });

  it('18. CASE-03 sanitized ambiguity flow', () => {
    const estimate = buildCase4a203Estimate();
    const invoice = buildCase4a203Invoice();
    const before = validateInvoiceAgainstEstimate(estimate, invoice);
    expect(before.partMatches.matched).toHaveLength(0);
    expect(before.partMatches.estimateOnly).toHaveLength(3);
    expect(before.partMatches.invoiceOnly).toHaveLength(2);
    expect(before.residual?.minorUnits).toBeDefined();

    const analysis = analyzePartRelationCandidates(before, estimate, invoice);
    const confirmed = [
      confirmPartRelation(
        analysis.candidates.find(
          (c) => c.leftLineId === 'part-seal-f' && c.rightLineId === 'inv-seal-1',
        )!,
        REVIEWER,
        { confirmedAt: TS },
      ),
      confirmPartRelation(
        analysis.candidates.find(
          (c) => c.leftLineId === 'part-seal-r' && c.rightLineId === 'inv-seal-2',
        )!,
        REVIEWER,
        { confirmedAt: TS },
      ),
    ];
    const after = validateInvoiceAgainstEstimate(estimate, invoice, {
      confirmedPartRelations: confirmed.map(toHumanConfirmedPartOverride),
    });

    expect(after.partMatches.matched).toHaveLength(2);
    expect(after.partMatches.estimateOnly).toHaveLength(1);
    expect(after.partMatches.invoiceOnly).toHaveLength(0);
    expect(after.residual?.minorUnits).toBe(before.residual?.minorUnits);
  });

  it('unresolved candidate cannot be confirmed', () => {
    const unresolved: PartRelationCandidate = {
      ...prefixCandidate('e1', 'i1'),
      relation: 'unresolved',
      status: 'unresolved',
    };
    expect(() => confirmPartRelation(unresolved, REVIEWER, { confirmedAt: TS })).toThrow(
      HumanReviewError,
    );
  });

  it('confirmed records are JSON-serializable', () => {
    const confirmed = confirmPartRelation(prefixCandidate('e1', 'i1'), REVIEWER, {
      confirmedAt: TS,
    });
    expect(() => JSON.stringify(confirmed)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(confirmed)) as typeof confirmed;
    expect(parsed.sourceCandidateId).toBe(confirmed.sourceCandidateId);
  });
});
