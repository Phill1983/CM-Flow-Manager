# ADR-004: Electron Security Defaults

- Status: Accepted
- Date: 2026-08-03

## Context

Desktop apps that process local documents are high-value targets if the renderer is over-privileged.

## Decision

Mandate:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` where compatible
- no `remote` module
- minimal typed preload API
- explicit IPC allowlist with main-process validation
- never pass shell command strings from renderer
- never interpolate user paths/passwords into shells

## Consequences

- Slightly more boilerplate for IPC.
- Safer default posture aligned with Electron security tutorial.

## Alternatives considered

- Enabling Node in renderer for “speed” — rejected.
- Generic `ipcRenderer.invoke(channel, payload)` bridge — rejected as allowlist bypass risk.
