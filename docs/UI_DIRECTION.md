# UI Direction

Status: Accepted — exact CM Flow Manager asset-pack UI, 2026-08-17

## Source of truth (priority order)

1. `assets/cm-ui/refs/01-dashboard-target.png` — layout and composition
2. `assets/cm-ui/` production pack (see `INVENTORY.md`)
3. `assets/cm-ui/refs/02-design-system.png` — tokens / icon language
4. Existing functional behaviour (Password Remover, updater, i18n)
5. Current code

Do **not** use chwalibog-motors.pl as a layout reference.

## Rules

- Do **not** redesign the dashboard or invent a competing visual language
- Desktop productivity app — not a marketing site
- Text, nav, buttons, cards, inputs stay real React UI (not screenshots)
- No fabricated recent files / statistics
- Future modules: visually complete cards + “Wkrótce” / Coming soon
- Brand/module graphics: supplied rasters only (no Lucide substitutes)
- Ordinary UI icons: one thin-line family until pack mono exports exist (TD-003)
- Remaining pixel fidelity: `docs/TECH_DEBT.md` TD-001–TD-007

## Tokens

| Token | Value |
| --- | --- |
| CM Navy | `#0B1F4A` |
| CM Blue | `#143A7B` |
| CM Yellow | `#FFC107` |
| CM Light Gray | `#F2F4F7` |
| Border | `#E1E5EA` |
| Success / Error / Warning / Muted | `#28A745` / `#DC3545` / `#FF8C00` / `#6C757D` |

Typography: Inter. Scale H1 28/700, H2 22/600, H3 16/600, Body 14/400, Small 12/400.

## Shell

- Navy sidebar (~17.5% at reference width), yellow left rail on active item, CM watermark, contact footer
- Compact light top bar (theme, language, user placeholder)
- Hero: supplied workshop + navy composition; localized React copy
- Quick access: four equal cards, pack module graphics, divider + CTA
- Lower panels: recent-files structure (empty until real data); stats 2×2 with zeros
- Status strip: address, real engine status, version, clock

## Shared components

Under `apps/desktop/src/renderer/src/components/cm/`:
icons, SidebarItem, DashboardHero, ToolCard, SectionHeader, EmptyState, StatusBadge, StatCell, DashboardPanel
