# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 4A.2 complete** — next: Phase 4B (awaiting approval). Do not start 4B until approved. |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-11 |
| Workspace path | `D:\Projects\cm-flow-manager` |
| Product display name | CM Flow Manager |
| Window title | Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |

## Completed work

### Phase 0–3A
- Planning, shell, Tailwind/shadcn, qpdf PoC, Password Remover product UI, governance (native E2E).

### Phase 3.5–3.6
- Alpha packaging (NSIS + portable, bundled qpdf).
- Update foundation (GitHub Releases, Settings → Updates, SHA-256, ADR-007).

### Phase 4A.1 (approved)
- Process A (Estimate QA) vs Process B (Invoice Validation) documented.
- `docs/BUSINESS_PROCESSES.md` + `docs/knowledge/*` (partitions, Parts Intelligence, AI learning policy).
- Conceptual engines only; no parsers/OCR/UI/code.

### Phase 4A.2 (approved)
- Real-document discovery for Process B (`docs/discovery/*`).
- Field inventory, difference patterns, parsing risks, open questions, sanitized samples.
- Audatex `N JC = 1 RBG` = document-local observed fact (10 and 12 seen); not a global constant.
- Audatex normalia 2% = inferred evidence on these samples only; not a universal rule.
- CASE-4A2-01 estimate = OCR-required / not field-confirmed.
- No production parsers, OCR, AI, comparison engine, or UI. Real PDFs not in Git.

### Governance
- Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push.
- Native End-to-End Verification + Packaged EXE verification.

## Work in progress

- None. Phase 4A.2 approved; awaiting direction for Phase 4B.

## Blockers

1. **Owner approval required** before Phase **4B** (Canonical Repair Document Model).
2. **Owner approval required** before Phase 3B (plate → folder).
3. Authenticode certificate still required for “Unknown publisher” / signed updates.
4. Scan estimate (CASE-4A2-01) blocks full pair reconciliation until OCR or digital source.

## Next approved task

Awaiting owner approval to start **Phase 4B**.

## Proposed follow-on phases (documented only)

4B Canonical model → 4C Extraction PoC → 4D Invoice reconciliation engine → 4E Parts Intelligence PoC → 4F Estimate QA engine.

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
