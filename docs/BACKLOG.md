# Backlog

Prioritized for post–Phase 0 work. Items marked **blocked** need user approval or tooling.

## Done

1. ~~Phase 1 application shell.~~
2. ~~Phase 1.5 Tailwind + shadcn foundation.~~
3. ~~Phase 2 qpdf PoC + fixtures + allowlisted IPC.~~
4. ~~Governance delivery cycle (report → approval → commit → push).~~
5. ~~Phase 3A Password Remover product UI.~~
6. ~~Phase 3.5 Alpha packaging (NSIS + portable, bundled qpdf, pack:win).~~
7. ~~Phase 3.6 Update & Version Management Foundation.~~
8. ~~Phase 4A.1 Repair Business Process Foundation (docs).~~
9. ~~Phase 4A.2 Real document discovery / field inventory.~~
10. ~~Exact UI asset-pack (visual polish remaining → `docs/TECH_DEBT.md`).~~
11. ~~Phase 4B Canonical repair document model.~~
12. ~~Phase 3.7 PDF Split / Merge (approved 2026-08-18).~~
13. ~~Phase 4C.1 repair document text-extraction PoC (approved 2026-08-18).~~

## Now

1. Wait for the owner to open **Phase 4D** or a further 4C slice. Do not start 4D unprompted.

## Next (proposed — owner gate each phase)

1. **Phase 4C.2** (optional) — PDF bytes → text in Electron, reusing renderer PDF.js; still no OCR/AI.
2. **Phase 4D** — First deterministic invoice reconciliation engine.
3. **Phase 4E** — Parts Intelligence PoC.
4. **Phase 4F** — Estimate QA knowledge engine.

## Deferred / blocked on owner approval

### Phase 3B — plate → folder

1. Implement `VehiclePlateExtractor` (PDF text layer only; no OCR).
2. Implement `PlateNormalizer`.
3. Implement `CaseFolderResolver` against **user-configured root folders only**.
4. Propose destination after unlock; never silent save; multi-match chooser; Save As fallback.
5. Settings UI for configured root folders.

### Password Remover Phase 4 — batch unlock

Distinct numbering from repair **4A+**. Batch unlock with shared password + queue controls.

## Later (release hardening)

1. Cancel in-flight unlock when technically feasible.
2. Activity history (non-sensitive metadata only).
3. Code signing + Authenticode update verification + hardened release candidate.
4. Security review for public/signed release.
5. CI publish automation for GitHub Releases + manifests (beyond manual Alpha).

## Future (owner-gated, not scheduled)

### Emergency PDF Password Recovery

- **Not** the next phase after 3.7. **Does not block** 3.7 or 4C.
- Authorized emergency workflow when the Password Remover known-password path fails or the password is unavailable.
- Not a generic PDF cracker. No implementation until governance/legal/security questions are answered.
- Canonical spec: [`docs/EMERGENCY_PDF_PASSWORD_RECOVERY.md`](EMERGENCY_PDF_PASSWORD_RECOVERY.md).

## Post-MVP / v0.2.x

### Global Command Palette

- **Target:** post-MVP / v0.2.x
- **Priority:** Medium
- **Do not implement in Phase 1–5 / v0.1.0**

Suggested shortcuts:

- `Ctrl+Shift+P`
- `Ctrl+K`

Planned actions:

- Open Dashboard
- Open PDF Password Remover
- Select PDF files
- Open Activity
- Open Settings
- Open output folder
- Change language
- Toggle theme
- Search available modules

## Parking lot (explicitly not scheduled)

- Other PDF tools, OCR, Audatex product integrations, ServiceFlow, code signing certificates procurement.
- Full-computer filesystem scans for plates (forbidden by product rules).
- Autonomous AI rule promotion (forbidden by AI learning policy).
