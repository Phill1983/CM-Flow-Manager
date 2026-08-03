# ADR-001: Desktop Technology Stack

- Status: Accepted
- Date: 2026-08-03
- Deciders: Phase 0 architecture (Lead Architect)

## Context

CM Flow Manager needs a Windows-first desktop UI, strong TypeScript tooling, and a path to modular features without rewriting the shell.

## Decision

Use **Electron + React + TypeScript + Vite**, styled with **Tailwind CSS** and **shadcn/ui** where practical, **Zustand** for lightweight UI state, **electron-builder** for packaging, and Vitest / RTL / Playwright for tests.

## Consequences

- Pros: Mature desktop packaging, large ecosystem, shared web UI skills, good Windows installer story.
- Cons: Electron binary size; security must be actively enforced; Chromium updates require maintenance.

## Alternatives considered

- .NET WPF/WinUI — strong Windows fit but weaker cross-platform path and separate UI skill set.
- Tauri — attractive size/security profile but PDF binary integration and team familiarity favor Electron for MVP speed.
