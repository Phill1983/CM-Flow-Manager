# Backlog

Prioritized for post–Phase 0 work. Items marked **blocked** need user approval or tooling.

## Now (Phase 1 complete)

1. ~~Enable pnpm (Corepack) and pin Node/pnpm versions.~~
2. ~~Initialize monorepo workspaces.~~
3. ~~Scaffold Electron + Vite + React + TypeScript strict config.~~
4. ~~Configure ESLint, Prettier, Vitest.~~
5. ~~Secure BrowserWindow + preload + IPC contracts.~~
6. ~~Placeholder Dashboard + localization skeleton.~~
7. ~~CI workflows updated for pnpm validation.~~
8. Push to GitHub when `gh` available (optional).

## Next (Phase 2)

1. Vendor qpdf Windows x64 binary with license files.
2. Implement `PdfUnlockService` + process runner.
3. Synthetic encrypted PDF fixtures.
4. Integration tests: correct/incorrect password, bad PDF.
5. Document concrete encryption limitations.

## Later (Phases 3–5)

1. Password Remover UI + queue + drag/drop.
2. Batch, cancel, collision handling, activity history (non-sensitive).
3. electron-builder NSIS installer + checksums.
4. Security review + release candidate.

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
