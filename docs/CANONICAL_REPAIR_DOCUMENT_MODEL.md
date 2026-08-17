# Canonical Repair Document Model

Status: Phase **4B** (approved 2026-08-17)  
Package: `@cm-flow-manager/repair-domain`  
Schema version: **1**

## Purpose

`CanonicalRepairDocument` is the internal representation shared by later Process A (Estimate QA) and Process B (Invoice Validation) engines. Process membership is **not** a field on the document.

```text
Source Document
      ↓
Source-specific Parser   (Phase 4C+ — not in 4B)
      ↓
CanonicalRepairDocument
      ↓
InvoiceValidationEngine / EstimateQaEngine  (later — not in 4B)
```

The comparison engine must **not** know whether the source was Audatex, Faktura VAT, KSeF, OCR, PDF, Excel, or another format.

## Evidence base

Built from Phase 4A.2 discovery (`docs/discovery/*`).  
UNKNOWN remains UNKNOWN. Missing amount ≠ 0. Missing quantity ≠ 1.

## Package boundary

Pure TypeScript domain only:

- no Electron, React, Node FS, PDF libraries, network, or UI
- path: `packages/repair-domain` (workspace `packages/*`, same pattern as `file-utils` / `pdf-engine`)

## Root types

| Type | Role |
| --- | --- |
| `CanonicalRepairDocument` | Full canonical document |
| `ExtractionUnavailableDocument` | Explicit unavailable extract (e.g. OCR-required scan) |
| `RepairDocumentInput` | Union of the above |

### Document type vs source format

These are **separate**:

| Field | Values (open unions) |
| --- | --- |
| `source.documentType` | `estimate` \| `invoice` (extensible) |
| `source.sourceFormat` | `audatex` \| `shop_faktura_vat` \| `ksef` \| `scan_ocr` \| `unknown` (extensible) |

`estimate` ≠ Audatex. `invoice` ≠ a shop template.

### Conceptual contents

`schemaVersion`, `source`, `currency`, `identity`, `vehicle`, `caseReference`, `parts`, `labour`, `labourUnitConversions`, `paint`, `materials`, `normalia`, `additionalCosts`, `totals`, `extensions`, `normalizationStatus`, `warnings`

Unavailable values are omitted or marked unresolved — **not** fabricated defaults.

## Money

Canonical store: **integer minor units** (`Money.minorUnits: bigint`) + explicit `currency`.

- PLN uses grosz (scale 2)
- Helpers: `moneyFromMajorString`, `moneyToMajorString`, `addMoney`, `subtractMoney`, `compareMoney`, `moneyEquals`, `absoluteDifference`, `multiplyMoneyByRatio`
- Ratios use exact `DecimalRatio` (`numerator`/`denominator`)
- **Do not** use JavaScript `number` as the monetary store
- Quantities / rates / percents are **decimal strings**, not floats

### Serialization

`bigint` does not survive `JSON.stringify`. Use:

- `serializeMoney` / `deserializeMoney` (`minorUnits` as decimal integer string)
- `canonicalJsonReplacer` when dumping a whole document

## Source traceability

```ts
SourceRef { documentId?, page?, section?, lineId?, position?, rawText?, extractionOrigin? }
SourceValue<T> { value, source?, certainty? }
```

Coordinates are optional. No fake confidence percentages in 4B.

## Certainty / unknown

`observed` | `derived` | `inferred` | `unknown`

Smallest useful mechanism: omit the field, or wrap in `SourceValue` with `certainty`. Explicit zero is `Money` with `minorUnits: 0n`. Missing is `undefined`.

## Normalization status

`raw` | `normalized` | `partial` | `unresolved` | `invalid`

## Parts

`PartLine` supports duplicate OEM numbers as **separate lines**.  
Part number is **not** a unique line id.

### Part-number normalization (lexical only)

`normalizePartNumberDeterministic`:

- trim, remove whitespace, remove `-` `_` `.`, uppercase
- preserves `rawPartNumber` + `normalizationSteps`
- does **not** strip leading `A`, supersession, aftermarket, or supplier equivalence (Parts Intelligence later)

## Labour & JC↔RBG

`LabourUnitConversion` is **document-local**:

```ts
{ sourceUnit: "JC", targetUnit: "RBG", sourceUnitsPerTargetUnit, source?, certainty }
```

- Case 02 evidence: 10 JC = 1 RBG
- Case 03 evidence: 12 JC = 1 RBG
- **Never hardcode** 10 or 12 globally
- `resolveLabourHours` returns `unresolved` when conversion is missing/mismatched — **never guess**
- Units: `JC`, `RBG`, `usl` (lump — not hours), `unknown`

## Paint / materials

`PaintBlock` may hold detailed operations **and** aggregates.  
Invoice-level aggregate lines live in `materials` / labour lumps without destroying estimate detail when both are present on different documents.

## Normalia

First-class `Normalia`:

- `amountNet`, optional `percent`, optional `calculationBase`
- `calculationMethod`: `explicit_amount_only` | `explicit_percent_of_base` | `unknown`
- Phase 4A.2 2% relationship is **inferred evidence only** — **not** encoded as `normalia = parts × 2%`

## Tax / VAT

`TaxBreakdown` carries document-local `taxRate` / `taxBase` / `taxAmount`.  
23% is **not** a package constant.

## Totals

`DocumentTotals` distinguishes:

- source-provided totals (`sourceProvided: true`)
- optional `calculated` mirror for future disagreement detection

## Extensions

`UnknownField { key, rawValue, source? }` preserves unrecognized source data.

## Validation

`validateRepairDocument` — structural invariants only (money shape, currency, ids, decimal quantity strings, conversion divisor > 0).  
No business comparison rules. Quantity checks do not use `Number()`.

## Schema versioning

- Current: `CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION = 1`
- Future migrations: bump version; add additive fields preferred; breaking changes require a documented migration note and dual-read period
- No migration framework in 4B

## Sanitized fixtures

| Fixture | Notes |
| --- | --- |
| `buildCase4a202Estimate` | A — parts, JC, 10 JC=1 RBG, normalia %, VAT, totals |
| `buildCase4a202Invoice` | C — rbg labour |
| `buildCase4a203Estimate` | B — duplicate OEM, 12 JC=1 RBG, paint |
| `buildCase4a203Invoice` | D — `usl` lump labour + duplicate OEM |
| `buildUnknownSparseDocument` | E — missing amounts stay undefined |
| CASE-4A2-03 door line | F — raw `254 720 1700` + compact normalized form |
| `case4a201EstimateUnavailable` | OCR-required — **no invented lines** |

No real VIN/plate/customer/NIP data.

## Non-goals (4B)

Parsers, OCR, comparison engine, fuzzy matching, AI, Parts Intelligence lookup, Estimate QA rules, production UI, PDF Split/Merge.
