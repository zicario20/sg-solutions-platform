# M075 - Human-in-the-loop

## Status

Controlled foundation implemented. Runtime activation, reviewer assignment, notifications, browser handoff, owner-result consumption, and any canonical state change remain disabled.

## Scope delivered

- Typed, bounded task-definition, version, scope, minimized-context, request, work-item, eligibility, result, and handback contracts.
- Drizzle persistence shape for task configuration, definitions, immutable draft versions, scopes, context references, requests, work items, eligibility results, and non-canonical results.
- Explicit permission vocabulary and runtime switches defaulting to `false`.
- Tests that preserve the distinction between task creation, approval, workflow completion, and canonical mutation.

## Safety boundaries

- A human task is not an approval, business decision, workflow completion, or external action.
- AI actors cannot submit human review results.
- Context accepts only minimized resource references; raw secrets, broad PII, and private reasoning are rejected.
- A submitted result remains blocked and requires validation by the owning domain before it can affect canonical data.

## Activation prerequisites

- M080/M081 identity, authorization, reviewer-eligibility, and separation-of-duties controls.
- M068 workflow bindings, M074 approval policies, M077 durable audit evidence, and M073 fallback/recovery paths.
- Product Owner-approved review definitions, UX, SLA/escalation policy, evidence policy, and data-classification rules.

## Not implemented

No review queue delivery, task notification, reviewer assignment, browser action, CAPTCHA/MFA handoff, external submission, workflow transition, approval, or canonical record mutation is active.
