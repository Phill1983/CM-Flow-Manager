# Changelog

All notable changes to CM Flow Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 1 application shell (`0.0.1`): Electron + React + Vite monorepo.
- Phase 1.5: Tailwind CSS v4 + shadcn/ui (Button, Card, Input, Label, Separator).
- Phase 2: `QpdfUnlockService` using official qpdf 12.3.2; synthetic fixtures; PDF integration tests.
- Allowlisted IPC for PDF inspect/unlock PoC and PDF file dialogs.
- **Phase 3A:** production Password Remover UI (single-file drag/drop, inspect, unlock, open folder).
- IPC: `pdf:prepareSource`, `shell:openFolder`; Phase 3B interface stubs only.

### Changed

- Workspace path standardized to `D:\Projects\cm-flow-manager`.
- Package manager fixed to pnpm `9.15.9` via `packageManager` (lockfile: `pnpm-lock.yaml` only).
- Shell styles migrated from handcrafted CSS to Tailwind utility classes.
- Lint policy: zero warnings (`eslint --max-warnings 0`).
- DEV-only unlock panel replaced by product Password Remover UI.
- Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push.

### Notes

- Phase 3B (plate → folder) not started.
- Batch processing still Phase 4 (`0.0.4`).
- qpdf is not yet bundled into a Windows installer.
- GitHub remote: https://github.com/Phill1983/CM-Flow-Manager.git

## Planned version markers

| Version | Meaning |
| --- | --- |
| 0.0.1 | Project scaffold / application shell |
| 0.0.2 | PDF engine proof of concept |
| 0.0.3 | Single-file Password Remover UI |
| 0.0.4 | Batch processing |
| 0.1.0 | First usable Windows release |

[Unreleased]: https://github.com/OWNER/cm-flow-manager/compare/HEAD...HEAD
