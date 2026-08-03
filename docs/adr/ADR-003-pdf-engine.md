# ADR-003: PDF Engine Selection

- Status: Accepted
- Date: 2026-08-03

## Context

MVP must decrypt PDFs with a user-provided password and write an unencrypted copy. `pdf-lib` does not reliably decrypt. Licensing must allow proprietary distribution.

## Decision

Use a **bundled qpdf** binary invoked through a `PdfUnlockService` adapter in `packages/pdf-engine`. Spawn with argument arrays (no shell). Map process outcomes to typed domain errors.

## Consequences

- Pros: Apache-2.0, strong decrypt support, content-preserving tooling, bundlable on Windows.
- Cons: Native binary packaging complexity; must prevent password logging; need careful Windows path/DLL handling.

## Alternatives considered

| Option | Result |
| --- | --- |
| MuPDF / mupdf.js | Rejected — AGPL without commercial license |
| pdf-lib | Rejected — insufficient decrypt support |
| pypdf + Python helper | Deferred — heavier packaging |

Details: `docs/PDF_ENGINE_EVALUATION.md`.
