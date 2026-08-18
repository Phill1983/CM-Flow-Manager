# PDF Split / Merge (Phase 3.7)

Local PDF utilities in CM Flow Manager. Processing never leaves the machine.

## Workflows

### Split (extract pages)

1. Open **Dzielenie / łączenie PDF** (sidebar or Dashboard card).
2. Use the **Dzielenie PDF** tab.
3. Select **one** PDF (picker or drag-and-drop).
4. Review file name, size, page count, and source folder.
5. Select pages with thumbnails, checkboxes, and/or the page-range field (they stay in sync). Drag selected thumbnails to set **output order**; source page numbers do not change.
6. Review the planned output path (default: beside the source file). Use **Zmień lokalizację** if needed.
7. **Wyodrębnij strony** writes **one new PDF** containing the selected pages.
8. Open the output folder or start another operation.

The source file is never modified.

### Merge

1. Open the same page, **Łączenie PDF** tab.
2. Select **two or more** PDFs (multi-select picker or multi-file drop).
3. Review the visual merge queue (name, page count, size, first-page thumbnail). Drag previews to set **merge order**. **W górę** / **W dół** remain as a fallback. Double-click a preview to open a scrollable preview of that whole file.
4. Output page order **exactly matches the visible queue order**.
5. Review `merged.pdf` (or `merged_2.pdf`, …) and change location if needed.
6. Merge. On failure, no partial final file is left behind.

One file alone cannot run Merge.

## Page-range syntax

Whitespace around commas and hyphens is allowed.

| Input | Pages |
| --- | --- |
| `1` | 1 |
| `1-3` | 1, 2, 3 |
| `1,3,5` | 1, 3, 5 |
| `1-3,5,8-10` | 1, 2, 3, 5, 8, 9, 10 |
| ` 1 - 3 , 5 ` | 1, 2, 3, 5 |

Rejected: empty, `0`, negatives, `abc`, `1-`, `-3`, `3-1` (not reversed), `1,,3`, `1-a`, pages above the source page count.

**Page-order policy:** preserve user-requested order. Ranges themselves are internally ascending. Example: `5,1-3` → `5,1,2,3`.

**Duplicate policy:** collapse keeping the first occurrence. Example: `1,1,2` → `1,2`.

The UI parser and the engine parser are the same function. Main re-parses the selection string. Only a validated list of integers is passed to qpdf as an argv element (`1,2,5`). User text is never interpolated into a shell.

## Output naming

- Split default: `<source>_pages_<compact-selection>.pdf` (example: `EA2612744 - Decyzja_pages_1-3_7.pdf`). Empty selection uses `<source>_pages.pdf` (not `_pages_pages.pdf`). Very long selections use a short suffix such as `80sel`.
- Merge default: `merged.pdf`, then `merged_2.pdf`, …
- Existing destinations are **not** overwritten (`DestinationExists`). Choose another name/location.
- Illegal filename characters in the generated suffix are sanitized.

## Encrypted input

- Split: typed `EncryptedPdf` / UI message. No password guessing.
- Merge: the whole merge fails; the UI names the blocking file (`Plik {file} jest chroniony hasłem.`). No partial merged output.

Unlock first with Password Remover, then split/merge. Chaining is manual in 3.7.

## Architecture

```text
Renderer (business operations only)
  → preload typed IPC
  → main (path + payload validation)
  → PdfEngineService (packages/pdf-engine)
  → qpdf argv spawn (no shell)
```

Operations: `inspect`, `extractPages`, `mergePdfs`. There is **no** `runQpdf(args)` on the preload API.

Page count uses `qpdf --show-npages` (same bundled binary as Password Remover).

Transactional write: qpdf writes a sibling temp `.cmflow-<uuid>.pdf`, output is verified, then renamed to the destination. Temp files are deleted on success and on expected failure.

## IPC (Phase 3.7 additions)

| Channel | Purpose |
| --- | --- |
| `dialog:openPdfs` | Multi-select PDF picker |
| `pdf:prepareExtractSource` | Inspect + collision-safe extract path |
| `pdf:prepareMergeFile` | Inspect one merge input (rejects encrypted) |
| `pdf:extractPages` | Extract pages (`pageSelection` string, parsed in engine) |
| `pdf:merge` | Merge in the given array order |
| `pdf:grantPreview` | Inspect, then issue an opaque preview token (unencrypted PDFs only) |
| `pdf:revokePreview` | Drop a preview token |

Existing Password Remover channels are unchanged.

## Page preview

Thumbnails are **local-only**. PDF.js runs in the renderer. qpdf is never used for rendering.

After Split selects an unencrypted PDF, the workspace uses the full content width: file details and extraction controls side by side, then a full-width thumbnail grid. Each page tile shows a checkbox, the **source page number**, and an **output-position** badge when selected. Clicking a tile or its checkbox toggles the same selection. **Double-click** opens a larger in-app preview of that document (scrollable when it has more than one page; same PDF.js document; not a new window). Dragging a selected tile onto another selected tile reorders extraction (page identity labels do not change). Newly selected pages are **appended**. The page-range field and the highlight set stay in sync.

Merge shows a first-page thumbnail per file in a drag-reorderable queue. **Double-click** opens a scrollable preview of every page in that file. **Show all pages** is no longer required for that.

Renderer never receives a filesystem API. Main maps UUID tokens to already-validated paths and serves bytes once over the privileged `cmflow-pdf://preview/<token>` scheme. PDF documents are not sent repeatedly over IPC. Thumbnails render at low resolution, lazily (IntersectionObserver), with a small concurrent-render cap. Grids with more than 80 pages window the DOM.

Encrypted and invalid files get no preview token.

## Known limitations (3.7)

- Split creates **one** combined PDF. Extract-each-selected-page-as-separate-files is follow-up (TD-013).
- Encrypted PDFs have no page thumbnails (unlock first).
- Very large documents virtualize the thumbnail DOM after 80 pages; tiles still load lazily.
- No in-flight Cancel (qpdf adapter does not expose safe cancellation).
- Duplicate merge paths are skipped; there is no UI to insert the same file twice on purpose.
- No automatic vehicle-folder detection.

## Privacy

Local-only. No upload, no OCR, no AI, no document-content logs. Paths in diagnostics stay basename-only via existing `sanitizePathForLogs`.
