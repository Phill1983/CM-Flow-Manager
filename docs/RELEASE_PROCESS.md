# Release Process

## Versioning

Semantic Versioning. Planned progression:

| Version | Milestone |
| --- | --- |
| 0.0.1 | Application shell |
| 0.0.2 | PDF engine PoC |
| 0.0.3 | Single-file UI |
| 0.0.4 | Batch processing |
| 0.1.0 | First usable release |

## Branching

- `main` — release-ready
- `develop` — integration
- `feature/*`, `fix/*`, `release/*` as needed

Avoid heavyweight Git Flow for trivial docs-only changes.

## Release candidate checklist (v0.1.0)

1. CI green (typecheck, lint, unit tests, build).
2. Security review of Electron + IPC + qpdf spawn.
3. Manual Windows install + uninstall verification.
4. Correct/incorrect password scenarios verified.
5. Batch + collision handling verified.
6. Confirm passwords absent from logs.
7. Changelog and known limitations updated.
8. Artifacts: `CM-Flow-Manager-Setup-x64.exe` (+ portable when ready).
9. SHA-256 checksums published with GitHub Release.
10. Explicit human approval to publish.

## Automation policy

- CI validates; it does **not** auto-publish releases in early versions.
- Publishing requires a tag + manual approval.

## Code signing

Unsigned builds may trigger SmartScreen warnings. Signing is a post-0.1.0 hardening goal unless owner provides certificates earlier.
