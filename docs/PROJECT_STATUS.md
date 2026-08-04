# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 3A — PDF Password Remover UI** (complete; approved) |
| Application version | `0.0.3` marker (package.json still `0.0.1` until release bump) |
| Date | 2026-08-04 |
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
- Synthetic fixtures + integration tests.
- Allowlisted IPC: `dialog:openPdf`, `dialog:savePdf`, `pdf:inspect`, `pdf:unlock`.
- Password via `--password-file` (not argv); documented residual disk exposure.

### Phase 3A (pending commit approval)
- Production Password Remover UI replaces DEV-only PoC panel.
- Drag-and-drop + file dialog (single PDF).
- Inspect → password when required → collision-safe `*_unlocked.pdf` suggestion → unlock → open folder.
- IPC additions: `pdf:prepareSource`, `shell:openFolder` (+ preload `getPathForFile` for drops).
- Localization complete for pl / uk / en.
- Phase 3B contracts only: `VehiclePlateExtractor`, `PlateNormalizer`, `CaseFolderResolver`.

### Governance
- Delivery cycle locked: **Implementation → Validation → Phase Report → Human approval → Commit → Push**.

## Work in progress

- None. Phase 3A complete.

## Blockers

1. **Owner approval required** before Phase 3B (plate → folder resolution).
2. Production qpdf bundling deferred (Phase 5).

## Next approved task

Awaiting explicit approval for **Phase 3B** (vehicle plate → configured-root folder resolution). Do not start until approved.

## Latest test result

```text
pnpm test → 9+ files / all passing (incl. pdf-engine exit-code + path tests)
Manual: encrypted PDF unlock to source folder *_unlocked.pdf succeeded
```

## Latest build result

```text
pnpm typecheck → pass
pnpm lint → pass (0 warnings)
pnpm build → pass
pnpm dev → CJS sandboxed preload + QpdfUnlockService OK
```

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
