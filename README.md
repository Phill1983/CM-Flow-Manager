# CM Flow Manager

Modular, local-first Windows desktop toolkit for PDF and office workflow operations.

| Field | Value |
| --- | --- |
| Application | CM Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |
| Version target | `0.1.0` (MVP) |
| Current phase | **Phase 0 — Discovery and planning** |
| Platform focus | Windows 10 / Windows 11 |
| Processing model | Fully local — no document uploads |

## What this is

CM Flow Manager is planned as a long-lived desktop productivity platform. Modules will be added independently behind a shared Electron + React shell.

**First module (MVP):** PDF Password Remover — remove password protection from PDF files **only when the user provides the correct password**.

This application will **never** include password cracking, brute-force attempts, dictionaries, or credential guessing.

## Current status

Phase 0 is complete: architecture, security model, PDF engine evaluation, Cursor rules/agents, and project governance are in place.

**No application runtime has been implemented yet.** Phase 1 (repository/workspace initialization) requires explicit approval.

See:

- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- [docs/STATE_REGISTRY.md](docs/STATE_REGISTRY.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Privacy principles

- Documents stay on the user’s machine.
- No analytics or telemetry in v0.1.0.
- No cloud PDF processing.
- Passwords are never logged or persisted.
- Source PDFs are never overwritten by default; unlocked copies are written beside or to a chosen folder.

## Planned stack

Electron · React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Zustand · Electron Builder · Vitest · Playwright · ESLint · Prettier · Husky · GitHub Actions

PDF unlock engine recommendation: **bundled qpdf** (Apache-2.0). See [docs/PDF_ENGINE_EVALUATION.md](docs/PDF_ENGINE_EVALUATION.md) and [docs/adr/ADR-003-pdf-engine.md](docs/adr/ADR-003-pdf-engine.md).

## Repository layout (planned)

```text
cm-flow-manager/
├── apps/desktop/          # Electron main, preload, renderer
├── packages/              # Shared libraries (core, ui, ipc, logging, pdf-engine, …)
├── modules/               # Feature modules (pdf-password-remover first)
├── docs/                  # Architecture and process documentation
├── .cursor/               # Project rules and agents
└── .github/               # CI and contribution templates
```

## Development phases

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | Planning and architecture package | Complete — awaiting approval |
| 1 | Application shell that launches | Not started |
| 2 | Verified PDF unlock engine | Not started |
| 3 | Working single-file UI | Not started |
| 4 | Stable batch-capable MVP | Not started |
| 5 | v0.1.0 release candidate | Not started |

## Getting started (after Phase 1)

Commands will be documented once the workspace is initialized. Expected flow:

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md).

## Security

See [SECURITY.md](SECURITY.md) and [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md).

## License

Proprietary — see [LICENSE](LICENSE). Third-party components retain their own licenses.
