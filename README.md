# CM Flow Manager

Modular, local-first Windows desktop toolkit for PDF and office workflow operations.

| Field | Value |
| --- | --- |
| Application | CM Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |
| Current version | `0.0.1` (shell) |
| MVP target | `0.1.0` |
| Current phase | **Phase 1 complete — awaiting Phase 2 approval** |
| Workspace | `D:\Projects\cm-flow-manager` |
| Platform focus | Windows 10 / Windows 11 |
| Processing model | Fully local — no document uploads |

## What this is

CM Flow Manager is a long-lived desktop productivity platform. Modules plug into a shared Electron + React shell.

**First module (MVP):** PDF Password Remover — unlock PDFs **only with a user-provided correct password**.

This application will **never** include password cracking, brute-force attempts, dictionaries, or credential guessing.

## Current status

Phase 1 shell launches: secure Electron preload/IPC, navigation, i18n (pl/uk/en), theme prep, and an unavailable PDF engine mock. **No PDF unlocking yet.**

See:

- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- [docs/STATE_REGISTRY.md](docs/STATE_REGISTRY.md)
- [docs/UI_DIRECTION.md](docs/UI_DIRECTION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Privacy principles

- Documents stay on the user’s machine.
- No analytics or telemetry in v0.1.0.
- No cloud PDF processing.
- Passwords are never logged or persisted.
- Source PDFs are never overwritten by default; unlocked copies are written beside or to a chosen folder.

## Stack

Electron · React · TypeScript · Vite (electron-vite) · Zustand · Vitest · ESLint · Prettier · pnpm · GitHub Actions

PDF unlock engine (Phase 2+): **bundled qpdf** (Apache-2.0). Phase 1 ships only the `PdfUnlockService` contract + unavailable mock.

## Repository layout

```text
cm-flow-manager/
├── apps/desktop/                 # Electron main, preload, renderer
├── packages/ipc-contracts/       # Typed IPC allowlist
├── packages/pdf-engine/          # PdfUnlockService + unavailable mock
├── modules/pdf-password-remover/ # Module metadata (UI placeholder in desktop)
├── docs/
├── .cursor/
└── .github/
```

## Development phases

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | Planning and architecture package | Complete |
| 1 | Application shell that launches | Complete |
| 2 | Verified PDF unlock engine | Not started |
| 3 | Working single-file UI | Not started |
| 4 | Stable batch-capable MVP | Not started |
| 5 | v0.1.0 release candidate | Not started |

## Getting started

Requires Node.js 22+ and pnpm `9.15.9` (see root `packageManager`).

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Do not use npm/yarn for workspace installs. Only `pnpm-lock.yaml` is the lockfile of record.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md).

## Security

See [SECURITY.md](SECURITY.md) and [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md).

## License

Proprietary — see [LICENSE](LICENSE). Third-party components retain their own licenses.
