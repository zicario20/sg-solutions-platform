# M014 Client Payments and Billing — Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted by Product Owner in provider-disabled scope; no external-activation gate
- Surface: Client Portal, with bounded Public and Admin/Backend contributions
- Domain: Billing, service orders, payments and financial reconciliation
- Release target: durable Release 1A foundation with compatible Release 1B extensions
- Source relationship: normalizes the complete supplied M014 requirements without authorizing code,
  prices, policy, Stripe traffic or real financial records

## 1. Purpose

M014 defines the client-facing payments and billing capability inside the single SG Solutions web
platform. It lets an authorized payer understand a quote or obligation, use a secure provider-hosted
checkout, see reconciled payment state, obtain an authorized receipt or invoice, and understand the
next operational step without exposing the internal financial system or confusing payment with
permission to begin a service.

M014 is not a standalone payment application, a wallet, an accounting general ledger or an alternate
source of financial truth. It is the client projection and action boundary over the shared Billing
bounded context. The numbered companion modules retain their canonical responsibilities:

- M021 owns the accepted `ServiceOrder` and its human approval-to-start state;
- M042 owns the service catalog definition;
- M046 owns versioned price, discount, promotion and waiver policy;
- M043 owns provider payment, invoice, refund and dispute integration;
- M044 owns verified-payment qualification and reconciliation;
- M045 owns service entitlements derived from approved business rules;
- M077 owns audit history and M026 owns delivery notifications.

These are logical responsibilities inside the modular monolith, not separate applications or
microservices. This PRD freezes their contracts where M014 depends on them.

## 2. Business value

- Let SG Solutions accept real deposits and one-time payments in Release 1A without disposable
  financial architecture.
- Give clients a clear bilingual view of what is due, what is processing, what was confirmed and
  what still requires internal review.
- Preserve traceability from service definition and quote through service order, obligation,
  provider transaction, allocation, receipt and operational approval.
- Reduce duplicate charges, price tampering, lost webhooks and manual reconciliation risk.
- Create a controlled path to Release 1B payment plans, advanced invoicing, refunds, disputes,
  subscriptions and reporting without rewriting Release 1A identifiers or authority boundaries.
- Keep SG Solutions outside direct card-data handling by preferring Stripe-hosted collection.

## 3. Scope

### Release 1A architecture

- Integer-minor-unit money values with explicit ISO currency and deterministic server-side totals;
  PAY-009 must approve the exact Release 1A currency/geography allowlist before any real obligation.
- Exactly four versioned price-presentation modes: `public`, `from`, `quote` and `consultation`.
  Publication is an independent status, is off by default and requires per-service Product Owner
  activation; aliases and a `hidden` presentation mode are invalid.
- Immutable quote versions, client-safe quote presentation and explicit acceptance evidence.
- Accepted `ServiceOrder` linkage and immutable payment-obligation snapshots.
- Configurable deposit or single-payment obligations; actual rules remain Product Owner gates.
- Stripe Customer and Checkout Session adapter contracts.
- Signed raw-body Stripe webhook ingress, durable inbox, deduplication and order-independent
  projection.
- Operational transaction journal, allocations, invoice/receipt references and minimal
  reconciliation.
- Authenticated client payment list/detail, pending-action and authorized document/link access.
- A narrow opaque public quote/payment capability for a prospect only if PAY-016 is approved.
- Staff finance query, exception queue and human approval boundaries.
- Recording of provider-reported refunds and disputes even when their operating workflows remain
  manual.
- No automatic service start: a verified payment can satisfy a financial prerequisite only.
- Bilingual, responsive and WCAG 2.2 AA experience.

### Compatible Release 1B extensions

- Structured installment/payment plans and controlled retries.
- Advanced invoices, dunning, refunds, disputes and reconciliation.
- Approved Stripe Customer Portal behavior and stored provider payment-method summaries.
- Approved recurring subscriptions and renewal/cancellation rules.
- Sales-tax integration after professional review.
- External-payment verification, government/provider fee workflows and accounting exports.
- Broader notifications, reporting and operational automation.

Release 1A must use the permanent opaque identifiers, immutable snapshots, provider abstraction,
inbox/outbox, authorization and audit model. Release 1B extends states and policies; it does not
replace the foundation.

## 4. Explicit out of scope

- Capturing, transmitting or storing PAN, CVV, magnetic-stripe data or full card details.
- Accepting card data through chat, WhatsApp, voice, email, support notes or SG-hosted ordinary
  forms.
- A platform-usage subscription sold to other businesses.
- A wallet, client funds account, escrow product or stored-value balance.
- A double-entry accounting/general-ledger implementation.
- Lending SG Solutions funds or extending credit without a separately approved legal/product PRD.
- Automatic refunds, waivers, dispute decisions or external-payment confirmation.
- Treating screenshots, client claims, success URLs or query parameters as proof of payment.
- Starting sensitive service work merely because a provider reports payment.
- Government filing payments, partner payouts or commissions without separately approved policy.
- Sales-tax calculation or claims that a service is taxable/exempt without professional review.
- Payment plans, subscriptions, ACH and Customer Portal behavior before their exact gates close.
- Production Stripe onboarding, secrets, endpoints, events or traffic in Phase 0.
- Hardcoded prices, refundability, due dates, thresholds, discounts or cancellation policy.

## 5. Actors

### Prospect payer

May receive and inspect one specific opaque, expiring quote/payment capability and enter provider-
hosted checkout after PAY-016. The capability grants no client account, CRM, case, service, document
or payment-history access.

### Authorized client payer

May view and act on only client-visible billing resources inherited from an active explicit
`ServiceOrder`/case access root, subject to resource classification, block, entitlement, context and
final-fence checks.

### Authorized representative

May act only under an explicit, current delegated relationship and permission whose scope includes
the exact service order and financial action. Household, spouse, business membership, matching email
or prior payment is never delegation.

### Service staff

May see a minimized financial prerequisite summary required for assigned work. Service assignment
does not grant price mutation, refunds, waivers, dispute evidence or broad transaction access.

### Finance-authorized staff

May perform only allowlisted quote, invoice, checkout, reconciliation, refund, dispute, adjustment or
external-payment operations granted by role, resource scope, assurance and policy. Separation of
duties and approval thresholds remain PAY gates.

### Owner or Administrator

May approve business configuration and enhanced-review actions within explicit permissions. The role
does not bypass audit, expected-version, idempotency or provider reconciliation.

### Stripe adapter and webhook ingress

Translate provider-specific commands/events at the integration boundary. Neither is a human actor,
resource grant or business-policy authority.

### Reconciliation worker

Uses a purpose-scoped service identity to compare provider state with Postgres and open controlled
exceptions. It cannot invent amounts, approve refunds or start a service.

### AI or channel adapter

May call approved read-only client-safe status/explanation ports and request a secure handoff/link.
It cannot change price, mark payment, issue refund, waive balance, approve external evidence or
operate Stripe.

## 6. User journeys

### 6.1 Staff creates and sends a quote

1. Staff reauthenticates when policy requires and selects an approved service/customer context.
2. M042/M046 resolve an active price mode and versions under current policy.
3. Staff supplies only allowlisted variables; the server computes line items and total.
4. Billing creates an immutable quote version in `draft` with accepted-definition and pricing-policy
   bindings.
5. A permitted reviewer approves/sends it according to PAY-002/PAY-005.
6. M026 receives a content-minimized delivery request; it never receives internal notes or provider
   secrets.
7. Audit records policy/version/result without copying protected narrative.

### 6.2 Client accepts a quote

1. The authenticated client or approved public capability resolves exactly one quote version.
2. The server reauthorizes actor/capability, current status, expiry, version and scope.
3. The client sees line items, fees, discount, total, terms, validity and locale parity.
4. `QuoteAcceptanceOrchestrator.accept` CAS-validates the exact quote and coordinates M021 and
   Billing inside one Postgres transaction: acceptance evidence, one M021-owned `ServiceOrder`
   create-or-bind, exactly one obligation and one composite idempotency receipt commit together.
5. Failure at any boundary rolls back the entire operation; no accepted quote, order or obligation
   may exist alone. It does not create client access or mark payment.
6. Same-key/same-digest retry returns the same complete order/obligation receipt; changed semantics
   conflict.

### 6.3 Authenticated client starts Checkout

1. Client selects one eligible open obligation.
2. `ClientCheckoutService` final-fences membership, context, resource access, status, expiry,
   accepted snapshot, amount/currency and outstanding balance.
3. It reserves a durable checkout operation with a server-generated idempotency key and payload
   digest.
4. The Stripe adapter creates or recovers exactly one Checkout Session for that operation.
5. The provider session reference is bound to the obligation; a short-lived provider destination is
   returned only after final reauthorization.
6. Browser navigation goes directly to Stripe-hosted Checkout. No amount is accepted from the
   browser.

### 6.4 Prospect starts Checkout

1. A PAY-016-approved opaque capability resolves exactly one current quote/payment obligation.
2. The public facade validates expiry, use count, purpose, quote version, environment and risk state.
3. The capability can start only the precomputed obligation; it cannot choose price, customer,
   discount, service or metadata.
4. Payment/customer matching grants no M007 account, membership or resource access.
5. The return surface is generic until authenticated access or a still-valid bounded public receipt
   proves permission to see a minimized status.

### 6.5 Checkout return

1. Stripe returns the browser to a no-store/no-referrer generic application landing with a distinct
   random, short-TTL return handle; provider IDs, client PII and amount are absent from the URL.
2. GET/HEAD is inert: it neither consumes the handle nor reads protected state and renders no
   personalized content or third-party subresource.
3. An explicit user-initiated POST/OTP exchange under Origin/Fetch-Metadata/CSRF/bootstrap controls
   creates only an opaque host-only session, then immediately redirects/replaces history to a clean
   URL before querying Postgres.
4. The clean page says confirmation is being verified. `processing|unconfirmed` remains visible until
   a verified webhook/reconciliation transition.
5. The return path cannot invoke `markPaid`, quote acceptance, Checkout creation, service approval or
   entitlement mutation.

### 6.6 Signed webhook confirms provider state

1. The integration route enforces method/size/content type and preserves the raw body.
2. The Stripe adapter validates the signature using the exact environment endpoint secret before
   domain parsing or persistence as a trusted event.
3. The system persists a minimal immutable inbox receipt keyed by provider account, environment and
   event ID, with object reference, event type, payload hash, provider occurrence time, processing
   state and current recovery generation.
4. The endpoint acknowledges promptly after durable acceptance; heavy work runs asynchronously.
5. The event is an invalidation signal, not replay-sufficient transaction truth. Before every
   projection attempt, code retrieves the canonical provider object(s) required by that approved
   event-type contract. If retrieval is impossible or ambiguous, the receipt remains retryable or
   moves to reconciliation/manual review without financial mutation.
6. One Postgres transaction applies a monotonic provider fact, journal entry/allocation,
   obligation projection, audit and outbox.
7. A payment-success fact may satisfy a financial prerequisite but only moves M021 to
   `pending_internal_review` or equivalent; it never authorizes work.

### 6.7 Client views payments

1. The authenticated request freezes M007 account/session/membership/context/grant/assurance and
   billing-policy versions.
2. `ClientBillingQueryService` reads a consistent Postgres cut with no live provider fan-out.
3. It returns only client-visible quote/obligation/invoice/payment/refund summaries under an active
   service-order/case root.
4. A final fence revalidates root, parent linkage, classification, client visibility, block,
   resource/financial versions and access epochs before body, count, cursor or route metadata.
5. Missing or stale provider reconciliation becomes `unconfirmed|processing|unavailable`, never
   `paid`, zero balance or no action.

### 6.8 Client opens a receipt or invoice

1. The detail route reauthorizes the exact billing resource and current visible version.
2. Provider IDs and permanent bearer URLs never reach the DTO.
3. If a provider-hosted artifact is allowed, the server creates or retrieves a fresh bounded
   destination only after authorization and returns it through a no-store redirect/handoff.
4. SG-generated invoice/receipt bytes, when introduced, use M011 private document delivery and
   auditing; metadata alone is not file access.

### 6.9 Staff requests a refund

1. Staff selects an eligible settled transaction and an allowlisted reason code.
2. Server verifies authority, amount remaining refundable, policy, service consequences and
   required approver(s).
3. An approval record and refund command reservation commit before the adapter call.
4. The Stripe request uses a stable operation-specific idempotency key.
5. Provider submission is not completion. Webhook/reconciliation confirms `succeeded|failed`.
6. Service pause/cancel/entitlement decisions are separate human-approved commands.

### 6.10 Dispute or chargeback arrives

1. Signed event creates/updates the provider dispute fact and a finance/compliance task.
2. Access to evidence is purpose-limited and separately audited.
3. No fraud accusation or automatic service sanction is emitted.
4. A human records the approved operating response; provider outcome remains externally
   authoritative.

### 6.11 Provider or database failure

- Checkout create timeout reuses the same exact recoverable provider idempotency token and resolves
  the provider result through its bound object or opaque SG operation correlation before attempting
  another session. Provider key-retention is never assumed permanent; ambiguity quarantines the
  operation and prohibits automatic reissue.
- A delayed webhook leaves state `processing|unconfirmed` and reconciliation is offered.
- Database failure rejects webhook persistence so Stripe retries; no success is acknowledged before
  durable acceptance.
- Provider outage never permits manual conversion of a Stripe transaction to `paid`.
- CRM/M008/M009/M010 outage does not undo a valid payment; durable outbox/reconciliation repairs
  projections later.

## 7. States and transitions

States are separate axes. A single generic `paymentStatus` must not encode quote, obligation,
provider, service, approval, refund and dispute behavior.

### Quote lifecycle

`draft → approved_for_send → sent → viewed → accepted | declined | expired | cancelled | superseded`

- Only a current immutable version may be accepted.
- `accepted` is not `paid`; accepted changes require a superseding quote.
- `superseded|expired|declined|cancelled` cannot start new Checkout.

### Payment-obligation lifecycle

`draft → open → checkout_available → processing → partially_paid | satisfied | past_due | void`

`partially_paid → processing | satisfied | past_due | void`

- `satisfied` derives from immutable required amount and confirmed allocations.
- Refund/dispute does not silently rewrite historical satisfaction; it creates new financial facts
  and recomputed current exposure.

### Checkout-operation lifecycle

`reserved → provider_requested → provider_bound → completed | expired | cancelled | failed | orphan_review`

- A bound session belongs to one obligation snapshot and command digest.
- Expiration can create a new operation but never a duplicate obligation.

### Provider transaction lifecycle

`created → requires_action | processing → succeeded | failed | cancelled`

After `succeeded`, separate axes may become `partially_refunded|refunded` and/or `disputed`.
Delayed events cannot regress a confirmed provider fact.

### Refund lifecycle

`requested → under_review → approved | rejected | cancelled`

`approved → provider_submitted → processing → succeeded | failed`

`approved` and `provider_submitted` are not `succeeded`.

### Dispute lifecycle

`provider_opened → needs_response | under_review → won | lost | withdrawn | closed_unknown`

The exact provider mapping is versioned; the internal operating decision is a separate Approval.

### External-payment lifecycle

`submitted → evidence_pending | pending_verification → confirmed | rejected | cancelled`

This axis is disabled until PAY-008. A confirmed external payment is never labelled Stripe-paid.

### Reconciliation lifecycle

`pending → matched | mismatch → manual_review → resolved | accepted_exception`

- `accepted_exception` requires explicit authority and does not falsify provider history.
- Unresolved mismatch blocks unsafe entitlement and service-start transitions.

### Service and entitlement axes

M021/M045 preserve independently:

- commercial acceptance;
- financial prerequisite status;
- human approval-to-start;
- fulfillment/case status;
- entitlement visibility.

`billing.payment_succeeded_observed` may update only the financial prerequisite through M044. It
cannot transition
human approval or fulfillment.

## 8. Business rules

1. **External and internal truth.** Stripe is authoritative for its transaction, invoice, refund
   and dispute state. Postgres is authoritative for service order, quote/obligation snapshots,
   internal allocation, approvals, entitlements, reconciliation and operating history.
2. **Server amounts.** Browser, URL, chat, AI and provider metadata never supply the canonical amount.
   The server resolves an immutable obligation snapshot.
3. **Money representation.** Every amount is signed 64-bit integer minor units plus ISO 4217
   currency. No floating point. Arithmetic and rounding policy are deterministic and versioned.
4. **Currency activation.** The architecture is currency-safe, but no currency/geography is enabled
   before PAY-009 closes. Every real obligation must use an allowlisted currency; cross-currency
   allocation is prohibited.
5. **Immutable accepted facts.** Accepted quotes, issued invoices, opened obligations and posted
   provider facts are not edited in place. Corrections use superseding versions, voids or
   append-only adjustments.
6. **Line-item separation.** SG Solutions service fee, government fee, provider fee, processing fee,
   tax and optional product fee use distinct typed line items. External fees never appear as SG
   revenue merely because SG collected them.
7. **Price publication.** Presentation mode is exactly `public|from|quote|consultation`; publication
   is a separate off-by-default status controlled by M042/M046 and a Product Owner decision. Missing
   policy publishes nothing and never invents a mode or amount.
8. **Historical snapshots.** Every quote/obligation binds service-definition, price-policy,
   discount, tax-treatment, terms and locale-copy versions used to calculate it.
9. **Quote acceptance.** Acceptance requires exact current version, non-expiry, explicit terms
   evidence, actor/capability and trusted server time. It never proves payment.
10. **One obligation, many transactions.** A payment obligation may receive zero or more attempts and
    allocations. A transaction cannot allocate more than its confirmed net available amount.
11. **One transaction, bounded allocations.** Total allocations plus confirmed refunds/adjustments
    obey deterministic invariants and currency equality. Overpayment is an exception, not a wallet.
12. **Deposit semantics.** Deposit amount, refundability and what it enables are unresolved PAY-003
    policies. No default “non-refundable” claim is permitted.
13. **Human authorization.** A satisfied financial prerequisite moves the service only to the
    configured internal-review state. A distinct authorized person approves service start.
14. **Idempotent commands.** Every external create/mutate call uses a server-owned semantic operation
    and an exact provider idempotency token stable for that command. The token is either protected and
    retrievable or deterministically reproducible using domain separation and a retained key version;
    a comparison-only digest is insufficient. Provider idempotency expiry never proves that reissue
    is safe.
15. **Duplicate events.** One `(provider account, environment, event ID)` yields one inbox receipt and
    application result. Multiple event IDs describing the same provider object/fact version also
    cannot duplicate journal, allocation, audit, notification or task effects.
16. **Out-of-order events.** Processing uses provider object identity, occurrence/version evidence
    and permitted monotonic transitions. Ambiguity triggers provider re-read/reconciliation.
17. **Return pages.** Success/cancel returns are navigation signals only. `success` never writes
    payment state; `cancel` never cancels the service or obligation.
18. **Customer linkage.** Stripe Customer ID is a provider reference, not identity. Email, phone,
    provider customer, prior payment or CRM similarity cannot create M007 membership or grant.
19. **Provider metadata.** Only opaque internal references, environment and schema version are
    allowed. No names, contact values, service-sensitive descriptions, tax/credit facts or secrets.
20. **Receipts and invoices.** A receipt proves a transaction, not service terms or authorization.
    Access is resource-scoped and provider bearer URLs are not durable application authorization.
21. **Refunds.** Refund eligibility, thresholds and consequences require PAY-006. The client may
    request support but cannot execute or approve a refund.
22. **Disputes.** Provider dispute state is recorded; response and service impact require authorized
    human decisions. Never automatically label a client fraudulent.
23. **External payments.** Disabled until PAY-008. Evidence or screenshot alone never confirms;
    confirmation requires an authorized reviewer and independent source evidence.
24. **Discounts/waivers.** Only M046-approved policy and authorized server commands apply. Manual
    changes require reason code, expected version, approval and audit.
25. **No card handling.** Card data is collected only by approved Stripe-hosted components. Support
    channels instruct the payer to use the secure link and reject/redact received card data.
26. **No live provider fan-out in reads.** Client/Admin pages read reconciled Postgres projections.
    Explicit refresh requests enqueue/reconcile; they do not expose provider latency or payloads.
27. **Freshness.** Each provider projection carries source, observed-at, last-reconciled-at,
    projection version and health. Stale/unavailable is explicit and never mapped to success/zero.
28. **Transactional application.** Provider fact, journal/allocation, obligation projection,
    audit/outbox and dedupe result commit atomically or not at all.
29. **Corrections.** Financial history is append-only. Authorized adjustments reverse/supersede;
    no destructive edit hides a prior fact.
30. **Inngest boundary.** Inngest coordinates jobs/retries only. Postgres owns inbox, operation,
    financial and reconciliation state.
31. **Analytics boundary.** Product analytics receives only coarse allowlisted events and never
    amount tied to identity, invoice data, provider IDs, URLs, failure details or protected content.
32. **No client-side persistence.** Billing DTOs and provider destinations are private/no-store and
    prohibited from localStorage, sessionStorage, service-worker/offline cache and session replay.
33. **Recovery generation.** Restore/recovery advances an externally protected monotonic generation,
    invalidates pre-restore application capabilities/return handles and forces bounded Stripe
    reconciliation before financial prerequisites can newly authorize work.
34. **Recovery cutover.** Old-generation webhook handlers return retryable non-2xx unless a durable
    insert and final external-generation fence both succeed. New-generation ingress opens before
    provider mutation egress; retries drain and reconciliation covers both sides of the cutover.
35. **Provider activation.** An interface, mock, test double or local contract test does not prove
    Stripe active. PAY-011/PAY-012/PAY-020 and BIZ-001–003 must close before Operational status.

## 9. Authorization rules

### Decision inputs

Every read or command evaluates:

- M007 account, application session, membership, selected context and assurance;
- internal role/permission or client/representative permission;
- one canonical service-order/case access root;
- billing-resource parent, client visibility/classification/block/tombstone state;
- financial action, amount band, policy/version and separation-of-duty requirements;
- expected resource/financial/access/recovery epochs;
- purpose, channel, environment, trusted time and idempotency digest.

### Client inheritance

- An active explicit service-order/case grant may inherit to quote, obligation, invoice, payment,
  refund and receipt projections explicitly marked client-visible within that root.
- Internal pricing rationale, manual discount reasoning, risk signals, provider payloads, webhook
  records, reconciliation notes, dispute evidence and staff actions never inherit visibility.
- A billing resource can block inherited client visibility or require additional assurance/grant.
- Revocation or re-parenting advances the authorization epoch and predictably removes derived access.
- Payment itself, email match, provider customer, payer relationship or receipt possession creates
  no membership/grant.

### Permissions

Candidate capabilities include:

`billing.client.read`, `billing.checkout.create`, `billing.receipt.read`, `billing.quote.create`,
`billing.quote.send`, `billing.invoice.create`, `billing.adjustment.request`,
`billing.adjustment.approve`, `billing.refund.request`, `billing.refund.approve`,
`billing.dispute.read`, `billing.dispute.manage`, `billing.external.submit`,
`billing.external.review`, `billing.reconcile`, `billing.price.manage`, `billing.report.read`.

Capability names do not grant action alone; resource scope, assurance, policy and final fence remain
mandatory. Exact role mapping is PAY-005/PAY-006/PAY-007/PAY-008.

### Enforcement

- Domain services authorize before provider/database I/O.
- Restricted RLS policies encode client and staff resource scope as defense in depth.
- Provider webhook ingress uses a dedicated non-human service identity limited to inbox insertion;
  the projection worker has only required financial procedures.
- Client/Public/Staff DTO schemas are structurally separate.
- Every list/detail/checkout/link/download/mutation final-fences before returning body, count, cursor,
  destination or route metadata.
- Private missing/disallowed resources return the same opaque not-found contract.

## 10. Data requirements

Conceptual structures are not authorization to create tables. Drizzle remains the only future schema
and migration authority.

### `ServicePriceVersion` — M046 authority

- opaque ID, service-definition/version, exact `public|from|quote|consultation` presentation mode,
  integer amount/currency when applicable;
- jurisdiction/effective interval, typed line-item rules, independent off-by-default publication
  status and policy version; aliases are rejected;
- approval/audit reference; never a mutable amount embedded in UI code.

### `Quote` and `QuoteVersion`

- opaque/public references separated; actor/client/organization context;
- service-definition and accepted-scope version bindings;
- status/version, validity, locale, terms/disclosure hashes and created/sent/accepted facts;
- totals derived from immutable line items; no protected narrative in public reference/metadata.

### `BillingLineItemSnapshot`

- typed category, safe label key, integer quantity/unit/subtotal/discount/tax/total and currency;
- price/discount/tax policy references and external-fee ownership classification;
- immutable after quote acceptance or obligation opening.

### `PaymentObligation`

- opaque ID/public reference, service order, quote/invoice and payer-context references;
- kind (`deposit|full|balance|approved_additional_fee`), integer amount due/allocated/currency;
- status/due policy/version, immutable calculation digest and financial epoch.

### `CheckoutOperation`

- immutable opaque operation ID, environment/purpose domain, obligation and snapshot version and
  canonical command digest;
- exact provider idempotency token recoverable from protected storage or deterministic derivation,
  plus comparison hash, derivation/key version and recovery deadline; hashes alone are insufficient;
- opaque SG provider-correlation value, provider request ID/session reference when known, lifecycle,
  attempts, expiry, quarantine and reconciliation state;
- never persist the full Checkout URL or client secret.

### `ProviderCustomerBinding`

- internal client/account context, provider, opaque provider-customer reference, state/version;
- provenance and duplicate-resolution evidence; never identity or authorization.

### `PaymentTransactionFact`

- provider object references, type/state, integer gross/currency and occurrence/observation evidence;
- immutable provider fact version, source event/reconciliation reference and supersession linkage;
- masked method type/brand/last4 only after PAY-014 approval; no PAN/CVV/raw method payload.

### `PaymentAllocation`

- transaction fact, obligation, integer amount/currency, allocation/reversal type and immutable
  posting sequence;
- unique operation/source and invariant evidence.

### `BillingAdjustment`

- target, typed adjustment, integer amount/currency, reason code, requested/approved actors,
  approval/policy versions and supersession; no uncontrolled narrative.

### `InvoiceProjection`

- internal/public reference, service order, provider invoice reference, immutable line-item version;
- issued/due/status/amounts/currency and observed/reconciled evidence;
- provider document/hosted-invoice URL is not persisted as durable client authorization.

### `RefundCommand` and `RefundFact`

- transaction, requested amount/currency/reason code, policy and approval evidence;
- exact recoverable/deterministically reproducible provider idempotency token under the same
  operation/key-version rules, its comparison hash, SG correlation, provider request/reference when
  known, submitted/observed/quarantine status and failure code;
- service-impact decision is a separate M021/M045 approval reference.

### `DisputeFact` and `DisputeCaseBinding`

- provider dispute reference/state/version, transaction, integer disputed amount/currency;
- evidence due/observed/closed facts and opaque M022/M074 work item references;
- protected evidence remains in its owning M011/M012/M077 resource, never copied into the fact.

### `VerifiedPaymentAssessment` — M044 authority

- payment/obligation, provider/source, qualification (`confirmed|pending|reversed|unconfirmed`),
  required/current amounts, freshness and reconciliation evidence;
- policy/version and reason code; never approval-to-start.

### `ProviderWebhookInbox`

- provider account/environment/endpoint version, unique provider event ID, event type, payload hash
  and recovery generation;
- signature-key version result, received/provider occurrence times, object references, processing
  lease/lifecycle/attempt/error codes and retention policy;
- raw body may exist only in an encrypted, tightly retained incident/reprocessing boundary approved
  by PAY-013; default durable domain state is normalized/minimized and each projection attempt must
  retrieve the canonical provider object(s) before applying a fact.

### `FinancialReconciliationRun` and `ReconciliationIssue`

- scope/checkpoint/provider API version/start/end/outcome/counts;
- mismatched objects/amounts/states as opaque references and reason codes;
- reviewer, resolution/supersession and recovery generation; no broad provider payload dump.

### `BillingAccessBinding`

- one canonical service-order/case root plus resource/client visibility/block/assurance and access
  epoch evidence;
- no alternative email/payment/association-grant OR path.

### `BillingCapability`

- purpose/resource/version/expiry/use limit/audience/environment/recovery generation;
- only high-entropy digest in ordinary storage; raw value appears once through an approved delivery
  boundary and never in logs/analytics/backups.
- public entry capability and provider return handle are distinct, non-interchangeable purposes. A
  raw value in URL transport is never consumed by GET/HEAD and is exchanged only through the approved
  interactive POST/OTP bootstrap into an opaque host-only session.

### Minimized evidence

Audit, outbox, notification and analytics facts carry opaque references, type/result/policy version,
trusted time and correlation only. They cannot carry Checkout/receipt URL, provider secret, card
data, quote terms, amount tied to identity, dispute evidence or client-sensitive service text.

## 11. API or service contracts

Exact HTTP paths, DTO sizes and rate limits require a Build gate. These provider-neutral ports are
the architectural contract.

```ts
interface ClientBillingQueryService {
  list(input: AuthorizedBillingListInput): Promise<ClientBillingPage>;
  getDetail(input: AuthorizedBillingDetailInput): Promise<ClientBillingDetail>;
  getReturnStatus(input: AuthorizedReturnStatusInput): Promise<ClientPaymentReturnStatus>;
}

interface StaffBillingQueryService {
  list(input: AuthorizedStaffBillingListInput): Promise<StaffBillingPage>;
  getDetail(input: AuthorizedStaffBillingDetailInput): Promise<StaffBillingDetail>;
  listExceptions(input: AuthorizedExceptionInput): Promise<FinancialExceptionPage>;
}

interface QuoteService {
  createDraft(command: QuoteDraftCommand): Promise<QuoteCommandReceipt>;
  approveAndSend(command: QuoteSendCommand): Promise<QuoteCommandReceipt>;
  decline(command: QuoteDeclineCommand): Promise<QuoteCommandReceipt>;
  supersede(command: QuoteSupersedeCommand): Promise<QuoteCommandReceipt>;
}

interface QuoteAcceptanceOrchestrator {
  accept(command: QuoteAcceptCommand): Promise<CompositeQuoteAcceptanceReceipt>;
}

// M021 owns this port; the orchestrator invokes it inside the shared Postgres transaction.
interface ServiceOrderAcceptancePort {
  createOrBindFromAcceptedQuote(command: AcceptedQuoteBindingCommand): Promise<ServiceOrderBindingReceipt>;
}

interface ClientCheckoutService {
  createOrRecover(command: CheckoutCommand): Promise<CheckoutHandoff>;
}

interface PublicBillingFacade {
  inspectQuote(input: PublicQuoteCapabilityInput): Promise<PublicQuoteProjection>;
  acceptQuote(command: PublicQuoteAcceptCommand): Promise<PublicQuoteReceipt>;
  createOrRecoverCheckout(command: PublicCheckoutCommand): Promise<CheckoutHandoff>;
  getReturnStatus(input: PublicReturnCapabilityInput): Promise<PublicPaymentReturnStatus>;
}

interface PaymentProvider {
  createOrRecoverCustomer(command: ProviderCustomerCommand): Promise<ProviderCustomerReceipt>;
  createOrRecoverCheckout(command: ProviderCheckoutCommand): Promise<ProviderCheckoutReceipt>;
  findCheckoutByOperationCorrelation(query: ProviderOperationLookup): Promise<ProviderLookupResult>;
  retrievePayment(input: ProviderPaymentQuery): Promise<ProviderPaymentFact>;
  retrieveInvoice(input: ProviderInvoiceQuery): Promise<ProviderInvoiceFact>;
  requestOrRecoverRefund(command: ProviderRefundCommand): Promise<ProviderRefundReceipt>;
  findRefundByOperationCorrelation(query: ProviderOperationLookup): Promise<ProviderLookupResult>;
  retrieveRefund(input: ProviderRefundQuery): Promise<ProviderRefundFact>;
  retrieveDispute(input: ProviderDisputeQuery): Promise<ProviderDisputeFact>;
}

interface PaymentWebhookIngress {
  verifyAndAccept(raw: RawProviderRequest): Promise<WebhookAcceptanceReceipt>;
}

interface PaymentProjectionService {
  applyAcceptedEvent(command: ApplyProviderEventCommand): Promise<ProjectionReceipt>;
}

interface PaymentReconciliationService {
  reconcile(command: ReconciliationCommand): Promise<ReconciliationReceipt>;
  resolveIssue(command: ReconciliationResolutionCommand): Promise<ResolutionReceipt>;
}

interface RefundWorkflowService {
  request(command: RefundRequestCommand): Promise<RefundWorkflowReceipt>;
  approve(command: RefundApprovalCommand): Promise<RefundWorkflowReceipt>;
  submitApproved(command: RefundSubmitCommand): Promise<RefundWorkflowReceipt>;
}

interface VerifiedPaymentPort {
  assess(input: PaymentPrerequisiteInput): Promise<VerifiedPaymentAssessment>;
}
```

### Client DTO boundaries

`ClientBillingSummary` may contain only safe service label, public reference, typed obligation kind,
localized integer amount/currency projection, semantic status, due fact if approved, freshness,
client-safe next action and opaque route key. It cannot represent provider IDs, webhook/reconcile
records, risk, staff actors, internal discounts, evidence, card details or protected service text.

`PublicQuoteProjection` is smaller still: exactly one quote, approved safe service description,
line-item presentation, validity/terms and available action. It returns no client existence,
history, count or identifiers beyond the scoped opaque capability context.

### Command envelope

Every command binds actor/service identity, purpose, canonical resource root, expected resource/
financial/access/recovery epochs, applicable quote/obligation/provider/policy versions, locale,
trusted time, opaque idempotency key and canonical digest. The same key with a different digest is a
conflict. Provider mutations also bind an opaque SG operation correlation that may be placed only in
approved non-PII provider metadata. Recovery searches are provider-type/account/environment/time-
bounded and paginated. A missing or non-unique match after the recovery deadline becomes
`manual_review|quarantined`; the system never issues a replacement mutation merely because the
provider idempotency window may have elapsed.

### Error contract

- `not_found`: hidden, absent or disallowed resource with indistinguishable response.
- `stale_command`: expected version/epoch changed; reload before retry.
- `quote_expired|quote_superseded`: exact accepted version is no longer actionable.
- `obligation_not_payable`: current state/policy blocks Checkout without leaking private reason.
- `amount_mismatch|currency_mismatch`: immutable snapshot/provider fact disagrees; manual review.
- `provider_processing`: accepted but not yet confirmed.
- `provider_unavailable`: safe retry or finance handoff; never success.
- `duplicate_conflict`: idempotency key was reused with different semantics.
- `provider_result_ambiguous`: the exact external result cannot be proved; quarantine and finance
  review are required and automatic reissue is prohibited.
- `financial_reconciliation_required`: projection cannot safely decide.
- `approval_required`: operation needs a separate authorized reviewer.
- `rate_limited`: bounded retry guidance without resource existence leakage.

## 12. Events and background jobs

### Canonical owner events

- `billing.quote_draft_created`
- `billing.quote_sent`
- `billing.quote_viewed`
- `billing.quote_accepted`
- `billing.quote_declined`
- `billing.quote_expired`
- `billing.quote_superseded`
- `billing.obligation_opened`
- `billing.checkout_operation_bound`
- `billing.checkout_operation_expired`
- `billing.provider_event_accepted`
- `billing.payment_processing_observed`
- `billing.payment_succeeded_observed`
- `billing.payment_failed_observed`
- `billing.payment_allocation_posted`
- `billing.invoice_status_observed`
- `billing.refund_requested`
- `billing.refund_approved`
- `billing.refund_submitted`
- `billing.refund_status_observed`
- `billing.dispute_opened`
- `billing.dispute_status_observed`
- `billing.reconciliation_mismatch_detected`
- `billing.reconciliation_resolved`
- `billing.external_payment_submitted|confirmed|rejected` after PAY-008.

Events are facts/invalidation hints, not grants, client DTOs or independent financial authority.
Consumers re-read canonical Postgres under their own authorization and policy.

### Owner handoffs

- M021 receives only typed commercial/financial-prerequisite facts, never provider payloads.
- M045 receives M044's verified assessment and applies its separately approved entitlement policy.
- M008/M009/M010 receive bounded client-safe summaries with freshness and M014 route keys.
- M013 may ask only whether an appointment payment prerequisite is satisfied; it cannot create,
  confirm or refund money.
- M020/M078 may receive only approved prospect/consent linkage receipts; payment grants nothing.
- M025 receives a content-free finance activity summary for authorized staff; M026 receives generic
  delivery requests under PAY-015.
- M077 receives minimized audit facts. M092 receives only separately approved aggregate metrics.

### Jobs

- process accepted webhook inbox events by retrieving canonical provider objects before projection;
- reconcile long-processing Checkouts/PaymentIntents and missed provider events;
- expire quote versions and Checkout operations;
- reconcile invoices, refunds and disputes in approved scope;
- open/retry bounded outbox projections and finance review tasks;
- detect duplicate customer/unknown object/unallocated transaction exceptions;
- purge expired capabilities/return handles/provider raw incident evidence under PAY-013;
- run post-restore full bounded financial reconciliation before new prerequisite satisfaction;
- later run approved reminder/dunning/payment-plan jobs.

Every job has a Postgres job/operation record, idempotency key, bounded attempts/backoff, terminal
failure code, dead/manual route, owner and replay-safe recovery. Inngest is coordinator only.

## 13. Error states and recovery

| Condition | Safe behavior | Recovery evidence |
|---|---|---|
| Invalid/missing webhook signature | Reject before trusted persistence; no state change | Security metric and minimized rejection code |
| Duplicate provider event | Return prior acceptance/application receipt | Unique provider-event constraint |
| Out-of-order event | Do not regress; retrieve object or reconcile | Provider object/version and reconciliation record |
| Unknown provider object | Quarantine as unmatched; no client/service mutation | Finance review issue |
| Amount/currency mismatch | Block allocation/prerequisite; alert finance | Immutable snapshot versus provider fact |
| Checkout create timeout | Reuse exact provider token; retrieve bound object or search by SG correlation; ambiguity quarantines without reissue | Operation, key version, request/object ref, paginated lookup |
| Checkout expired | Close operation; permit new operation for same obligation | Prior session remains non-actionable |
| Webhook delayed | Show processing/unconfirmed; reconcile | Freshness and job result |
| Database unavailable at webhook | Fail request so provider retries; no false acknowledgement | Provider retry plus alert |
| Projection transaction fails | Roll back journal/allocation/audit/outbox together | Inbox remains retryable |
| Stripe unavailable | No confirmation/refund; retry or human handoff | Provider-health and operation state |
| Refund call uncertain | Reuse exact provider token; retrieve/search by SG correlation; ambiguity quarantines without reissue | Refund operation, key version, request/object ref, paginated lookup |
| Provider idempotency window elapsed | Never infer absence or reuse as permission to create; reconcile or quarantine | Recovery deadline and correlation search evidence |
| Restore-generation cutover event | Old generation final-fence/returns retryable non-2xx; new ingress accepts retry, then reconciles | Generation-bound receipt and checkpoint |
| Dispute update missing | Keep prior provider fact as stale/unconfirmed; reconcile | Scheduled/provider query evidence |
| Unauthorized/hidden resource | Uniform not-found and no counts/timing detail | Minimized denied audit where allowed |
| Access revoked during read | Final fence discards entire response | Access-epoch mismatch |
| Restore from backup | Freeze new prerequisite promotion; advance generation; reconcile Stripe | Restore/reconciliation checklist |
| CRM/portal projection unavailable | Preserve financial fact; retry typed outbox | Durable outbox and source state |

Manual recovery may repair links or record an accepted exception only through a privileged,
expected-version, reason-coded, audited command. It may not fabricate a provider transaction.

## 14. Security and privacy requirements

### Payment and provider security

- Prefer Stripe-hosted Checkout to minimize PCI scope; do not claim complete PCI compliance merely
  from using Stripe.
- Separate test/staging/production accounts, endpoint secrets, API keys, webhook inboxes,
  idempotency namespaces, references and data.
- Secrets remain in approved secret management with least privilege, ownership, rotation, break-
  glass, recovery and revocation evidence; never repository, browser, Sanity or documentation.
- Verify webhooks against raw bounded bytes before trusted parsing; enforce correct provider account,
  environment, endpoint version, signature timestamp tolerance and composite event uniqueness. Treat
  each event only as an invalidation signal and retrieve canonical provider objects before every
  projection attempt.
- Provider API egress uses an allowlisted HTTPS destination through the Stripe adapter; no arbitrary
  URL fetch or user-controlled provider object.
- Every browser handoff validates the exact PAY-012/PAY-014-approved HTTPS scheme, provider host/path
  policy and bound provider object. Arbitrary, user-supplied, unbound or database-tampered Checkout,
  receipt, hosted-invoice or Customer Portal destinations are rejected.
- Checkout/receipt/Customer Portal URLs are bearer-like destinations: no logs, analytics, email
  copies outside M026, browser persistence, prefetch, screenshots or durable authorization.

### Access and isolation

- M007/ADR 004 identity, membership and explicit resource grants remain mandatory.
- Client/Public/Staff DTOs and query services are separate; RLS cannot be replaced by frontend
  filtering.
- Financial mutations require server-side authorization, CSRF, expected versions, idempotency and
  audit. Enhanced actions require recent assurance and separation of duties.
- Public entry capabilities and provider return handles are distinct one-resource, purpose/audience/
  version/use/expiry/environment/recovery-bound values and rate-limited; enumeration reveals no
  customer existence. GET/HEAD is an inert generic landing and never consumes a token or mutates
  state. An explicit user-initiated POST/OTP exchange with exact Origin, Fetch Metadata and CSRF/
  bootstrap controls creates only an opaque host-only SameSite session; action consumption is atomic.
- Before personalized content or any third-party subresource, token-bearing navigation performs a
  clean redirect/history replacement under `Referrer-Policy: no-referrer`; edge/app access logs,
  analytics, errors, service workers and caches redact or exclude token transport. Scanner, prefetch,
  forwarding, replay, concurrency, provider exposure and recovery revocation are threat-modelled.
- Staff exports/reports require dedicated permission, bounded filters, watermark/evidence and
  approval; none is authorized by this PRD.

### Data minimization

- Invoices, quote terms and amounts tied to identity are Confidential.
- Full card/payment authentication data and Stripe/application secrets are prohibited.
- Provider IDs, webhook payloads, payment failure details, IP/network evidence and dispute material
  stay server-side and purpose-limited.
- No sensitive service description, financial amount tied to identity, invoice line item, provider
  reference, failure reason or URL enters PostHog, Sentry, OpenTelemetry, session replay or ordinary
  logs.
- Client UI masks any approved payment-method summary and never displays more than provider-approved
  brand/type/last4; PAY-014 may keep it disabled.
- Notifications use generic wording and portal links; no amount/service detail on lock screens.

### Integrity, abuse and incident controls

- Rate-limit quote inspection/acceptance, Checkout creation, return polling, receipt handoff and
  staff mutations per actor/session/resource/risk without raw contact/IP in domain state.
- Detect price/discount/service-order/redirect/idempotency tampering and cross-client IDOR.
- Financial mutation audit is append-only/minimized and linked to approval/correlation evidence.
- Incident response can disable new Checkouts/refunds/public capabilities while preserving signed
  webhook acceptance and cleanup/reconciliation.
- Restore cannot trust a rolled-back Postgres projection until provider reconciliation closes.

## 15. UX and accessibility requirements

- The client sees a calm financial workspace, not a finance-admin console.
- Every amount has an explicit currency, typed line-item ownership and total; hidden fees/dark
  patterns/preselected extras are prohibited.
- `Payment confirmed` and `Service pending internal review` appear as separate facts.
- The primary action is singular and state-safe: `Review quote`, `Pay securely`, `View receipt`,
  `Contact billing` or no action.
- Processing, failed, expired, refunded and disputed states provide plain-language next steps without
  raw provider errors or blame.
- Checkout return uses a verification state and does not celebrate success before confirmation.
- Quote acceptance exposes terms/disclosures before the action and preserves an accessible copy.
- Tables collapse into semantic cards on narrow screens without losing label/value association.
- Keyboard, screen reader, zoom/reflow, target size, focus, validation summary, status announcement
  and reduced-motion behavior meet WCAG 2.2 AA.
- Status never relies on color alone. Motion is subtle, non-blocking and suppressed by
  `prefers-reduced-motion`.
- Cyan/gold are decorative accents on light surfaces, not normal text or the sole essential boundary;
  normal text meets 4.5:1 and large text/icons/controls meet 3:1.
- Personalized responses and return pages are private/no-store and excluded from shared cache.

The complete experience specification is
[`../superpowers/specs/2026-08-09-m014-client-payments-design.md`](../superpowers/specs/2026-08-09-m014-client-payments-design.md).

## 16. Bilingual requirements

- Every client/public route, heading, status, action, line-item label, validation message, empty/error
  state, quote term, disclosure, invoice/receipt label and support handoff requires approved English
  and Spanish parity.
- Canonical codes, money, provider identifiers and audit facts remain locale-neutral.
- Locale formatting uses the selected UI locale while preserving exact integer amount/currency.
- Legal/provider terms that SG Solutions cannot accurately translate remain provider-owned with
  clear provenance; SG copy cannot change their legal meaning.
- A locale switch preserves the exact quote/obligation/action and never creates a new acceptance or
  Checkout operation.
- Missing translation fails publication/action closed; it does not silently fall back on an
  unapproved legal/financial string.

## 17. Acceptance criteria

Documentation acceptance now requires every statement below to be represented in PRD, ADR, design,
gates and authority documents. Future Build acceptance additionally requires executable evidence.

1. One client/public/staff surface is mapped to the shared Billing bounded context without a second
   payments product or database.
2. Exact authority is assigned across M014/M021/M042–M046/M077/M026.
3. All money is integer minor units plus currency and no frontend amount is authoritative.
4. Accepted quotes and obligations bind immutable line-item, terms and policy versions.
5. A Checkout operation uses one semantic command digest and stable provider idempotency key.
6. Checkout return never writes `paid`, approval-to-start or entitlement state.
7. Webhook signature is verified over raw bounded bytes before trusted acceptance.
8. Webhook receipts are generation-bound, use composite provider-account/environment/event identity,
   and retrieve canonical provider objects before projection; duplicate event IDs or duplicate facts
   cannot create duplicate side effects.
9. Out-of-order events cannot regress provider state and ambiguity triggers reconciliation.
10. Provider fact, journal/allocation, obligation projection, audit and outbox apply atomically.
11. Stripe remains external financial authority; Postgres remains operational authority.
12. A verified payment updates only the financial prerequisite and not human approval/fulfillment.
13. Client access inherits only from an explicit service-order/case root and final-fences every
    response.
14. Email, payment, provider customer or receipt possession cannot create identity or access.
15. Public payment capability is impossible until PAY-016 and then grants one bounded resource only.
16. Client/Public/Staff DTO schemas cannot represent internal/provider/security fields.
17. Stale/unavailable financial state becomes explicit, never `paid` or zero/no action.
18. Refund request, approval, submission and provider outcome remain separate states.
19. Dispute state and internal service-impact decision remain separate.
20. No external payment can be confirmed until PAY-008 and evidence alone is insufficient.
21. No PAN, CVV, full card data, provider secret or bearer destination is stored/logged/analysed.
22. Receipt/invoice access reauthorizes the exact resource; permanent provider URL is not a grant.
23. Restore advances recovery generation and forces Stripe reconciliation before new financial
    prerequisite promotion.
24. Inngest coordinates but owns no financial fact or idempotency result.
25. Errors are safe, localized and do not leak resource/customer/provider detail.
26. UI separates service fee, external fee, discount, tax and total without hidden charges.
27. WCAG 2.2 AA, reduced motion and 320px reflow are specified and later tested.
28. English/Spanish parity is required for all transactional content and acceptance evidence.
29. Price presentation accepts exactly `public|from|quote|consultation`; publication is a separate
    off-by-default status and aliases are rejected.
30. Currency/geography activation fails closed until PAY-009; the data model remains ISO-currency
    safe and cross-currency allocation is prohibited.
31. Quote acceptance, M021 order create-or-bind, one obligation and composite receipt commit in one
    transaction or not at all.
32. Provider mutation recovery preserves or deterministically reconstructs the exact provider token,
    searches by opaque SG correlation after lost responses/restore/idempotency expiry and quarantines
    ambiguity without automatic reissue.
33. Browser destinations pass exact HTTPS provider host/path/object validation; public entry/return
    token transport is inert on GET/HEAD and removed before personalized render or subresources.
34. PAY-001–PAY-020 remain one-to-one Product Owner/activation gates; no policy was invented.
35. No Build, Stripe account, secret, endpoint, real price, route, table or transaction is claimed.

### Future executable test matrix

- Canonical `public|from|quote|consultation` parsing, off-by-default publication and alias rejection.
- Currency-policy fail-closed behavior, approved allowlist and cross-currency rejection.
- Exact-price, quoted-price, deposit and one-time obligation calculations after their gates close.
- Quote expiry/supersession/acceptance races and digest/idempotency conflicts.
- Quote acceptance/order/obligation atomicity with injected failure at every boundary.
- Price/discount/service-order/currency tampering.
- Checkout timeout/retry/expiration, restart/restore, provider-key-window expiry, correlation lookup,
  paginated/duplicate matches, quarantine and proof that no second Checkout/refund is issued.
- Signed, invalid, stale, duplicated and replayed webhook delivery, including different event IDs for
  the same provider fact and crash after acknowledgement.
- Out-of-order succeeded/processing/refund/dispute/invoice events.
- Atomic rollback at every journal/allocation/audit/outbox boundary.
- Cross-client IDOR on list/detail/count/cursor/receipt/Checkout/return.
- Revocation/re-parenting/final-fence races.
- Refund privilege escalation, double approval and uncertain provider response.
- External-payment fraud evidence and reviewer separation.
- Stripe/DB/Inngest/CRM/portal outage and reconciliation recovery.
- Restore generation, missed events and controlled full reconciliation.
- No PAN/CVV/secret/URL/amount+identity in logs/traces/errors/analytics.
- ES/EN semantic parity, currency formatting, keyboard/screen reader/zoom/reduced motion.
- Redirect scheme/host/path confusion and unbound destination rejection; scanner GET/HEAD, speculative
  prefetch, history/back/referrer/access-log/analytics, forwarded-link, replay/concurrency and clean
  capability/return exchange tests.

## 18. Negative acceptance criteria

- No payment, Checkout, invoice, refund, dispute, subscription or external-payment product behavior.
- No Stripe SDK call, credential, webhook endpoint, product/price object or provider traffic.
- No amount, price, deposit, due term, refundability, discount or threshold invented.
- No frontend/query parameter/success page sets financial state.
- No unauthenticated generic Payment Link without a bound current obligation/capability.
- No one-table `payments` model representing all financial states.
- No mutable accepted quote/invoice/transaction history.
- No last-event-wins webhook reducer.
- No webhook trust before raw-body signature verification.
- No retry that can create a second charge/refund for the same semantic command.
- No payment-confirmed automatic service start, case progress or human approval.
- No email/customer/payment matching as membership, grant or delegated authority.
- No internal note, provider payload, dispute evidence, webhook failure or risk field in Client DTO.
- No permanent Checkout/receipt/Customer Portal URL stored as application access.
- No card data through chat, WhatsApp, phone, email, forms, logs or support screenshots.
- No AI price/refund/waiver/external-payment/dispute mutation.
- No automatic refund/dispute/service sanction.
- No external fees or partner commissions misclassified as SG service revenue.
- No accounting ledger, sales-tax, ACH, subscription or payment-plan claim without its later gate.
- No shared personalized cache, browser storage, session replay or sensitive analytics.
- No claim of PCI compliance, Operational status or production readiness without external evidence.

## 19. Dependencies

- M007 and ADR 004 for identity, session, membership, representative and resource grants.
- M008/M009/M010 for bounded dashboard/service/process projections and routes.
- M011 for any SG-generated private invoice/receipt/evidence bytes.
- M012/M025/M026 for safe support, unified activity and generic delivery.
- M013 for appointment-payment prerequisite queries only.
- M020 lead/contact, M021 ServiceOrder, M022 Case, M023 Tasks and M074 approvals.
- M042 service catalog, M043 Stripe adapter, M044 verification, M045 entitlements and M046 pricing.
- M077 audit, M078 consent, M080/M081 IAM/RBAC, M085 retention and M092 reporting.
- Drizzle/Postgres/RLS, approved secret management, Inngest coordination, Sentry/OpenTelemetry/
  PostHog minimization and backup/recovery controls.
- BIZ-001–BIZ-003 and PAY-001–PAY-020 Product Owner decisions/activation evidence.

No dependency state authorizes Build or live provider activation.

## 20. Risks

| Risk | Control |
|---|---|
| Price or currency tampering | Immutable server snapshot, integer money, digest and provider comparison |
| Duplicate charge/refund | Operation reservation, stable idempotency and provider retrieval |
| Lost/duplicate/out-of-order webhook | Signed inbox, unique event, monotonic reducer and reconciliation |
| Payment mistaken for approval | Separate M044 financial assessment and M021/M074 human approval |
| Cross-client financial disclosure | Explicit root grants, separate DTOs, RLS and final fence |
| Bearer URL leakage | Transient no-store handoff, redaction and no browser/telemetry persistence |
| Card/secret exposure | Stripe-hosted collection, schema prohibition and security tests |
| Manual financial-history mutation | Append-only facts, adjustments, expected version and audit |
| Refund/dispute abuse | Least privilege, separation of duties and Product Owner policy gates |
| Provider/database divergence | Freshness, mismatch queue, scheduled and post-restore reconciliation |
| Fee/revenue misclassification | Typed immutable line items and ownership classifications |
| Unapproved tax/legal claims | Fail-closed policy gates and professional review |
| Notification privacy leakage | Generic M026 templates and lock-screen-safe content |
| Public capability theft/enumeration | High entropy, one-resource scope, expiry/use, recovery epoch and quotas |
| Premature external activation | External register, provider evidence and enhanced independent review |

## 21. Open questions

The one-to-one activation decisions are maintained in
[`../../EXTERNAL_ACTIVATION_REGISTER.md`](../../EXTERNAL_ACTIVATION_REGISTER.md). None is answered by
this document.

- [NEEDS PRODUCT OWNER DECISION: PAY-001 — approve the Release 1A service/line-item inventory and
  per-service use/publication of the canonical `public|from|quote|consultation` modes.]
- [NEEDS PRODUCT OWNER DECISION: PAY-002 — approve quote validity, acceptance/terms evidence,
  supersession and cancellation rules.]
- [NEEDS PRODUCT OWNER DECISION: PAY-003 — approve deposit/balance amounts or formulas,
  refundability and exactly what a confirmed deposit permits.]
- [NEEDS PRODUCT OWNER DECISION: PAY-004 — approve invoice numbering, issue/due/void/uncollectible
  policy and client document requirements.]
- [NEEDS PRODUCT OWNER DECISION: PAY-005 — approve discount/coupon/promotion/waiver types,
  eligibility, limits and staff authority.]
- [NEEDS PRODUCT OWNER DECISION: PAY-006 — approve refund/void eligibility, reason codes, authority,
  amount thresholds, second review and service/entitlement consequences.]
- [NEEDS PRODUCT OWNER DECISION: PAY-007 — approve dispute-response ownership, evidence handling,
  client copy and permitted service-impact decisions.]
- [NEEDS PRODUCT OWNER DECISION: PAY-008 — approve external payment methods, evidence sources,
  reviewers, separation of duties and rejection/appeal workflow.]
- [NEEDS PRODUCT OWNER DECISION: PAY-009 — approve the exact Release 1A payment-method, currency and
  geography allowlists, Stripe Customer reuse and any Customer Portal exposure.]
- [NEEDS PRODUCT OWNER DECISION: PAY-010 — approve tax treatment only after applicable professional
  review; until then no sales-tax calculation or taxable/exempt claim.]
- [NEEDS PRODUCT OWNER DECISION: PAY-011 — complete LLC/bank/Stripe institutional onboarding,
  ownership, recovery, environment separation and least-privilege account roles.]
- [NEEDS PRODUCT OWNER DECISION: PAY-012 — approve endpoint/event inventory, API/webhook key custody,
  signature tolerance, rotation, replay, monitoring and sandbox/production evidence.]
- [NEEDS PRODUCT OWNER DECISION: PAY-013 — approve retention/deletion/legal hold for quotes,
  invoices, transaction facts, raw webhook incident material, idempotency and reconciliation/audit.]
- [NEEDS PRODUCT OWNER DECISION: PAY-014 — approve exact Client/Public/Staff financial fields,
  payment-method masking, receipt/invoice access, freshness budgets and privacy copy.]
- [NEEDS PRODUCT OWNER DECISION: PAY-015 — approve bilingual payment/refund/dispute/reminder
  templates, channels, consent, cadence, quiet hours, suppression and support expectation.]
- [NEEDS PRODUCT OWNER DECISION: PAY-016 — approve prospect quote/payment capability, delivery,
  expiry/use, return-status scope, account-linking path and fraud controls.]
- [NEEDS PRODUCT OWNER DECISION: PAY-017 — define Release 1B payment-plan/subscription eligibility,
  schedule, fees, authorization, retry/dunning, cancellation, renewal and grace policy.]
- [NEEDS PRODUCT OWNER DECISION: PAY-018 — approve government/provider fee collection/payment
  models, client authorization, custody, accounting treatment and evidence.]
- [NEEDS PRODUCT OWNER DECISION: PAY-019 — approve partner referral/commission/payment separation,
  disclosures, statements, attribution and accounting treatment.]
- [NEEDS PRODUCT OWNER DECISION: PAY-020 — approve production-readiness evidence: sandbox tests,
  reconciliation/restore/incident drills, runbooks, monitoring, rollback and controlled live payment.]

Until each decision closes, the associated behavior remains unavailable or uses a safe manual
pending/support path. No unresolved item may be silently inferred from Stripe defaults.
