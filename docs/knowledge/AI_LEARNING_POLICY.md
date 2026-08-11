# AI Learning Policy

Status: Phase 4A.1 policy  
Date: 2026-08-06

## Intent

CM Flow Manager **may learn** from processed repair cases, but **not** through uncontrolled self-training or silent promotion of rules.

## Two layers

### 1. Approved knowledge

| Property | Requirement |
| --- | --- |
| Review | Manually reviewed by a human |
| Versioning | Versioned |
| Traceability | Source, author, review timestamps |
| Production | **May** affect production findings/decisions |

Approved knowledge outranks statistical frequency of observed behaviour.

### 2. AI candidate knowledge

| Property | Requirement |
| --- | --- |
| Origin | Generated from observed cases and/or AI investigation |
| Support | Supporting examples retained |
| Metrics | Confidence and occurrence count |
| Production | **Must not** affect production rules until human approval |

Candidates live in partition **AI candidate knowledge** of the Repair Knowledge Base.

## Lifecycle

```text
Observed pattern
    → AI candidate (status: candidate)
    → Human review
    → Approved  /  Rejected
    → Versioned knowledge (or audit retention if rejected)
```

### Hard prohibitions

1. **AI must never automatically promote** a candidate rule to `approved`.
2. **Repeated human mistakes** must not become accepted knowledge merely because they are frequent.
3. Candidates must not be silently merged into Estimate QA or Invoice Validation production catalogs.
4. Cloud AI, if ever used, is **optional and explicit**; default remains local processing of documents/data.

## Human review outcomes

| Outcome | Effect |
| --- | --- |
| Approved | New or updated `approved` rule with new `version` |
| Rejected | Status `rejected`; retained for audit; not used |
| Needs more evidence | Remains `candidate` with review notes |

## Relation to engines (conceptual)

| Component | Role |
| --- | --- |
| `KnowledgeCandidateService` | Create/store candidates from observations |
| `HumanReviewWorkflow` | Queue, decide, version |
| `RepairKnowledgeRepository` | Persist approved + candidate layers |

No implementation in Phase 4A.1.

## Alignment with product principles

Deterministic calculations remain the source of truth for numbers.  
AI explains, investigates, and proposes.  
Preserve uncertainty instead of inventing certainty.
