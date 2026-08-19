import type { PartRelationCandidate } from './types.js';

/** Stable identity for a specific estimate↔invoice line-pair candidate. */
export function buildCandidateId(
  candidate: Pick<
    PartRelationCandidate,
    'leftLineId' | 'rightLineId' | 'leftNormalizedNumber' | 'rightNormalizedNumber' | 'relation'
  >,
): string {
  return `${candidate.leftLineId}:${candidate.rightLineId}:${candidate.leftNormalizedNumber}:${candidate.rightNormalizedNumber}:${candidate.relation}`;
}
