# CM Flow Manager

Modular, local-first Windows desktop toolkit for PDF and office workflow operations.

| Field | Value |
| --- | --- |
| Application | CM Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |
| Current version | `0.1.0-alpha` |
| MVP target | `0.1.0` |
| Current phase | **Phase 4C.1 — repair document text extraction** (approved) |
| Workspace | `D:\Projects\cm-flow-manager` |
| Platform focus | Windows 10 / Windows 11 |
| Processing model | Fully local — no document uploads |

## What this is

CM Flow Manager is a long-lived desktop productivity platform. Modules plug into a shared Electron + React shell.

**First module (MVP):** PDF Password Remover — unlock PDFs **only with a user-provided correct password**.

This application will **never** include password cracking, brute-force attempts, dictionaries, or credential guessing.

## Current status

Phase 3A Password Remover UI is complete. Phase 3.5 packages the first standalone Windows Alpha (installer + portable) with bundled qpdf. Phase 3.6 adds an opt-in GitHub Releases updater foundation. Phase **3.7** adds local PDF Split (extract selected pages) and Merge, plus local page thumbnails. Phase 4B canonical repair-domain is complete. Phase **4C.1** extraction PoC is complete (text → `CanonicalRepairDocument`; no UI/OCR/AI). Phase 3B (plate → folder) is deferred.

See:

- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- [docs/STATE_REGISTRY.md](docs/STATE_REGISTRY.md)
- [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Privacy principles

- Documents stay on the user’s machine.
- No analytics or telemetry in v0.1.0.
- No cloud PDF processing.
- Optional GitHub Releases updates only (metadata + installer bytes; Settings → Updates) — see ADR-007.
- Passwords are never logged or persisted.
- Source PDFs are never overwritten by default; unlocked copies are written beside or to a chosen folder.

## Stack

Electron · React · TypeScript · Vite (electron-vite) · Zustand · Vitest · ESLint · Prettier · pnpm · electron-builder · GitHub Actions

PDF unlock engine: **bundled qpdf** (Apache-2.0).

## Repository layout

```text
cm-flow-manager/
├── apps/desktop/                 # Electron main, preload, renderer, packaging
├── packages/ipc-contracts/       # Typed IPC allowlist
├── packages/pdf-engine/          # PdfUnlockService + qpdf adapter (unlock, extract, merge)
├── packages/app-updater/         # Update policy / manifest / version logic (no Electron)
├── modules/pdf-password-remover/ # Module domain helpers + Phase 3B contracts
├── modules/pdf-split-merge/      # Split/Merge domain helpers
├── vendor/qpdf/                  # Fetched qpdf (bin gitignored)
├── release/                      # Local pack output (exe gitignored)
├── docs/
├── .cursor/
└── .github/
```

## Development phases

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | Planning and architecture package | Complete |
| 1 | Application shell that launches | Complete |
| 1.5 | UI foundation (Tailwind/shadcn) | Complete |
| 2 | Verified PDF unlock engine | Complete |
| 3A | Working single-file UI | Complete |
| 3.5 | First Alpha packaging (installer + portable) | Complete |
| 3.6 | Update & version management foundation (GitHub Releases) | Complete |
| 3.7 | PDF Split / Merge (local extract + merge + page preview) | Awaiting approval |
| 3B | Plate → folder resolution | Deferred |
| 4 | Batch-capable MVP | Not started |
| 5 | Signed / hardened release candidate | Not started |

## Getting started (developers)

Requires Node.js 22+ and pnpm `9.15.9` (see root `packageManager`).

```bash
pnpm install
pnpm fetch:qpdf
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### Windows Alpha packaging

```bash
pnpm pack:win
```

Produces under `release/`:

- `CM Flow Manager Setup 0.1.0-alpha.exe` (NSIS)
- `CM Flow Manager 0.1.0-alpha.exe` (portable)
- `SHA256SUMS.txt`
- Release notes / changelog excerpt

End users do **not** need Node, npm, pnpm, Git, or Cursor.

## Verification rule (from Phase 3.5)

For user-facing desktop work, verify **both** `pnpm dev` and the **packaged EXE**. The packaged build is the primary target. See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md).
