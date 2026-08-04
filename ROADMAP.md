# Roadmap

## Vision

CM Flow Manager becomes a modular local-first desktop workspace for documents, PDFs, service workflows, and repetitive office tasks — private by default, offline-capable, and extensible without rewriting the shell.

## Near-term (v0.1.0)

1. Secure Electron application shell.
2. Localized UI (Polish, Ukrainian, English).
3. PDF Password Remover with known-password unlock only.
4. **Phase 3A:** single-file Password Remover product UI (done pending approval).
5. **Phase 3B:** vehicle plate → configured-root folder resolution (next candidate; not started).
6. Single-file and batch processing (batch = Phase 4).
7. Safe output naming (`*_unlocked.pdf` with collision handling).
8. Local logging without passwords or document content.
9. Windows installer + optional portable build.
10. Automated unit, integration, UI, and smoke tests.

## After v0.1.0 (candidates — not scheduled)

Prioritization requires product owner approval. Candidates:

- **Global Command Palette (v0.2.x, medium priority)** — shortcuts `Ctrl+Shift+P` / `Ctrl+K`; actions for navigation, select PDFs, open output folder, language, theme, module search. Not in v0.1.0.
- PDF merge / split / page extract / rotate / compress
- Images ↔ PDF
- OCR
- File renaming utilities
- Document comparison
- Cost-estimate comparison
- Audatex-related tools
- Service workflow tools
- Data extraction tools
- Code signing for Windows releases
- Optional auto-update (disabled by default until reviewed)

## Explicit non-goals for v0.1.0

- Password cracking or guessing of any kind
- Cloud processing, analytics, telemetry
- User accounts / subscriptions
- Automatic file monitoring or email attachment ingestion
- Mobile or browser-extension clients

## Phase gates

Each development phase stops for explicit user approval before the next phase begins. See [PROJECT_STATUS.md](PROJECT_STATUS.md).
