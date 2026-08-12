# M017 CRM — Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Product/Architecture candidate; no Build gate
- Version: 1.0.0-candidate
- Date: 2026-08-12
- Surfaces: Admin Portal and bounded backend domain/application services
- Related modules: M001, M003–M007, M013, M016, M018–M026, M040–M046, M074,
  M077–M085, M089–M092 and M097
- Governing ADRs: ADR 001–006, ADR 010–011, ADR 018 and proposed ADRs 021–022

This PRD normalizes the complete Product Owner-supplied M017 source into the approved Project Atlas
modular-monolith architecture. It specifies a future production module; it does not authorize an
Admin route, table, migration, RLS policy, worker, import/export, provider, real person/client data,
merge, marketing message or product code.

The dedicated M018 contract in [`m018-client-management.md`](m018-client-management.md) and proposed
[`ADR 022`](../adr/022-client-party-lifecycle-representation-and-aggregate-boundary.md) refine the
canonical Person/Household/formal Client, client-subject and 360-aggregation boundaries. M017 remains
a downstream commercial consumer and cannot activate Client or manufacture an unsupported
organization-only placeholder.

## 1. Purpose

M017 is SG Solutions' internal commercial relationship workspace. It gives authorized staff one
place to understand a prospect or customer relationship, its provenance, opportunities, pipeline
position, owner, history and next action. It connects acquisition to operations without confusing:

- a person with an authenticated account;
- a contact relationship with a client relationship;
- a lead with a person;
- an opportunity marked `won` with payment, entitlement or permission to begin service;
- an organization relationship with authority to see another person's records;
- a CRM activity with the canonical message, appointment, document, payment, order or case.

M017 owns the CRM relationship and commercial workflow. It does not become a second source of truth
for identities, people, clients, businesses, leads, consent, services, cases, tasks, appointments,
messages, payments or audit history.

## 2. Business value

- Prevent prospects and follow-ups from being lost.
- Show who owns each commercial relationship and the next safe action.
- Preserve original and latest attribution for Google, Meta, TikTok, Facebook, Instagram, organic,
  referral and other approved channels without storing arbitrary tracking payloads.
- Give the owner-operator a coherent 360-degree view while SG Solutions is a one-person operation,
  and scale later to role- and team-scoped work.
- Separate interest, qualification, sale, payment and fulfillment so reports do not overstate
  revenue or service progress.
- Reuse canonical platform primitives and provide a stable boundary for future communications,
  automation, reporting and AI assistance.
- Support safe correction of duplicate relationships without silently merging people or weakening
  client isolation.

## 3. Scope

### Release 1A documentary target

- One CRM area inside the authenticated Admin platform, not a separate application.
- CRM relationship records referencing canonical M018 people and M019 organizations.
- Read-only lead context from M020 and an explicit handoff into M017 opportunity work. M020 remains
  authority for qualified/unqualified/disqualified outcomes and required evidence; M017 may display
  the authorized result but does not reclassify it implicitly.
- Opportunity, versioned pipeline, stage and loss/closure-reason architecture.
- Owner/team assignment, explicit unassigned queue, priority and visible next action.
- Bounded commercial activities and internal CRM notes.
- Original/latest source and allowlisted attribution references.
- Governed tags and saved filters required for daily operations.
- Safe duplicate-candidate review and cross-module identity-resolution request; no automatic merge.
- Contact 360 composition through minimized owner projections and reauthorized drill-downs.
- Release 1A “search” is only allowlisted, purpose-scoped filtering inside the current authorized
  CRM list query; it is not a global/full-text M089 index and never searches contact or note bodies.
- Idempotent conversion orchestration that requests canonical client/service/order/case actions from
  their owners without treating opportunity state as their authority.
- Bilingual, responsive, keyboard-operable list and pipeline views.
- Structured audit events and content-free operational telemetry.

### Compatible Release 1B extensions

- Governed custom fields, lists and segments.
- CSV/XLSX imports through M011 quarantine/scanning with preview, mapping, deduplication, forward
  reconciliation and explicitly supported compensation.
- Authorized, minimized exports with step-up verification and temporary delivery.
- Configurable assignment rules, round-robin routing and workload awareness.
- Broader channel activity projections and advanced attribution.
- Deterministic rules/automation and explainable, non-discriminatory CRM relationship/Opportunity
  prioritization after an active purpose binding. Actual Lead scoring/qualification remains M020.
- Expanded reporting consumed through M092.
- Optional global CRM discovery through a typed, minimized M089 projection after CRM-020; it is
  separate from Release 1A list filtering and cannot be improvised with ad-hoc SQL/indexing.
- Approved communication/campaign orchestration through M025/M026/M078; M017 never becomes the
  consent or delivery authority.

### Future extensions

- AI-assisted summaries, prioritization and suggested next actions through M047–M060.
- Partner/referral opportunity views and richer marketplace handoffs.
- Additional import connectors, forecast models and governed experimentation.

### Preserved but deferred source capabilities

All source capabilities remain represented. Campaigns, bulk communication, predictive scoring,
custom fields, complex segmentation, large imports/exports, autonomous routing, social-channel
writeback and advanced BI are deferred by decision gates rather than deleted.
General bulk mutation of CRM records is not an M017 capability: it is off in 1A/1B and Future until
the Product Owner authorizes a concrete command in a later PRD/gate. This does not remove separately
owned bulk communication (M025/M026/M078) or the gated export job; neither grants record mutation.

### Compatible documentary implementation sequence

1. Confirm canonical ownership and authorization contracts with M007/M018–M023/M077–M085.
2. Establish CRM relationship and assignment/next-action primitives.
3. Add Opportunity plus immutable pipeline/stage versions and safe transitions.
4. Compose source-bound Activity/Contact 360 projections.
5. Add reviewed duplicate/canonical-resolution and conversion orchestration.
6. Activate data-quality, import/export, automation/scoring and reporting only through their
   separate Release 1B/Future gates.

This is sequencing, not permission to build. Each step extends the same definitive domain boundary;
there is no disposable contact or pipeline implementation.

## 4. Explicit out of scope

- A standalone CRM product, second authenticated application or multi-organization SaaS.
- A separate database, microservice, Redis dependency, Kafka/event bus or external CRM required by
  M017. Inngest may coordinate future jobs but is not business-state authority.
- Canonical Person/Household/Client ownership (M018), Organization ownership (M019), Lead lifecycle
  and lead-ingress deduplication (M020), ServiceOrder (M021), CaseFile (M022), Task (M023),
  Appointment (M013), Message (M012/M025), Payment (M014/M043–M044), Consent (M078), global audit
  history (M077), global search (M089) or analytics/report definitions (M092).
- M019 organization profile, entity status, ownership percentage, member authority and effective
  relationship dates; M017 consumes only an authorized relationship projection.
- Public lead capture UI or bot controls (M006/M020).
- Client-visible notes, messages, files or CRM screens.
- Automatic marketing enrollment, automatic person merge, automatic client activation, service
  authorization, professional advice, credit/loan/mortgage approval or guaranteed outcomes.
- Copying provider payloads, document bodies, message bodies, recordings, transcripts, tax/credit
  facts or payment-card data into CRM.
- Treating email, phone, company relation, payment, tag, opportunity or pipeline stage as an access
  grant.

## 5. Actors

| Actor | Intended interaction | Prohibited implication |
|---|---|---|
| Product Owner / Owner | Full approved operational CRM scope; resolves policy decisions | Ownership does not bypass audit, purpose or high-risk confirmations |
| Administrator | Configured CRM administration within explicit permissions | Role name alone does not grant exports, merge or all-client access |
| Sales / Intake | Work assigned relationships, opportunities and next actions | Cannot activate clients/services, confirm payment or view unrelated sensitive data |
| Support Agent | Bounded contact/context lookup and activity creation | Cannot see specialist notes or broad exports by default |
| Service Specialist | Read minimal CRM context for assigned work; add allowed activity | Assignment to a case does not imply global CRM access |
| Compliance Reviewer | Review selected activity, consent references, exports and merges | Does not become commercial owner by review |
| Read Only / Auditor | Approved minimized reads and audit evidence | Cannot mutate or receive hidden free text by default |
| Automated adapter | Submit typed activity/reference or request a bounded command | Cannot self-authorize, merge, activate clients or send marketing |
| AI assistant | Suggest/classify/summarize through allowlisted tools in a future gate | Cannot mutate critical state, infer consent or make eligibility decisions |

Public prospects and clients are not M017 UI actors. Their public/portal actions reach their owning
modules, which may produce a minimized M017 reference after authorization.

## 6. User journeys

### 6.1 Review a new prospect

1. M020 accepts or safely matches a consent-bound lead from an approved channel.
2. M017 receives a content-minimized lead reference, not the raw public payload.
3. An authorized staff member opens the separate proposed-binding review queue. It shows only
   purpose/service and minimized immutable handoff/evidence receipt status; it grants no ordinary CRM
   access and never exposes existence to an unauthorized reviewer.
4. Staff opens one proposal, rereads the typed M020/M018 owner evidence and explicitly activates,
   rejects or leaves it proposed under current versions. Activation never creates consent.
5. Only after activation may the item appear in the ordinary purpose-scoped unassigned/new queue.
6. Staff claims or assigns the exact purpose/service work item, records its next action and opens
   canonical detail only when independently authorized. Every change is audited.

### 6.2 Qualify and manage an opportunity

1. Staff creates an opportunity against one canonical party/relationship and requested service.
2. Required fields and the current pipeline/stage version are validated.
3. Stage transitions use expected version, approved transition and structured reason/evidence.
4. Every active opportunity has an owner/unassigned queue plus next action or an explicit hold.
5. M017 records `won`, `lost`, `cancelled` or reopening without deleting history. Any M020
   `disqualified` qualification outcome is a read-only handoff projection and is never rewritten as
   an M017 Opportunity outcome.

### 6.3 Convert commercial interest into operations

1. Staff invokes conversion with purpose, expected versions and an idempotency key.
2. M017 freezes the referenced party, lead, opportunity and policy versions.
3. M018 decides whether a canonical Client relationship exists or may be activated under its policy.
4. M021 may create/reuse a ServiceOrder only under its own approved catalog/quote/acceptance rules.
5. M022 may create a CaseFile only when its owner invariants and human authorization are satisfied.
6. M017 records typed outcomes or failure references. `won` alone creates none of these facts.

### 6.4 Review a 360-degree relationship

The CRM composes identity-safe summaries from authorized owners. Each card declares source,
freshness and access state. Drill-downs reauthorize in the owner. Unavailable data is not shown as
zero, absent, paid or completed.

`unknown` is a separate business-fact state: the owner answered authoritatively but has not
established the fact. `not_applicable` means approved policy says the fact does not apply. Both are
distinct from absent, zero, denied, unavailable and incomplete coverage and survive API/UI mapping
without conversion to `complete`. An unknown prerequisite cannot satisfy conversion.

### 6.5 Resolve a duplicate candidate

1. Deterministic matching emits reasons and confidence without exposing raw lookup values.
2. An authorized reviewer compares permitted fields and related-record impact.
3. The reviewer may mark distinct, defer, or request resolution from the typed canonical owner:
   M018 for Person/Client, M019 for Organization, or M020 for Lead-ingress identity.
4. A high-risk merge requires current versions, dry-run impact, explicit conflicts and an approved
   authority policy.
5. Alias/tombstone and audit/recovery evidence remain; no rows are silently discarded.
6. An Opportunity duplicate uses a separate M017 preview/execute contract. The reviewer may keep
   both, link them as related, or explicitly supersede one commercial record under `CRM-012/013`;
   this never implies a Person/Client merge and preserves both histories. The dry-run enumerates both
   exact purpose bindings/epochs plus every known conversion receipt, M021 ServiceOrder, M022
   CaseFile, M023 Task, quote, payment, entitlement and approval ref/version. It never rewires owner
   facts or attribution. Incompatible downstream effects block to manual review. `superseded` loses
   conversion authority. `related` members remain independently authoritative when their immutable
   `canonicalCommercialIntentRef/version`, service/scope or owner-effect identity differs; the same
   intent/effect deduplicates to one receipt. `keep_both` creates no blocking relation.

### 6.6 Import or export data (Release 1B)

Imports pass through quarantine, scanning, mapping preview and row-level validation. Exports are
server-created from the actor's authorized dataset, neutralize spreadsheet formulas, expire and are
audited. Neither workflow may manufacture consent or overwrite verified facts implicitly.

## 7. States and transitions

### 7.1 CRM relationship and purpose binding

The identity-neutral root state is only `current | superseded`; `superseded` requires approved
canonical-resolution evidence and retains a non-authoritative alias/tombstone. Each purpose binding
has access lifecycle `proposed → active | rejected`; active may become `expired | revoked |
superseded`. Rejected proposals never become ordinary CRM authority and a later attempt requires a
new proposal/version under policy. The binding has a separately approved commercial engagement
lifecycle proposed as `prospect | active_relationship | dormant | archived`.
These codes are not Client/service/contactability states. Contactability is a fresh M078/M026 owner
projection and is never persisted as an M017 boolean. One binding's lifecycle never changes another.
`prospect|active_relationship` may coexist with active Opportunities. Entry into `dormant|archived`
is blocked—not queued—while the exact binding owns an active Opportunity, an actionable current
disposition, or a conversion, merge, Opportunity-resolution, pipeline-migration or import owner
effect whose durable receipt is pending/ambiguous/recovery-required. The transition final-fences the
complete server-derived Opportunity/operation inventory and their versions, binding access epoch and
current next-action version. Reactivation is an explicit audited transition; when no active
Opportunity owns the work, it atomically creates an approved owner/queue plus successor next action
or fails. Archive/dormancy never cancels or rewrites an Opportunity or downstream owner fact.

Binding authorization ends immediately when authoritative evidence/consent is withdrawn or its
effective interval expires; active child work never delays access revocation. The same transition
final-fences the complete child Opportunity/action/high-risk-operation inventory, advances the access
epoch and atomically marks affected Opportunities/actions `binding_access_ended`, freezes ordinary
mutation/conversion and creates a quarantined remediation operation/history/event. Voluntary
revoke/supersede is blocked until an approved closed disposition plan can apply atomically;
unavoidable owner-triggered revoke/expiry wins the race and uses quarantine. A separate enhanced,
SoD-gated remediation capability may later close/transfer/preserve work under CRM-003/007/015; it
cannot restore access or bypass new binding evidence.

### 7.2 Opportunity

Proposed commercial-opportunity lifecycle:

```text
draft → open → proposal_or_quote → won
  │       │              │
  └───────┴──────────────┼→ lost
                         └→ cancelled

closed terminal record → reopened (audited, policy-gated)
```

The exact stages and names are `CRM-006`. A pipeline may define commercial preparation stages, but
they cannot reuse `qualified|unqualified|disqualified` as authoritative status codes. Those are
M020 `LeadQualificationOutcome` values. M017 consumes a read-only, versioned qualification handoff
containing outcome, permitted structured evidence refs and M020 source version; a later M017
Opportunity stage/outcome never writes or cascades to it. A lead can remain qualified while its
opportunity is lost/cancelled/reopened. Opportunity status semantics
remain stable and versioned. `won` means an approved commercial outcome only; it does not mean paid,
entitled, authorized to start or completed.

### 7.3 Assignment and next action

- Purpose-binding/Opportunity assignment: `unassigned | assigned | reassignment_pending |
  inactive_owner_exception`.
- Next action: `required | scheduled | completed | deferred | blocked | not_required`.
- Active purpose bindings with no active Opportunity, and all active opportunities, cannot silently lack an owner/queue plus either an
  actionable `required|scheduled` future disposition or an explicit policy-gated `deferred|blocked|
  not_required` exception. `completed` alone never satisfies the invariant.
- Disabled/deactivated staff trigger deterministic requeue/reassignment review, not silent transfer.
- `NextActionDisposition` includes approved action-type code, `dueAt` as a UTC instant, display IANA
  time zone, responsible owner or queue, optional concrete M023 `Task` reference, status, reason,
  source/policy version, typed target ref/purpose binding and expected target version. An optional
  M023 Task link carries an exact `TaskRef`/version plus an M023-owner-issued, versioned
  `TaskRelationshipAuthorizationReceipt` binding that Task to the exact CRM target, stable logical
  purpose, classification, authorized owner/queue and current Task access epoch. The receipt is
  required on create, replace, complete, history and query; it references rather than duplicates Task
  lifecycle/evidence. A Task correction, deletion, reassignment or access-epoch change supersedes or
  clears the minimized link through an owner event without mutating Task. Unauthorized or stale Task
  context fails generically without revealing Task existence, assignee or due date. `not_required`,
  `deferred` and `blocked` require approved reason/policy;
  `completed` cannot complete an attached M023 Task without an M023 owner command. Completing the
  current disposition must in one CAS/idempotent command create its successor `required|scheduled`
  disposition or enter an approved exception/terminal work state; history preserves the completed
  item, but it is never the current actionable slot.
- The target is explicitly `CrmPurposeBinding | Opportunity`. A newly accepted relationship can have
  one independent current follow-up per active purpose binding before an Opportunity exists. A
  uniqueness/non-overlap invariant plus CAS protects `(relationship, purposeBinding)`. Opportunity
  creation atomically final-fences the binding/action versions and either links/supersedes that action
  into the new Opportunity with reason/history or fails; it never silently deletes it. While an active
  Opportunity owns follow-up for that binding, the binding is exempt from a second current-action
  slot. Closing without another active Opportunity atomically establishes the binding's successor
  action/approved exception/terminal engagement state. Reopen reverses the handoff with exact
  versions. Multiple active Opportunities require separately justified non-duplicating workstreams
  under `CRM-008`, not duplicate copies of one action.

### 7.4 Duplicate candidate

Party/relationship candidate: `detected → pending_review → distinct |
canonical_resolution_requested → resolved | blocked`. Opportunity candidate: `detected →
pending_review → distinct | opportunity_resolution_requested → superseded | resolved | blocked`.
`merged` is never a scoring outcome. Party/relationship canonical resolution is an owner command;
Opportunity resolution is an M017-owned, non-destructive explicit supersession/consolidation policy.
Neither happens automatically.

### 7.5 Import/export jobs

- Import: `quarantined → scanned → validated → mapped → previewed → approved → applying →
  completed | partially_completed | rejected | compensation_pending | compensated |
  partially_compensated | recovery_required`. `compensated` is allowed only when durable owner
  receipts prove every applied effect was reversible and reversed; it never means history vanished.
- Export: `requested → authorized → generating → available → downloaded | expired | revoked |
  failed`.
- Unknown, stale or restored state fails closed and reconciles; it is not retried as a new request.

### 7.6 Derived relationship indicator

A future Contact 360 indicator may express `new | engaged | active_client | inactive | at_risk |
former_client | blocked`, but it is a versioned, explained commercial/operational projection under
`CRM-008`, not the M017 lifecycle and not a credit, financial, fraud or eligibility score.
`active_client` must come from an authorized M018 fact; missing/partial inputs yield
`unavailable|partial`, not an inferred label.

## 8. Business rules

1. One natural person is represented canonically by M018 Person, not by one row per service/channel.
2. M017's contact is a CRM relationship/facade referencing that person; contact methods remain
   canonical with the party owner and are projected only as permitted.
3. Lead, contact relationship, client, opportunity, order and case are distinct facts.
4. Email/phone equality is evidence for review, not proof of identity, consent or access.
5. Every write requires actor, purpose, expected version and audit context; retryable writes require
   semantic idempotency.
6. Active work has one accountable owner or explicit unassigned queue and a current actionable
   future next action or approved exception; a completed action without successor is a follow-up gap.
7. Pipeline transitions are versioned; historical records retain the pipeline/stage definition used.
8. Closing or reopening requires structured reason; losing a sale never deletes the person/history.
9. Original attribution is immutable; latest attribution is separately versioned. Only allowlisted,
   minimized campaign/UTM identifiers are accepted.
10. Marketing communication requires current M078 consent and M026 channel preference/opt-out at
    send time.
    CRM tags, historical consent or prior contact never authorize delivery.
11. CRM notes are internal, typed, purpose-bound and excluded from Client DTOs, analytics and broad
    search snippets. A note is not a task, message, audit event or source of client-visible truth.
12. CRM activity stores typed references and minimized summaries; canonical owner data remains in
    its module and is re-read for detail.
13. No name-only or AI-only automatic merge. No automatic overwrite of a verified canonical fact.
14. Conversion is independently authorized by every affected domain and uses the complete high-risk
    semantic idempotency contract in section 11.
15. `won`, `paid`, `entitled`, `approved_to_start`, `in_progress` and `completed` never collapse.
16. Imports do not create consent, change verified identifiers or execute communications implicitly.
17. Exports contain only current row/field-authorized data and never full card data, secrets,
    credential material or unrestricted Highly Sensitive documents.
18. Tags/custom fields are governed definitions with owner, purpose, classification and lifecycle;
    arbitrary fields cannot become shadow policy or access control.
19. AI/scoring/rules may suggest or prioritize only within approved policy; consequential decisions
    remain human and explainable.
20. A household/company/partner relationship does not grant access to another person's CRM record.
21. One CRM root may support several purpose/service bindings. No root-level purpose, “primary
    interest” or secondary service becomes a permission/consent shortcut; every field/action/query
    selects and authorizes one exact binding/effective period/access epoch. An explicitly approved
    cross-binding orchestration instead enumerates, final-fences and independently authorizes the
    complete closed binding set; partial authorization fails the whole operation.

## 9. Authorization rules

Authorization is enforced in application/domain services and Postgres RLS; UI visibility is not a
control. Actor context is a closed union:

- `HumanActorContext`: Supabase-authenticated account, active application session, assurance,
  membership, permissions/role/team/assignment/grants/access epochs, purpose, classification and
  recovery generation.
- `WorkloadActorContext`: a closed union of one-use, short-lived signed command capabilities. Every
  variant inherits a mandatory `WorkloadCapabilityEnvelope`: environment, SG organization, issuer,
  audience, service, exact method/action, `iat`, `nbf`, `exp`, signing-key ID/version, recovery epoch
  and nonce. The verifier and accepted key ring are pinned per environment + audience + action. The
  normal variant additionally binds the exact canonical target/root set, the closed set of active
  `CrmPurposeBinding` refs plus each access epoch, normalized command/payload digest, expected resource
  versions, idempotency namespace/key, immutable source receipt/event and schema/policy/recovery
  versions, timestamp and nonce. Every bound value is derived from the immutable server-side source
  receipt; a handler rejects client/job overrides. It cannot call list/search/count/detail/export/
  merge or discover existence. A human-initiated derivative additionally binds the original actor,
  purpose and authorization receipt and revalidates them before the sensitive effect.
- `LeadHandoffBootstrapCapability`: the only pre-binding workload variant. In addition to the common
  envelope, it is bound to one
  immutable M020 handoff receipt, exact Person-resolution ref/version, proposed purpose/service and
  evidence refs, `acceptLeadHandoff`, normalized payload digest, expected owner/policy/recovery
  versions, idempotency namespace/key, timestamp and nonce. It may only create/reuse the identity-
  neutral CRM root and create/reuse a `proposed` purpose binding. It cannot activate a binding,
  authorize contact, infer consent, query/disclose existence or invoke any other command. Normal
  active-binding capabilities apply only after an independently authorized binding activation.

Every human request evaluates:

- Supabase-authenticated identity and active session;
- authentication/session epochs and required assurance;
- active organization membership;
- permission, role, team and assignment scope;
- explicit resource grants/access epochs where applicable;
- declared purpose and classification clearance;
- field/action-specific policy and current resource version.

### Required properties

- Default deny and fail closed on missing/unknown scope.
- Every read/write/RLS/final fence evaluates trusted server time against the binding's half-open
  effective interval `[effectiveStart, effectiveEnd)`. At `now >= effectiveEnd`, authority is denied
  immediately even if an expiry job/event/status update is delayed; client clocks grant nothing.
- List/query authorization occurs before pagination/counts to prevent enumeration.
- Detail, mutation, export, merge and drill-down reauthorize independently.
- Owner/admin labels do not automatically mean unbounded all-client access; exact scope is `CRM-007`.
- Internal notes and sensitive contact/profile fields use separate permissions and DTOs.
- Export, merge and protected-field reveal require enhanced review and, when approved,
  step-up assurance/reason/short-lived authorization.
- A protected-field reveal response separates transient field values from an opaque M077 audit
  receipt reference. Values are never written to M017, logs, traces, events, caches, analytics,
  replay or the audit payload. The server calls the M077 protected-access audit port for allowed,
  denied and failed attempts with actor/resource/field-class/reason/assurance/outcome/time/policy/
  correlation metadata only. An audit receipt is evidence, not a capability, and cannot replay the
  value. Compliance history is read only through an independently authorized M077 projection;
  denial/attempt queries do not live in M017 and cannot disclose target or field existence.
- Cache/search/index keys include the complete canonical authorization fingerprint or store only
  non-reusable opaque owner references; revocation/access-epoch changes purge or miss immediately.
- Public/channel adapters may submit bounded idempotent commands but cannot query CRM existence.
- Contact, activity, attribution, opportunity, owner or tag relationships never confer client access.
- Browsers cannot mint or send `WorkloadActorContext`. Cross-environment/organization, wrong issuer/
  audience/service/action/key version, not-yet-valid/expired
  proof, target/root, purpose binding/access epoch, payload digest, expected version or idempotency
  scope; duplicate nonce; revoked source receipt; or stale recovery generation fails closed. RLS
  claims are derived server-side from that exact capability. The nonce is consumed atomically with
  the idempotency reservation, domain mutation, outbox record and M077 audit event; a crash cannot
  leave a reusable capability with a committed effect. Every accepted/denied command identifies the
  workload and original actor when applicable; there is no generic “trusted worker” bypass.
- Bootstrap handoff proofs reject a changed M020 receipt, Person resolution, proposed binding,
  evidence, payload, key, epoch or nonce. Their nonce/reservation/root-and-proposal mutation/outbox/
  audit commit atomically and return a generic created/reused/candidate/blocked receipt.

### Conceptual permission families

Exact permission codes and grants remain `CRM-007`; the implementation must distinguish at least:

| Action family | Separate capability required | Additional constraints |
|---|---|---|
| Relationship list/read | yes | team/assignment/resource/purpose/field scope; no generic root update |
| Relationship bootstrap create/reuse | bootstrap-only | exact immutable M020/Person/purpose evidence; generic result |
| Purpose-binding propose | separate | exact relationship/purpose/evidence; creates proposed only |
| Purpose-binding proposal review/reject | separate | exact proposed binding/version, immutable owner evidence, reason and no ordinary CRM access |
| Purpose-binding activate/revoke/expire/supersede | enhanced separate capability | exact binding/epoch/version, approved evidence/reason and fresh assurance where policy requires |
| Binding/Opportunity assignment/reassignment | separate | exact binding/opportunity, allowed destination, reason and expected versions |
| Opportunity read/create/update/transition/close | yes | relationship/service/stage policy and current version |
| Activity append / internal note read-create-supersede | separate capabilities | exact binding/target/version, note type, classification and encrypted-field permission |
| Internal-note redaction/retention disposition | enhanced destructive capability, separate from read/create/supersede | exact note revision/target/binding epoch, current assurance, approved authority/reason, SoD, CRM-010/022 plus M085 retention/deletion/legal-hold final fence and durable disposition receipt |
| Protected contact-field reveal | enhanced separate read capability | exact M018 field refs, active binding/epoch, classification, current assurance/reason, no-store and audit |
| Optional M023 Task link | separate relationship-link capability | exact Task ref/version, owner-issued target/purpose/visibility/classification receipt and current Task access epoch; correction/reassignment/revoke invalidates |
| Optional M019 Opportunity organization context | separate owner-projection capability | exact Person-Organization relation/version/effective interval/classification/access receipt; every org-dependent read/effect final-fences current owner authority |
| Attribution write | separate | exact binding, immutable owner-source receipt and expected version |
| Pipeline/source/tag/custom-field/list/segment configuration | yes | configuration role, immutable versioning, schema/classification and audit |
| Assignment-rule preview/publish/evaluate/apply | separate configuration/evaluation/apply capabilities | CRM-014, exact immutable rule and eligible queue/workload snapshot versions, fairness explanation, per-target CAS, no general bulk mutation |
| Pipeline-version migration | enhanced concrete batch capability | CRM-006/007, side-effect-free preview, per-Opportunity binding auth/CAS, SoD and recovery receipt |
| Duplicate review | yes | permitted comparison fields; cannot imply merge |
| Canonical merge execution | enhanced separate capability | dry-run, reason, assurance and approved review policy |
| Opportunity duplicate resolution | enhanced separate capability | exact candidates/versions, dry-run, reason, preservation plan and recovery receipt |
| Conversion execution | enhanced separate capability | each target owner independently authorizes |
| Data-quality evaluate / assign-defer-resolve | separate capabilities | typed subject/owner receipt, ruleset, expected version and reviewer scope |
| Import preview/apply | enhanced separate capabilities | M011 acceptance, mapping and apply roles separated when approved |
| Import reconcile/compensate | enhanced separate capabilities | read-only reconcile vs owner-command path, approved plan, exact owner versions, assurance and SoD |
| Export | enhanced separate capability | dataset/field grant, reason, assurance, TTL and audit |
| Retention/legal-hold disposition orchestration | enhanced destructive capability, separate apply/release/query | CRM-022 + M085/legal receipt, exact closed record set/current versions, hold/minimum retention/downstream/backup fences, SoD and durable per-record receipt |

Possessing one capability never implies another. `Read Only` receives no mutation capability; an
auditor can inspect only the bounded evidence authorized for the audit purpose.

## 10. Data requirements

### 10.1 Canonical ownership matrix

| Concept | Canonical owner | M017 usage |
|---|---|---|
| UserAccount/session/role/grant | M007/M080/M081/M091 | Authorization context only |
| Person/Household/Client/contact method | M018 | Opaque reference and authorized projection |
| Organization/business relationship | M019 | Opaque reference and authorized projection |
| Lead and capture duplicate | M020 | Read/handoff reference; no duplicate row |
| Service definition/order | M042/M021 | Requested-service ref and conversion outcome |
| CaseFile | M022 | Conversion outcome and activity reference |
| Task | M023 | Next-action task reference; M017 does not clone task state |
| Appointment/internal calendar | M013/M024 | Minimized scheduled-activity reference; no booking/calendar truth copy |
| Message/conversation | M012/M025 | Minimized content-free activity reference |
| Consent/preferences | M078/M026 | Fresh decision input; M017 stores evidence reference only |
| Payment/financial state | M014/M043/M044 | Minimized status reference; never amount/card copy unless explicitly allowed |
| AuditEvent | M077 | M017 emits events; does not own the audit ledger |
| Search/reporting | M089/M092 | Authorized projections and governed metric contracts |

### 10.2 M017-owned conceptual records

- `CrmRelationship`: ID, one concrete M018 Person ref, identity-root state (`current | superseded`), classification, source
  refs, locale/time-zone owner-projection reference plus source/version/as-of/
  freshness (never an independently editable copied preference), version and timestamps. M007 owns
  authenticated-account locale/time zone; the source/policy for unauthenticated prospects and
  canonical Person data remains `CRM-003/015`. M026 still makes a fresh delivery/quiet-hours
  decision; a CRM projection cannot authorize contact. Organization
  context is a collection of authorized M019 person-organization-relationship projections; a
  preferred display organization is a presentation preference, not authority. There is no generic
  `subjectType/subjectId` or duplicated organization relation. Any organization-only relationship is
  unresolved under `CRM-003` and is not represented by an invalid placeholder Person. Within the
  single SG Solutions organization, exactly one current/root `CrmRelationship` may exist per
  canonical Person. Concurrent channel/service creation uses a unique constraint, expected version
  and semantic idempotency; only approved `superseded` aliases are exempt and aliases never satisfy
  authorization. It holds no ordinary commercial owner/team, engagement lifecycle or single next-
  action slot; those are purpose-binding-specific. Only enhanced canonical resolution can supersede
  the identity root and it final-fences every affected binding.
- `CrmPurposeBinding`: stable `CrmPurposeBindingId`, relationship ref, stable logical purpose/service
  identity and current-version pointer. Immutable `CrmPurposeBindingVersionRef` records contain the
  applied approved definition code/version, source/evidence/
  consent refs, effective period, access epoch, binding status, commercial engagement lifecycle,
  owner/team, one optional current pre-Opportunity `NextActionDisposition`, version and classification. The root is identity-
  neutral; each Opportunity/Activity/Note/Attribution/next action binds one explicit purpose. A
  “primary purpose” is display preference only and grants nothing. Revoking one binding cannot
  remove or broaden another; M078/M026 still decides contactability per purpose + channel.
  Lifecycle is `proposed → active|rejected`, then active may become `expired|revoked|superseded`;
  activation/rejection requires approved evidence/reason policy and never follows tag, stage,
  opportunity or inferred interest implicitly.
  Renewal/definition upgrade advances this stable binding's current-version pointer and access epoch
  atomically; prior versions remain immutable evidence and no new logical binding ID is allocated.
- `Opportunity`: relationship/lead/service refs plus optional concrete, versioned M019
  `PersonOrganizationRelationshipRef` accompanied by the M019-owner-issued current relationship/
  visibility/purpose receipt, effective interval, classification and access epoch, one immutable
  stable `CrmPurposeBindingId`, the immutable
  binding-version ref under which it was created as evidence, plus the resolved current binding
  version/access epoch at each command, pipeline/stage definition versions, status,
  optional estimated-value integer minor units/currency, optional commercial probability as integer
  basis points `0..10000` plus closed source kind `manual|approved_rule|approved_model`, exact source
  definition/artifact ref+version, source `asOf`, explanation/freshness and immutable change-history ref,
  optional expected-close date, owner, priority, typed next-action disposition/ref, close reason, conversion
  refs, immutable server-derived `canonicalCommercialIntentRef/version`, version and timestamps.
  Value/probability/date are commercial estimates only, never invoice,
  payment, accounting or eligibility facts, and remain gated by `CRM-005/006/020`.
  Missing probability is `unknown`, never zero. Rule/model output cannot write it directly; an
  ordinary allowlisted command under CRM-006/008/019/020 reauthorizes and records provenance.
- `OpportunityCommercialEstimateHistory`: append-only Opportunity prior/resulting versions,
  changed allowlisted estimate field, prior/resulting bounded value or `unknown`, currency/source
  kind/ref/version/as-of/explanation/freshness, actor/reason/policy and effective time. It commits
  atomically with the Opportunity pointer, event/audit/outbox and is not a financial/eligibility fact.
- `OpportunityRelation`: immutable/versioned M017 authority for an approved Opportunity-duplicate
  outcome. It stores a closed relation kind `related|superseded`, ordered exact Opportunity refs and
  versions, survivor/source refs where applicable, stable group ID, effective interval, decision/
  recovery receipt, policy version and current-pointer metadata. Superseded Opportunities remain
  non-authoritative aliases for history only. The aggregate forbids self-links, cycles, overlapping
  contradictory relations and silent unlink/edit; a correction appends a new approved version and
  preserves the prior relation. Conversion, close/reopen and query authorization final-fence the
  complete current relation group after a `DuplicateCandidate` leaves review state; the candidate is
  workflow evidence, not durable commercial-relation authority.
  A `superseded` source cannot start conversion. A `related` member retains independent authority;
  cross-member effect dedupe applies only when canonical commercial intent/version plus owner-effect
  identity/service/scope are equal. `keep_both` creates no `OpportunityRelation`.
- `PipelineDefinition` / `PipelineStageDefinition`: immutable versions, order, transition policy,
  required fields, terminal mapping and activation interval.
- `OpportunityStageTransitionHistory`: append-only Opportunity ref/version, from/to Pipeline/
  StageDefinition IDs and versions, typed transition/close/reopen outcome, structured reason/evidence
  refs, actor/workload/original-actor context refs, effective time, policy version and resulting
  Opportunity version. It commits atomically with Opportunity CAS/current pointer plus audit/outbox;
  `CrmActivity`/M077/outbox never substitute for this business-state ledger.
- `CrmAssignmentHistory`: a closed discriminated target (`CrmPurposeBindingRef | OpportunityRef`)
  backed by concrete foreign keys plus an exactly-one constraint—not a weak owner-type/owner-ID
  pair—target prior/resulting versions, old/new owner/team, reason, actor, policy version and
  effective interval.
- `CrmEngagementLifecycleHistory`: append-only purpose-binding ref, prior/resulting engagement
  state, complete active-Opportunity/high-risk-operation inventory digest plus exact versions,
  binding/next-action prior and resulting versions, actor, structured reason, policy version and
  effective time. It commits atomically with the binding current pointer, audit and outbox.
- `CrmNextActionHistory`: append-only closed target (`CrmPurposeBindingRef | OpportunityRef`), prior/
  resulting target versions, prior/resulting disposition refs/status/due/owner-or-queue, optional
  concrete M023 Task ref+version and owner-issued relationship-authorization receipt/version/access
  epoch, successor/supersession link, actor, structured reason, policy
  version and effective time. It is the transition ledger; the current slot is only a pointer.
- `CrmActivity`: typed CRM-authored event or minimized external reference, direction, channel/type,
  occurred-at, actor/source, visibility and canonical owner reference; never arbitrary copied body.
- `CrmInternalNote`: encrypted body boundary, type, purpose, author, scope, version, retention class
  and supersession metadata.
- `CrmConversionPlan` / `CrmConversionReceipt`: closed versioned DAG of deterministic owner step IDs,
  each step's owner/action, prerequisite step IDs plus allowed outcome predicates, whether `reused`
  satisfies each dependency, expected owner/resource/policy versions, stop/skip reason and durable
  `not_started|ready|dependency_blocked|accepted|reused|blocked|conflict|unavailable|ambiguous`
  outcome. The plan version/digest is approved with preview and immutable during execute/recovery.
  Client, ServiceOrder and CaseFile order is expressed here according to CRM-004/005; no downstream
  step runs from an ambiguous/blocked/unavailable prerequisite and no generic compensation assumes
  an accepted downstream fact can be reversed.
- `CrmSourceAttribution`: immutable original source plus versioned latest touch, allowlisted channel,
  campaign/source refs, captured-at, consent/evidence ref and retention category.
- `CrmTagDefinition` / `CrmTagAssignment`: governed purpose/classification/lifecycle and assignment.
- Future `CrmCampaignDefinition`, `CrmCustomFieldDefinition`, `CrmCustomFieldValue`,
  `CrmSavedViewDefinition` and `CrmListDefinition`: governed versioned metadata only after
  `CRM-011/016`; campaign delivery/consent and M089 search/M092 reporting remain with their owners.
  A dynamic list stores an authorized versioned query definition; a static list stores governed
  members of exactly one declared list target kind: `CrmPurposeBindingRef` or `OpportunityRef`.
  Mixed target kinds are prohibited unless CRM-016 explicitly defines a separate list schema/version.
  Neither stores dynamic result snapshots, grants access or authorizes contact.
- Future `CrmCampaignDefinition` is metadata only: immutable versioned name/code, purpose,
  classification, owner, allowed audience-definition ref, content/delivery owner refs and effective
  interval. M025/M026/M078 remain delivery, preferences and consent authorities. Publishing campaign
  metadata cannot select recipients, contact anyone, prove consent or persist message content.
- Future `CrmSegmentDefinition`: immutable versioned query/rule definition with owner, purpose,
  classification, approved source/field registry, effective interval and explanation metadata. It
  stores no authoritative member snapshot, contact permission or eligibility conclusion; evaluation
  is an authorized, as-of projection.
- Future `CrmAssignmentRuleDefinition` / `CrmAssignmentEvaluationReceipt`: immutable versioned
  eligible-purpose/queue/team criteria, deterministic ordering/round-robin cursor policy, workload
  input source/version/as-of, fairness/exclusion explanation, preview digest, per-target result and
  recovery receipt. A rule never grants resource access, creates a user/team, overrides an explicit
  protected assignment or performs a generic mass update.
- Future `CrmAutomationRuleDefinition` / `CrmAutomationExecutionReceipt`: immutable versioned closed
  trigger/condition/source/action-port definition, purpose/classification, bounded retry/fallback,
  per-target expected versions, explanation and per-step outcome. Only CRM-019-approved low-risk
  actions exist; a prompt/model output cannot define or select the executable rule/action.
- Future `CrmScoringDefinition` / `CrmScoreEvaluation`: immutable versioned allowlisted input refs,
  prohibited proxy registry, deterministic formula/model artifact ref, purpose, output band,
  explanation/freshness, fairness-evaluation receipt and human override/supersession lineage. It is
  a commercial prioritization aid only, never creditworthiness, eligibility, M020 qualification or
  service authorization.
- Future `CrmAiToolDefinition` / `CrmAiProposal`: versioned narrow read/proposal tool schema,
  allowlisted/prohibited fields, purpose/classification, model/prompt/policy versions, source refs,
  expiry, proposed diff/consequences, human decision and correction/supersession lineage. Approval
  never executes from the proposal row; the owner performs a fresh ordinary command.
- Future `CrmSearchProjectionEnvelope`: M017-produced/M089-consumed minimized envelope with exact
  source aggregate/version, stable logical purpose, binding ref/version/access epoch,
  classification, allowlisted non-body searchable fields, correction/supersession and invalidation
  state. It contains no contact value, note/message/document body, protected match token or hidden
  count. M089 owns index/query behavior and must reauthorize before match/count/result.
- Future `CrmReportingFactEnvelope`: M017-produced/M092-consumed versioned fact with closed fact type,
  grain, opaque aggregate/transition ref+version, purpose/classification, occurred/effective/as-of
  times, allowlisted dimensions/measures, correction/supersession/replay identity and retention.
  It contains no direct identifier/free text. M092 owns metric definitions, minimum aggregation,
  viewers and reports; a fact/event alone is not a metric or business ledger.
- Pipeline/stage, source, campaign, tag, custom-field, list, segment, assignment-rule, automation-
  rule, scoring and AI-tool definitions follow `draft → published → retired`. Drafts may change
  only by versioned CAS. A published version is immutable and never deleted/edited; retirement at an
  effective time blocks new use but preserves authorized historical code/label/meaning. Active
  Opportunities finish under their applied pipeline/stage version unless a separately approved,
  dry-run, expected-version migration appends history and preserves old meaning. Existing attribution
  and metadata assignments retain their applied definition/version; retirement neither erases nor
  silently remaps them. Every lifecycle service uses separate `createDraft`, `reviseDraft`,
  `publishVersion` and `retire` commands. Publish accepts the exact approved draft/version and final
  registry/dependency versions; retire accepts an exact published ID/version, reason, effective time
  and current-usage inventory. A stale draft, registry, usage inventory or concurrent publish/retire
  fails atomically. No union-style method signature or mutable published row is permitted.
- `DuplicateCandidate`: closed kind/target union: `party_relationship` has concrete ordered M018/M019/
  M020/CrmRelationship refs and routes resolution to its canonical owner; `opportunity` has concrete
  ordered Opportunity refs and routes a non-destructive M017 disposition under `CRM-012/013`. It
  carries match reason codes, keyed-token versions, score band, immutable candidate identity/policy
  version, reviewer outcome, staleness/supersession and typed resolution request/receipt. Candidate
  identity uses kind + ordered opaque refs + ruleset version + stable owner-evidence receipt/version
  or minimized keyed evidence-epoch/digest, never raw protected values. Materially new evidence under
  the same ruleset creates a new candidate linked by `supersedesCandidateRef`; the prior `distinct`
  decision remains immutable.
- `CrmDataQualityIssue`: type (`missing_required|invalid_format|canonical_conflict|stale_source|
  invalid_source|other_approved`), severity and a closed `QualitySubjectRef`. M017 subjects use
  concrete `CrmRelationshipRef | OpportunityRef | CrmAttributionRef | CrmMetadataAssignmentRef |
  CrmImportRowRef`; external subjects use an owner-issued typed opaque ref + owner module/contract/
  resource type/version receipt validated through that owner's registry. Exactly one subject variant
  is required and each is independently authorized. It also stores minimized evidence reason codes,
  lifecycle, assignee/reviewer, detected/rechecked
  times, policy version and owner-resolution receipt. It never stores/corrects the canonical fact.
  Duplicates are excluded: `DuplicateCandidate` is their sole lifecycle/decision authority. The data-
  quality UI may show a read-only 1:1 reference/projection, never a second issue/assignment/result.
- `CrmMergeOperation`: high-risk orchestration record, dry-run graph, conflicts, expected versions,
  decision, alias/tombstone/recovery references; never raw secret values.
- `CrmImportJob` / `CrmImportRowResult`: future records with a closed `ImportRowEffect` union and
  immutable mapping/preview/effect version. Allowed variants are `submit_new_lead_to_m020`,
  `propose_binding_for_existing_relationship`, `create_opportunity_for_existing_binding`,
  `record_attribution`, `assign_tag` and, only after CRM-016, `set_custom_field`. Each carries the
  exact canonical owner/root/binding/definition/current-action refs, versions and epochs required by
  its ordinary owner command plus per-step receipt/recovery state. No generic row patch exists.
  New people/contact rows first invoke an approved M020 intake/resolution port; only an accepted M020
  handoff receipt may invoke the same one-use bootstrap path and it creates at most a `proposed`
  binding—never active access, consent or Client state. Existing-row variants reuse the corresponding
  M017 contract and invariants; Opportunity rows use `OpportunityService.create` and its action
  handoff/root-inventory fence. Canonical M018/M019/M020 facts are never overwritten by import.
- `CrmExportRequestIntent` and `CrmExportJob`: future, bounded and encrypted/reference-only where
  required; source file/delivery bytes remain under M011. Each
  export intent is a server-issued, versioned actor/account-owned request root. Its delivery
  capability is additionally session/assurance-bound and is never shared or reused across actors.

### Activity/source registry boundary

The source requests form, chat, WhatsApp, voice, secure message, email, appointment, task, quote,
payment, order, case, document, profile, partner and manual history. M017 represents them as a
closed, versioned registry:

- M017 owns only manually recorded commercial call/contact attempts and CRM relationship/
  opportunity/assignment/note lifecycle activities.
- Other modules publish a minimized typed reference with semantic code, canonical owner, source
  event/version, occurred time, freshness/classification and optional authorized route.
- A title/summary is generated from approved localized parameters, never copied from a message,
  transcript, document filename/body, provider payload, protected profile fact or payment detail.
- Duplicate/delayed owner events deduplicate on owner event identity/version. Corrections supersede
  the projection while preserving provenance.
- A missing/unavailable owner produces partial/unavailable timeline state, not “no activity.”

### Contact 360 section registry and projection ports

`sections` is not free-form. The versioned registry is closed to
`identity_summary|lead_qualification|client_status|organizations|service_orders|cases|tasks|
appointments|documents|payments|communications|consent_contactability|crm_opportunities|
crm_activities`. Each code maps to exactly one owner contract and an allowlisted minimized DTO:

| Section | Owner | Exact input fence | Allowed result |
|---|---|---|---|
| `identity_summary` | M018 | Person/root ref+version, binding/epoch, owner field-access receipt | display identity, preferred contact labels and opaque drill-down route |
| `lead_qualification` | M020 | Lead ref+version, qualification outcome/version, binding/epoch and M020 scope receipt | structured outcome, permitted evidence refs, source/as-of/freshness and opaque route |
| `client_status` | M018 | Client ref+version, relationship/binding/epoch and owner access receipt | minimized formal-client status and route |
| `organizations` | M019 | exact person-organization relationship refs/versions/effective intervals and owner access receipts | authorized relationship labels/roles/status and per-item route |
| `service_orders` | M021 | exact Order refs/versions plus client/binding/entitlement access receipts | minimized order status/next-step and route |
| `cases` | M022 | exact Case refs/versions, case grant/access epoch and binding receipt | minimized case status/next-step and route |
| `tasks` | M023 | exact Task refs/versions, Task relationship/visibility receipt/access epoch | minimized task status/due/owner and route |
| `appointments` | M013 | exact Appointment refs/versions and owner access receipt | minimized appointment status/time-zone/channel and route |
| `documents` | M011 | exact Document refs/versions and document grant/access epoch | metadata-only status/classification and route; no content or URL |
| `payments` | M014/M043–M044 | exact internal payment/invoice refs/versions and current owner access receipt | minimized operational status/amount/currency and route; no provider payload/card data |
| `communications` | M012/M025 | exact conversation/message-thread refs/versions and access receipt | metadata-only channel/status/unread indicator and route; no body |
| `consent_contactability` | M078/M026 | exact purpose/channel consent and preference receipt versions/as-of | closed permitted/prohibited/unknown state and route; never permission inferred by M017 |
| `crm_opportunities` | M017 | exact relationship/binding/epoch, Opportunity versions and assignment scope | minimized authorized Opportunity rows and routes |
| `crm_activities` | M017 | exact relationship/binding/epoch, Activity versions and classification | minimized content-free timeline rows and routes |

Every owner port accepts only the exact owner resource refs/versions, stable logical purpose,
classification, current owner grant/assignment/access epoch, requested server-selected `asOf`,
projection-contract version and a bounded freshness budget. Every result is the closed
`OwnerProjectionResult` union `complete|partial|stale|unavailable|suppressed|denied|unknown|
not_applicable`, contains its source ref/version, owner-selected `asOf`, freshness and an opaque
reauthorized drill-down route, and cannot itself grant access. The server authorizes every requested
section independently before calling its owner. Requested-but-unauthorized sections return generic
`denied|suppressed` without existence, count, ordering or timing evidence. The aggregate remains
`partial` whenever any requested section is not complete and never upgrades missing/denied data to
`complete`. It neither fans out to unspecified owners nor copies canonical facts into M017.

The Leads list is an M020-owned qualification projection consumed through the explicit
`M020LeadQualificationProjectionQuery`; it is never inferred from relationship stage, Opportunity
status or CRM tags. Owner correction/revocation invalidates the cached projection and requires a
fresh versioned read; M017 has no command that edits or cascades M020 qualification.

### 10.3 Protected matching

Email/phone matching uses server-derived, domain-separated keyed match tokens with key/version held
outside Postgres and backups. Unkeyed hashes of low-entropy identifiers are prohibited. Display or
recovery values use approved encryption/owner projections. Search/indexing never relies on an
`_encrypted` suffix as a security claim. Encrypted internal-note bodies are not full-text indexed or
included in M089 by default. Any later protected-content search requires a separate threat model,
index-encryption/search-leakage design, retention policy and Product Owner decision.

## 11. API or service contracts

All contracts are conceptual, server-only unless explicitly exposed later, and require Build.

```text
CrmRelationshipService.list(actorContext,
  { stableLogicalPurposeServiceId, expectedPurposeRegistryVersion, requestedScope, filters, sort }, cursor)
  -> AuthorizedPage<CrmRowDtoWithExactBindingRefVersionEpoch>
CrmRelationshipService.get(actorContext, relationshipId,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch }) -> CrmDetailDto
CrmProtectedFieldService.revealContactFields(actorContext, relationshipId,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, exactM018FieldRefs,
    classification, reason, currentAssurance })
  -> NoStoreProtectedRevealResponse<TransientValues, OpaqueM077AuditReceiptRef>
M077ProtectedAccessAuditPort.recordAttempt(serverAuditContext,
  { actorRef, relationshipRef, exactFieldClassCodes, reasonCode, assuranceLevel,
    outcome: allowed|denied|failed, occurredAt, policyVersion, correlationId })
  -> OpaqueM077AuditReceiptRef
CrmRelationshipService.acceptLeadHandoff(actorContext,
  { personResolutionRef, optionalLeadRef, sourceRef, stableLogicalPurposeServiceId,
    exactPublishedAppliedDefinitionRefAndVersion, expectedPurposeRegistryAndPolicyVersions,
    evidenceRefsWithExpectedOwnerVersions, expectedRelationshipLeadAndPolicyVersions }, idempotencyKey)
  -> CrmRelationshipReceipt(created|reused|candidate_review|blocked|conflict)
CrmPurposeBindingNextActionService.createOrReplaceCurrent(actorContext, relationshipId,
  expectedRelationshipVersion, purposeBindingRef, expectedPurposeBindingVersion, purposeAccessEpoch,
  expectedCurrentDispositionVersionOrNone,
  actionableOrApprovedExceptionWithOptionalExactTaskRefVersionAnd
    M023TaskRelationshipAuthorizationReceiptVersionAccessEpochAndDestinationEligibilityReceiptVersions,
  idempotencyKey) -> MutationReceipt
CrmPurposeBindingNextActionService.completeCurrent(actorContext, relationshipId,
  expectedRelationshipVersion, purposeBindingRef, expectedPurposeBindingVersion, purposeAccessEpoch,
  currentDispositionId, expectedCurrentDispositionVersion,
  completionEvidenceAndOptionalExactTaskRefVersionAndCurrentM023RelationshipAuthorizationReceipt,
  successor: actionable_with_task_relationship_and_destination_receipts|approved_exception|terminal_handoff,
  idempotencyKey) -> MutationReceipt
CrmPurposeBindingService.propose(actorContext, relationshipId, stableLogicalPurposeServiceId,
  exactPublishedAppliedDefinitionRefAndVersion, expectedPurposeRegistryAndPolicyVersions,
  typedEvidenceRefsWithExpectedOwnerAndPolicyVersions, expectedRelationshipVersion, idempotencyKey)
  -> PurposeBindingReceipt
CrmPurposeBindingService.activate(actorContext, bindingId, expectedBindingVersion,
  typedProposalEvidenceRefsWithExpectedOwnerAndPolicyVersions, reason, idempotencyKey)
  -> PurposeBindingReceipt
CrmPurposeBindingService.revoke(actorContext, bindingId,
  expectedBindingVersion, purposeAccessEpoch, exactTriggeringOwnerReceiptAndVersion, reason,
  completeChildOpportunityActionOperationVersions,
  disposition: voluntary_closed_plan|unavoidable_binding_access_ended_quarantine,
  idempotencyKey)
  -> PurposeBindingReceipt
CrmPurposeBindingService.supersede(actorContext, bindingId,
  expectedBindingVersion, purposeAccessEpoch, exactApprovedSuccessorBindingRefAndVersion,
  exactCanonicalResolutionOrDefinitionUpgradeReceiptAndVersion, reason,
  completeChildOpportunityActionOperationVersions, approvedCutoverPlanAndDigest,
  idempotencyKey) -> PurposeBindingReceipt
CrmPurposeBindingService.expire(actorContext, bindingId, expectedBindingVersion, purposeAccessEpoch,
  trustedServerTimePolicyVersion, completeChildOpportunityActionOperationVersions,
  unavoidableBindingAccessEndedQuarantinePlan, reason, idempotencyKey)
  -> PurposeBindingReceipt
CrmBindingAccessEndedRemediationService.preview(actorContext, bindingId,
  expectedBindingVersionAndEndedEpoch, completeFrozenChildInventoryVersions, idempotencyKey)
  -> BindingAccessEndedRemediationPreview
CrmBindingAccessEndedRemediationService.execute(actorContext, approvedPreviewId,
  finalFrozenChildInventoryAndOwnerVersions,
  approvedDispositionPlanVersionAndDigestAndUnusedState,
  currentAssurance, separationOfDutiesReceipt, idempotencyKey)
  -> BindingAccessEndedRemediationReceipt(all_applied|conflict|blocked)
CrmBindingAccessEndedRemediationQuery.list|get(actorContext, exactBindingAndChildScope,
  queryOrOperationId, cursor) -> AuthorizedBindingAccessEndedStatus
CrmPurposeBindingService.rejectProposal(actorContext, proposalId, expectedProposedVersion,
  evidenceRefsWithExpectedOwnerVersions, reason, idempotencyKey) -> PurposeBindingReceipt
CrmPurposeBindingService.renew(actorContext, bindingId, expectedBindingVersion, purposeAccessEpoch,
  stableLogicalPurposeServiceId, exactReplacementPublishedDefinitionRefAndVersion,
  expectedPurposeRegistryAndPolicyVersions, replacementEvidenceRefsAndOwnerVersions,
  replacementEffectivePeriod, reason, idempotencyKey) -> PurposeBindingReceipt
CrmPurposeBindingReviewQuery.listProposed(actorContext, stableLogicalPurposeServiceId,
  expectedPurposeRegistryVersion, query, cursor)
  -> AuthorizedPage<MinimizedPurposeBindingProposalDto>
CrmPurposeBindingReviewQuery.getProposal(actorContext, proposalId, expectedBindingVersion)
  -> MinimizedPurposeBindingProposalDetailDto
CrmPurposeEvidenceInvalidationService.applyOwnerReceipt(workloadActorContext,
  bindingId, expectedCurrentBindingVersionAndEpoch,
  exactEvidenceOwnerPriorAndNewReceiptVersions, triggeringOwnerEventIdAndVersion,
  completeChildOpportunityActionOperationVersions, idempotencyKey)
  -> PurposeEvidenceInvalidationReceipt
CrmPurposeBindingService.assign(actorContext, bindingId, expectedBindingVersion, purposeAccessEpoch,
  expectedCurrentAssignmentVersion, closedDestinationRefOrExplicitUnassigned,
  ownerIssuedDestinationEligibilityMembershipTeamQueueReceiptVersionAndAsOf,
  reason, idempotencyKey) -> MutationReceipt
CrmPurposeBindingService.setEngagementLifecycle(actorContext, bindingId, expectedBindingVersion,
  purposeAccessEpoch, state, reason, completeActiveOpportunityAndOperationInventoryVersions,
  reactivationOwnerAndNextActionIfRequired, idempotencyKey) -> MutationReceipt
CrmEngagementLifecycleHistoryQuery.list(actorContext, bindingId, expectedBindingVersion,
  purposeAccessEpoch, cursor) -> AuthorizedPage<MinimizedEngagementLifecycleHistoryDto>
CrmAssignmentHistoryQuery.list(actorContext,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch, cursor)
  -> AuthorizedPage<MinimizedAssignmentHistoryDto>
CrmNextActionHistoryQuery.list(actorContext,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  currentM023TaskProjectionContractVersion, cursor)
  -> AuthorizedPage<MinimizedNextActionHistoryDto>
M023TaskRelationshipProjectionPort.read(actorContext,
  { exactTaskRef, expectedTaskVersion, exactCrmTargetRef, expectedCrmTargetVersion,
    stableLogicalPurposeServiceId, purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    expectedTaskRelationshipAuthorizationReceiptVersion, expectedTaskAccessEpoch,
    requestedAsOf, currentM023ProjectionContractVersion })
  -> OwnerProjectionResult<MinimizedAuthorizedTaskLink>
CrmNextActionTaskLinkInvalidationService.applyOwnerReceipt(workloadActorContext,
  exactDispositionAndTargetRefsAndVersions,
  originalM023TaskRelationshipAuthorizationReceiptAndVersion,
  correctedDeletedReassignedOrRevokedM023OwnerReceiptAndVersion,
  triggeringOwnerEventIdAndVersion, idempotencyKey) -> TaskLinkInvalidationReceipt

OpportunityService.create(actorContext,
  { relationshipRef, expectedRelationshipVersion, purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    expectedBindingNextActionVersion, actionHandoffReason,
    optionalM019PersonOrganizationRelationshipRefVersionEffectiveIntervalClassificationAnd
      CurrentOwnerAccessPurposeReceipt, input },
  idempotencyKey) -> OpportunityRef
OpportunityService.updateCommercialDetails(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  completeCurrentOpportunityRelationGroupVersions,
  allowlistedCommercialDetailPatchWithSourceAndCurrency, idempotencyKey) -> MutationReceipt
OpportunityService.setOrganizationContext(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  newOrExplicitlyClearedM019PersonOrganizationRelationshipRefWithCurrentOwnerReceipt,
  completeCurrentOpportunityRelationGroupVersions, reason, idempotencyKey) -> MutationReceipt
OpportunityService.transition(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, stageRef, reason,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  completeCurrentOpportunityRelationGroupVersions, idempotencyKey) -> MutationReceipt
OpportunityService.assign(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  expectedCurrentAssignmentVersion, closedDestinationRefOrExplicitUnassigned,
  ownerIssuedDestinationEligibilityMembershipTeamQueueReceiptVersionAndAsOf,
  completeCurrentOpportunityRelationGroupVersions, reason, idempotencyKey) -> MutationReceipt
OpportunityNextActionService.createOrReplaceCurrent(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  expectedCurrentDispositionVersionOrNone,
  actionableOrApprovedExceptionWithOptionalExactTaskRefVersionAnd
    M023TaskRelationshipAuthorizationReceiptVersionAccessEpochAndDestinationEligibilityReceiptVersions,
  completeCurrentOpportunityRelationGroupVersions, idempotencyKey) -> MutationReceipt
OpportunityNextActionService.completeCurrent(actorContext, opportunityId, expectedVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, currentDispositionId,
  expectedCurrentDispositionVersion,
  completionEvidenceAndOptionalExactTaskRefVersionAndCurrentM023RelationshipAuthorizationReceipt,
  successor: actionable_with_task_relationship_and_destination_receipts|approved_exception|terminal_handoff,
  completeCurrentOpportunityRelationGroupVersions, idempotencyKey) -> MutationReceipt
OpportunityService.close(actorContext, opportunityId, expectedVersion, outcome, reason,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  expectedOpportunityCurrentActionVersion, completeActiveSiblingOpportunityVersions,
  closedHandoffPlan: binding_successor_action|binding_approved_exception|
    terminal_engagement|active_sibling_exemption,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  conversionReceiptStateAndDownstreamOwnerVersions, currentOpportunityRelationGroupVersions,
  idempotencyKey) -> MutationReceipt
OpportunityService.reopen(actorContext, opportunityId, expectedVersion, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, destinationStageRef, reasonAndEvidence,
  successorOwnerAndNextActionWithTaskRelationshipAndDestinationEligibilityReceipt,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  conversionReceiptStateAndDownstreamOwnerVersions,
  currentOpportunityRelationGroupVersions, idempotencyKey) -> MutationReceipt
OpportunityService.history(actorContext, opportunityId, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  completeCurrentOpportunityRelationGroupVersions, cursor)
  -> AuthorizedPage<StageTransitionDto>
OpportunityQueryService.list(actorContext, stableLogicalPurposeServiceId,
  expectedPurposeRegistryVersion, query,
  exactCurrentM019RelationshipReceiptsForRequestedOrganizationContext, cursor)
  -> AuthorizedPage<OpportunityRowDtoWithBindingRefVersionEpoch>
OpportunityQueryService.get(actorContext, opportunityId, expectedBindingVersion, purposeAccessEpoch,
  optionalCurrentM019OrganizationContextReceiptWhenPresent,
  completeCurrentOpportunityRelationGroupVersions)
  -> OpportunityDetailDto
OpportunityQueryService.pipeline(actorContext, pipelineDefinitionVersion,
  stableLogicalPurposeServiceId, expectedPurposeRegistryVersion, query,
  exactCurrentM019RelationshipReceiptsForRequestedOrganizationContext, cursor)
  -> AuthorizedPipelineDto<AuthorizedStageCount, OpportunityRowDtoWithBindingAndAppliedDefinition>
M019OpportunityOrganizationContextProjectionPort.read(actorContext,
  { exactPersonOrganizationRelationshipRef, expectedRelationshipVersion,
    exactPersonRefAndVersion, exactOrganizationRefAndVersion, stableLogicalPurposeServiceId,
    purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    expectedOwnerVisibilityPurposeReceiptVersion, expectedOwnerAccessEpoch,
    requestedAsOf, currentM019ProjectionContractVersion })
  -> OwnerProjectionResult<MinimizedAuthorizedOpportunityOrganizationContext>
CrmOpportunityOrganizationContextInvalidationService.applyOwnerReceipt(workloadActorContext,
  opportunityId, expectedOpportunityVersion, purposeBindingRef, expectedBindingVersion,
  purposeAccessEpoch, originalM019OwnerReceiptAndVersion,
  correctedEndedOrRevokedM019OwnerReceiptAndVersion, triggeringOwnerEventIdAndVersion,
  idempotencyKey) -> OpportunityOrganizationContextInvalidationReceipt

CrmActivityService.append(actorContext,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    target: CrmPurposeBindingRef|OpportunityRef|TypedOwnerEventReceipt,
    expectedTargetOrOwnerEventVersion, typedActivityContent }, idempotencyKey)
  -> ActivityRef
CrmActivityService.supersedeFromOwnerCorrection(actorContext, activityId,
  expectedActivityRevision, originalOwnerEventReceiptAndVersion,
  correctedOwnerEventReceiptAndVersion,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    exactRootTargetAndExpectedVersions }, idempotencyKey) -> ActivityCorrectionReceipt
CrmActivityService.appendManualCorrection(actorContext, activityId, expectedActivityRevision,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    exactRootTargetAndExpectedVersions, structuredCorrectionReasonAndContent }, idempotencyKey)
  -> ActivityCorrectionReceipt
CrmActivityQueryService.list(actorContext, stableLogicalPurposeServiceId,
  expectedPurposeRegistryVersion, query, cursor)
  -> AuthorizedPage<MinimizedActivityDtoWithExactBindingEpoch>
CrmActivityQueryService.get(actorContext, activityId, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch) -> MinimizedActivityDetailDto
CrmNoteService.create(actorContext, exactTargetRef, expectedTargetVersion,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, typedCreateInput },
  idempotencyKey) -> MutationReceipt
CrmNoteService.supersede(actorContext, noteId, expectedNoteRevision, exactTargetRef,
  expectedTargetVersion,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, typedReplacementInput, reason },
  idempotencyKey) -> MutationReceipt
CrmNoteService.redactRevision(actorContext, noteId, expectedNoteRevision,
  { exactTargetRef, purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    approvedAuthorityAndReason, currentAssurance, separationOfDutiesReceipt,
    disposition: tombstone|crypto_shred, CRM010AndCRM022PolicyVersions,
    M085RetentionDeletionAndLegalHoldReceipt }, idempotencyKey) -> NoteRedactionReceipt
CrmNoteQueryService.list|get(actorContext, exactTargetRef, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, queryOrNoteId, cursor) -> AuthorizedNoteResult

PipelineConfigurationService.createDraft(actorContext, draftDefinition,
  expectedRegistryVersion, idempotencyKey) -> PipelineDraftReceipt
PipelineConfigurationService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey) -> PipelineDraftReceipt
PipelineConfigurationService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalPipelineStageAndPolicyRegistryVersions, idempotencyKey) -> PipelineDefinitionReceipt
PipelineConfigurationService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> PipelineDefinitionReceipt
PipelineConfigurationService.previewMigration(actorContext, sourceDefinitionVersion,
  destinationDefinitionVersion,
  exactOpportunityBindingRelationCandidateConversionIntentAndReceiptVersionsPerItem, idempotencyKey)
  -> PipelineMigrationPreview
PipelineConfigurationService.executeMigration(actorContext, approvedPreviewId,
  approvedMigrationPlanVersionAndDigestAndUnusedState,
  finalExactOpportunityBindingRelationCandidateConversionIntentAndReceiptVersionsPerItem,
  currentAssurance, separationOfDutiesReceipt, idempotencyKey) -> PipelineMigrationReceipt
PipelineMigrationQueryService.list|get(actorContext, exactPipelineAndOpportunityScope,
  queryOrOperationId, cursor) -> AuthorizedPipelineMigrationStatusAndItemResults
PipelineConfigurationService.reconcileMigration(actorContext, operationId,
  expectedReceiptOpportunityBindingRelationCandidateConversionVersions,
  stableAmbiguousItemStepIds, recoveryEpoch, idempotencyKey) -> PipelineMigrationReceipt
PipelineConfigurationService.resumeMigration(actorContext, operationId,
  approvedRecoveryPlanIdAndDigest,
  finalOpportunityBindingRelationCandidateConversionPipelineVersionsPerItem,
  stableProvenNotStartedItemStepIds, currentAssurance, separationOfDutiesReceipt,
  recoveryEpoch, idempotencyKey) -> PipelineMigrationReceipt
PipelineConfigurationQuery.list|get(actorContext, queryOrDefinitionId, cursor)
  -> AuthorizedPipelineDefinitionResult
CrmAttributionService.recordTouch(actorContext, relationshipRef,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch, ownerSourceReceipt },
  expectedVersion, idempotencyKey) -> AttributionReceipt
CrmAttributionService.supersedeFromOwnerCorrection(actorContext,
  attributionTouchId, expectedAttributionRevisionAndCurrentPointer,
  originalOwnerSourceReceiptAndVersion, correctedOwnerSourceReceiptAndVersion,
  relationshipRef, expectedRelationshipVersion, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, expectedSourceDefinitionVersion,
  idempotencyKey) -> AttributionCorrectionReceipt
CrmAttributionService.invalidateTouch(actorContext,
  attributionTouchId, expectedAttributionRevisionAndCurrentPointer,
  originalOwnerSourceReceiptAndVersion, revokedOwnerSourceReceiptAndVersion,
  relationshipRef, expectedRelationshipVersion, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, reason, idempotencyKey)
  -> AttributionInvalidationReceipt
CrmAttributionQuery.getSummary(actorContext, relationshipRef, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch) -> MinimizedAttributionSummaryDto
CrmAttributionQuery.listHistory(actorContext, relationshipRef, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, cursor) -> AuthorizedPage<MinimizedAttributionTouchDto>
CrmSourceDefinitionService.createDraft(actorContext, draftDefinition,
  expectedRegistryVersion, idempotencyKey) -> SourceDefinitionDraftReceipt
CrmSourceDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> SourceDefinitionDraftReceipt
CrmSourceDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalSourceAndAttributionRegistryVersions, idempotencyKey) -> SourceDefinitionReceipt
CrmSourceDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> SourceDefinitionReceipt
CrmSourceDefinitionQuery.list|get(actorContext, queryOrDefinitionId, cursor)
  -> AuthorizedSourceDefinitionResult
CrmCampaignDefinitionService.createDraft(actorContext,
  metadataOnlyDraftPurposeClassificationAndOwnerRefs, expectedRegistryVersion, idempotencyKey)
  -> CampaignDefinitionDraftReceipt
CrmCampaignDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementMetadataOnlyDraft, expectedRegistryVersion, idempotencyKey)
  -> CampaignDefinitionDraftReceipt
CrmCampaignDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalPurposeClassificationAudienceContentAndOwnerRegistryVersions, idempotencyKey)
  -> CampaignDefinitionReceipt
CrmCampaignDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> CampaignDefinitionReceipt
CrmCampaignDefinitionQuery.list|get(actorContext, exactPurposeClassificationScope,
  queryOrDefinitionId, cursor) -> AuthorizedCampaignDefinitionResult
CrmTagDefinitionService.createDraft(actorContext, draftDefinition,
  expectedRegistryVersion, idempotencyKey) -> TagDefinitionDraftReceipt
CrmTagDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey) -> TagDefinitionDraftReceipt
CrmTagDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalPurposeClassificationAndTagRegistryVersions, idempotencyKey) -> TagDefinitionReceipt
CrmTagDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> TagDefinitionReceipt
CrmTagDefinitionQuery.list|get(actorContext, queryOrDefinitionId, cursor)
  -> AuthorizedTagDefinitionResult
CrmMetadataService.assignTag(actorContext,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  publishedDefinitionRefAndVersion, expectedNoCurrentAssignmentVersion, idempotencyKey)
  -> TagAssignmentReceipt
CrmMetadataService.removeTag(actorContext, assignmentId, expectedAssignmentVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  reason, idempotencyKey) -> TagAssignmentReceipt
CrmMetadataQuery.listTagAssignments(actorContext,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch, cursor)
  -> AuthorizedPage<MinimizedTagAssignmentWithAppliedDefinitionVersionDto>
CrmSavedViewService.create(actorContext,
  { datasetCode, stableLogicalPurposeServiceId, purposeRegistryVersion, filterRegistryVersion,
    schemaRegistryVersion, actorOrApprovedTeamScope,
    ownerIssuedTeamMembershipAndAccessReceiptVersion, versionedQueryDefinition },
  idempotencyKey) -> SavedViewReceipt
CrmSavedViewService.update(actorContext, savedViewId, expectedSavedViewVersion,
  { datasetCode, stableLogicalPurposeServiceId, purposeRegistryVersion, filterRegistryVersion,
    schemaRegistryVersion, actorOrApprovedTeamScope,
    ownerIssuedTeamMembershipAndAccessReceiptVersion, replacementVersionedQueryDefinition },
  idempotencyKey) -> SavedViewReceipt
CrmSavedViewService.delete(actorContext, savedViewId, expectedSavedViewVersion,
  actorOrApprovedTeamScope, ownerIssuedTeamMembershipAndAccessReceiptVersion,
  reason, idempotencyKey) -> SavedViewReceipt
CrmSavedViewQuery.list(actorContext,
  { datasetCode, stableLogicalPurposeServiceId, currentPurposeRegistryVersion,
    currentFilterRegistryVersion, currentSchemaRegistryVersion, actorOrApprovedTeamScope,
    currentOwnerIssuedTeamMembershipAndAccessReceiptVersion }, query, cursor)
  -> AuthorizedPage<MinimizedSavedViewDto>
CrmSavedViewQuery.get(actorContext, savedViewId,
  { datasetCode, stableLogicalPurposeServiceId, currentPurposeRegistryVersion,
    currentFilterRegistryVersion, currentSchemaRegistryVersion, actorOrApprovedTeamScope,
    currentOwnerIssuedTeamMembershipAndAccessReceiptVersion }) -> AuthorizedSavedViewResult
CrmSavedViewQuery.apply(actorContext, savedViewId, expectedSavedViewVersion,
  { datasetCode, stableLogicalPurposeServiceId, currentPurposeRegistryVersion,
    currentFilterRegistryVersion, currentSchemaRegistryVersion, actorOrApprovedTeamScope,
    currentOwnerIssuedTeamMembershipAndAccessReceiptVersion }, cursor)
  -> AuthorizedSavedViewDatasetPage
CrmCustomFieldDefinitionService.createDraft(actorContext,
  typedDraftSchemaPurposeClassificationDefinition, expectedRegistryVersion, idempotencyKey)
  -> CustomFieldDefinitionDraftReceipt
CrmCustomFieldDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementTypedDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> CustomFieldDefinitionDraftReceipt
CrmCustomFieldDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalSchemaPurposeClassificationRegistryVersions, idempotencyKey)
  -> CustomFieldDefinitionReceipt
CrmCustomFieldDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> CustomFieldDefinitionReceipt
CrmCustomFieldDefinitionQuery.list|get(actorContext, exactPurposeAndClassificationScope,
  queryOrDefinitionId, cursor) -> AuthorizedCustomFieldDefinitionResult
CrmCustomFieldValueService.setInitial(actorContext,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  immutableDefinitionRefAndVersion, expectedNoCurrentValueVersion, typedValidatedValue,
  idempotencyKey)
  -> CustomFieldValueReceipt
CrmCustomFieldValueService.supersede(actorContext, valueId, expectedValueVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  immutableDefinitionRefAndVersion, replacementTypedValidatedValue, reason,
  idempotencyKey) -> CustomFieldValueReceipt
CrmCustomFieldValueService.clear(actorContext, valueId, expectedValueVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  immutableDefinitionRefAndVersion, clearReason, idempotencyKey) -> CustomFieldValueReceipt
CrmCustomFieldValueQuery.list|get(actorContext, exactTargetRef, expectedTargetVersion,
  purposeAccessEpoch, queryOrValueId, cursor) -> AuthorizedMinimizedCustomFieldValueResult
CrmListDefinitionService.createDraft(actorContext, staticOrDynamicDraftDefinition,
  expectedRegistryVersion, idempotencyKey) -> ListDefinitionDraftReceipt
CrmListDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementStaticOrDynamicDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> ListDefinitionDraftReceipt
CrmListDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalPurposeClassificationFilterSchemaAndTargetKindRegistryVersions, idempotencyKey)
  -> ListDefinitionReceipt
CrmListDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> ListDefinitionReceipt
CrmListMembershipService.add(actorContext, publishedStaticListVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion, purposeAccessEpoch,
  expectedNoCurrentMembershipVersion, idempotencyKey) -> ListMembershipReceipt
CrmListMembershipService.remove(actorContext, publishedStaticListVersion, membershipId,
  expectedMembershipVersion, target: CrmPurposeBindingRef|OpportunityRef,
  expectedTargetVersion, purposeAccessEpoch, reason, idempotencyKey) -> ListMembershipReceipt
CrmListQueryService.listDefinitions|getDefinition|listAuthorizedMembers(actorContext,
  exactPurposeClassificationAndListVersionScope, normalizedQuery, cursor)
  -> AuthorizedListOrMemberPage
CrmSegmentDefinitionService.createDraft(actorContext, draftAllowlistedQueryRuleDefinition,
  expectedRegistryVersion, idempotencyKey) -> SegmentDefinitionDraftReceipt
CrmSegmentDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> SegmentDefinitionDraftReceipt
CrmSegmentDefinitionService.publishVersion(actorContext, draftId, expectedDraftVersion,
  finalPurposeClassificationFieldFilterAndRuleRegistryVersions, idempotencyKey)
  -> SegmentDefinitionReceipt
CrmSegmentDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> SegmentDefinitionReceipt
CrmSegmentQueryService.list|get|evaluateAuthorizedMembers(actorContext,
  exactPurposeClassificationAndSegmentVersionScope, normalizedQuery, cursor)
  -> AuthorizedSegmentOrMemberPage
CrmAssignmentRuleService.createDraft(actorContext,
  draftClosedCriteriaPurposeQueueTeamDefinition, expectedRegistryVersion, idempotencyKey)
  -> AssignmentRuleDraftReceipt
CrmAssignmentRuleService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> AssignmentRuleDraftReceipt
CrmAssignmentRuleService.preview(actorContext, exactDraftVersion,
  exactRuleRegistryEligibleTargetQueueTeamAndWorkloadSnapshotVersions, idempotencyKey)
  -> AssignmentRulePreview
CrmAssignmentRuleService.publishVersion(actorContext, approvedPreviewId, expectedDraftVersion,
  finalRuleRegistryQueueTeamAndWorkloadSnapshotVersions, idempotencyKey)
  -> AssignmentRuleDefinitionReceipt
CrmAssignmentRuleService.retire(actorContext, publishedDefinitionId, expectedPublishedVersion,
  reason, effectiveAt, currentUsageInventoryVersion, idempotencyKey)
  -> AssignmentRuleDefinitionReceipt
CrmAssignmentRuleService.evaluate(actorContext, publishedRuleVersion, exactTargetAndBindingVersions,
  eligibleQueueTeamAndWorkloadSnapshotVersions, idempotencyKey) -> AssignmentEvaluationReceipt
CrmAssignmentRuleService.apply(actorContext, approvedEvaluationReceiptVersion,
  finalExactTargetBindingAssignmentAndWorkloadVersions, idempotencyKey) -> AssignmentApplyReceipt
CrmAssignmentRuleQuery.list|get|listEvaluations(actorContext, exactRuleAndTargetScope,
  queryOrId, cursor) -> AuthorizedAssignmentRuleResult
CrmAutomationRuleService.createDraft(actorContext,
  draftClosedTypedTriggerConditionAndLowRiskActionDefinition, expectedRegistryVersion,
  idempotencyKey) -> AutomationRuleDraftReceipt
CrmAutomationRuleService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> AutomationRuleDraftReceipt
CrmAutomationRuleService.preview(actorContext, exactDraftVersion,
  exactActionPortPurposePolicyAndTargetRegistryVersions, idempotencyKey)
  -> AutomationRulePreview
CrmAutomationRuleService.publishVersion(actorContext, approvedPreviewId,
  expectedDraftVersion, finalActionPortPurposePolicyAndTargetRegistryVersions,
  idempotencyKey) -> AutomationRuleDefinitionReceipt
CrmAutomationRuleService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> AutomationRuleDefinitionReceipt
CrmAutomationRuleService.evaluate(actorContext, publishedRuleVersion,
  exactTargetBindingOwnerAndInputVersions, idempotencyKey) -> AutomationEvaluationReceipt
CrmAutomationRuleService.execute(actorContext, approvedEvaluationReceiptVersion,
  finalExactTargetBindingOwnerAndActionPortVersions, idempotencyKey)
  -> AutomationExecutionReceipt
CrmAutomationRuleQuery.list|get|listExecutions(actorContext, exactRuleAndTargetScope,
  queryOrId, cursor) -> AuthorizedAutomationRuleResult
CrmScoringDefinitionService.createDraft(actorContext,
  draftAllowlistedInputsProhibitedProxyRegistryFormulaOrModelRefAndFairnessPolicy,
  expectedRegistryVersion, idempotencyKey) -> ScoringDefinitionDraftReceipt
CrmScoringDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> ScoringDefinitionDraftReceipt
CrmScoringDefinitionService.preview(actorContext, exactDraftVersion,
  exactInputProxyFairnessArtifactAndPolicyRegistryVersions, idempotencyKey)
  -> ScoringDefinitionPreview
CrmScoringDefinitionService.publishVersion(actorContext, approvedPreviewId,
  expectedDraftVersion, finalInputProxyFairnessArtifactAndPolicyRegistryVersions,
  idempotencyKey) -> ScoringDefinitionReceipt
CrmScoringDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> ScoringDefinitionReceipt
CrmScoringService.evaluate(actorContext, publishedScoringDefinitionVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  exactAuthorizedInputOwnerRefsVersionsFeatureProvenanceAsOfAndCoverage,
  purposeAndClassification, idempotencyKey) -> ExplainedScoreEvaluationReceipt
CrmScoringService.override(actorContext, evaluationId, expectedVersion,
  exactTargetAndBindingVersionsAndEpoch, humanReasonAndCurrentInputVersions,
  separationOfDutiesReceiptIfRequired, idempotencyKey) -> ScoreOverrideReceipt
CrmScoringQueryService.list|get(actorContext, exactPurposeTargetAndDefinitionScope,
  queryOrEvaluationId, cursor) -> AuthorizedExplainedScoreResult
CrmAiToolDefinitionService.createDraft(actorContext,
  draftNarrowReadOrProposalSchemaAndAllowlistedProhibitedFields, expectedRegistryVersion,
  idempotencyKey) -> AiToolDefinitionDraftReceipt
CrmAiToolDefinitionService.reviseDraft(actorContext, draftId, expectedDraftVersion,
  replacementDraftDefinition, expectedRegistryVersion, idempotencyKey)
  -> AiToolDefinitionDraftReceipt
CrmAiToolDefinitionService.preview(actorContext, exactDraftVersion,
  exactToolFieldModelPurposeClassificationAndPolicyRegistryVersions, idempotencyKey)
  -> AiToolDefinitionPreview
CrmAiToolDefinitionService.publishVersion(actorContext, approvedPreviewId,
  expectedDraftVersion, finalToolFieldModelPurposeClassificationAndPolicyRegistryVersions,
  idempotencyKey) -> AiToolDefinitionReceipt
CrmAiToolDefinitionService.retire(actorContext, publishedDefinitionId,
  expectedPublishedVersion, reason, effectiveAt, currentUsageInventoryVersion,
  idempotencyKey) -> AiToolDefinitionReceipt
CrmAiProposalService.propose(actorContext, publishedToolDefinitionVersion,
  target: CrmPurposeBindingRef|OpportunityRef, expectedTargetVersion,
  purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  exactAuthorizedSourceOwnerRefsVersionsClassificationsAndConsentPolicy,
  modelPromptToolPolicyVersions, serverExpiryPolicyVersion, structuredAllowlistedInput,
  idempotencyKey) -> AiProposalReceipt
CrmAiProposalService.approve(actorContext, proposalId, expectedProposalVersion,
  exactCurrentSourceTargetBindingToolModelPromptAndPolicyVersions,
  humanDecisionReason, currentAssurance, idempotencyKey) -> AiProposalDecisionReceipt
CrmAiProposalService.reject(actorContext, proposalId, expectedProposalVersion,
  exactCurrentTargetBindingAndPolicyVersions, humanDecisionReason, idempotencyKey)
  -> AiProposalDecisionReceipt
CrmAiProposalService.expire(workloadActorContext, proposalId, expectedProposalVersion,
  trustedServerTime, expiryPolicyVersion, exactCurrentTargetBindingAndRecoveryVersions,
  idempotencyKey) -> AiProposalExpiryReceipt
CrmAiProposalService.supersedeFromOwnerCorrection(workloadActorContext, proposalId,
  expectedProposalVersion, exactOriginalSourceOwnerReceiptsAndVersions,
  exactCorrectedOrRevokedOwnerReceiptsAndVersions, currentTargetBindingToolAndPolicyVersions,
  triggeringOwnerEventIdAndVersion, idempotencyKey) -> AiProposalCorrectionReceipt
CrmAiProposalService.consumeApprovedProposal(actorContext, proposalId,
  expectedApprovedProposalVersion, exactCurrentSourceTargetBindingAndPolicyVersions,
  namedOrdinaryCommandPort, serverCanonicalIntendedCommandDigest, idempotencyKey)
  -> OneUseServerOnlyApprovedCommandReceipt
CrmAiProposalQueryService.list|get(actorContext, exactPurposeTargetToolScope,
  queryOrProposalId, cursor) -> AuthorizedAiProposalResult
CrmRelationshipQuery.compose360(actorContext, relationshipId,
  { purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
    currentSectionRegistryVersion },
  requestedSections: identity_summary|lead_qualification|client_status|organizations|
    service_orders|cases|tasks|appointments|documents|payments|communications|
    consent_contactability|crm_opportunities|crm_activities)
  -> Crm360Dto<OwnerProjectionResult>
ExactCrm360SectionContext = { exactRelationshipRefAndVersion,
  stableLogicalPurposeServiceId, purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  currentActorGrantAssignmentAndMembershipVersions, classification,
  currentSectionRegistryVersion, currentOwnerProjectionContractVersion,
  serverSelectedAsOf, boundedFreshnessBudget }
M018Crm360ProjectionPort.readIdentitySummary(actorContext, ExactCrm360SectionContext,
  exactPersonRefAndVersion, exactFieldAccessReceiptVersion)
  -> OwnerProjectionResult<MinimizedIdentitySummary>
M018Crm360ProjectionPort.readClientStatus(actorContext, ExactCrm360SectionContext,
  exactClientRefAndVersion, exactClientAccessReceiptVersion)
  -> OwnerProjectionResult<MinimizedClientStatus>
M019Crm360ProjectionPort.readOrganizations(actorContext, ExactCrm360SectionContext,
  exactPersonOrganizationRelationshipRefsVersionsAndOwnerAccessReceiptVersions)
  -> OwnerProjectionResult<MinimizedOrganizationRelationshipList>
M021Crm360ProjectionPort.readServiceOrders(actorContext, ExactCrm360SectionContext,
  exactOrderRefsVersionsAndOwnerAccessReceiptVersions)
  -> OwnerProjectionResult<MinimizedServiceOrderList>
M022Crm360ProjectionPort.readCases(actorContext, ExactCrm360SectionContext,
  exactCaseRefsVersionsGrantAccessEpochsAndOwnerReceiptVersions)
  -> OwnerProjectionResult<MinimizedCaseList>
M023Crm360ProjectionPort.readTasks(actorContext, ExactCrm360SectionContext,
  exactTaskRefsVersionsRelationshipReceiptVersionsAndAccessEpochs)
  -> OwnerProjectionResult<MinimizedTaskList>
M013Crm360ProjectionPort.readAppointments(actorContext, ExactCrm360SectionContext,
  exactAppointmentRefsVersionsAndOwnerAccessReceiptVersions)
  -> OwnerProjectionResult<MinimizedAppointmentList>
M011Crm360ProjectionPort.readDocuments(actorContext, ExactCrm360SectionContext,
  exactDocumentRefsVersionsGrantAccessEpochsAndOwnerReceiptVersions)
  -> OwnerProjectionResult<MinimizedDocumentMetadataList>
M014Crm360ProjectionPort.readPayments(actorContext, ExactCrm360SectionContext,
  exactInternalPaymentInvoiceRefsVersionsAndOwnerAccessReceiptVersions)
  -> OwnerProjectionResult<MinimizedPaymentInvoiceStatusList>
M012M025Crm360ProjectionPort.readCommunications(actorContext, ExactCrm360SectionContext,
  exactConversationThreadRefsVersionsAndOwnerAccessReceiptVersions)
  -> OwnerProjectionResult<MinimizedCommunicationMetadataList>
M078M026Crm360ProjectionPort.readContactability(actorContext, ExactCrm360SectionContext,
  exactPurposeChannelConsentPreferenceReceiptVersionsAndAsOf)
  -> OwnerProjectionResult<MinimizedContactabilityState>
M017Crm360ProjectionPort.readOpportunities(actorContext, ExactCrm360SectionContext,
  exactOpportunityRefsVersionsAssignmentAndM019ContextReceiptVersions)
  -> OwnerProjectionResult<MinimizedOpportunityList>
M017Crm360ProjectionPort.readActivities(actorContext, ExactCrm360SectionContext,
  exactActivityRefsVersionsAndClassificationScope)
  -> OwnerProjectionResult<MinimizedActivityList>
M020LeadQualificationProjectionPort.read(actorContext,
  { exactLeadRef, expectedLeadVersion, exactRelationshipRef, purposeBindingRef,
    expectedBindingVersion, purposeAccessEpoch, expectedQualificationOutcomeVersion,
    requestedAsOf, currentM020ProjectionContractVersion })
  -> OwnerProjectionResult<MinimizedLeadQualificationProjection>
M020LeadQualificationProjectionQuery.list(actorContext,
  { stableLogicalPurposeServiceId, expectedPurposeRegistryVersion,
    currentM020ProjectionContractVersion, currentOwnerIssuedLeadScopeReceiptVersion,
    normalizedQualificationFilters }, cursor)
  -> AuthorizedPage<MinimizedLeadQualificationProjection>

CrmConversionService.prepare(actorContext, opportunityId, expectedVersion, purposeBindingRef,
  expectedBindingVersion, purposeAccessEpoch, canonicalCommercialIntentRefAndVersion,
  optionalCurrentM019PersonOrganizationRelationshipOwnerReceiptWhenPresent,
  completePartyRootIntentOpportunityCandidateAndRelationGroupVersions, idempotencyKey)
  -> ConversionPreview
CrmConversionService.execute(actorContext, approvedPreviewId, expectedVersions,
  canonicalCommercialIntentRefAndVersion,
  optionalCurrentM019PersonOrganizationRelationshipOwnerReceiptWhenPresent,
  finalCompletePartyRootIntentOpportunityCandidateAndRelationGroupVersions,
  approvedConversionPlanVersionAndDigestAndUnusedState, currentAssurance,
  separationOfDutiesReceiptWhenPolicyRequires, idempotencyKey)
  -> ConversionReceipt
CrmConversionQueryService.list|get(actorContext,
  completeClosedMemberScope: { bindingCurrentVersionAndEpoch, opportunityTeamAssignmentVersions,
    downstreamOwnerResourceAndAccessVersions, operationAndJobVersions, recoveryEpoch },
  queryOrOperationId, cursor) -> AuthorizedConversionStatusAndOwnerStepResult
CrmConversionService.reconcile(actorContext, operationId, expectedReceiptAndOwnerVersions,
  completeClosedMemberScopeAndCurrentVersions, stableAmbiguousStepIds,
  recoveryEpoch, idempotencyKey)
  -> ConversionReceipt
CrmConversionService.resume(actorContext, operationId, approvedRecoveryPlanIdAndDigest,
  expectedReceiptAndOwnerVersions, purposeBindingRef, expectedBindingVersion, purposeAccessEpoch,
  finalCompleteClosedMemberScopeAndCurrentVersions, stableProvenNotStartedStepIds,
  currentAssurance, separationOfDutiesReceipt, recoveryEpoch, idempotencyKey)
  -> ConversionReceipt

DuplicateReviewService.list(actorContext,
  { candidateKind, exactPermittedMemberScopeAndCurrentBindingOwnerEpochVersions, query, cursor })
  -> AuthorizedPage<DuplicateCandidateDto>
DuplicateReviewService.get(actorContext, candidateId, expectedVersion,
  exactPermittedMemberScopeAndCurrentBindingOwnerEpochVersions) -> DuplicateCandidateDetailDto
DuplicateReviewService.decide(actorContext, candidateId, expectedVersion, decision, reason,
  finalExactMemberBindingOwnerEpochVersions, idempotencyKey) -> DuplicateDecisionReceipt
DuplicateDetectionService.evaluate(actorContext, producerReceipt, candidateScope, rulesetVersion,
  idempotencyKey) -> DuplicateEvaluationReceipt
CrmDataQualityService.evaluate(actorContext, producerReceipt, issueScope, rulesetVersion,
  idempotencyKey) -> QualityEvaluationReceipt
CrmDataQualityService.assign(actorContext, issueId, expectedVersion,
  exactTypedSubjectAndCurrentOwnerAuthorizationBindingClassificationVersions,
  ownerIssuedDestinationEligibilityReceiptVersion, assigneeOrQueue, reason,
  idempotencyKey) -> MutationReceipt
CrmDataQualityService.defer(actorContext, issueId, expectedVersion,
  exactTypedSubjectAndCurrentOwnerAuthorizationBindingClassificationVersions,
  deferredUntil, approvedReasonAndPolicyVersion, idempotencyKey) -> MutationReceipt
CrmDataQualityService.resolveFromOwnerReceipt(actorContext, issueId, expectedVersion,
  priorAndNewOwnerReceiptVersions, currentSubjectAuthorizationBindingAndClassificationVersions,
  idempotencyKey) -> MutationReceipt
CrmDataQualityQueryService.list(actorContext,
  { closedQualitySubjectScope, currentOwnerAuthorizationBindingAndClassificationVersions, query }, cursor)
  -> AuthorizedPage<MinimizedQualityIssueDto>
CrmDataQualityQueryService.get(actorContext, issueId, expectedVersion,
  exactTypedSubjectAndCurrentOwnerAuthorizationBindingClassificationVersions)
  -> MinimizedQualityIssueDetailDto
CrmMergeService.preview(actorContext, canonicalResolutionRef, expectedRootBindingOpportunityVersions,
  completeBindingOpportunityJobCollisionInventory, idempotencyKey) -> MergePreview
CrmMergeService.execute(actorContext, approvedPreviewId,
  approvedMergePlanVersionAndDigestAndUnusedState,
  expectedRootBindingOpportunityVersions,
  finalCompleteBindingOpportunityTeamOwnerJobCollisionInventory,
  currentAssurance, separationOfDutiesReceiptWhenPolicyRequires, idempotencyKey)
  -> MergeReceipt(operationId, receiptVersion, rootCutoverOutcome,
     bindingCollisionOutcomesAndEpochs, opportunityAndJobOutcomes, ownerStepOutcomes, recoveryStatus,
     resultingCanonicalRefsAndNonAuthoritativeAliases)
CrmMergeQueryService.list|get(actorContext,
  completeClosedMemberScope: { roots, bindingVersionsAndEpochs, opportunityTeamAssignmentVersions,
    ownerStepResourceVersions, jobVersions, recoveryEpoch }, queryOrOperationId, cursor)
  -> AuthorizedMergeStatusAndOwnerStepResult
CrmMergeService.reconcile(actorContext, operationId, expectedReceiptRootBindingOwnerVersions,
  completeClosedMemberScopeAndCurrentVersionsIncludingOpportunitiesTeamsJobs,
  stableAmbiguousStepIds, recoveryEpoch, idempotencyKey) -> MergeReceipt
CrmMergeService.resume(actorContext, operationId, approvedRecoveryPlanIdAndDigest,
  expectedReceiptRootBindingOwnerVersions,
  finalCompleteClosedMemberScopeAndCurrentVersionsIncludingOpportunitiesTeamsJobs,
  stableProvenNotStartedStepIds, currentAssurance, separationOfDutiesReceipt,
  recoveryEpoch, idempotencyKey) -> MergeReceipt
OpportunityDuplicateResolutionService.preview(actorContext, candidateId,
  expectedCandidateAndOpportunityVersions, expectedPurposeBindingEpochs,
  downstreamOwnerInventoryVersions, proposedDisposition, structuredReason,
  proposedPreservationPlan, idempotencyKey)
  -> OpportunityResolutionPreview
OpportunityDuplicateResolutionService.execute(actorContext, approvedPreviewId,
  expectedCandidateAndOpportunityVersions, expectedPurposeBindingEpochs,
  approvedResolutionPlanVersionAndDigestAndUnusedStateBindingDispositionReasonAndPreservation,
  finalDownstreamOwnerInventoryVersions, currentAssurance,
  separationOfDutiesReceiptWhenPolicyRequires, idempotencyKey)
  -> OpportunityResolutionReceipt(operationId, receiptVersion, disposition, survivorAndRelatedRefs,
     preservedHistoryRefs, recoveryStatus)
OpportunityDuplicateResolutionQuery.list|get(actorContext,
  completeClosedMemberScope: { opportunityBindingTeamAssignmentVersions,
    downstreamOwnerResourceVersions, operationJobAndRecoveryEpoch },
  queryOrOperationId, cursor) -> AuthorizedOpportunityResolutionStatusAndStepResult
OpportunityDuplicateResolutionService.reconcile(actorContext, operationId,
  expectedReceiptOpportunityBindingOwnerVersions, completeClosedMemberScopeAndCurrentVersions,
  stableAmbiguousStepIds, recoveryEpoch, idempotencyKey)
  -> OpportunityResolutionReceipt
OpportunityDuplicateResolutionService.resume(actorContext, operationId,
  approvedRecoveryPlanIdAndDigest, expectedReceiptOpportunityBindingOwnerVersions,
  finalCompleteClosedMemberScopeAndCurrentVersions, stableProvenNotStartedStepIds,
  currentAssurance, separationOfDutiesReceipt, recoveryEpoch, idempotencyKey)
  -> OpportunityResolutionReceipt
OpportunityRelationQueryService.list|get(actorContext, exactOpportunityRelationGroupScope,
  completeGroupMemberBindingTeamAssignmentAndOwnerEpochVersions, queryOrRelationId, cursor)
  -> AuthorizedOpportunityRelationResult
OpportunityRelationCorrectionService.preview(actorContext, currentRelationGroupIdAndVersion,
  proposedNormalizedAcyclicReplacement, structuredReasonAndEvidence,
  completeMemberBindingTeamAssignmentOwnerConversionVersions, idempotencyKey)
  -> OpportunityRelationCorrectionPreview
OpportunityRelationCorrectionService.execute(actorContext, approvedPreviewId,
  approvedCorrectionPlanVersionAndDigestAndUnusedStateBindingReasonEvidenceAndReplacement,
  finalCurrentRelationGroupMemberBindingOwnerConversionVersions,
  currentAssurance, separationOfDutiesReceipt, idempotencyKey)
  -> OpportunityRelationCorrectionReceipt
OpportunityRelationCorrectionQuery.list|get(actorContext, completeClosedMemberScope,
  queryOrOperationId, cursor) -> AuthorizedRelationCorrectionStatus
OpportunityRelationCorrectionService.reconcile(actorContext, operationId,
  expectedReceiptAndCompleteMemberVersions, completeClosedMemberScopeAndCurrentVersions,
  stableAmbiguousStepIds, recoveryEpoch, idempotencyKey)
  -> OpportunityRelationCorrectionReceipt
OpportunityRelationCorrectionService.resume(actorContext, operationId,
  approvedRecoveryPlanIdAndDigest, expectedReceiptAndCompleteMemberVersions,
  finalCompleteClosedMemberScopeAndCurrentVersions, stableProvenNotStartedStepIds,
  currentAssurance, separationOfDutiesReceipt, recoveryEpoch, idempotencyKey)
  -> OpportunityRelationCorrectionReceipt

CrmImportService.preview(actorContext, acceptedDocumentVersionRef, mappingVersion,
  closedPerRowImportEffectPlanWithExpectedOwnerTargetDefinitionVersions, idempotencyKey)
  -> ImportPreview
CrmImportService.apply(actorContext, previewId, expectedVersion,
  approvedImportPlanVersionAndDigestAndUnusedState,
  finalClosedPerRowEffectPlanAndOwnerTargetBindingDefinitionVersions,
  currentAssurance, separationOfDutiesReceiptWhenPolicyRequires, idempotencyKey) -> ImportReceipt
CrmImportService.reconcile(actorContext, importId, expectedReceiptVersion,
  stableAmbiguousRowOwnerStepIds, exactPerRowOwnerRootBindingDefinitionVersions,
  recoveryEpoch, idempotencyKey) -> ImportReceipt
CrmImportService.compensate(actorContext, importId, expectedReceiptVersion, approvedPlanIdAndDigest,
  exactReversibleStepOwnerRootBindingDefinitionCurrentVersions, currentAssurance,
  separationOfDutiesReceipt, stableCompensationStepIds, recoveryEpoch, idempotencyKey)
  -> ImportCompensationReceipt
CrmImportQueryService.list|get(actorContext,
  actorAccountOwnedImportIntentAndCompletePerRowAuthorizationVersions,
  jobAndRecoveryEpoch, queryOrImportId, cursor) -> AuthorizedImportJobResult
CrmImportQueryService.listRowResults(actorContext, importId, expectedImportVersion,
  actorAccountOwnedIntentAndCompletePerRowRootBindingTargetClassificationOwnerAccessVersions,
  jobAndRecoveryEpoch, cursor)
  -> AuthorizedPage<MinimizedImportRowResult>
CrmExportService.request(actorContext, stableLogicalPurposeServiceIdOrCompleteClosedBindingSet,
  exactDatasetFieldFormatRowLimitTtlPolicyVersions, authSessionAndAssuranceEpoch,
  perScopeRegistryBindingAndAccessVersions, normalizedQuery, fieldSet, reason, idempotencyKey)
  -> ExportReceipt
CrmExportService.consume(actorContext, exportCapability, expectedExportIntentAndJobVersions,
  currentAuthSessionAssuranceAndScopeEpochs, explicitUserDownloadMethod) -> PrivateByteStream
CrmExportService.revoke(actorContext, exportId, expectedVersion, reason, idempotencyKey)
  -> RevocationReceipt
CrmExportQueryService.list|get(actorContext,
  actorAccountSessionAndCompleteCurrentScopeVersions, queryOrExportId, cursor)
  -> AuthorizedExportJobResult
CrmRetentionService.preview(actorContext, M085VersionedPolicyOrLegalReceipt,
  closedRecordDispositionSetWithExpectedVersions, idempotencyKey) -> CrmRetentionPreview
CrmRetentionService.apply(actorContext, approvedPreviewId,
  approvedDispositionPlanVersionAndDigestAndUnusedState,
  finalClosedRecordDispositionSetOwnerDownstreamAndHoldVersions,
  currentAssurance, separationOfDutiesReceipt, idempotencyKey)
  -> CrmRetentionOperationReceipt
CrmLegalHoldService.apply(actorContext, M085VersionedLegalAuthorityAndPolicyReceipt,
  exactClosedRecordSetAndExpectedVersions, expectedNoOrCurrentHoldVersions,
  reason, currentAssurance, separationOfDutiesReceipt, idempotencyKey) -> CrmLegalHoldReceipt
CrmLegalHoldService.release(actorContext, holdId, expectedHoldVersion,
  M085ReleaseAuthorityReceiptExplicitlyCoveringHoldScopeAndReason,
  exactCurrentRecordAndOverlappingHoldVersions, currentAssurance,
  separationOfDutiesReceipt, idempotencyKey) -> CrmLegalHoldReceipt
CrmRetentionService.reconcile(actorContext, operationId,
  expectedReceiptRecordOwnerBackupAndHoldVersions, stableAmbiguousStepIds,
  recoveryEpoch, idempotencyKey) -> CrmRetentionOperationReceipt
CrmRetentionService.resume(actorContext, operationId, approvedRecoveryPlanIdAndDigest,
  finalReceiptRecordOwnerHoldMinimumRetentionAndBackupVersions,
  stableProvenNotStartedStepIds, currentAssurance, separationOfDutiesReceipt,
  recoveryEpoch, idempotencyKey) -> CrmRetentionOperationReceipt
CrmRetentionQueryService.list|get(actorContext, exactRecordOwnerAndHoldScope,
  queryOrOperationId, cursor) -> AuthorizedRetentionStatusAndPerRecordResult
CrmSearchProjectionPort.upsert(actorContext,
  CrmSearchProjectionEnvelopeWithExpectedAggregateBindingAndPolicyVersions, idempotencyKey)
  -> SearchProjectionReceipt
CrmSearchProjectionPort.invalidate(actorContext, exactProjectionRefAndVersion,
  currentAggregateBindingAndPolicyVersions, reason, idempotencyKey) -> SearchProjectionReceipt
CrmSearchProjectionQueryService.listStatus(actorContext, exactPurposeClassificationAggregateScope,
  query, cursor) -> AuthorizedSearchProjectionStatus
M089CrmSearchPort.search(actorContext, stableLogicalPurposeServiceId,
  exactAuthorizationAndProjectionRegistryVersions, allowlistedQuery, cursor)
  -> AuthorizedPage<MinimizedCrmSearchResultWithFreshnessAndBindingEpoch>
CrmReportingProjectionPort.publish(actorContext,
  CrmReportingFactEnvelopeWithExpectedAggregateAndPolicyVersions, idempotencyKey)
  -> ReportingProjectionReceipt
CrmReportingProjectionPort.supersede(actorContext, exactFactRefAndVersion,
  replacementFactEnvelopeWithExpectedAggregateAndPolicyVersions, reason, idempotencyKey)
  -> ReportingProjectionReceipt
CrmReportingProjectionPort.invalidate(actorContext, exactFactRefAndVersion,
  currentAggregateAndPolicyVersions, reason, idempotencyKey) -> ReportingProjectionReceipt
CrmReportingProjectionQueryService.listStatus(actorContext,
  exactFactTypePurposeClassificationAndAggregateScope, query, cursor)
  -> AuthorizedReportingProjectionStatus
```

`prepare`/`preview` contracts are side-effect-free computations by default. Import preview returns
ephemeral versioned duplicate/data-quality findings inside its scope-bound preview and creates no
`DuplicateCandidate` or `CrmDataQualityIssue`; only an explicitly approved idempotent apply/review
command may persist those workflow records. If a later Build persists
a preview/capability, creation itself is idempotent and the artifact is actor/scope/version/recovery-
bound, short-lived and revocable under the high-risk contract. Recomputing cannot consume/approve a
prior preview or hide changed input. Lost-response/same-key returns the original preview receipt;
same-key/different input conflicts.

### Contract rules

- IDs are opaque; client-supplied actor, role, tenant, source truth or authorization fingerprints are
  ignored/rejected.
- There is no generic relationship-root patch/update. Root creation/reuse occurs only through the
  bootstrap contract; typed owner-projection refresh may update allowlisted provenance/freshness refs
  from immutable owner receipts; supersession occurs only through enhanced merge cutover. None can
  mutate contact facts, purpose, assignment, engagement lifecycle or next action on the root.
- Queries use allowlisted filters/sorts, cursor pagination and authorized counts only. Release 1A
  list `filters` are the only CRM search behavior before CRM-020/M089 activation: they operate on
  safe M017 list attributes under one stable logical purpose and authorization-before-match/count.
  Contact values, note bodies, owner content and match tokens are not searchable.
- Queue/list/detail/status queries authorize before match/count/cursor, return minimized DTOs and bind
  exact purpose-binding/job/recovery epochs. Proposed-binding queries are separately authorized and
  expose only immutable owner-receipt status required for review; proposals never authorize ordinary
  relationship/activity/note/opportunity access.
- Contact 360 accepts only the closed section registry and calls each named owner through its typed,
  allowlisted projection port with exact refs/versions/grants/purpose/classification and a bounded
  freshness budget. Sections authorize independently; one denied/stale/unavailable result cannot be
  inferred from another and cannot be promoted to complete. Opaque drill-down routes reauthorize at
  the owner. The Leads surface uses the explicit M020 qualification query/port and never guesses
  qualification from CRM state.
- Protected reveal returns transient values and a separate opaque audit receipt. The server records
  allowed, denied and failed attempts through M077 before returning an allowed value; the audit
  payload never includes the value or a replayable capability. M017 exposes no audit-history table
  for reveal attempts and no mechanism to recover a value from the receipt.
- Assignment history authorizes the exact binding/Opportunity target and epoch before pagination,
  returns minimized old/new owner/team reason codes and versions, and never confers assignment scope.
- Next-action history authorizes the exact target/binding epoch before pagination. Completion plus
  successor/exception/current-pointer CAS and ledger append commit atomically; the ledger references
  but never duplicates or completes M023 Task state.
- Next-action mutation is a closed command union. Create/replace final-fences target, binding and the
  expected current-disposition absence/version. Completion identifies the exact current disposition,
  completion evidence and optional exact M023 Task/version plus its current owner-issued target/
  purpose/visibility/classification/access-epoch receipt, then atomically appends prior/resulting
  history and installs one actionable successor, approved exception or terminal handoff. A Task
  linked to another relationship, case, purpose or unauthorized owner/queue is rejected generically.
  M023 correction, deletion, reassignment or receipt revocation supersedes/clears the minimized link
  through an idempotent owner event; it cannot mutate the M023 Task or silently preserve a stale link.
  History/read final-fences the current Task receipt before displaying even status/due/owner. A completed
  disposition can never remain as the current pointer; parallel complete/replace admits one result.
- Every assignment or actionable owner/queue destination—including next-action successor and close/
  reopen handoff—uses a closed destination ref plus the current owner-issued eligibility/membership/
  team/queue receipt version and `asOf`. The final transaction rereads that authority with target,
  binding epoch and current assignment/action version. Deactivation/removal races conflict
  generically; explicit `unassigned|reassignment_pending` remains available under policy, but an
  inactive/ineligible destination cannot satisfy accountability.
- Attribution summary/history independently authorizes the exact binding/epoch and returns immutable
  original plus versioned latest/history source-definition refs, retired-definition label/version,
  owner receipt provenance and freshness only—never raw tracking payload or cross-binding aggregation.
- Attribution owner correction/revocation final-fences original touch/current revision, prior/new
  owner receipt, root/binding epoch and source definition. It appends immutable correction/
  invalidation lineage and deterministically recomputes latest touch by owner occurred-at plus owner
  sequence/tie-breaker; original attribution remains immutable. Pointer, event/audit/outbox commit
  atomically, and delayed/reordered replay cannot make a withdrawn touch current.
- Opportunity organization context is optional but never advisory authority. Create, context change,
  every organization-dependent read/mutation/transition/close/reopen and both conversion fences
  validate the exact current M019 person-organization relation ref/version, effective interval,
  classification, purpose and owner access receipt/epoch. An M019 correction, end or revocation
  immediately makes the projection stale and blocks organization-dependent effects. The system
  never silently drops to person-only, substitutes a preferred/primary organization or carries a
  revoked relation into an Organization-scoped M021 Order/M022 Case. Removing context is an explicit,
  reasoned, versioned command and cannot rewrite downstream owner facts.
- Every Opportunity-targeted mutation—including commercial details, organization context, stage,
  assignment, next action, tag/custom metadata and close/reopen—derives and final-fences the complete
  current `OpportunityRelation` group inside the same transaction together with stable binding ID,
  current binding version/access epoch and target CAS. Opportunity history/detail derive and
  authorize the same group before result/cursor serialization; list/pipeline do so per included row
  before counts. A caller cannot omit or choose a partial relation group.
- Tag-assignment queries independently authorize the closed binding/Opportunity target and binding
  epoch before filter/count/pagination, returning minimized assignment plus immutable applied tag-
  definition code/version/retired label; definition retirement never deletes/remaps history.
- Custom-field/list/segment definition and value/member/evaluation contracts remain unavailable
  until CRM-016. Definitions are immutable published versions with an allowlisted typed schema,
  purpose/classification and retention. Every value/static member/dynamic evaluation authorizes and
  final-fences the exact target/binding epoch before match/count/cursor; these records never grant
  access, contactability, Client status or eligibility and cannot shadow a canonical owner field.
- All governed definition families use the explicit immutable lifecycle contract: create draft,
  revise exact draft by CAS, publish the exact approved draft against final registries, and retire an
  exact published version against a current usage inventory/reason/effective time. Published rows are
  immutable. Stale publish/retire, concurrent lifecycle changes and attempts to edit active meaning
  fail closed. A preview is mandatory where assignment, automation, scoring or AI-tool publication
  can change evaluated targets/actions; it is never reusable after registry or workload drift.
- Saved views are actor- or approved-team-owned query definitions, not authority. Create/update bind
  one exact dataset, stable logical purpose/service, purpose/filter/schema registry versions, scope
  and current owner-issued team membership/access receipt; delete takes only view ID/version plus
  authority and reason. List/get/apply reauthorize every dimension and the underlying dataset before
  match/count/cursor. A stale or unavailable field/filter/purpose/team receipt makes the view
  unavailable; the system never silently drops predicates, broadens scope or falls back to all CRM.
- Assignment-rule contracts remain unavailable until CRM-014. Preview/publish/evaluate/apply are
  separate; apply consumes one approved immutable evaluation, final-fences target/binding/current
  assignment plus eligible queue/team/workload snapshot versions and writes through the ordinary
  assignment command/history. It reports per-target conflict/recovery without an unrestricted bulk
  endpoint. Deterministic cursor advancement, concurrency and explanation prevent duplicate/skipped
  rotation from being silently treated as fair.
  Draft creation/revision is versioned CAS; preview binds the exact draft plus rule/queue/team/
  workload registries, and publish consumes that approved preview after a final snapshot fence.
  Published rules are immutable and only they may evaluate. A stale draft/preview, registry change,
  workload change or concurrent publish/retire fails rather than silently altering fairness.
- Every enhanced preview/execute/recovery family—conversion, canonical merge, Opportunity duplicate
  resolution/relation correction, pipeline migration, import apply/compensation and retention
  disposition—
  carries an exact plan ID+version+digest+unused state into execute. Execute final-fences the complete
  member/owner/job inventory, current assurance and applicable SoD receipt. Reconcile is read-only by
  stable ambiguous step IDs plus current closed scope/recovery epoch; resume accepts only an approved
  recovery plan ID+digest, complete final scope, proven-not-started steps, current assurance/SoD and
  current recovery epoch. No accepted/ambiguous external step is reissued under a new plan or actor.
  Legal-hold apply/release are the explicit direct-CAS exception: each uses current M085/legal
  authority, exact record/overlapping-hold versions, assurance/SoD and the same strong semantic
  identity. Lost/ambiguous outcomes reconcile the original receipt; there is no substitute generic
  retention preview/resume or a second hold effect.
- Campaign metadata contracts remain unavailable until CRM-011/019. Draft/publish/retire/query
  govern metadata only. M017 exposes no audience or delivery command. A future M025-owned campaign
  PRD must initiate/authorize delivery, use M026/M078 current per-recipient preference/consent and
  define immutable audience request, frequency/quiet-hour/unsubscribe policy, stable per-recipient
  owner-step receipts and ambiguous reconciliation. M017 never receives raw audience membership or
  delivery authority from a campaign definition.
- M089/M092 projection contracts remain unavailable until CRM-020 plus their owner gates. Search
  projection envelopes carry only safe fields and exact source/binding/purpose/classification/
  freshness versions; M089 reauthorizes before match/count and returns stale/suppressed explicitly.
  Revoke, root merge, retention/redaction/deletion and source correction emit versioned invalidation.
  Reporting facts declare grain/dimensions/measures/source/as-of/correction/replay identity and no
  direct ID/free text; M092 alone defines viewers, metrics, aggregation and exports. Domain events and
  facts never replace ledgers or become shadow authorization.
- Automation/scoring/AI contracts remain unavailable until CRM-019 and any applicable M047–M060
  gate. Automation rule definition, preview/evaluate and execute are separate; execution is limited
  to the exact published low-risk port and final-fences target/input/action versions. Scoring stores
  source versions, prohibited-proxy/fairness policy and explanation, and cannot mutate qualification,
  eligibility or access. Score evaluation final-fences a closed target, binding epoch, feature
  provenance/as-of/coverage/purpose/classification and publishes an explained, expiring versioned
  receipt; correction/override appends lineage and cannot become authorization, merge evidence,
  eligibility or autonomous consequential action. AI tools produce an expiring versioned proposal
  only. Human approval locks the exact structured suggestion/target/action digest but mutates
  nothing. A one-use server-only consume receipt then final-fences current source/target/binding/
  policy versions and the named ordinary-command digest; the ordinary owner command independently
  authorizes and uses its own semantic identity. Client parameter substitution, stale approval or
  correction/expiry fails; no prompt/proposal/decision is executable authority or shadow policy.
  M017 cannot score a pre-handoff/proposed M020 Lead. An authorized M020 Lead projection may be one
  versioned input only after an active binding; it cannot change M020 qualification. Any actual Lead-
  scoring lifecycle belongs to M020 and requires its own owner PRD/port.
  Proposal creation authorizes/final-fences exact target/binding/epoch and every source owner,
  classification/consent/model/prompt/tool policy **before** a model call. The server sets expiry and
  persists only schema-allowlisted structured output/source refs. Revoke, source correction or policy
  change stales/suppresses query and prevents approval/consume; cross-purpose source mixing fails.
  CRM-019 external-model activation additionally requires approved processor/provider and account,
  pinned model/version/region, DPA, no-training and retention terms, credential custody, exact field
  allowlist/redaction, evaluations, outage/manual fallback, kill switch and incident/revocation
  evidence. Until all evidence is registered, no CRM data leaves for a model; only deterministic
  no-external-model behavior or a human-authored manual suggestion is allowed.
  Approval and rejection are distinct human commands with their own scopes and current-version
  fences. Expiry is a least-privilege server-time/policy workload command and accepts no human
  decision authority. Owner correction/revocation supersession requires the exact original and new
  owner receipts plus triggering event/version and never reuses approval authority. Every transition
  is CAS/idempotent, emits its own closed outcome and loses races safely; delayed correction or
  expiry cannot resurrect or execute an approved/consumed proposal.
- Duplicate-review list/get computes the intersection of authorization over every closed candidate
  member and every exact purpose binding/current owner access epoch before candidate inclusion,
  count, cursor construction or masked comparison. A member outside that intersection suppresses the
  entire candidate with the same generic result/timing class as absent; it is never omitted from the
  comparison while the remainder is exposed. `decide` repeats that complete-member final fence and
  candidate version check atomically. No candidate decision grants record access.
- Data-quality list/get/mutation authorizes the exact closed `QualitySubjectRef`, current canonical-
  owner receipt/version, classification and applicable purpose-binding/owner access epoch before
  match/count/detail. Unauthorized or stale subjects yield one generic suppressed outcome without
  count/timing/existence leakage. Assignment/defer repeats that final fence; resolution additionally
  validates the new owner receipt/version and records immutable prior/new receipt provenance. A
  reviewer cannot repair or gain access to the owner record through the issue.
- Purpose-binding proposals persist immutable typed evidence receipt refs, owner/policy versions and
  evidence snapshot provenance, not evidence values. Proposal and activation final-reread the same
  owner evidence/version set plus current policy; correction, withdrawal or consent revocation wins
  the race and fails closed. Revoke/supersede require the exact triggering owner receipt/version;
  scheduled expiry uses trusted server time and approved policy, never a client clock.
- Evidence/consent owners deliver a typed, signed/idempotent invalidation receipt through the narrow
  workload command. It binds the stable binding/current version/epoch, prior/new owner evidence,
  triggering event and complete child inventory; after authoritative owner reread it atomically
  advances access epoch, freezes dependents and emits binding-ended/remediation receipt/history/
  outbox/audit. Delayed/reordered/duplicate events dedupe and never resurrect. Request-time access
  also checks current evidence freshness/revocation whenever CRM-003/015 policy requires, so consumer
  lag cannot keep an invalid binding authoritative.
- Binding-access termination final-fences every child before advancing the epoch. Voluntary end
  requires an atomic approved child disposition. Unavoidable evidence/consent revoke or server-time
  expiry immediately denies access and freezes each child into `binding_access_ended` quarantine with
  immutable history. Only the separate enhanced remediation command can process frozen work; all
  ordinary reads/writes remain denied and remediation cannot reactivate the binding.
  Remediation is deliberately one local Postgres transaction over M017-owned frozen children only:
  it may append local close/supersession/action histories and pointers, but cannot invoke an external
  owner port or reverse owner facts. All child results + receipt + events/audit/outbox commit or none;
  no partial/ambiguous outcome exists. A blocked plan remains frozen for a new approved version.
- Binding proposal/list scope uses stable logical purpose/service ID plus current registry/as-of;
  propose also binds the exact published applied definition ref/version and expected registry/policy
  versions. The server verifies membership/effective interval before persistence. Upgrade changes the
  applied immutable evidence/current binding version, not the list scope and never implicitly grants
  or hides a relationship.
- Renewal/upgrade uses that same stable logical ID plus exact replacement published definition ref/
  version, expected registry/policy versions and current evidence-owner versions. Final CAS verifies
  same-logical-service membership, published/effective interval and current registry before pointer/
  epoch advance. Draft, retired, wrong-service or publish/retire-raced definitions fail closed.
- Engagement-lifecycle history/query authorizes the exact binding and epoch. A lifecycle mutation
  final-fences its complete Opportunity/action/high-risk-operation inventory and appends history;
  archive/dormancy racing work creation/recovery admits one winner. Reactivation is never inferred
  from a message, payment, import or stage.
- Protected reveal is a bounded server-mediated reread from M018, not an M017 copy. It final-fences
  exact field refs, current binding/purpose/classification/assurance and M018 owner versions, returns
  only the approved minimal value in a `Cache-Control: no-store` response and emits protected audit.
  The receipt/value is never cached, indexed, persisted in M017, placed in URLs/errors/telemetry or
  exposed to ordinary detail/export; any optional TTL/reveal session is `CRM-007` policy.
- A cursor is an opaque server-issued authenticated capability bound to actor/account, session/auth
  epoch/assurance, membership, exact permission/role/team/assignment and grant/access epochs,
  purpose/classification, normalized query/filter/sort and registry versions, result `asOf`, schema/
  contract version, recovery generation and short TTL. It contains no PII; tamper, cross-context,
  revocation, expiry or mismatch fails closed without count/existence disclosure.
- Commands use optimistic concurrency plus semantic idempotency; `409` supplies no sensitive state.
- Every retryable local mutation reserves a namespace/key/fingerprint and returns the original
  receipt after a lost response. Expected version is part of the digest. Relationship handoff also
  uses the unique current/root Person invariant and returns a generic outcome without revealing an
  existing person/client publicly.
- Public endpoints return generic receipts and never reveal existing people/clients.
- Response DTOs are separate for list/detail/export/audit; fields are not removed only with CSS.
- Cross-domain writes call application ports or transactional outbox commands, never another
  module's tables directly.
- Conversion/merge receipts expose each owner outcome independently; partial/ambiguous work moves
  to reconciliation/manual recovery instead of fabricating success.
- Conversion list/get exposes minimized durable operation/owner-step outcomes only after exact
  complete-member intersection authorization over current binding/epoch, Opportunity team/
  assignment, every downstream owner resource/access version and operation/job/recovery epoch before
  match/count/cursor/detail. One unauthorized member generically suppresses the whole operation (or
  an explicitly CRM-007-approved field class) without inference. `reconcile` and `resume` repeat the
  same final fence; `reconcile` queries owners by reserved stable step IDs under the current recovery
  epoch and `resume` requires the exact approved plan+digest, current assurance/SoD and may issue
  only proven `not_started` steps after fresh binding/owner/version final fences. Same-key retry returns
  the original receipt; ambiguous/accepted steps are never reissued as a new owner effect.
- Conversion execution evaluates the immutable DAG and invokes only `ready` steps whose prerequisite
  predicates are durably `accepted|reused` as approved. A blocked/conflict/unavailable/ambiguous
  prerequisite marks dependents `dependency_blocked`, not success or attempted. Reconciliation by
  stable step ID may unlock dependents only after owner proof establishes an allowed outcome; resume
  final-fences the same plan digest and versions. Status distinguishes not-started/ready/dependency-
  blocked from owner outcomes and never compensates by assuming downstream reversal.
- Binding-level next-action writes require and reauthorize the exact active purpose binding,
  current version and access epoch; the server never infers a default. Opportunity-level writes use
  the Opportunity's immutable stable binding ID, retain created-under version as evidence, and
  resolve/final-fence exactly one current active binding version/access epoch before every
  mutation, history read and conversion preview/execute.
- `reopen` accepts only an approved terminal source plus destination under the immutable pipeline-
  version policy. It atomically CAS-updates current state, appends the typed immutable reopen ledger
  entry and establishes accountable owner plus actionable next disposition/approved exception;
  stale binding/opportunity/pipeline versions or replay cannot reopen twice.
- Close/reopen after a conversion never rewinds M018/M021/M022 owner facts. Both commands final-fence
  the conversion receipt, every downstream owner version and the complete current
  `OpportunityRelation` group. A post-conversion commercial correction requires an approved reason,
  appends a new stage-history version and preserves the conversion receipt. Reopen does not make the
  Opportunity convertible again: stable commercial intent plus relation-group authority prevent a
  second owner effect, including after partial conversion recovery.
- `updateCommercialDetails` accepts only CRM-005/006-approved estimated value as integer minor units
  with ISO currency, deterministic probability source, expected-close date and priority/source fields.
  It rejects unknown/mass-assigned fields and cannot mutate identity, binding, pipeline/stage, owner,
  next action, conversion, payment, entitlement, eligibility or fulfillment facts. Autosave uses
  optimistic version/idempotency/audit and final-fences active Opportunity + binding epoch.
- Opportunity creation/action handoff commits binding-action supersession/link, Opportunity owner/
  next-action and audit/outbox in one CAS transaction. Creation racing binding action update, close
  racing successor establishment, or reopen racing binding follow-up admits one consistent owner;
  no active workstream has two copies or no actionable disposition.
- Opportunity close final-fences the exact binding/version/epoch, current Opportunity disposition,
  complete active-sibling Opportunity inventory, conversion/relation group and closed handoff plan.
  It atomically closes the Opportunity, appends its transition/action histories and either installs
  the binding successor/approved exception/terminal engagement or records the exact sibling that
  owns the explicit exemption. A sibling or binding/action race conflicts instead of dropping or
  overwriting accountable work.
- Opportunity creation locks/final-fences the current relationship root/version before its exact
  binding/version/epoch and action. It records/advances the root's child-inventory fence atomically so
  a concurrent canonical merge preview/execute must conflict/recompute and cannot miss a phantom
  Opportunity on a losing root.
- Opportunity creation reserves the server-derived canonical commercial intent/version independently
  of the new Opportunity ID and atomically evaluates/reuses/creates the matching duplicate candidate
  with the Opportunity/current binding/action records. Conversion prepare/execute final-fence every
  nonterminal candidate and current relation member for that intent. A pending, stale, ambiguous or
  resolution-requested candidate blocks conversion until an approved `distinct`, `keep_both`,
  `related` or `superseded` outcome is durable. Thus two concurrent creations cannot obtain distinct
  semantic owner-effect identities merely because they received different Opportunity IDs.
- Conversion inventory also includes every nonterminal/stale/ambiguous party/root candidate touching
  the CrmRelationship, canonical Person, selected M019 relation/Organization or source M020 Lead—not
  only Opportunity-intent candidates. Pending canonical resolution blocks Client/Order/Case effects.
  Distinct/resolved owner receipts and their current versions are final-fenced at prepare/execute;
  an M018 contact correction that creates/stales a party candidate wins the race and invalidates the
  preview.
- `MergeReceipt` is versioned and bound to the reserved high-risk operation fingerprint. Every lost-
  response retry returns the same durable operation/receipt version; each owner step reports its
  typed result and recovery status without protected payload.
- `CrmMergeService.execute` is the sole M017 root-cutover authority after canonical owners approve.
  In one final-fenced orchestration it atomically supersedes the losing root, creates the non-
  authoritative alias/tombstone, advances/invalidates every losing binding epoch, applies the
  approved same-logical-purpose binding collision result and freezes/reconciles affected
  Opportunities, actions, jobs, cursors and previews before winner access. Incompatible active
  Opportunities/bindings/jobs block or remain explicit manual recovery; no record silently follows
  an alias. Partial cross-owner results preserve both roots unavailable for broadened access until
  reconciliation proves the cutover outcome.
- Merge/Opportunity-resolution status queries return minimized durable step outcomes only within the
  complete closed intersection of every root, binding/epoch, Opportunity/team/assignment, owner-step
  resource, job and recovery epoch in the operation. Authorization occurs before match/count/cursor/
  detail; one unauthorized member suppresses the whole operation with a generic result/timing class.
  `reconcile` is owner-read-only by stable step ID. A separate
  enhanced `resume` requires an approved recovery plan+digest, complete final scope, current
  assurance/SoD and recovery epoch and may issue only steps proven not started
  after fresh root/binding/Opportunity/owner version fences; accepted/ambiguous steps are never
  reissued and operators never read tables or rerun execute as a new operation.
- Every Opportunity-targeted read or write—list/get/pipeline/history, transition, assign, next action,
  close/reopen, activity/note/attribution/metadata/custom value/list membership, migration and
  conversion—derives and final-fences the complete current `OpportunityRelation` group/version.
  A superseded alias denies new work and ordinary mutation; related members remain independent under
  stable-intent rules. Resolution execute advances relation authority plus invalidates stale cursors,
  capabilities/projections atomically. A race with any target operation admits one versioned result.
- Opportunity resolution atomically appends the immutable `OpportunityRelation` version/current
  pointer with its durable receipt. Preview digest-binds the proposed disposition, structured reason
  and explicit preservation plan together with every member/downstream version; execute consumes
  that exact approved unused plan. Related/superseded chains are normalized to one acyclic group;
  create/correct/convert/close/reopen and all relation queries final-fence the full group. A later
  correction is a new enhanced reviewed operation, never an unlogged unlink, and cannot resurrect a
  superseded alias or alter external owner facts. `superseded` denies conversion; `related` converts
  independently only when its canonical commercial intent/version plus owner effect identity/service/
  scope differs. Same-intent related members replay one stable owner receipt. `keep_both` creates no
  relation and each Opportunity still uses its own stable intent/effect invariant.
- Opportunity-resolution status/recovery and relation-group queries authorize the complete
  intersection of all member Opportunities, bindings, teams/assignments, downstream owner resources,
  jobs and recovery epoch before match/count/cursor/detail. They never return an authorized subset
  that reveals a hidden member or relation. Reconcile/resume repeat the same current-version fence.
- Note supersession final-fences the current root, exact target/version, binding/version/epoch and
  named note/current revision. It appends an immutable replacement revision and atomically advances
  the note current pointer with domain event, audit and outbox; note ID/revision cannot hide inside
  free-form input or select a sibling/cross-purpose note.
- Note redaction is unavailable until both CRM-010 and CRM-022 are approved. Once active,
  `redactRevision` final-fences the exact note revision, target, binding epoch, authority and
  disposition, current assurance, separate destructive capability/SoD and M085 retention/deletion/
  legal-hold authority. A hold or unsatisfied minimum-retention rule denies the command. Tombstone or
  crypto-shred suppresses body access while immutable metadata, reason, lineage and audit remain.
  Search/export/AI/cache/projection invalidation and the durable disposition receipt are atomic/outboxed;
  backups observe the approved expiry/restore policy. Redaction never edits a sibling note or hides
  an audit/business transition, and concurrent reads fail closed against the advanced revision.

### High-risk semantic idempotency contract

All retryable local M017 writes use a common server-derived `CrmMutationFingerprint` bound to the
complete Human/Workload actor context, operation namespace/version, target/root refs, expected
version, canonical input/policy/schema versions and recovery generation. They atomically reserve the
scoped key with mutation + outbox/audit receipt, so a lost response replays the original receipt and
a changed semantic input conflicts. The stronger contract below extends it for cross-owner/
preview/file operations.

Conversion, canonical merge, Opportunity duplicate resolution, Opportunity-relation correction,
binding-access-ended remediation,
pipeline-version migration execute,
import apply, import compensation, retention disposition apply, legal-hold apply/release and any
automation action-port execution, approved-AI-proposal consumption, and any reconciliation/resume
step that may command an owner or disposition record use a server-canonical
`CrmOperationFingerprint`. It binds environment/deployment, organization, actor/account, session/
auth epoch/assurance, active membership, exact permission/role/team/assignment and grant/access
epochs, purpose/classification, operation type and namespace/version, canonical root IDs, approved
preview ID/digest, exact normalized input digest, expected resource/owner versions, schema/contract/
policy versions and current `CrmRecoveryEpoch`. A preview is an opaque server-issued, actor/scope-
bound, short-lived, single-use/revocable capability and is final-fenced by fresh authorization and
versions at execution. The server derives every digest; a client key/digest is never authority.
Fingerprint inputs use opaque record refs, immutable versions and enum codes wherever possible.
Protected or low-entropy email/phone/note/query/row values are never plain-hashed: when equality is
unavoidable, use a purpose/domain-separated keyed MAC plus key version/custody outside Postgres,
backups, logs and telemetry. Fingerprints are server-only, non-exportable and never serialized to a
client. Key rotation/restore may rederive or version-match under approved policy without changing
same-semantics behavior.

Before the first side effect, Postgres atomically reserves a high-entropy, bounded-length client key
under unique `(environment, sgOrganization, authenticatedActorOrApprovedIssuer,
operationNamespaceVersion, idempotencyKey)` plus the fingerprint, preview use state and deterministic
operation ID. Key format/length, rate and outstanding-operation limits are server-enforced. A second
unique server-derived semantic-operation identity is the recovery-stable canonical tuple `(environment,
sgOrganization, operationNamespaceVersion, canonicalEffectType, orderedCanonicalRootSet,
normalizedEffectDigest, applicableExpectedResourceAndOwnerVersions, previewContentDigest,
schemaContractPolicyVersions, canonicalDomainIntentRefAndVersion)`. It intentionally excludes actor,
recovery generation, raw
idempotency key and a preview instance ID when the approved preview content digest already represents
the effect. `canonicalDomainIntentRefAndVersion` is deterministically derived from immutable
operation-specific roots, exact expected versions, approved transition/plan/request version and
normalized effect digest; it is never client-selected and introduces no external journal/authority.
If a snapshot loses the local reservation, the same inputs reproduce the same identity and owner
step IDs for reconciliation. A legitimate repeated effect requires an approved business transition
or request version that advances the canonical root/owner/intent version after the previous receipt
is reconciled/terminal; a retry or equivalent preview reuses the existing version. Operation-specific
canonicalizers define the root set and effect digest: conversion uses
the Opportunity and requested owner effects; merge uses ordered survivor/source roots and merge
  plan; pipeline migration uses source/destination definition versions plus ordered exact
  Opportunity/binding versions and per-item policy; import uses artifact/version, accepted mapping
  and accepted row-set digest; retention/hold uses the ordered closed record/version set, disposition,
  M085 authority/policy/legal-hold/minimum-retention/downstream/backup-expiry versions and SoD receipt;
  compensation also binds the approved compensation-plan digest and exact
expected owner versions. Thus distinct legitimate inputs against the same root do not collide,
while an identical authorized effect across actors, keys or equivalent previews has exactly one
winner. Deterministic owner step IDs derive from this recovery-stable tuple. M017 owners live in the
same transactional Postgres boundary; any later external owner must enforce the same stable step ID
before its adapter is approved. Recovery generation
remains in authorization/request fingerprints so pre-restore work cannot resume, but never changes
semantic identity or owner step lineage. A new recovery epoch reconciles the stable effect/step IDs
against canonical Postgres owner state, M077 evidence available to the approved restore, M011
artifact inventory and any external owner receipt before admitting a new intent/effect. The scoped-key and semantic constraints
prevent cross-actor/environment denial collisions without allowing duplicate semantic effects. Then:

Automation action-port canonicalization uses the exact target/binding/epoch, immutable rule +
evaluation version, closed action digest, expected owner version and canonical rule-intent version.
The evaluation is one-use; a stable owner step is reconciled after ambiguous response, and resume may
issue only a proven `not_started` step. Two distinct legitimate rules require distinct approved
canonical rule-intent versions; actor/key/restore differences cannot duplicate the same owner effect.

Binding-access-ended remediation canonicalization uses binding ID/ended epoch, ordered frozen child/
version set, approved disposition-plan/version, destination eligibility versions and SoD receipt.
It has no owner steps: one all-or-nothing local transaction plus durable receipt means crash/lost
response replays the original result, another actor/key cannot apply a second plan and restore
reconciles against resulting child/current-pointer versions before admitting a new plan.
Opportunity-relation correction canonicalization uses current complete group/version, proposed
normalized acyclic replacement, reason/evidence/policy, every member/binding/owner/conversion version
and SoD receipt. Preview exposes downstream impact; execute appends one relation version/current
pointer and durable receipt. It cannot resurrect superseded owner effects or silently unlink.
Reconcile is read-only by stable steps; enhanced resume may issue only proven not-started local steps.

Export request deliberately does **not** use the cross-actor semantic-operation identity. The server
creates a unique `CrmExportRequestIntent` owned by the exact actor/account and versions its approved
query/field set/reason. Lost-response retry deduplicates only through the actor-scoped key/fingerprint
and that intent version. Generate/consume/revoke final-fence the same actor/account, current session/
assurance/access epochs and export-intent/job versions. Two authorized users requesting an equivalent
dataset receive separate intents, jobs and non-transferable capabilities; no receipt or delivery
artifact crosses actors.

- same key + exact fingerprint returns or resumes the original durable operation and ultimately the
  same complete receipt;
- same key + different fingerprint returns conflict without revealing the earlier request;
- the same raw key used by different actors/approved issuers, environments or organization scopes
  does not collide, while the semantic-operation constraint still admits only one authorized effect;
- the same actor/issuer reusing a raw key in the same environment/organization/operation namespace
  for another root receives same-key/different-fingerprint conflict; root is deliberately in the
  fingerprint, not a loophole for key reuse, and the error discloses no prior target;
- a stale authorization/version/policy/recovery generation cannot resume effects;
- one deterministic step ID is derived for each owner command, and every owner enforces its own
  semantic key/digest/version invariant;
- retention/hold derives one stable step per record/disposition; ambiguous destructive results are
  reconciled against record/key/hold/backup state before any resume, and SoD is final-fenced;
- owner receipts record `not_started|accepted|reused|blocked|conflict|unavailable|ambiguous` plus
  owner resource/version and correlation—not sensitive payloads;
- `ambiguous` is reconciled against the owner using the reserved operation/step ID before any retry;
  retries never allocate a new semantic action;
- completion is atomic with the final receipt/outbox state; expiry or operator recovery cannot
  erase a partially applied operation.

This contract prevents an idempotency key from crossing actor, organization, root, preview,
operation, payload, policy or recovery generation. Exact retention and operator resolution remain
`CRM-005/013/017/018` decisions.

An export receipt is not a download grant. Generation stores row/field authorization snapshot
provenance and creates an opaque, actor/session/purpose/assurance/recovery-bound short-lived
capability. `consume` is server-mediated, private and `no-store`; it rechecks current actor, session,
membership, permission, resource scope/access epochs, purpose, assurance, export version/status,
retention and recovery epoch immediately before byte delivery. Forwarding, scope/role/session change,
revocation, expiry, restore generation or disallowed repeated use fails closed. Generation, consume,
denial, expiry and revocation emit minimized audit events; raw object URLs are never authority.
The first approved policy is single-use. Only an explicit authorized user download method consumes;
HEAD, prefetch, link scanners and metadata probes never advance state. The server atomically reserves
the one consume attempt/status with current intent/job/scope versions before streaming. Concurrent
consumes admit one. If the connection fails after reservation, the capability is not regenerated or
replayed; the user creates a new fully authorized export request. Any future resume/range support
requires a separate CRM-018 token/range policy. Audit distinguishes attempted, stream-started and
stream-completed; completion does not assert that the human received or opened every byte.
Export status list/get authorizes actor/account/current session/assurance and every current purpose/
binding/resource scope before match/count/cursor/detail. Request binds exact purpose or closed
binding set, dataset/field/format/limit/TTL policy and access snapshot; generation reauthorizes each
row/field and records suppressed counts without exposing them.

CRM retention delegates policy/legal authority to M085 through a typed, versioned receipt but M017
owns execution against M017 records and durable per-record status. `CrmRetentionPreview` uses a
closed disposition union `retain|restrict|anonymize_allowlisted_fields|tombstone_body|crypto_shred|
purge_after_backup_expiry`; no generic delete exists. Apply final-fences every record/current
revision, root/binding/Opportunity relation, owner/downstream reference, legal hold, minimum-retention
period, token/key version, backup-expiry evidence and recovery epoch. Append-only stage/assignment/
engagement/next-action/relation/business-event ledgers and M077 audit metadata are preserved or
minimized only according to an explicit M085/legal disposition; the command cannot rewrite history
to claim an event did not occur. Alias/tombstone authority remains non-auth and cannot be purged while
referential/recovery obligations exist. Hold apply/release is separate, audited, versioned and SoD-
gated. Partial/ambiguous effects reconcile by stable per-record step before resume; restore cannot
resurrect disposed data or erase a hold.
Hold apply and release are distinct CAS transitions. Apply binds exact records/legal policy and
expected no/current holds. Release names the hold/current version and requires authority explicitly
covering that hold/scope/reason plus every overlapping hold version. It appends immutable hold
history/event/receipt atomically; a newer/overlapping hold and minimum retention remain effective,
and release never means purge or deletion eligibility.
Retention `reconcile` is read-only owner/key/hold/backup lookup by stable ambiguous step. Enhanced
`resume` requires an approved plan/digest, current assurance/SoD, final versions and only proven-not-
started steps. Accepted/ambiguous destructive or hold steps are never reissued as a new operation;
legal-hold apply/release shares the strong semantic identity and must reconcile its original receipt.
For `CrmInternalNote` body disposition, generic retention has no independent shred/tombstone path.
Its stable per-record step delegates atomically to the exact `redactRevision` domain command and must
meet CRM-010 + CRM-022 + M085, note/target/binding/epoch/assurance/SoD/hold fences. Both entry paths
share one canonical semantic disposition identity and current-revision pointer, so a race replays one
receipt rather than destroying twice or bypassing note-specific events/authority.

Every `OwnerProjectionResult` includes owner/contract/schema version, source `asOf`, freshness,
classification/coverage and exactly one state from the closed union `complete`, `partial`, `stale`,
`unavailable`, `suppressed`, `denied`, `unknown` or `not_applicable`. Owner projections are read-only; no composition contract writes another
module. Pipeline/source/tag/filter configuration requires separate permission, immutable version or
expected-version receipt and audit; no UI/database direct write is allowed.

Purpose-binding changes use CAS/idempotency/audit and an independently incremented access epoch.
M078 evidence is referenced but M017 never creates consent. Revocation/expiry invalidates affected
queries, cursors, jobs, previews/capabilities and projections without touching other bindings; new
purpose/service work must explicitly propose/activate its own binding. No tag/stage/opportunity/AI
action creates or broadens one implicitly.

At most one current active binding may exist for `(relationship, stableLogicalPurposeServiceId)` at
an instant across all definition versions. The applied definition code/version remains immutable
evidence; upgrading it atomically supersedes/closes the prior binding before the new version becomes
active. Effective periods cannot overlap. Concurrent activate/upgrade/renew/revoke/supersede uses a
unique non-overlap invariant plus CAS; renewal creates a new version/supersession lineage. Every list/get/
360 cursor and response carries the exact active binding ref/version/access epoch selected by the
authorized user. A stale/revoked binding fails closed and never resolves to another binding.
For list queries, callers cannot choose historical `asOf`. On the first authorized request, the
server chooses `asOf` and resolves
the unique non-overlapping active binding independently for each authorized relationship. The cursor
binds that purpose/service, `asOf`, the binding-registry version and authorization context; every row
returns its exact binding ref/version/access epoch. A changed registry invalidates the cursor.
Every subsequent page rechecks current binding/epoch/revocation plus registry; cursor `asOf` preserves
snapshot ordering only and never resurrects historical access. Historical reporting is a separate
authorized M092 contract.
All cross-row Opportunity/pipeline/activity/list/segment/saved-view scopes use this stable logical ID
plus registry version/as-of; embedded definitions cannot pin an applied version as scope. Each result
retains its immutable applied definition ref/version for meaning/history.
Activity, note and attribution writes expose the exact binding ref/version/access epoch as dedicated
contract fields derived/final-fenced server-side—not hidden in free-form input. Attribution is stored
separately per binding. Tag targets are a closed concrete M017 union with exactly-one/ref integrity;
saved views are actor/approved-team configuration and never pretend to target a record. External
quality subjects require owner-issued typed receipt validation before persistence or display.
Activity append final-fences current root, exact binding and a closed target outside free-form
content. Binding/Opportunity targets require expected target version; external projections require
a typed owner event receipt/version. Post-close Opportunity activity is allowed only for approved
historical/follow-up types under `CRM-009`; it cannot change stage/next action or attach new
commercial work to superseded/losing roots.
Owner corrections never edit or double-current an Activity. `supersedeFromOwnerCorrection` final-
fences the original activity/current revision, prior/new owner receipt versions, root, target and
binding epoch; it appends an immutable corrected revision/supersession lineage and advances the
current pointer with event/audit/outbox atomically. A manual CRM correction uses a distinct CRM-009-
approved structured corrective activity, never edits history or impersonates an owner correction.

Duplicate-candidate production is closed to four paths: accepted M020 handoff, Opportunity creation,
approved import apply/review and an authorized data-quality re-evaluation. Import preview returns
ephemeral findings only. Each persistent path calls
`DuplicateDetectionService.evaluate` with owner receipts and approved keyed match evidence. It
creates/reuses/supersedes a candidate idempotently; it never merges. M018/M019 contact/relationship
changes mark affected pending evidence stale and enqueue bounded re-evaluation. A prior `distinct`
decision is preserved with its policy/evidence version and only a materially new ruleset/evidence
opens a new candidate. `crm.duplicate_candidate_detected` contains opaque candidate/type/policy
metadata only.
Opportunity creation is the atomic producer exception in timing, not policy: intent reservation,
candidate evaluation and Opportunity/action/root-inventory mutation commit as one transaction or
none. Conversion cannot race ahead because it rereads the complete intent-candidate inventory;
nonterminal or ambiguous review fails closed.

Non-duplicate data-quality issues use a closed, versioned ruleset under `CRM-023`. Accepted handoff, opportunity/
attribution/metadata changes, import apply/review and owner correction/revocation receipts may
create/reuse/supersede an issue idempotently. M017 can assign, defer or mark resolution only from a
fresh canonical-owner receipt; it never edits M018/M019/M020 facts to “fix” them. Data-quality UI
masks protected evidence and reauthorizes the owning record. `crm.data_quality_issue_detected`,
`crm.data_quality_issue_rechecked` and `crm.data_quality_issue_resolved` contain only opaque refs,
type/severity/result/policy versions and times. Retention is `CRM-022`.

Import recovery favors forward reconciliation. Every row/owner effect uses recovery-stable deterministic step IDs
and durable `not_started|accepted|reused|blocked|conflict|unavailable|ambiguous|irrevocable|
compensated` receipts. `reconcile` queries ambiguous owners before another effect. `compensate`
requires current enhanced authorization, expected import/owner versions, recovery epoch and an
approved versioned plan whose eligible effects are explicit. It may supersede/reverse only owner-
supported reversible M017 changes; it never hard-deletes history, consent, canonical Person/Client/
Organization facts or irreversible external effects. Irrevocable/failed compensation remains
visible as `partially_compensated|recovery_required` for manual correction. Only durable proof that
every applicable owner effect reversed yields `compensated`; no state is called `rolled_back`. A
second retry returns the original receipt. Compensation and any reconciliation path that may issue
an owner command use the high-risk stable semantic identity with compensation-plan digest and exact
owner versions; read-only reconciliation may only update the durable receipt after owner lookup.

Import effect routing is closed. `submit_new_lead_to_m020` must receive a current M020 intake/
Person-resolution/handoff receipt before the one-use bootstrap may create/reuse a relationship and
proposed binding. It cannot activate that binding. Existing-target effects final-fence the exact
root/binding/access epoch, definition and ordinary command versions per row; Opportunity creation
uses the normal root inventory/action-handoff invariant. A row cannot mutate canonical Person,
contact method, Organization, Lead, consent, preference, Client, payment, order, case or task facts,
and an unknown effect code rejects rather than falling back to a generic update.
Import status/list/row-result, reconcile and compensate authorize the actor/account-owned import
intent plus the complete current per-row root/binding/target/classification/owner-access, job and
recovery versions before match/count/cursor/detail or owner lookup/effect. Loss of any row scope
generically suppresses the whole cross-scope job unless CRM-017 explicitly approves a field-class
projection with hidden counts; it never returns an authorized subset implying hidden rows. Reconcile
is owner-read-only by stable ambiguous row-step IDs. Compensation requires the exact approved plan/
digest, only reversible step/current owner versions, assurance/SoD and stable compensation IDs;
ambiguous/irreversible effects cannot be called compensated or retried under new IDs.

## 12. Events and background jobs

### M017 domain events

`crm.relationship_created`, `crm.relationship_state_changed`, `crm.assigned`,
`crm.purpose_binding_proposed`, `crm.purpose_binding_activated`, `crm.purpose_binding_revoked`,
`crm.purpose_binding_rejected`, `crm.purpose_binding_expired`, `crm.purpose_binding_superseded`,
`crm.purpose_binding_renewed`, `crm.purpose_engagement_changed`,
`crm.binding_access_ended_remediation_state_changed`,
`crm.opportunity_created`, `crm.opportunity_details_changed`, `crm.opportunity_stage_changed`,
`crm.opportunity_closed`, `crm.opportunity_reopened`, `crm.opportunity_relation_changed`,
`crm.opportunity_organization_context_changed`, `crm.next_action_changed`,
`crm.next_action_task_link_changed`, `crm.activity_recorded`, `crm.activity_corrected`,
`crm.note_created`, `crm.note_superseded`,
`crm.note_redacted`, `crm.tag_assigned`, `crm.tag_removed`,
`crm.campaign_definition_changed`, `crm.custom_field_definition_changed`,
`crm.custom_field_value_changed`, `crm.list_definition_changed`, `crm.list_membership_changed`,
`crm.segment_definition_changed`, `crm.assignment_rule_changed`,
`crm.assignment_evaluation_state_changed`, `crm.automation_rule_changed`,
`crm.automation_execution_state_changed`, `crm.score_evaluation_changed`,
`crm.ai_tool_definition_changed`, `crm.ai_proposal_state_changed`,
`crm.search_projection_state_changed`, `crm.reporting_projection_state_changed`,
`crm.retention_operation_state_changed`, `crm.legal_hold_state_changed`,
`crm.duplicate_candidate_detected`, `crm.duplicate_reviewed`, `crm.merge_requested`, `crm.merge_completed`,
`crm.opportunity_duplicate_resolution_requested`, `crm.opportunity_duplicate_resolution_completed`,
`crm.data_quality_issue_detected`, `crm.data_quality_issue_rechecked`,
`crm.data_quality_issue_resolved`, `crm.import_state_changed`, `crm.import_compensation_state_changed`,
`crm.export_state_changed`, `crm.attribution_changed`, `crm.pipeline_configuration_changed`,
`crm.pipeline_migration_state_changed`, `crm.high_risk_operation_state_changed`,
`crm.metadata_configuration_changed` and `crm.conversion_completed`.

Events contain opaque IDs, reason codes, policy/schema versions and timestamps—not names, email,
phone, note bodies, message bodies, document titles, tax/credit facts or provider payloads.
Protected-field reveal does not publish the revealed value in an M017 event. Its allowed, denied and
failed attempts go only to the M077 protected-access audit port with minimized metadata; the opaque
receipt is not readable as a value or authorization capability.
Every change event carries aggregate/operation ID, prior/resulting version or monotonic sequence,
closed semantic outcome code, occurred-at and idempotency/outbox event identity. Assignment events
also carry the closed target kind/ref and prior/resulting assignment-history versions. Partial,
ambiguous, reconciled, recovery-required, compensated, consumed, revoked and expired states remain
distinct closed codes; they are never reported as a generic completion. Consumers deduplicate and
order per aggregate/operation, tolerate delayed replay and reread current authority. M077 audit
evidence is separate and cannot substitute for these domain lifecycle/invalidation events.
The generic `*_changed` families above always carry a closed aggregate-kind and outcome code from
the approved registry—never free-form type—and the exact prior/resulting aggregate/projection
version. Aggregate mutation, current pointer, privacy-allowlisted event, M077 audit and transactional
outbox commit atomically. Correction/invalidation/expiry/rejection remain distinct and replay tests
cover every registered aggregate kind; an unregistered kind cannot publish or mutate.
`crm.pipeline_configuration_changed` distinguishes draft revision, publish and retire outcomes/
versions. `crm.metadata_configuration_changed` has a closed registry containing source/tag
definition lifecycle kinds and saved-view `created|updated|deleted` kinds with exact versions;
campaign/custom/list/segment/rule families retain
their named events. Remediation events carry binding ended epoch, plan/receipt version and closed
all-applied/blocked/conflict code so children/caches can invalidate without payload.
Purpose-binding events include only opaque binding/purpose-service refs, resulting status/access epoch
and policy/version—not evidence values—and are reread/invalidation hints, never authorization facts.
Organization-context and Task-link events contain only the M017 target/version, opaque M019/M023
owner ref/receipt version/access epoch and a closed `linked|superseded|cleared|stale` outcome. They
are cache/invalidation hints, never substitutes for a current M019/M023 owner read or access grant.
Rejection is valid only from `proposed`, increments its version, emits event/audit/outbox atomically
and grants no active access epoch; retry returns the same receipt. Renewal atomically final-fences the
old binding/evidence, creates the nonoverlapping replacement version/effective period, advances the
logical-service access epoch, supersedes the old version, invalidates dependents and returns one
idempotent receipt; partial replacement is impossible.

### Jobs

- bounded purpose-binding expiry scan using a least-privilege exact capability; it CAS-advances
  eligible active bindings to expired, increments access epoch and commits outbox/audit atomically;
  job outage changes no authorization because request-time interval checks remain authoritative;
- typed M018/M020/M078 purpose-evidence correction/withdrawal/revocation inbox consumer; it rereads
  the owner, applies the exact invalidation command and binding-ended quarantine idempotently, while
  request-time freshness/revocation checks fail closed during delay/outage;
- typed M019 relationship correction/end/revocation inbox consumer; it stales affected Opportunity
  organization projections and blocks organization-dependent effects until an explicit current
  owner receipt is accepted—never falling back to another organization;
- typed M023 Task correction/deletion/reassignment/access-revocation inbox consumer; it final-fences
  the exact Task-link receipt then supersedes/clears only the minimized CRM link and emits history/
  audit/outbox atomically without changing Task lifecycle;
- overdue next-action detection and unassigned/inactive-owner exception generation;
- completed-without-successor and active-without-actionable-disposition gap detection;
- conversion and merge reconciliation after ambiguous owner responses;
- import validation/apply/reconciliation/compensation orchestration;
- export creation/expiry/revocation/orphan cleanup;
- attribution and derived-view refresh under approved retention;
- delayed event/inbox replay and restore-generation reconciliation.
- bounded duplicate-evidence re-evaluation after approved M018/M019 owner changes; no job merges.
- bounded data-quality re-evaluation after owner correction/revocation and import reconciliation/
  compensation; no job edits canonical owner facts or deletes history.
- bounded CRM retention/hold enforcement and due-disposition scan driven only by current M085/legal
  receipts; it final-fences per record and may rotate/remove keyed match-token versions or schedule
  purge only after hold, minimum retention, owner/downstream and backup-expiry proof. Failure remains
  visible for manual recovery; no job interprets age alone as delete authority.

Inngest coordinates retries with stable idempotency keys, bounded attempts and manual recovery.
Postgres remains the durable business-state authority. Jobs reauthorize before each sensitive step,
do not continue after revocation and never create consent or send marketing by implication.

### Structured automation and AI boundary

After `CRM-019`, structured deterministic rules may perform only explicitly allowlisted low-risk
actions without an AI/model decision, such as request an M023 follow-up task, place an item in an
approved queue, flag a missing next action, suggest an appointment or create an opportunity draft.
Each rule has versioned conditions,
purpose, owner, inputs, action port, idempotency, retry limit, audit and manual fallback. Prompts alone
cannot define a rule.

Rules/AI cannot file documents, perform disputes/tax work, issue refunds, apply for financial
products, share client data, modify payment/consent/verified identity, execute a merge, open all
documents or export all relationships. Future AI tools are narrow reads/proposals (`get authorized
CRM summary`, `list authorized open opportunities`, `suggest next action/tag/duplicate candidate`,
`propose task`, `propose structured activity`) and never execute the proposed command. Each versioned
tool defines allowlisted input/output fields, prohibited fields, purpose, classification, model/
prompt/policy versions, expiry and correction. An approved human sees sources, diff and consequences
and confirms; the canonical owner then performs a freshly authorized, idempotent command with its own
actor/receipt. Any future autonomous deterministic low-risk command requires explicit tool-specific
`CRM-019` approval and cannot be selected or parameterized by model output. A summary records permitted sources, model/prompt/
policy versions and distinguishes facts, inferences and unverified inputs; it is correctable and
never replaces the source facts.
All rule, score, tool and proposal lifecycle calls use the exhaustive §11 contracts. Unknown action
ports/fields/proxies/models fail closed; source correction/revocation stales pending evaluations and
proposals. Rules, scores and model output never become RLS claims, grants or direct database writes.

## 13. Error states and recovery

| Condition | Required behavior |
|---|---|
| Unauthorized or scope changed | Generic denial; no count/existence leak; audit protected action |
| Stale version/stage | Reject atomically; refresh current allowed representation |
| Duplicate command/idempotency key | Return/reconcile original semantic result |
| Ambiguous party match | Create review candidate; never auto-merge or auto-create a second client |
| Owner module unavailable | Show `unavailable`/partial projection; queue bounded recovery if approved |
| CRM unavailable during channel intake | Channel/M020 preserves its durable receipt; report pending handoff, never claim CRM creation |
| Conversion partially accepted | Persist step receipt; stop, reconcile and require safe continuation |
| Merge conflict | Preserve both records; show conflict classes; do not guess winner |
| Assignment owner inactive | Requeue/exception according to approved policy; preserve history |
| Consent/preference unavailable | Block outbound communication; do not use cached approval |
| Import malicious/invalid | Quarantine/reject with row/file reason; never partially parse unsafe bytes |
| Import partial application | Preserve per-row outcome and compensating plan; no blind rerun |
| Export generation/delivery failure | Revoke artifact, preserve audit and permit fresh authorized request |
| Restore/replay | Increment recovery generation; invalidate projections/tokens; reconcile owners |
| AI/rule provider unavailable | Manual workflow remains available; no fabricated suggestion |
| Analytics unavailable | Core CRM continues; only approved content-free outbox facts wait for replay |

Recovery favors forward correction, versioned supersession, alias/tombstone and explicit
compensation. Destructive history rewriting and silent conflict resolution are prohibited.

## 14. Security and privacy requirements

- Data is Confidential by default and Highly Sensitive when source facts/classification require it.
- Least privilege, purpose limitation, field-level DTO minimization and RLS defense in depth.
- Application-level encryption for approved protected contact/note/import values; managed at-rest
  encryption alone is insufficient for fields selected by ADR 005 and the future field inventory.
- Keyed matching tokens use separate key purpose/version and are never logged or returned.
- CSRF protection, origin checks, output encoding, input/schema validation, safe rich-text policy,
  rate limits and mutation idempotency.
- Mutation DTOs use explicit allowlists and server-derived ownership/status/audit fields; mass
  assignment and role/scope/foreign-key tampering are rejected before domain mutation.
- Free text is untrusted. Neutralize stored XSS, formula injection and prompt injection; never place
  note/import content into system instructions or tool arguments without allowlisted extraction.
- Imports use M011 quarantine, content MIME validation, limits, malware scan and archive/executable
  rejection before parsing. CSV is parsed as bounded text. An allowed `.xlsx` is treated as a
  specifically validated OOXML ZIP package—not as an arbitrary archive—with signature/MIME/content-
  type/relationship validation and strict entry-count, nesting/depth, compression-ratio and total/
  per-entry uncompressed-byte limits. Macros (`.xlsm`/VBA), OLE/embedded executables, external links,
  unexpected encrypted packages, path traversal, polyglots and arbitrary nested archives are
  rejected. CSV/XLSX cell formulas remain inert content and are neutralized on export.
- Exports use fresh authorization, reason, step-up when approved, row/field minimization, formula
  neutralization, private delivery, short TTL and download/revocation audit.
- No PII, note text, contact methods, attribution IDs, document/message bodies or CRM DOM/session
  replay in PostHog, Sentry, logs or traces.
- No full payment-card data, passwords, Supabase/Google/Stripe secrets, provider tokens or private
  URLs in CRM.
- Purpose-binding activation/revocation/supersession, canonical merge, Opportunity duplicate
  resolution, conversion, import apply, owner-command reconciliation/compensation, export and
  protected-field reveal are enhanced-review operations. Exact assurance, reason/evidence, final
  binding/owner version fence and any separation-of-duties policy are independently gated; one
  capability never implies another.
- Backups preserve classification/encryption; key custody is separate; restore does not resurrect
  revoked access, exports or stale projections as active.
- Rate, timing, count and search-result behavior must resist person/client enumeration.

## 15. UX and accessibility requirements

### Admin information architecture

```text
Admin
└── CRM
    ├── Overview / My work
    ├── Leads (M020 projection)
    ├── Contacts / relationships
    ├── Clients (M018 projection)
    ├── Organizations (M019 projection)
    ├── Opportunities
    ├── Pipeline
    ├── Activities
    ├── Data quality / duplicates
    └── CRM settings (authorized roles only)
```

The exact route/labels are `CRM-002`. Import/export, campaigns, lists and advanced analytics appear
only after their release gates.

### Interaction requirements

- Desktop supports dense list and board modes; tablet/mobile use prioritized cards/list, not a
  horizontally unusable board.
- Drag-and-drop is optional enhancement. Every move has keyboard/menu alternative, destination
  label, required-field preview and success/error announcement.
- Next action, owner/queue, stage and freshness are visible without opening each record.
- Contact 360 uses progressive disclosure and reauthorized tabs; no giant all-data page.
- Autosave is used only for low-risk drafts with explicit `saving/saved/error` feedback. Stage,
  merge, export, close and conversion are explicit confirmed commands.
- Focus order, landmarks, headings, table semantics, status text/icons, 44px touch targets, zoom,
  contrast and screen-reader announcements meet WCAG 2.2 AA.
- Color never carries stage, risk, duplicate confidence or consent alone.
- Empty, filtered-empty, unavailable, denied, stale, partial and error states are distinct.
- Responsive UI never places PII into URL, browser storage, clipboard automatically or persistent
  notification content.
- Reduced motion disables nonessential board/card transitions.

## 16. Bilingual requirements

- Navigation, controls, system states, validations, confirmations, empty/error/recovery text,
  import/export instructions and consent references require English/Spanish parity.
- Canonical enum/reason codes are locale-neutral; labels are localized and versioned.
- Staff-authored notes, names, organization names and imported source content are not automatically
  translated or mutated.
- Search supports expected Spanish accents and English text without lowering identity-match safety.
- Dates use locale presentation plus explicit IANA time zone; storage remains UTC instants.
- Translation fallback never exposes an internal key or silently substitutes materially different
  consent/marketing language.

## 17. Acceptance criteria

1. The architecture identifies M018 Person/Client, M019 Organization and M020 Lead as canonical and
   creates no parallel person/client/lead truth.
2. CRM relationship, opportunity, pipeline, assignment and CRM-authored activity ownership is
   explicit and non-overlapping.
3. Every list/detail/write/export/merge path has server-side role/team/assignment/resource/purpose/
   classification authorization and RLS defense.
   Multi-purpose relationships remain isolated by binding/access epoch; revoking one purpose cannot
   expose, hide or authorize another.
4. Public/channel capture cannot query existence; duplicate evidence cannot automatically merge.
5. Active opportunities expose owner/unassigned state and next-action disposition. The disposition
   includes type, UTC due time plus display IANA zone, responsible owner/queue and optional M023 Task
   reference without duplicating Task state.
   A relationship also supports the same typed disposition before any Opportunity exists; jobs and
   views evaluate the explicit target and never require a fake Opportunity.
6. Invalid/stale stage transitions fail atomically and retain historical pipeline version meaning.
   Each successful transition/close/reopen appends one immutable history row with exact definition/
   stage/policy/actor/reason/evidence and resulting version; M092 reads this ledger through an
   authorized projection, never raw audit/activity.
7. `won` cannot assert paid, client-active, entitled, approved-to-start, case-open or completed.
8. Conversion is idempotent, version-fenced and records each owner result in an approved closed DAG.
   Same key/same fingerprint returns the original complete receipt; same key/different fingerprint
   conflicts; ambiguous owner steps reconcile before retry and execute no second effect.
   Dependents remain `dependency_blocked` until proof of an allowed prerequisite outcome; Case/order
   effects cannot run against an unconfirmed Client/order and no automatic reversal is assumed.
9. Timeline/360 views use typed minimized projections and reauthorize drill-down; bodies are not
   copied into CRM.
10. Consent/preference is checked fresh through M078/M026 before any outbound communication.
11. Protected matching uses keyed, versioned, domain-separated tokens; no unkeyed low-entropy hash.
12. Merge provides dry-run impact/conflicts, expected versions, explicit authority, audit,
   alias/tombstone and recovery.
   It never rewrites or follows M007 account/external-identity linkage; affected sessions/grants are
   frozen or revoked until a separately authorized IAM-008 process completes.
13. Import uses quarantine/scan/limits/preview/deduplication/per-row results and creates no consent.
    Partial/ambiguous effects have implementable reconcile/approved compensation contracts; owner-
    irreversible facts and history are never hard-deleted.
14. Export is minimized, step-up/reason gated when approved, formula-safe, temporary and audited.
    Download is server-mediated and final-fenced; a forwarded capability, revoked scope/session or
    prior recovery generation cannot obtain bytes.
15. Internal notes never enter client DTOs, broad analytics, notifications or AI by default.
16. Board/list controls are keyboard-equivalent and usable at supported responsive breakpoints.
17. EN/ES parity and WCAG 2.2 AA checks cover critical journeys.
18. All Product Owner decisions and activation dependencies are explicit; no placeholder is shown
   as operational behavior.
19. No product code, route, dependency, schema or provider is added by this documentary candidate.
20. An optional M023 Task link is accepted or displayed only with the exact current owner-issued
    target/purpose/visibility/classification/access receipt; correction, deletion, reassignment or
    revoke supersedes/clears the CRM link without mutating Task.
21. Optional Opportunity organization context is guarded by a current M019 relation receipt on
    create/read/mutate/convert; end/revoke blocks organization-dependent work and never falls back.
22. Lead qualification is read only from the typed M020 owner port/query with version, source,
    evidence refs, `asOf` and freshness; M017 cannot infer or change it.
23. Contact 360 accepts only registered section codes, authorizes each owner projection independently
    and cannot upgrade denied/stale/partial data or fan out to unspecified resources.
24. Every governed definition uses separate CAS draft/revise/publish/retire operations; saved views
    bind exact dataset, logical purpose, schema/filter registries and current actor/team authority.
25. Protected reveal keeps value and M077 receipt separate, audits allowed/denied/failed attempts
    without value content and exposes compliance history only through M077.

### Required future verification matrix

- Functional: relationship, M020 lead handoff, qualification projection, opportunity/pipeline/
  transition, assignment/next action, source/tag/activity/note, Contact 360, conversion, duplicate/
  canonical resolution, consent projection and approved import/export.
- Follow-up invariant: completing a current action atomically installs a successor or approved
  exception/terminal state; completed-without-successor, overdue and stalled active work is detected
  as a gap and cannot satisfy acceptance.
- Next-action ledger: completion/successor atomicity, concurrent edits, Task link/version, binding-
  Opportunity handoff, retention and restore preserve append-only transitions and exactly one current
  pointer without duplicating/mutating M023 lifecycle. Cross-client/case/purpose Task substitution,
  stale owner receipt/access epoch, correction/deletion/reassignment/revoke and history/query races
  fail generically or clear/supersede only the minimized link.
- Organization context: create/update/transition/close/reopen/list/get/history/pipeline/conversion
  reject a stale, ended, revoked, wrong-person, wrong-purpose or wrong-classification M019 relation;
  no path silently chooses a preferred organization or produces an Organization-scoped owner effect.
- Lead qualification: exact M020 Lead/outcome/evidence/version/as-of/freshness and owner-scope receipt
  are required; correction/revocation invalidates, unauthorized list/detail leaks no count/existence,
  and no CRM stage/tag/score can become or mutate qualification.
- Contact 360: every closed section code tests exact owner refs/versions/grants, per-section denial,
  partial/stale/unavailable propagation, bounded freshness, opaque reauthorized drill-down and no
  unspecified fan-out/content copying. One incomplete requested section prevents aggregate complete.
- Opportunity handoff: create versus binding-action update and close/reopen versus successor action
  preserve one accountable non-duplicated workstream, both histories and exact binding/Opportunity
  versions; bindings with active Opportunities are not falsely flagged for a second action.
- Root race: Opportunity create versus root supersession/merge and binding revoke admits either a
  current-root Opportunity included in the merge inventory or a conflict; never a new record on a
  losing alias or an unfenced binding.
- Reopen: won/lost/cancelled source policy, destination stage, reason/evidence, exact binding epoch,
  immutable ledger append, owner/next-action establishment, simultaneous close/reopen and retry admit
  one versioned outcome.
- Security: IDOR/cross-client/cross-team, role and mass-assignment tampering, hidden fields, notes,
  enumeration/search/count/cache leakage, merge/export/import authority, malicious file/formula,
  consent mutation and note/import prompt injection.
- Workload security: direct-browser workload forgery, cross-environment/organization, wrong issuer/
  audience/service/action/signing-key version, before-`nbf`/after-`exp`, replayed nonce, revoked source receipt, stale recovery generation and missing original-
  actor/purpose evidence; exact target/root, purpose binding/access epoch, command/payload digest,
  expected-version and idempotency-key substitution; parallel replay admits one atomic effect.
- Handoff review: unauthorized proposal enumeration/detail, receipt/evidence substitution, activation
  without owner reread, stale policy/binding version, activation race and proposed-binding use on an
  ordinary CRM query/action all fail closed; activation does not create consent/contactability.
  Concurrent activate/reject, duplicate reject and reject of active/expired/revoked proposals admit
  exactly one valid transition; reject never aliases to revoke or creates an active access epoch.
- Read surfaces: proposed-binding review, Opportunity list/detail/pipeline, Activity/Note/Quality
  queues, assignment history, Duplicate detail and Import/Export status/row-result pagination reject IDOR, cross-binding/
  job-epoch replay, count inference and stale cursors before returning minimized DTOs.
- Duplicate-review authorization: party/opportunity candidates spanning different purposes, teams,
  owners or classifications are suppressed unless the actor is authorized for every member and
  binding; stale owner receipts/epochs, one-member revocation and decide races fail generically with
  no count, ordering or timing inference.
- Data-quality authorization: typed M017 and external M018/M019/M020 subjects reject IDOR, cross-
  purpose/team/classification access, stale assignment and owner deletion/correction/revocation.
  Resolution requires the changed owner receipt; suppressed issues leak neither existence nor queue
  counts/timing.
- Conversion recovery: lost response, partial acceptance, ambiguous owner, stale binding/owner
  versions, parallel reconcile/resume and restore use the reserved operation/step IDs; status is
  authorized/minimized and no accepted/ambiguous owner command executes twice.
- Merge/Opportunity-resolution recovery: authorized status, read-only reconcile and enhanced resume
  use stable operation/step IDs plus exact root/binding/Opportunity/owner versions; parallel recovery,
  stale plans and restore cannot reissue accepted/ambiguous steps or bypass frozen cutover state.
- Protected reveal: ordinary DTO/CSS-hidden/cache/export/clipboard/URL/log/trace/analytics paths never
  contain full contact values; wrong field/classification/reason/assurance, M018 owner-version change,
  binding revoke/access-epoch race and repeated/expired optional reveal fail closed and audit safely.
  Allowed/denied/failed M077 records contain no value or replayable capability; only authorized M077
  projections expose minimized attempt history.
- Configuration: pipeline/source/campaign/tag/custom-field/list/segment/assignment/automation/
  scoring/AI-tool definition and saved-view lifecycle/query
  require separate exact config scope, concurrency and audit; no UI writes tables directly.
  Draft/revise/publish/retire stale-version and registry/usage-inventory races fail closed and never
  edit a published version. Saved-view create/update/delete/list/get/apply reject dataset/purpose/
  schema/filter/team-receipt drift and never broaden by dropping an unavailable predicate.
  Concurrent tag assign/remove and custom-field set-initial/supersede/clear final-fence exact target,
  binding epoch, immutable published definition and current assignment/value pointer or absence; one
  CAS wins and stale operations cannot delete or overwrite another revision.
  Publish racing Opportunity creation/transition and retirement racing transition/tag assignment/
  attribution admits one applied immutable version. Retirement never deletes history; pipeline
  migration requires dry-run, every exact Opportunity version, CAS, appended transition/migration
  history and partial/ambiguous recovery without silent stage mapping. Per item it also final-fences
  current OpportunityRelation group, nonterminal DuplicateCandidate, canonical commercial intent and
  conversion receipt. Superseded denies; pending/ambiguous review blocks; related/keep-both members
  migrate only under the approved per-member mapping and never create owner effects.
  Migration reconcile is read-only lookup of stable ambiguous item steps. Enhanced resume requires
  approved plan/digest, current assurance/SoD, recovery epoch, all final per-item pipeline/
  Opportunity/binding/relation/candidate/conversion versions and only proven-not-started IDs;
  accepted/ambiguous items never reapply or append a second stage history.
- AI proposal lifecycle: approve, reject, server-time expire and owner-correction supersede enforce
  distinct actor/capability/evidence contracts. Approve↔expire, approve↔correction, reject↔expire and
  consume↔correction races admit one versioned result; replay or delayed owner events cannot revive,
  execute or disclose a stale proposal.
- Authorization families: binding proposal cannot activate; activation/revocation, attribution,
  activity/note create-supersede, note redaction, data-quality, import apply, reconcile and
  compensation capabilities are independent;
  wrong actor type/subject/binding/evidence/reason/assurance/SoD or expected version fails closed.
- Data quality: duplicate/shared/recycled email and phone, similar/family names, similar organization
  names, incomplete/conflicting records, normalization/key rotation, duplicate opportunities,
  attribution/version and import conflicts; changed owner evidence under the same ruleset creates a
  new superseding candidate; opportunity duplicates resolve only through explicit non-destructive
  M017 policy; import preview produces no persistent issue/candidate before approval.
- Import effect boundary: new-contact rows cannot bypass M020 intake/Person resolution or bootstrap
  evidence and create only proposed bindings; existing-target rows reject stale root/binding/epoch/
  definition versions and cross-purpose substitution; Opportunity rows preserve the ordinary root-
  inventory/action-handoff race invariant. Unknown/mass-assigned fields and attempts to overwrite
  M018/M019/M020/consent/Client facts fail per row with no partial implicit success.
- Import recovery/status authorization: multi-purpose rows, owner/team revoke, target/classification
  change, stale job/recovery epoch and hidden-row count inference suppress before pagination. Read-
  only reconcile uses stable ambiguous IDs; compensation rejects stale/nonreversible steps, missing
  assurance/SoD and alternate IDs after lost response/restore.
- Concurrency/recovery: simultaneous assignment/stage changes, duplicate conversion/merge/import,
  delayed/reordered events, inactive user, owner outage and restore-generation fencing; distinct
  normalized effects against one root do not collide, while an identical effect under different
  actors/keys/equivalent previews admits exactly one winner and one owner-step lineage.
- Opportunity intent race: two creates with the same canonical commercial intent reserve/evaluate
  one shared intent candidate domain before commit; create↔detect↔convert and two-create/two-convert
  races cannot bypass pending review or generate distinct owner-effect identities. Nonterminal/
  ambiguous candidate blocks; approved distinct/keep-both/related/superseded semantics then apply.
- Party duplicate race: M018 contact correction or M019/M020 owner change creating/staling a party/
  root candidate versus conversion invalidates the preview and blocks downstream effects until a
  current distinct/resolved canonical-owner receipt is final-fenced.
- Root cutover: merge racing list/read/write, binding activation/revoke/renew, Opportunity create/
  transition/conversion, queued job and restore admits one current root; all losing epochs/cursors/
  capabilities invalidate, same-purpose collisions follow the approved plan and aliases never
  authorize or receive newly written work.
- Root mutation safety: generic patch/mass assignment and client-supplied owner/lifecycle/purpose/
  contact fields are rejected; owner-projection refresh requires typed expected owner/root versions,
  and no update follows or writes a superseded alias.
- Purpose-binding concurrency: activate/renew/revoke/supersede cannot create overlapping current
  bindings or overwrite another binding's owner/lifecycle/next action; stale read/action cursors fail
  closed and never fall back to a primary purpose. Revocation/restore event reordering triggers fresh
  reread by access epoch and cannot resurrect a binding or dependent projection/job/preview.
- Binding evidence races: proposal/activation versus owner correction, evidence withdrawal or
  consent revocation admits one final-fenced result; stale evidence/policy versions fail generically.
  Revoke/supersede accepts only the exact triggering owner receipt and expiry ignores client time.
  Delayed/duplicate/reordered owner invalidation events, inbox outage and request-time access admit no
  continued authority: owner freshness check fails closed and one workload command advances epoch/
  freezes dependents after exact child inventory fence.
- Binding end with active work: revoke/expiry/supersede versus Opportunity create/transition/close/
  conversion/action and recovery admits one inventory-fenced result. Voluntary end without a closed
  plan blocks; unavoidable end advances access immediately, freezes/quarantines every child and
  emits history. Privileged remediation final-fences the frozen inventory/SoD and never reactivates.
  Its multi-child execute is all-or-nothing local with no external effect; same-semantics retries
  return one receipt and stale/second/restore attempts cannot partially or doubly dispose children.
- Engagement lifecycle: archive/dormancy versus Opportunity creation/transition, next-action write,
  conversion or recovery admits one result; pending/ambiguous operations block. Reactivation appends
  history and establishes an owner/action when required without reviving downstream owner state.
- Effective-time expiry: reads/writes/RLS, cursor pagination, long-running export/conversion final
  fences and restore deny at the half-open server-time boundary even before the expiry job; delayed/
  duplicate job execution CAS-updates status/epoch/event once and clock/client-time manipulation
  grants nothing.
- Definition upgrade: concurrent activation under old/new purpose-service definition versions admits
  one active logical service binding; list `asOf` resolves exactly the applied version for that time
  and never returns both or silently changes historical evidence.
- Binding-version continuity: renewal/upgrade versus Opportunity transition/conversion/restore
  final-fences the stable binding ID, current-version pointer and access epoch. The old version stays
  immutable evidence; Opportunities resolve the new current version without rebinding to another
  logical purpose, and stale versions/epochs cannot orphan or authorize work.
  Wrong-service/draft/retired replacement and registry publish/retire races fail before pointer change.
- Binding renewal/assignment: revoke/restore/epoch advance racing assignment fails its final fence;
  renew versus revoke/expire/second renew admits one atomic supersession/replacement receipt, no
  overlap or partial new binding, and restore cannot resurrect the predecessor/dependents.
- Destination eligibility: manual/rule assignment, next-action create/complete successor and close/
  reopen handoff racing account deactivation, membership/team/queue removal or eligibility version
  change rejects the stale destination; history records one valid assignment or explicit unassigned/
  pending result, never an ineligible accountable owner.
- Next-action concurrency: parallel complete/replace, attached-Task version change and target/
  binding revoke admit one CAS result; completion always appends evidence plus exactly one successor/
  exception/terminal handoff and never leaves `completed` in the current slot.
- Opportunity close handoff: close versus sibling create/close, binding action update, Opportunity
  action completion, revoke/merge/relation/conversion final-fences both ledgers/pointers. Either one
  explicit sibling owns the exemption or the binding receives an atomic successor/exception/
  terminal engagement; no duplicate or ownerless current work is committed.
- Opportunity reads: list/detail/pipeline authorize before row/count/cursor, retain exact immutable
  binding ref/version/epoch and pipeline/stage definition versions, and express partial/stale/
  unavailable/suppressed/denied/unknown/not-applicable without inference or hidden field transfer.
- Opportunity detail update: allowlisted field/source/currency validation, stale version, unknown/
  mass-assigned fields, negative/overflow minor units, binding revoke, close/update and simultaneous
  autosave races yield one audited result without affecting financial/eligibility authority.
  Probability rejects outside `0..10000`, missing provenance/explanation/freshness, unknown-as-zero,
  unapproved model/rule source and direct score-to-probability writes; every change appends estimate
  history and a content-free event.
- Purpose-bound writes: activity/note/attribution reject cross-binding substitution, revoked/stale
  epochs and revoke races atomically; attribution never moves or aggregates between bindings.
- Activity races: target-type substitution, stale owner-event correction, append versus Opportunity
  close/supersession, binding revoke and root merge final-fence exact versions; delayed owner events
  dedupe/supersede by receipt and never attach to a losing alias.
- Activity correction: duplicate/reordered prior/new owner receipts, concurrent manual correction,
  binding/root/target change and wrong original Activity revision admit one current pointer; history
  remains immutable and a manual correction cannot claim owner provenance.
- Attribution reads: cross-binding substitution, retired source definitions, corrected/delayed owner
  receipts, revocation/epoch race and pagination preserve immutable original/latest provenance without
  raw UTM/click/contact payload or silent label remapping.
- Attribution correction: duplicate/reordered/corrected/revoked owner receipts, equal occurred-at
  tie-breakers and recordTouch/correction concurrency preserve immutable original and exactly one
  deterministic latest current pointer with no cross-binding movement.
- Tag reads: cross-purpose filter/count, retired definition, binding revoke/epoch and concurrent
  assign/remove produce one versioned result without direct-table access or historical relabeling.
- Opportunity duplicate resolution: stale candidate/opportunity versions, unauthorized survivor,
  parallel execution, keep-both/link/supersede outcomes and recovery preserve both stage ledgers,
  assignments, activities, attribution and next actions; no automatic or destructive merge occurs.
  Converted-vs-unconverted, both-converted, active order/case/task/quote/payment/entitlement/approval,
  cross-purpose, restore and concurrent conversion/supersession conflicts never rewire owner facts,
  hide attribution or allow a second conversion effect.
- Opportunity relation conversion semantics: superseded members are denied; related members with
  the same stable commercial intent/owner-effect/service/scope deduplicate to one receipt, while
  different-intent related members may both convert; keep-both creates no blocking relation.
- Note revision: create versus target change and supersede versus concurrent revision/target/root/
  binding change admit one result; cross-note/cross-purpose substitution and note ID hidden in input
  fail, while current-pointer/revision/event/audit/outbox commit atomically.
- Opportunity relation integrity: self-link/cycles/contradictory groups, concurrent link/supersede/
  conversion and unauthorized unlink/correction fail; retention/restore preserves one current
  acyclic group, immutable prior versions and non-authoritative aliases.
- Relation correction: stale group/member/binding/owner/conversion versions, cyclic replacement,
  silent unlink, superseded-owner resurrection, concurrent ordinary work and duplicate correction
  fail. Dry-run impact, SoD, stable receipt, read-only reconcile and proven-not-started resume preserve
  every prior relation/history.
- Relation fence on ordinary work: resolution versus read/count/transition/assign/action/activity/
  note/attribution/tag/list/custom-field/migration/conversion invalidates stale context atomically;
  no new work attaches to superseded aliases, while authorized related members remain independently
  mutable under same-intent owner-effect dedupe.
- Pipeline migration races: migration versus duplicate resolution, conversion, close/reopen or
  relation correction final-fences every per-item relation/candidate/intent/conversion version;
  superseded/pending/ambiguous items cannot migrate, and related/keep-both mapping preserves each
  authorized member without financial/fulfillment owner effects.
- Converted lifecycle: conversion versus close/reopen and partially converted recovery final-fence
  the conversion receipt, relation group and downstream owner versions; owner facts remain intact,
  commercial history records the correction and no second conversion effect is possible.
- Note redaction: stale revision, cross-note/target/binding, concurrent read/export/search/AI/cache,
  backup restore and crypto-shred/tombstone replay preserve immutable metadata/audit while the body
  remains unavailable under CRM-010/022 and M085; legal hold or insufficient retention denies it,
  and before all approvals the command is unavailable.
- Retention/hold: every closed M017 record kind rejects missing/stale M085 policy/legal receipt,
  active hold, minimum-retention, owner/downstream reference or backup-expiry conflict. Apply/release,
  concurrent write/export/merge/relation/conversion, partial disposition, key rotation, restore and
  replay preserve append-only/audit exceptions and stable per-record receipts; no generic delete,
  alias resurrection, false history removal or cross-purpose disposition occurs.
  Note-body disposition specifically proves delegation to `redactRevision`; direct generic shred/
  tombstone and concurrent duplicate disposition are rejected/replayed under one semantic identity.
- Export authorization/consume: cross-purpose query, stale dataset/field/format/limit/TTL policy,
  session/assurance/access epoch change and row/field revoke fail before generation/status/count.
  Explicit GET-style user consume is single-use/atomic; HEAD/prefetch/scanner does not consume,
  concurrent consumes admit one and disconnect after reservation requires a new authorized request.
- Domain-event contract: every observable mutation above produces one outbox event with closed
  semantic outcome and aggregate sequence; duplicate, delayed, reordered and replayed delivery
  cannot conflate partial/final/recovery states or authorize from event data.
- Campaign/automation/scoring/AI: campaign metadata cannot select/send and M017 has no delivery
  handoff; any future M025 command rechecks M078/M026 per recipient. Unknown/high-risk rule actions, stale target/input/action-
  port versions, retry and partial execution preserve per-step receipts. Scoring rejects prohibited
  proxies/missing fairness evidence and never changes M020/eligibility/access. AI prompt injection,
  prohibited fields, expired/stale proposal, cross-purpose source, approval replay and source
  correction cannot execute a command; owner reauthorization remains mandatory.
- Performance: Product Owner-approved thousands-of-record/activity datasets, authorized search,
  filters, pipeline/list, timeline, deduplication, large allowed import and M092 projection. Exact
  budgets/datasets/concurrency are `CRM-021`; no undocumented threshold can claim readiness.
- Search boundary: Release 1A list filtering rejects contact/note/free-text/unknown fields, cross-
  purpose scope, stale binding/registry cursor and count inference. Root merge, revoke/expiry and
  retention changes invalidate cached list results. Future M089 projection/query additionally tests
  delayed correction, deletion/redaction and suppressed/stale results before global search activates.
- Reporting boundary: duplicate/reordered/corrected fact envelopes deduplicate by fact identity and
  source version; wrong grain/dimension/purpose/classification, direct identifiers/free text,
  insufficient aggregation, stale viewer scope and retention invalidation fail. M092 metric/viewer
  policy is required before any report result.
- Experience: EN/ES, keyboard, screen reader, 200% zoom, reduced motion and desktop/tablet/mobile
  critical journeys under WCAG 2.2 AA.

## 18. Negative acceptance criteria

- No `CreditClient`, `TaxClient`, `FundingClient`, `HomeBuyingClient` or second contact table per
  service/channel.
- No email/phone/payment/company/opportunity relationship treated as authentication or access.
- No automatic name-only, hash-only, AI-only or score-only merge.
- No opportunity `won` mutation that directly marks payment, entitlement, approval or case state.
- No direct cross-module table mutation or browser-to-provider/database fan-out.
- No public endpoint revealing whether a person, account, client, phone or email exists.
- No campaign send, opt-in, unsubscribe or quiet-hour policy owned by M017.
- No internal note/message/document/provider body copied into activity summaries.
- No import before file acceptance; no macro/executable/archive processing by default; no formulas
  left executable in exports. The sole archive-format exception is approved bounded OOXML `.xlsx`
  parsing under `CRM-017`; arbitrary archives remain rejected.
- No unrestricted owner/admin export, bulk merge or all-client access merely from role label.
- No general bulk CRM-record mutation, generic batch endpoint or bulk selection. A future concrete
  command requires a new Product Owner-approved PRD/gate with preview, batch limit, per-item auth/
  versions/idempotency, partial receipts, SoD, recovery and negative tests.
- No AI autonomous qualification, merge, conversion, communication, eligibility or service action.
- No analytics/session replay containing CRM values, DOM, identifiers or free text.
- No claim that a real CRM, import, export, integration or pipeline is operational before Build,
  activation, testing and Product Owner acceptance.

## 19. Dependencies

### Required before Release 1A Build

- M007/M080/M081 identity, session, RBAC and resource grants.
- M018 Person/Client and M019 Organization ownership contracts.
- M020 Lead/capture/deduplication contract.
- M021 ServiceOrder, M022 CaseFile and M023 Task boundaries.
- M077 Audit, M078 Consent, M085 retention/deletion, ADR 004 inheritance and ADR 005 encryption.
- Approved decisions `CRM-001`–`CRM-023` applicable to the selected slice.

### Optional/gated contributors

- M003–M006/M012/M013/M025/M026 channels, forms, messages and appointments.
- M014/M042–M046 quote/payment/catalog/entitlement projections.
- M040/M041 partners/provider abstraction.
- M047–M060 AI, M089 search, M092 reporting and M097 observability.

No optional contributor blocks the safe manual Release 1A relationship/opportunity workflow.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Duplicate/fragmented identity | Canonical M018 owner, keyed tokens, review and no automatic merge |
| CRM becomes a second operational database | Explicit owner matrix, typed projections and reauthorized drill-down |
| Cross-client disclosure | Default deny, exact authorization scope, RLS, DTO minimization and negative tests |
| Stage/report semantic drift | Immutable versioned pipeline definitions and terminal mappings |
| Sale mistaken for revenue/service | Independent opportunity/payment/entitlement/approval/case axes |
| Stale next actions | owner/queue invariant, exception jobs, freshness and manual recovery |
| Consent misuse | M078/M026 fresh authority; CRM evidence reference only |
| Dangerous merge | dry-run, conflicts, version fences, enhanced review, aliases and recovery |
| Import malware/formula abuse | M011 acceptance, parser limits, content handling and formula neutralization |
| Bulk export exfiltration | field/row auth, reason/step-up, TTL, auditing and revocation |
| Free-text leakage/prompt injection | encryption, isolation, no telemetry/AI by default, allowlisted extraction |
| Biased scoring | future only, explainable inputs, prohibited attributes, human review and evaluation |
| Provider/channel outage | durable internal work, partial state and manual fallback |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: CRM-001 — approve the exact Release 1A CRM entity/view inventory.]
- [NEEDS PRODUCT OWNER DECISION: CRM-002 — approve the Admin route, navigation labels and EN/ES
  information architecture.]
- [NEEDS PRODUCT OWNER DECISION: CRM-003 — approve identity-root state, per-purpose binding access and
  commercial engagement lifecycles, the boundary with M018 Person/contact methods and authoritative
  locale/time-zone source by subject.]
- [NEEDS PRODUCT OWNER DECISION: CRM-004 — define the evidence that activates or deactivates a
  formal Client relationship; payment/opportunity alone remain insufficient by default.]
- [NEEDS PRODUCT OWNER DECISION: CRM-005 — approve opportunity outcomes and conversion prerequisites
  for creating/reusing Client, ServiceOrder and CaseFile records.]
- [NEEDS PRODUCT OWNER DECISION: CRM-006 — approve pipelines, commercial stage names/transitions,
  required fields, close/reopen and opportunity loss/cancellation reasons without redefining M020
  lead qualification; approve transition-ledger fields, evidence, retention and the exact dry-run/
  mapping/recovery policy for immutable pipeline-version migration.]
- [NEEDS PRODUCT OWNER DECISION: CRM-007 — approve the role/team/assignment/purpose/field/action
  matrix, including whether any role receives organization-wide access.]
- [NEEDS PRODUCT OWNER DECISION: CRM-008 — approve the read-only M020 qualification projection,
  M017 opportunity-readiness fields, priority rules, next-action types, service targets, hold and
  stalled-work rules.]
- [NEEDS PRODUCT OWNER DECISION: CRM-009 — approve activity types, source-owner projections,
  summaries, freshness and retention.]
- [NEEDS PRODUCT OWNER DECISION: CRM-010 — approve internal-note types, allowed roles, encryption,
  retention, redaction authority/disposition and AI exclusion/limited-use policy. Redaction also
  requires CRM-022; approval of only one gate activates no redaction command.]
- [NEEDS PRODUCT OWNER DECISION: CRM-011 — approve attribution fields, campaign/source taxonomy and
  retention for Google/Meta/TikTok/Facebook/Instagram/organic/referral data.]
- [NEEDS PRODUCT OWNER DECISION: CRM-012 — approve duplicate match inputs, keyed-token policy,
  confidence bands and review thresholds.]
- [NEEDS PRODUCT OWNER DECISION: CRM-013 — approve canonical merge authority, conflicts,
  alias/tombstone, revocation, sessions, recovery and any second-review requirement; separately
  approve Opportunity duplicate keep-both/link/supersede semantics, survivor authority, preserved
  histories/attribution, durable acyclic OpportunityRelation/correction semantics, downstream owner
  conflict matrix, roles and recovery.]
- [NEEDS PRODUCT OWNER DECISION: CRM-014 — approve assignment queues, round-robin/workload rules,
  reassignment authority and inactive-owner behavior.]
- [NEEDS PRODUCT OWNER DECISION: CRM-015 — approve M078/M026 consent/preference/locale/time-zone
  projections and allowed CRM request paths; no CRM-owned opt-in or delivery preference is assumed.]
- [NEEDS PRODUCT OWNER DECISION: CRM-016 — approve tags, custom fields, lists and segment governance.]
- [NEEDS PRODUCT OWNER DECISION: CRM-017 — approve import formats, limits, mapping, duplicate/
  overwrite rules, file/row retention, forward reconciliation, supported compensation outcomes and
  allowed roles; no blanket rollback is assumed.]
- [NEEDS PRODUCT OWNER DECISION: CRM-018 — approve export datasets, fields, roles, purpose/reason,
  step-up, format, row limits, delivery TTL and retention.]
- [NEEDS PRODUCT OWNER DECISION: CRM-019 — approve deterministic automation separately from AI;
  exact AI read/proposal tool input/output/prohibited fields, human approver/confirmation,
  expiry/correction and owner-command idempotency; for any external model also approve processor/
  provider/account/model/version/region, DPA/no-training/retention/data-use, credentials, evaluation,
  kill-switch/fallback and incident policy. All remain off by default.]
- [NEEDS PRODUCT OWNER DECISION: CRM-020 — approve M017 fact/event projections and M092-owned metric
  definitions, viewers, retention and analytics boundary.]
- [NEEDS PRODUCT OWNER DECISION: CRM-021 — approve measurable performance, accessibility,
  responsive-device and operational-readiness targets.]
- [NEEDS PRODUCT OWNER DECISION: CRM-022 — approve per-record retention, deletion/anonymization,
  legal hold, alias/tombstone, match-token/key, idempotency/receipt, backup-expiry and restore/purge
  behavior for every M017-owned record with M085/legal review.]
- [NEEDS PRODUCT OWNER DECISION: CRM-023 — approve data-quality issue types/severity/lifecycle,
  rulesets, assignment/reviewer, canonical-owner resolution receipts, retention and measurable
  quality targets; M017 cannot correct owner facts.]
