# Phase 4A.2 — Document Inventory

Status: **draft — awaiting human approval**  
Date: 2026-08-11  
Scope: Process **B** (Invoice Validation) evidence only  
Evidence base: three local estimate↔invoice pairs (not committed to Git)

## Evidence discipline

| Label | Meaning |
| --- | --- |
| **observed** | Value/layout seen in extractable text (or page count from PDF structure) |
| **inferred** | Derived by arithmetic/string comparison from observed values; basis stated |
| **unknown** | Not proven from these documents |
| **not present** | Searched for in extractable text and not found |
| **OCR-required** | Image/scan PDF; **no field confirmation** until OCR exists |

Do not treat inferred items as observed. Do not invent fields that are “common” in Audatex/Qapter/accounting without evidence here.

## Case index (sanitized)

| Internal ID | Pair folder | Approved estimate | Invoice | Full field inventory? |
| --- | --- | --- | --- | --- |
| `CASE-4A2-01` | Exemples/1 | Scan PDF (`SKM_…`) | Shop VAT `FV/BL/1664/26` | Invoice **yes**; estimate **OCR-required / not field-confirmed** |
| `CASE-4A2-02` | Exemples/2 | Audatex kalkulacja (`…_akcept_zmniejszony`) | Shop VAT `FV/BL/1620/26` | **Yes** (estimate↔invoice) |
| `CASE-4A2-03` | Exemples/3 | Audatex kalkulacja (`…_akcept_dod`) | Shop VAT `FV/BL/1409/26` | **Yes** (estimate↔invoice) |

Personal data (names, full addresses, bank account, NIP, real plate/VIN, exact claim IDs) are **not** repeated below except as **presence** notes. Real PDFs stay outside the repository.

---

## Document records

### CASE-4A2-01 — Estimate (`OCR-required`)

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `approved_estimate` (assumed by pairing; **content not field-confirmed**) | inferred (pairing only) |
| Source format | PDF, image/scan-like | observed (near-empty text layer) |
| Source system/vendor | **unknown** (filename suggests scanner export `SKM_…`) | unknown |
| Pages | 5 (form-feed / prior research) | observed |
| Text layer | **no** (~empty extract) | observed |
| Tables | unknown without OCR | OCR-required |
| Language | unknown | OCR-required |
| Currency | unknown | OCR-required |
| VAT presentation | unknown | OCR-required |
| Notable layout | Image-only; cannot inventory lines | observed |
| Parsing risks | Requires OCR; no silent field inference from pixels | observed |

**Rule for this phase:** no estimate fields for CASE-4A2-01 may be listed as observed.

### CASE-4A2-01 — Invoice

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `invoice` | observed |
| Source format | Digital PDF (text layer) | observed |
| Source system/vendor | Shop VAT invoice + **KSeF** id present | observed |
| Pages | 2 (`Strona 1/2`, `2/2`) | observed |
| Text layer | yes | observed |
| Tables | yes (line table; columns misaligned in plain extract) | observed |
| Language | Polish | observed |
| Currency | PLN (`zl`) | observed |
| VAT presentation | Per-line VAT rate (23%) + footer VAT summary by rate | observed |
| Notable layout | Header seller/buyer; vehicle/case block; line table; payment block; KSeF notice | observed |
| Parsing risks | Column bleed in `pdftotext -layout`; diacritics mangled; Normalia amount may wrap to next line | observed |

**Observed invoice identifiers (presence only):** invoice number `FV/BL/…`; KSeF number; registration plate; VIN; brand/model/year; shop case `BL/…`; claim/szkoda number; sale date; issue date.

**Observed line kinds:** body labour (`rbg`), part (`szt` + code), `Normalia` (`szt 1,00`).

**Observed totals:** net / VAT / gross footer; “Razem do zaplaty”; note that VAT is calculated from sum of net values.

### CASE-4A2-02 — Estimate

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `approved_estimate` (filename contains `akcept`; treated as Process B baseline candidate) | observed filename + document type; approval workflow metadata beyond filename = unknown |
| Source format | Digital PDF (text layer) | observed |
| Source system/vendor | **SYSTEM AUDATEX** (printed repeatedly); paint **AZT Lack** copyright | observed |
| Pages | 6 | observed |
| Text layer | yes (encoding noise on Polish diacritics) | observed |
| Tables | sectioned lists (labour / paint / parts / final calc / control page) — not a single grid | observed |
| Language | Polish (Audatex labels) | observed |
| Currency | PLN; also prints EUR→PLN rate on final calc | observed |
| VAT presentation | Single VAT % on final calc (`VAT 23.00 %`) + header net/VAT/gross | observed |
| Notable layout | Cover totals; equipment list; labour with JC; AZT paint; parts with catalog numbers; `KALKULACJA KOŃCOWA`; control page with rates | observed |
| Parsing risks | Multi-column labour/parts; “BRAK NR”; wrapped descriptions; `*` user-entered prices; `)` time included elsewhere | observed |

**Observed calc identifiers:** `KALKULACJA NAPRAWY NR …` (= claim/sygnatura in these samples); document date; plate; VIN; vehicle make/model.

### CASE-4A2-02 — Invoice

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `invoice` | observed |
| Source format | Digital PDF + KSeF | observed |
| Source system/vendor | Shop VAT / KSeF (same layout family as other invoices) | observed |
| Pages | 2 | observed |
| Text layer | yes | observed |
| Tables | yes | observed |
| Language | Polish | observed |
| Currency | PLN | observed |
| VAT | 23% line + footer summary | observed |
| Notable layout | Same shop template as CASE-4A2-01/03 | observed |
| Parsing risks | Same column-bleed; part unit prices and line totals easy to swap in extract | observed |

**Observed labour presentation:** body and paint labour as separate lines with unit **`rbg`**, qty = hours, rate 180,00 PLN, rabat 0,0%.

### CASE-4A2-03 — Estimate

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `approved_estimate` (filename `akcept_dod`) | observed filename; formal approval stamp = unknown |
| Source format | Digital PDF | observed |
| Source system/vendor | **SYSTEM AUDATEX** + AZT paint | observed |
| Pages | 8 | observed |
| Text layer | yes | observed |
| Tables | sectioned Audatex layout | observed |
| Language | Polish | observed |
| Currency | PLN | observed |
| VAT | 23% on final calc | observed |
| Notable layout | Larger labour set; conservation ops; many Mercedes catalog numbers (spaced); final calc splits body labour + additional costs + paint + parts/normalia | observed |
| Parsing risks | Spaced OEM numbers; duplicate catalog numbers for L/R or front/rear; paint JC conversion labels **both** 10 and 12 on same page | observed |

### CASE-4A2-03 — Invoice

| Attribute | Value | Confidence |
| --- | --- | --- |
| Role | `invoice` | observed |
| Source format | Digital PDF + KSeF | observed |
| Source system/vendor | Shop VAT / KSeF | observed |
| Pages | 2 | observed |
| Text layer | yes | observed |
| Tables | yes (dense; extract severely misaligned) | observed |
| Language | Polish | observed |
| Currency | PLN | observed |
| VAT | 23% + MPP (split payment) marking | observed |
| Notable layout | Labour as **`usl` qty 1** lump amounts (not `rbg` hours); duplicate part codes; Normalia; paint materials; additional materials; conservation labour | observed |
| Parsing risks | Highest column-bleed of the three invoices; duplicate OEM codes require position+description disambiguation | observed |

---

## Observed format families

### Family A — Audatex repair calculation PDF

- Printed banner `SYSTEM AUDATEX`
- Title `KALKULACJA NAPRAWY NR <id>`
- Sections: labour (JC), lakierowanie (AZT), części zamienne, kalkulacja końcowa, strona kontrolna
- **JC ↔ RBG conversion is printed on the document** (see below) — not assumed globally

### Family B — Shop VAT invoice (KSeF)

- Title `Faktura VAT nr FV/BL/…`
- `Numer KSeF: …`
- Vehicle + `Numer sprawy` + `numer szkody`
- Line columns: Lp, Kod/nazwa, J.m., Ilość, Cena netto, Rabat, Wartość netto, VAT, Kwota VAT, Wartość brutto
- Footer VAT summary; payment terms

### Family C — Scan estimate (CASE-4A2-01 only)

- No usable text layer in this evidence set

---

## Audatex labour unit conversion (observed format fact)

| Fact | Status |
| --- | --- |
| Audatex PDFs in this set print a conversion of the form **`N JC = 1 RBG`** next to labour rate `CENA = … PLN/RBG` | **observed** |
| `CASE-4A2-02`: **`10 JC = 1 RBG`**; body total `66 JC × 180 PLN/RBG = 1 188.00` ↔ invoice `6,60 rbg × 180` | **observed** (+ arithmetic check **inferred**) |
| `CASE-4A2-03`: body sections print **`12 JC = 1 RBG`**; final calc uses `12 JC = 1 RBG` for body; paint block also shows labels `KOŃCOWA ROBOCIZNA LAKIER 10 JC/RBG` and `12 JC/RBG` | **observed** |
| This conversion is a **document-local Audatex formatting/rate base fact** | **observed** |
| It is **not** a universal rule for all estimate systems (Qapter, insurer portals, Excel, etc.) | **explicit non-claim** |
| It is **not** a single fixed constant for all Audatex jobs — **N must be read from the PDF** | **observed** (10 vs 12 in this set) |

---

## Cross-document join keys (candidates)

Observed co-occurrence on both sides (CASE-4A2-02 / 03):

| Key | Estimate | Invoice | Notes |
| --- | --- | --- | --- |
| Registration plate | yes | yes | Strong case join |
| VIN | yes | yes | Strong case join |
| Claim / sygnatura / numer szkody | estimate calc NR ≈ claim; invoice `numer szkody` | Align with care (`/TMA` suffixes on invoice) |
| Shop case `BL/…` | not present on Audatex text | present on invoice | Invoice-only in this set |
| Invoice number `FV/BL/…` | not present | present | Invoice-only |
| Estimate number | Audatex uses calc NR (= claim in samples) | not as separate field | Ambiguous naming |

---

## Totals snapshot (sanitized amounts)

Amounts are from extractable text; useful for Process B residual analysis.

| Case | Estimate net | Estimate VAT | Estimate gross | Invoice net | Invoice VAT | Invoice gross | Gross Δ (inv − est) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | OCR-required | OCR-required | OCR-required | 1 620,38 | 372,69 | 1 993,07 | unknown vs estimate |
| 02 | 4 046,77 | 930,76 | 4 977,53 | 3 854,65 | 886,57 | 4 741,22 | **−236,31** |
| 03 | 23 134,94 | 5 321,04 | 28 455,98 | 23 417,52 | 5 386,03 | 28 803,55 | **+347,57** |

VAT check: for all three invoices and both Audatex finals, `round(net × 0.23, 2)` matched printed VAT (**inferred** from observed nets/VAT).

---

## Related discovery docs

- [PHASE_4A2_FIELD_MATRIX.md](PHASE_4A2_FIELD_MATRIX.md)
- [PHASE_4A2_DIFFERENCE_PATTERNS.md](PHASE_4A2_DIFFERENCE_PATTERNS.md)
- [PHASE_4A2_PARSING_RISKS.md](PHASE_4A2_PARSING_RISKS.md)
- [PHASE_4A2_OPEN_QUESTIONS.md](PHASE_4A2_OPEN_QUESTIONS.md)
- [samples/](samples/)
