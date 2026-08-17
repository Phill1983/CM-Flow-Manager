# State Registry

Living inventory of product and engineering state. Update after every meaningful phase.

## Implemented features

- Monorepo workspace with pnpm
- Electron application shell (secure defaults)
- Tailwind CSS v4 + shadcn primitives
- Typed preload API + IPC allowlist (PDF dialogs, inspect, unlock, prepareSource, openFolder)
- Localization catalogs for pl / uk / en (Phase 3A Password Remover strings)
- Theme preference: light / dark / system
- `PdfUnlockService` + **`QpdfUnlockService`** (local qpdf 12.3.2)
- Unavailable fallback when qpdf binary is missing
- Synthetic PDF fixtures + PDF integration tests
- File naming helpers (`*_unlocked.pdf` with collision-safe resolution)
- **Phase 3A Password Remover product UI** (single-file; drag/drop; progress; localized errors)
- **Phase 3.5** Windows Alpha packaging (NSIS + portable, bundled qpdf)
- **Phase 3.6** Update foundation (GitHub Releases, Settings → Updates, SHA-256)
- **Exact UI asset-pack** (Inter, CM tokens, module/hero rasters; remaining polish in TECH_DEBT)

## Partially implemented features

- Activity history — empty honest placeholder
- Shared `packages/ui`, `logging`, `core` — still deferred
- Phase 3B plate/folder resolution — interfaces only; implementation deferred
- Code signing — later

## Planned features (approved for roadmap, not built)

- Phase 3B: plate extract → normalize → configured-root folder resolve (after confirmation)
- Password Remover Phase 4: batch unlock (distinct from repair 4A+)
- **Repair track 4A+:** Estimate Quality Review (Process A) and Invoice Validation (Process B) — docs foundation in 4A.1; real-document field inventory draft in 4A.2; engines later
- Global Command Palette (post-MVP / v0.2.x)
- OCR and additional PDF/workflow modules after v0.1.0
- Authenticode-signed updates + CI release publish automation

## Packages / IPC (updater)

| Surface | Status |
| --- | --- |
| `packages/app-updater` | Done (Phase 3.6 foundation); runtime exports → `dist/*.js` |
| `packages/ipc-contracts` `update:*` | Done |
| `apps/desktop/src/main/updater/*` | Done — `autoUpdater` via `createRequire` |
| Settings → Updates UI | Done |
| Desktop main bundle guard | Done — `assert-main-bundle.mjs`; workspace TS packages bundled |

## Documentation — repair domain (Phase 4A.1–4A.2)

| Doc | Status |
| --- | --- |
| `docs/BUSINESS_PROCESSES.md` | Done (Phase 4A.1) |
| `docs/knowledge/*` | Done (Phase 4A.1) |
| Conceptual engines in `ARCHITECTURE.md` | Documented only — not implemented |
| `docs/discovery/*` (Phase 4A.2) | **Done (approved)** — field inventory / patterns / risks; sanitized samples; no parsers |

## Known defects

- Duplicate local folder `D:\Projects\CM Flow Manager` may remain locked beside `cm-flow-manager`

## Technical debt

Canonical registry: **`docs/TECH_DEBT.md`**. Keep that file current; this section is an index only.

- TD-001–TD-007 — UI fidelity; unused fuller pack `cm-flow-manager-ui-assets/`; leftover extracts / unused Ubuntu
- TD-008 — qpdf `incorrect_password` integration assertion
- TD-009 — no Playwright / RTL UI automation
- TD-010 — Corepack elevation on this machine
- TD-011–TD-012 — unsigned Alpha / portable update limits

## Security decisions

- Hardened Electron defaults enforced
- No Node in renderer; sandbox + contextIsolation
- PDF unlock only via allowlisted IPC; no arbitrary process API
- `shell:openFolder` opens only validated existing folders (or parent of existing file)
- Passwords not logged; unlock uses `--password-file` temp files; UI clears password after success/reset/file change
- No telemetry; local-only document processing
- Narrow network exception (ADR-007): GitHub update metadata + installer bytes only; SHA-256 before install; no kill switch

## Dependency decisions

- pnpm@9.15.9 only
- qpdf 12.3.2 Apache-2.0 for unlock engine
- Phase 3.6: `electron-updater` for GitHub Releases transport (ADR-007)
- No new npm dependencies added in Phase 3A

## Release readiness

| Checkpoint | Status |
| --- | --- |
| Phase 0 docs | Done |
| Phase 1 shell | Done |
| Phase 1.5 UI foundation | Done |
| Phase 2 engine PoC | Done |
| Phase 3A Password Remover UI | Done |
| Phase 3.5 Alpha packaging | Done |
| Phase 3.6 updater foundation | Done |
| Updater runtime regression (TS external / CJS interop) | Closed (`c55acab` + owner verification 2026-08-12) |
| Exact UI asset-pack | Accepted for commit 2026-08-17; polish in TECH_DEBT |
| Phase 3B–5 MVP | Not started (3B deferred; 4B next) |
| v0.1.0 readiness | Not ready |
