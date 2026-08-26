# M044 Payment Verification Design

## Canonical flow

M042 and M046 create the configured obligation and immutable pricing reference.
M043 creates signed provider evidence and a candidate.
M044 binds the candidate to an authoritative obligation, evaluates a versioned policy, creates an
immutable decision and derives a separate sufficiency assessment and payment-start gate.
M024/M074 may later approve service start. M045 may later evaluate a separate entitlement policy.
M068 may later evaluate a separate workflow transition.

Payment confirmation is therefore not service approval, entitlement grant or workflow execution.

## Provider boundary

M044 core has no Stripe SDK or Stripe object dependency. The M043 ingress mapper is an
anti-corruption adapter. It maps provider objects to limited evidence and leaves freshness unknown,
so a current-object retrieval or reconciliation result is required before a positive automatic
decision can be made.

Future provider adapters must provide only the provider-neutral candidate and evidence contract.
They must never write a decision, sufficiency, payment gate, entitlement or workflow state.

## Decision model

A PaymentVerificationDecision is immutable. Its decision hash covers the obligation, policy,
evidence hash, outcome, amounts, reason codes, actor and timestamp. A changed provider state, refund,
dispute, reversal or new evidence yields a new decision with a supersedes reference.

The idempotency fence is M044 plus obligation plus provider plus provider-state-version plus
policy-version plus evidence-hash. A durable repository must enforce that fence and persist the
decision, rule evaluations, sufficiency, gate, outbox and audit atomically.

## Evidence policy

Trust tier 1 is a verified provider event plus current/reconciled evidence.
Trust tier 2 is a current provider object through an approved adapter.
Tiers 3 through 6 may inform review but do not satisfy the default positive-verification policy.

The default policy checks provider identity, environment, object relationship, client ownership,
service-order relationship, amount, currency, status, event verification and freshness. A mismatch
becomes conflicting. Missing or stale evidence becomes insufficient_evidence. Manual external proof
requires a manual-review queue and four-eyes review.

## Downstream boundary

M044 writes a PaymentStartGate only. Its favorable state is
payment_satisfied_pending_human_approval. M044 stores dormant, blocked outbox events for future
M045 and M068 integration; no dispatcher or direct call is implemented.

## Recovery and operations

The future durable implementation must preserve the last trusted immutable decision during a
provider outage, queue unprocessed candidates, and replay them only through the idempotency fence.
New positive verification must fail closed when evidence freshness/retrieval is unavailable.
Manual recovery requires purpose-bound staff access, a reason, an audit record and re-verification.

## Product Owner decisions still required

- Evidence freshness window and which providers may supply trust-tier-1/2 evidence.
- Manual external payment and override policy, reviewer roles, limits and expiration.
- Deposit/installment schedule authority and multi-obligation allocation policy.
- Refund, dispute, chargeback and reversal notification/operational impact policy.
- M045/M068 handoff criteria, rollout scope, monitoring thresholds and incident ownership.
