# Invoice Validation Engine (Phase 4D)

Process **B only** — deterministic reconciliation of two `CanonicalRepairDocument` inputs (approved estimate + final invoice).

## Public API

```ts
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';

const result = validateInvoiceAgainstEstimate(estimate, invoice);
```

Package: `@cm-flow-manager/repair-reconciliation`  
Runtime dependency: `@cm-flow-manager/repair-domain` only (no PDF, Electron, React, AI).

## Sign convention

**`delta = invoice − estimate`**

| delta sign | Meaning |
| --- | --- |
| positive | Invoice is more expensive |
| negative | Invoice is cheaper |
| zero | Equal |

## Core invariant (net level)

```
netDelta = invoiceTotalNet − estimateTotalNet
netDelta = explainedDifference + residual
residual = netDelta − explainedDifference
```

- `residual` is a **diagnostic** value — never forced to zero.
- VAT is compared separately; net category reconciliation does not auto-include VAT in `explainedDifference`.
- Gross consistency: `grossDelta ≈ netDelta + vatDelta` (rounding reported via warnings when mismatch).

## Input validation

- `estimate.source.documentType === 'estimate'`
- `invoice.source.documentType === 'invoice'`
- Same `currency` (throws `ReconciliationInputError` with `currency_mismatch` — no conversion)
- Canonical structural validation via `validateRepairDocument`

## Matching strategy

### Parts (line level)

1. **Tier 1** — unique normalized OEM on both sides → match
2. **Tier 2** — duplicate OEM groups disambiguated by qty/net/unit price (conservative score); ties → `ambiguous`
3. **Tier 3** — different normalized OEM → unmatched (`estimate_only` / `invoice_only`)

No supersession, A-prefix equivalence, or fuzzy matching (Parts Intelligence is later).

### Labour

- Category singleton pairing when exactly one line per category per side
- Hours comparable when both sides have resolved normalized hours (document-local JC→RBG)
- Invoice `usł` lump labour → **value only** (hours unresolved)
- Category-level fallback when line pairing is unreliable (prefer correct category delta over false line precision)

### Paint / materials / normalia / additional costs

- Paint labour and paint materials compared at **category/aggregate** level when granularity differs
- Normalia compared as printed amounts — no assumed 2% rule
- `additionalCosts` from canonical model (e.g. Materiały dodatkowe)
- Optional normalia **source-consistency diagnostic** when percent + base exist on estimate (not reconciliation formula)

## Output

`InvoiceValidationResult` — part matches, labour comparison, category differences, totals (net/VAT/gross), `explainedDifference`, `residual`, warnings.

Provenance: `SourceRef` preserved on matched/only lines where present on canonical lines.

## Tests

- Golden unit tests: `packages/repair-reconciliation/src/validate-invoice.test.ts`
- Sanitized fixtures: `@cm-flow-manager/repair-domain` `buildCase4a202*` / `buildCase4a203*`
- Local real-pair soak (optional): `REPAIR_SOAK_DIR=<folder> pnpm test -- packages/repair-reconciliation/src/reconcile-soak.local.test.ts`

## Out of scope (Phase 4D)

- Process A (estimate QA)
- UI
- PDF parsing
- AI / Parts Intelligence
- Persistence / learning

See also: `docs/knowledge/INVOICE_VALIDATION_KNOWLEDGE.md`, `docs/CANONICAL_REPAIR_DOCUMENT_MODEL.md`.
