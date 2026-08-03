# ADR-003: PDF Engine Selection

- Status: Accepted
- Date: 2026-08-03

## Context

MVP must decrypt PDFs with a user-provided password and write an unencrypted copy. `pdf-lib` does not reliably decrypt. Licensing must allow proprietary distribution.

## Decision

Use **qpdf** behind `PdfUnlockService` (`QpdfUnlockService`).

### Phase 2 (development)

- Official Windows `msvc64` binary **12.3.2**, fetched via `pnpm fetch:qpdf` with SHA-256 verification against the upstream `qpdf-*.sha256` asset.
- Invoked with `spawn(..., { shell: false })`.
- Passwords supplied with `--password-file` (temp file), not `--password` on argv.
- Vendor binaries under `vendor/qpdf/bin` are **not** committed.

### Future production

- Bundle verified qpdf + required DLLs inside the app resources / installer with Apache-2.0 attribution.
- Do not require end users to install qpdf separately.

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
