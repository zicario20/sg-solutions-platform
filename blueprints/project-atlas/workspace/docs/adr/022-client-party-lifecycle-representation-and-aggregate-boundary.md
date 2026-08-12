# ADR 022 — Client party, lifecycle, representation and aggregate boundary

- Status: Proposed; Product Owner decision required before Build
- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Date: 2026-08-12
- Scope: M018 and boundaries with M007, M011–M017, M019–M026, M074 and M077–M098
- Supersedes: none
- Related: ADR 004, ADR 005, ADR 011, ADR 015–ADR 021 and M018 PRD

## Context

The supplied M018 source requires a central client record, individual/business/household/represented
contexts, onboarding, assignments, representatives, restrictions, lifecycle, notes and a 360 view of
services, cases, tasks, documents, payments, appointments, communications, consent, profile and
security. Project Atlas already assigns those downstream facts to specialized modules. A literal
“client table contains everything” implementation would duplicate sources of truth, make partial
failures indistinguishable from zero and create an authorization bypass around owner modules.

The boundary also has identity risk. M017 needs one stable person/contact root for CRM while M007
owns accounts and M019 owns organizations. Formal Client is neither a User role nor the result of an
Opportunity, payment or account creation. Business and household contexts cannot be simulated by
copying a person's fields, and an organization-only policy is not yet approved.

Representative delegation, suspension, block, offboarding, protected reveal, export and canonical
merge are high-risk cross-owner actions. They require current authorization, explicit scope,
idempotency, revocation and recovery semantics without turning Inngest, cache, UI or AI into
authority.

## Decision proposed

### 1. M018 owns canonical natural-person/household facts and formal Client lifecycle

M018 owns:

- `Person`, approved aliases/tombstones and canonical identity-resolution history;
- `ContactMethod` and separately evidenced verification state, without consent inference;
- `Household` and versioned person-household relationships;
- `ClientRelationship` and lifecycle history;
- `ClientAssignment`, `ClientRepresentative`, `ClientFlag`, `ClientRestriction`;
- client onboarding/offboarding coordination;
- `ClientOperationalNote` and M018 operation receipts.

M007 owns User/account/session/MFA and resource grants. M017 owns CRM/commercial relationship,
Opportunity, Pipeline, assignment inside the CRM purpose binding and CRM-authored activity/notes.
M019 owns Organization and person-organization relationships. M021/M022/M023 own ServiceOrder,
CaseFile and Task. Other domain owners remain unchanged.

One canonical Person may exist without an account, CRM relationship or Client relationship. An
account may link only through M007's explicit verified identity-linking flow. A formal Client
relationship is created/reused only from approved evidence under `CLM-003`; an Opportunity `won`,
account creation, payment or accepted contact method is insufficient alone.

M018 publishes the only canonical `PartyDirectory` application boundary. Authorized M017/M020/M021
callers submit minimized evidence/source refs and receive purpose-limited masked candidates,
Person/ContactMethod projections and opaque versioned receipts. Only M018 resolves, creates/reuses,
corrects/updates protected fields, requests/records contact-verification receipts, ends or supersedes
those aggregates. Expected versions, domain-separated match-key policy, semantic idempotency, final
authorization and recovery apply. No caller writes M018 tables. Contact verification proves only the
exact method/evidence/version—not identity, consent, M007 account link or formal Client status.

M018 also publishes `HouseholdDirectory` for basic canonical Household resolution/create/reuse and
member add/correct/end/supersede plus purpose-limited masked projections. Each command binds exact
Household/Person refs, relationship/effective interval, evidence/purpose/visibility, expected
versions, idempotency, access epochs, final fence and recovery. Every member projection authorizes
independently; membership never grants access/consent and hidden members/counts are absent. Callers
cannot write household tables. Advanced household models stay Future under `CLM-004/022`.

### 2. Model client subject with concrete owner references, not duplicated or implicit parties

`ClientRelationship` records an exact subject kind and concrete owner reference:

- Person — M018 owner;
- Household — M018 owner;
- Organization — M019 owner, after M019 contract and `CLM-004` approval.

The implementation must use checkable concrete references and owner receipts rather than a free-form
polymorphic string or copied identity fields. An individual-with-business relationship composes the
Person and exact M019 relationship reference; “primary business” is presentation metadata, not an
authorization fallback. An organization-only prospect/client cannot be fabricated with a placeholder
Person. Until `CLM-004` and M019 are approved, unsupported subject modes remain disabled.

Within an approved relationship kind/policy, uniqueness and current-pointer constraints prevent a
new ClientRelationship per service/channel. Superseded aliases/tombstones support lookup/history but
confer no permission.

The supplied labels are normalized across independent axes: `individual` maps to Person; `company`
to M019 Organization; `individual + company` to Person plus an exact M019 relationship; `household`
to Household under approved policy; `represented` to representative/grant state; `former` and
`blocked` to lifecycle/restriction; and `partially converted` to upstream handoff/onboarding state.
The latter four cannot be persisted as subject types. Invalid Cartesian combinations fail closed.

`ClientBusinessContext` binds the ClientRelationship/Person to an exact M019
`PersonOrganizationRelationship` ref/version, Organization ref, effective interval,
classification, purpose/visibility receipts and M019 access epoch. M019 owns the relationship and
authorizes a CAS/final-fence receipt. Correction, revocation, supersession, denial or owner outage
suppresses/blocks the context; there is no stale company-label or string-code fallback.

M018 exposes purpose-limited business-context query plus explicit bind/correct/end/supersede
commands. They bind exact M018/M019 expected versions, effective interval, classification,
evidence/purpose/visibility, idempotency and final fences. An M019 correction/revocation/supersession
event is only a content-free invalidation signal; M018 re-reads current M019 authority before a
change. Callers/event consumers cannot direct-write. Unknown/ambiguous/outage fails closed and routes
to reconciliation/manual recovery; additional relationships use the same bind contract.

M018 publishes only content-free typed change events for Person, ContactMethod, Household,
membership and ClientBusinessContext. Payloads contain opaque ref/change code/version/access epoch/
policy-contract version/time—never contact, verification, member/count, relationship label or
business facts. Mutation, M077 audit and outbox are transactional. Consumers invalidate and
reauthorize/re-read M018 ports; events neither authorize nor permit direct writes. Duplicate,
out-of-order and missed delivery is version-fenced/reconciled.

Household/member/spouse/co-applicant evidence grants neither access nor consent. Each person,
service, task, field and action requires an explicit current resource grant plus purpose, consent and
visibility evidence. Hidden members and member counts are suppressed completely, and revocation is
scoped to the affected member/resources.

### 3. Separate relationship, attention, onboarding, access and service axes

M018 stores a formal relationship lifecycle. It separately derives a viewer-safe operational-
attention summary at request time from only owner facts the current actor/purpose may know. Durable
state may keep only content-free dirty/reconciliation markers and opaque owner/version receipts; it
cannot persist a globally reusable payment/compliance/other protected cause. M018 also coordinates separate onboarding/offboarding workflow
states. None may absorb:

- M007 account/portal/session/MFA state;
- M017 Opportunity/CRM engagement state;
- M021 ServiceOrder commercial state;
- M014/M043/M044 external financial state;
- M045 entitlement;
- M074/M021 human authorization to start;
- M022 Case fulfillment state;
- M078 Consent or M026 contactability.

The exact lifecycle normalization is gated by `CLM-005`. Derived attention is deterministic,
versioned, source-explainable to an authorized viewer and disposable. A denied/suppressed source has
no effect on label, sorting, filtering, counts, cursors or timing; an unavailable authorized source
maps to `unknown`. Cache keys bind actor, purpose, sections and access/source epochs. Attention never
authorizes a command. AI may explain it but cannot define or mutate it.
`unknown`, `not_applicable`, `unavailable`, `suppressed` and `denied` remain distinct from zero,
complete or no action.

### 4. Compose Client 360 through a closed section registry and typed owner ports

M018 provides one application facade inside the modular monolith. It derives the full current actor/
session/membership/permission/assignment/grant/purpose/classification/assurance context server-side,
authorizes the relationship and named sections, queries typed owner ports and returns minimized DTOs.

The section registry is closed and versioned. Every section entry identifies owner, contract version,
classification, required permission/purpose, current owner/resource/access epochs, freshness budget
and allowed safe summary fields. Each result is `complete|partial|stale|unavailable|suppressed|
denied|unknown|not_applicable`. Hidden fields/rows/counts never reach the browser. Drill-down uses an
opaque reference and reauthorizes in the owner.

M018 does not persist copies of payments, documents, messages, appointments, cases, services,
profile facts or security events. A disposable minimized projection/cache includes exact source/
policy/access epochs and cannot authorize or mutate. Cache failure falls back to owner reads or an
explicit unavailable state.

### 5. Use explicit interval-based assignment and representation

Internal assignment is an M018 relationship responsibility, separate from M017 Opportunity/
purpose-binding and M023 Task assignment. Each assignment has an exact type, user/team, effective
interval, reason, actor and history. Eligibility, overlap and inactive-assignee rules are `CLM-008`.
Reassignment asks owner modules to re-evaluate linked work; it does not directly rewrite their rows.

A representative relationship has:

- canonical representative Person/contact reference;
- exact client relationship;
- closed services/resources/actions scope;
- effective/expiry interval;
- evidence, terms and identity-verification receipts;
- grant/revocation receipts and current access epoch.

Family, spouse, member, accountant, preparer or attorney labels grant nothing. An invitation is
short-lived, audience/subject/scope/action/nonce bound and single-use. Activation and M007 resource
grant issuance are separate authoritative steps. Revocation/expiry advances access epochs and
invalidates grants, sessions/capabilities and caches immediately while preserving attributed
history. Exact policy remains `CLM-009`.

### 6. Treat flags, restrictions and lifecycle interventions as different controls

`ClientFlag` is an internal review signal and has no direct enforcement authority.
`ClientRestriction` is an approved, exact resource/action/service/channel limitation with effective/
expiry/review interval. Suspension/block/deceased/offboarding are broader reviewed lifecycle actions.
None is represented as a generic boolean or automated score.

Preview/execute for restrictions and high-risk lifecycle actions binds exact subject, expected
versions, scope, reason/evidence, complete affected-owner inventory, current assurance and required
approval/SoD. AI cannot execute. Unknown/unavailable owner impact blocks a false-success result.
Owners apply their own effects and return typed receipts; M018 never directly mutates their state.
`CLM-010` controls exact authority and review policy.

The closed candidate effect registry maps document-download blocks to M011; new-payment blocks to
M014/M043; messaging blocks to M012/M025; partner-sharing blocks to M040/M078; additional
verification to M007/M080; service pause to exact M021/M022/M045 targets; and retained receipt/
history access to separate M007/M014/M045 grants/entitlements. The last is never an implicit
exception to another restriction and cannot preserve an expired service entitlement. Preview binds
every owner/action/version and expected outcome; execute final-fences each owner and records stable
step receipts. Unavailable owners fail closed; partial/ambiguous outcomes reconcile before retry and
surface an audited manual recovery/compensation route. No effect widens to whole-client suspension.

### 7. Keep note families separate

M018 `ClientOperationalNote`, M017 `CrmInternalNote`, M022 `CaseOperationalNote` and M012
conversation-local notes are separate owner-controlled aggregates. They may use opaque typed links
but never copy/mutate each other's content or inherit visibility. Client-visible content always uses
Messaging. Protected note fields use the approved encryption boundary; revision/redaction/retention/
legal hold remain explicit. AI/translation is disabled until `CLM-011/017` approval.

Add/revise/supersede is distinct from destructive redaction. Redaction uses its own request, preview,
approval and execute/reconcile capabilities with exact note/revision/field, reason, expected version,
M085 retention/hold receipts, SoD and final fence. Ordinary author/editor permission never inherits
redaction. Execution preserves immutable tombstone/audit evidence and never hard-deletes; hold,
concurrent change, stale version, unavailable authority or ambiguous effect fails closed/reconciles.

### 8. Use semantic idempotency, final authorization fences and durable recovery

Before the first effect, every activation/reopen, representative activate/revoke, restriction,
suspension/block/deceased action, offboarding close, canonical merge, protected export, temporary
access and destructive retention action reserves a server-derived operation fingerprint in Postgres.
It binds environment/organization, actor/session/auth/assurance/membership, permission/assignment/
grant/access epochs, purpose/classification, exact targets and expected versions, normalized effect,
approved preview/plan/SoD, schema/contract/policy versions and recovery epoch.

A recovery-stable semantic operation identity excludes arbitrary actor key and retry generation but
includes canonical effect, ordered owner roots/versions and approved intent/version. Same semantics
reuse/reconcile the original; changed semantics conflict. Every owner command gets a stable step ID
and must reconcile an ambiguous response before retry. Reservation, local mutation, outbox, M077
audit and workload nonce consumption commit atomically.

After restore, M018 reconciles canonical Postgres owner state, available M077 recovery evidence,
M011 artifact inventory, M007 grant/access epochs and any external-owner receipts before a new effect.
Inngest coordinates only bounded retries/reconciliation; it is not state authority.

### 8.1 Freeze onboarding/offboarding workflows to immutable definitions

M018 owns immutable, versioned onboarding/offboarding definitions and ordered item templates with
`draft|validated|published|superseded` lifecycle, exact service/subject/context/effective
applicability, owner/evidence/dependency requirements and versioned EN/ES content. Publishing requires
separate permission/review and never mutates a published definition. A workflow freezes one exact
published definition version. New versions do not change in-flight or historical items.

Migration is optional and explicit: preview binds old/new versions, exact workflow/items/completed
evidence/owner versions, added/removed blockers and recovery; execution requires approved policy,
SoD and final fences. With no approved migration, the old frozen version remains. Concurrent publish,
stale item completion, owner outage and restore fail closed/reconcile.

### 9. Make canonical merge a reviewed graph operation

M018 owns natural-person/client canonical resolution; M019 owns organization resolution. M017/M020
may surface duplicate evidence but cannot merge canonical parties. Matching uses approved
domain-separated keyed tokens with key ID/version under custody outside Postgres/backups/logs/
telemetry. Name-only, plaintext/unkeyed contact hashes, score-only and AI-only decisions are
prohibited.

Merge preview freezes the complete known graph: Person/contact methods, M007 accounts/sessions/
grants, client relationships, households, M017 CRM/Opportunity refs, M019 relations, service orders,
cases, tasks, documents, billing, appointments, messages, consent, representatives, restrictions,
holds and operation receipts. It identifies winner, conflicts, aliases, downstream owner versions,
unsupported effects and recovery plan. Execute consumes that exact approved unused preview after a
final authorization/version fence. Owner facts are preserved/relinked only by their owner commands;
partial or ambiguous results freeze for reconciliation. No ordinary hard delete occurs.

Exact match inputs, thresholds, authority, key rotation, alias/tombstone and recovery policy remain
`CLM-022`.

### 10. Protect reveal, impersonation and export as distinct capabilities

Protected reveal returns one authorized field transiently with private/no-store semantics and an
opaque value-free M077 receipt. Copy is a separate action/policy. The value is excluded from URLs,
DOM analytics, browser persistence, telemetry, errors and audit and is cleared on expiry/navigation/
epoch change.

Future “view as client” is read-only, bannered, reason-bound, time-limited and blocks payment,
signature, security, export, reveal and all mutations. It never establishes the client's identity or
silently assumes their session.

Export is actor-owned and cannot share a receipt/artifact across users. Request, generation and
download each final-fence current row/field/purpose/assurance/access epochs. Output is redacted,
spreadsheet-formula neutralized and delivered as a private short-lived M011 artifact. Policy remains
`CLM-013`–`CLM-015`.

Ordinary M018 export excludes ClientOperationalNote content, flag/restriction rationale, identity/
security/audit history, internal score/risk/evaluation and AI proposal/prompt/output by default—even
for a viewer who can see them elsewhere. A legal/discovery obligation uses a separate M085/legal
dataset, approval/SoD and delivery authority; it never broadens the ordinary client export.

Temporary exceptional staff access is coordinated by a versioned M018 request/receipt containing
exact client/section/field/action/purpose/reason/TTL/approver/SoD only. M007 remains grant/session
authority and returns grant/invalidation/access-epoch receipts. M018 never edits grants directly;
expiry/revocation invalidates caches/capabilities and reconciles the M007 outcome. Portal-admin and
preference changes likewise launch typed M007/M080 and M026 owner flows rather than local commands.
An M018 request requires exactly one ClientRelationship and rejects wildcard/all-client/global/
break-glass scope. Global/break-glass role/grant/request/review remains exclusively M007/M080-owned;
M018 may consume only the resulting current authorized scope.

### 11. Constrain analytics, observability and AI

M092 receives only approved minimized event/fact projections with no PII/free text/protected IDs and
minimum aggregation/suppression rules. M097 receives content-free operational/security signals.
Neither PostHog, Sentry, session replay, logs nor traces receive client names/contact values, notes,
document/message bodies, tax/credit/financial/identity data, reveal/export data or protected query
text.

AI tools are default-off. Future allowed operations are minimized read summaries and draft/follow-up
task proposals under exact authorization. Suspend, block, merge, identity/contact verification,
representative revocation, consent mutation, full-profile read, export and delete tools are
prohibited. External models require approved processor/model/version/region/DPA/no-training/
retention/allowlist/redaction/evaluation/kill switch. AI output is not durable truth.

## Consequences

### Positive

- One client relationship spans services without duplicate people/accounts.
- M018 can provide a useful 360 experience while owners retain truth and security.
- Relationship, service, payment, portal and case states cannot silently collapse.
- Representative and temporary access have predictable expiry/revocation.
- High-risk client operations are recoverable and independently auditable.
- The modular monolith remains deployable without premature microservices or new infrastructure.

### Trade-offs

- Client detail requires typed owner ports and explicit partial/freshness UX.
- Strong section/field authorization and revocation tests increase implementation work.
- Canonical merge and offboarding cannot be simple row updates.
- Several Release 1A behaviors remain blocked until Product Owner policy and upstream owner PRDs.

### Risks if rejected

- Duplicated party/client facts, cross-client leakage and incorrect lifecycle actions.
- Representatives retaining access after revocation.
- Dashboard/client 360 becoming stale shadow truth.
- Payment/account/Opportunity accidentally authorizing service or client state.
- Unrecoverable merge/export/offboarding effects.

## Alternatives considered

### One wide Client table

Rejected: duplicates domain owners, creates stale sensitive copies and cannot enforce section-
specific authorization safely.

### Treat CRM Contact or Supabase User as Client

Rejected: a prospect/person/account can exist without a formal client relationship, and one concept
cannot safely encode identity, commercial, portal and operational lifecycles.

### Manual grant per displayed summary row

Rejected: impractical and error-prone. Use resource/case inheritance only where ADR 004 allows it,
plus section/field/purpose enforcement; representatives/high-sensitivity still need explicit grants.

### Microservice or separate client database

Rejected: no independent scale/runtime/security/deployment need has been demonstrated. The modular
monolith with schema/module/RLS boundaries is sufficient.

### Let the AI maintain summaries/lifecycle

Rejected: non-deterministic output cannot be business-state authority and introduces privacy/tool-
escalation risk.

## Validation obligations before acceptance/Build

- Product Owner resolves every affected `CLM-001`–`CLM-023` decision.
- M019 confirms organization-subject references before that mode is enabled.
- M007 proves account/grant/representative revocation and access-epoch behavior.
- M017 proves handoff/canonical-resolution boundaries without auto activation.
- M017/M020/M021 prove they call M018 published PartyDirectory/HouseholdDirectory/handoff ports and
  never write canonical party/contact/household tables or infer identity/consent/account/client
  status from contact verification/membership.
- Closed 360 registry proves row/field/section authorization and partial-failure semantics.
- Cartesian tests prove relationship/attention/onboarding/portal/service/case/payment/consent axes.
- Household tests prove no relationship-based access/consent inheritance, independently scoped
  revocation and no hidden member/count/resource inference.
- List/search/filter/sort and attention tests prove owner/classification routing, keyed protected
  matching, deterministic cursors, owner-outage recovery and no denied-source value/order/count/
  filter/timing leakage; generic risk filtering is rejected.
- Representative invitation/activation/expiry/revocation tests include concurrent sessions/jobs.
- Restriction/lifecycle/merge/offboarding/export tests cover the closed owner-effect registry,
  scope non-expansion, independent receipt access, idempotency, ambiguity, recovery and restore.
- Definition tests prove immutable publish/supersede, exact applicability, frozen in-flight versions,
  explicit migration/SoD, concurrent publish/stale completion, EN/ES parity and restore.
- Notes/reveal/export/telemetry tests prove no PII/content leakage.
- EN/ES responsive WCAG 2.2 AA and approved performance/dataset evidence passes.
- Independent security review and Product Owner Build authorization are recorded.

## Product Owner decisions required

This ADR is proposed, not approved. `CLM-003`–`CLM-010`, `CLM-013`–`CLM-016`, `CLM-020`–`CLM-023`
must be decided for affected architecture/behavior. Until then, unsupported subject kinds,
activation, merge, high-risk lifecycle actions, impersonation, export, protected reveal and
destructive disposition remain disabled.
