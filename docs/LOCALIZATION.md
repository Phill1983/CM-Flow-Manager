# Localization

## Languages (v0.1.0)

- Polish (`pl`) — default fallback candidate
- Ukrainian (`uk`)
- English (`en`)

## Rules

- No hard-coded user-visible strings in React components.
- Use translation keys from day one of UI work (Phase 3).
- Detect system language when practical; persist only the selected language preference.
- Never store passwords or document content in i18n storage.

## Suggested library (Phase 1 decision pending install)

Prefer a lightweight i18n layer (e.g. `i18next` + `react-i18next`) **after** license/maintenance check during Phase 1. Until then, architecture assumes message catalogs as JSON/TS modules under a shared locale package or `apps/desktop/src/renderer/locales/`.

## Key naming

```text
module.pdfPasswordRemover.title
module.pdfPasswordRemover.privacyNotice
status.incorrectPassword
error.destinationAccess
```

## Testing

Unit tests assert required keys exist for all three locales for every shipped screen.
