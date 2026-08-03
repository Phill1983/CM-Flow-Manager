# Tech Stack

## Approved stack (Phase 0 decision)

| Layer | Choice | Notes |
| --- | --- | --- |
| Desktop runtime | Electron | Windows-first packaging |
| UI | React + TypeScript | Strict TS |
| Bundler | Vite | Fast renderer toolchain |
| Styling | Tailwind CSS + shadcn/ui | Practical component baseline |
| Client state | Zustand | Lightweight queue/UI state |
| Packaging | electron-builder | NSIS installer + later portable |
| Unit tests | Vitest | |
| UI tests | React Testing Library | |
| E2E | Playwright | Selected smoke paths |
| Quality | ESLint, Prettier, Husky, lint-staged | |
| CI | GitHub Actions | After GitHub remote exists |
| PDF unlock | **qpdf** (bundled binary) | See PDF_ENGINE_EVALUATION.md |

## Package manager

**Preferred:** pnpm (monorepo-friendly, strict).  
**Phase 0 machine status:** Node `v22.19.0`, npm `10.9.3`, pnpm **not installed**, yarn **not found**.  
Phase 1 should install pnpm via Corepack or `npm i -g pnpm` and pin the version.

## Dependency policy

Before adding any dependency:

1. Explain necessity.
2. Verify maintenance activity.
3. Check license vs proprietary distribution.
4. Evaluate Electron compatibility.
5. Reject default telemetry / remote file upload.

Record decisions in `DECISIONS.md` and ADRs when architectural.

## Initial license posture for stack components

| Component | Typical license | Redistribution note |
| --- | --- | --- |
| Electron | MIT | OK with attribution |
| React | MIT | OK |
| Vite / Vitest | MIT | OK |
| Tailwind | MIT | OK |
| Zustand | MIT | OK |
| qpdf | Apache-2.0 | Bundle OK with NOTICE/license copy |
| MuPDF / mupdf.js | AGPL or commercial | **Rejected** for proprietary app without commercial license |
| Upstream pdf-lib | MIT | **Insufficient** for decrypt/unlock MVP |

## Not installed in Phase 0

No `package.json` dependency tree has been created yet. Installing the full stack is deferred to Phase 1 by design.
