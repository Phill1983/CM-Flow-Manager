# Tech Stack

## Approved stack (Phase 0 decision)

| Layer | Choice | Notes |
| --- | --- | --- |
| Desktop runtime | Electron | Windows-first packaging |
| UI | React + TypeScript | Strict TS |
| Bundler | Vite via electron-vite | Main/preload/renderer |
| Styling | CSS variables in Phase 1; Tailwind + shadcn/ui when UI deepens | See UI_DIRECTION.md |
| Client state | Zustand available; minimal use in Phase 1 shell | Queue state in Phase 3+ |
| Packaging | electron-builder planned Phase 5 | `pnpm build` produces `apps/desktop/out` now |
| Unit tests | Vitest | |
| UI tests | React Testing Library | Later phases |
| E2E | Playwright | Later phases |
| Quality | ESLint, Prettier | Husky deferred |
| CI | GitHub Actions (pnpm) | Runs when remote exists |
| PDF unlock | **qpdf** planned; Phase 1 unavailable mock only | ADR-003 |

## Package manager

**Required:** pnpm **9.15.9** via the root `packageManager` field.  
**Lockfile:** only `pnpm-lock.yaml` — never create or retain `package-lock.json`.  
**Corepack:** preferred. If `corepack enable` fails with EPERM under `C:\Program Files\nodejs` on Windows, install the same pnpm version in the user profile and keep the pin.

| Tool | Phase 1 machine |
| --- | --- |
| Node.js | v22.19.0 |
| pnpm | 9.15.9 |
| npm | Global tooling only — do not manage workspace deps with npm |

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

## Phase 1 stack notes

Application dependencies are installed under pnpm workspaces. Tailwind/shadcn are deferred until deeper UI work; Phase 1 shell uses compact CSS aligned with `docs/UI_DIRECTION.md`.
