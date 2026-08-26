# M045 Service Entitlements Design

## Decision

Service entitlement is a separate business-authorization concern. It is evaluated
server-side from versioned service policy, scoped subject/resource context, and
freshness-controlled evidence. The default result is deny.

M045 is intentionally an adapter boundary, not a new workflow engine or an IAM
replacement.

## Authority boundaries

| Concern | Owning boundary | M045 use |
| --- | --- | --- |
| Identity and authentication | M080 | Resolve the authenticated subject only. |
| Roles and permissions | M081 | Gate staff administration separately; never derive a client entitlement. |
| Service definition/version | M042 | Read a versioned entitlement-profile reference. |
| Payment verification/gate | M044 | Consume normalized server evidence only. |
| Human start authorization | Approval domain | Consume a normalized authorization condition. |
| Documents, consent, intake, appointments | Owning modules | Consume minimum, freshness-aware condition results. |
| Operational state and execution | M068 | Require an entitlement before a future handoff; no direct call from M045. |

## Core model

`EntitlementDefinition` has a stable dotted key, owner domain, resource type, and
deny default. `ServiceEntitlementProfile` is versioned per service version and groups
definition/policy references. `EntitlementPolicy` is versioned, effective-dated, and
declares required conditions and unknown-evidence behavior.

`EntitlementGrant` is scoped by tenant, subject, resource, and source. Temporary
grants require a reason, human approver, revalidation flag, and expiry. `EntitlementDeny`
is explicit and takes precedence over grants. `EntitlementDecision` stores a
reproducible snapshot rather than relying on mutable current catalog data.

## Deterministic precedence

1. Reject cross-tenant or ownership-resolving failures.
2. Reject hard security/compliance context.
3. Apply an effective explicit deny.
4. Apply revoked, expired, cancelled, or suspended grants.
5. Evaluate blocking conditions and fail closed for unknown/stale evidence.
6. Evaluate scoped temporary or explicit grants and quota limits.
7. Evaluate the versioned policy decision.
8. Deny by default.

The current controlled engine returns a decision snapshot and an always-blocked
workflow handoff. It cannot materialize an entitlement or trigger operational work.

## Condition sources and freshness

Conditions are supplied from server-side adapters with source/version metadata. They
include payment gate, human authorization, documents, intake, consent, identity,
jurisdiction, service order context, partner availability, and provider capability.

No raw financial processor state, document contents, provider credential, prompt,
or client-controlled browser claim is accepted as an entitlement condition. Unknown
or stale blocking evidence does not become allow. The policy can only route that
state to deny, action-required, manual review, or not-applicable; it cannot infer a
positive result.

## M044 and human authorization sequence

```text
M044 verified payment gate
        +
separate human authorization
        +
other current policy conditions
        -> M045 decision snapshot
        -> future authorized consumer only
```

Payment alone is insufficient. Human approval alone is insufficient when payment is
required. Refund/dispute/cancellation context is a blocking condition until a policy
and authorized review resolve it.

## Data and security model

- PostgreSQL is the planned durable authority; Drizzle remains the schema/migration
  authority.
- Every M045 table has RLS. The authored migration installs `USING (false)` and
  `WITH CHECK (false)` policies by default.
- Tenant, subject, resource, policy version, decision snapshot, idempotency key,
  correlation ID, and audit hashes are retained. Sensitive document data, payment
  payloads, provider tokens, and full profile content are not stored in decision
  snapshots.
- Usage counters require an atomic durable operation before runtime activation.
- Cache entries contain only identifiers/version references and are invalidated on
  payment, consent, document, authorization, grant, deny, profile, policy, or
  ownership changes.

## Provider-disabled posture

The `DisabledEntitlementRuntimeAdapter` is the only runtime-facing adapter supplied
by M045. It blocks payment-gate acceptance, grant materialization, workflow
authorization, and partner actions. There is no provider implementation, no webhook,
and no background dispatcher in this module.

## Future activation prerequisites

- [NEEDS PRODUCT OWNER DECISION: approved durable PostgreSQL repository design and
  migration application window.]
- [NEEDS PRODUCT OWNER DECISION: authoritative adapters for M044, approval,
  documents, intake, consent, identity, and jurisdiction conditions.]
- [NEEDS PRODUCT OWNER DECISION: staff roles, separation-of-duties, and four-eyes
  controls for temporary grants, denies, overrides, and revocations.]
- [NEEDS PRODUCT OWNER DECISION: retention, client-readable explanation policy,
  audit review owner, and incident escalation policy.]
- [NEEDS PRODUCT OWNER DECISION: M068 handoff contract, idempotency, rollback, and
  gradual activation plan.]
