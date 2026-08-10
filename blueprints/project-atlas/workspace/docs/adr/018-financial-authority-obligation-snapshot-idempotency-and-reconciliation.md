# ADR 018 — Financial authority, obligation snapshots, idempotency and reconciliation

- Status: Proposed; Product Owner decision required before Build
- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Date: 2026-08-09
- Scope: M014, M021 and M042–M046 inside the SG Solutions modular monolith
- Supersedes: none
- Related: ADR 004, ADR 005, ADR 006 and M014 Client Payments and Billing PRD

## Context

SG Solutions needs a permanent financial foundation before it has final service prices, business
banking, a verified Stripe account or approved commercial/refund/tax policies. Release 1A must later
support deposits and one-time payments for real clients, while Release 1B must extend the same model
to plans, mature invoicing, refunds, disputes and reconciliation.

Payment systems have two different authorities:

- Stripe knows whether its external financial objects and movements succeeded, failed, refunded or
  entered dispute;
- SG Solutions knows what service was offered, what immutable obligation was accepted, how a
  provider fact applies to that obligation, whether a financial prerequisite is satisfied and
  whether an authorized human permits work to begin.

The browser return cannot prove payment. Provider events may be repeated, delayed, incomplete or
out of order. An external call may succeed while the application times out. Database restoration may
roll back the local projection while Stripe retains later transactions. Payment, refund and dispute
actions also carry elevated confidentiality, fraud and access-isolation risk.

M014 is the client payments/billing surface, but it must not duplicate M021 ServiceOrder, M042
catalog, M043 provider payments, M044 verification, M045 entitlements or M046 pricing. These logical
modules live in one Billing bounded context of the modular monolith and reuse shared primitives.

## Decision proposed

### 1. Separate external financial truth from internal operational truth

Stripe is authoritative only for Stripe-owned Customer, Checkout, PaymentIntent/Charge, Invoice,
Refund and Dispute state. Postgres is authoritative for:

- service order and approved scope;
- accepted quote and payment-obligation snapshots;
- provider-object bindings;
- internal transaction facts, allocations and adjustments;
- verified-payment qualification and freshness;
- human approvals and entitlements;
- client visibility, audit, reconciliation and recovery state.

No browser return, client report, screenshot, email match, AI tool or staff toggle can create a
Stripe-confirmed fact. Manual external payments use a distinct source/status and never masquerade as
Stripe state.

### 2. Use immutable obligation snapshots and append-only financial facts

Every payable action resolves on the server to an immutable `PaymentObligation` plus typed line-item
snapshot. It binds:

- accepted service-definition/scope and `ServiceOrder`;
- price, discount, tax-treatment, terms and locale-copy versions;
- integer minor-unit amounts and ISO currency;
- obligation kind, due rules and expected version;
- canonical calculation digest.

Accepted quotes, issued invoices, opened obligations, provider facts and posted allocations are
never rewritten in place. Correction uses a superseding quote/version, void or append-only
adjustment/reversal with reason, authority and audit. Release 1A is not a full accounting ledger, but
its operational journal preserves the evidence needed for reconciliation and later export.

Quote acceptance is coordinated at the application boundary, not owned by the M014 UI. One
`QuoteAcceptanceOrchestrator` CAS-validates the exact version and commits acceptance evidence, an
M021-owned `ServiceOrderService.createOrBindFromAcceptedQuote` result, exactly one Billing obligation
and one composite idempotency receipt in a single Postgres transaction. Any failure rolls back all
four outcomes. Same-key/same-digest recovery returns the same order/obligation receipt; changed
semantics conflict. This preserves M021 ownership without permitting partial cross-domain state.

### 3. Reserve semantic operations before provider mutation

For Checkout, customer creation, invoice mutation, refund and other provider changes, Postgres first
records a semantic operation containing:

- exact actor/service identity and resource root;
- action/purpose/environment;
- immutable target versions and canonical request digest;
- exact provider idempotency token, either envelope-protected and retrievable or deterministically
  reproducible from immutable operation identity using a domain-separated retained key version;
- comparison hash, opaque SG operation correlation, provider request/object reference when known and
  a bounded recovery deadline;
- operation lifecycle, attempts and recovery metadata.

The same operation/exact provider token/digest can be retried or recovered. A comparison-only digest
cannot recover a provider token and is insufficient. The same token with a different digest is a
conflict. A timeout requires provider retrieval/reconciliation with the same operation before any
new create call. The provider result is bound to that operation; browser-supplied idempotency and
amounts are rejected.

Every provider mutation carries an approved opaque SG operation correlation in non-PII provider
metadata/description where the object type permits it. Recovery first uses a persisted provider
request/object reference; otherwise it performs type/account/environment/time-bounded and paginated
lookup by that correlation. Provider idempotency retention is not assumed permanent. If lookup is
absent, duplicated or ambiguous after the recovery deadline, the operation becomes
`manual_review|quarantined` and no automatic replacement Checkout/refund is issued. Key-version
rotation retains only the minimum recovery material required by open operations and PAY-013.

Because a database transaction cannot encompass Stripe, the durable operation plus provider
idempotency and reconciliation are the consistency bridge. Transactional outbox/inbox records keep
local side effects replay-safe.

### 4. Verify and durably accept webhooks before projection

Stripe ingress:

1. applies method, source-environment, byte-size and content-type bounds;
2. preserves raw request bytes;
3. verifies the Stripe signature with the exact environment/endpoint secret and approved timestamp
   tolerance before trusting/parsing the event;
4. atomically inserts one immutable minimal inbox receipt under unique `(provider account,
   environment, event ID)` and binds it to the current recovery generation;
5. acknowledges only after durable acceptance;
6. performs projection asynchronously through a bounded service identity.

Invalid signatures are rejected and never enter the trusted inbox. The default durable event record
is normalized/minimized. Retaining raw bytes for incident/reprocessing requires PAY-013, encryption,
strict access/TTL and exclusion from ordinary telemetry.

The minimal receipt is deliberately not replay-sufficient financial truth. Every accepted event is
an invalidation signal: before each projection attempt, an allowlisted event-type handler retrieves
the canonical provider object(s) through the adapter. PAY-012 cannot activate an event type without a
proven retrieval contract. If retrieval is unavailable, incomplete, contradictory or ambiguous, the
worker keeps the leased receipt retryable or opens reconciliation/manual review and applies no
financial mutation.

Projection does not use “last event received wins.” It applies an allowlisted monotonic transition
using provider object identity, provider occurrence/version evidence and current local fact. A unique
provider-object/fact-version application key prevents two different Event IDs from posting duplicate
journal, allocation, audit, notification or task effects. Processing leases expire safely after a
worker crash and allow deterministic replay through a fresh canonical provider read.

One Postgres transaction commits the provider fact, journal/allocation, obligation projection,
verified-payment invalidation, audit and outbox. Failure rolls back all of them and leaves the inbox
retryable.

### 5. Reconciliation is a required control, not an optional report

Signed webhooks are primary notification, but they are not the only recovery mechanism. A bounded
reconciliation service compares provider objects to Postgres for:

- long-processing/unknown Checkout and payment operations;
- missed, failed, duplicate and out-of-order events;
- amount/currency/object-link mismatch;
- invoices, refunds and disputes in activated scope;
- unknown/unallocated provider objects;
- post-restore divergence.

Each run uses an explicit scope, checkpoint, provider API version, environment and recovery
generation. Results are `matched|mismatch|manual_review|resolved`, with no silent overwrite. An
unresolved mismatch blocks new unsafe financial-prerequisite/entitlement transitions but preserves
historical service state for human review.

After database restore, a monotonic recovery generation held outside the restored database advances;
pre-restore application billing capabilities/return handles are invalidated, and a controlled
Stripe reconciliation must close before newly treating restored projections as sufficient to start
work. Existing provider objects are retrieved/cancelled/reconciled rather than assumed absent.

Webhook cutover is exact. Before restore, the incident controller fences the old generation: new
provider mutations stop and webhook handlers may not return 2xx unless their durable inbox receipt
was inserted and a final external-generation check still matches. Once the fence changes, old
handlers return a retryable non-2xx even if they received or verified an event. After restore, ingress
opens first against the new generation and accepts provider retries; mutation egress remains frozen
while generation-bound receipts drain and checkpointed reconciliation covers the interval before the
selected recovery point through current provider time. Only PAY-020 evidence and approval may resume
provider mutations. An event on either side of the cutover is therefore retried or reconciled, never
silently acknowledged into a database generation that can be overwritten.

### 6. Keep financial prerequisite, approval and fulfillment separate

M044 turns reconciled provider/internal facts into a versioned `VerifiedPaymentAssessment` such as
`confirmed|pending|reversed|unconfirmed`. M045 may consume it as one entitlement prerequisite. M021
retains commercial and human approval-to-start state. Case/workflow domains retain fulfillment.

Therefore:

```text
provider payment confirmed
→ financial prerequisite may become satisfied
→ service remains pending internal review
→ authorized human may approve start
→ fulfillment may begin
```

There is no direct `paid → in_progress` transition. Refund, dispute or reversal also does not
automatically choose a service consequence; it opens the configured human decision path.

### 7. Use one resource-access root and structurally separate audiences

Authenticated client access requires M007 identity/session/membership and an explicit active
service-order/case resource grant. Client-visible billing children may inherit from that root under
ADR 004. Internal price reasoning, provider payloads, reconciliation notes, webhook records,
dispute evidence and staff-only adjustments never inherit.

Payment, provider customer, payer email, prior receipt or CRM association is not identity,
membership, delegation or a grant. A public quote/payment capability, if PAY-016 closes, is
one-resource/purpose/audience/version/expiry/use/environment/recovery-bound and grants no portal or
history access.

Client, Public and Staff queries and DTO schemas are separate. Every list/detail/count/cursor,
Checkout/acceptance, receipt/invoice handoff and mutation final-fences the resource root, linkage,
classification, visibility/block, versions and access/recovery epochs before response or side
effect.

### 8. Keep provider destinations and payment secrets transient

Full card data never enters SG application code or storage. Stripe-hosted Checkout is the Release 1A
collection boundary. Secret keys, restricted keys and webhook secrets remain in approved secret
management by environment and never enter repository, database ordinary state, browser or docs.

Checkout, receipt, hosted-invoice and Customer Portal URLs are bearer-like destinations. The app
stores opaque provider object references, not permanent URLs as authorization. It creates/recovers a
destination after exact authorization and returns it through private/no-store, no-referrer,
non-prefetched handoff. URLs, client secrets and provider payloads are prohibited from logs,
analytics, tracing, error reports, browser storage and session replay.

Before browser navigation, the server validates the destination against the exact activated HTTPS
scheme, provider host/path policy and bound provider object. Arbitrary, user-supplied, unbound or
database-tampered destinations fail closed; no generic open redirect exists.

Public entry capabilities and provider return handles are separate purpose-bound secrets. GET/HEAD
is an inert generic landing and never consumes, accepts, creates Checkout or mutates financial state.
An explicit user-initiated POST/OTP exchange protected by exact Origin, Fetch Metadata and CSRF/
bootstrap controls creates only an opaque host-only SameSite session. Token-bearing navigation is
removed by clean redirect/history replacement under `Referrer-Policy: no-referrer` before any
personalized render or third-party subresource. Edge/app logs, analytics, errors, caches and service
workers exclude token transport. Scanner, prefetch, forwarded-link, replay, concurrency, unavoidable
provider exposure and recovery-generation revocation are part of PAY-016's threat model.

### 9. Make M014 a projection/action boundary, not a second financial owner

M014 provides:

- authenticated client billing list/detail/return-status queries;
- quote inspection/acceptance presentation;
- authorized Checkout/receipt/invoice handoff;
- client-safe status, error and support projection;
- a future narrowly scoped public facade after PAY-016.

It invokes shared Billing services and never stores a portal-owned `Payment`, calculates an amount
in UI, calls Stripe directly or creates parallel quote/invoice/refund states. M008/M009/M010 receive
only bounded M014 summaries; M013 asks only a typed financial-prerequisite question.

### 10. Gate policy and live activation independently

The architecture can be completed before SG Solutions has its final LLC, bank, price policy or
Stripe account. PAY-001–PAY-020 and BIZ-001–003 remain explicit Product Owner decisions. Provider
interfaces, test doubles and local contract tests cannot establish `Operational` status.

Live activation requires at minimum institutional onboarding, environment/secret separation,
approved products/prices/policy, webhook/event inventory, sandbox evidence, negative authorization
tests, reconciliation and restore drills, monitoring/incident/rollback runbooks, independent
security review and one controlled live payment approved by the Product Owner.

## Consequences

### Positive

- Duplicate/out-of-order delivery and uncertain network results have explicit recovery semantics.
- Release 1A can later charge real clients without a disposable state model.
- Price, payment, approval and fulfillment stay independently auditable.
- Client isolation cannot be granted accidentally by paying or matching an email.
- Post-restore financial divergence is detected before unsafe service transitions.
- Stripe stays replaceable behind provider contracts without pretending provider state is local
  business policy.

### Costs

- More records and state axes than a single `payments` table.
- Checkout/refund commands require operation reservation and recovery paths.
- Webhook processing needs inbox, projection and reconciliation instead of direct handler mutation.
- Finance staff need a mismatch/manual-review workflow and operational runbook.
- Product Owner must close detailed policy and activation gates before Build/live behavior.

### Constraints

- No exact HTTP route/schema/table is approved by this ADR.
- No policy, amount, fee, refund, tax or role threshold is inferred.
- No Stripe account, key, endpoint or event is active.
- The proposed boundary requires Product Owner approval before a Build gate.

## Rejected alternatives

### Treat the Checkout success URL as proof

Rejected because URLs/browser state are forgeable and do not represent provider settlement or
asynchronous methods.

### Update financial state directly inside webhook code without durable inbox

Rejected because retries, failures and out-of-order events can duplicate or partially apply effects
and make recovery unverifiable.

### Use the last event received as current state

Rejected because Stripe does not guarantee event delivery order and late processing events could
regress a succeeded/refunded fact.

### Let Stripe be the only database

Rejected because Stripe does not own SG service scope, approvals, entitlements, grants, internal
allocations, policy versions or operational audit.

### Let Postgres override Stripe transaction truth

Rejected because staff/client/AI claims and restored projections cannot prove provider movements.

### Put all state in one mutable `payments` table

Rejected because obligation, attempt, provider fact, allocation, refund, dispute, invoice and
reconciliation have different authority, lifecycle and audit semantics.

### Link account access by payer email or Stripe Customer

Rejected because payment/contact similarity is not identity, delegation or resource authorization.

### Use generic permanent Payment Links

Rejected because they lose obligation/version linkage, price integrity, capability scope and
reconciliation evidence.

### Allow automatic refund or service start

Rejected because money movement does not replace human policy/approval for sensitive services.

### Build a full accounting ledger in Release 1A

Rejected because an append-only operational journal plus export-ready facts meets traceability
without inventing accounting policy or overextending scope.

## Validation required before acceptance

- Product Owner reviews M014, this ADR, design specification and PAY-001–PAY-020.
- Independent architecture auditor verifies ownership, state axes, idempotency, event ordering,
  access inheritance, recovery and no-policy-invention.
- Cyber Neo performs read-only SAST/governance/secrets/privacy analysis of the documentary delta.
- Source-of-truth, activation, security, data, API, backup, roadmap and module indexes are
  synchronized.
- Local-link, Markdown format, lockfile, scaffold, test, type and build validation remain clean.

Future Build acceptance additionally requires:

- executable amount/currency/rounding and immutable-snapshot tests;
- duplicate/out-of-order webhook, distinct-event/same-fact dedupe, crash-after-ack replay and atomic
  rollback tests;
- timeout/restart/idempotency-window-expiry/correlation/reconciliation/restore-cutover tests that
  prove ambiguity quarantines and no second provider mutation occurs;
- cross-client IDOR and final-fence race tests;
- open-redirect/scheme/host/path/object-confusion plus scanner/prefetch/history/referrer/log/replay
  capability and return-handle tests;
- refund/dispute/privilege negative tests;
- provider contract/sandbox and controlled live-payment evidence under PAY-020.

## Deferred activation

This ADR does not approve itself, a Build gate, Stripe onboarding, credentials, webhooks, products,
prices, quotes, routes, tables/RLS, invoices, payments, refunds, disputes, notifications, tax,
Customer Portal, ACH, plans, subscriptions, merge, deployment or Operational status. Those remain
controlled by AGENTS.md, the Product Owner, BIZ-001–003 and PAY-001–PAY-020.
