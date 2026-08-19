# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 4E.1.1 pending approval** (human confirmation layer for part relations). Do **not** start 4E.2 / AI until the owner opens it. |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-19 |
| Workspace path | `D:\Projects\cm-flow-manager` |
| Product display name | CM Flow Manager |
| Window title | Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |

## Completed work

### Phase 0–3A
- Planning, shell, Tailwind/shadcn, qpdf PoC, Password Remover product UI, governance (native E2E).

### Phase 3.5–3.6
- Alpha packaging (NSIS + portable, bundled qpdf).
- Update foundation (GitHub Releases, Settings → Updates, SHA-256, ADR-007).

### Phase 4A.1–4A.2 (approved)
- Process A vs B docs; discovery field inventory (`docs/discovery/*`).

### Exact UI asset-pack (committed 2026-08-17, `e54e4e8`)
- Remaining visual fidelity: `docs/TECH_DEBT.md` TD-001–TD-007 (UI frozen).

### Phase 4B (approved 2026-08-17)
- `@cm-flow-manager/repair-domain` — canonical model, money/provenance, sanitized fixtures, unit tests.
- Doc: `docs/CANONICAL_REPAIR_DOCUMENT_MODEL.md`.

### Phase 3.7 (approved 2026-08-18)
- Local Split (extract selected pages into one PDF) and Merge, reusing bundled qpdf.
- Local page thumbnails (PDF.js in renderer; token protocol in main). Split/Merge loaded views use a visual page/file workspace (checkboxes, order badges, HTML5 drag reorder, inspect dialog).
- Combined PDF Tools UI; Password Remover unchanged.
- Doc: `docs/PDF_SPLIT_MERGE.md`. Owner verified Split and Merge in the running app.

### Phase 4C.1 (approved 2026-08-18)
- `@cm-flow-manager/repair-extraction` — deterministic Audatex + shop Faktura VAT parsers over extracted text; `OCR_REQUIRED` for image-only scans.
- No desktop UI, no OCR engine, no AI, no estimate↔invoice comparison.

### Phase 4C.2 + 4C.3 (approved 2026-08-19, commit `0306c2d`)
- `@cm-flow-manager/pdf-text-layer` — local PDF.js text-layer adapter (`pdfjs-dist` 4.10.38).
- Real-pair soak validated CASE-4A2-02/03 extraction path.
- Doc: `docs/REPAIR_DOCUMENT_EXTRACTION.md`.

### Phase 4D (approved 2026-08-19, commit `f2a18af`)
- `@cm-flow-manager/repair-reconciliation` — `validateInvoiceAgainstEstimate(estimate, invoice)` (Process B only).
- Deterministic part matching, category-level labour/paint/normalia/additional costs, net explained + residual invariant.
- Golden tests + optional local reconcile soak (`REPAIR_SOAK_DIR`).
- Doc: `docs/INVOICE_VALIDATION_ENGINE.md`.

### Phase 4E.1 (approved 2026-08-19, commit `4ca7d7f`)
- `@cm-flow-manager/repair-parts-intelligence` — deterministic part relation **candidates** for unmatched 4D lines.
- Doc: `docs/PARTS_INTELLIGENCE.md`.

### Phase 4E.1.1 (pending approval)
- Human confirm / reject API (`confirmPartRelation`, `rejectPartRelation`) over 4E.1 candidates.
- Optional 4D trusted override via `confirmedPartRelations` (default behavior unchanged).
- **No** persistence, UI, auth, AI, or network.
- **No commit/push** until owner approves Phase Report.

## Work in progress

- Phase 4E.1.1 waiting for owner approval. Do not start **Phase 4E.2 / AI** until opened.

## Blockers

1. **Owner approval required** before Phase **4E.1.1** commit.
2. **Owner approval required** before Phase 3B (plate → folder).
3. Authenticode certificate still required (TD-011).

## Next approved task

Wait for approval of Phase **4E.1.1**, then owner to open **Phase 4E.2** (AI enrichment) if desired. Do not start 4E.2 / OCR / AI unprompted.

**Do not start** Emergency PDF Password Recovery (future / unnumbered; spec only: `docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`).

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
