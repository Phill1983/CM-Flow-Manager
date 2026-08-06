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

## Update channel

Default channel for Alpha: **`alpha`**. Channels: `stable` | `beta` | `alpha` | `development` (ADR-007).

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

## GitHub Release assets (Phase 3.6+)

Attach at least:

1. NSIS setup EXE (and portable EXE when shipping portable).
2. **`version-manifest.json`** (schema v1) — channel, policy, min supported version, SHA-256 digests for artifacts.
3. `SHA256SUMS.txt` / release notes as today.

Clients fetch the manifest from the latest GitHub Release / prerelease matching the selected channel. Prefer validating a new build via Settings → Updates from a prior packaged install when practical (see `DEVELOPMENT_WORKFLOW.md`).

## Release candidate checklist (v0.1.0)

1. CI green (typecheck, lint, unit tests, build).
2. Security review of Electron + IPC + qpdf spawn (+ updater allowlist).
3. Manual Windows install + uninstall verification.
4. Correct/incorrect password scenarios verified on **packaged EXE**.
5. Batch + collision handling verified (when implemented).
6. Confirm passwords absent from logs.
7. Changelog and known limitations updated.
8. Artifacts in `release/` + SHA-256 checksums + `version-manifest.json` on the GitHub Release.
9. Explicit human approval to publish (GitHub Release / tag).

## Automation policy

- CI validates; it does **not** auto-publish releases in early versions.
- Publishing requires a tag + manual approval.
- **Later:** CI may publish GitHub Releases + attach `version-manifest.json` after approval gates; not required for Phase 3.6 foundation.

## Code signing

Unsigned builds may trigger SmartScreen warnings. Signing is a post-Alpha hardening goal unless owner provides certificates earlier. Until then, updater Authenticode checks remain stubbed; SHA-256 from the manifest is still required when digests are present.
