# Known Limitations

## Phase 0

- No application binary or source implementation yet.
- PDF engine recommendation is documented but not integrated.
- GitHub remote not created (`gh` missing / not authenticated).
- pnpm not installed on the development machine (npm is available).
- Folder path on disk is `CM Folw Manager` (typo); repository name remains `cm-flow-manager`.

## Anticipated product limitations (to validate in later phases)

- Shared password only for batch in v0.1.0 (no per-file passwords yet).
- Some exotic PDF encryption modes may be unsupported; exact matrix TBD after Phase 2 fixtures.
- Cancellation depends on terminating the qpdf child process mid-flight — may leave partial temp outputs that must be cleaned up.
- Without code signing, Windows SmartScreen may warn on download/install.
- Auto-update will not ship enabled.

Update this document whenever Phase 2+ discovers concrete engine or packaging limits.
