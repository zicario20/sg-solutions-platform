# ADR 021 — Party, CRM, opportunity, conversion and merge boundary

- Status: Proposed; Product Owner decision required before Build
- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Date: 2026-08-12
- Scope: M017 and its boundaries with M007, M018–M026, M042–M046, M077–M085, M089 and M092
- Supersedes: none
- Related: ADR 004, ADR 005, ADR 010, ADR 011, ADR 018 and M017 CRM PRD

## Context

The supplied M017 source describes contacts, leads, clients, organizations, opportunities,
activities, notes, tasks, appointments, consent, deduplication, merge, import/export, automation and
reporting. Project Atlas already assigns many of those concepts to specialized modules. Treating the
source literally as one M017-owned graph would create duplicate Person, Client, Lead, Organization,
Task, Consent, Payment and Case sources of truth. It would also let a commercial state such as
`won` accidentally create financial, access or service authority.

At the same time, reducing M017 to a thin page would fail the Product Owner's source: staff need a
coherent CRM relationship, opportunity, pipeline, ownership, next-action and history workspace.
Deduplication and conversion cross several owners and must survive retries, conflicts, revocation and
partial failure without introducing distributed infrastructure or direct cross-schema mutation.

## Decision proposed

### 1. Separate canonical party facts from the CRM relationship

- M018 owns natural-person, household, client-relationship and canonical contact-method facts.
- M019 owns organizations/businesses and person-organization relationships.
- M020 owns leads, capture provenance and lead-ingress duplicate handling.
- M017 owns `CrmRelationship`, `Opportunity`, versioned `PipelineDefinition`/
  `PipelineStageDefinition`, assignment history, CRM-authored activity/internal notes, governed
  source attribution and CRM data-quality orchestration.

`CrmRelationship` references exactly one canonical M018 Person ID. Within the single SG Solutions
organization, one canonical Person has exactly one current/root CRM relationship; a uniqueness/CAS/
idempotency invariant prevents per-channel/service duplicates, while approved `superseded` aliases
remain historical and confer no authorization. Organization context composes a collection of
concrete, versioned M019 person-organization-relationship references rather than a polymorphic
subject; each Opportunity may select one such reference only with the current M019 owner-issued
relationship/visibility/purpose receipt, effective interval, classification and access epoch.
Create, organization-dependent read/mutation and conversion final-fence that receipt. Correction,
end or revocation blocks organization-scoped effects; no path silently falls back to person-only or
another “primary organization.” “Primary organization” is display-only.
It is
not a second Person/Client/Organization row. Any organization-only prospect model remains a Product
Owner/domain decision and cannot be simulated with a placeholder person. A person can
exist without CRM relationship, a CRM relationship can remain a prospect without formal Client
status, and Client activation remains an M018 policy decision.

Contact methods are read through purpose- and field-limited M018 projections. M017 may store only
opaque references, display metadata needed for CRM state and approved protected matching tokens; it
does not create an independent email/phone authority.

The one CRM root is identity-neutral and carries no singular authoritative purpose. Versioned
`CrmPurposeBinding` records connect a relationship to one approved purpose/service, evidence/consent
refs, effective period, access epoch, owner/team, commercial engagement lifecycle and optional
current pre-Opportunity next action. The root has only current/superseded identity state and no
ordinary commercial assignment/lifecycle/action. Every Opportunity/Activity/Note/Attribution/next
action selects one binding. “Primary” is presentation only; it grants no access/contactability.
M078/M026 remains authoritative per purpose + channel, and revocation is isolated per binding.
Propose/activate persist and final-reread typed evidence receipts with exact owner/policy versions;
revoke/supersede bind the triggering owner receipt/version and expiry trusts server time. An evidence
correction, withdrawal or consent revocation wins the race and fails closed. Engagement dormancy/
archive is blocked while the binding has active Opportunity/action or pending/ambiguous/recovery
operations; explicit reactivation re-establishes accountable work and appends lifecycle history.
An Opportunity retains one immutable stable `CrmPurposeBindingId` plus its created-under immutable
version as evidence. Relationship-level commands supply the stable ID/current version/access epoch;
Opportunity commands resolve and final-fence exactly one current active binding version/epoch.
Renewal/definition upgrade advances the stable binding current pointer and epoch atomically while
preserving old evidence, so no Opportunity is orphaned or silently rebound to another purpose.
Neither path may infer a default binding.
Opportunity creation atomically supersedes/links the binding's pre-Opportunity action into the
Opportunity with both expected versions and an audit reason. A binding with an active Opportunity is
exempt from a duplicate action slot; close/reopen atomically hands responsibility back/forward so one
accountable workstream and both histories remain.

### 2. Use a CRM application facade inside the modular monolith

The Next.js Admin surface calls one server-side M017 application boundary. It:

1. derives canonical actor/session/membership/role/team/assignment/grant/purpose/classification
   context;
2. authorizes the requested CRM resource/action;
3. reads or writes M017-owned records;
4. calls typed owner ports for M018–M026/M042–M046 facts and commands;
5. returns minimized list/detail/action DTOs;
6. emits M077 audit events and transactional outbox records.

Protected contact reveal separates transient values from an opaque M077 audit receipt. Allowed,
denied and failed attempts send only actor/resource/field-class/reason/assurance/outcome/time/policy
metadata to M077—never the value or a replayable capability. Reviewers read attempt history only
through an independently authorized M077 projection; M017 stores no reveal history/value copy.

Presentation code never queries tables/providers directly. M017 does not require a microservice,
Redis or generic event bus. Postgres is durable state authority; Inngest may coordinate bounded jobs
after commit and remains non-authoritative.

Actor context is a closed human/workload union. Human actors require the full authenticated session/
membership/permission/resource/purpose/classification context. Every workload variant inherits a
signed envelope containing environment, SG organization, issuer, audience, service, exact method/
action, `iat`/`nbf`/`exp`, signing-key ID/version, recovery epoch and nonce, with verifier/key ring
pinned per environment + audience + action. The normal one-use variant additionally binds exact
canonical target/root set, closed active purpose-binding set/per-binding epochs, normalized command/
payload digest, expected versions, idempotency namespace/key, immutable source receipt/event,
schema/policy/recovery versions, timestamp and nonce. All bound values derive exclusively from that
immutable server-side receipt; job/client overrides fail closed. Workloads are command-only and
cannot list, search, count, export, merge or discover existence. Human-derived jobs also bind/
revalidate the original actor/purpose receipt. Browser-created, target/purpose/payload/key-substituted,
wrong-audience/action, expired, replayed or revoked-source context fails closed. Scoped RLS claims are
server-derived; nonce consumption is atomic with reservation, mutation, outbox and M077 audit. No
worker is trusted by network location alone.

The only pre-binding workload variant is a one-use `LeadHandoffBootstrapCapability` which inherits
that envelope and is bound to one
immutable M020 handoff receipt, exact Person-resolution ref/version, proposed purpose/evidence,
`acceptLeadHandoff`, canonical payload digest, key, epochs and nonce. It may create/reuse only the
identity-neutral root plus a `proposed` binding; it cannot activate consent/contactability, query
existence or invoke another command. Its reservation, root/proposal mutation, outbox, audit and nonce
consumption are atomic. Normal workload capabilities require an active binding.

### 3. Keep opportunity, finance, access and fulfillment axes independent

An Opportunity transition to `won` records a commercial result under M017 only. It does not assert:

- M018 Client activation;
- M021 ServiceOrder acceptance;
- M014/M043/M044 payment or invoice state;
- M045 entitlement;
- M021 human authorization to begin;
- M022 CaseFile creation/progress;
- service completion.

Conversion is a versioned, idempotent application orchestration. Each owner validates its own
preconditions and returns `created | reused | blocked | conflict | unavailable`. M017 stores the
typed receipt and never converts an ambiguous/partial response into success. Exact client-activation
and order/case prerequisites remain `CRM-004/005` Product Owner decisions.

Before its first effect, every conversion/canonical-merge/Opportunity-duplicate-resolution/
Opportunity-relation-correction/binding-ended-remediation/pipeline-version-migration-execute/import-
apply/import-compensation/CRM-retention-disposition/legal-hold-apply-or-release/automation-owner-
action/approved-AI-proposal-consumption/reconciliation-with-owner-or-disposition-command atomically reserves a
server-derived operation fingerprint in Postgres. The fingerprint inseparably binds environment,
organization, actor/account/session/auth epoch/assurance/membership, exact permission/role/team/
assignment/grant/access epochs, purpose/classification, operation namespace/version, canonical roots,
approved preview ID/digest/use state, normalized input digest, exact owner/resource/schema/contract/
policy versions and current recovery epoch. The preview is opaque, short-lived, actor/scope-bound,
single-use/revocable and final-fenced before execution. Same key and exact fingerprint returns/
resumes the original operation; a different fingerprint conflicts. The client key is high entropy,
bounded and rate-limited, and its uniqueness namespace includes environment, SG organization,
authenticated actor/approved issuer and operation namespace/version so unrelated actors do not
collide. A separate unique recovery-stable semantic-operation identity is `(environment, organization, namespace/
version, canonical effect type, ordered canonical root set, normalized effect digest, applicable
expected resource/owner versions, preview-content digest, schema/contract/policy versions, canonical
domain-intent ref/version)`. It excludes actor, raw key, recovery generation and equivalent preview
instance ID. No external journal is introduced: the intent/version is deterministically derived from
immutable operation roots, exact expected versions, approved transition/plan/request version and
normalized effect digest and cannot be client-selected. A lost reservation reproduces the same
identity for reconciliation. A legitimate repeat requires an approved canonical business/request
version advance after the earlier receipt is terminal; retry/equivalent preview reuses it. Operation-specific
canonicalizers distinguish legitimate different inputs against the same root, while the identical
effect across authorized actors, keys or equivalent previews produces one winner. Each owner command
receives a deterministic step ID derived from that recovery-stable tuple
and enforces its own semantic digest/version. Ambiguous responses reconcile by that ID before retry,
and a stale authorization/policy/version/recovery generation cannot resume. The durable receipt
records per-owner outcome without protected payload.
Retention/hold canonicalization binds the ordered closed record/version set, disposition, exact M085
authority/policy/legal/minimum-retention/downstream/backup-expiry versions and SoD receipt, deriving
one stable step per record. Ambiguous destructive results reconcile against current record/key/hold/
backup state before resume; another actor/key cannot repeat the same shred/purge/hold transition.

Export request is intentionally outside that cross-actor semantic identity. The server creates a
versioned `CrmExportRequestIntent` owned by the exact actor/account and deduplicates a lost response
only within its actor-scoped fingerprint/key plus intent version. Generate/consume/revoke final-fence
the current session, assurance, access epochs and job version. Equivalent requests from different
authorized actors never share a receipt, artifact or delivery capability.

Opportunity-resolution canonicalization includes both exact Opportunities, purpose bindings/epochs,
disposition/preservation plan and complete known downstream owner inventory/version. It is final-
fenced against concurrent conversion and cannot rewire those owner facts.

Compensation additionally binds the exact approved plan digest and expected owner versions.
Recovery generation remains in request/authorization fingerprints only; after restore, stable
effect and owner-step IDs are reconciled against canonical Postgres owners, available M077 recovery
evidence, M011 artifact inventory and any approved external owner receipt before a new effect is
admitted. No new database, provider or authority is implied.

Every enhanced execute carries the exact approved plan ID/version/digest/unused state, complete
final member/owner/job inventory, current assurance and applicable separation-of-duties receipt.
Reconcile is read-only by stable ambiguous step IDs with the current closed scope and recovery
epoch. Resume requires an approved recovery plan ID+digest, complete final scope, only proven-not-
started steps, current assurance/SoD and current recovery epoch. Binding-ended remediation is a
local all-or-nothing transaction and therefore has no saga resume, but its execute still binds the
exact disposition-plan digest/unused state, frozen child inventory, assurance and SoD. No substitute
plan/actor/key may reissue an accepted or ambiguous owner/destructive effect.
Legal-hold apply/release are the direct-CAS exception to preview/execute/resume: current M085/legal
authority, exact record/overlapping-hold versions, assurance/SoD and the same strong semantic
identity are mandatory; lost/ambiguous outcomes reconcile the original receipt before any retry.

The operation fingerprint prefers opaque refs, immutable versions and enum codes. Protected or low-
entropy email/phone/note/query/row values are never included through a bare hash. If equality is
unavoidable, a purpose/domain-separated keyed MAC with key version is derived under custody outside
Postgres/backups/logs/telemetry. Fingerprints remain server-only and non-exportable; rotation and
restore preserve same-semantics behavior through explicit key-version policy.

### 4. Use request-scoped composition and reauthorized drill-downs

Contact 360 and CRM timelines compose typed owner projections under one complete canonical
authorization context. Contact 360 accepts a closed, versioned section-code registry; each code maps
to one typed owner port with exact resource refs/versions, stable purpose, classification, current
grant/assignment/access epochs, owner contract version and bounded freshness. M020 provides the
explicit read-only Lead qualification port and list projection; M017 never infers qualification from
stage/tag/score. Each projection declares owner, contract version, classification, source `asOf`,
freshness and `complete | partial | stale | unavailable | suppressed | denied | unknown |
not_applicable` state. Sections authorize independently, and one incomplete requested section keeps
the aggregate partial rather than being silently omitted or upgraded.

M017 may persist only its own activity plus minimized opaque references to canonical records. It
does not copy message/document/transcript/payment/tax/credit bodies. Drill-down reauthorizes and
loads canonical detail in the owner. Hidden rows/fields are not sent to the browser.

`unknown` means the canonical owner answered but has not established the requested business fact;
`not_applicable` means an approved policy excludes it. Neither can be mapped to zero, absence,
`complete` or a satisfied conversion prerequisite.

### 5. Split duplicate detection from canonical identity resolution

- M020 detects duplicate lead submissions and ensures idempotent capture.
- M017 may detect CRM relationship/opportunity candidates and present authorized review.
- M018 owns canonical Person/Client identity resolution and person merge.
- M019 owns organization resolution when applicable.

Protected email/phone matching uses server-derived, domain-separated keyed tokens with key ID/
version outside Postgres and backups. Unkeyed low-entropy hashes, plaintext normalized contact data,
name-only matching and AI-only matching cannot authorize a merge.

Party/relationship outcomes are `distinct | deferred | canonical_resolution_requested`; M017 does
not delete the apparent duplicate. A later high-risk merge orchestration requires expected versions,
a dry-run graph, conflict classes, current authorization, explicit reason, approved authority,
idempotency, audit and a recovery reference.

Opportunity candidates use concrete Opportunity refs and a separate enhanced M017 resolution
contract. Preview and execution bind candidate plus exact Opportunity versions, approved disposition
(`keep_both | link_related | supersede`), preservation plan, reason, authorization, semantic
idempotency and recovery receipt. Preview digest-binds disposition + structured reason + preservation
plan; execute consumes that exact approved unused plan after a final version fence. Supersession is
non-destructive: both stage ledgers, assignments,
activities, attribution and next actions remain queryable under authorization. It does not invoke a
Person/Client merge and is never automatic.
The resulting relation is stored in an immutable/versioned `OpportunityRelation` aggregate with a
closed `related|superseded` kind, stable acyclic group, exact member/survivor/source versions,
effective interval and receipt/current pointer. `DuplicateCandidate` is review workflow only and may
age out without erasing the durable relation. Corrections append a reviewed relation version; there
is no silent unlink. Query, conversion and close/reopen final-fence the complete relation group.
Every other Opportunity-targeted mutation and history/detail read derives and final-fences the
complete current relation group together with stable purpose binding/current version/access epoch;
list/pipeline do so per row before counts. A caller cannot omit or supply a partial group.
Its dry-run includes both exact bindings/epochs and all known conversion, ServiceOrder, CaseFile,
Task, quote, payment, entitlement and approval refs/owner versions. It never rewires owner facts or
attribution. Incompatible downstream effects stop for manual review, and conversion checks the
relation group using closed semantics: a superseded member cannot convert; related members with
equal canonical commercial intent/version + owner effect/service/scope replay one receipt, while
related members with different immutable intent/effect scope may convert independently. Keep-both
creates no blocking relation.

Duplicate-review list/get/decide authorizes the intersection over every candidate member plus each
exact binding/current owner epoch before inclusion, count, comparison or mutation; otherwise the
whole candidate is generically suppressed without timing/existence leakage. Data-quality review
does the same for the exact closed typed subject, classification, owner receipt/version and binding/
owner epoch, and resolution validates the new owner receipt rather than editing canonical facts.

Canonical resolution preserves immutable provenance, owner references, source attribution, consent
evidence links, assignments, activities and downstream relations through approved rewiring plus
alias/tombstone records. It does not silently select a winning consent, verified identifier,
financial fact or client access grant. Active sessions/resource grants are re-evaluated; revocation
and access epochs propagate predictably.

M017/M018 canonical resolution never creates, transfers, rewrites, inherits or automatically follows
an M007 `UserAccount`/external-identity-to-Person/Client link. Account-link changes belong exclusively
to M007 under ADR 011 and IAM-008, with fresh identity evidence, step-up, explicit manual conflict
review, notification and audit. During cutover, potentially affected sessions/grants are frozen or
revoked until reauthorized. A CRM/person alias or tombstone is excluded from authentication,
membership, grant and resource resolution; it is an operational lookup aid only. Rollback/restore
cannot make a losing account resolve to winner resources.

### 6. Keep task, note, activity and audit semantics separate

- M023 Task is actionable work with owner/due/dependencies/evidence.
- M017 `CrmInternalNote` is internal CRM commentary with separate purpose, visibility and retention.
- M017 `CrmActivity` is a typed commercial activity or minimized owner reference.
- M077 AuditEvent is tamper-evident accountability evidence.

Creating one does not automatically create the others. Any mapping is an explicit idempotent rule
with owner policy. A CRM next-action Task link requires an exact Task ref/version plus the current
M023 owner-issued target/purpose/visibility/classification/access-epoch receipt on mutation and read.
M023 correction, deletion, reassignment or revocation supersedes/clears only the minimized CRM link;
M017 never mutates Task lifecycle. Internal notes never become client messages or analytics content.

### 7. Consent and communication remain owner-authoritative

M078 owns consent evidence; M026 owns channel preferences/quiet hours; M025/channel modules own
delivery. M017 stores source/evidence references and may request an allowed action, but fresh owner
decisions are checked at send time. Tags, pipeline stage, old opt-in or relationship status are not
delivery authority. When consent/preference is missing or unavailable, outbound communication fails
closed.

### 8. Import/export are controlled data-boundary operations

Future imports use M011 accepted `DocumentVersion` only after quarantine, content validation,
malware scanning and archive/executable policy. CSV uses bounded text parsing. Approved `.xlsx` is a
strictly validated OOXML ZIP package with content-type/relationship/signature validation and limits
on entries, nesting, compression ratio and uncompressed bytes; macros/VBA, OLE/executables, external
links, traversal, polyglots and arbitrary/nested archives are rejected. Mapping is versioned; preview reports duplicates,
conflicts, prohibited fields and row errors. Applying requires current authorization and semantic
idempotency. Imports cannot create consent or overwrite verified canonical facts implicitly.

Future exports authorize the dataset before counts, authorize each row/field again at generation,
neutralize spreadsheet formulas, use M011 private temporary delivery, expire/revoke and audit
generation/download. The export receipt is not a bearer download grant. A server-mediated consume
command binds the short-lived opaque capability to current actor/session/membership/scope/purpose/
assurance/export version/recovery epoch, reauthorizes immediately before bytes, uses private
`no-store` delivery and rejects forwarding, scope/session change, revocation, restore or disallowed
reuse. Saved views are filters, not cached result data.

### 9. Recovery and backup do not resurrect authority

Conversion, merge, import and export persist step receipts plus the request recovery generation and
recovery-stable effect/step identity. After restore:

- access/session/policy epochs and owner versions are revalidated;
- pending/ambiguous commands reconcile before retry;
- temporary exports and signed URLs remain revoked/expired;
- projections/indexes/caches rebuild from canonical owners;
- alias/tombstone and merge history remain available for resolution;
- active/revoked/expired/superseded purpose bindings reconcile from protected evidence/audit,
  advance access epochs and invalidate dependent cursors/jobs/previews/projections;
- deleted/withdrawn consent does not reappear as active.

## Alternatives considered

### M017 owns Person, Client, Lead and Organization

Rejected because it duplicates primitives, creates divergent identity/access truth and couples every
service vertical to CRM internals.

### One generic `Contact` mega-table plus JSON custom fields

Rejected because classification, ownership, validation, encryption, indexing, migration and
authorization become ambiguous; custom fields would become a shadow domain model.

### Automatic merge at capture

Rejected because shared/recycled email/phone, family/business relations and stale data can join
unrelated people and cause cross-client disclosure.

### Opportunity `won` directly creates client/order/case/payment state

Rejected because commercial, financial, entitlement, human-approval and fulfillment facts have
different owners and failure modes.

### External CRM or separate CRM microservice now

Rejected because no independent scale/runtime/isolation/deployment need is demonstrated and it would
violate the approved modular-monolith baseline. A future extraction requires a separate ADR and
Product Owner approval.

## Consequences

### Positive

- One coherent CRM experience without duplicate identity/business/service records.
- Safer client isolation, consent handling and high-risk merge/export operations.
- Clear compatibility from Release 1A manual operations to Release 1B automation.
- Reliable reporting semantics across commercial, financial and operational domains.
- Provider-neutral and recoverable workflows without premature distributed infrastructure.

### Costs

- Contact 360 and conversion require explicit contracts across several modules.
- Identity resolution cannot be a one-click destructive shortcut.
- Product Owner decisions are required for stage, access, merge, import/export and activation policy.
- Projection freshness/partial states add UI and test complexity, but prevent false certainty.

## Security invariants

1. CRM visibility never grants canonical resource access.
2. Email, phone, name, payment and company relation never prove identity or permission.
3. No unkeyed low-entropy contact hash is stored for matching.
4. No automatic or AI-authorized canonical merge.
5. No `won` state mutates financial, entitlement, approval or fulfillment authority.
6. Lists/counts/search authorize before matching/pagination and resist enumeration.
7. Internal notes and imported free text are excluded from client DTOs, telemetry and AI by default.
8. Export/merge/conversion/import use current authorization, expected versions, idempotency and audit.
9. Revocation, policy epoch and restore generation invalidate derived access and temporary artifacts.
10. Provider/workflow failure preserves manual safe operation and never fabricates success.

## Decision gates

`CRM-001`–`CRM-023` in `EXTERNAL_ACTIVATION_REGISTER.md` govern the exact entity/view inventory,
route, relationship/client lifecycle, conversion, pipeline, access, next-action, activity, notes,
attribution, matching, merge, assignment, consent/preference, metadata, import/export, AI,
analytics, measurable quality and retention/deletion policy. This ADR plus those decisions and a separate explicit
`GENERATE`/Build authorization are required before implementation.

## Validation required before acceptance

- Boundary tests prove no duplicate Person/Client/Lead/Organization/Order/Case truth.
- Authorization tests cover role/team/assignment/resource/purpose/classification, lists/counts,
  protected fields, exports, merges and reauthorized drill-downs.
- State tests prove `won`, payment, entitlement, approval and fulfillment axes remain independent.
- Race/idempotency tests cover transition, conversion, assignment, merge, import and replay.
- Semantic-key tests cover same-key/same-fingerprint, changed actor/root/preview/payload/policy/
  version/recovery epoch, concurrent first reservation, ambiguous owner response and deterministic
  per-owner step replay with exactly one effect.
- Namespace tests prove the same raw key across different actors/approved issuers, environments or SG
  organizations does not collide, while the same canonical semantic operation still has one winner.
  For one actor/issuer in one environment+organization+operation namespace, reusing that raw key on a
  different root intentionally returns same-key/different-fingerprint conflict without disclosure;
  clients must generate a new high-entropy key per requested operation.
- Fingerprint tests prove protected low-entropy values never use bare hashes or enter clients/logs;
  key rotation/restore/version changes preserve or explicitly fence same-semantics replay.
- Matching tests cover keyed-token versioning, shared/recycled identifiers and no name-only merge.
- Import/export tests cover malware/type/limits/formula injection, row/field minimization and expiry.
- Recovery tests cover partial owner failure, restore generation, revoked access and ambiguous jobs.
- WCAG 2.2 AA, EN/ES, responsive and reduced-motion tests cover critical journeys.

## Open decisions

All `CRM-001`–`CRM-023` markers remain Product Owner decisions. Until they, the visual design and a
Build gate are approved, ADR 021 is proposed architecture only and creates no product behavior.
