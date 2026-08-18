# Repair Document Extraction

Status: Phase **4C.1** (approved 2026-08-18)  
Package: `@cm-flow-manager/repair-extraction`  
Depends on: `@cm-flow-manager/repair-domain` (never the reverse)

## Purpose

Turn **already extracted text** from supported repair PDFs into `CanonicalRepairDocument`, or return an explicit unavailable result. This phase answers whether the documents we actually receive can be parsed deterministically. It does **not** compare estimate vs invoice (Phase 4D).

```text
extracted text
  → conservative format detection
  → Audatex parser OR shop invoice parser
  → CanonicalRepairDocument
  → structural validateRepairDocument
  → ExtractionResult
```

## Why a new package

| Existing package | Why it is not the home for parsers |
| --- | --- |
| `repair-domain` | Pure canonical types. No parsers, PDF, or FS (Phase 4B). |
| `pdf-engine` | qpdf spawn: inspect / unlock / extract pages / merge. **Not a text extractor.** |
| `apps/desktop` | No UI in 4C. Parsers must stay testable without Electron. |

Current consumer: unit tests and future Phase 4D. Desktop is not wired.

## Text extraction (PDF → string)

qpdf cannot extract page text. PDF.js is already used in the **renderer** for Split/Merge thumbnails (Apache-2.0). Putting `pdfjs-dist` into this Node package would add worker/canvas runtime for a PoC that is not packaged yet.

This PoC takes **text already extracted** from the PDF text layer (the same evidence path as Phase 4A.2). Wiring PDF bytes → text in Electron can reuse renderer PDF.js later; it is not required to prove the parsers.

No new production npm dependency. No cloud. No native extraction binary.

## Supported formats

| Family | Detection | Parser behaviour |
| --- | --- | --- |
| Audatex kalkulacja | `SYSTEM AUDATEX` / `KALKULACJA NAPRAWY` | Identifiers, vehicle, parts, labour JC, document-local N JC=1 RBG, paint/material totals, normalia, totals |
| Shop Faktura VAT / KSeF | `Faktura VAT` plus KSeF / `FV/BL/` | Identifiers, vehicle, line kinds (part / rbg / usl / Normalia / materials), footer totals |
| Image-only / scan | sparse or empty text layer | `OCR_REQUIRED` — no invented `CanonicalRepairDocument` fields |
| Anything else | no markers, or both families | `unknown` / `ambiguous` — not guessed |

## Money, labour, parts

- Source amounts such as `1234.56`, `1 234,56`, `1 234.56` parse to `Money` minor units. Failure is omitted, never `0`.
- JC→RBG conversion is read from the document (`N JC = 1 RBG`). 10 and 12 coexist. Conflicting paint `N JC/RBG` labels leave paint hours unresolved.
- Part numbers keep `raw` + Phase 4B lexical `normalized`. Duplicate OEM lines stay separate. No A-prefix / supersession equivalence.
- Invoice column bleed: qty × unit price must match line net; otherwise amounts are omitted with `column_bleed_unresolved`.

## Result statuses

`SUCCESS` | `PARTIAL` | `UNKNOWN_FORMAT` | `OCR_REQUIRED` | `INVALID_DOCUMENT` | `EXTRACTION_FAILED`

## Explicit non-goals

OCR implementation, AI, estimate vs invoice reconciliation, Process A QA, semantic parts intelligence, desktop UI, persistence.

## Privacy

Fixtures in `packages/repair-extraction/fixtures/` are synthetic. Do not commit customer PDFs or real identifiers. Do not log document contents.
