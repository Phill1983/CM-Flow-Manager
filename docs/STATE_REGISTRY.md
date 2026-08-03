# State Registry

Living inventory of product and engineering state. Update after every meaningful phase.

## Implemented features

- Monorepo workspace with pnpm
- Electron application shell (secure defaults)
- Tailwind CSS v4 + shadcn primitives
- Typed preload API + IPC allowlist including PDF inspect/unlock PoC channels
- Localization catalogs for pl / uk / en
- Theme preference: light / dark / system
- `PdfUnlockService` + **`QpdfUnlockService`** (local qpdf 12.3.2)
- Unavailable fallback when qpdf binary is missing
- Synthetic PDF fixtures + PDF integration tests
- File naming helpers (`*_unlocked.pdf`)
- DEV-only Password Remover unlock panel + CLI PoC

## Partially implemented features

- PDF Password Remover product UX — Phase 3
- Activity history — empty honest placeholder
- Shared `packages/ui`, `logging`, `core` — still deferred
- Windows installer packaging / bundled qpdf — Phase 5

## Planned features (approved for roadmap, not built)

- Full Password Remover UX + batch (Phases 3–4)
- Global Command Palette (post-MVP / v0.2.x)
- Additional PDF/workflow modules after v0.1.0

## Known defects

- Duplicate local folder `D:\Projects\CM Flow Manager` may remain locked beside `cm-flow-manager`

## Technical debt

- Corepack global enable blocked without elevation on this machine
- qpdf vendor binary must be fetched per machine (`pnpm fetch:qpdf`)
- DEV unlock panel must be replaced by product UI in Phase 3

## Security decisions

- Hardened Electron defaults enforced
- No Node in renderer; sandbox + contextIsolation
- PDF unlock only via allowlisted IPC; no arbitrary process API
- Passwords not logged; unlock uses `--password-file` temp files
- No telemetry; local-only

## Dependency decisions

- pnpm@9.15.9 only
- qpdf 12.3.2 Apache-2.0 for unlock engine (dev vendor; prod bundle later)

## Release readiness

| Checkpoint | Status |
| --- | --- |
| Phase 0 docs | Done |
| Phase 1 shell | Done |
| Phase 1.5 UI foundation | Done |
| Phase 2 engine PoC | Done |
| Phase 3–5 MVP | Not started |
| v0.1.0 readiness | Not ready |
