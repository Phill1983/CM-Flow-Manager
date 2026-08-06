# ADR-007 — Application updater (GitHub Releases)

- Status: Accepted
- Date: 2026-08-05
- Phase: 3.6

## Context

Phase 3.5 shipped NSIS + portable Alpha via GitHub Releases. Users need a secure, offline-safe way to learn about and install later builds without a kill switch or cloud document processing.

## Decision

1. Use **electron-updater** with GitHub Releases (`Phill1983/CM-Flow-Manager`) as transport for NSIS installs.
2. Publish a validated **`version-manifest.json`** asset (schema v1) for policy, channels, min supported version, and SHA-256 digests.
3. Keep pure logic in `@cm-flow-manager/app-updater` (no Electron/React).
4. Require **SHA-256** verification before install. Authenticode is stubbed until signing exists.
5. Channels: `stable` | `beta` | `alpha` | `development`. Default: **alpha**.
6. Policies: `optional` | `recommended` | `mandatory`. Mandatory only soft-gates work surfaces; Settings / export / Updates remain available. Offline ⇒ full app works.
7. No remote kill switch. License revocation and emergency security update are **architecture stubs only**.

## Consequences

- ADR-005 “local-only” gains a narrow exception: update metadata + installer bytes from GitHub only.
- Portable builds: check/notify supported; in-place auto-install is best-effort / manual replace (known limitation).
- Unsigned Alpha sets `verifyUpdateCodeSignature=false` while `signing.authenticodeRequired=false`; SHA-256 remains mandatory when a digest is present in the manifest.
