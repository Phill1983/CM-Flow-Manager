# packages/

- `ipc-contracts` — typed IPC allowlist
- `pdf-engine` — `PdfEngineService` / `QpdfUnlockService`, page-range parser, fixtures
- `file-utils` — PDF path helpers and output filename generation
- `repair-domain` — canonical repair document model (Phase 4B)
- `repair-extraction` — deterministic text → canonical parsers (Phase 4C.1; unused by desktop)
- `pdf-text-layer` — PDF.js text-layer adapter (Phase 4C.2; unused by desktop UI)
- `repair-reconciliation` — deterministic estimate↔invoice validation engine (Phase 4D; unused by desktop UI)
- `repair-parts-intelligence` — deterministic part relation candidates for unmatched lines (Phase 4E.1; unused by desktop UI)

Additional shared packages (`ui`, `logging`, `core`) are added when first needed.
