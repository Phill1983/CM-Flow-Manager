# Contributing

Thank you for helping build CM Flow Manager.

## Scope discipline

- Work only within the currently approved phase (see `docs/PROJECT_STATUS.md`).
- Do not implement future modules early.
- Do not add password cracking or any credential-bypass behavior.
- Prefer small, reviewable changes.

## Prerequisites (Phase 1+)

- Windows 10/11 recommended for primary validation
- Node.js 22 LTS (or the version pinned in documentation after scaffold)
- pnpm (preferred) or npm workspaces
- Git

## Workflow

1. Read relevant docs under `docs/` before coding.
2. Create a branch: `feature/*`, `fix/*`, or `docs/*` from `develop` (or `main` until `develop` exists).
3. Implement the smallest coherent change.
4. Add/update tests with behavior changes.
5. Run validation (typecheck, lint, tests, build when available).
6. Update `docs/PROJECT_STATUS.md` and `docs/STATE_REGISTRY.md` after meaningful phases.
7. Open a pull request using the repository template.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(pdf): add encrypted PDF inspection
fix(ipc): validate destination paths
docs(adr): document qpdf engine selection
```

Do not mix unrelated concerns in one commit.

## Security expectations

- Never log or persist passwords.
- Never expose Node.js to the renderer.
- Never overwrite source PDFs by default.
- Validate all IPC inputs in the main process.
- Document new dependencies (why, license, maintenance, Electron compatibility).

## Agents and rules

Project Cursor rules live in `.cursor/rules/`. Agent definitions live in `.cursor/agents/`. Follow the coordination sequence in `docs/DEVELOPMENT_WORKFLOW.md`.

## License

Contributions are accepted under the project LICENSE terms (currently proprietary). Confirm ownership/licensing with the project owner before contributing third-party code or binaries.
