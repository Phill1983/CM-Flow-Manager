import type { CanonicalRepairDocument } from '@cm-flow-manager/repair-domain';
import type { InvoiceValidationResult } from '@cm-flow-manager/repair-reconciliation';
import { evaluatePartRelationPair } from './evaluate-pair.js';
import { findPartLine } from './part-line-util.js';
import type {
  PartRelationAnalysisResult,
  PartRelationCandidate,
  PartRelationKind,
} from './types.js';

type StructuralGroupKey = `${PartRelationKind}:${string}:${string}`;

function structuralGroupKey(candidate: PartRelationCandidate): StructuralGroupKey | null {
  if (candidate.relation === 'unresolved') {
    return null;
  }
  const core =
    candidate.evidence.normalizedCore ??
    (candidate.relation === 'exact' || candidate.relation === 'format_variant_candidate'
      ? candidate.leftNormalizedNumber
      : candidate.leftNormalizedNumber);
  return `${candidate.relation}:${core}:${candidate.rightNormalizedNumber}`;
}

function applyManyToManyAmbiguity(candidates: PartRelationCandidate[]): PartRelationCandidate[] {
  const groups = new Map<StructuralGroupKey, PartRelationCandidate[]>();

  for (const candidate of candidates) {
    const key = structuralGroupKey(candidate);
    if (!key) {
      continue;
    }
    const bucket = groups.get(key) ?? [];
    bucket.push(candidate);
    groups.set(key, bucket);
  }

  const ambiguousLinePairs = new Set<string>();

  for (const group of groups.values()) {
    const estimateIds = new Set(group.map((c) => c.leftLineId));
    const invoiceIds = new Set(group.map((c) => c.rightLineId));
    if (estimateIds.size > 1 && invoiceIds.size > 1) {
      for (const candidate of group) {
        ambiguousLinePairs.add(`${candidate.leftLineId}:${candidate.rightLineId}`);
      }
    }
  }

  return candidates.map((candidate) => {
    const pairKey = `${candidate.leftLineId}:${candidate.rightLineId}`;
    if (!ambiguousLinePairs.has(pairKey) || candidate.relation === 'unresolved') {
      return candidate;
    }
    return {
      ...candidate,
      status: 'ambiguous' as const,
      reasonCodes: [...candidate.reasonCodes, 'many_to_many_ambiguity'],
    };
  });
}

function countByRelation(
  candidates: readonly PartRelationCandidate[],
  relation: PartRelationKind,
  statusFilter?: PartRelationCandidate['status'],
): number {
  return candidates.filter(
    (c) => c.relation === relation && (statusFilter ? c.status === statusFilter : true),
  ).length;
}

/**
 * Analyze unmatched/ambiguous part lines from Phase 4D reconciliation.
 * Produces advisory candidates only — never mutates reconciliation matches.
 */
export function analyzePartRelationCandidates(
  validation: Pick<InvoiceValidationResult, 'partMatches'>,
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
): PartRelationAnalysisResult {
  const { estimateOnly, invoiceOnly } = validation.partMatches;

  const rawCandidates: PartRelationCandidate[] = [];

  for (const est of estimateOnly) {
    const estimateLine = findPartLine(estimate, est.estimateLineId);
    if (!estimateLine) {
      continue;
    }
    for (const inv of invoiceOnly) {
      const invoiceLine = findPartLine(invoice, inv.invoiceLineId);
      if (!invoiceLine) {
        continue;
      }
      rawCandidates.push(
        evaluatePartRelationPair({
          estimateLine,
          invoiceLine,
        }),
      );
    }
  }

  const candidates = applyManyToManyAmbiguity(rawCandidates);

  return {
    candidates,
    baseline: {
      estimateOnlyLineCount: estimateOnly.length,
      invoiceOnlyLineCount: invoiceOnly.length,
    },
    counts: {
      exactCandidates: countByRelation(candidates, 'exact'),
      formatVariantCandidates: countByRelation(candidates, 'format_variant_candidate'),
      prefixVariantCandidates: countByRelation(candidates, 'prefix_variant_candidate'),
      ambiguousCandidates: candidates.filter((c) => c.status === 'ambiguous').length,
      unresolvedPairs: candidates.filter((c) => c.relation === 'unresolved').length,
    },
  };
}
