# Module System

## Intent

Feature capabilities live in `modules/*` with hexagonal boundaries. Shared platform code lives in `packages/*`. The Electron app in `apps/desktop` composes modules and wires adapters.

## Module anatomy

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

## First module

`modules/pdf-password-remover` — only module enabled for v0.1.0.

Future modules (merge, OCR, …) follow the same template and remain uncreated until approved.
