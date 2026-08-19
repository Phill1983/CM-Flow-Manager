# `@cm-flow-manager/repair-extraction`

Phase 4C.1 deterministic parsers: extracted PDF text → `CanonicalRepairDocument`.
Phase 4C.2 keeps this package Electron/PDF.js-free; PDF bytes enter via `@cm-flow-manager/pdf-text-layer`.

See [`docs/REPAIR_DOCUMENT_EXTRACTION.md`](../../docs/REPAIR_DOCUMENT_EXTRACTION.md).

```ts
import { extractRepairDocument } from '@cm-flow-manager/repair-extraction';

const result = extractRepairDocument({
  documentId: 'local-basename',
  text: extractedTextLayer,
});
```

Sanitized fixtures live in `fixtures/`. Do not add customer PDFs.
