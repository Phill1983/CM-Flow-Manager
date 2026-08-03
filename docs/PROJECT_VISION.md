# Project Vision

## Product name

**CM Flow Manager**

## Purpose

Provide a modular desktop workspace for people who repeatedly work with PDFs, cost estimates, service documents, and office workflows — without sending files to the cloud.

## Principles

1. **Local-first** — processing happens on the user’s machine.
2. **Privacy by design** — no document uploads; no analytics in the initial product.
3. **Modular growth** — new tools plug into a shared shell without rewriting core platforms.
4. **Honest UX** — clear statuses and errors; no fake “coming soon” buttons that look broken.
5. **Security defaults** — Electron hardening, least-privilege IPC, careful password handling.
6. **Small-team maintainability** — explicit boundaries, documentation, tests, and phased delivery.

## Primary user outcomes (MVP)

A user who knows a PDF password can unlock one or many PDFs into separate output files, see per-file results, and open the output folder — entirely offline.

## Long-term direction

Become the home for additional PDF utilities and domain-specific workflow tools (service, estimating, Audatex-related helpers, data extraction). Those modules are intentionally out of scope for v0.1.0.

## Success definition for v0.1.0

Installable Windows app that safely unlocks known-password PDFs in batch, with secure Electron defaults, localized UI, tests, and documentation that matches reality.
