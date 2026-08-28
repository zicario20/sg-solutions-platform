# M073 - Fallback System

- Status: controlled foundation implemented; fallback runtime disabled.
- Operational activation: pending Product Owner approval, target-specific validation, provider configuration, and independent security/compliance review.

## Scope implemented

M073 provides versioned fallback policy, capability, target, primary-attempt, candidate, evaluation, decision, plan, unknown-outcome, and degraded-mode contracts. It records the distinction between a trigger, eligibility, selection, authorization, execution, and confirmed outcome.

## Authority boundaries

- M068 owns workflow transitions and owner modules retain canonical business state.
- M072 owns asynchronous execution infrastructure, M074 owns human approvals, M071 owns jurisdiction applicability, and M083/M084 own secrets and integration security.
- A fallback decision is not execution authority and cannot bypass consent, approval, security, jurisdiction, compliance, idempotency, or outcome reconciliation.
- High-impact alternate paths remain blocked when the primary outcome is unknown.

## Disabled capabilities

No health probe, target connection, circuit breaker enforcement, provider switch, failover dispatch, failback, notification, or external action is active. Target records begin disconnected and ineligible for automatic selection.

## Activation prerequisites

1. Define and approve source-grounded capability equivalence, target support, data scope, and ownership.
2. Implement health freshness, circuit breaker, hysteresis, cross-target idempotency, and reconciliation.
3. Bind every execution through the owner module with M068, M072, M074, M083, and M084 gates.
4. Test degraded modes, manual handoff, unknown outcomes, fallback cycles, recovery, and failback.
5. Obtain explicit Product Owner approval before enabling a target switch.
