# M043 Stripe Payments Design

- Status: Controlled, provider-disabled technical design
- Date: 2026-08-26
- Decision owner: Product Owner

## Architecture

Public site or client portal
  -> server command boundary
  -> M042 catalog reference and M046 pricing snapshot
  -> M043 checkout preparation
  -> disabled StripePaymentAdapter

Stripe signed event when an activation is approved
  -> bounded raw-byte ingress
  -> signature verification and environment fence
  -> durable Stripe event inbox and deduplication
  -> normalized evidence
  -> M043 PaymentVerificationCandidate
  -> M044 verification decision
  -> separately authorized commercial workflow and entitlement behavior

The browser return path is informational only and cannot shortcut the event, M044, approval or
workflow chain.

## Core design rules

1. The catalog is internal. Stripe Products and Prices are provider representations, never the
   entire commercial source of truth.
2. M046 is the source of authoritative monetary calculation. M043 only accepts its immutable
   pricing snapshot, in integer USD minor units.
3. M043 does not contain Stripe SDK calls in its domain service. The adapter is isolated and is
   provider-disabled in this implementation.
4. A Stripe event creates evidence only. M044 must validate expected order, amount, currency,
   environment, idempotency and applicable business controls before declaring a payment verified.
5. Refund handling is a request and approval workflow. A provider response still requires
   verification/reconciliation and cannot automatically cancel a service.
6. The application never stores card data. Setup and payment method records keep provider
   references plus consent references only.
7. Test and live account profiles, credentials, customer mappings, provider object references and
   event inbox keys are segregated by environment.

## Storage model

M043 extends the existing Billing tables with Stripe-specific tables. The main groups are:

- Configuration: API-version policy, credential reference profile and account profile.
- Provider identity: one customer mapping per client and environment.
- Commercial evidence: transaction context, checkout session, PaymentIntent, SetupIntent,
  payment-method reference, invoice and immutable invoice-line snapshot.
- Risk-sensitive lifecycle: refund request, provider refund, dispute and evidence reference.
- Event reliability: event inbox, verification candidate, dead letter, reconciliation run/finding
  and append-only payment audit event.

The authored migration uses RLS with a restrictive deny-all policy. A real authorized gateway policy
must be added only with reviewed deployment evidence. Migration 0053 is not executed.

## Provider boundary

StripePaymentAdapter implements the M043 StripePaymentProvider contract. It advertises no enabled
capabilities and every operation fails closed. It is intentionally separate from M042, M044,
M045, M046 and the commercial workflow packages.

The adapter is compatible with the M041 provider-abstraction principle:

- Adapter behavior is isolated from domain services.
- No caller receives a Stripe secret or provider client secret.
- Provider endpoint and credential decisions are not hardcoded in UI components.
- No provider-specific payment state is treated as a business verification outcome.

## Webhook boundary

The application ingress:

1. checks that M043 ingress and M014 payment flags are both explicitly enabled;
2. applies a bounded Content-Length and raw body size;
3. reads raw bytes without parsing JSON;
4. verifies the Stripe signature against current and previous signing secrets;
5. returns unavailable because a durable runtime processor is not configured.

The current route is intentionally non-operational. Future activation must add a transactionally
durable inbox, retry policy, dead-letter handler, replay authorization, trace correlation and M044
candidate dispatch before accepting live provider delivery.

## State boundaries

M043 provider-facing states include checkout_requested, provider_processing and
provider_succeeded_pending_verification. None mean paid.

M044 will own verified or rejected payment facts. M020B/M068 own commercial and operational state
transitions. M045 owns entitlement state. A service cannot begin merely because a provider event
reports success.

## AI and administrative safety

AI may explain documented payment status after permission and purpose checks in a future approved
surface. AI may not create checkout, set an amount, apply a discount, grant an entitlement, issue a
refund, mark payment verified, resolve a dispute or activate Stripe.

Administrative actions must eventually use separate permissions for payment read, checkout
preparation, refund request, refund approval, dispute evidence, reconciliation, replay and provider
configuration. Owner override, if ever permitted, requires reason, reauthentication and audit.

## Future activation sequence

1. Approve the payment policy and M046/M044/M045 integrations.
2. Apply and validate migration 0053 in a disposable environment with backup and rollback evidence.
3. Register a test Stripe account profile and secret references outside Git.
4. Implement an authorized database repository, inbox processor and M044 handoff.
5. Run Stripe sandbox contract, webhook replay, out-of-order, reconciliation and refund/dispute
   tests.
6. Obtain independent security review and Product Owner approval for a restricted rollout.
7. Enable only test ingress first. Live Stripe requires a separate Product Owner decision.
