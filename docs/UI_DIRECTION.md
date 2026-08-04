# UI Direction

Status: Accepted (Phase 1.5 design system established)

## Philosophy

CM Flow Manager is a **professional desktop productivity tool**, not a web analytics dashboard.

Visual goals:

- clean, modern, minimal, compact
- keyboard-friendly
- left navigation
- dark and light themes supported (system default remains valid)
- Dashboard with Quick Actions, Recent Activity, and local-processing status
- module-oriented cards/navigation
- **no** unnecessary charts, fake analytics, or decorative widgets

## Design system

- **Tailwind CSS v4** via `@tailwindcss/vite` (built-in vendor prefixing; classic PostCSS + Autoprefixer not required separately)
- **shadcn/ui** (New York style) as the component system
- Official shadcn **`dashboard-01`** is inspiration only — do not copy wholesale

## Installed shadcn primitives (Phase 1.5)

- Button
- Card
- Input
- Label
- Separator

Add more components only when a real screen needs them.

## Phase 3A Password Remover screen

Production-oriented single-file unlock UI on `/pdf-tools/password-remover`:

- privacy notice, drag-and-drop zone, select button, selected-file card
- inspection / encryption status, password field with show/hide (encrypted only)
- suggested output path + Change destination, Unlock action
- progress, success/error results, open output folder, reset

Do not redesign unrelated screens while iterating on this module.

## Layout expectations

- Compact sidebar + content pane
- Honest empty states (no fabricated activity)
- Local-processing status visible on Dashboard
- Avoid redesign churn while implementing PDF workflows
