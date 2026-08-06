# Changelog

All notable changes to CM Flow Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 1 application shell (`0.0.1`): Electron + React + Vite monorepo.
- Phase 1.5: Tailwind CSS v4 + shadcn/ui (Button, Card, Input, Label, Separator).
- Phase 2: `QpdfUnlockService` using official qpdf 12.3.2; synthetic fixtures; PDF integration tests.
- Allowlisted IPC for PDF inspect/unlock and PDF file dialogs.
- **Phase 3A:** production Password Remover UI (single-file drag/drop, inspect, unlock, open folder).
- IPC: `pdf:prepareSource`, `shell:openFolder`; Phase 3B interface stubs only.
- CM brand mark (sidebar + window icon); sidebar/window title **Flow Manager**.
- **Phase 3.5 Alpha:** electron-builder NSIS + portable; bundled qpdf; `pnpm pack:win` → `release/`.
- **Phase 3.6 (in progress):** Update & Version Management Foundation — `@cm-flow-manager/app-updater`, GitHub Releases + `version-manifest.json`, Settings → Updates, `update:*` IPC, SHA-256 integrity (ADR-007).

### Changed

- Workspace path standardized to `D:\Projects\cm-flow-manager`.
- Package manager fixed to pnpm `9.15.9` via `packageManager` (lockfile: `pnpm-lock.yaml` only).
- Shell styles migrated from handcrafted CSS to Tailwind utility classes.
- Lint policy: zero warnings (`eslint --max-warnings 0`).
- DEV-only unlock panel replaced by product Password Remover UI.
- Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push.
- Native End-to-End Verification + Packaged EXE primary verification (from Phase 3.5).
- ADR-005 local-only model: narrow exception for GitHub update metadata/installer bytes only (no document upload).

### Notes

- Phase 3B (plate → folder) deferred.
- Batch processing still later (`0.0.4` / Phase 4).
- Alpha builds are **unsigned** (SmartScreen may warn); Authenticode update verify stubbed.
- Default update channel: **alpha**. Portable in-place auto-install is limited (check/notify / manual replace).
- No remote kill switch; offline use remains fully supported.
- GitHub remote: https://github.com/Phill1983/CM-Flow-Manager.git

## Planned version markers

| Version | Meaning |
| --- | --- |
| 0.0.1 | Project scaffold / application shell |
| 0.0.2 | PDF engine proof of concept |
| 0.0.3 | Single-file Password Remover UI |
| 0.1.0-alpha | First standalone Windows Alpha (installer + portable) |
| 0.0.4 / later | Batch processing |
| 0.1.0 | First usable signed/hardened Windows release |

[Unreleased]: https://github.com/OWNER/cm-flow-manager/compare/HEAD...HEAD
