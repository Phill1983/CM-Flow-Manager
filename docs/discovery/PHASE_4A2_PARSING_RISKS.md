# Phase 4A.2 — Parsing Risks

Status: **draft — awaiting human approval**  
Date: 2026-08-11  
Evidence: local `pdftotext -layout` extracts of three pairs (extracts **not** committed)

## Critical risks

### 1. Image-only estimate (CASE-4A2-01)

- Text layer effectively empty
- **Risk:** inventing fields from “typical Audatex” knowledge
- **Mitigation:** mark `textLayerStatus=none`; OCR phase later; no silent inference

### 2. Invoice table column bleed

- Shop VAT PDFs extract with shifted columns: unit price, line net, VAT, gross often **misaligned** across wrapped lines
- **Risk:** wrong unit price / swapping adjacent line amounts (especially CASE-4A2-03)
- **Mitigation:** validate `Σ line nets ≈ footer net`; reject parse when imbalance > threshold; prefer structured import if shop system allows later

### 3. Encoding / diacritics loss

- Polish characters frequently become `` or mojibake in extracts
- **Risk:** brittle description matching; broken keyword detectors (`NORMALIA` still Latin-safe)
- **Mitigation:** match on OEM numbers and money first; normalize Unicode; do not rely on exact Polish lemmas

### 4. Multi-column Audatex layout

- Labour and parts lines interleave codes, descriptions, JC, and prices across columns; page headers repeat mid-section
- **Risk:** attaching price to wrong operation; dropping wrapped “OBEJMUJE” continuation lines
- **Mitigation:** section-state parser; ignore repeated shop header banners

### 5. Dual number systems on labour

- Audatex JC vs invoice RBG/`usl`
- **Risk:** hardcoding `10 JC = 1 RBG` (false on CASE-4A2-03 body = **12**)
- **Mitigation:** parse printed `N JC = 1 RBG`; store per document

### 6. Paint dual conversion labels

- CASE-4A2-03 paint block shows both `10 JC/RBG` and `12 JC/RBG` labels
- **Risk:** picking wrong converter for paint labour
- **Mitigation:** prefer final-calc totals; treat conflicting labels as ambiguity flag

### 7. Part-number formatting drift

- Spaces, `A` prefix, hyphens, uppercase
- **Risk:** false “missing part” / false mismatch
- **Mitigation:** `raw` + `normalized`; only `exact`/`format_only` deterministic; no auto-equivalence

### 8. Duplicate OEM lines

- Same catalog number more than once
- **Risk:** 1:1 matching collapses two lines
- **Mitigation:** multiset matching; include description/qty/price

### 9. Markers and legends

- `*`, `)`, `ZAX`, `BRAK NR`, `>` superseded
- **Risk:** treating markers as part of OEM string; excluding valid labour
- **Mitigation:** strip/parse markers into flags

### 10. Aggregated vs detailed granularity

- Invoice may omit panel-level paint ops and operation codes
- **Risk:** false “missing labour ops” if compared at estimate granularity
- **Mitigation:** Process B compares at compatible aggregation levels; Process A owns missing-op detection

### 11. Decimal separator inconsistency

- `.` vs `,`; thin spaces as thousands separators
- **Risk:** float parse errors; binary float drift
- **Mitigation:** decimal library; locale-aware parse

### 12. Privacy leakage via logs/docs

- Plates, VINs, personal names, NIP, bank accounts present in real PDFs
- **Risk:** committing raw PDFs or unsanitized extracts
- **Mitigation:** local-only; gitignore working extracts; sanitize discovery samples; no cloud AI upload

### 13. Filename ≠ document truth

- `akcept_*` hints approval variant but is outside PDF body
- **Risk:** wrong baseline selection among multiple kalkulacje
- **Mitigation:** human confirms approved baseline; filename optional hint only

### 14. KSeF / payment blocks

- Extra pages/sections without repair lines
- **Risk:** parser noise
- **Mitigation:** section boundaries; stop at payment/GTU blocks for line inventory

---

## Feasibility summary

| Source family | Text extraction | Table fidelity | Ready for deterministic PoC? |
| --- | --- | --- | --- |
| Audatex calc PDF | Usable with noise | Medium | Yes for totals + many lines (Phase 4C) |
| Shop VAT invoice | Usable | Low–medium (bleed) | Conditional — needs validation gates |
| Scan estimate | Not feasible | n/a | No until OCR |

---

## Non-goals reminder

This phase does **not** implement parsers, OCR, or comparison engines. Risks above are inventory for Phase 4C/4D design.
