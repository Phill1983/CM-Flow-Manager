# CM UI Asset Inventory

Source pack sheet: `assets/ChatGPT Image 12 серп. 2026 р., 20_35_58.png`  
References: `01-dashboard-target` ← `08_11_39.png`, `02-design-system` ← `08_34_54.png`

Extracted production assets live in `assets/cm-ui/` and are mirrored to `apps/desktop/src/renderer/src/assets/cm-ui/`.

| Filename | Usage | Destination | Type | Display size | UI location |
| --- | --- | --- | --- | --- | --- |
| `refs/01-dashboard-target.png` | Layout composition target | assets/cm-ui/refs | raster | full mock | design reference only |
| `refs/02-design-system.png` | Tokens / iconography | assets/cm-ui/refs | raster | full board | design reference only |
| `refs/03-asset-pack-sheet.png` | Pack sheet archive | assets/cm-ui/refs | raster | sheet | design reference only |
| `logo/cm-app-icon.png` | CM mark | renderer cm-ui/logo | PNG | 40–48px | Sidebar brand |
| `logo/cm-app-icon-256.png` | App mark large | renderer cm-ui/logo | PNG | 256 | packaging / brand |
| `logo/cm-flow-manager-logo.png` | Wordmark crop from pack | renderer cm-ui/logo | PNG | ~180×60 | Sidebar (fallback; React text preferred for i18n) |
| `modules/pdf-password-remover.png` | Module graphic | renderer cm-ui/modules | PNG | ~96–112px | Quick Access card 1 |
| `modules/pdf-split-merge.png` | Module graphic | renderer cm-ui/modules | PNG | ~96–112px | Quick Access card 2 |
| `modules/repair-intelligence.png` | Module graphic | renderer cm-ui/modules | PNG | ~96–112px | Quick Access card 3 |
| `modules/comparisons.png` | Module graphic | renderer cm-ui/modules | PNG | ~96–112px | Quick Access card 4 |
| `hero/hero-banner.jpg` | Full hero strip from target | renderer cm-ui/hero | JPG | fluid ~1600×260 | Dashboard hero background |
| `hero/hero-background.jpg` | Navy left field | renderer cm-ui/hero | JPG | fluid | Hero left layer |
| `hero/hero-image.jpg` | Workshop photo | renderer cm-ui/hero | JPG | fluid | Hero right |
| `hero/cm-watermark.jpg` | CM watermark tile | renderer cm-ui/hero | JPG | cover | Hero / sidebar watermark |
| `graphics/sidebar-bg.jpg` | Sidebar watermark | renderer cm-ui/graphics | JPG | cover | Sidebar bottom |
| `icons/filetypes/pdf.png` | PDF badge | renderer cm-ui/icons/filetypes | PNG | 32 | Recent files rows |
| `icons/filetypes/xlsx.png` | XLSX badge | renderer | PNG | 32 | Recent files (future) |
| `icons/filetypes/docx.png` | DOCX badge | renderer | PNG | 32 | Recent files (future) |
| `icons/filetypes/csv.png` | CSV badge | renderer | PNG | 32 | Recent files (future) |
| `brand/colors.json` | Exact tokens | assets/cm-ui/brand | JSON | n/a | Design tokens source |
| `brand/typography.json` | Type scale | assets/cm-ui/brand | JSON | n/a | Typography source |

**Notes**

- Module icons were cropped from `01-dashboard-target.png` Quick Access cards (highest fidelity circles in the pack deliverables).
- Hero banner cropped from `01-dashboard-target.png` (integrated navy + workshop blend).
- Ordinary UI icons (nav/theme/user) remain one thin line-icon React set — pack sheet line icons are white-on-navy composites unsuitable as mono UI glyphs without dedicated exports.
- File-type badges regenerated to pack colors when isolated transparent cuts were not available on the sheet.
