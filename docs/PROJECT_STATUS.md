# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 4B approved** (canonical repair document model). Next gated: 4C. UI frozen. |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-17 |
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

## Work in progress

- None in this commit. **Do not start Phase 4C** until explicit owner approval.

## Blockers

1. **Owner approval required** before Phase **4C** (extraction PoC).
2. **Owner approval required** before Phase 3B (plate → folder).
3. Authenticode certificate still required (TD-011).
4. **TD-008 (not 4B):** qpdf integration `incorrect_password` received `unlocked`. Do not mix a PDF-engine fix into repair-domain work.

## Next approved task

Wait for owner to open **Phase 4C**. Do not start parsers, comparison, AI, or PDF Split/Merge.

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
