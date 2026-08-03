# ADR-006: Git Workflow

- Status: Accepted
- Date: 2026-08-03

## Context

Need predictable history without heavyweight process tax for a small team.

## Decision

- Default branch: `main` (release-ready).
- Integration branch: `develop` (created in Phase 1).
- Short-lived `feature/*`, `fix/*`, `release/*`, `docs/*` branches.
- Conventional Commits.
- Phase-oriented commits; do not dump entire product into one commit.
- Protect `main` conceptually: no unfinished experiments; CI must pass before release merges.
- Repository visibility: **private** unless owner explicitly publishes.

## Consequences

- Clear release boundary on `main`.
- Docs-only or trivial fixes may branch from `main`/`develop` pragmatically without full Git Flow ceremony.

## Alternatives considered

- Trunk-only without `develop` — acceptable later if team prefers; `develop` kept for now to separate integration from release.
- Public repo by default — rejected.
