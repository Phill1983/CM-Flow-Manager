import { buildCandidateId } from './candidate-id.js';
import {
  HumanReviewError,
  type ConfirmedPartRelation,
  type RejectedPartRelation,
  type ReviewerIdentity,
} from './human-review-types.js';
import type { PartRelationCandidate } from './types.js';

function assertReviewer(reviewer: ReviewerIdentity): void {
  if (!reviewer.displayName?.trim() || !reviewer.emailOrId?.trim()) {
    throw new HumanReviewError('missing_reviewer', 'Reviewer displayName and emailOrId are required.');
  }
}

function assertConfirmableCandidate(candidate: PartRelationCandidate): void {
  if (candidate.relation === 'unresolved') {
    throw new HumanReviewError(
      'unresolved_candidate',
      'Unresolved candidates cannot be confirmed or rejected as trusted relations.',
    );
  }
  if (!candidate.leftLineId || !candidate.rightLineId) {
    throw new HumanReviewError('missing_line_reference', 'Candidate must reference both line IDs.');
  }
}

function resolveTimestamp(explicit?: string): string {
  if (!explicit?.trim()) {
    throw new HumanReviewError('missing_timestamp', 'Decision timestamp is required.');
  }
  return explicit;
}

export function confirmPartRelation(
  candidate: PartRelationCandidate,
  reviewer: ReviewerIdentity,
  opts?: { note?: string; confirmedAt?: string },
): ConfirmedPartRelation {
  assertReviewer(reviewer);
  assertConfirmableCandidate(candidate);

  const sourceCandidateId = buildCandidateId(candidate);
  const confirmedAt = resolveTimestamp(opts?.confirmedAt ?? new Date().toISOString());

  return {
    relationId: `confirmed:${sourceCandidateId}`,
    estimateLineId: candidate.leftLineId,
    invoiceLineId: candidate.rightLineId,
    leftRawNumber: candidate.leftRawNumber,
    rightRawNumber: candidate.rightRawNumber,
    leftNormalizedNumber: candidate.leftNormalizedNumber,
    rightNormalizedNumber: candidate.rightNormalizedNumber,
    relationType: candidate.relation,
    sourceCandidateId,
    confirmedBy: reviewer,
    confirmedAt,
    ...(opts?.note ? { note: opts.note } : {}),
    evidenceSnapshot: { ...candidate.evidence },
    reasonCodesSnapshot: [...candidate.reasonCodes],
    knowledgeStatus: 'approved',
  };
}

export function rejectPartRelation(
  candidate: PartRelationCandidate,
  reviewer: ReviewerIdentity,
  opts?: { reason?: string; rejectedAt?: string },
): RejectedPartRelation {
  assertReviewer(reviewer);
  assertConfirmableCandidate(candidate);

  const sourceCandidateId = buildCandidateId(candidate);
  const rejectedAt = resolveTimestamp(opts?.rejectedAt ?? new Date().toISOString());

  return {
    rejectionId: `rejected:${sourceCandidateId}:${rejectedAt}`,
    sourceCandidateId,
    candidateSnapshot: { ...candidate },
    rejectedBy: reviewer,
    rejectedAt,
    ...(opts?.reason ? { reason: opts.reason } : {}),
  };
}

/** Map approved knowledge to the 4D trusted override input shape (no circular package import). */
export function toHumanConfirmedPartOverride(confirmed: ConfirmedPartRelation): {
  readonly relationId: string;
  readonly estimateLineId: string;
  readonly invoiceLineId: string;
  readonly leftNormalizedNumber: string;
  readonly rightNormalizedNumber: string;
  readonly sourceCandidateId: string;
} {
  return {
    relationId: confirmed.relationId,
    estimateLineId: confirmed.estimateLineId,
    invoiceLineId: confirmed.invoiceLineId,
    leftNormalizedNumber: confirmed.leftNormalizedNumber,
    rightNormalizedNumber: confirmed.rightNormalizedNumber,
    sourceCandidateId: confirmed.sourceCandidateId,
  };
}
