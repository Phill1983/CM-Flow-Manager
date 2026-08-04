# Development Workflow

## Phase gates

Work only in the approved phase. Stop and request user approval before advancing.

## Delivery cycle

```text
Implementation
        ↓
Validation (automated + native E2E when required)
        ↓
Phase Report
        ↓
Human approval
        ↓
Commit
        ↓
Push
```

Do not commit or push phase work before the Phase Report and explicit human approval.

## Native End-to-End Verification

Permanent governance rule for every future phase and module.

### Motivation (Phase 3A lesson)

Automated tests and a successful build can pass while native Electron behavior still fails (for example preload/IPC, file dialogs, or drag-and-drop). Automated suites alone are **not** sufficient for native desktop features.

### When native Electron verification is mandatory

Whenever a phase modifies any of the following, Jarvis **must** run a real manual verification in the running Electron app:

- Electron main process
- preload
- IPC
- native dialogs
- drag and drop
- filesystem access
- shell integration
- native libraries
- qpdf
- OCR
- Windows integration

Automated tests remain required, but they do **not** replace this step.

### Mandatory end-to-end execution

Every newly implemented user workflow must be executed manually from start to finish in the running app — the complete user journey, not only isolated functions.

Example (Password Remover):

```text
Select PDF
→ inspect
→ password (when required)
→ unlock
→ verify output
→ open output folder
```

### Phase Report categories (never mix)

Every Phase Report must clearly separate:

1. **Automated verification** — typecheck, lint, unit/integration/UI tests, build, and similar.
2. **Native Electron manual verification** — workflows actually run in the Electron app, with outcomes.
3. **Not manually verified** — anything not exercised end-to-end (must be listed explicitly).

Do not present automated green results as proof that native dialogs, drop, IPC, or shell paths work.

### Completion rule

A phase that introduces or changes native desktop functionality is **not complete** until:

- automated validation passes;
- native Electron verification passes;
- the full end-to-end user scenario for the phase passes.

### Scope

This rule is permanent and applies to every future CM Flow Manager module.

## Agent coordination sequence

Used during Implementation → Validation:

```text
strategy-guardian
        ↓
solution-architect
        ↓
assigned implementation agent
        ↓
testing-agent
        ↓
security-review-agent (when relevant)
        ↓
quality-guardian
        ↓
code-review-agent
        ↓
documentation-agent
        ↓
release-manager-agent (when relevant)
```

Native Electron manual verification is part of Validation whenever the native triggers above apply. Prefer `electron-platform-agent` / implementer to drive the live app check; `testing-agent` records automated evidence and confirms the Phase Report separates the three verification categories.

## Per-task checklist

1. Read relevant docs.
2. Inspect existing code.
3. State scope and affected files.
4. Implement smallest coherent change.
5. Add/update tests.
6. Run automated validation.
7. When native surfaces changed: run the full Electron end-to-end user journey.
8. Review security implications.
9. Update status/registry docs.
10. Produce Phase Report (automated / native manual / not verified) and wait for human approval.
11. Commit and push only after approval.

## Definition of done

Code exists **and** tests/docs/status reflect reality. Generating code alone is not completion.

For native desktop work: automated green **plus** successful native Electron end-to-end verification.

Phase work is not finished until the approved Commit → Push steps complete (when the user approves publishing).

## Conventional commits

Examples: `feat(pdf):`, `fix(ipc):`, `test(pdf):`, `docs(adr):`, `chore(ci):`, `docs(governance):`.
