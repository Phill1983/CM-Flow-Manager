# Invoice Validation Knowledge (Process B)

Status: Phase 4A.1 category definition (+ Phase 4A.2 evidence cross-link)  
Process: **Invoice Validation**  
Timing: **After** approved estimate + completed repair + invoice created

Real-document field inventory (draft): [docs/discovery/](../discovery/README.md).

## Objective

Compare the **approved estimate** with the **final invoice** and explain **every numerical difference** with traceable causes where possible.

This catalog is **not** for deciding whether calibration or another technological operation should originally have appeared on the estimate (Process A).

## When applied

- Approved estimate is the baseline
- Invoice is the candidate settlement document
- Reconciliation explains how component differences contribute to the **total difference**

## Normative statements

1. Every numerical difference should be **decomposed** into traceable causes where possible.
2. The reconciliation result should show how individual differences **add up** to the total difference (including an explicit **unexplained residual** if any).
3. Deterministic arithmetic on extracted/normalized amounts is the **source of truth**; AI may explain, not invent balances.
4. Different part numbers are **not** treated as equivalent unless Parts Intelligence + **human confirmation** say so.

## Comparison categories (future)

| Category | Intent |
| --- | --- |
| Missing estimate line | Approved estimate position absent on invoice |
| Missing invoice line | Invoice position absent on approved estimate |
| Part number mismatch | Identifiers differ after normalization |
| Part price difference | Unit/extended part price differs |
| Quantity difference | Qty differs |
| Discount difference | Discount amount or rate differs |
| Labour-hours difference | Hours differ |
| Labour-rate difference | Rate differs |
| Paint difference | Paint value / stages differ |
| Materials difference | Materials value differs |
| Normalia difference | Normalia/consumables differ (e.g. changed parts base) |
| VAT difference | Tax differs |
| Total difference | Document totals differ |
| Unexplained residual difference | Portion of total difference not yet attributed |

## Reconciliation output expectations (conceptual)

- Position-level findings with evidence pointers into both documents
- Monetary/hours decomposition table
- Residual unexplained amount (may be zero)
- Clear labeling when a cause is **unresolved**

## Non-goals

- Pre-approval completeness of technological operations (Process A)
- Silent write-off of residuals
- Autonomous acceptance of part supersession without human review

## Linkage

- Lifecycle stage: [BUSINESS_PROCESSES.md](../BUSINESS_PROCESSES.md) §7  
- Parts classifications: [REPAIR_KNOWLEDGE_BASE.md](./REPAIR_KNOWLEDGE_BASE.md) + section below in AI/Parts docs  
- Future engine: `InvoiceValidationEngine` (conceptual only)

## Parts Intelligence (shared classifications)

When part numbers differ, future classification MUST use one of:

| Classification | Meaning |
| --- | --- |
| Exact match after normalization | Same identity after formatting/normalization |
| Superseded OEM number | Official supersession chain |
| Equivalent OEM number | Documented OEM equivalence |
| Alternative supplier | Different supplier, claimed same fitment |
| Aftermarket replacement | Non-OEM replacement claim |
| Kit versus component | Kit vs included component relationship |
| Typo or formatting difference | Likely clerical/format issue |
| Probable unrelated part | Likely not the same part |
| Unresolved | Insufficient evidence |

**AI** may investigate and explain possible reasons.  
**AI must not** silently treat different part numbers as equivalent.  
**Human confirmation** is required before a discovered relationship becomes **approved** knowledge.
