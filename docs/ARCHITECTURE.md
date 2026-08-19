# Architecture

## Goals

- Secure Electron desktop shell for Windows-first delivery.
- Replaceable PDF engine behind an adapter interface.
- Module isolation so PDF Password Remover (and future tools) do not couple domain logic to React/Electron.
- Clear packages for IPC contracts, file utilities, and the PDF engine. Add `core` / `ui` / `logging` only when a second real consumer exists.

## High-level structure

```text
cm-flow-manager/
├── apps/desktop/                 # Composition root
│   └── src/
│       ├── main/                 # Electron main (privileged)
│       ├── preload/              # Minimal typed bridge
│       ├── renderer/             # React UI
│       └── shared/               # Types shared within the app shell
├── packages/
│   ├── ipc-contracts/            # Channel names + payloads
│   ├── file-utils/               # Path safety, output naming
│   ├── pdf-engine/               # PdfEngineService + qpdf adapter
│   ├── app-updater/              # Update policy / manifest (no Electron)
│   ├── repair-domain/            # Phase 4B canonical model
│   ├── repair-extraction/        # Phase 4C.1 text → CanonicalRepairDocument
│   └── pdf-text-layer/           # Phase 4C.2 PDF.js text-layer adapter
├── modules/
│   ├── pdf-password-remover/     # flat src helpers; UI in desktop
│   └── pdf-split-merge/          # flat src helpers; UI in desktop
├── docs/
├── scripts/
└── assets/
```

### Structure adjustments vs initial proposal

- Phase 1 scaffolds only packages needed for the shell: `ipc-contracts`, `pdf-engine`, and module `pdf-password-remover`.
- Phase 3.6 adds `packages/app-updater` (pure domain/application); Electron adapters live under `apps/desktop/src/main/updater/`.
- `core`, `ui`, and `logging` remain **uncreated** until a second real consumer exists (avoid empty package noise). `file-utils` already exists.
- Phase 4B adds `packages/repair-domain` — pure canonical repair-document types (no Electron/React/FS/parsers).
- Phase 4C.1 adds `packages/repair-extraction` — deterministic Audatex + shop invoice parsers over extracted text; depends on `repair-domain`. Desktop UI is not wired. qpdf is not used for text extraction.
- Phase 4C.2 adds `packages/pdf-text-layer` — PDF.js `getTextContent` adapter (same `pdfjs-dist` 4.10.38 as thumbnails). Parsers stay Electron-free. Production path: PDF bytes → one adapter → existing parser.
- Phase 3.7 extends `pdf-engine` with `extractPages` / `mergePdfs` and adds module `pdf-split-merge`. Password Remover remains on the same qpdf binary. Page thumbnails use PDF.js in the renderer via an opaque `cmflow-pdf://` token protocol (qpdf is not used for rendering).
- Package manager is **pnpm@9.15.9** only (`packageManager` field + `pnpm-lock.yaml`).

## Process boundaries

```text
Renderer (React + PDF.js thumbnails)
    │  typed API only (preview tokens, never filesystem)
Preload (contextBridge)
    │  allowlisted IPC
Main process
    │  validates paths & requests; preview token registry
    │  cmflow-pdf:// serves allowlisted files to PDF.js
Application use cases (modules/*/application)
    │
PdfEngineService (packages/pdf-engine)
    │  inspect / unlock / extractPages / mergePdfs
qpdf binary (spawn argv array — no shell)
```

### Updater flow (Phase 3.6)

```text
Settings → Updates (renderer)
    │  update:* IPC
Main updater adapters
    │  electron-updater → GitHub Releases (installer bytes)
    │  fetch version-manifest.json (policy / channel / digests)
@cm-flow-manager/app-updater
    │  validate manifest, evaluate policy, compare versions
SHA-256 integrity (required when digest present)
    │  Authenticode stub until signing exists
Install (NSIS) / notify or manual replace (portable)
```

Documents never leave the machine; network use is limited to GitHub update metadata and installer assets (ADR-005 exception / ADR-007).

## Key interfaces (conceptual)

```ts
interface PdfEngineService {
  inspect(filePath: string): Promise<PdfInspectionResult>;
  unlock(input: { sourcePath: string; destinationPath: string; password: string }): Promise<PdfUnlockResult>;
  extractPages(input: { sourcePath: string; destinationPath: string; pageSelection: string }): Promise<PdfExtractPagesResult>;
  mergePdfs(input: { sourcePaths: readonly string[]; destinationPath: string }): Promise<PdfMergeResult>;
}
```

Domain and application layers must not import Electron, React, or Node filesystem APIs directly. Infrastructure adapters implement ports.

## UI information architecture

```text
CM Flow Manager
├── Dashboard
├── PDF Tools
│   ├── Password Remover
│   └── Split / Merge PDF
├── Activity
├── Settings
│   └── Updates            ← Phase 3.6 opt-in GitHub updater
└── About
```

## Security architecture

Summarized in `SECURITY_MODEL.md` and ADR-004. Hard rule: renderer never receives raw filesystem or shell capabilities.

## Error model

Typed categories (IncorrectPasswordError, InvalidPdfError, …) produced by infrastructure and mapped to localization keys in the UI layer.

## Extensibility

Future modules register:

1. route / navigation entry;
2. IPC contracts (if needed);
3. application use cases;
4. optional engine adapters.

No rewrite of the shell should be required for a new module that follows these ports.

## Minimum necessary change

Prefer **REUSE → EXTEND → LOCAL CHANGE → NEW ABSTRACTION** (`.cursor/rules/12-minimal-change.mdc`). The IPC path renderer → preload → main → `PdfEngineService` → qpdf is the justified security chain; extra facades need a present-day reason. Do not create `packages/ui`, `packages/core`, or `packages/logging` until something actually needs them.

## Future repair-document architecture

Phase **4B** implements `@cm-flow-manager/repair-domain` (`CanonicalRepairDocument`).  
Phase **4C.1** implements `@cm-flow-manager/repair-extraction` (text → canonical).  
Phase **4C.2** implements `@cm-flow-manager/pdf-text-layer` (PDF bytes → page-aware text).  
Phase **4D** implements `@cm-flow-manager/repair-reconciliation` (`validateInvoiceAgainstEstimate`).  
Phase **4E.1** implements `@cm-flow-manager/repair-parts-intelligence` (`analyzePartRelationCandidates`) — advisory candidates for unmatched part lines only. Engines still come later and **must depend on** the domain package — never the reverse.

| Component | Status |
| --- | --- |
| `CanonicalRepairDocument` | **4B** — approved |
| Repair document extraction | **4C.1** parsers (approved) + **4C.2** PDF.js adapter (approved) |
| `InvoiceValidationEngine` | **4D** — `@cm-flow-manager/repair-reconciliation` (approved on main) |
| `PartsIntelligenceService` | **4E.1** PoC — `@cm-flow-manager/repair-parts-intelligence` (pending approval) |
| `EstimateQaEngine` | Process A — later (4F) |

```text
Estimate doc ──► EstimateQaEngine ──► advisory findings (Process A)
Approved estimate + Invoice ──► InvoiceValidationEngine ──► diffs (Process B)
                              ▲
                 PartsIntelligenceService
                              ▲
              RepairKnowledgeRepository ◄── HumanReviewWorkflow
                              ▲
                 KnowledgeCandidateService (candidates only)
```

Password Remover and the updater remain unchanged by this conceptual track.
