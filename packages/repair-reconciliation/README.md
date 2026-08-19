# @cm-flow-manager/repair-reconciliation

Deterministic **Process B** invoice validation engine (Phase 4D).

Compares two `CanonicalRepairDocument` inputs (approved estimate + final invoice) and returns structured financial differences with `explainedDifference` and `residual`.

- **Sign convention:** `delta = invoice − estimate`
- **Invariant:** `netDelta = explainedDifference + residual`
- **No** PDF parsing, Electron, React, AI, or Parts Intelligence at runtime

```ts
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
```

See `docs/INVOICE_VALIDATION_ENGINE.md`.
