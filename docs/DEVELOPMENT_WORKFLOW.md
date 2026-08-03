# Development Workflow

## Phase gates

Work only in the approved phase. Stop and request user approval before advancing.

## Agent coordination sequence

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
9. Commit only after validation succeeds (when commits are requested).

## Definition of done

Code exists **and** tests/docs/status reflect reality. Generating code alone is not completion.

## Conventional commits

Examples: `feat(pdf):`, `fix(ipc):`, `test(pdf):`, `docs(adr):`, `chore(ci):`.
