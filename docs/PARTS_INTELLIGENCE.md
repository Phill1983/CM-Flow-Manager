# Parts Intelligence (Phase 4E.1 + 4E.1.1)

Deterministic **part relation candidates** for unmatched / ambiguous part lines produced by Phase 4D invoice reconciliation, plus a **human confirmation layer** (4E.1.1).

## Purpose

Phase 4D deliberately treats different normalized OEM numbers as **unmatched** (e.g. `0007271300` vs `A0007271300`).

Phase 4E.1 answers:

> Do these unmatched numbers have a deterministic structural relationship strong enough to become a **candidate** relation?

Phase 4E.1.1 adds:

> Did a human explicitly **confirm** or **reject** a specific line-pair candidate?

It does **not** answer:

> Are they definitely the same physical part?

Candidates require human review (or future AI enrichment in 4E.2) before any production equivalence. **High confidence does not auto-confirm.**

## Package

`@cm-flow-manager/repair-parts-intelligence`

```ts
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import {
  analyzePartRelationCandidates,
  confirmPartRelation,
  rejectPartRelation,
  toHumanConfirmedPartOverride,
} from '@cm-flow-manager/repair-parts-intelligence';

const validation = validateInvoiceAgainstEstimate(estimate, invoice);
const analysis = analyzePartRelationCandidates(validation, estimate, invoice);

const confirmed = confirmPartRelation(analysis.candidates[0], {
  displayName: 'Reviewer',
  emailOrId: 'reviewer@local',
}, { confirmedAt: new Date().toISOString() });

const withOverrides = validateInvoiceAgainstEstimate(estimate, invoice, {
  confirmedPartRelations: [toHumanConfirmedPartOverride(confirmed)],
});
```

## Boundaries

| In scope | Out of scope |
| --- | --- |
| Exact / format / leading-A candidates (4E.1) | Supersession inference |
| Human confirm / reject records (4E.1.1) | Aftermarket / supplier equivalence |
| Optional 4D trusted override from **confirmed** relations only | AI, embeddings, web lookup |
| Line-pair confirmation (even when 4E.1 status is ambiguous) | Persistence, UI, auth subsystem |
| JSON-serializable audit records | Candidate auto-promotion |

**Do not modify** `normalizePartNumberDeterministic()` in `@cm-flow-manager/repair-domain`. Parts Intelligence sits **above** lexical normalization.

## Candidate model (4E.1)

```ts
PartRelationCandidate {
  leftLineId          // estimate
  rightLineId         // invoice
  relation            // exact | format_variant_candidate | prefix_variant_candidate | unresolved
  confidence          // high | medium | low
  status              // candidate | ambiguous | unresolved
}
```

## Human confirmation model (4E.1.1)

```ts
ConfirmedPartRelation {
  relationId
  estimateLineId / invoiceLineId
  leftNormalizedNumber / rightNormalizedNumber
  relationType
  sourceCandidateId
  confirmedBy { displayName, emailOrId }
  confirmedAt
  evidenceSnapshot
  knowledgeStatus: 'approved'
}

RejectedPartRelation {
  rejectionId
  sourceCandidateId
  candidateSnapshot   // full candidate preserved
  rejectedBy / rejectedAt / reason?
}
```

Public API:

- `confirmPartRelation(candidate, reviewer, opts?)`
- `rejectPartRelation(candidate, reviewer, opts?)`
- `buildCandidateId(candidate)`
- `toHumanConfirmedPartOverride(confirmed)` — maps to 4D override input

## Integration with Phase 4D

```text
validateInvoiceAgainstEstimate(estimate, invoice)           // baseline unchanged
        ↓
analyzePartRelationCandidates() → PartRelationCandidate[]
        ↓
confirmPartRelation / rejectPartRelation                    // human gate
        ↓
validateInvoiceAgainstEstimate(estimate, invoice, {
  confirmedPartRelations: [...]                            // optional trusted override
})
```

**Default:** no `confirmedPartRelations` → identical to pre-4E.1.1 4D behavior.

**Override policy:** only explicit human-confirmed line pairs; candidates never accepted; conflicting overrides produce warnings.

## CASE-4A2-03 (sanitized)

Baseline 4D: 0 matched; 3 estimate-only; 2 invoice-only.

4E.1: 4 `prefix_variant_candidate` pairs (ambiguous 2×2).

4E.1.1: human confirms `part-seal-f ↔ inv-seal-1` and `part-seal-r ↔ inv-seal-2` → 2 `human_confirmed` matches; 1 estimate-only (door); 0 invoice-only.

## Knowledge policy

Follow `docs/knowledge/AI_LEARNING_POLICY.md`:

`observed → candidate → human review → approved/rejected`

4E.1 stops at **candidate**. 4E.1.1 produces **approved** / **rejected** records in memory only — no `RepairKnowledgeRepository` persistence yet.

## Related docs

- `docs/knowledge/REPAIR_KNOWLEDGE_BASE.md` — Partition 3 Parts Intelligence
- `docs/INVOICE_VALIDATION_ENGINE.md` — Phase 4D boundaries
- `docs/CANONICAL_REPAIR_DOCUMENT_MODEL.md` — lexical normalization contract
