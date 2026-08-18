# `@cm-flow-manager/repair-extraction`

Phase 4C.1 deterministic parsers: extracted PDF text → `CanonicalRepairDocument`.

See [`docs/REPAIR_DOCUMENT_EXTRACTION.md`](../../docs/REPAIR_DOCUMENT_EXTRACTION.md).

```ts
import { extractRepairDocument } from '@cm-flow-manager/repair-extraction';

const result = extractRepairDocument({
  documentId: 'local-basename',
  text: extractedTextLayer,
});
```

Sanitized fixtures live in `fixtures/`. Do not add customer PDFs.
