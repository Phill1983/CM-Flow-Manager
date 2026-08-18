# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 3.7 complete** (PDF Split / Merge). Next gate: owner must open **Phase 4C**. Do **not** start 4C until then. |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-18 |
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

## Work in progress

- None. Waiting for the owner to open **Phase 4C**.

## Blockers

1. **Owner approval required** before Phase **4C** (extraction PoC).
2. **Owner approval required** before Phase 3B (plate → folder).
3. Authenticode certificate still required (TD-011).

## Next approved task

Wait for the owner to open **Phase 4C**.

**Do not start** Emergency PDF Password Recovery (future / unnumbered; spec only: `docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`).

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
