# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 2 — PDF engine proof of concept** (complete) |
| Application version | `0.0.2` (engine PoC; package.json still `0.0.1` until release bump) |
| Date | 2026-08-03 |
| Workspace path | `D:\Projects\cm-flow-manager` |
| Product display name | CM Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |

## Completed work

### Phase 0–1.5
- Planning, shell, Tailwind/shadcn, zero-warning lint, GitHub remote.

### Phase 2
- Official qpdf **12.3.2** msvc64 fetched with SHA-256 verification (`pnpm fetch:qpdf`).
- `QpdfUnlockService` + path guards + sanitized logging.
- `@cm-flow-manager/file-utils` for unlocked naming helpers.
- Synthetic fixtures + integration tests (success, wrong password, invalid, missing, destination exists, plain copy, Unicode, spaces).
- Allowlisted IPC: `dialog:openPdf`, `dialog:savePdf`, `pdf:inspect`, `pdf:unlock`.
- Temporary DEV-only unlock panel + CLI `poc:unlock`.
- Password via `--password-file` (not argv); documented residual disk exposure.

### Governance
- Delivery cycle locked: **Implementation → Validation → Phase Report → Human approval → Commit → Push** (Cursor rules + `DEVELOPMENT_WORKFLOW.md`).

## Work in progress

- None. Phase 3 not started.

## Blockers

1. **Owner approval required** before Phase 3 (product Password Remover UI).
2. Production qpdf bundling deferred.

## Next approved task

Awaiting explicit approval for **Phase 3 — MVP Password Remover UI**.

## Latest test result

```text
pnpm test → 6 files / 20 tests passed
pnpm test:pdf → integration suite included
```

## Latest build result

```text
pnpm typecheck → pass
pnpm lint → pass (0 warnings)
pnpm build → pass
Manual poc:unlock correct password → unlocked, output not encrypted
Manual poc:unlock wrong password → incorrect_password, no output file
```

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
