# M014 Client Payments and Billing — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `f50b71b9a9e1ed8ccff2ada1f5a7db13c8b5ab5c`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete supplied M014 source, the 21-section PRD, responsive Client/
Public/Admin design, proposed ADR 018, all twenty `PAY-001`–`PAY-020` gates and every synchronized
API, architecture, security, classification, recovery, activation, roadmap, catalog, consumer and
historical/prospective ownership document in the candidate delta. The review was read-only.

M014 remains the client billing projection/action boundary over one shared Billing bounded context.
It is not a second payments application, database, provider integration or accounting ledger. M021
owns ServiceOrder/human approval, M042 catalog, M043 provider integration, M044 verification and
reconciliation, M045 entitlements and M046 price policy.

## Finding closure

### IA-001 — Price vocabulary conflicted with an approved Product Owner decision — Closed

Presentation accepts exactly `public|from|quote|consultation`. Publication is an independent off-by-
default per-service decision; aliases and `hidden` as a presentation mode are rejected.

### IA-002 — Release 1A currency was resolved before PAY-009 — Closed

The model remains integer-minor-unit plus ISO-currency safe, but no currency/geography is activated
until PAY-009 closes. Cross-currency allocation fails closed.

### IA-003 — Commercial, financial, approval and fulfillment states were mixed — Closed

ServiceOrder commercial state, M044 assessment/obligation, M074/M021 human approval and Case
fulfillment are orthogonal. Refund, dispute, reversal or cancellation on one axis cannot choose a
transition on another.

### IA-004 — Quote acceptance lacked an atomic cross-owner coordinator — Closed

`QuoteAcceptanceOrchestrator` CAS-validates the exact version and commits acceptance, the M021-owned
order create-or-bind, exactly one obligation and one composite receipt in one Postgres transaction.
Injected failure rolls back every outcome.

### IA-005 — Uncertain provider mutation recovery was incomplete — Closed

The exact provider idempotency token is protected/retrievable or deterministically reproducible by
domain/key version; hashes are comparison-only. Bound request/object evidence and opaque non-PII SG
correlation support bounded paginated recovery after restart, restore or provider-key expiry.
Ambiguity quarantines and never triggers automatic reissue.

### IA-006 — Public capability/return transport and browser destination policy were incomplete — Closed

Entry capability and provider return handle are distinct. GET/HEAD is inert; explicit POST/OTP with
Origin, Fetch Metadata and CSRF/bootstrap establishes only a host-only session. Clean redirect/
history replacement occurs before personalized rendering. Every provider destination passes exact
activated HTTPS scheme/host/path/bound-object validation.

### IA-007 — Billing umbrella and consumers used incompatible event namespaces — Closed

M014's exact `billing.*` registry is sole authority. Portal, dashboard, service and process consumers
use canonical names and reject legacy unprefixed aliases. Events are invalidation facts only;
consumers reauthorize and reread Postgres.

### IA-008 — Webhook replay and restore cutover were underspecified — Closed

Inbox identity includes provider account/environment/event and recovery generation. Every event is
an invalidation signal followed by canonical provider-object retrieval; provider-object/fact-version
dedupe prevents duplicate effects across different Event IDs. Restore fences old-generation 2xx,
opens new ingress before mutation egress and reconciles both sides of the recovery point.

### IA-009 — Catalog dependency labels were ambiguous — Closed

The M014 catalog row uses canonical IDs and names for M007, M021 and M042–M046.

## Final architecture properties

- Stripe is authoritative for Stripe-owned external financial state; Postgres owns SG operational
  obligations, allocations, access, approvals, recovery and reconciliation evidence.
- Immutable accepted quote/obligation snapshots bind typed line items, terms, policy versions,
  integer amounts and currency.
- Payment may satisfy a financial prerequisite but cannot grant identity/access, approve service or
  begin fulfillment.
- Client/Public/Staff contracts are structurally separate and final-fence one explicit service-order/
  case root; payment, email, provider customer and receipt possession grant nothing.
- Provider handoffs are transient, no-store and exact-destination validated; SG stores no full card
  data and no permanent provider URL as authorization.
- Inngest coordinates replay-safe work; Postgres remains durable workflow/financial authority.
- Twenty unresolved policies remain one-to-one `PAY-001`–`PAY-020` Product Owner decisions.

## Verification snapshot

The final independent pass reported zero open material findings on the complete Markdown candidate.
It verified 21 required PRD sections, 20/20 PRD/register decisions, canonical event names, canonical
catalog dependencies, clean whitespace and local links with none broken. `git diff --check` passed
and the lockfile remained unchanged.

Cyber Neo's final post-remediation and post-namespace passes reported zero Critical, High, Medium or
Low findings and documentary risk `0/100`.

## Limitations

This review does not validate routes, schema/RLS, provider credentials, real Stripe objects/events,
concurrent runtime behavior, browser accessibility, restoration or money movement. The external
recovery-generation fence must later be a real concurrency-safe drain/lease/barrier, not a casual
read check. Those properties require Product Owner decisions, an explicit Build/activation gate,
implementation and independent runtime review.

This report permits only Product Owner documentary review. It does not accept ADR 018 or authorize
`GENERATE`, Build, Stripe onboarding, external activation, merge, deployment or production use.
