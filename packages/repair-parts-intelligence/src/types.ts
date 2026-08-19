import type { SourceRef } from '@cm-flow-manager/repair-domain';

/** Structural relation kinds — only deterministic subsets are implemented in 4E.1. */
export type PartRelationKind =
  | 'exact'
  | 'format_variant_candidate'
  | 'prefix_variant_candidate'
  | 'unresolved';

export type PartRelationConfidence = 'high' | 'medium' | 'low';

/** Runtime output only — no persistence lifecycle in 4E.1. */
export type PartRelationCandidateStatus = 'candidate' | 'ambiguous' | 'unresolved';

export type PartRelationReasonCode =
  | 'normalized_numbers_equal'
  | 'formatting_only_difference'
  | 'leading_a_prefix_removed'
  | 'normalized_core_equal'
  | 'description_exact_match'
  | 'description_token_overlap'
  | 'quantity_equal'
  | 'unit_compatible'
  | 'line_net_similar'
  | 'unit_price_similar'
  | 'many_to_many_ambiguity'
  | 'no_structural_relation'
  | 'different_core'
  | 'non_a_prefix_not_supported';

export type PartRelationEvidence = {
  readonly leadingPrefixRemoved?: 'A';
  readonly normalizedCore?: string;
  readonly descriptionOverlapTokens?: readonly string[];
  readonly quantityEqual?: boolean;
  readonly unitCompatible?: boolean;
  readonly lineNetSimilar?: boolean;
  readonly unitPriceSimilar?: boolean;
};

/**
 * Advisory candidate — never a confirmed equivalence.
 * left = estimate line, right = invoice line.
 */
export type PartRelationCandidate = {
  readonly leftLineId: string;
  readonly rightLineId: string;
  readonly leftRawNumber?: string;
  readonly rightRawNumber?: string;
  readonly leftNormalizedNumber: string;
  readonly rightNormalizedNumber: string;
  readonly relation: PartRelationKind;
  readonly confidence: PartRelationConfidence;
  readonly reasonCodes: readonly PartRelationReasonCode[];
  readonly evidence: PartRelationEvidence;
  readonly status: PartRelationCandidateStatus;
  readonly leftSource?: SourceRef;
  readonly rightSource?: SourceRef;
  readonly explanation?: string;
};

export type PartRelationAnalysisResult = {
  readonly candidates: readonly PartRelationCandidate[];
  readonly baseline: {
    readonly estimateOnlyLineCount: number;
    readonly invoiceOnlyLineCount: number;
  };
  readonly counts: {
    readonly exactCandidates: number;
    readonly formatVariantCandidates: number;
    readonly prefixVariantCandidates: number;
    readonly ambiguousCandidates: number;
    readonly unresolvedPairs: number;
  };
};
