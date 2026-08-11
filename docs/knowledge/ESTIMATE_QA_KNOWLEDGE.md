# Estimate QA Knowledge (Process A)

Status: Phase 4A.1 category definition  
Process: **Estimate Quality Review**  
Timing: **Before** estimate approval by insurer, Arval expert, or other authorizing party

## Objective

Support checks that a repair estimate is **complete**, **technically consistent**, and includes **potentially required technological operations**.

This catalog is **not** for estimate↔invoice money reconciliation.

## When applied

- After estimate preparation
- Before (or as input to) estimate approval
- Findings are **advisory** and **traceable**

## Normative statements

1. These rules are applied **before estimate approval**.
2. Warnings must be **advisory** and **traceable** to evidence on the estimate and/or an approved rule/source.
3. The system must **not** claim that an operation is **certainly required** unless supported by an **approved** rule or an **authoritative** source recorded on that rule.
4. Uncertainty must remain visible (`possible`, `suggested check`, `insufficient data`).

## Knowledge categories (future)

| Category | Intent (examples) |
| --- | --- |
| ADAS calibration | ADAS-related calibration operations possibly required by damage/repair path |
| Camera calibration | Front/surround camera calibration after related R&R or structural work |
| Radar calibration | Radar sensor calibration after related operations |
| Coding | Control-unit coding possibly required |
| Programming | Software programming / flashing possibly required |
| Diagnostics | Pre/post diagnostic scan possibly required |
| Wheel alignment | Geometry/alignment after suspension/structural work |
| Battery registration | HV/12V battery registration / BMS procedures |
| Paint dependencies | Paint stages implied by parts/labour already present |
| Dismantling dependencies | R&I / dismantling implied by repair method |
| Repair consistency | Internal contradictions (e.g. replace vs repair conflict) |
| Manufacturer-specific procedures | OEM procedure packs / brand-specific steps |
| Possible missing technological operations | Catch-all for other omitted tech ops — still advisory |

## Non-goals

- Comparing estimate lines to an invoice
- Asserting financial correctness of prices or totals
- Silently inserting estimate lines
- Treating frequent human omissions as automatic truth (see AI learning policy)

## Linkage

- Lifecycle stage: [BUSINESS_PROCESSES.md](../BUSINESS_PROCESSES.md) §3  
- Rule template: [REPAIR_KNOWLEDGE_BASE.md](./REPAIR_KNOWLEDGE_BASE.md)  
- Future engine: `EstimateQaEngine` (conceptual only)
