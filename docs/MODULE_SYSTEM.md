# Module System

## Intent

Feature capabilities live in `modules/*` with hexagonal boundaries. Shared platform code lives in `packages/*`. The Electron app in `apps/desktop` composes modules and wires adapters.

## Current layout (as shipped)

Password Remover and Split/Merge use a **flat `src/`** of domain helpers. UI lives in `apps/desktop`. Do **not** scaffold empty `domain/` / `application/` / `infrastructure/` / `ui/` folders until those layers have real code.

## Full hexagonal anatomy (when a module actually needs it)

```text
modules/<module-name>/
├── domain/           # Entities, value objects, domain errors — no React/Electron
├── application/      # Use cases / ports
├── infrastructure/   # Adapters (PDF engine, FS via injected ports)
├── ui/               # React screens/components for this module only
└── tests/
```

## Rules

1. Domain must not import React, Electron, Vite, or Node built-ins.
2. UI may call application facades or IPC clients — never spawn processes.
3. Cross-module imports go through published package APIs, not deep relative paths into another module’s internals.
4. IPC channel names and payloads are defined in `packages/ipc-contracts`.
5. A module is “registered” when it contributes navigation + routes + any main-process handlers.
6. Follow **MINIMUM NECESSARY CHANGE**: extend an existing module/package when the feature belongs there. A new module name is not automatically a new package.

## Current modules

`modules/pdf-password-remover` and `modules/pdf-split-merge` are the current modules. Future modules (OCR, …) remain uncreated until approved.
