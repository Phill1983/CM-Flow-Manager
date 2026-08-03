# ADR-002: Project Structure

- Status: Accepted
- Date: 2026-08-03

## Context

The product will grow beyond a single PDF tool. Domain logic must stay testable without Electron/React.

## Decision

Use a monorepo:

- `apps/desktop` — Electron composition root
- `packages/*` — shared libraries (`core`, `ui`, `ipc-contracts`, `file-utils`, `logging`, `pdf-engine`)
- `modules/*` — feature modules with domain/application/infrastructure/ui

Prefer **pnpm@9.15.9** workspaces exclusively (`packageManager` pin + `pnpm-lock.yaml` only).

Phase 1 creates packages lazily: `ipc-contracts` and `pdf-engine` first; `core` / `ui` / `logging` / `file-utils` when needed.

## Consequences

- Clear module boundaries and replaceable adapters.
- Slightly more tooling overhead at bootstrap (acceptable).

## Alternatives considered

- Single package app — faster start, poor modularity for roadmap.
- Polyrepo — unnecessary process cost for a small team.
