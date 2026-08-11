# Phase 4A.2 — Field Matrix

Status: **draft — awaiting human approval**  
Date: 2026-08-11  
Process: **B — Invoice Validation**  
Evidence: `CASE-4A2-01` (invoice only), `CASE-4A2-02`, `CASE-4A2-03`  
Estimate fields for `CASE-4A2-01` are **OCR-required / not field-confirmed** and must not be treated as observed.

## Legend

| Column | Meaning |
| --- | --- |
| Estimate | present / not present / OCR-required / calculated-only / optional-variable / ambiguous |
| Invoice | same |
| Freq | among field-confirmed docs in this set (est: 2; inv: 3) |
| Canonical priority | **MUST** / **SHOULD** / **OPTIONAL** / **UNKNOWN** for future Phase 4B model |
| Ambiguity | practical matching/parsing risk |

Confidence of “present”: **observed** unless noted.

---

## Document / case identifiers

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| registration plate | present (02/03) | present (all 3) | high | MUST | low | Primary join |
| VIN | present (02/03) | present (all 3) | high | MUST | low | Primary join |
| claim / sygnatura / numer szkody | present as calc NR + sygnatura | present | high | MUST | med | Invoice may append suffix (`/TMA`, `/JCH`) |
| estimate / calculation number | present (`KALKULACJA NAPRAWY NR`) | not present as such | est high | SHOULD | med | In samples equals claim id |
| invoice number | not present | present (`FV/BL/…`) | inv high | MUST | low | |
| shop repair case (`Numer sprawy` `BL/…`) | not present | present | inv high | SHOULD | low | Invoice-only here |
| document date | present (calc date) | sale + issue dates | high | MUST | low | Multiple date kinds on invoice |
| KSeF number | not present | present | inv high | OPTIONAL | low | Compliance id; not needed for €/PLN math |
| seller / buyer legal identity | present (owner/shop blocks) | present | high | OPTIONAL | privacy | Do not store unnecessarily |
| vehicle make/model | present | present | high | SHOULD | low | Context |
| currency | PLN | PLN | high | MUST | low | |
| document language | PL | PL | high | SHOULD | low | |

---

## Parts

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| position / line number | Audatex `KOD CZ` / poz; not always sequential invoice Lp | invoice `Lp` | high | SHOULD | med | Different numbering systems |
| OEM / catalog number | present (`NUMER KATALOGOWY`; often spaced) | present as leading code in description | high | MUST | high | Format differs (spaces / `A` prefix) — see part-number discovery |
| alternative part number | `>` superseded hint observed (03) | not clearly separate | low | UNKNOWN | high | Audatex `>` legend: no longer supplied by producer |
| description | present | present (after code) | high | SHOULD | med | Same OEM may have different wording |
| quantity | present (e.g. `14 P`, `7`) | present (`Ilość`) | high | MUST | med | Units differ (`P` vs `szt`) |
| unit | implicit / `P` | `szt` | high | SHOULD | med | |
| list/base price | present (`CENA`) | `Cena netto` | high | MUST | med | Extract alignment risk |
| discount % | not clearly on Audatex parts in these samples | `Rabat` column (0,0% observed) | inv high / est unknown | SHOULD | med | Only 0% seen on invoices |
| discount amount | not present as separate column here | not separate (only %) | — | UNKNOWN | — | |
| unit price after discount | ambiguous | ambiguous when columns bleed | — | SHOULD | high | |
| line total | present / partial | `Wartość netto` (+ VAT/gross cols) | high | MUST | high on inv extract | |
| supplier/manufacturer | not as separate field | not present | — | OPTIONAL | — | Brand inferred from vehicle only |
| user-entered price flag | `*` observed on Audatex | not present | est med | OPTIONAL | low | Legend: introduced by user |
| duplicate same catalog # | observed (03 front/rear seals, insulation) | observed (same codes twice) | case 03 | MUST support | high | Match needs qty/position/side |

---

## Labour

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| operation code | Audatex codes (`81125R00`, `72-1450 01`, `BRAK NR`) | often **absent** (category title only) | est high / inv low | SHOULD | high | Invoice may lump |
| operation description | present | present as category or title | high | SHOULD | med | |
| labour category | body vs paint sections; additional conservation | `Robocizna blacharska` / `lakiernicza` / conservation | high | MUST | med | |
| time units (JC) | present | not present | est high | SHOULD | med | Audatex-specific |
| time units (RBG / hours) | via printed `N JC=1 RBG` | `rbg` qty (02, 01) **or** absent when `usl` lump (03) | variable | MUST | high | Read N from document; do not hardcode 10 |
| labour rate | `PLN/RBG` (180.00 observed) | `Cena netto` per rbg or embedded in lump | high | MUST | med | |
| line / category total | present | present | high | MUST | low–med | |
| included-elsewhere marker `)` | present | not present | est | OPTIONAL | med | |
| ZAX marker | present | not present | est | OPTIONAL | med | Audatex-set time |

### Audatex JC↔RBG (matrix note)

- **observed** document prints `N JC = 1 RBG`.
- **MUST** store `jcPerRbg` (or equivalent) as **source-observed**, not a global constant.
- **not** a universal estimate-system rule.

---

## Paint

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| paint operations (per panel) | present (AZT codes + JC) | usually **not** line-level; rolled into paint labour/materials | est high | SHOULD | high | Invoice aggregates |
| paint labour total | present | present (rbg or usl) | high | MUST | med | |
| paint time | JC breakdown | only if `rbg` qty present | variable | SHOULD | high | |
| paint rate | PLN/RBG | rate or lump | high | MUST | med | |
| paint materials total | `KOSZTY MATERIALU` | `Materiały lakiernicze` | high (02/03) | MUST | med | Values matched 02 & 03 |
| paint system / formula label | AZT; mica/uni/clear variants | not present | est | OPTIONAL | low | |
| paint price list date | present | not present | est | OPTIONAL | low | |

---

## Materials / additional costs

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| paint materials | present | present | high (02/03); 01 not present | MUST | low–med | |
| normalia | `%` + amount on Audatex final; invoice line `Normalia` | both (02/03); 01 invoice yes | high | MUST | med | See normalia discovery |
| conservation materials | `MATERIAL 60.00` under additional (03) | `Materiały dodatkowe` (03) | case 03 | SHOULD | med | |
| conservation labour | `KONS. PROFILI…` JC (03) | `KONSERWACJA ROBOCIZNA` (03) | case 03 | SHOULD | med | |
| adhesive / glue kits | present as parts (02: glass glue kit) | may be absent on invoice | case 02 | SHOULD | high | Difference driver |
| welding materials | not present in these samples | not present | — | UNKNOWN | — | Need more cases |
| environmental/disposal | not present | not present | — | UNKNOWN | — | |
| other supplements | Audatex `KOSZTY DODATKOWE` | various `usl` lines | case 03 | SHOULD | med | |

---

## Totals

| Field | Estimate | Invoice | Freq | Canonical | Ambiguity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| parts subtotal (before normalia) | present | calculated-only from lines | est high | MUST | med | |
| normalia subtotal | present | line or calculated | high | MUST | med | |
| parts + normalia | present | calculated | est high | SHOULD | low | |
| labour subtotal (body) | present | line(s) | high | MUST | med | |
| paint labour subtotal | present | line | high | MUST | med | |
| paint materials subtotal | present | line | high | MUST | med | |
| other costs | present (03) | present (03) | low | SHOULD | med | |
| total net | present | present | high | MUST | low | |
| VAT rate | 23.00% / 23% | 23% | high | MUST | low | Only 23% seen |
| VAT amount | present | present | high | MUST | low | Matched net×rate |
| VAT base | = net here | footer net | high | MUST | low | Invoice note: VAT from sum of nets |
| total gross | present | present (`Razem do zapłaty`) | high | MUST | low | |
| EUR reference rate | present on Audatex final (02) | not present | low | OPTIONAL | low | Not used in PLN totals here |

---

## Normalia discovery (evidence only)

| Question | Finding | Confidence |
| --- | --- | --- |
| Fixed vs calculated? | Audatex prints `NORMALIA ( 2.0% )` + amount → **percentage-based** on estimate | observed |
| Percentage visible? | **Yes** on Audatex final calc (02 & 03): **2.0%** | observed |
| Calculation base? | `normalia ≈ round(parts_subtotal × 0.02, 2)` for 02 (`589.04→11.78`) and 03 (`14 707.72→294.15`) | **inferred** from observed numbers |
| Do parts changes affect normalia? | Invoice 02 normalia `8,01` ≈ 2% of invoiced parts net (~400,69), not estimate’s 11,78 → **yes, moves with parts base** in this sample | **inferred** |
| Invoice show %? | **No** % on invoice Normalia lines in these extracts | observed |
| Rounding method? | Appears half-up to 2 decimals in these examples | **inferred**; not formally proven |
| Universal formula? | **UNKNOWN** beyond these Audatex+shop pairs; do not hardcode without more evidence | unknown |

---

## Part-number formats (observed)

| Pattern | Example shape (sanitized) | Where |
| --- | --- | --- |
| Compact alphanumeric | `86130N7000`, `96001A2000`, `8112637010` | Hyundai-like; est + inv |
| Spaced OEM groups | `254 720 1700`, `000 727 1300` | Audatex Mercedes |
| Prefixed compact | `A2547201700`, `A0007271300` | Invoice Mercedes |
| Audatex operation codes (not OEM) | `81125R00`, `72-1450 01` | Estimate labour |
| Missing number | `BRAK NR` | Estimate labour/parts |
| Supersession marker | `>254 991 0900` | Estimate parts legend |

### Normalization candidates (design only — not proven equivalence engine)

| Concept | Intent |
| --- | --- |
| `rawPartNumber` | Exact string as printed |
| `normalizedPartNumber` | Candidate: strip spaces/hyphens; unify case; optional leading `A` policy **TBD** |
| `relationshipStatus` | Future: `exact`, `format_only`, `superseded`, `equivalent`, … |

**Deterministic in this phase only:**

- `exact` after identical raw strings
- `format_only` candidates: spaced `254 720 1700` vs `A2547201700` (same digits; prefix/spacing) — **candidate**, needs human/Parts Intelligence confirmation before `equivalent`

**Do not** declare different digit strings equivalent.

Duplicates: same normalized OEM appearing twice on one invoice (03) with different descriptions/amounts — **not** a format issue; matching must allow multi-line.

---

## Candidate matching keys (no fuzzy implementation)

### Parts

1. `normalizedPartNumber` (after format-only normalization)
2. Invoice `Lp` / Audatex position code (weak across systems)
3. Description tokens
4. Quantity
5. Price proximity

**Insufficient alone:** description (sensor foil vs “wkładka”); position numbers (different schemes); raw OEM without normalization (Mercedes spacing/`A`).

### Labour

1. Category (body / paint / conservation)
2. Operation code (estimate-only often)
3. Description
4. Time/hours (only if invoice exposes `rbg`)

**Insufficient alone:** operation code when invoice lumps to `usl 1,00`; hours when invoice has no hours.

---

## Money & rounding (observed)

| Convention | Observation |
| --- | --- |
| Decimal separator | Audatex: `.` ; Invoice: `,` |
| Thousands | space (`1 188,00` / `1 188.00`) |
| Money decimals | 2 |
| Percentage | Audatex `23.00 %`, `2.0%`; invoice `23%`, `0,0%` |
| Negative values | not observed |
| Discounts | invoice column present; 0,0% in samples |
| VAT | `net × 0.23` matched printed VAT to 2 decimals in all checked docs |
| Future arithmetic | **decimal-safe** (no binary float for money) — design requirement |

---

## Conceptual source reference (traceability — design only)

Every future comparison cell should point to:

```text
SourceRef {
  documentId,   // internal sanitized id
  page,         // 1-based
  section,      // e.g. labour | paint | parts | totals | header
  lineId,       // Lp / Audatex kod / synthetic
  rawValue      // exact extracted string before normalize
}
```

No production implementation in 4A.2.

---

## Phase 4B — minimum Canonical Repair Document Model (proposal only)

### Core

`documentRole`, `sourceFamily` (`audatex_calc` | `shop_vat_invoice` | `scan_unconfirmed`), `currency`, `language`, `documentDate(s)`, `plate`, `vin`, `claimId`, `shopCaseId?`, `invoiceNumber?`, `estimateNumber?`, `jcPerRbg?` (Audatex-observed), `textLayerStatus`

### Parts lines

`lineId`, `rawPartNumber`, `normalizedPartNumber?`, `description`, `qty`, `unit`, `unitNet`, `discountPct?`, `lineNet`, `flags[]`, `sourceRef`

### Labour lines / aggregates

`category`, `opCode?`, `description`, `timeJc?`, `timeRbg?`, `ratePerRbg?`, `amountNet`, `presentation` (`detail` | `lump`), `sourceRef`

### Paint / materials

`paintLabourNet`, `paintMaterialsNet`, `paintOps[]?`, `normalia{pct?, amountNet, baseRef?}`, `additionalMaterials[]`, `sourceRef`

### Totals

`partsNet`, `labourNet`, `paintNet`, `otherNet`, `totalNet`, `vatRate`, `vatAmount`, `totalGross`

### Source evidence

`SourceRef` on every amount/line

### Unknown / extensions (need more cases)

Multi-VAT rates; non-Audatex estimates; Qapter; credit notes; partial invoices; welding/disposal lines; non-2% normalia; invoice normalia % printed; signed approval metadata beyond filename
