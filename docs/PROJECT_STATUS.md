# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 4B — Canonical repair document model** (next on plan; local draft may exist). UI asset-pack landed; remaining UI polish is tech debt. |
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

### Updater runtime regression fix (approved + closed 2026-08-11/12)
- Commit: `c55acab` on `main` / `develop`.

### Exact UI asset-pack (accepted for commit 2026-08-17)
- Inventory: `assets/cm-ui/INVENTORY.md`.
- Tokens: Inter + CM navy/blue/yellow. Shell, hero, module PNGs, empty recent-files, stats zeros, status strip.
- Remaining visual fidelity: `docs/TECH_DEBT.md` TD-001–TD-007. Do not treat as a blocker for 4B.

## Work in progress

- **Phase 4B** canonical model — resume per plan after this UI commit. Do not mix 4B files into the UI commit.

## Blockers

1. **Owner approval required** before Phase **4C** and before Phase 3B (plate → folder).
2. Authenticode certificate still required for “Unknown publisher” / signed updates (TD-011).
3. Scan estimate (CASE-4A2-01) remains OCR-required until a later extraction phase.
4. qpdf integration: `incorrect_password` mapping (TD-008).

## Next approved task

1. **Phase 4B** — Canonical repair document model.
2. UI polish only when owner pulls TD-001–TD-007 into an approved UI pass.

## Proposed follow-on phases (documented only)

4C Extraction PoC → 4D Invoice reconciliation engine → 4E Parts Intelligence PoC → 4F Estimate QA engine.

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
