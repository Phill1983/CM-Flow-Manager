# State Registry

Living inventory of product and engineering state. Update after every meaningful phase.

## Implemented features

- None (planning package only).

## Partially implemented features

- None.

## Planned features (approved for roadmap, not built)

- Electron application shell with secure preload/IPC
- Dashboard / Settings / About placeholders
- Localization infrastructure (pl/uk/en)
- PDF Password Remover (single then batch)
- Local rotating logs
- Windows installer packaging
- CI validation workflows (stubs exist; runnable after Phase 1)

## Known defects

- None in application code (no app yet).
- Workspace directory name typo: `CM Folw Manager` vs product name Flow.

## Technical debt

- GitHub remote missing.
- CI workflows reference scripts that do not exist until Phase 1 — expected.
- i18n library choice deferred to Phase 1 install checklist.

## Security decisions

- Hardened Electron defaults required (ADR-004).
- Local-only processing; no telemetry (ADR-005).
- No password cracking ever.
- Proprietary project license until owner selects OSS.

## Dependency decisions

- Stack per ADR-001 / TECH_STACK.md.
- PDF engine: qpdf (ADR-003).
- MuPDF rejected (AGPL).
- pdf-lib rejected as unlock engine.

## Release readiness

| Checkpoint | Status |
| --- | --- |
| Phase 0 docs | Done |
| Phase 1 shell | Not started |
| Phase 2 engine PoC | Not started |
| Phase 3–5 MVP | Not started |
| v0.1.0 readiness | Not ready |
