# Known Limitations

## Current (through Phase 3.7)

- **Unsigned Alpha builds** trigger Windows SmartScreen / UAC **“Unknown publisher”**. Embedding `CompanyName` in VERSIONINFO does **not** fix that — only a trusted Authenticode code-signing certificate does.
- **Unsigned updates:** Authenticode verification is stubbed; SHA-256 digests in `version-manifest.json` remain mandatory when present. `verifyUpdateCodeSignature` stays off while `signing.authenticodeRequired=false`.
- **Portable auto-install** is limited: check/notify works; in-place replace is best-effort / often manual. Prefer NSIS for automatic install-from-Updates.
- **Offline:** full Password Remover (and the rest of the app) works without network; update check reports offline / unavailable.
- **No remote kill switch** — the app cannot be remotely disabled. License revocation / emergency security-update hooks are architecture stubs only (ADR-007).
- **Authenticode update verification** is future work (after code signing).
- **NSIS installer** targets Program Files (`perMachine: true`) and typically requires elevation; portable build does not.
- Destination collision inside the qpdf adapter remains **fail with `DestinationExists`**; UI suggests collision-safe names via `file-utils` before unlock.
- Encrypted PDFs cannot be split/merged or previewed until unlocked with Password Remover.
- **Unknown / wrong password:** Password Remover does not recover passwords. There is no emergency-recovery UI. A future authorized workflow is documented only in `docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md` (not scheduled).
- Thumbnail rendering uses PDF.js at low resolution; extremely large files may take time to fill the grid but should not block the UI (lazy + capped concurrency + virtualization after 80 pages).
- Plain/empty PDFs from older `qpdf --empty` fixtures were damaged (missing xref); Phase 3.7 regenerates `plain.pdf` as a valid one-page synthetic file before encryption. Inspection uses `--is-encrypted` semantics. Unlock treats qpdf exit code **3** (warnings only) as success when output verifies.
- **Password handling:** unlock uses qpdf `--password-file` (temp file, wiped after use). A brief plaintext password file exists on disk for the spawn duration — see `SECURITY_MODEL.md`.
- Fixture generation encrypt step still passes passwords on the qpdf argv (developer machine only).
- No Playwright E2E suite yet; packaged EXE and update-path verification are manual.
- Corepack global enable may still require elevation on Windows; pnpm `9.15.9` remains pinned.

## Anticipated product limitations (later phases)

- Shared password only for batch (no per-file passwords yet).
- Some exotic PDF encryption modes may be unsupported beyond current AES fixtures.
- Cancellation / kill of in-flight qpdf is not yet exposed (Split/Merge has no fake Cancel button).
- Split emits **one** PDF with selected pages; one-file-per-page output is not implemented (TD-013).
- Phase 3B plate → folder resolution not implemented.
- CI auto-publish of GitHub Releases / manifests not yet automated.

Update this document whenever later phases discover concrete engine or packaging limits.
