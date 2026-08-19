# Repair Document Extraction

Status: Phase **4C.2** (pending approval)  
Packages: `@cm-flow-manager/repair-extraction` (4C.1 parsers) + `@cm-flow-manager/pdf-text-layer` (4C.2 PDF.js adapter)

## Purpose

Prove a local end-to-end path from a supported PDF’s text layer to `CanonicalRepairDocument`. This does **not** compare estimate vs invoice (Phase 4D), and does not implement OCR or AI.

```text
4C.1  extracted text → detect → parse → CanonicalRepairDocument → validate
4C.2  PDF bytes → PDF.js getTextContent() → page-aware text → 4C.1
4C.3  human count check of real local PDFs vs soak (no architecture change)
```

## Packages

| Package | Role |
| --- | --- |
| `repair-domain` | Canonical types only. No parsers, PDF, or FS. |
| `repair-extraction` | **TEXT IN → canonical OUT.** No Electron, PDF.js, worker, canvas, or filesystem. |
| `pdf-text-layer` | PDF.js adapter only. Caller supplies bytes. Does not parse repair fields. |
| `pdf-engine` | qpdf: inspect / unlock / split / merge. **Not** a text extractor. |
| `apps/desktop` | Split/Merge still uses PDF.js for **thumbnails** via `cmflow-pdf://`. Repair extraction is **not** wired into UI. |

## Why a separate adapter package

PDF.js must not live in `repair-extraction` (would couple parsers to a worker runtime). qpdf cannot extract page text. The desktop preview token protocol is for renderer thumbnails, not a CLI soak. Reuse the **same** `pdfjs-dist@4.10.38` (Apache-2.0, already in the renderer) via the Node **legacy** build.

## Page-aware text

The adapter returns `{ pageNumber, text }[]`. `extractionInputFromPages` keeps those pages **and** concatenates them with `\n\f\n` so existing parsers can search snippets for `SourceRef.page`. No second document model.

PDF.js joins text items by Y then X with **single spaces**. That is not `pdftotext -layout`. Parsers accept both the 4C.1 spaced-column fixtures and the observed PDF.js patterns (unit-before-qty invoices; Audatex catalog table; letter-spaced summary headers).

## Supported formats

| Family | Detection | Behaviour |
| --- | --- | --- |
| Audatex kalkulacja | `SYSTEM AUDATEX` / `KALKULACJA NAPRAWY` | Identifiers, vehicle, parts, labour JC, document-local N JC=1 RBG, paint/material totals, normalia, totals |
| Shop Faktura VAT / KSeF | `Faktura VAT` plus KSeF / `FV/BL/` | Identifiers, vehicle, line kinds; qty × unit must match line net |
| Image-only / scan | sparse or empty text layer | `OCR_REQUIRED` — no invented fields |
| Anything else | no markers, or both families | `unknown` / `ambiguous` — not guessed |

## Money, labour, parts

- Source amounts parse to `Money` minor units. Failure is omitted, never `0`.
- JC→RBG is read from the document (`N JC = 1 RBG`). 10 and 12 coexist. Conflicting paint `N JC/RBG` labels leave paint hours unresolved.
- Duplicate OEM lines stay separate. No A-prefix / supersession equivalence.
- Invoice column bleed: qty × unit price must match line net; otherwise amounts are omitted with `column_bleed_unresolved`.
- Invoice `usł` / `usl` lump labour keeps hours unresolved.

## Local soak (developers)

```text
pnpm repair:soak <local-folder>
```

Local PDFs only. Does not copy documents into the repo. Prints sanitized counts (format, status, parts/labour totals, JC, warning codes, timings). Does not print extracted text, VIN, plate, names, or NIP. Optional dump: `REPAIR_SOAK_DUMP=1` writes `.repair-soak/` (gitignored).

## Result statuses

`SUCCESS` | `PARTIAL` | `UNKNOWN_FORMAT` | `OCR_REQUIRED` | `INVALID_DOCUMENT` | `EXTRACTION_FAILED`

## Explicit non-goals

OCR implementation, AI, estimate vs invoice reconciliation, Process A QA, semantic parts intelligence, production Repair Intelligence UI, persistence.

## Privacy

Fixtures in `packages/repair-extraction/fixtures/` are synthetic (including PDF.js-layout regressions). Real customer PDFs stay outside Git. Do not log document contents.
