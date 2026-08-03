# Changelog

All notable changes to CM Flow Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 1 application shell (`0.0.1`): Electron + React + Vite monorepo.
- Secure preload API and IPC allowlist (`app:getVersion`).
- Navigation shell with Dashboard and Password Remover placeholders.
- Localization skeleton (Polish, Ukrainian, English).
- Light/dark/system theme preparation.
- `PdfUnlockService` contract with explicit unavailable mock (no qpdf yet).
- ESLint, Prettier, Vitest, and pnpm-based CI workflow.
- UI direction doc; Command Palette backlog item for post-MVP / v0.2.x.

### Changed

- Workspace path standardized to `D:\Projects\cm-flow-manager`.
- Package manager fixed to pnpm `9.15.9` via `packageManager` (lockfile: `pnpm-lock.yaml` only).

### Notes

- No PDF unlocking in this release line yet — Phase 2.
- GitHub remote still not created (`gh` unavailable).

## Planned version markers

| Version | Meaning |
| --- | --- |
| 0.0.1 | Project scaffold / application shell |
| 0.0.2 | PDF engine proof of concept |
| 0.0.3 | Single-file Password Remover UI |
| 0.0.4 | Batch processing |
| 0.1.0 | First usable Windows release |

[Unreleased]: https://github.com/OWNER/cm-flow-manager/compare/HEAD...HEAD
