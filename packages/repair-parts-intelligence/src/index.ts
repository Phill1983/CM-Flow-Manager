export type {
  PartRelationAnalysisResult,
  PartRelationCandidate,
  PartRelationCandidateStatus,
  PartRelationConfidence,
  PartRelationEvidence,
  PartRelationKind,
  PartRelationReasonCode,
} from './types.js';

export { analyzePartRelationCandidates } from './analyze-candidates.js';
export { evaluatePartRelationPair } from './evaluate-pair.js';
export { evaluateLeadingAPrefixRelation, tryLeadingAPrefixCore } from './leading-a-prefix-rule.js';
