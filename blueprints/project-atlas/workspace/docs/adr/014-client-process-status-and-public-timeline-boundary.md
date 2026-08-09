# ADR 014 — Client process status and public timeline boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; no Build authority
- Date: 2026-08-09
- Extends: ADR 004 and proposed ADRs 011–013; does not supersede them
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M010 must explain one client's service process using state owned by ServiceOrder, Billing,
CaseFile/workflow and supporting modules. A naive timeline can become a second mutable case truth,
leak raw audit/internal events, show stale provider state, rewrite history when copy/workflows
change, or infer that a missing source means no blocker.

The process view also crosses a revocable resource graph. A client who was authorized when an
aggregation started must not receive a completed body, count, cursor or route if the session, grant,
resource parent, visibility, classification or accepted-definition binding changes before the
response is serialized.

## Decision proposed

### 1. M010 is a request-scoped projection, never process authority

One `ClientProcessQueryService` inside the modular monolith composes the landing/detail views. The
top-level landing server-side consumes only M009's nonrecursive `AuthorizedServiceChoicePort`,
which returns authorized root references/labels/epochs and cannot call the full
`ClientServicesQueryService.list|getDetail`, M010 or child status/summary/timeline aggregators. It
receives an immutable server-derived `ProcessEligibilityPolicySnapshot`; authorization and its
closed accepted service-definition/workflow criteria are applied before ordering/pagination. It
handles zero, one or many choices without a parallel directory, browser filtering or inferred
last/default service. The port is cursor-paginated under the M009/MYSVC-004 limit policy, exposes
only `hasMore` and opaque context/snapshot/eligibility-policy-bound continuation (no total), and
keeps all authorized eligible choices reachable. Two same-service/same-context choices require
unique Product Owner-approved bilingual safe instance labels; absent/duplicate disambiguators suppress ambiguous controls and
fall closed to My Services/support without exposing internal/opaque identifiers. Detail selection
always reauthorizes the opaque service/context/case reference and resolves the same eligibility
policy against the accepted service/workflow binding before any process/timeline read or metadata.
Ineligible/missing policy fails through a normalized hidden/unavailable response, and the final
fence revalidates policy/accepted-version binding. The
service stores no independent current status and performs no business transition. The authority
matrix remains:

| Fact | Authority |
|---|---|
| Accepted commercial relationship and order lifecycle | `ServiceOrder` |
| Human activation | `ServiceOrder`; linked `Approval` is evidence/audit |
| Payment/refund/dispute | Billing/Postgres projection; Stripe is external transaction authority |
| Fulfillment/milestones/next step | `CaseFile` and accepted workflow version |

The query reads typed, field-allowlisted projections only. M010 cannot collapse those axes into one
mutable database fact or equate payment with approval or fulfillment.

### 2. Explicit grant and a complete final fence govern every response

M007 identity/session/membership is necessary but insufficient. M010 requires an explicit active
grant to the `ServiceOrder` or governing `CaseFile` under ADR 004/013. Email, client/CRM
relationship, participant, payment, entitlement or route reference grants nothing.

The server freezes one `AuthorizationSnapshot`: account, session family, membership, active
context, service/case/child grants, entitlements, assurance, security-policy version and trusted
time. Every serialized root/child supplies an authorization epoch covering parent/context linkage,
visibility/internal state, inheritance block/explicit denial, classification/assurance,
tombstone/deletion and accepted-definition/workflow binding.

Every Postgres fact capable of changing public status, milestone, process-local next action or
blocker—including Case, Task, Document and Billing inputs—uses one read-only MVCC request snapshot
with the transaction-local restricted session-derived RLS actor. Parallel critical-port reads are
allowed only when the same snapshot is provable; otherwise the affected result is `unconfirmed`.
Only registered noncritical summaries that cannot affect those outcomes may use separate `asOf`
envelopes. Immediately before serialization, all snapshot and resource epochs are revalidated. A mismatch
discards the complete response before body, counts, cursors, timing distinctions or route metadata.
No user-facing query uses `service_role`, owner or `BYPASSRLS`.

### 3. Public status mapping is deterministic, closed and version-bound

A pure `ClientProcessStatusPolicy` maps the four canonical input axes plus accepted workflow version
to a Product Owner-approved public code/copy key. It is versioned, testable and cannot mutate state.
Unknown codes, impossible combinations, missing critical facts or incomplete registry inputs yield
`unconfirmed`; internal codes never reach the client.

Milestones use the workflow version accepted for the service. Current catalog/workflow edits cannot
rewrite an existing client's milestone sequence, obligation or history. Release 1A uses named real
milestones; no count-derived or AI-generated percentage.

An LLM may later explain an already-authorized structured result, but cannot select state,
milestone, next action, blocker, estimate or route.

### 4. A closed source registry controls completeness and priority

Every source capable of changing current status, the process-local next action or a public blocker
is registered in a versioned `ProcessSourceRegistry`. Each entry declares its owner, typed port,
criticality, possible priority bands, freshness budget and trustworthy-empty requirement.

The process-local next action reuses the M008/ADR 012 priority semantics; M010 cannot create a
conflicting priority policy. If an unavailable/stale/missing/unknown source could change or outrank
the candidate result, the affected state/action is `unconfirmed`. `unavailable` never becomes zero,
complete, paid, current or no action.

### 5. The client timeline is a governed derivative of real source events

Raw `AuditEvent`, internal activity logs and provider webhooks are never client timeline entries. A
`PublicProcessEvent` is produced only when a real source event type/version appears in a closed
public allowlist and the event's resource is currently eligible for client projection.

Every public event retains server-side provenance:

- immutable `sourceEventId`, owner and source version;
- verified `SourceEventKey` composed of producer namespace, aggregate type, aggregate ID and source
  event ID;
- accepted service/workflow version;
- public mapping-policy version and stable public code/copy key;
- occurrence/recorded/effective times;
- public actor category and minimized resource scope;
- visibility/classification and authorization epoch;
- target process aggregate binding (ServiceOrder, governing CaseFile, context and accepted workflow
  version), correction/supersession/retraction relationship and expected chain version.

Release 1A derives this public event projection in request scope from a bounded, stable authorized
cut of durable owner-domain events/state through `PublicProcessEventPort`. It creates no M010
projection table, writer, materialization/reconciliation/rebuild job or Inngest function. Mapping,
deduplication, correction-chain validation, ordering and pagination are deterministic query
behavior; failures return `unconfirmed` and minimized operational evidence rather than persisting a
partial client read model.

If a future separately approved ADR and Build gate authorize projection rows,
`(targetProcessAggregateKey, SourceEventKey, mappingPolicyVersion)` is the idempotency identity.
An exact duplicate is a no-op; reuse of a source ID by another producer/aggregate remains distinct.
A same-key/different-content collision is quarantined and never resolved by overwrite/upsert.

Corrections append and link; they do not rewrite the immutable source event. A correction,
supersession or retraction must target an existing event inside the same producer aggregate,
ServiceOrder, governing CaseFile, active context and accepted workflow binding, follow an approved
transition and pass expected-chain-version/CAS validation. Self-links, cross-scope links, missing
targets, stale versions and cyclic chains fail closed without disclosing whether an unauthorized
target exists. Duplicate and out-of-order delivery is reconciled deterministically from Postgres
source state. Inngest may coordinate retries/rebuilds but is never the source of business or public-
event truth.

That future ADR must define schema/writer ownership, migration/backfill, collision quarantine,
retention/deletion, authorization invalidation, retries/timeouts, manual recovery, rollback and
deterministic rebuild. The conditional identity above does not authorize any Release 1A writer/job.

Timeline pagination uses an opaque authenticated cursor (or server-held reference) bound to the
target process/context, a stable timeline snapshot watermark, process-eligibility/mapping-policy
versions, last sort
tuple and expiry. Every page reauthorizes and final-fences all returned event epochs. A tampered,
expired, cross-scope or incompatible cursor produces one generic restart outcome without revealing
whether another process/event exists; it never authorizes access. A correction after the bound
watermark becomes visible on a refreshed/restarted timeline instead of creating mixed pages.

### 6. Personalized output is private/no-store and provider-free

Release 1A process HTML/RSC/data responses are dynamic, private and `no-store`. They do not enter
ISR/CDN/shared cache, service-worker/offline cache, localStorage or sessionStorage. Only static
hashed shell assets and versioned non-personal public dictionaries may use normal shared caching.

Normal render reads current Postgres operational projections. The browser does not call Stripe,
Google Calendar, Storage, Sanity, a partner or AI. No provider credential/payload, signed URL,
document content/name, payment instrument, internal status or protected free text reaches client
DTOs, logs, traces, Sentry, PostHog or AI context.

### 7. Staleness and estimates are explicit and fail closed

Every section has `sourceVersion`, `asOf`, classification and `fresh|empty|stale|unavailable`.
Authorization denial is omitted rather than serialized as a section outcome.

A last-confirmed noncritical fact may display stale only under an approved source-specific policy,
with visible `asOf` and risky actions disabled. It is never shown when current authorization cannot
be revalidated. Payment/authorization/critical state never silently uses stale truth.

An estimate requires an approved source/category, jurisdiction/provider context where relevant,
range/unit, calculated/expiry time and bilingual no-guarantee disclaimer. Expired, unsupported or
AI-invented estimates are omitted or explicitly unconfirmed.

### 8. M010 owns no command

Every client action uses a canonical allowlisted route key to the owning module. The destination
reauthorizes, validates, applies concurrency/idempotency rules and audits its command. The route key,
opaque reference and timeline cursor are not capability tokens.

M010 cannot complete tasks, upload/download documents/deliverables, send messages, book/reschedule/
cancel, pay/refund, sign, change a case, mark a milestone or publish a provider state. Command
owners are M023, M011, M012, M013, M014 and M067 respectively.

## Rationale

- Canonical owners prevent a second contradictory process database.
- Explicit grants plus per-resource final fencing protect against BOLA and mid-response revocation.
- Closed versioned mappings make public language testable and preserve accepted history.
- A source registry prevents partial failure from looking like completion or no action.
- A governed public event projection provides useful history without exposing raw audit/internal
  activity.
- No-store and provider-free rendering reduce cross-client leakage and outage coupling.
- Owning-route handoffs preserve module boundaries and authorization.

## Consequences

### Positive

- Every displayed state, milestone and timeline event is traceable to an owning fact/version.
- Service verticals reuse one secure client process contract.
- Unknown mappings and outages fail closed instead of inventing certainty.
- Corrections retain history and evidence.
- Release 1A can stay narrow while Release 1B adds richer timelines and estimates compatibly.

### Costs and constraints

- Owning domains must emit typed client projections and durable versioned events.
- Every active source, mapping and freshness budget needs governance and tests.
- A final fence may discard expensive assembled results when authorization changes.
- Any future separately approved public timeline materialization/rebuild needs idempotency and
  correction semantics.
- Product Owner approval is required for status/event/milestone/blocker/estimate copy and policy.

## Alternatives rejected

### Store an editable portal process status

Rejected because it duplicates ServiceOrder/Billing/Case/workflow authority and drifts from real
operations.

### Render raw audit events as a timeline

Rejected because audit records contain internal actors, reasons, identifiers and technical detail;
audit semantics are not client communication policy.

### Infer progress from completed-task or milestone counts

Rejected because workflows may be nonlinear, conditional, repeated or skipped and the result
misrepresents duration/outcomes.

### Let an LLM summarize raw case state into the status

Rejected because state/action/blocker selection affects obligations, privacy and business
commitments and must be deterministic and auditable.

### Query every provider on page load

Rejected because provider latency/outage would control portal availability and expose credentials,
inconsistent state and uncontrolled side effects.

### Show last-known data whenever a source fails

Rejected because authorization, payment or visibility may have changed; stale display is allowed
only through explicit noncritical source policy after current authorization is proven.

### Use service/client relationship as access

Rejected because association is not delegated resource access and creates cross-context BOLA risk.

## Security conditions before acceptance

1. Threat-model BOLA/IDOR, cross-context enumeration, grant/visibility/classification changes during
   assembly, timeline poisoning, event spoofing, correction abuse, cache leakage and telemetry.
2. Prove explicit root grant and client-visible child inheritance in domain and RLS tests; deny/
   inheritance block and Highly Sensitive assurance win.
3. Test the top-level landing for zero/one/many choices, multiple contexts, hidden/revoked services,
   opaque selection and browser back-forward. Prove the M009 nonrecursive root-selection port and
   final fencing prevent hidden names/counts/timing/default restoration. Add a dependency-DAG/spy
   test that fails if landing base selection invokes full M009 list/detail, M010 or any child
   status/summary/timeline aggregator. Test M009 page limit N−1/N/N+1 and multiple pages, all
   authorized eligible choices reachable, no total/silent truncation and generic restart for a
   tampered, expired, revoked, cross-context or eligibility-policy-mismatched landing cursor. Mix
   eligible/ineligible accepted service/workflow versions across boundaries and prove filtering
   occurs before order/pagination with no ineligible label/count/timing leak.
4. Test two or more same-service/same-context choices with unique, missing and duplicate approved
   disambiguators in English/Spanish, 320px, keyboard and screen-reader modes. Missing/duplicate
   labels fail closed without internal/opaque identifiers or a wrong-process action.
5. Test direct detail URLs for eligible/ineligible accepted service/workflow versions, missing/
   changed eligibility policy and accepted-version changes during assembly. Prove landing/detail
   parity, pre-read enforcement and final fencing without label/count/cursor/timing leakage.
6. Prove every registered Postgres source capable of changing status, milestone, action or
   blocker—including ServiceOrder, Case, Task, Document and Billing—uses one MVCC request snapshot
   and transaction-local restricted RLS actor.
   Concurrent-write/parallel-port tests must return no definitive result if a common cut cannot be
   proven; separate `asOf` envelopes are limited to registered noncritical summaries.
7. Adversarially delay ports and change account, session, membership, context, grants,
   entitlements, assurance, policy, parent linkage, visibility, classification,
   accepted-definition/workflow binding or tombstone; prove no body/count/cursor/route survives.
8. Test the complete approved four-axis status matrix plus unknown/impossible combinations and
   prove payment, approval and fulfillment cannot substitute for one another.
9. Test every `ProcessSourceRegistry` entry, missing/unknown registration, freshness budget and
   source capable of tying/outranking the candidate action.
10. Verify source-event authenticity/schema/ownership and the producer/aggregate-scoped
   `SourceEventKey`; prove exact duplicates are no-ops, reused IDs stay distinct and Release 1A
   rejects same-key/different-content collisions to `unconfirmed` plus a minimized owning issue,
   without overwrite or a quarantine store. Test out-of-order interpretation and deterministic
   request-scoped recomputation from durable Postgres truth. Quarantine/rebuild persistence belongs
   only to the future separately approved materialization profile.
11. Prove the Release 1A profile has no M010 projection schema, writer, materialization/
   reconciliation/rebuild job or Inngest function and derives timeline pages request-scoped from a
   stable authorized owner cut. Fail the gate if one appears without a separate approved ADR/Build.
12. Reject correction/retraction targets outside the same producer aggregate, ServiceOrder,
   governing CaseFile, context and accepted workflow; reject self-links, cycles, missing targets and
   stale expected versions without revealing target existence.
13. Prove accepted workflow/milestone history cannot be rewritten by current catalog/policy edits.
14. Prove private/no-store behavior, sign-out/context cleanup, no browser provider fan-out and no
   protected data in logs/traces/Sentry/PostHog/AI.
15. Bound ports, lists, cursors, retries and timeouts; test partial failure and denial-of-service
    behavior without hidden-resource inference. Test cursor tampering, expiry, cross-process/
    context replay, policy-version mismatch, authorization revocation and deterministic pagination.
16. Prove every Task/Document/Message/Appointment/Billing/Signature handoff targets only M023/M011/
    M012/M013/M014/M067 and that M010 cannot call their command ports.
17. Complete English/Spanish semantic, accessibility and estimate/no-guarantee review.
18. Complete independent architecture and Cyber Neo review with no open material finding.

## Approval and supersession

This ADR is a candidate only. Product Owner approval would accept the architecture; it would not
approve any open business policy or authorize `GENERATE`, routes, schemas/RLS policies, public event
materialization, provider traffic, real client data, merge, deployment or production use. A
contradictory future decision must supersede this ADR and preserve its rationale.
