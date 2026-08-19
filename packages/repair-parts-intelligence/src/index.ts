export type {
  PartRelationAnalysisResult,
  PartRelationCandidate,
  PartRelationCandidateStatus,
  PartRelationConfidence,
  PartRelationEvidence,
  PartRelationKind,
  PartRelationReasonCode,
} from './types.js';

export type {
  ConfirmedPartRelation,
  HumanPartRelationDecision,
  HumanReviewErrorCode,
  KnowledgeApprovalStatus,
  RejectedPartRelation,
  ReviewerIdentity,
} from './human-review-types.js';
export { HumanReviewError } from './human-review-types.js';

export { analyzePartRelationCandidates } from './analyze-candidates.js';
export { evaluatePartRelationPair } from './evaluate-pair.js';
export { evaluateLeadingAPrefixRelation, tryLeadingAPrefixCore } from './leading-a-prefix-rule.js';
export { buildCandidateId } from './candidate-id.js';
export {
  confirmPartRelation,
  rejectPartRelation,
  toHumanConfirmedPartOverride,
} from './human-review.js';
export { mapConfirmedRelationsForReconciliation } from './apply-human-overrides.js';
