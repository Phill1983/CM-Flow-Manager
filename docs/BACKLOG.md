# Backlog

Prioritized for post–Phase 0 work. Items marked **blocked** need user approval or tooling.

## Now (awaiting Phase 1 approval)

1. Enable pnpm (Corepack) and pin Node/pnpm versions.
2. Initialize monorepo `package.json` workspaces (`apps`, `packages`, `modules`).
3. Scaffold Electron + Vite + React + TypeScript strict config.
4. Configure ESLint, Prettier, Husky, lint-staged, Vitest.
5. Implement secure BrowserWindow + preload stub + IPC contracts package.
6. Placeholder Dashboard UI with localization skeleton.
7. Make CI workflows executable (typecheck/lint/test/build).
8. Create `develop` branch; push to GitHub when `gh` available.

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

## Parking lot (explicitly not scheduled)

- Other PDF tools, OCR, Audatex, ServiceFlow, auto-update, code signing certificates procurement.
