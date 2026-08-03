# Known Limitations

## Phase 2 (current)

- **Production bundling of qpdf is not done.** Phase 2 uses a local/vendor development binary (`pnpm fetch:qpdf`). End users still cannot rely on an installer-embedded engine.
- Password Remover **product UI** is not built; only a development PoC panel (`import.meta.env.DEV`) and CLI (`poc:unlock`) exist.
- Destination collision policy for the engine PoC is **fail with `DestinationExists`** (no auto `_2` suffix inside the adapter). Filename helpers exist in `@cm-flow-manager/file-utils` for later UI use.
- Plain/empty PDFs produced by `qpdf --empty` may emit qpdf warnings on `--check`; inspection uses `--is-encrypted` semantics instead.
- **Password handling:** unlock uses qpdf `--password-file` (temp file, wiped after use) so the password is **not** placed on the process command line. A brief plaintext password file exists on disk for the duration of the spawn — this is documented in `SECURITY_MODEL.md`.
- Fixture generation encrypt step still passes passwords on the qpdf argv (developer machine only; not used by the unlock adapter).
- No Playwright E2E suite yet.
- Corepack global enable may still require elevation on Windows; pnpm `9.15.9` remains pinned.
- GitHub CLI (`gh`) is not installed locally; pushes use `git` + remote URL.

## Anticipated product limitations (later phases)

- Shared password only for batch in v0.1.0 (no per-file passwords yet).
- Some exotic PDF encryption modes may be unsupported beyond current AES-256 fixtures.
- Cancellation / kill of in-flight qpdf is not yet exposed.
- Without code signing, Windows SmartScreen may warn on download/install.
- Auto-update will not ship enabled.

Update this document whenever later phases discover concrete engine or packaging limits.
