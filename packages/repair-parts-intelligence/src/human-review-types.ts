import type { PartRelationCandidate, PartRelationEvidence, PartRelationKind, PartRelationReasonCode } from './types.js';

/** Explicit reviewer identity — no auth subsystem in 4E.1.1. */
export type ReviewerIdentity = {
  readonly displayName: string;
  readonly emailOrId: string;
};

export type KnowledgeApprovalStatus = 'approved';

export type ConfirmedPartRelation = {
  readonly relationId: string;
  readonly estimateLineId: string;
  readonly invoiceLineId: string;
  readonly leftRawNumber?: string;
  readonly rightRawNumber?: string;
  readonly leftNormalizedNumber: string;
  readonly rightNormalizedNumber: string;
  readonly relationType: PartRelationKind;
  readonly sourceCandidateId: string;
  readonly confirmedBy: ReviewerIdentity;
  readonly confirmedAt: string;
  readonly note?: string;
  readonly evidenceSnapshot: PartRelationEvidence;
  readonly reasonCodesSnapshot: readonly PartRelationReasonCode[];
  readonly knowledgeStatus: KnowledgeApprovalStatus;
};

export type RejectedPartRelation = {
  readonly rejectionId: string;
  readonly sourceCandidateId: string;
  readonly candidateSnapshot: PartRelationCandidate;
  readonly rejectedBy: ReviewerIdentity;
  readonly rejectedAt: string;
  readonly reason?: string;
};

export type HumanPartRelationDecision = {
  readonly candidateId: string;
  readonly decision: 'confirmed' | 'rejected';
  readonly reviewedBy: ReviewerIdentity;
  readonly reviewedAt: string;
  readonly note?: string;
};

export type HumanReviewErrorCode =
  | 'missing_reviewer'
  | 'unresolved_candidate'
  | 'missing_line_reference'
  | 'missing_timestamp';

export class HumanReviewError extends Error {
  readonly code: HumanReviewErrorCode;

  constructor(code: HumanReviewErrorCode, message: string) {
    super(message);
    this.name = 'HumanReviewError';
    this.code = code;
  }
}
