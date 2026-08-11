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

Become the home for additional PDF utilities and **domain-specific repair-document workflows**, in addition to service/office tools.

### Repair document workflows (post–v0.1.0 track — Phase 4A+)

CM Flow Manager will treat these as **two separate business processes** (see [BUSINESS_PROCESSES.md](./BUSINESS_PROCESSES.md)):

1. **Estimate Quality Review (Process A)** — before estimate approval: completeness and repair-logic validation (e.g. possible missing calibrations, coding, diagnostics). Advisory, traceable findings — not invoice comparison.
2. **Invoice Validation (Process B)** — after approved estimate, repair, and invoice: financial and positional reconciliation with full difference decomposition — not a substitute for Process A.

Supporting knowledge is local, versioned, and human-gated ([knowledge/](./knowledge/README.md)). AI may propose candidates; it must not silently decide or auto-promote rules.

Other modules (OCR, Audatex integrations, ServiceFlow, etc.) remain intentionally out of scope for v0.1.0.

## Success definition for v0.1.0

Installable Windows app that safely unlocks known-password PDFs (single-file now; batch later in Password Remover Phase 4), with secure Electron defaults, localized UI, update foundation, tests, and documentation that matches reality. Repair Estimate QA / Invoice Validation are **not** v0.1.0 deliverables.
