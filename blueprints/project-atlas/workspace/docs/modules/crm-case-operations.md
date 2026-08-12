# CRM and case operations — domain guide

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Active routing guide; no Build gate
- Catalog modules: M017, M018, M019, M020, M021, M022 and M023

This document is the cross-module guide for commercial and operational work. It is not a substitute
for the implementation-ready module PRDs and does not give M017 ownership of every concept shown in
the CRM experience.

## Canonical boundaries

| Concern | Canonical module | Detailed PRD status |
|---|---|---|
| CRM relationship, opportunity, pipeline, assignment and CRM activity | [M017](m017-crm.md) | Product/Architecture candidate |
| Person, Household and formal Client relationship | M018 | Source accepted; sequential candidate follows M017 |
| Organization/business and person-organization relationship | M019 | Concept/source intake |
| Lead, public capture handoff and lead duplicate handling | M020 | Concept/source intake |
| ServiceOrder/commercial service contract | M021 | Concept/source intake |
| CaseFile/operational service execution | M022 | Concept/source intake |
| Task/work item | M023 | Concept |

M017 presents an authorized CRM composition, not a second Person, Client, Organization, Lead,
ServiceOrder, CaseFile or Task database. M017 may request owner commands and retain typed receipts;
owner modules validate and persist their own state.

## Relationship flow

```text
Public/channel submission
        ↓ M006/M020 + M078 consent evidence
Lead (M020)
        ↓ authorized handoff
CRM relationship + Opportunity (M017)
        ↓ independent approved conversion steps
Client relation (M018) + ServiceOrder (M021) + CaseFile (M022)
        ↓
Tasks (M023), Documents (M011), Messages (M012/M025), Appointments (M013)
```

No arrow means automatic creation. `Opportunity won`, `payment confirmed`, `Client active`,
`entitled`, `authorized to start`, `Case in progress` and `completed` are independent facts.

## Shared invariants

- Default-deny authorization is enforced in domain services and Postgres RLS.
- Email/phone/name/company/payment relationships do not grant identity or resource access.
- Every cross-module drill-down reauthorizes in the canonical owner.
- Consent M078 and notification preferences M026 are checked fresh before communication.
- Notes, messages, tasks, activity and audit events remain different record types.
- Duplicate candidates never merge automatically; canonical person resolution belongs to M018.
- All retries use semantic idempotency; ambiguous outcomes reconcile before retry.
- Inngest coordinates jobs but does not own durable business state.
- Product Owner decisions and an explicit Build gate are required before product implementation.

## Source coverage

The former combined M017/M020 draft has been superseded for M017 by the complete Product Owner
source normalization in `m017-crm.md` and proposed ADR 021. Capabilities owned by M018–M023 remain in
the 110-module roadmap and will be normalized sequentially rather than silently absorbed into M017.
