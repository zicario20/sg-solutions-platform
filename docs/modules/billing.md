# Module PRD — Quotes, Invoices and Stripe Payments

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M042–M046 and client projection M014

## 1. Purpose

Price SG Solutions services, issue quotes/invoices and collect/reconcile payments through Stripe
without confusing financial state with human service authorization.

## 2. Business value

Support real deposits and one-time payments in Release 1A while preserving a compatible path to
payment plans and operational maturity in Release 1B.

## 3. Scope

Service catalog price modes; quote versions/acceptance; deposits; Stripe Checkout; customers;
one-time payments; invoices/receipts; local financial projections; signed webhooks; idempotency;
refund/dispute recording; reconciliation; client payment history/links; payment prerequisites and
audit. Release 1B adds payment plans and advanced invoice reconciliation.

## 4. Explicit out of scope

Platform-usage subscriptions, marketplace payouts, storing full card data, autonomous refunds,
accounting general ledger, tax filing calculations and payment-confirmed automatic execution of a
sensitive service.

## 5. Actors

Prospect/client payer, Owner/finance-authorized staff, case/service-order staff, Stripe adapter,
webhook endpoint, reconciliation worker and independent auditor.

## 6. User journeys

1. Staff selects `public`, `from`, `quote` or `consultation` mode for an approved service.
2. Staff creates/version-controls a quote and sends an expiring acceptance/payment link.
3. Client accepts and pays a configured deposit or one-time amount through Stripe-hosted UI.
4. Signed webhook is persisted, deduplicated and applied to the local projection.
5. Staff sees payment status separately from approval-to-begin and reconciles exceptions.
6. Authorized staff initiates/refers a refund and the system reconciles Stripe outcome.

## 7. States and transitions

- Quote: `draft → sent → viewed → accepted|declined|expired|superseded`.
- Invoice/payment obligation: `draft → open → partially_paid|paid|void|uncollectible`.
- Payment: `created → processing → succeeded|failed|cancelled`; later `partially_refunded|refunded|
  disputed` as reported by Stripe.
- Reconciliation: `pending → matched|mismatch → manual_review → resolved`.
- Service authorization remains a separate Approval/ServiceOrder state.

## 8. Business rules

- All money is integer minor units plus ISO currency; snapshots never rely on mutable catalog price.
- Public price publication is off by default and enabled per service by Product Owner decision.
- Quotes are immutable after acceptance; changes create a superseding version.
- Stripe is authoritative for external transaction/invoice/refund/dispute state; Postgres records
  internal projections, service links and recovery history.
- Provider events may repeat or arrive out of order; transitions cannot regress authoritative state.
- Payment confirmed can satisfy a prerequisite but never grants human approval automatically.
- Creation/modification calls use stable idempotency keys and safe retry semantics.

## 9. Authorization rules

Only finance-authorized staff may publish prices, issue/void quotes/invoices, request refunds or
resolve mismatches. Service staff may view only financial summaries required for assigned work.
Clients see only their explicitly granted quotes/invoices/payments. Public links are opaque, scoped,
expiring and reveal no unrelated customer data.

## 10. Data requirements

ServiceDefinition/PriceRule and approval state; quote/version/line items/discounts/tax treatment/
expiry/acceptance; Stripe customer/checkout/invoice/payment/refund/dispute IDs; amount/currency;
provider status/version/timestamps; webhook event ID/type/received/processed/result; idempotency key;
ServiceOrder link; reconciliation issue/resolution; client-visible receipt URL reference and audit.
Never store PAN, CVV, magnetic-stripe data or raw payment-method details.

## 11. API or service contracts

- `PricingService.resolve(serviceId, context) → approved PricePresentation`.
- `QuoteService.create|send|accept|decline|supersede` with version checks.
- `PaymentService.createCheckout(serviceOrderId, obligationId, idempotencyKey)`.
- `StripeWebhookService.verifyAndPersist(rawBody, signature) → EventReceipt` before processing.
- `PaymentProjectionService.apply(eventId)` idempotently and order-independently.
- `ReconciliationService.reconcile(customer|invoice|payment|dateRange)`.
- `RefundService.request(actor, paymentId, amount, reason, idempotencyKey)` after approval.

## 12. Events and background jobs

`quote.sent`, `quote.accepted`, `checkout.created`, `payment.succeeded`, `payment.failed`,
`invoice.updated`, `refund.updated`, `dispute.opened`, `payment.mismatch_detected` and
`payment.reconciled`. Jobs process persisted webhooks, poll/reconcile missed state, expire quotes and
surface manual review. Retry limits and dead/manual routes are explicit; Inngest owns no financial state.

## 13. Error states and recovery

Invalid signature, duplicated/out-of-order event, stale quote, amount/currency mismatch, Checkout
creation timeout, payment pending, webhook processing failure, unknown provider object, refund
failure, dispute and reconciliation mismatch. Acknowledgement/retry never applies an event twice.
Mismatch blocks unsafe entitlement/service transitions and opens a finance review task.

## 14. Security and privacy requirements

Stripe-hosted collection minimizes PCI scope; signed raw-body webhook verification; secret rotation;
idempotency; least-privilege API keys; HTTPS; no card/payment-secret data in logs/analytics; audit of
all finance mutations; masked client/admin views; CSRF protection; rate limits; independent security
review and Stripe reconciliation test evidence.

## 15. UX and accessibility requirements

Quotes clearly state service, line items, deposit/balance, expiry, conditions and disclosures.
Payment states distinguish processing, paid and authorized-to-begin. Hosted Checkout return pages
do not claim success until authoritative confirmation. Tables and forms are keyboard/screen-reader
operable, amounts use locale/currency formatting and errors give a safe next step.

## 16. Bilingual requirements

Quote/invoice/payment/deposit/refund/dispute status, instructions and disclosures require approved
English/Spanish parity. Provider/legal text that cannot be translated by SG Solutions is linked or
displayed with provenance. Stored financial status codes remain locale-neutral.

## 17. Acceptance criteria

- A duplicated webhook produces one financial transition and one idempotent processing result.
- Out-of-order events cannot regress a succeeded/refunded authoritative state.
- Checkout amount/currency matches the immutable obligation snapshot.
- A paid state never marks a service human-approved automatically.
- A reconciliation job detects and routes mismatches without duplicating side effects.
- Unauthorized users cannot issue refunds, publish prices or view unrelated transactions.

## 18. Negative acceptance criteria

- No full card data, CVV or raw payment method stored or logged.
- No success page alone marks a payment paid.
- No webhook processing before signature verification/persistence.
- No quote edited in place after acceptance.
- No automatic refund, dispute decision or sensitive service start.

## 19. Dependencies

Identity/Access, service catalog/pricing approval, case/service orders, audit/activity, consent,
entitlements/approvals, provider abstraction, Postgres durable jobs and Stripe account/configuration.

## 20. Risks

Duplicate/out-of-order events, amount drift, mistaken refunds, webhook loss, long-pending payments,
disputes, currency mistakes and payment/authorization conflation. Mitigate with immutable snapshots,
idempotency, monotonic transitions, reconciliation and separation of duties.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve quote validity, deposit amount/rules and invoice due terms
  for each Release 1A service.]
- [NEEDS PRODUCT OWNER DECISION: approve refund/void authority, limits and second-review thresholds.]
- [NEEDS PRODUCT OWNER DECISION: approve which service prices may be public/from at launch.]
- [NEEDS PRODUCT OWNER DECISION: define Release 1B payment-plan eligibility, fees and failure policy.]
