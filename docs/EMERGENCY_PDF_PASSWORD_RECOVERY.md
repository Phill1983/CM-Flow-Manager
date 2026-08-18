# Emergency PDF Password Recovery (future)

**Status:** planned / not scheduled / **do not implement**  
**Does not block:** Phase 3.7 completion, Phase 4C, or other repair-track work  
**Canonical spec:** this file. Roadmap and backlog only point here.

This is **not** a v0.1.0 feature. It is **not** the next development phase after 3.7. It remains owner-gated until organizational, legal, and security questions below are answered.

## Business problem

CM Flow Manager receives password-protected PDFs from external experts / assessors. Sometimes the sender sets or communicates the wrong password, forgets it, or otherwise leaves the file inaccessible. The existing Password Remover covers only the **known-password** case. Re-requesting the file causes operational delay.

The intended future capability is a **controlled emergency recovery** for legitimate business documents — not an unrestricted generic PDF cracker.

## What this is not

- Anonymous or silent recovery
- A generic “crack PDF” UI
- Background recovery without a request
- Recovery that starts before approval
- A second PDF unlock engine beside qpdf (reuse `PdfEngineService` / Password Remover after a password is obtained)
- A guarantee that every encrypted PDF can be recovered
- A claim that visible PDF marking cannot be removed

## Workflows

**Normal (already shipped):** encrypted PDF → user knows password → Password Remover → qpdf unlock.

**Emergency (future):**

```text
Encrypted PDF
  → known password fails / password unavailable
  → Request Emergency Recovery
  → authenticated requester identity
  → mandatory business justification
  → approval request
  → authorized approver APPROVE / REJECT
  → only after approval may recovery processing begin
  → recovery result
  → controlled output + visible marking
  → audit trail
```

No recovery attempt may start before approval.

## Authorization model (conceptual)

**Requester:** authenticated CM Flow Manager user; real name; corporate email / identity; timestamp.

**Request:** event/request ID; document identifier (**prefer SHA-256 of the local file**, not an upload); business justification; filename only if policy later permits.

**Approver:** configured authorized person or role (e.g. director, manager, administrator). Who that is remains an **open policy question**.

**Possible future approval transport** (none chosen): email approval; corporate identity / SSO; local + remote approval service.

Approval should preferably produce a **short-lived, single-use, request-bound** authorization token. Recovery processing must not run without that token (or an equivalent explicit grant).

## Privacy

PDF **contents stay local by default**. Approval infrastructure must not require uploading the PDF.

Send only minimum metadata, for example:

- request / event ID
- requester identity and corporate email
- timestamp
- reason
- filename if policy permits
- SHA-256 fingerprint
- application / device metadata where justified

Do not send document bytes unless a **future explicit architecture decision** allows it.

Any approval/network path would be a **new, allowlisted exception** (today the only network exception is GitHub Releases for updates — ADR-007). That exception is **not** approved yet.

## Recovery processing (research later)

Do **not** hard-code a commercial recovery product now.

Conceptual boundary: `PasswordRecoveryService`

- **Input:** local PDF; approved authorization; recovery policy
- **Results (examples):** `recovered` | `not_found` | `timeout` | `cancelled` | `unsupported` | `failed`

If a password is recovered, **reuse existing qpdf / `PdfEngineService` unlock**. Do not duplicate the PDF engine. Do not design a second unlock path if the current pipeline can write the emergency copy.

Rate/resource limits, explicit cancellation, and timeouts are required in any later design.

Recovered passwords: **do not log**. Do not store unless an explicit future security decision allows a secure store.

## Audit trail

The audit record is the **authoritative evidence**. It must survive independently of visible PDF marking.

Consider fields such as:

| Field | Intent |
| --- | --- |
| `eventId` | Stable request/event identifier |
| `originalFileSha256` | Input fingerprint |
| `outputFileSha256` | Emergency copy fingerprint |
| `requestedBy` / `requestedByEmail` | Requester attribution |
| `approvedBy` | Approver attribution |
| `reason` | Mandatory justification |
| `requestedAt` / `approvedAt` | Authorization timeline |
| `recoveryStartedAt` / `recoveryCompletedAt` | Processing timeline |
| `recoveryMethod` / category | Method class, not a secret |
| `result` | Outcome enum |
| `applicationVersion` | Build that ran recovery |

Retention of these records is an **open policy question**.

## Output marking

A successful recovery should produce a clearly identifiable **emergency-access copy**. The source PDF is **never** modified.

Conceptual visible marking (example text, not a locked design):

```text
EMERGENCY PASSWORD RECOVERY
Recovered for: <user>
Corporate identity: <email>
Approved by: <approver>
Date/time: <timestamp>
Event ID: <eventId>
```

Do **not** document watermarks as impossible to remove. Plan defense-in-depth:

1. Visible marking on the copy
2. Independent audit record
3. SHA-256 of original and output
4. Future digital signature / organizational seal **if** later approved

## Security constraints

- No anonymous emergency recovery
- No recovery before approval
- No generic unrestricted cracking UI
- No silent background recovery
- Mandatory reason; requester and approver attribution
- Auditability
- Local document processing by default
- Least privilege; allowlisted IPC only
- No weakening of Electron sandbox / `contextIsolation` / renderer isolation
- No renderer filesystem or process APIs
- No password logging; no recovered-password logging unless a later security decision allows secure storage
- Rate and resource limits; cancellable; time-bounded

## Failure behavior

Recovery is **not guaranteed**. The UI must distinguish at least:

| Outcome | Meaning |
| --- | --- |
| Authorization rejected | Approver denied the request |
| Unsupported | Encryption / method not supported |
| Password not recovered / `RECOVERY_NOT_POSSIBLE` | Attempt finished without a password |
| Timeout | Policy or engine time bound |
| User cancelled | Operator stopped the attempt |
| Technical failure | Unexpected error |

No source PDF may be modified in any outcome.

## Open questions (do not invent answers)

Before any implementation phase is opened, the owner must confirm:

1. Organizational authorization policy
2. Who may **request** recovery
3. Who may **approve** it
4. Retention policy for audit events
5. Privacy / employee-monitoring implications
6. Licensing of any third-party recovery engine
7. Acceptable recovery methods
8. Corporate security approval
9. Whether identity is local accounts, SSO, or another store (the product has **no user accounts** in v0.1.0)
10. Approval transport (email vs SSO vs local+remote service)
11. Whether any metadata besides hash/filename may leave the machine

## Dependencies on future identity / backend

This phase **cannot** be a local-only qpdf feature. It depends on:

- Authenticated user identity (not in v0.1.0)
- Configured approver role/person
- Approval transport and short-lived request-bound tokens
- Durable audit storage
- Optional later: signing / organizational seal

Until those exist, agents must **not** start this work.

## Placement

Unnumbered **future phase** after the current PDF tooling foundation (Password Remover + Split/Merge). **Not** Phase 3.8 (that would imply “next after 3.7”). **Not** part of repair 4A–4F. **Not** Password Remover Phase 4 (that remains batch **known-password** unlock).
