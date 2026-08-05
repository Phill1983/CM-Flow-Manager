# Backlog

Prioritized for post–Phase 0 work. Items marked **blocked** need user approval or tooling.

## Done

1. ~~Phase 1 application shell.~~
2. ~~Phase 1.5 Tailwind + shadcn foundation.~~
3. ~~Phase 2 qpdf PoC + fixtures + allowlisted IPC.~~
4. ~~Governance delivery cycle (report → approval → commit → push).~~

## Now (Phase 3.5 — Alpha packaging)

1. electron-builder NSIS installer + portable Windows x64.
2. Bundle qpdf + Apache-2.0 NOTICE into app resources.
3. `pnpm pack:win` → `release/` + SHA256 + notes.
4. Packaged EXE as primary verification target (governance).

## Next (Phase 3B — deferred / blocked on owner approval)

1. Implement `VehiclePlateExtractor` (PDF text layer only; no OCR).
2. Implement `PlateNormalizer`.
3. Implement `CaseFolderResolver` against **user-configured root folders only**.
4. Propose destination after unlock; never silent save; multi-match chooser; Save As fallback.
5. Settings UI for configured root folders.

## Later (Phases 4–5)

1. Batch unlock with shared password + queue controls.
2. Cancel in-flight unlock when technically feasible.
3. Activity history (non-sensitive metadata only).
4. Code signing + hardened release candidate.
5. Security review for public/signed release.

## Post-MVP / v0.2.x

### Global Command Palette

- **Target:** post-MVP / v0.2.x
- **Priority:** Medium
- **Do not implement in Phase 1–5 / v0.1.0**

Suggested shortcuts:

- `Ctrl+Shift+P`
- `Ctrl+K`

Planned actions:

- Open Dashboard
- Open PDF Password Remover
- Select PDF files
- Open Activity
- Open Settings
- Open output folder
- Change language
- Toggle theme
- Search available modules

## Parking lot (explicitly not scheduled)

- Other PDF tools, OCR, Audatex, ServiceFlow, auto-update, code signing certificates procurement.
- Full-computer filesystem scans for plates (forbidden by product rules).
