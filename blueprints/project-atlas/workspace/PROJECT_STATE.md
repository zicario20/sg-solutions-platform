# Project Atlas - Current State

- Version: 0.1.0-alpha.32
- Updated: 2026-08-24
- Phase: M016-M019 provider-disabled foundations accepted; functional activation remains separately gated
- Accepted base: M009 commit 6667872
- Next: an explicit Product Owner gate for the next module; provider activation remains separately gated
- Production: no deployment/live-provider authority

## Accepted provider-disabled progression

Decisions 032, 034–035, 037, 039, 041, 043–044 and 056 record accepted bounded scopes for M004–M009,
M013–M014 and M016–M019. Those decisions accept technical foundations only. They do not create live
providers, production data, migrations, deployment, release or Operational status.

## Current gate

M016–M019 are accepted provider-disabled technical foundations. Their routes, projections and UI
must fail closed when their canonical owner data is absent. They neither replace the owners for
Party/Client/Organization/ServiceOrder/Case/Task/Document/Message/Payment truth nor authorize
provider activation.

M010 remains an unaccepted provider-disabled closure candidate. M011 and M012 have implementation
evidence but remain unaccepted, unmigrated, undeployed and provider-disabled. Their document and
message flows must stay unavailable until the named Storage, scanner, retention, encryption and
authorization gates are approved and proven.

## Evidence limitations and blockers

- The 2026-08-24 repository audit repaired M007's stale secure-auth test fixtures. The focused
  M007/M011/M012/M014/M015/M018/M019 suite passed 60 files and 140 tests on this branch.
- Providers, configured owner data, real PostgreSQL migrations/RLS under production roles, browser
  behavior, full build, deployment and recovery testing remain unvalidated.
- Credentials, real client data, provider activation, merge, release and production authority remain
  outside every accepted provider-disabled scope.

## Next action

Do not activate a provider or treat any accepted foundation as operational. Begin only the next
module explicitly authorized by the Product Owner and preserve one-module-at-a-time execution.

## M012 implementation position

M012 secure messaging is implemented on its isolated branch with a PostgreSQL/RLS schema, encrypted
message bodies, M007/M008 session-and-context authorization, client inbox/detail projections,
internal-note isolation and M011 opaque-document references. It remains unaccepted, unmigrated,
undeployed and provider-disabled for external delivery, notifications and AI. Product Owner review
and independent security review remain required before any merge or activation.

## M013 implementation position

M013 client appointments now has a durable Postgres appointment authority, authenticated client
projection, bounded availability, expiring authorization-bound holds, serialized capacity changes,
idempotent booking, atomic rescheduling, version-fenced cancellation, schedule revisions, audit and
provider-neutral handoff outbox. Google Calendar, meeting, notification, payment, public-booking and
staff-calendar providers remain disabled. The module is accepted by the Product Owner only in
provider-disabled scope; it remains unmigrated, undeployed and not operational. Production
activation still requires real RLS/migration evidence, provider-specific review and a separate gate.

## M014 implementation position

M014 client payments and billing is accepted by the Product Owner in provider-disabled scope. It has typed payment-provider and
billing-provider boundaries, integer minor-unit USD contracts, account/context fencing, idempotency,
raw Stripe signature verification, RLS financial schema, a private bilingual payment surface and an
inert return page. It is not migrated, deployed or operational. Prices, payment orders,
Stripe traffic, invoices, refunds, disputes and provider credentials remain inactive pending policy,
security review and a separate Product Owner activation gate. Payment confirmation never starts a
service; internal human approval remains separate.
## M015 implementation position

M015 now has a provider-disabled typed profile foundation and protected bilingual client route. Outside
the narrowly approved Package B goals slice below, it implements no active field inventory, KMS
encryption, provider connection, profile data collection or relationship authority. Activation of
sensitive profile capabilities remains blocked on ADR 019 and the applicable PFL Product Owner
decisions, M018/M019 canonical relationships, M078 consent, M077 audit and purpose-specific RLS.

## M015 Package B implementation position

The Product Owner approved Package B for the narrow self-service goals slice. The isolated branch
adds a disabled-by-default personal-context route/API, PostgreSQL/RLS persistence and bilingual UI
for predefined general goals only. It records a notice version and review state, not free text,
financial, credit, tax, business, identity, document, consent or canonical relationship data.
No database migration, runtime activation, real client data, provider, deployment or Product Owner
acceptance of the full M015 module is recorded.

## M015 Package C direction

The Product Owner approved Package C as the next architectural direction. The PFL policy values
remain unresolved, so no sensitive field inventory, migration, KMS/encryption custody, staff access,
relationship behavior, retention, export, provider, AI, notification, analytics or runtime
activation is authorized.
## M015 C1 implementation position

The provider-disabled C1 home-buying financial proposal contract is implemented. It accepts only
self-reported monthly gross income and recurring monthly debt through a ciphertext-only persistence
boundary and returns a preliminary non-decisional DTI receipt. The UI/API remains unavailable because
the shipped data protector is deliberately unavailable and M015_HOME_BUYING_FINANCIAL_ENABLED=false.
No migration, KMS, real profile data, staff review, document, AI, provider, notification, analytics,
export or deployment is active. Other sensitive M015 purposes remain disabled.

## M017 implementation position

M017 has a provider-disabled CRM commercial-workspace baseline: typed relationship, opportunity,
pipeline-stage, activity and duplicate-review projections; exact permission and purpose-binding
fences; deterministic stage-transition validation; PII/content rejection; fail-closed Admin route/API;
and bilingual responsive internal UI. It owns no canonical identity, Client, Organization, Lead,
ServiceOrder, CaseFile, Task, Appointment, Message, Payment, Consent or audit truth. No tables,
migrations, real CRM records, merges, conversions, assignments, imports/exports, AI, providers,
deployment or product activation occurred. The Product Owner accepted it as a provider-disabled
technical foundation only; functional activation remains pending canonical owners.

## M018 implementation position

M018 has a provider-disabled Client Management baseline: typed ClientRelationship lifecycle and
representative-proposal safeguards, minimized Client 360 sections, PII/account rejection and a
fail-closed Admin route/API with bilingual internal UI. No people, households, client records,
assignments, representative grants, restrictions, notes, owner facts, migration, provider, AI,
deployment or operational activation occurred. The Product Owner accepted this as a technical
foundation only; functional activation remains pending canonical owners.

## M019 implementation position

M019 has a provider-disabled Organization Management baseline: organization and relationship
projections, reauthentication- and version-fenced state policy, formation proposal safeguards,
sensitive-field rejection and a fail-closed Admin route/API with bilingual internal UI. No organization,
ownership, registered-agent, filing, compliance, client-access, migration, provider, AI, deployment or
operational activation occurred. The Product Owner accepted this as a technical foundation only;
functional activation remains pending canonical owners.

## 2026-08-24 - Technical audit reconciliation

- M005-M019 provider-disabled audit completed with 136 passing test files and 436 passing tests.
- Corrected M006 attribution validation and stale M005/M007/M008/M010 test contracts; no provider, persistence, migration, deployment or operational workflow was activated.
- Provider connection inventory: `docs/runbooks/PROVIDER_AND_FUTURE_CONNECTIONS.md`.
- Product Owner acceptance remains distinct from technical verification and is still required where the catalog says pending.

## 2026-08-25 - M021 provider-disabled foundation

- M021A/M021B is in progress as one provider-disabled commercial module. Catalog validation, deterministic pricing, state availability and preliminary eligibility are implemented as local contracts only.
- No catalog persistence, service order, workflow, entitlement, Stripe, partner, marketplace referral, redirect, payment, provider, migration execution, deployment or production operation is active.

## M022-M026 implementation position

M022 Forms/Intake, M023 Tasks, M024 Human Approvals, M025 AI Hub and M026 DevSecOps now have provider-disabled local policy foundations only. They do not persist business records, activate providers, create external work, deploy infrastructure or claim Product Owner acceptance. M006 remains the public form authority; M021 remains the commercial owner.

- Focused evidence: Biome clean over the M021-M026 change set; direct TypeScript checks passed for eight affected packages; Vitest passed 17/17 tests in 9 files; `git diff --check` passed.
- Global limitation: repository-wide typecheck remains blocked by pre-existing `@atlas/client-process-status` M010 errors, and global formatting reports pre-existing diagnostics outside this change set.

## M027-M030 implementation position

M027 Governance/Privacy/Risk, M028 Analytics, M029 Tradeline Operations and M030 Tax Operations have provider-disabled local foundations only. They retain no legal, tax, credit, partner or client data; execute no disposition, referral, placement, filing or provider request; and are not accepted, deployed or operational.

- Focused evidence: Biome clean over the M027-M030 change set; direct TypeScript checks passed for four packages; Vitest passed 9/9 tests in 4 files.

## M031 implementation position

M031 Bookkeeping has an authorized controlled-internal Build Gate following its provider-disabled ledger and readiness-policy foundation. It creates isolated accounting books, limited-scope cases and unconnected financial-account registry entries; validates balanced double-entry drafts, chart configuration and controlled period transitions; keeps engagements, imports, classification, duplicate detection, receipt matching, splits, transfers and reconciliation reviewable; produces reproducible financial snapshots; requires human close review; prevents automatic tax filing; blocks AI posting/tax decisions; and fails closed for accounting integrations, external posting, closed-period sync conflicts and sensitive exports. Provider activation, tax calculation/filing, payment initiation, external financial exports, production deployment, merge and release remain unauthorized.

- Focused evidence: Biome clean over the M031 change set; direct TypeScript checks passed for `@atlas/bookkeeping` and `@atlas/database`; Vitest passed 29/29 tests in 8 files; `git diff --check` passed.

## M031 controlled implementation update

- A Drizzle-owned bookkeeping schema and migration were authored but not executed. The PostgreSQL gateway scopes every query to the authenticated owner, context and authorization/policy epochs.
- The gateway supports engagement, book, period and chart-account setup plus balanced posted journal entries in an open period, with immutable posted rows, audit evidence and outbox records in the posting transaction.
- The client bookkeeping route and page are authenticated read-only. Client mutation requests return `bookkeeping_mutations_not_enabled` until a separate administrative authorization adapter is approved and implemented.
- The gateway can register unconnected financial-account records, record idempotent manual source transactions for review, and create review-required reconciliation sessions. It does not connect, retrieve or synchronize any external financial account.
- No provider, financial-account connection, external synchronization, tax calculation/filing, payment, external export, deployment, merge or release is active.

### M007 purpose-bound close-review delegation (2026-08-25)

- Product Owner Decision 062 authorizes a revocable M007 grant for one AAL2 reviewer to review one accounting entity's period close.
- The grant is bound to owner and reviewer authorization/policy epochs, entity reference, expiry and revocation; M031 verifies it transactionally before soft close.
- The migration is authored but not executed. This does not activate providers, posting, payments, tax, external exports, deployment, merge or release.

### M031 controlled implementation update (2026-08-25)

- Prepared database migration remains unexecuted.
- Internal report, manual posting, and disconnected account-registry routes exist behind M007 authorization, AAL2 permission checks, CSRF protection for mutations, and private no-store responses.
- No provider connection, bank feed, accounting sync, tax calculation/filing, payment, export, production deployment, or cross-client reviewer delegation is enabled.
- M031 status: controlled build in progress; Product Owner acceptance pending.

### M031 entity and integration hardening (2026-08-25)

- Accounting-entity and bookkeeping-case setup commands are now M007 permission- and CSRF-gated, context/epoch-fenced, and use references only for sensitive identifiers.
- The authored-but-unexecuted migration adds accounting-entity referential integrity for engagements, books and cases. Setup replays are idempotent.
- Accounting providers are represented only by a disabled contract: SG Solutions remains the sole source of truth, external capability is empty and the kill switch is on.
- Client and admin bookkeeping surfaces are bilingual, private, provider-disabled and do not expose client-side opaque entity references.
- Opening balances, adjusting entries, categorization, merchant normalization, client questions, comparative reporting, tax mapping/handoff and client report packages are review-only local domain contracts. They do not post, export, file or activate a provider.
- M031 remains unaccepted, unmigrated, undeployed and non-operational. Provider activation, hard close/reopening, external sync, tax calculation/filing, payments and exports remain unauthorized.

## 2026-08-25 - M036-M038 controlled foundations

- M036 Home Buying Assistance: controlled technical foundation implemented; provider activation, lender/referral/data-sharing/property/closing operations remain disabled and not deployed.
- M037 Financial Marketplace: controlled technical foundation implemented; partner providers, redirects, referrals, data sharing, webhooks and commission feeds remain disabled and not deployed.
- M038 Recommendation Engine: controlled technical foundation implemented; live personalization, experiments, AI providers, external candidate feeds and external actions remain disabled and not deployed.
- Cross-module architecture audit: complete; documented findings corrected. Product Owner acceptance and production activation remain pending.
## 2026-08-25 - M039 CreditCardBroker controlled foundation

- M039 is a provider-disabled adapter under M037. M037 owns marketplace journeys and M038 owns ranking.
- CreditCardBroker account activation, credentials, API, JavaScript, feeds, hosted pages, public offer CTAs, redirects, referrals, applications, data sharing, tracking transmission, webhooks, conversion feeds, commission statements, migration execution, deployment and production activation remain disabled.

## 2026-08-25 - M040 Partner Management controlled foundation

- M040 is the central provider-disabled Partner Registry for M035, M036, M037 and M039.
- Partner portals, routing, referrals, data/document exchange, integrations, webhooks, payments, settlements, credentials, migration execution, deployment and production activation remain disabled.
