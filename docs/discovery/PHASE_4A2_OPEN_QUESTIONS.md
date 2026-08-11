# Phase 4A.2 — Open Questions

Status: **draft — awaiting human approval**  
Date: 2026-08-11  
Rule: prefer **UNKNOWN** over invention.

## Domain / commercial

1. What is the shop’s authoritative **normalia** rule when the invoice line has **no %**? Is it always 2% of parts net, or configurable per insurer/client?
2. When estimate parts are omitted from the invoice, what reason codes should Process B offer (not used / included in another line / commercial write-off / error)?
3. For `akcept_zmniejszony` vs `akcept_dod`, which document is the **approved baseline** if multiple Audatex PDFs exist for one claim?
4. Should Process B compare **gross**, **net**, or both, as primary residual?

## Document coverage gaps

5. No non-Audatex estimate in this set — Qapter / other systems still **UNKNOWN**.
6. No multi-VAT-rate invoice observed.
7. No credit note / corrective invoice pair.
8. No welding / disposal / environmental surcharge lines observed.
9. CASE-4A2-01 estimate content unknown until OCR or digital re-issue.
10. Need more cases where invoice labour is `rbg` **and** Audatex uses **non-10** JC/RBG (03 is lump-only on invoice).

## Part identity

11. Is leading **`A`** on Mercedes invoice codes always a shop/OEM formatting prefix removable for normalization?
12. When Audatex marks `>` superseded, how should matching treat the replacement number if only one side shows it?
13. Are duplicate identical OEM lines always L/R or front/rear variants, or can they be true duplicates/errors?

## Labour / paint

14. How should paint labour be converted when both `10 JC/RBG` and `12 JC/RBG` labels appear (CASE-4A2-03)? Prefer final-calc amount only?
15. Is `usl` lump labour on invoices always category-totalled from Audatex, or can it include extras not in estimate?

## Technical

16. Preferred extract path before OCR: continue PDF text, vendor export XML/CSV, or shop DMS API?
17. Acceptable grosz tolerance for “equal” money after decimal arithmetic?
18. Should sanitized fixtures be synthetic rebuilds only, or redacted real text snapshots?

## Privacy / compliance

19. Owner confirmation: may discovery docs keep **masked** plate/VIN patterns, or identifiers must be fully synthetic?
20. Retention policy for local `Exemples` PDFs and `.tmp-discovery` extracts on developer machines.

## Phase sequencing

21. Approve Phase 4A.2 docs before Phase **4B** canonical model freeze?
22. Is OCR for scan estimates in **4C** or a dedicated spike?

---

## Explicit non-answers (not claimed)

- Universal `10 JC = 1 RBG` for all systems — **rejected** as global rule; Audatex prints **document-local** `N`.
- Universal normalia formula for all shops — **UNKNOWN** (2% observed on these Audatex finals only).
- Equivalence of different OEM digit strings — **not proven**.
- Process A missing-operation rules — **out of scope** for 4A.2.
