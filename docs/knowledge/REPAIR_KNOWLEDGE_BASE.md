# Repair Knowledge Base

Status: Phase 4A.1 conceptual structure  
Date: 2026-08-06

## Goal

Provide a durable, reviewable knowledge foundation for CM Flow Manager repair-document workflows without mixing pre-approval technical QA with post-repair financial reconciliation.

## Mandatory partitions

The Repair Knowledge Base is divided into at least:

| Partition | Process | Purpose |
| --- | --- | --- |
| **1. Estimate QA knowledge** | A | Completeness and repair-logic checks **before** estimate approval |
| **2. Invoice Validation knowledge** | B | Financial/positional reconciliation **after** invoice exists |
| **3. Parts Intelligence** | Shared support (esp. B; sometimes A context) | Classify relationships between part numbers — never silent equivalence |
| **4. AI candidate knowledge** | Both (isolated) | Observed patterns awaiting human review — **not** production |

Detailed catalogs:

- [ESTIMATE_QA_KNOWLEDGE.md](./ESTIMATE_QA_KNOWLEDGE.md)
- [INVOICE_VALIDATION_KNOWLEDGE.md](./INVOICE_VALIDATION_KNOWLEDGE.md)
- [AI_LEARNING_POLICY.md](./AI_LEARNING_POLICY.md) (includes candidate lifecycle)
- [../PARTS_INTELLIGENCE.md](../PARTS_INTELLIGENCE.md) — Phase 4E.1 candidates + 4E.1.1 human confirmation (implementation)

## Separation invariant

```text
Estimate QA knowledge  ──X──►  Invoice Validation production decisions
Invoice Validation knowledge ──X──►  “Should this op have been on the estimate?” claims
```

Shared **Parts Intelligence** may inform both, but each process keeps its own rule `process` field and review queue.

## Common rule template

Every future rule (QA or validation) SHOULD carry:

| Field | Meaning |
| --- | --- |
| `ruleId` | Stable identifier |
| `process` | `estimate_qa` \| `invoice_validation` \| `parts_intelligence` |
| `category` | Domain category (e.g. `adas_calibration`, `part_price_difference`) |
| `title` | Short human title |
| `trigger` | When the rule is considered |
| `expectedCondition` | What “good” looks like |
| `detectionLogic` | How the condition is detected (deterministic description; not code in 4A.1) |
| `severity` | e.g. info / warning / critical (advisory for QA) |
| `confidence` | Confidence of the rule itself when approved; candidates track separately |
| `explanation` | User-facing rationale |
| `evidence` | What data must be cited in a finding |
| `examples` | Illustrative cases |
| `exclusions` | When not to apply |
| `source` | Authoritative origin (OEM bulletin, insurer policy, shop SOP, …) |
| `status` | `draft` \| `candidate` \| `approved` \| `rejected` \| `deprecated` |
| `author` | Creating person/system |
| `createdAt` | ISO timestamp |
| `reviewedAt` | ISO timestamp of last human review |
| `version` | Monotonic version of approved content |

### Statuses

| Status | Production use |
| --- | --- |
| `draft` | Authoring only |
| `candidate` | AI/human proposed — **cannot** affect production decisions |
| `approved` | May drive production findings |
| `rejected` | Retained for audit; not used |
| `deprecated` | Was approved; superseded — do not use for new cases |

## Product principles (knowledge layer)

See also [AI_LEARNING_POLICY.md](./AI_LEARNING_POLICY.md) and Phase 4A.1 decisions:

1. Estimate QA and Invoice Validation are separate processes.
2. Deterministic calculations are the source of truth for numerical comparison.
3. AI explains, investigates, and proposes; it does not silently decide.
4. Every conclusion must be traceable to source data or an approved rule.
5. Human-approved knowledge outranks statistically observed patterns.
6. Documents and extracted business data remain local by default.
7. Cloud AI, if ever supported, must be optional and explicit.
8. Preserve uncertainty — never invent certainty.

## Future storage (conceptual)

`RepairKnowledgeRepository` (local, versioned). No schema implementation in 4A.1.
