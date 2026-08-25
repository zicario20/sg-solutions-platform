# M031 - Bookkeeping and Accounting

- Status: controlled internal implementation in progress; Product Owner acceptance pending
- Domain owner: bookkeeping ledger and readiness policy

The implementation validates double-entry drafts, chart configurations and controlled period transitions; creates provider-disabled engagements; keeps classifications, duplicate candidates, receipt matches, splits, transfer matches and reconciliations reviewable; produces trial-balance, general-ledger, profit-and-loss and balance-sheet snapshots; gates close and tax handoff; blocks AI posting/tax-deductibility decisions; requires MFA and human approval for financial exports; and denies unapproved integrations.

The controlled Build Gate now includes a Drizzle-owned migration, PostgreSQL gateway, immutable posted-entry trigger, reviewable manual transaction/reconciliation records, authenticated read-only client projection and local command/query boundaries. The migration has not been executed and the repository contains no financial records. The module does not operate accounting, bank, tax or payment providers, and it is not operational until authorization adapters, migration evidence, independent security review and end-to-end validation are complete.

## Operational Build Gate matrix

| Area | Required implementation evidence | Required controls |
| --- | --- | --- |
| Persistence | Drizzle-owned schema, migrations, repositories, optimistic concurrency and historical snapshots | Migration backup, rollback and row-level authorization evidence |
| Financial data | Encrypted-at-rest provider configuration and restricted DTOs | No secrets, account numbers or transaction payloads in logs, analytics or URLs |
| APIs and UI | Authorized admin and client routes using existing navigation and design system | Resource authorization, purpose checks, CSRF, MFA for sensitive actions and accessibility tests |
| Ledger and close | Atomic journal posting, immutable audit history, controlled soft-close request and hard-close policy validation | Segregation of duties, close-review approval and reconciliation blockers; hard close/reopening remain non-operational |
| Imports and integrations | Manual reviewed source records, bounded outbox preparation and conflict policy | Provider-disabled by default, kill switches and fail-closed external behavior; no webhooks, workers or provider sync are active |
| Reporting and handoff | Reproducible internal reports and tax-ready readiness policy | Human review, no automatic tax calculation, filing or external export |
| Verification | Unit, integration, concurrency, security, accessibility and end-to-end evidence | Independent review and Product Owner acceptance before operational activation |

The Build Gate must explicitly identify which provider, environment, data classification, retention policy and rollback procedure are approved. A provider-enabled test sandbox is not production activation and must remain isolated from real client data.

## Administrative review boundary

The administrative route is protected by M007 active-role permissions and AAL2. A period-close approval must be performed by a different reviewer. Product Owner Decision 062 approves the M007 purpose-bound review delegation: a grant is restricted to one accounting entity, `bookkeeping_period_close_review`, both owner and reviewer authorization/policy epochs, an explicit expiry and revocation. The gateway verifies the grant inside the close-approval transaction and fails closed when it is absent, stale, expired or revoked.

## Incremental controlled-build evidence - 2026-08-25

This increment adds prepared-but-unexecuted persistence and internal routes for a provider-disabled bookkeeping foundation:

- Authenticated, permission-gated, private read-only report projections for trial balance, profit and loss, balance sheet, and general ledger.
- A CSRF-protected staff journal-entry command with deterministic request idempotency, integer minor units, balanced-entry validation, immutable posted entries, audit evidence, and transactional outbox creation.
- A CSRF-protected staff command to register a local financial account in an explicitly `not_connected` state. No bank feed, credential, or provider configuration is present.
- Bounded outbox claiming and stale-claim recovery. This is durable internal delivery preparation only; no external consumer or provider execution was enabled.

The Drizzle migration remains authored but has not been executed. The client surface remains read-only. No external accounting, tax, bank, payment, export, or deployment capability is implemented by this increment.

Product Owner Decision 062 removes the prior delegation-policy blocker only for an M007-issued `bookkeeping_period_close_review` grant. It does not grant general client-data access, posting authority, provider access, payment authority, tax authority or any external action.

### Follow-on controlled commands

The controlled internal build now also accepts manual source-transaction records and creates manual reconciliation sessions. Both are protected by M007 permission checks and CSRF mutation proof, use tenant/context fencing and stable idempotent references, and end in `review_required` rather than any automatic classification, reconciliation approval, close, tax calculation, or provider action.

### Entity, setup, integration and UI hardening

- Accounting entities now have a dedicated, M007-protected administrative setup command. It accepts only a token reference for a tax identifier, never a tax identifier value.
- An engagement, accounting book and bookkeeping case can only be created for an authorized accounting entity in the same owner, context and authorization/policy epochs. The authored migration contains matching foreign-key constraints; it remains unexecuted.
- Replaying an existing book setup returns the existing controlled book instead of treating the retry as a failed setup.
- The accounting integration contract models only a future provider reference. Its only currently constructible state is `not_connected`, with `sg_solutions` as source of truth, no capabilities and an active kill switch. No provider adapter, credential, webhook, polling or sync path exists.
- Opening balances and adjusting entries are explicit evidence-linked drafts. They must balance and remain subject to the existing controlled posting and close policy; neither is auto-posted.
- Merchant normalization, categorization rules, economic-transaction labels, client questions, cash-flow/comparative/variance reports, tax mapping and tax handoff are deterministic review contracts. They do not decide deductibility, trigger an external export or file a return.
- A client report package is created in `review_required` with client visibility and external export both disabled.
- The client view no longer renders opaque accounting-entity references or raw status codes. The administrative view now exposes an accessible loading state, selected-book semantics and a bilingual provider-disabled boundary.

No provider, bank account connection, QuickBooks/Xero access, financial export, tax calculation or filing, payment, migration execution, deployment, merge or release was performed.
