# @cm-flow-manager/repair-parts-intelligence

Phase **4E.1** — deterministic part relation **candidates** for unmatched lines from Phase 4D.

- Input: `InvoiceValidationResult.partMatches` (estimate-only / invoice-only lines) + canonical documents
- Output: `PartRelationCandidate[]` (advisory only; never confirmed equivalence)
- **No** PDF parsing, Electron, React, network, AI, or persistence

```ts
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates } from '@cm-flow-manager/repair-parts-intelligence';

const validation = validateInvoiceAgainstEstimate(estimate, invoice);
const analysis = analyzePartRelationCandidates(validation, estimate, invoice);
```

See `docs/PARTS_INTELLIGENCE.md`.
