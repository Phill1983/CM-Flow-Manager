# Testing Strategy

## Levels

### Unit

- Output filename generation and collisions
- Path validation helpers
- File-type checks
- Error mapping
- Queue state transitions
- Localization key presence for PL/UK/EN
- PDF engine adapter with mocked process runner

### Integration

- Correct password unlock
- Incorrect password
- Unencrypted input behavior (define: reject or copy-through — decide in Phase 2)
- Corrupted PDF
- Missing source
- Inaccessible destination
- Output name collision
- Batch mixed outcomes

### UI

- Add/remove files, clear queue
- Drag and drop
- Password field validation / show-hide
- Button enabled states
- Progress and result rendering
- Accessible labels

### E2E smoke

- Launch Electron (or closest practical harness)
- Unlock one fixture with known password
- Confirm output exists and source unchanged

## Fixtures

Generate synthetic encrypted PDFs in test setup. **Do not** commit customer or production documents.

## Policy

- Never skip failing tests to “greenwash” a release.
- Behavior changes update tests in the same change set.
- Phase 2 delivers engine verification tests before full UI.

## Tooling

Vitest · React Testing Library · Playwright (selected paths)
