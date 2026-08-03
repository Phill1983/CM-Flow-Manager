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

- Passed main ← renderer only over allowlisted IPC for an active job.
- Used to invoke qpdf via argument vector.
- Not written to disk, settings, clipboard (unless user explicitly pastes), or logs.
- Cleared from Zustand/UI state after processing completes or cancels.

## File safety

- Default: write `<name>_unlocked.pdf` (then `_2`, `_3`, …).
- Never replace source unless a future, explicit, confirmed overwrite mode is designed.
- Validate extensions and basic PDF magic where practical before heavy work.
- Enforce sensible max file size (exact limit set in Phase 2/4; document in KNOWN_LIMITATIONS).

## Logging

Allowed: app version, module id, durations, counts, error categories, non-sensitive prefs.  
Forbidden: passwords, PDF bytes, extracted text, full command lines with secrets.

## Updates and network

Auto-update **disabled by default**. Any future updater requires a dedicated ADR and security review.
