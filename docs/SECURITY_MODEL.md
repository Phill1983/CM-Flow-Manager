# Security Model

## Threat model (MVP)

| Threat | Mitigation |
| --- | --- |
| Renderer RCE via Node integration | `nodeIntegration: false`, `contextIsolation: true`, sandbox where compatible |
| Arbitrary IPC → shell | Explicit allowlist; no shell; argv-only spawn |
| Path traversal / overwrite | Main-process path validation; default new output files |
| Password leakage via logs | Logging redaction policy; never accept password into log APIs |
| Password persistence | Memory only for operation; clear UI state after run |
| Document exfiltration by app | No network upload features; no analytics |
| Supply-chain / bad dependency | Dependency review checklist |
| Symlink / junction surprises | Resolve real paths; reject unsafe destinations where detectable |

## Electron defaults (required)

```text
contextIsolation: true
nodeIntegration: false
sandbox: true where compatible
enableRemoteModule: false  # do not use @electron/remote
```

## Preload contract

Expose only a minimal typed API, e.g. file dialogs, queue job submit, cancel, open-path, get-version, get-log-dir. No generic `invoke(channel, …)` escape hatch.

## Password handling

- Passed main ← renderer only over allowlisted IPC for an active unlock request.
- **Phase 2 unlock path:** password is written to a short-lived temp file and passed to qpdf as `--password-file=...` (not `--password=`), then the temp file/directory is deleted in `finally`.
- Not written to application logs, settings, Zustand persistence, or error messages returned to the UI.
- Cleared from the temporary developer UI field after unlock completes.
- **Honest limitation:** while `--password-file` avoids placing the secret on the Windows process command line, the secret still exists briefly as a file on disk during the operation. Process dumps / forensic disk recovery could theoretically observe it. Do not claim stronger guarantees than qpdf + OS semantics provide.
- Fixture generation scripts may pass passwords on argv; those scripts are developer-only and are not the production unlock path.

## File safety

- Default naming helpers: `<name>_unlocked.pdf`, `<name>_pages_<selection>.pdf`, `merged.pdf` (then `_2`, `_3`, …) in `@cm-flow-manager/file-utils`.
- Engine refuses to overwrite an existing destination (`DestinationExists`).
- Never replace source unless a future, explicit, confirmed overwrite mode is designed.
- Validate `.pdf` extension and absolute paths in main before inspect/unlock/extract/merge.
- Page selection is parsed to integers in `pdf-engine`; only a digit/comma spec is passed as a qpdf argv element. No shell interpolation.
- Split/Merge do not accept passwords and do not attempt decryption.
- Page thumbnails: renderer receives only opaque preview tokens. Main serves the allowlisted file over `cmflow-pdf://`. No Node in the renderer. Encrypted/invalid files are not granted a token. PDF.js never talks to qpdf. Renderer CSP allows `blob:` in `script-src` / `worker-src` only so Chromium can run the bundled PDF.js worker (remote scripts remain blocked).

## Logging

Allowed: app/qpdf version, sanitized source basename, durations, error categories, operation result.  
Forbidden: passwords, PDF bytes, extracted text, full command lines with secrets, raw stderr that still contains secrets (stderr is redacted when secrets are known).

## Updates and network

Document processing remains **local-only** (ADR-005).

**Narrow exception (Phase 3.6 / ADR-007):** the app may contact **GitHub Releases** only to:

- fetch update metadata (`version-manifest.json` and electron-updater feed data);
- download installer / update package bytes.

Mitigations:

- Allowlisted `update:*` IPC; no generic network API in the renderer.
- Validate manifest schema; require **SHA-256** integrity when a digest is present before install.
- Authenticode verification stubbed until code signing exists (unsigned Alpha).
- Opt-in / user-driven Updates UI; default channel `alpha`.
- Offline ⇒ full app continues to work; no remote kill switch.
- No analytics, accounts, cloud sync, or document upload.

## Future: Emergency PDF Password Recovery (not implemented)

Documented only in `docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`. Not scheduled; does not change current IPC, sandbox, or the known-password unlock path.

If that phase is ever opened: PDF bytes stay local by default; approval may exchange **metadata only** (identity, reason, SHA-256, request ID); recovery must not start before an explicit grant; reuse existing qpdf unlock after a password is obtained; no anonymous/generic cracker UI; no password logging. Any approval network path would need a new allowlisted exception (today the only network exception is GitHub Releases — ADR-007).
