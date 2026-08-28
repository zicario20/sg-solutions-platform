# M074 - Approval Inbox

- Status: controlled foundation implemented; approval runtime disabled.
- Operational activation: pending Product Owner approval, IAM/MFA integration, policy review, notification configuration, and independent security validation.

## Scope implemented

M074 provides versioned approval-policy, scope, frozen minimum-necessary context, request, work-item, eligibility, decision, consumption, and revocation contracts. The implementation prevents AI decision submission and records that a request or decision does not execute an action.

## Authority boundaries

- M074 owns explicit, scoped human approval records only.
- M068 and the relevant domain owner must revalidate policy, context, consent, authorization, payment, entitlement, jurisdiction, compliance, idempotency, and current state immediately before execution.
- Assignment is not eligibility; eligibility is not authority; approval is not execution; consumption is not action success.
- A revocation preserves history and does not reverse an already-executed action.

## Disabled capabilities

No policy activation, notification delivery, human decision authority, bulk approval, workflow consumption, MFA/step-up integration, delegation, or external action is active. No raw secrets, broad PII, or private reasoning may enter an approval context snapshot.

## Activation prerequisites

1. Integrate IAM, RBAC/ABAC, MFA, session reauthentication, separation of duties, and tenant isolation.
2. Define reviewed policy versions, approver eligibility, delegation, quorum, expiry, revocation, and stale-context rules.
3. Add durable outbox/inbox, concurrency, idempotency, audit, safe notifications, and recovery controls.
4. Bind M068 and M073 to canonical validated M074 results only; do not accept UI payloads directly.
5. Obtain Product Owner approval before activating any approval policy or inbox workflow.
