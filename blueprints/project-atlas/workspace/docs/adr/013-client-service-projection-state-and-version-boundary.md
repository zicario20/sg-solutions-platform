# ADR 013 — Client service projection, state and version boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted for the isolated provider-disabled M009 Build
- Date: 2026-08-21
- Extends: ADR 004, accepted ADR 011 and accepted ADR 012
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M009 must list real contracted services and assemble a detail view from commercial, operational and
supporting domains. A naïve portal can easily become a second service-order database, infer access
from a client relationship, rewrite accepted service terms when the catalog changes, or collapse
payment, human approval and fulfillment into one misleading status.

The client also needs summaries of tasks, documents, payments, appointments, messages, timeline and
deliverables. Browser fan-out or raw entity serialization would duplicate authorization and expose
internal/provider state. M009 therefore needs a precise read boundary while leaving every command
and source of truth with its owning module.

## Decision

### 1. `ServiceOrder` is the commercial root; `CaseFile` is the operational root

Every M009 card/detail is backed by a persisted `ServiceOrder`. A merely interested lead, form,
conversation, public page view or partner recommendation cannot appear as a contracted service.

`ServiceOrder` owns the accepted commercial relationship and references immutable versions or
snapshots of the approved service definition, scope, workflow/milestone definition and price terms.
`CaseFile` owns active operational fulfillment when work begins. M009 creates neither a
`PortalService` entity nor a second mutable status record.

M009 presents typed projections only. M021/M022 and service verticals remain command/state owners.

### 2. Visibility requires an explicit resource grant

An active M007 identity, application session and membership are necessary but insufficient. A
directory/detail query includes a service only when the actor has an active explicit grant to the
`ServiceOrder` or its approved governing `CaseFile` under ADR 004.

A `Client`, `Person`, `ServiceParticipant`, email, phone, payment, CRM relationship, entitlement or
route reference does not itself grant visibility. A case grant may inherit to client-visible child
resources; internal children never inherit, a child inheritance block/explicit denial wins and
Highly Sensitive documents may require another explicit grant/assurance.

M045 entitlements may narrow a capability inside an already visible service but do not establish
resource access or human approval.

### 3. One request-scoped service projection boundary

`ClientServicesQueryService` inside the modular monolith provides directory and detail queries. It
derives the actor/context from M007, freezes the complete account/session/membership/context/
service-case-resource-grant/entitlement/assurance/policy authorization snapshot and uses a trusted
server clock. The snapshot also carries an authorization epoch/version for every serialized root
and child. That resource epoch covers its ServiceOrder/Case/context parent linkage,
client-visible/internal state, inheritance block or explicit denial, data classification and
assurance requirement, tombstone/deletion state and accepted-definition binding.

Core `ServiceOrder`/`CaseFile`/public-milestone facts for a detail use one read-only consistent
Postgres cut with the session-derived restricted RLS actor context. Typed owning-domain ports return
bounded child summaries bound to that same authorization snapshot and a closed
`fresh|empty|stale|unavailable` envelope. Raw rows, provider payloads and arbitrary URLs are not
valid inputs.

Immediately before serialization the service revalidates every authorization fence and every
serialized resource epoch. A changed, expired or revoked account, session, membership, context,
grant set, entitlement set, assurance, policy, parent linkage, visibility/inheritance decision,
classification requirement, tombstone or accepted-definition binding discards the entire
directory/detail response before body, counts, cursors or route metadata are emitted. An equivalent
single consistent transactional/CAS fence is acceptable only when it proves the same properties.
User-facing reads never use `service_role`, owner or `BYPASSRLS`.

Unauthorized service orders are removed before counts, filters, cursor generation and empty-state
decisions. Their existence cannot be inferred from error text, result totals or timing.

### 4. Commercial, financial, human activation and fulfillment are separate subfacts

M009 does not store one overloaded service status. The canonical ownership matrix is:

| Subfact | Authority | M009 treatment |
|---|---|---|
| Accepted commercial relationship, terms binding and order lifecycle | `ServiceOrder` | Read-only commercial projection. |
| Human review/approval-to-start outcome | `ServiceOrder`; linked `Approval` is evidence/audit, not a second status | Read-only activation projection. |
| Obligation, payment, payment cancellation, refund and dispute | Billing/Postgres reconciled projection; Stripe remains external transaction authority | Read-only financial projection with distinct subfacts. |
| Fulfillment, milestones and next action | `CaseFile` and its approved workflow | Read-only operational projection; a preliminary order may have no case. |

A versioned `ClientServiceStatusPolicy` synthesizes an approved client presentation code from those
four structured subfacts. It is pure, deterministic and auditable; it cannot mutate the inputs.
`paid`, `approved_to_start` and `in_progress` are never synonyms. `order_cancelled`,
`payment_cancelled` and `case_cancelled` are owner-qualified facts; refund and dispute remain
independent and no axis overwrites another.

An LLM may explain an already synthesized safe status but cannot choose inputs, resolve conflicts,
change policy or select an action.

### 5. Service terms and milestones are version-bound

The service order preserves the definition/scope/workflow/milestone/pricing version accepted for
that relationship. Later public-catalog edits cannot silently rewrite included work, obligations,
milestone sequence, contractual copy or price history.

M009 may use current approved general Help Center content when clearly noncontractual, but the
service's agreed scope and progress refer to its accepted versions. A missing accepted definition
version is a configuration incident; substituting the current catalog record is prohibited.

Progress uses only approved, applicable, client-visible real milestones. Nonlinear or unapproved
workflows use named status and next step, never an arbitrary percentage or forecast.

### 6. Detail sections remain projections of owning modules

Tasks, documents, payments, appointments, messages, process timeline, agreements and deliverables
remain owned by M010–M014/M021–M026/M043–M045/M067. M009 receives field-allowlisted bounded
summaries and canonical internal route keys. The owning route reauthorizes every action/download;
an opaque reference or route key is not a capability token.

If a child source is unavailable, M009 says it cannot confirm that region rather than showing zero.
If the missing source could affect the next action, ADR 012's closed source registry makes
the action `unconfirmed`. M009 never makes a critical absence look paid, complete, accepted or
action-free.

### 7. Personalized responses are non-shared and provider-free

Release 1A M009 HTML/RSC/data responses are dynamic, private and `no-store`. They are excluded from
ISR, CDN/shared caches, service-worker/offline caches, localStorage and sessionStorage. Static
hashed portal-shell assets keep ordinary immutable caching.

Normal render reads Postgres projections and never calls Stripe, Google Calendar, Storage, Sanity,
partners or AI from the browser. No provider credential, signed URL, raw financial object, storage
key, internal status or protected content enters M009 DTOs, logs, traces, Sentry, PostHog or AI
context.

Release 1A persists no monolithic serialized service-detail projection. A future materialized read
model requires a separate ADR defining classification, source/authorization versions, rebuild,
invalidations, TTL, deletion and revocation behavior.

### 8. M009 has no mutation authority

Search/filter/context selection only changes the requested view. Every business action navigates to
an owning-module command that performs fresh authorization, validation, optimistic concurrency,
idempotency and audit as applicable.

M009 cannot mark payment, approve/start/cancel/refund/renew a service, complete a task, upload a
document, change an appointment, send a message, sign an agreement or download a deliverable.

## Rationale

- One service projection boundary keeps the browser simple and prevents duplicated authorization.
- Explicit service/case grants preserve client isolation when one person has many contexts or
  participants.
- Canonically owned state dimensions prevent duplicate truth and the dangerous paid-equals-started
  shortcut.
- Version-bound definitions preserve what the client actually accepted.
- Typed bounded child projections keep M009 from absorbing M010–M014.
- Consistent core reads, closed failure envelopes and final fencing avoid mixed/revoked state.
- No-store and provider-free rendering reduce leakage and outage coupling.

## Consequences

### Positive

- Every visible service has traceable commercial and operational authority.
- Status combinations can be tested as a deterministic policy matrix.
- New service verticals reuse the same portal shell and shared primitives.
- Existing service terms remain historically stable while catalog content evolves.
- Release 1A remains narrow but evolves compatibly into richer Release 1B workflows.

### Costs and constraints

- Owning modules must expose deliberate client projection ports and source/freshness versions.
- Every service needs explicit grant and accepted-definition/workflow version behavior.
- The Product Owner must approve public status mappings and milestone/copy policy.
- Directory pagination/filter counts must run after authorization, which requires careful query and
  RLS design.
- A missing critical projection may reduce convenience by returning `unconfirmed`, but it preserves
  truth and security.

## Alternatives rejected

### Use public catalog records as the client's service list

Rejected because interest and offerings are not contracts and catalog edits would rewrite history.

### Grant access through `clientId`, email or participant membership

Rejected because those relationships do not prove delegated access to every service/case/resource
and create BOLA/IDOR and shared-context exposure.

### Store one portal-owned or ServiceOrder-owned aggregate status

Rejected because it duplicates and can contradict billing, approval and case/workflow authority.

### Treat payment success as activation

Rejected because Stripe financial authority cannot replace human service authorization.

### Browser queries each domain/provider

Rejected because it duplicates access checks, exposes partial inconsistent state and couples the
portal to provider credentials/outages.

### Always show a percent complete

Rejected because many services are nonlinear and a count-derived percentage misrepresents progress
and outcomes.

### Copy current service definition into every portal response

Rejected because current catalog scope can differ from the accepted historical relationship.

## Security conditions before acceptance

1. Threat-model BOLA/IDOR, participant/email/payment privilege confusion, cross-context filtering,
   hidden totals/cursors, revocation during assembly, status manipulation and cache/telemetry leaks.
2. Prove explicit service/case grants in domain, RLS and child-resource inheritance tests.
3. Prove list/detail ports share one complete authorization snapshot and core consistent read cut.
4. Test final fencing for account, session, membership, context, grants, entitlements, assurance,
   policy and every serialized resource authorization epoch. Adversarial delayed-port cases cover
   visible-to-internal changes, inheritance block/deny, cross-context reparenting, sensitivity
   upgrades, accepted-version/link changes, tombstone/delete and root reassignment; no body, count,
   cursor, timing or route metadata survives a failed fence.
5. Test the commercial/financial/activation/fulfillment Cartesian matrix and prove no unsafe
   synthesis, owner substitution or axis overwrite.
6. Prove accepted service-definition/workflow versions cannot be replaced by current catalog edits.
7. Test hidden-service exclusion from totals, filters, cursors, latency and empty states.
8. Test every child source outcome and ADR 012 `unconfirmed` behavior.
9. Prove private/no-store responses, sign-out/context-switch cleanup and no browser/provider secret
   or protected telemetry.
10. Complete independent architecture/accessibility and Cyber Neo review with no open material
    finding.

## Approval and supersession

Decision 040 accepts this ADR and authorizes only the isolated M009 provider-disabled Build from
accepted M008 commit `09c9403`. It permits local contracts, unseeded schema/migration definitions,
disabled Postgres adapters, synthetic tests, fail-closed Next.js composition and accessible ES/EN
UI. It does not authorize real service definitions or records, live PostgreSQL/RLS, provider calls,
credentials, business commands, merge, deployment, release or production use. A contradictory
future decision must supersede this ADR and preserve its rationale.

## Review clarification - 2026-08-21

The implementation boundary is clarified without changing scope: M009 does not own a second
aggregate. `ServiceOrder` plus its accepted definition and financial/activation/fulfillment owners
are authoritative; the M009 table is a rebuildable lookup/version read model only. A response is
serializable only after one final fence validates owner linkage, grant expiration and epochs,
accepted-definition epoch and every returned child resource. Missing critical owner evidence cannot
produce a terminal status or a confirmed next action. Public DTO v2 carries only localized labels,
authorized context and accepted-version milestones, and opaque references are `csr1_` values backed
by 192 bits of cryptographic randomness. These clarifications do not activate providers, live RLS,
real data, product analytics, merge or deployment.
