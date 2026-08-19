# `@cm-flow-manager/pdf-text-layer`

Phase 4C.2 adapter: local PDF bytes → page-aware text via **PDF.js 4.10.38** (same library as Split/Merge thumbnails).

Does **not** parse repair documents. Downstream: `@cm-flow-manager/repair-extraction`.

No Electron, no filesystem API, no OCR, no network. Developer soak: `pnpm repair:soak <local-folder>` from the repo root.
