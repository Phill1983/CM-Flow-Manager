# Known Limitations

## Phase 1

- PDF unlock engine is **unavailable** — `UnavailablePdfUnlockService` only; qpdf not bundled.
- Password Remover is a placeholder route/UI notice, not a working tool.
- Shared packages `ui`, `logging`, `file-utils`, and `core` are not scaffolded yet (created when needed).
- No Playwright E2E suite yet.
- Command Palette is documented for post-MVP only — not implemented.
- Corepack cannot enable global shims into `C:\Program Files\nodejs` without elevation on this machine; pnpm `9.15.9` is installed in the user profile and pinned via `packageManager`.
- Legacy path `D:\Projects\CM Flow Manager` may still exist if Windows/Cursor held a lock during rename — prefer `D:\Projects\cm-flow-manager`.
- GitHub remote does not exist until `gh` is available and the private repo is created.
- ESLint reports non-blocking react-refresh warnings for context hook export files.

## Anticipated product limitations (validate in later phases)

- Shared password only for batch in v0.1.0 (no per-file passwords yet).
- Some exotic PDF encryption modes may be unsupported; exact matrix TBD after Phase 2 fixtures.
- Cancellation depends on terminating the qpdf child process mid-flight — may leave partial temp outputs that must be cleaned up.
- Without code signing, Windows SmartScreen may warn on download/install.
- Auto-update will not ship enabled.

Update this document whenever Phase 2+ discovers concrete engine or packaging limits.
