# Product Requirements — v0.1.0

## Scope

Only the **PDF Password Remover** module is functional. Navigation may include Dashboard, PDF Tools → Password Remover, Activity, Settings, and About. Future tools must not appear as broken destinations; Dashboard may note that more tools are coming later.

## User workflow

### Phase 3A (current)

1. Launch CM Flow Manager.
2. Open PDF Password Remover.
3. Select **one** PDF (picker or drag-and-drop).
4. App inspects encryption status.
5. Enter password when the PDF is encrypted (not shown for plain PDFs).
6. Review suggested output path in the source folder (`*_unlocked.pdf`, collision-safe `_2`, `_3`, …).
7. Optionally choose another destination via Save As.
8. Unlock / create verified copy; observe progress.
9. Review success or localized error; open output folder; process another file.

### Phase 3B (planned — not implemented)

Unlocked PDF → extract text → detect plate → normalize → search **configured root folders only** → propose/choose folder → confirm destination → Save As fallback. No silent saves. OCR later.

### v0.1.0 full (includes later phases)

1. Launch CM Flow Manager.
2. Open PDF Password Remover.
3. Select one or more encrypted PDFs (picker or drag-and-drop).
4. Enter password (shared across selection in v0.1.0).
5. Choose output folder or “use source folder”.
6. Start processing.
7. Observe progress and per-file status.
8. Review success/error summary.
9. Open output folder from the app.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | Windows file picker for PDF selection | Phase 3A done |
| FR-02 | Drag-and-drop of PDF files onto the module surface | Phase 3A single-file done |
| FR-03 | Single-file unlock | Phase 3A done |
| FR-04 | Batch unlock with shared password | Phase 4 |
| FR-05 | Output folder selection | Phase 3A Save As; 3B auto-folder later |
| FR-06 | Default output name `<name>_unlocked.pdf` with `_2`, `_3`, … on collision (or confirm overwrite) | Phase 3A done (no overwrite) |
| FR-07 | Never modify source PDF by default | Phase 2/3A done |
| FR-08 | Progress indicator; cancel when technically feasible | Progress in 3A; cancel later |
| FR-09 | Per-file statuses: Queued, Validating, Processing, Completed, Incorrect password, Invalid PDF, Unsupported encryption, Cancelled, Failed | Phase 3A single-file states |
| FR-10 | Remove item from queue; clear queue | Phase 4 |
| FR-11 | Open output folder | Phase 3A done |
| FR-12 | Clear, localized user-facing errors | Phase 3A done |
| FR-13 | UI remains responsive during processing | Phase 3A done |

## Explicit exclusions

- Password cracking, guessing, blank/common password attempts
- Per-file passwords (later version)
- Other PDF tools (merge, split, OCR, …)
- Cloud sync, accounts, analytics, auto-update

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Offline operation after install |
| NFR-02 | No unrestricted Node access in renderer |
| NFR-03 | Passwords never logged or stored |
| NFR.04 | Typed errors mapped to user messages |
| NFR-05 | Localization keys for PL / UK / EN |
| NFR-06 | Automated tests covering filename safety, unlock success/failure, and UI queue basics |
| NFR-07 | Self-contained Windows packaging including PDF engine |

## Acceptance criteria

See master prompt §23 and `docs/RELEASE_PROCESS.md`. Summary: install, launch, unlock with correct password, fail clearly on incorrect password, preserve originals, batch safely, local-only, hardened Electron, tests green, docs accurate.
