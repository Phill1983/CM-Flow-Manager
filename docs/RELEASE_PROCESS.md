# Release Process

## Versioning

Semantic Versioning. Planned progression:

| Version | Milestone |
| --- | --- |
| 0.0.1 | Application shell |
| 0.0.2 | PDF engine PoC |
| 0.0.3 | Single-file UI |
| 0.1.0-alpha | First standalone Windows Alpha (installer + portable) |
| 0.0.4 / later | Batch processing |
| 0.1.0 | First usable signed/hardened release |

## Branching

- `main` — release-ready
- `develop` — integration
- `feature/*`, `fix/*`, `release/*` as needed

Avoid heavyweight Git Flow for trivial docs-only changes.

## Alpha pack (local)

```bash
pnpm pack:win
```

Outputs under `release/` (gitignored binaries):

- `CM Flow Manager Setup <version>.exe`
- `CM Flow Manager <version>.exe` (portable)
- `SHA256SUMS.txt`
- Release notes / changelog excerpt

## Release candidate checklist (v0.1.0)

1. CI green (typecheck, lint, unit tests, build).
2. Security review of Electron + IPC + qpdf spawn.
3. Manual Windows install + uninstall verification.
4. Correct/incorrect password scenarios verified on **packaged EXE**.
5. Batch + collision handling verified (when implemented).
6. Confirm passwords absent from logs.
7. Changelog and known limitations updated.
8. Artifacts in `release/` + SHA-256 checksums.
9. Explicit human approval to publish (GitHub Release / tag).

## Automation policy

- CI validates; it does **not** auto-publish releases in early versions.
- Publishing requires a tag + manual approval.

## Code signing

Unsigned builds may trigger SmartScreen warnings. Signing is a post-Alpha hardening goal unless owner provides certificates earlier.
