import type { PartLine } from '@cm-flow-manager/repair-domain';
import { collectDescriptionEvidence, hasStrongDescriptionSupport } from './description-evidence.js';
import { evaluateLeadingAPrefixRelation } from './leading-a-prefix-rule.js';
import {
  collectSecondaryEvidence,
  hasMeaningfulSecondarySupport,
} from './secondary-evidence.js';
import type {
  PartRelationCandidate,
  PartRelationConfidence,
  PartRelationEvidence,
  PartRelationKind,
  PartRelationReasonCode,
} from './types.js';
import { partLineSource, resolvedNormalizedPartNumber, resolvedRawPartNumber } from './part-line-util.js';

export type PairEvaluationInput = {
  readonly estimateLine: PartLine;
  readonly invoiceLine: PartLine;
};

function buildExplanation(
  relation: PartRelationKind,
  evidence: PartRelationEvidence,
): string | undefined {
  if (relation === 'prefix_variant_candidate' && evidence.leadingPrefixRemoved === 'A') {
    return "Numbers differ only by observed leading 'A' prefix.";
  }
  if (relation === 'format_variant_candidate') {
    return 'Raw strings differ only by formatting; lexical normalization is equal.';
  }
  if (relation === 'exact') {
    return 'Normalized part numbers are identical.';
  }
  return undefined;
}

function decideConfidence(
  relation: PartRelationKind,
  hasCoreRelation: boolean,
  secondarySupport: boolean,
): PartRelationConfidence {
  if (!hasCoreRelation) {
    return 'low';
  }
  if (secondarySupport) {
    return 'high';
  }
  if (relation === 'exact' || relation === 'format_variant_candidate') {
    return 'high';
  }
  return 'medium';
}

export function evaluatePartRelationPair(input: PairEvaluationInput): PartRelationCandidate {
  const { estimateLine, invoiceLine } = input;
  const leftNormalized = resolvedNormalizedPartNumber(estimateLine);
  const rightNormalized = resolvedNormalizedPartNumber(invoiceLine);

  const base = {
    leftLineId: estimateLine.lineId,
    rightLineId: invoiceLine.lineId,
    leftRawNumber: resolvedRawPartNumber(estimateLine),
    rightRawNumber: resolvedRawPartNumber(invoiceLine),
    leftSource: partLineSource(estimateLine),
    rightSource: partLineSource(invoiceLine),
  };

  if (!leftNormalized || !rightNormalized) {
    return {
      ...base,
      leftNormalizedNumber: leftNormalized ?? '',
      rightNormalizedNumber: rightNormalized ?? '',
      relation: 'unresolved',
      confidence: 'low',
      reasonCodes: ['no_structural_relation'],
      evidence: {},
      status: 'unresolved',
    };
  }

  const descriptionEvidence = collectDescriptionEvidence(
    estimateLine.description?.value,
    invoiceLine.description?.value,
  );
  const secondary = collectSecondaryEvidence(estimateLine, invoiceLine);
  const descriptionStrong = hasStrongDescriptionSupport(descriptionEvidence);

  const reasonCodes: PartRelationReasonCode[] = [];
  let relation: PartRelationKind = 'unresolved';
  let evidence: PartRelationEvidence = {};

  if (leftNormalized === rightNormalized) {
    relation = base.leftRawNumber !== base.rightRawNumber ? 'format_variant_candidate' : 'exact';
    reasonCodes.push('normalized_numbers_equal');
    if (relation === 'format_variant_candidate') {
      reasonCodes.push('formatting_only_difference');
    }
  } else {
    const prefixMatch = evaluateLeadingAPrefixRelation(leftNormalized, rightNormalized);
    if (prefixMatch) {
      relation = 'prefix_variant_candidate';
      reasonCodes.push('leading_a_prefix_removed', 'normalized_core_equal');
      evidence = {
        leadingPrefixRemoved: 'A',
        normalizedCore: prefixMatch.core,
      };
    } else {
      reasonCodes.push('different_core', 'no_structural_relation');
    }
  }

  if (relation === 'unresolved') {
    return {
      ...base,
      leftNormalizedNumber: leftNormalized,
      rightNormalizedNumber: rightNormalized,
      relation,
      confidence: 'low',
      reasonCodes,
      evidence,
      status: 'unresolved',
    };
  }

  let evidenceExtras: PartRelationEvidence = { ...evidence };
  if (descriptionEvidence.exactMatch) {
    reasonCodes.push('description_exact_match');
    evidenceExtras = {
      ...evidenceExtras,
      descriptionOverlapTokens: descriptionEvidence.overlapTokens,
    };
  } else if (descriptionEvidence.overlapTokens.length > 0) {
    reasonCodes.push('description_token_overlap');
    evidenceExtras = {
      ...evidenceExtras,
      descriptionOverlapTokens: descriptionEvidence.overlapTokens,
    };
  }

  if (secondary.quantityEqual) {
    reasonCodes.push('quantity_equal');
    evidenceExtras = { ...evidenceExtras, quantityEqual: true };
  }
  if (secondary.unitCompatible) {
    reasonCodes.push('unit_compatible');
    evidenceExtras = { ...evidenceExtras, unitCompatible: true };
  }
  if (secondary.lineNetSimilar) {
    reasonCodes.push('line_net_similar');
    evidenceExtras = { ...evidenceExtras, lineNetSimilar: true };
  }
  if (secondary.unitPriceSimilar) {
    reasonCodes.push('unit_price_similar');
    evidenceExtras = { ...evidenceExtras, unitPriceSimilar: true };
  }

  const secondarySupport = hasMeaningfulSecondarySupport(secondary, descriptionStrong);
  const confidence = decideConfidence(relation, true, secondarySupport);
  const explanation = buildExplanation(relation, evidenceExtras);

  return {
    ...base,
    leftNormalizedNumber: leftNormalized,
    rightNormalizedNumber: rightNormalized,
    relation,
    confidence,
    reasonCodes,
    evidence: evidenceExtras,
    status: 'candidate',
    explanation,
  };
}
