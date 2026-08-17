# Architecture

## Goals

- Secure Electron desktop shell for Windows-first delivery.
- Replaceable PDF engine behind an adapter interface.
- Module isolation so PDF Password Remover (and future tools) do not couple domain logic to React/Electron.
- Clear packages for IPC contracts, logging, file utilities, and shared UI.

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
│   ├── core/                     # Shared domain primitives / result types
│   ├── ui/                       # Design-system components
│   ├── ipc-contracts/            # Channel names + Zod/TS schemas
│   ├── file-utils/               # Path safety, output naming
│   ├── logging/                  # Local rotating logs
│   ├── pdf-engine/               # PdfUnlockService adapter + qpdf impl
│   └── app-updater/              # Update policy, channels, manifest validation (no Electron)
├── modules/
│   └── pdf-password-remover/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── ui/
│       └── tests/
├── docs/
├── scripts/
└── assets/
```

### Structure adjustments vs initial proposal

- Phase 1 scaffolds only packages needed for the shell: `ipc-contracts`, `pdf-engine`, and module `pdf-password-remover`.
- Phase 3.6 adds `packages/app-updater` (pure domain/application); Electron adapters live under `apps/desktop/src/main/updater/`.
- `core`, `ui`, `file-utils`, and `logging` remain planned and will be added when first required (avoid empty package noise).
- Phase 4B adds `packages/repair-domain` — pure canonical repair-document types (no Electron/React/FS/parsers).
- Package manager is **pnpm@9.15.9** only (`packageManager` field + `pnpm-lock.yaml`).

## Process boundaries

```text
Renderer (React)
    │  typed API only
Preload (contextBridge)
    │  allowlisted IPC
Main process
    │  validates paths & requests
Application use cases (modules/*/application)
    │
PdfUnlockService (packages/pdf-engine)
    │
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
interface PdfUnlockService {
  inspect(filePath: string): Promise<PdfInspectionResult>;
  unlock(input: {
    sourcePath: string;
    destinationPath: string;
    password: string;
  }): Promise<PdfUnlockResult>;
}
```

Domain and application layers must not import Electron, React, or Node filesystem APIs directly. Infrastructure adapters implement ports.

## UI information architecture

```text
CM Flow Manager
├── Dashboard
├── PDF Tools
│   └── Password Remover   ← only functional PDF module in 0.1.0
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

## Future repair-document architecture

Phase **4B** implements `@cm-flow-manager/repair-domain` (`CanonicalRepairDocument`).  
Parsers and engines remain later phases and **must depend on** this package — never the reverse.

| Component | Status |
| --- | --- |
| `CanonicalRepairDocument` | **4B** — approved |
| `EstimateQaEngine` | Process A — later (4F) |
| `InvoiceValidationEngine` | Process B — later (4D) |
| `PartsIntelligenceService` | later (4E) |

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
