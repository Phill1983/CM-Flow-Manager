# Repair knowledge library

Phase 4A.1 introduces a **local, versioned knowledge library** for future repair-document modules. Nothing here is executable production logic yet.

## Contents

| Document | Role |
| --- | --- |
| [REPAIR_KNOWLEDGE_BASE.md](./REPAIR_KNOWLEDGE_BASE.md) | Overall structure and separation of knowledge domains |
| [ESTIMATE_QA_KNOWLEDGE.md](./ESTIMATE_QA_KNOWLEDGE.md) | Process A — pre-approval estimate completeness / repair logic |
| [INVOICE_VALIDATION_KNOWLEDGE.md](./INVOICE_VALIDATION_KNOWLEDGE.md) | Process B — post-repair estimate ↔ invoice reconciliation |
| [AI_LEARNING_POLICY.md](./AI_LEARNING_POLICY.md) | Approved vs candidate knowledge; no autonomous promotion |

Related: [../BUSINESS_PROCESSES.md](../BUSINESS_PROCESSES.md)

## Hard rules

- Do **not** mix Estimate QA rules with Invoice Validation rules in one catalog.
- Documents and extracted business data remain **local by default**.
- Cloud AI, if ever offered, must be **optional and explicit**.
- AI may propose candidates; **humans approve** production knowledge.
