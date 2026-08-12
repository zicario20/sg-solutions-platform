# Database

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Baseline; concrete schema begins only after the applicable PRD, Build gate and explicit Product Owner authorization
- Update rule: update with every Drizzle schema or migration change

Drizzle is the sole schema and migration authority. Production schema changes never originate in the Supabase dashboard. The application uses a pooled `DATABASE_URL`; migration tooling uses direct `DIRECT_DATABASE_URL`; tests use isolated `TEST_DATABASE_URL`.

Destructive changes follow expand → migrate/backfill → contract. Generated migration filenames come from Drizzle Kit and are committed after review; documentation must not predict their names.

Highly Sensitive structured fields follow `docs/adr/005-encryption.md`; managed encryption at rest
alone is not sufficient evidence. Backup and migration recovery follow `BACKUP_AND_RECOVERY.md`.

M015 will use typed profile-section records plus common provenance/revision metadata after its Build
gate. Central profile values may not use one JSON blob, unrestricted EAV table or weak polymorphic
`ownerType/ownerId` relation. Concrete foreign keys preserve M018 Person/Household/Client, M019
Organization/relationship projections, M021 ServiceOrder, M022 CaseFile, M011 DocumentVersion and
M078 Consent ownership. Any future generic subject registry requires a separate accepted schema ADR
proving referential and authorization integrity.

Accepted profile facts are immutable revisions with an atomically selected current pointer,
expected-version checks, quality/freshness/effective-period evidence and append-only conflict/
verification history. Old/new protected plaintext is not copied into generic audit/history. Drizzle
must encode typed M015 fact period/unit constraints, concrete M018/M019 reference integrity, RLS
support indexes and retention hooks. M019—not M015—owns organization ownership/authority percentage
and effective-period policy under PFL-006. No M015 table or migration is authorized by the
documentary candidate.

M016 requires no canonical business-state table. After a future Build gate it may own typed
`DashboardDefinition`, `DashboardWidgetDefinition`, `AdminDashboardPreference`, `SavedDashboardView`,
`DashboardMetricSnapshot` and `DashboardInvalidationReceipt` records only when `ADM-001`, `ADM-009`,
`ADM-010`, `ADM-018` and `ADM-019` approve them. Snapshots/preferences use concrete
actor/role/team/policy/widget/period/
locale/time-zone/recovery-generation references and cannot use weak `ownerType/ownerId` links to
bypass owner-domain integrity. They contain minimized projections, not document/message bodies,
protected identifiers or canonical payment/case/client facts.

Snapshot provenance stores a versioned opaque digest of the complete canonical M016 authorization
context—not a reduced role/scope key—including auth epoch/assurance, membership/permissions,
assignment, exact grants/access epochs, purpose, classification clearance, owner/source/definition/
policy and normalized presentation dimensions. Missing or mismatched dimensions cannot select a
row. The digest is server-derived, not reversible/client-supplied, and excluded from logs/analytics.

Every derived snapshot/cache can be discarded and rebuilt from authorized owner projections. It
must never satisfy a domain invariant, survive revocation/policy/recovery generation, create an
audit fact about owner state or convert incomplete coverage into zero. Drizzle remains the only
schema/migration authority, and no M016 table or migration is authorized by this documentary
candidate.

M017's representative owned records include typed `CrmRelationship`/stable versioned purpose
bindings, `Opportunity`, durable immutable/versioned `OpportunityRelation`, pipeline/stage
definitions and migrations, assignment/engagement/next-action histories, Activity/InternalNote/
Attribution, campaign/custom-field/tag/list/segment metadata and values/members, assignment/
automation rule definitions and receipts, ScoreEvaluation, AiProposal, Search/Reporting envelopes,
Duplicate/Quality, conversion/merge/import/export/retention/legal-hold operation receipts and stable
idempotency/recovery records. The exhaustive normative inventory and contracts are M017 PRD §10–§11;
this summary is not permission to add a table. Records may exist only after `CRM-001`–`CRM-023` and a
Build gate. Concrete foreign keys preserve M018 Person/Client, M019
Organization, M020 Lead, M021 ServiceOrder, M022 CaseFile, M023 Task and M078 Consent ownership.
Weak polymorphic `ownerType/ownerId` links cannot replace referential and authorization integrity.
Every record targeting relationship work uses a closed concrete target plus stable binding ID,
current binding-version/access epoch and exact owner/resource versions where applicable. Metadata,
score, proposal, projection or receipt records never create an authorization relationship.
`CrmRelationship` has one concrete M018 Person foreign key and a uniqueness invariant allowing only
one current/root relationship per Person in the single SG Solutions organization; concurrent create/
relink uses CAS/idempotency. Its only state is current/superseded; it has no ordinary commercial
owner, engagement lifecycle or single next-action slot. Superseded alias rows are historical and authorize nothing. Organization
context is a collection of concrete M019 person-organization relationships; Opportunity optionally
references one exact relationship/version plus current owner-issued purpose/visibility/
classification/access receipt and effective interval, never a generic subject pair or placeholder
Person. Owner correction/end/revocation stales that projection and blocks organization-dependent
effects; there is no person-only/preferred-organization fallback. Each
Opportunity has one immutable stable `CrmPurposeBindingId` plus its created-under immutable binding-
version ref as evidence; commands resolve/final-fence the one current active version/access epoch
rather than inferring a primary/default purpose. Renewal/upgrade advances that stable binding's
current-version pointer atomically and cannot orphan or rebind Opportunities.
The root has no singular purpose field. A stable `CrmPurposeBinding` aggregate and concrete immutable
version rows store one
purpose/service/evidence/effective-period/access-epoch/classification binding. Opportunity,
CrmActivity, CrmInternalNote, CrmSourceAttribution and NextActionDisposition reference one exact
binding. Cross-purpose DuplicateCandidate, CrmDataQualityIssue, CrmMergeOperation, import/export and
conversion orchestration store the closed set of involved binding refs/versions/access epochs and
authorize every member independently; global pipeline/stage/tag definitions bind no person purpose.
RLS/query indexes preserve cross-purpose isolation, and one binding's
revocation cannot authorize or invalidate unrelated purpose data by broad root mutation.
An exclusion/uniqueness invariant plus CAS permits at most one current active, non-overlapping
binding for a relationship + stable logical purpose/service identity at any instant across all
definition versions. The applied definition version remains immutable evidence; upgrade atomically
supersedes/closes the prior binding before activating the next and advances the affected access epoch.
Each binding owns its commercial engagement lifecycle, owner/team and at most one current pre-
Opportunity next action protected by `(relationship, binding)` uniqueness/CAS. Opportunity owns its
separate owner/lifecycle/next action. Opportunity creation/close/reopen atomically hands the current
action between binding and Opportunity with both expected versions; an active Opportunity exempts
its binding from a duplicate current-action requirement while preserving both histories.
An optional next-action Task link stores an exact M023 Task ref/version and its current owner-issued
target/purpose/visibility/classification/access-epoch receipt. It never copies Task state. M023
correction/deletion/reassignment/revocation appends a CRM link supersession/clear record and cannot
mutate the Task. History/query final-fences the owner receipt before returning minimized Task data.

M017 does not create duplicate person, client, organization, lead, order, case, task, message,
document, payment, consent or audit tables. Activities use typed owner-reference columns/registries
and minimized summaries, not copied bodies. Pipeline/stage definitions are immutable versions;
opportunities retain their applied definition/version. Stage transitions, assignment, conversion
and merge use optimistic versions, semantic idempotency and transactional outbox receipts.
Assignment history uses a closed `CrmPurposeBindingRef | OpportunityRef` target implemented with
concrete foreign keys and an exactly-one constraint, including prior/resulting target versions; it is
not a generic polymorphic owner pair.
Every stage/close/reopen command atomically CAS-updates the Opportunity current pointer and appends
an immutable `OpportunityStageTransitionHistory` with from/to definition+stage versions, actor/
reason/evidence/effective time/policy and resulting version. M077/outbox/CrmActivity are not the
business ledger; history is not deleted, and M092 consumes an authorized projection.
An approved Opportunity duplicate resolution appends a closed `related|superseded`
`OpportunityRelation` version with exact member/survivor/source versions, stable acyclic group,
effective interval and receipt/current pointer. The candidate is not durable relation authority;
corrections append versions and conversion/close/reopen final-fence the whole group.
All governed definition families store separate mutable-by-CAS draft versions and immutable
published versions; retirement appends status/effective-time/usage-inventory evidence without
editing prior meaning. Saved views store exact dataset, stable logical purpose/service, purpose/
filter/schema registry versions and actor/team ownership/access receipt version—not result rows or
authorization. Stale definitions/receipts make a view unavailable rather than broadening its query.

Cross-owner high-risk effects derive a recovery-stable semantic identity from immutable canonical
roots, exact expected owner/resource versions, approved transition/plan/request version, normalized
effect digest and schema/contract/policy versions. Deterministic owner-step IDs derive from it. The
request fingerprint separately includes recovery generation so old work cannot resume. This uses
existing Postgres owner state/receipts and introduces no external journal or database.

Every retryable local write reserves a scoped key plus server-derived actor/operation/target/
expected-version/input/policy/schema/recovery fingerprint in the same transaction as mutation,
audit and outbox receipt. Same semantics replay the original receipt; changed semantics conflict.

High-risk operations persist a unique environment/SG-organization/authenticated-actor-or-issuer/
operation-namespace-version/key reservation before their first effect, a
server-derived fingerprint bound to environment/organization/actor/session/assurance/membership/
permissions/team/assignment/grants/access epochs/roots/preview/input/owner/schema/contract versions/
policy/purpose/classification/recovery epoch, deterministic owner-step IDs, step outcomes and final
receipt. A separate semantic-operation unique identity prevents two different keys/previews from
winning the same operation. Same-key/different-fingerprint conflicts; ambiguous steps reconcile by owner receipt before
retry. The records contain opaque IDs/digests/status only, never protected request payloads.
Export is the explicit exception to cross-actor semantic uniqueness: each server-issued versioned
`CrmExportRequestIntent` belongs to one actor/account, deduplicates only under its scoped key and
intent version, and produces a separate non-transferable session/assurance-bound capability.
Operation fingerprints prefer opaque refs/versions/codes; any unavoidable protected low-entropy
equality uses a domain-separated keyed MAC plus key version outside Postgres/backups, never a bare
hash. Fingerprints and match tokens are server-only and excluded from logs, telemetry and exports.

No CRM/person merge may rewrite M007 UserAccount or external-identity linkage. A CRM alias/tombstone
is excluded from authentication/membership/grant/resource resolution and is not followed by RLS.
M007/ADR 011/IAM-008 alone govern explicit account-link changes. Affected access/session epochs must
be frozen or revoked during an approved canonical-resolution cutover.

Protected matching stores server-derived domain-separated keyed tokens plus key version—not raw
normalized email/phone or unkeyed hashes. Keys remain outside Postgres and database backups. Future
imports/exports reference M011 objects; file bytes and temporary delivery remain outside CRM tables.
Merge preserves aliases/tombstones, conflict and recovery references instead of destructive history
rewrites. No M017 table, migration, RLS policy or data is authorized by this documentary candidate;
Drizzle remains the only schema/migration authority.
