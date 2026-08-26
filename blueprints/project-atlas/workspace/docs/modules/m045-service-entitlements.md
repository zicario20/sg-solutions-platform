# M045 - Service Entitlements

## Status

- Technical controlled foundation: implemented.
- Runtime activation: disabled.
- Product Owner acceptance: pending.
- Production deployment, database migration application, provider ingress, and workflow handoff: not authorized.

## Purpose

M045 is the business-entitlement authority for SG Solutions. It evaluates whether a
specific subject may perform a scoped business action on a specific resource under a
versioned policy. It is not IAM, RBAC, a payment processor, a provider integration,
or an operational workflow engine.

The module answers a narrow question:

> May this subject perform this scoped service action now, and what safe next step is
> required if the answer is not allow?

## Implemented controlled foundation

- `@atlas/service-entitlements` supplies typed definitions, profiles, policies,
  conditions, grants, explicit denies, decisions, client-safe views, lifecycle
  helpers, audit hashing, and operational findings.
- The deterministic evaluation engine defaults to deny and records an immutable
  decision snapshot with a SHA-256 content hash.
- Decision precedence is explicit: tenant/ownership failure, hard security state,
  explicit deny, revoked/expired/suspended grant, blocking condition, scoped grant,
  derived policy decision, then default deny.
- Unknown or stale blocking evidence fails closed unless a policy explicitly directs
  a safe manual-review or action-required path.
- Temporary grants require a UTC expiry. Usage consumption is idempotent in the
  foundation repository and has a storage contract for future transactional counters.
- `ClientEntitlementView` removes policy internals, deny rationale, provider state,
  payment evidence, and audit identifiers from client surfaces.
- M042 service versions can optionally carry
  `entitlementProfileReference` plus `entitlementProfileVersion`. The pair is
  validated together and copied into a service-order catalog snapshot when present.
- A Drizzle schema and an unapplied migration define the M045 persistence authority,
  RLS, append-only audit evidence, outbox, operational findings, and usage counters.

## Boundaries

### M042 Service Catalog

M042 owns service definitions and versioned commercial configuration. M045 owns the
meaning of a service capability and its entitlement policy. The catalog binding is a
reference only; a catalog publish, order creation, or price change cannot grant an
entitlement.

### M044 Payment Verification

M044 remains the source of verified payment gate facts. M045 consumes only a
normalized `paymentGate` condition supplied by a server-side condition adapter. It
does not read raw processor events, does not infer payment from a browser value, and
does not turn a paid condition into an automatic grant.

### Human authorization and M068 workflows

Human authorization is an independent condition. A satisfied payment gate with a
missing human authorization returns `action_required` and `wait_for_review`.
Every workflow handoff remains blocked with `activation_not_authorized`; M045 neither
starts nor mutates M068 operational workflows.

### IAM, providers, and AI

M045 does not replace M080 authentication, M081 roles/permissions, RLS, or resource
authorization. It cannot call payment providers, partner providers, workflow engines,
or AI tools. AI actors are explicitly rejected from grant, deny, approval, revocation,
and usage-consumption authority.

## Runtime controls

All environment controls are false by default and must remain false until a separately
approved activation plan, durable repository, migration evidence, independent security
review, rollback plan, and Product Owner approval exist.

```text
M045_SERVICE_ENTITLEMENTS_ENABLED=false
M045_AUTOMATIC_GRANT_MATERIALIZATION_ENABLED=false
M045_M044_PAYMENT_GATE_INGRESS_ENABLED=false
M045_WORKFLOW_HANDOFF_ENABLED=false
M045_PROVIDER_PARTNER_ACTIONS_ENABLED=false
M045_AI_ENTITLEMENT_DECISIONS_ENABLED=false
```

## Persistence contract

The M045 schema defines definitions, capabilities, profiles, policies, grants, denies,
decisions, usage counters, usage events, audit events, outbox events, and operational
findings. All tables have RLS. The authored migration installs restrictive deny-all
policies and must not be applied as part of this module completion.

The in-memory repository is a deterministic foundation and test double, not an
approved durable production repository. A future PostgreSQL repository must preserve
idempotency, optimistic concurrency or row locking for quota consumption, append-only
audit behavior, retention, and tenant/resource enforcement.

## Tests

Focused M045 tests cover:

- fully satisfied scoped access;
- payment confirmation without human authorization;
- cross-client resource denial;
- explicit deny precedence over a temporary grant;
- unknown payment evidence failing closed;
- idempotent quota consumption and temporary-grant expiry;
- cache invalidation;
- AI and runtime-handoff blocking; and
- schema/migration RLS and non-provider contract checks.

## Deliberately not implemented

- migration application or database access;
- automatic grant materialization;
- M044 runtime ingestion;
- M068 workflow execution;
- provider, partner, payment, or Stripe calls;
- UI mutation routes, admin grant tooling, or client-side authorization decisions;
- AI entitlement decisions; and
- Product Owner acceptance or production activation.
