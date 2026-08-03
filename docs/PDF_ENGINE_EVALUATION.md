# PDF Engine Evaluation

## Requirement

Unlock encrypted PDFs **only with a user-supplied correct password**, write a separate unencrypted copy, preserve pages/content locally on Windows, package without requiring end users to install runtimes, and keep a license compatible with a proprietary desktop app.

## Candidates evaluated

### 1. qpdf (recommended)

| Criterion | Assessment |
| --- | --- |
| Local processing | Yes — CLI / C++ library |
| Known-password decrypt | Yes — `--password` + `--decrypt` |
| Content preservation | Designed for structure-preserving transforms |
| Windows packaging | Official Windows builds; can be vendored under `resources/` |
| License | **Apache License 2.0** — redistributable with attribution |
| Maintenance | Active upstream (qpdf/qpdf) |
| Electron fit | Spawn via `child_process.spawn` with argv array (no shell) |
| Error clarity | Distinct exit codes / stderr for wrong password vs bad PDF (to be mapped in adapter) |
| Risks | Must bundle correct arch binary; carefully avoid logging argv passwords; path quoting via argv not shell |

**Integration plan:** `packages/pdf-engine` implements `PdfUnlockService` by invoking a bundled `qpdf.exe` with explicit arguments. Password passed as argument (not interpolated into a shell string); process env scrubbed; never write password to logs.

### 2. MuPDF / mutool / mupdf.js

| Criterion | Assessment |
| --- | --- |
| Capability | Strong PDF toolkit; can rewrite/decrypt with password |
| License | **AGPL-3.0** or paid commercial license from Artifex |
| Proprietary Electron app | AGPL distribution would force open-sourcing the app or purchasing commercial terms |
| Decision | **Rejected for MVP** unless owner buys commercial license |

### 3. pdf-lib (and unmaintained upstream)

| Criterion | Assessment |
| --- | --- |
| Decrypt with password | **No** reliable support in mainstream `pdf-lib` |
| `ignoreEncryption: true` | Does not properly decrypt; unsafe for rewrite |
| Forks (`@cantoo/pdf-lib`, etc.) | May add encryption features but coverage/maturity for all encryption variants is uncertain vs dedicated tools |
| Decision | **Not suitable as primary unlock engine** |

### 4. pypdf via bundled Python helper

| Criterion | Assessment |
| --- | --- |
| Capability | Can decrypt with password in many cases |
| Packaging | Requires shipping Python runtime or freezing a helper — heavier and more fragile on Windows |
| License | BSD-style for pypdf; still need to package interpreter |
| Decision | **Backup option only** if qpdf packaging fails |

### 5. Other notes

- **PDFtk** — historically useful; licensing/binary availability less attractive than qpdf for new projects.
- **node native bindings** wrapping qpdf — optional later; Phase 2 should start with controlled process spawn for clearer security review.

## Recommendation

**Adopt qpdf as the PDF unlock engine**, behind `PdfUnlockService`, with fixture-based verification in Phase 2.

## Packaging constraint

Release builds must ship `qpdf` (and required companion DLLs if any) inside the app resources so users do **not** install qpdf themselves. Apache-2.0 NOTICE/license files must be included.

## Phase 2 results (2026-08-03)

| Item | Result |
| --- | --- |
| Tested qpdf | **12.3.2** (`qpdf-12.3.2-msvc64.zip`) |
| Source | Official GitHub release `qpdf/qpdf` |
| Checksum | Verified against `qpdf-12.3.2.sha256` (`8941870a…f202`) |
| License | Apache-2.0 |
| Dev install | `pnpm fetch:qpdf` → `vendor/qpdf/bin/qpdf.exe` (gitignored) |
| Adapter | `QpdfUnlockService` implementing `PdfUnlockService` |
| Spawn | `child_process.spawn` argv array, `shell: false` |
| Password | `--password-file` temp file (wiped after use) |
| Plain PDF | Defined behavior: write verified unencrypted copy; result `unlocked` |
| Destination exists | `DestinationExists` failure (no overwrite) |

### Development vs production

- **Phase 2:** local/vendor qpdf for developers and CI machines that run `pnpm fetch:qpdf`.
- **Later packaging phase:** embed qpdf into the Windows build so end users need no separate install.

## Open items after Phase 2

- Production resource packaging + attribution files in the installer.
- Broader encryption matrix beyond AES-256 fixtures.
- Cancel in-flight unlock from UI.
- Max file size policy.
