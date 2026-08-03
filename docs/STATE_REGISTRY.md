# State Registry

Living inventory of product and engineering state. Update after every meaningful phase.

## Implemented features

- Monorepo workspace with pnpm
- Electron application shell (secure defaults)
- Typed preload API: `window.cmFlow.getVersion()` only
- IPC allowlist: `app:getVersion`
- React navigation shell with placeholder pages
- Localization catalogs for pl / uk / en
- Theme preference: light / dark / system (shadcn `.dark` class)
- Tailwind CSS v4 + shadcn/ui primitives (Button, Card, Input, Label, Separator)
- `PdfUnlockService` port + unavailable mock
- Unit tests for IPC allowlist, PDF mock, locales, module metadata
- CI workflow present; GitHub remote: https://github.com/Phill1983/CM-Flow-Manager.git
- ESLint enforced with `--max-warnings 0`

## Partially implemented features

- PDF Password Remover — route/UI placeholder only; engine unavailable
- Activity history — empty honest placeholder
- Shared `packages/ui`, `logging`, `file-utils`, `core` — deferred until needed
- Windows installer packaging — deferred to Phase 5

## Planned features (approved for roadmap, not built)

- qpdf-backed unlock (Phase 2+)
- Full Password Remover UX + batch (Phases 3–4)
- Global Command Palette (post-MVP / v0.2.x)
- Additional PDF/workflow modules after v0.1.0

## Known defects

- Duplicate local folder `D:\Projects\CM Flow Manager` may remain locked beside `cm-flow-manager`

## Technical debt

- Corepack global enable blocked on this machine; document elevation if desired
- Placeholder packages from ADR-002 (`ui`, `logging`, …) not scaffolded yet
- No Playwright E2E yet (Phase 3+)

## Security decisions

- Hardened Electron defaults enforced in main process
- No Node in renderer; sandbox + contextIsolation
- Minimal preload; no FS/shell IPC in Phase 1
- No telemetry; local-only
- No password handling UI yet (engine unavailable)

## Dependency decisions

- pnpm@9.15.9 only (`pnpm-lock.yaml`; no npm lockfile)
- electron-vite + Electron 34 + React 19 + Vite 6
- Custom lightweight i18n (no i18next yet)
- PDF engine still planned as qpdf (ADR-003); mock only in Phase 1

## Release readiness

| Checkpoint | Status |
| --- | --- |
| Phase 0 docs | Done |
| Phase 1 shell | Done |
| Phase 2 engine PoC | Not started |
| Phase 3–5 MVP | Not started |
| v0.1.0 readiness | Not ready |
