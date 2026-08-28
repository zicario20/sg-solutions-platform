# M079 - Risk Management

## Status

Controlled foundation implemented. Assessment execution, scoring, appetite evaluation, treatment execution, risk acceptance approval, KRI monitoring, workflow gating, and event dispatch remain disabled.

## Scope delivered

- Typed contracts for draft taxonomies, registers, risk items, minimized contexts, evidence references, assessments, treatment plans, and acceptance requests.
- Drizzle persistence shape for the risk configuration, taxonomy, register, item, evidence, assessment, treatment, and acceptance-request boundaries.
- Explicit unknown inherent and residual risk states instead of guessed scores, classifications, or thresholds.
- Tests proving no workflow gate or authorization is changed, sensitive context is rejected, and AI cannot request or accept risk acceptance.

## Safety boundaries

- A risk finding is not a compliance conclusion, approval, access decision, or operational block.
- Evidence remains unverified until a future approved review path validates it.
- Risk appetite, tolerance, scores, and treatment actions require approved governance; they are not hardcoded in this module.
- A risk acceptance request is neither accepted nor approved and does not authorize any high-impact action.
- AI can only assist in future bounded workflows; it cannot accept risk, change appetite, close critical risk, or authorize action.

## Activation prerequisites

- Product Owner-approved taxonomy, scoring methodology, appetite/tolerance, ownership, escalation, treatment, exception, KRI, and incident policy.
- M074 acceptance approvals, M075 review, M076 compliance, M077 audit, M078 consent, M080/M081 security boundaries, M068 workflow gates, and M097 observability.

## Not implemented

No risk scoring, automatic blocking, acceptance, mitigation, avoidance, transfer, monitoring, incident handling, approval, workflow transition, or external provider action is active.
