# Development Workflow

## Phase gates

Work only in the approved phase. Stop and request user approval before advancing.

## Delivery cycle

```text
Implementation
        ↓
Validation
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

## Per-task checklist

1. Read relevant docs.
2. Inspect existing code.
3. State scope and affected files.
4. Implement smallest coherent change.
5. Add/update tests.
6. Run validation.
7. Review security implications.
8. Update status/registry docs.
9. Produce Phase Report and wait for human approval.
10. Commit and push only after approval.

## Definition of done

Code exists **and** tests/docs/status reflect reality. Generating code alone is not completion. Phase work is not finished until the approved Commit → Push steps complete (when the user approves publishing).

## Conventional commits

Examples: `feat(pdf):`, `fix(ipc):`, `test(pdf):`, `docs(adr):`, `chore(ci):`.
