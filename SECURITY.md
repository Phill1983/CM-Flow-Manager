# Security Policy

## Supported versions

No production releases exist yet. Security guidance applies to all planning and future code.

| Version | Supported |
| --- | --- |
| Unreleased / Phase 0 docs | Planning only |
| 0.1.x (planned) | Will be the first supported line |

## Reporting a vulnerability

Do **not** open a public issue for security-sensitive reports.

Contact the project owner privately with:

- description of the issue;
- affected component (Electron main/preload/renderer, PDF engine, IPC, packaging);
- reproduction steps without attaching confidential customer PDFs;
- suggested severity.

If a private contact channel is not yet published, use a private GitHub Security Advisory once the repository exists on GitHub.

## Security non-negotiables

- Local-only document processing for v0.1.0.
- No telemetry or analytics.
- Electron: `contextIsolation: true`, `nodeIntegration: false`, sandbox where compatible, no remote module.
- Minimal typed preload API; explicit IPC allowlist; main-process validation.
- Passwords never logged, stored, or included in crash/error exports.
- No password cracking, brute force, dictionaries, or automatic guessing.
- Source files not modified by default; unlocked copies written separately.
- Auto-update disabled until explicitly designed and reviewed.

## Dependency and binary policy

Before adding a dependency or bundling a binary:

1. Justify necessity.
2. Confirm active maintenance.
3. Record license compatibility.
4. Confirm Electron/Windows packaging fit.
5. Reject components that upload user files or emit telemetry by default.

See `docs/SECURITY_MODEL.md` and `docs/adr/ADR-004-electron-security.md`.
