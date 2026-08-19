# Parts Intelligence (Phase 4E.1)

Deterministic **part relation candidates** for unmatched / ambiguous part lines produced by Phase 4D invoice reconciliation.

## Purpose

Phase 4D deliberately treats different normalized OEM numbers as **unmatched** (e.g. `0007271300` vs `A0007271300`).

Phase 4E.1 answers:

> Do these unmatched numbers have a deterministic structural relationship strong enough to become a **candidate** relation?

It does **not** answer:

> Are they definitely the same physical part?

Candidates require human review (or future AI enrichment in 4E.2) before any production equivalence.

## Package

`@cm-flow-manager/repair-parts-intelligence`

```ts
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates } from '@cm-flow-manager/repair-parts-intelligence';

const validation = validateInvoiceAgainstEstimate(estimate, invoice);
const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
// analysis.candidates — advisory PartRelationCandidate[]
```

## Boundaries

| In scope (4E.1) | Out of scope |
| --- | --- |
| Exact normalized match (baseline) | Supersession inference |
| Format-only variant (raw differs, normalized equal) | Aftermarket / supplier equivalence |
| Observed leading `A` prefix candidate | Generic manufacturer prefix tables |
| Description / qty / price as **supporting** evidence | AI, embeddings, web lookup |
| Many-to-many ambiguity flags | Persistence, UI, knowledge promotion |
| Line-level provenance preservation | Rewriting 4D matcher |

**Do not modify** `normalizePartNumberDeterministic()` in `@cm-flow-manager/repair-domain`. Parts Intelligence sits **above** lexical normalization.

## Candidate model

```ts
PartRelationCandidate {
  leftLineId          // estimate
  rightLineId         // invoice
  leftRawNumber / rightRawNumber
  leftNormalizedNumber / rightNormalizedNumber
  relation            // exact | format_variant_candidate | prefix_variant_candidate | unresolved
  confidence          // high | medium | low
  reasonCodes         // machine-readable evidence
  evidence            // structured support (prefix removed, qty match, …)
  status              // candidate | ambiguous | unresolved
  explanation?        // short deterministic helper string
}
```

## Implemented rules (4E.1)

1. **Exact** — normalized numbers equal (`normalized_numbers_equal`).
2. **Format variant** — raw strings differ but lexical normalization equal (`formatting_only_difference`). Normally matched by 4D; included as invariant baseline.
3. **Leading-A prefix** — remove one leading `A` from one side; cores equal (`leading_a_prefix_removed`, `normalized_core_equal`). Observed Mercedes-style pattern only — not a generic prefix registry.

## Confidence

Rule-based, not probabilistic:

- **high** — core structural relation plus secondary evidence (description, qty, unit, price support), or exact/format match
- **medium** — core structural relation only (typical leading-A candidate)
- **low** — unresolved / weak

## Integration with Phase 4D

```text
validateInvoiceAgainstEstimate()
        ↓
partMatches.estimateOnly / invoiceOnly
        ↓
analyzePartRelationCandidates()
        ↓
PartRelationCandidate[]   (separate output — never mutates 4D matches)
```

## CASE-4A2-03 (sanitized)

Baseline 4D: 0 matched; 3 estimate-only; 2 invoice-only.

4E.1 finds 4 `prefix_variant_candidate` pairs between duplicate seal lines (`0007271300` ↔ `A0007271300`), all flagged **ambiguous** (2×2 many-to-many). Door line (`2547201700`) pairs remain **unresolved**.

## Knowledge policy

Follow `docs/knowledge/AI_LEARNING_POLICY.md`:

`observed → candidate → human review → approved/rejected`

Phase 4E.1 stops at **candidate**. No writes to `RepairKnowledgeRepository`.

## Related docs

- `docs/knowledge/REPAIR_KNOWLEDGE_BASE.md` — Partition 3 Parts Intelligence
- `docs/INVOICE_VALIDATION_ENGINE.md` — Phase 4D boundaries
- `docs/CANONICAL_REPAIR_DOCUMENT_MODEL.md` — lexical normalization contract
