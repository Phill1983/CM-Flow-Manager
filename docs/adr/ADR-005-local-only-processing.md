# ADR-005: Local-Only Processing

- Status: Accepted
- Date: 2026-08-03

## Context

Users handle potentially confidential PDFs (estimates, service docs). Trust requires offline capability and no silent exfiltration.

## Decision

- All MVP document processing is local.
- No analytics/telemetry in v0.1.0.
- No cloud upload of user documents.
- Auto-update disabled until separately designed and reviewed.
- Network usage unrelated to document processing (if any later) must be documented and optional.

## Consequences

- Cannot rely on SaaS PDF APIs.
- Must ship capable local engines (qpdf).
- Simpler privacy story; fewer compliance burdens for MVP.

## Alternatives considered

- Hybrid cloud unlock — rejected for MVP privacy goals.
