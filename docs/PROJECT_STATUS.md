# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Updater runtime regression fix complete**. Phase 4B remains local draft — do not resume until explicit approval. |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-11 |
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

### Updater runtime regression fix (approved 2026-08-11)
- Root cause: workspace `@cm-flow-manager/app-updater` was externalized while exporting `.ts`; Electron main crashed with `ERR_UNKNOWN_FILE_EXTENSION`.
- Secondary: ESM named import of CJS `electron-updater` `autoUpdater` failed after bundling.
- Fix: bundle workspace TS packages in `electron-vite`; load `autoUpdater` via `createRequire`; `app-updater` package exports → `dist/*.js`; post-build `assert-main-bundle.mjs`.

#### Manual / packaged verification (recorded)
| Check | Result |
| --- | --- |
| `pnpm pack:win` | Pass |
| Installed Setup over previous Program Files build | Pass (`installer_exit=0`; EXE SHA matched new `win-unpacked`) |
| Installed EXE starts without main-process JS error | Pass |
| Settings → Updates opens | Pass |
| Settings → Updates → Check for updates | Pass — status `up-to-date` (`0.1.0-alpha`) |
| PDF Password Remover unlock (installed app IPC + fixture) | Pass — encrypted → unlocked → output unencrypted |

### Governance
- Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push.
- Native End-to-End Verification + Packaged EXE verification.

## Work in progress

- Phase 4B canonical model exists as **local uncommitted draft only** — not resumed until explicit owner approval.

## Blockers

1. **Owner approval required** before resuming / committing Phase **4B** and before Phase **4C**.
2. **Owner approval required** before Phase 3B (plate → folder).
3. Authenticode certificate still required for “Unknown publisher” / signed updates.
4. Scan estimate (CASE-4A2-01) remains OCR-required until a later extraction phase.

## Next approved task

Awaiting explicit owner approval to resume **Phase 4B** (commit/push of draft) or other direction.

## Proposed follow-on phases (documented only)

4B Canonical model → 4C Extraction PoC → 4D Invoice reconciliation engine → 4E Parts Intelligence PoC → 4F Estimate QA engine.

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
