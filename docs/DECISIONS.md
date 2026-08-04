# Decisions Log

Short index of decisions. Detailed rationale lives in ADRs.

| Date | Decision | ADR / Doc |
| --- | --- | --- |
| 2026-08-03 | Electron + React + TS + Vite stack | ADR-001 |
| 2026-08-03 | Monorepo: apps / packages / modules | ADR-002 |
| 2026-08-03 | PDF unlock via bundled qpdf adapter | ADR-003 |
| 2026-08-03 | Hardened Electron security defaults | ADR-004 |
| 2026-08-03 | Local-only processing; no telemetry | ADR-005 |
| 2026-08-03 | Conventional commits; main/develop model | ADR-006 |
| 2026-08-03 | Project license: proprietary until owner chooses OSS | LICENSE |
| 2026-08-03 | Prefer pnpm via Corepack; pin `packageManager`; only `pnpm-lock.yaml` | TECH_STACK.md / Phase 1 |
| 2026-08-03 | Reject MuPDF for MVP due to AGPL without commercial license | PDF_ENGINE_EVALUATION.md |
| 2026-08-03 | Reject pdf-lib as primary decrypt engine | PDF_ENGINE_EVALUATION.md |
| 2026-08-03 | GitHub remote: https://github.com/Phill1983/CM-Flow-Manager.git | PROJECT_STATUS.md |
| 2026-08-03 | Workspace path `D:\Projects\cm-flow-manager` (product name remains CM Flow Manager) | PROJECT_STATUS.md |
| 2026-08-03 | UI: shadcn/ui + dashboard-01 as reference only; productivity layout | docs/UI_DIRECTION.md |
| 2026-08-03 | Command Palette deferred to post-MVP / v0.2.x | BACKLOG.md / ROADMAP.md |
| 2026-08-03 | Phase 1 IPC minimal: `app:getVersion` only; PdfUnlockService unavailable mock | ADR-004 / Phase 1 |
| 2026-08-03 | Phase 1.5: Tailwind v4 + minimal shadcn; zero ESLint warnings | UI_DIRECTION.md / TECH_STACK.md |
| 2026-08-03 | Phase 2: qpdf 12.3.2 via `--password-file`; DestinationExists on clash | ADR-003 / PDF_ENGINE_EVALUATION.md |
| 2026-08-03 | Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push | DEVELOPMENT_WORKFLOW.md / rules |
| 2026-08-04 | Phase 3A: product Password Remover UI; IPC `pdf:prepareSource` + `shell:openFolder`; Phase 3B contracts only | PRODUCT_REQUIREMENTS.md / BACKLOG.md |
| 2026-08-04 | Native End-to-End Verification mandatory for Electron/native surfaces; Phase Reports must separate automated vs native vs not verified | DEVELOPMENT_WORKFLOW.md / rules |

Update this file when making durable technical choices.
