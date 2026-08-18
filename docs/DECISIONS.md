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
| 2026-08-05 | Phase 3.5 Alpha packaging (electron-builder NSIS+portable, bundled qpdf); Packaged EXE primary verification | DEVELOPMENT_WORKFLOW.md / RELEASE_PROCESS.md |
| 2026-08-05 | Keep `signAndEditExecutable: false`; embed Windows icon/VERSIONINFO via afterPack + `rcedit` (avoids winCodeSign symlink failures). Authenticode signing still required to remove “Unknown publisher”. | electron-builder.yml / scripts/after-pack-win.mjs |
| 2026-08-05 | NSIS shortcuts use `$INSTDIR\\resources\\icon.ico` (not `$appExe,0`) to avoid Windows icon-cache sticking on Electron after upgrades. | apps/desktop/resources/installer.nsh |
| 2026-08-05 | Phase 3.6 updater foundation: GitHub Releases + `version-manifest.json`, `@cm-flow-manager/app-updater`, SHA-256 required, Authenticode stubbed, no kill switch; default channel `alpha` | ADR-007 |
| 2026-08-05 | Add `electron-updater` dependency for NSIS GitHub Releases transport (portable auto-install limited) | ADR-007 / apps/desktop/package.json |
| 2026-08-06 | Repair workflows split: Process A Estimate QA (pre-approval) vs Process B Invoice Validation (post-invoice); knowledge partitions + AI candidate policy (no auto-promotion) | BUSINESS_PROCESSES.md / docs/knowledge/* |
| 2026-08-06 | Repair track phases labeled **4A.x–4F** to avoid collision with Password Remover “Phase 4” batch unlock | ROADMAP.md / BACKLOG.md |
| 2026-08-11 | Phase 4A.2 evidence: Process B inventory from three local pairs; scan estimates = OCR-required / not field-confirmed; no field inference from images | docs/discovery/* |
| 2026-08-11 | Audatex labour prints document-local `N JC = 1 RBG` (observed 10 and 12); **not** a universal rule for all estimate systems; never hardcode a single N | docs/discovery/PHASE_4A2_DOCUMENT_INVENTORY.md |
| 2026-08-11 | Real customer PDFs / unsanitized extracts stay out of Git; discovery samples must be sanitized | docs/discovery/samples/ |
| 2026-08-11 | Electron main must **bundle** workspace packages that export `.ts` (`externalizeDepsPlugin` exclude). `electron-updater` is CJS — load `autoUpdater` via `createRequire`, not ESM named import | apps/desktop/electron.vite.config.ts / electron-updater-adapter.ts |
| 2026-08-12 | UI brand adaptation from chwalibog-motors.pl: Ubuntu + `#3292DC` / `#022662` / `#FCAF17`; local `@fontsource/ubuntu` (CSP-safe); productivity shell only | docs/UI_DIRECTION.md |
| 2026-08-12 | Shell hybrid: white top bar + navy sidebar + `sl_content_bg.jpg` main surface; cards stay opaque for forms | docs/UI_DIRECTION.md |
| 2026-08-12 | UI Target: REFERENCE A dashboard + REFERENCE B tokens (`#0B1F4A` / `#143A7B` / `#FFC107`); empty states (no fake data); yellow active-nav rail; Ubuntu keeps scale from B | docs/UI_DIRECTION.md |
| 2026-08-12 | Exact UI: CM asset pack + `01-dashboard-target.png` are visual source of truth; Inter; module/hero raster assets; remaining fidelity → `docs/TECH_DEBT.md` | docs/UI_DIRECTION.md / TECH_DEBT.md |
| 2026-08-17 | Technical debt has a dedicated registry (`docs/TECH_DEBT.md`) and an always-on agent rule | `.cursor/rules/11-tech-debt.mdc` |
| 2026-08-17 | Phase 4B: canonical repair document in `packages/repair-domain`; money = bigint minor units; JC/RBG conversion is document-local; documentType ≠ sourceFormat | docs/CANONICAL_REPAIR_DOCUMENT_MODEL.md |
| 2026-08-17 | Phase 3.7 inserted before 4C: local PDF Split (extract selected pages into one PDF) and Merge via existing qpdf; page order preserved; duplicates collapsed; encrypted merge fails wholly | docs/PDF_SPLIT_MERGE.md |
| 2026-08-17 | Page thumbnails: `pdfjs-dist` 4.x (Apache-2.0) in the renderer only; privileged `cmflow-pdf://` token protocol in main; qpdf is not used for rendering | docs/PDF_SPLIT_MERGE.md / SECURITY_MODEL.md |
| 2026-08-17 | **MINIMUM NECESSARY CHANGE / ANTI-SPAGHETTI PRINCIPLE** is permanent governance: reuse/extend first; Complexity Review in every implementation Phase Report | `.cursor/rules/12-minimal-change.mdc` / DEVELOPMENT_WORKFLOW.md |
| 2026-08-18 | **Emergency PDF Password Recovery** recorded as an unnumbered **future** phase (authorized workflow, not a generic cracker). Not v0.1.0; not next after 3.7; does not block 4C. No engine chosen. Governance/legal questions remain open. Do not implement. | `docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md` |
| 2026-08-18 | Phase **4C.1**: `@cm-flow-manager/repair-extraction` over extracted text (qpdf is not a text extractor; pdfjs-dist not added to Node to avoid worker/canvas). Two concrete parsers, no plugin registry. JC/RBG is document-local. | docs/REPAIR_DOCUMENT_EXTRACTION.md |

Update this file when making durable technical choices.
