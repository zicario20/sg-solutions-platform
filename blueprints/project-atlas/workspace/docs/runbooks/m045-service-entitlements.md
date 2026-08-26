# M045 Service Entitlements Runbook

## Current operating mode

M045 is a controlled, provider-disabled technical foundation. Do not enable any M045
runtime flag, apply its migration, create a production repository, dispatch an outbox
event, or connect it to M044/M068 without a separately approved change.

## Safe responses

| Condition | Required response |
| --- | --- |
| Unknown or stale blocking evidence | Deny or route to configured manual review; never infer allow. |
| Payment gate satisfied but human authorization missing | Return action-required and create no workflow handoff. |
| Consent withdrawn, identity blocked, jurisdiction denied, cancellation/refund context | Deny and preserve the decision/audit evidence. |
| Cross-tenant or cross-client resource reference | Deny, create a high-severity operational finding, and investigate IDOR risk. |
| Temporary grant expires | Mark expired, invalidate cached decisions, and do not silently extend. |
| Usage quota race or replay | Reject the non-idempotent conflict; future durable implementation requires transactional locking. |
| AI asks to grant, deny, approve, revoke, or consume | Reject the actor and record a scope-violation event. |

## Pre-activation checklist

1. Product Owner approves an activation plan and scope.
2. PostgreSQL migration backup, rollback, and application evidence are approved.
3. A durable repository verifies tenant isolation, RLS, idempotency, atomic usage,
   audit hash chain, and cache invalidation.
4. Authoritative condition adapters are independently reviewed for freshness and
   fail-closed behavior.
5. M042 profile binding, M044 gate adapter, approval adapter, and M068 handoff
   contract are tested independently and end to end.
6. Temporary-grant, deny, override, revocation, and incident responsibilities are
   assigned with MFA and separation-of-duties controls.
7. Security review confirms no provider credentials, raw payment evidence, document
   data, or client PII leak into decisions, logs, analytics, or cache entries.
8. Product Owner approves limited rollout and rollback conditions.

## Rollback posture

Before activation, the rollback is to keep every M045 flag false. If a future enabled
consumer produces unsafe results, immediately disable its handoff, invalidate cache,
preserve audit evidence, and return to the owning module's existing safe state. Do
not mutate historical payment, service-order, workflow, or entitlement decisions to
hide an incident.
