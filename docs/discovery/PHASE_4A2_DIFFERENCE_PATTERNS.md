# Phase 4A.2 — Difference Patterns

Status: **draft — awaiting human approval**  
Date: 2026-08-11  
Process: **B — Invoice Validation**  
Scope: Patterns **observed** or **structurally visible** in `CASE-4A2-02` / `03` (+ invoice-only notes for `01`).  
Hypothetical rules are marked **future candidate**.

`CASE-4A2-01` estimate is **OCR-required / not field-confirmed** — no estimate↔invoice difference claims for that pair.

---

## Case-level residuals (observed totals)

| Case | Estimate gross | Invoice gross | Δ (inv − est) | Status |
| --- | --- | --- | --- | --- |
| 02 | 4 977,53 | 4 741,22 | −236,31 | Partially explainable (below) |
| 03 | 28 455,98 | 28 803,55 | +347,57 | Partially explainable; residual needs line rebuild |
| 01 | unknown | 1 993,07 | unknown | Blocked on OCR |

Net residuals track gross given single 23% VAT (**inferred**).

---

## Pattern catalog

### 1. Estimate part missing from invoice

| | |
| --- | --- |
| **Observed?** | **Yes** — CASE-4A2-02: Audatex lists additional catalog items (e.g. glass glue kit / spacers / pads) not present as invoice lines; invoice parts set is smaller |
| Source fields | Estimate parts `NUMER KATALOGOWY` + cena; invoice line codes |
| Matching key | normalized part number |
| Numeric impact | Estimate parts 589,04 vs invoice parts ~400,69 (**inferred** from line rebuild); contributes to lower invoice total |
| Ambiguity | Whether omitted intentionally (not used / included elsewhere / commercial decision) — **unknown** without repair notes |
| Resolve with | Line-level extract; human classification reason code |

### 2. Invoice part missing from estimate

| | |
| --- | --- |
| **Observed?** | **Not clearly** in 02 (invoice part codes ⊆ estimate catalog set after format normalize). **03:** invoice uses `A…` forms of Audatex spaced numbers — treat as format, not “missing estimate” |
| Future candidate | Genuine invoice-only parts after normalization |

### 3. Same part number, different price

| | |
| --- | --- |
| **Observed?** | **Likely / ambiguous** — 02: `8112637010` estimate shows aggregated cena context `45.36` vs invoice ~`3,23` × 14 = `45,22` (**inferred**); small delta may be rounding/list vs net |
| Source fields | unit/extended net |
| Key | normalized OEM + qty |
| Ambiguity | Column bleed may mis-assign prices |
| Resolve with | Reliable table parse + decimal compare tolerance policy (**future**) |

### 4. Same part number, different quantity

| | |
| --- | --- |
| **Observed?** | **Not proven** as a clean mismatch in this set (14 clips appear on both sides in 02) |
| Future candidate | Yes — structurally supported by fields |

### 5. Different part number that may represent the same part

| | |
| --- | --- |
| **Observed?** | **Format-only candidates** — 03: Audatex `254 720 1700` vs invoice `A2547201700`; `000 727 1300` vs `A0007271300` |
| Status | `relationshipStatus=format_only` **candidate** — **not** proven `equivalent` beyond formatting |
| Also | Audatex `>` superseded marker (03) — **observed** legend; no paired old/new both priced in inventory completion |
| Resolve with | Parts Intelligence + human confirm (per 4A.1 policy) |

### 6. Different discount

| | |
| --- | --- |
| **Observed?** | Invoice `Rabat` column present; samples show **0,0%**. Audatex parts discounts not clearly columnized in extracts |
| Status | Field exists on invoice; **no non-zero discount difference observed** |

### 7. Different labour hours

| | |
| --- | --- |
| **Observed?** | **02:** estimate JC converted with **10 JC=1 RBG** matches invoice `rbg` qty (6,60 / 5,80) — **no hours delta** after conversion |
| **03:** invoice labour is **`usl` lump** without hours — hours comparison **not directly possible** |
| Ambiguity | Must read `N` from Audatex; do not assume 10 |

### 8. Different labour rate

| | |
| --- | --- |
| **Observed?** | Both sides use **180 PLN/RBG** where hours visible (02). 03 lump hides rate |
| Status | No rate delta observed when comparable |

### 9. Different labour amount

| | |
| --- | --- |
| **Observed?** | **02:** body 1 188,00 and paint labour 1 044,00 match both sides |
| **03:** body 3 450,00 and paint labour 1 746,00 appear on both (**observed** amounts); presentation differs (detail vs lump) |

### 10. Paint differences

| | |
| --- | --- |
| **Observed?** | Materials totals match 02 (`1 213,95`) and 03 (`2 787,07`) estimate↔invoice |
| Panel-level paint ops | Estimate-only detail; invoice aggregated — comparison at **aggregate** level only in these samples |

### 11. Material differences

| | |
| --- | --- |
| **Observed?** | Paint materials matched (02/03). 02 adhesive kit on estimate may be absent on invoice (see pattern 1). 03 additional materials 60,00 / conservation present on both sides as categories |

### 12. Normalia differences caused by another changed base

| | |
| --- | --- |
| **Observed?** | **Yes (inferred)** — 02: Audatex normalia 11,78 = 2%×589,04; invoice normalia 8,01 ≈ 2%×~400,69 |
| Source fields | parts subtotal; normalia amount; Audatex % |
| Impact | Normalia falls when parts base falls — part of residual decomposition |
| Ambiguity | Invoice does not print %; formula assumed from Audatex + arithmetic |
| Resolve with | Confirm shop normalia policy; more cases with non-2% |

### 13. VAT differences

| | |
| --- | --- |
| **Observed?** | VAT amount differs when net differs; **rate** stays 23%. VAT = net×0.23 matches prints |
| Not observed | Multi-rate VAT lines |

### 14. Total difference not immediately explained

| | |
| --- | --- |
| **Observed?** | **02:** residual largely tracks missing estimate parts + dependent normalia; full line-level proof needs cleaner parse |
| **03:** +347,57 gross — direction opposite of 02; likely extra/changed part pricing or lines; **exact residual decomposition UNKNOWN** until trustworthy line table rebuild |
| Required | Deterministic line extract + ordered difference ledger (Phase 4D) |

### 15. Rounding differences

| | |
| --- | --- |
| **Observed?** | Small parts deltas (e.g. 45,36 vs 45,22) **may** be rounding/list differences — **not proven** |
| VAT | No 1-grosz mismatch in checked totals |
| Future candidate | Explicit grosz-tolerance policy |

---

## Additional observed structural patterns

### A. Labour presentation mismatch (`rbg` detail vs `usl` lump)

- **02 / 01 invoices:** labour in `rbg` hours × rate  
- **03 invoice:** labour categories as `usl` qty `1,00` with full net amount  
- Matching must support **aggregate category amounts** without hours

### B. Description mismatch for same OEM

- **02:** estimate “FOLIA KLEJ CZUJ DESZ” vs invoice “WKLADKA CZUJNIKA” for `96001A2000`  
- Description-only matching would fail; OEM key succeeds

### C. Duplicate OEM lines

- **03:** same catalog number twice (front/rear variants) on estimate and invoice  
- Matching key cannot be OEM alone → OEM + description/side/position/qty/price

### D. Filename approval variants (metadata only)

- `akcept_zmniejszony`, `akcept_dod` — **observed** naming; not a formal workflow field inside PDF text  
- **Future candidate:** capture approval variant as case metadata if filename/convention trusted

### E. CASE-4A2-01 blocked pair

- Invoice inventoriable; estimate OCR-required → Process B automation **blocked** for this pair until OCR/manual entry

---

## Decomposition sketch (CASE-4A2-02) — inferred, not engine output

```text
Estimate net 4046.77
- Invoice net 3854.65
= 192.12 net residual

Visible contributors (approximate):
- Parts base drop ~188.35 (589.04 → ~400.69)
- Normalia drop 3.77 (11.78 → 8.01)
- Labour body/paint & paint materials: ~0 delta
Sum ≈ 192.12

Gross residual 236.31 ≈ 192.12 × 1.23
```

Mark: **inferred** from observed section totals + invoice line rebuild; subject to parse error on invoice columns.

---

## Information required to resolve ambiguities (cross-cutting)

1. Reliable per-line net amounts (fix-resistant or alternate extract)
2. Document-local `jcPerRbg`
3. Part normalization policy for `A` prefix / spaces
4. Human reason codes for intentional omissions
5. Shop normalia rule confirmation (especially when % absent on invoice)
6. OCR or substitute digital estimate for scan cases
