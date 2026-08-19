# Roadmap

## Vision

CM Flow Manager becomes a modular local-first desktop workspace for documents, PDFs, service workflows, and repetitive office tasks — private by default, offline-capable, and extensible without rewriting the shell.

## Near-term (v0.1.0)

1. Secure Electron application shell.
2. Localized UI (Polish, Ukrainian, English).
3. PDF Password Remover with known-password unlock only.
4. **Phase 3A:** single-file Password Remover product UI (done).
5. **Phase 3.5:** first Alpha packaging — installer + portable + bundled qpdf (done).
6. **Phase 3.6:** Update & Version Management Foundation — GitHub Releases + `version-manifest.json`, Settings → Updates, SHA-256 integrity, opt-in check/install (**done / committed**).
7. **Phase 3.7:** PDF Split / Merge (local extract + merge + page preview; **done / approved 2026-08-18**). Inserted before repair 4C.
8. **Phase 3B:** vehicle plate → configured-root folder resolution (deferred).
9. Single-file and batch processing (**Password Remover Phase 4** = batch unlock — distinct from repair Phase 4A+).
10. Safe output naming (`*_unlocked.pdf` / `*_pages_*.pdf` / `merged.pdf` with collision handling).
11. Local logging without passwords or document content.
12. Windows installer + optional portable build (Alpha in 3.5; signed RC later).
13. Automated unit, integration, UI, and smoke tests.

## Repair document track (Phase 4A+ — not v0.1.0 Password Remover scope)

Separate from Password Remover “Phase 4” batch work. Owner-gated phases:

| Phase | Intent |
| --- | --- |
| **4A.1** | Repair business process foundation (docs) — Process A vs B |
| **4A.2** | Real document discovery and field inventory (**done / approved**) |
| **4B** | Canonical repair document model (**approved 2026-08-17**) |
| **3.7** | PDF Split / Merge + local page preview (**approved 2026-08-18** — inserted before 4C) |
| **4C.1** | Estimate and invoice text extraction PoC (**approved 2026-08-18**) |
| **4C.2** | Local PDF.js text-layer adapter + real-pair soak (**approved 2026-08-19**) |
| **4D** | First deterministic invoice reconciliation engine (**approved 2026-08-19**) |
| **4E.1** | Parts Intelligence PoC — deterministic relation candidates (**pending approval**) |
| **4E.2** | AI enrichment for unresolved candidates (future) |
| **4F** | Estimate QA knowledge engine |

## After v0.1.0 (candidates — not scheduled)

Prioritization requires product owner approval. Candidates:

- **Emergency PDF Password Recovery (planned capability, R&D / security-gated, unnumbered)** — authorized emergency workflow when a known password is wrong or unavailable. **Not** a generic cracker; **not** v0.1.0; **does not block** 4C / Repair Intelligence. First gate: Engine Feasibility & Security Evaluation. Hashcat-style GPU recovery and pdf2john-style hash extraction are **R&D candidates only**. Spec: [`docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`](docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md).
- **Global Command Palette (v0.2.x, medium priority)** — shortcuts `Ctrl+Shift+P` / `Ctrl+K`; actions for navigation, select PDFs, open output folder, language, theme, module search. Not in v0.1.0.
- PDF merge / split / page extract / rotate / compress (Split/Merge extract-to-one-PDF shipped in 3.7; per-page files / rotate / compress remain candidates)
- Images ↔ PDF
- OCR
- File renaming utilities
- Document comparison (generic)
- **Estimate Quality Review** and **Invoice Validation** modules (after 4A–4F foundations)
- Audatex-related tools
- Service workflow tools
- Data extraction tools
- Code signing for Windows releases (enables Authenticode update verification)
- Updater polish (CI publish automation, portable in-place install hardening) beyond Phase 3.6 foundation

## Explicit non-goals for v0.1.0

- Password cracking or guessing of any kind (**v0.1.0**). A later owner-gated Emergency PDF Password Recovery phase may investigate **authorized** recovery; it is not scheduled and is not an unrestricted cracker — see [`docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`](docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md).
- Cloud processing, analytics, telemetry
- User accounts / subscriptions
- Automatic file monitoring or email attachment ingestion
- Mobile or browser-extension clients
- Remote kill switch or cloud document sync

## Phase gates

Each development phase stops for explicit user approval before the next phase begins. See [PROJECT_STATUS.md](PROJECT_STATUS.md).
