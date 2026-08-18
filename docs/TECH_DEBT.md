# Technical Debt

Living registry of engineering debt. **Features** go in `BACKLOG.md`. **Product/engine limits** go in `KNOWN_LIMITATIONS.md`. **This file** is work we already shipped that still needs a later pass.

Jarwis must keep this file current (see `.cursor/rules/11-tech-debt.mdc`).

## How to add an item

1. New row with the next `TD-NNN` id.
2. Status: `open` | `accepted` (known, not blocking) | `parked` (needs owner) | `paid`.
3. Include **Description**, **Reason** (Why it exists), **Impact**, **Risk**, **When to resolve** (Next action). Point to files or tests. Do not hide debt in chat-only notes.
4. Do not treat an open item as a license to start unpaid work in the current phase.

## Open

| ID | Area | Item | Why it exists | Next action |
| --- | --- | --- | --- | --- |
| TD-001 | UI | Pixel-perfect match to `01-dashboard-target.png` (alias **UI-ASSET-001**) | Asset-pack UI is landed; remaining visual delta is polish | Correction pass vs target: hero diagonal blend, card/module scale, sidebar watermark strength, density at 1600×1000 |
| TD-002 | UI | App still uses earlier `assets/cm-ui/` crops; a fuller pack exists unused | `assets/cm-flow-manager-ui-assets/` (2026-08-17) has modules, filetypes, statistics, status, bottom-bar, backgrounds | Swap production renderer assets to that pack; delete leftover `_extract/` and unused `dashboard-hero.jpg` / `sl_content_bg.jpg` if unreferenced |
| TD-003 | UI | Ordinary nav/theme/user icons are a thin-line SVG set, not pack-sheet glyphs | Pack sheet icons are white-on-navy composites, unusable as mono UI glyphs | Dedicated mono SVG/PNG exports from the pack; then swap `components/cm/icons.tsx` |
| TD-004 | UI | File-type badges (PDF/XLSX/DOCX/CSV) were regenerated in pack colors | Isolated transparent cuts were not available on the sheet | Replace with true pack cuts when exported |
| TD-005 | UI | Unused Ubuntu font still listed beside Inter | UI Target first used Ubuntu; exact pack specified Inter | Remove `@fontsource/ubuntu` if unused; confirm `styles.css` has no Ubuntu leftover |
| TD-006 | UI | Dev screenshot hook in Electron main (`CM_CAPTURE_OUT`) | Added for visual compare; not a product feature | Extract to a dev-only script or drop before public release |
| TD-007 | UI | Duplicate / leftover extract assets | `_extract/` working crops and duplicate ChatGPT sheets vs `assets/cm-ui/` | Delete `_extract/`; keep one canonical pack tree |
| TD-009 | Tooling | No Playwright / RTL UI automation | Phase 3A used domain/unit tests | Add when a UI-automation phase is approved |
| TD-010 | Tooling | Corepack global enable may need elevation on this machine | Windows environment | Document workaround only; do not change packageManager pin |
| TD-011 | Release | Unsigned Alpha: SmartScreen “Unknown publisher”; `verifyUpdateCodeSignature=false` | No Authenticode certificate yet | Sign builds; then enable update signature verification |
| TD-012 | Release | Portable in-place update is best-effort | electron-updater + portable layout | Prefer NSIS for auto-install; document portable limits (also in KNOWN_LIMITATIONS) |
| TD-013 | PDF | Split does not write each selected page as a separate PDF | Phase 3.7 shipped the workshop workflow: one combined extract file | Optional follow-up after 3.7 approval; do not mix into 4C |

## Paid

| ID | Area | Item | Closed |
| --- | --- | --- | --- |
| TD-008 | PDF | Integration test `incorrect_password` received `unlocked` | 2026-08-17 Phase 3.7: damaged `qpdf --empty` fixtures made `--is-encrypted` exit 2 (treated as unencrypted). Regenerated one-page `plain.pdf` then encrypted copies. Unlock/qpdf spawn code unchanged. Test now passes. |

## Notes

- **2026-08-17:** Owner accepted current asset-pack UI for commit/push. Remaining UI fidelity work is **TD-001–TD-007**, not a blocker for Phase 4B. A second, more complete crop pack (`assets/cm-flow-manager-ui-assets/`) arrived the same day and is **not wired yet** (TD-002).
- **2026-08-17:** Phase 3.7 Split/Merge + local page preview implemented (awaiting approval). TD-008 closed by fixture regeneration (not an unlock-logic change). TD-013 records per-page extract files as follow-up.
