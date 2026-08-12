# API

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Baseline
- Update rule: update before changing a route, request schema, response schema or error contract

Private HTTP boundaries use `/api/v1`. Server handlers authenticate identity, construct an actor, call domain authorization and then execute a transaction. Errors use stable machine codes with 400 validation, 401 unauthenticated, 403 disallowed action, 404 hidden private resource, 409 state conflict and 429 rate limit.

Stripe and Google callbacks verify provider authenticity before mutation. Public lead creation is consent-aware, rate-limited and idempotent.

Every private handler resolves identity, builds an actor, authorizes the action/resource, validates
an allowlisted schema and only then performs I/O. Portal DTOs are explicit projections that exclude
internal fields. Provider-neutral service contracts live in the relevant module PRD.

M008 proposes one bounded authenticated dashboard query rather than browser fan-out. It freezes the
complete M007 account/session/membership/context/grant/entitlement/policy authorization snapshot,
loads the policy-versioned priority-source registry, calls allowlisted client-projection ports,
selects one deterministic priority action and revalidates every fence before returning an explicit complete or
partial DTO. Hidden resources and internal/provider errors are never serialized. An unavailable
registered source that could tie or outrank the result returns `unconfirmed`; it cannot become a zero count or `no action`.
Release 1A personalized dashboard responses are private/no-store.

M009 proposes `ClientServicesQueryService.list|getDetail` as one authenticated, request-scoped
boundary. It returns only explicitly granted real `ServiceOrder` projections, combines core
ServiceOrder/Case/milestone facts under one consistent read cut and consumes bounded typed child
summaries under the complete M007 authorization snapshot. ServiceOrder commercial/activation,
Billing/Stripe financial and CaseFile/workflow fulfillment subfacts retain canonical ownership and
are mapped through a versioned client-status policy. Exact
routes/payload limits await a Build gate; personalized responses are private/no-store and M009
performs no mutation or browser/provider fan-out. Every serialized root/child carries an
authorization epoch covering its parent linkage, visibility/inheritance, classification,
tombstone and accepted-definition binding; a changed epoch fails the final fence before any body,
count, cursor or route metadata is returned.

M010 proposes `ClientProcessQueryService.getLanding|getProcess`. The landing server-side consumes
only M009's nonrecursive `AuthorizedServiceChoicePort` for zero/one/many opaque choices and persists
no inferred default; it cannot call full M009 list/detail, M010 or child aggregators during base
selection. The choice port is paginated under M009/MYSVC-004 with opaque context/snapshot-bound
continuation, no total/silent truncation and optional Product Owner-approved bilingual safe
instance labels; ambiguous labels fail closed without IDs. A closed server-derived eligibility
policy filters accepted service-definition/workflow versions before ordering/pagination and is
bound into the cursor; ineligible choices leak no label/count/timing. Detail sits beneath an opaque
authorized service reference and validates the same policy/accepted binding before any process
read or metadata; policy/version changes fail its final fence. Every registered Postgres source capable of changing status, milestone, action
or blocker—including ServiceOrder, Case, Task, Document and Billing—uses one read-only MVCC request
snapshot and restricted RLS actor. The
query uses a closed `ProcessSourceRegistry` through bounded typed owner ports and applies deterministic
versioned public-state, milestone, process-local action and timeline policies. A public timeline
entry requires a real source event and mapping version; raw audit/provider events are invalid DTO
inputs. Missing critical source data returns `unconfirmed`, and a final authorization/resource-
epoch fence discards the full response before body/count/cursor/route metadata on any concurrent
change. Exact route/payload/cursor limits await a Build gate; the response is private/no-store,
read-only and provider-free. Command ownership is exact: Task→M023, Document/deliverable→M011,
Message→M012, Appointment→M013, Billing→M014 and Signature→M067. M010 returns bounded summaries and
route keys only, and every destination reauthorizes. Release 1A derives public timeline pages
request-scoped from a stable authorized owner-event cut and has no M010 projection writer/table/job;
materialization requires a separate ADR and Build gate. Until PROC-010 approval, Billing projection
is only owner-qualified semantic obligation/payment state, freshness and M014 route—no invoice/
transaction reference, amount, balance, deposit, due date, method, receipt or refund detail.

M011 proposes `ClientDocumentQueryService.list|get`, `StaffDocumentQueryService.list|get`,
`DocumentRequestService`, `UploadIntentService`, `UploadProcessingService`,
`DocumentPromotionService`, `DocumentReviewService`, `DocumentGovernanceService`,
`DocumentVisibilityService`, `DocumentContextService`, `DocumentVersionService`,
`DocumentAccessService`, `DocumentDispositionService` and `DocumentReconciliationService` as one
document-domain boundary. Client and Staff queries use separate allowlisted DTOs; internal or
compliance fields never enter a Client DTO, and Staff fields require exact scope/classification/
assurance before counts/cursors. M011/Postgres owns request, logical document, immutable version,
safety/promotion/review, visibility, document disposition/hold state and an M085 retention-policy
reference; it emits M077 audit evidence rather than owning parallel retention or audit authorities.
Approved Supabase private Storage owns only quarantined/promoted bytes. Every list/detail/cursor,
upload authorization/finalize, replacement, preview, download, review, classify/reclassify,
visibility/client-visible-version, context-link/unlink/share or disposition call freezes the M007 context/
grant/assurance policy and final-fences parent links, visibility, classification, lifecycle/hold
and resource/version epochs before returning metadata or a capability. Exposure-changing commands
use CAS, advance authorization epochs and emit minimized audit/outbox facts. One bounded
upload intent targets one opaque quarantine object, declares policy limits and is consumed
idempotently; browser filename/MIME are advisory. Only content/parser-valid, checksum-verified,
scanner-clean bytes may promote, and promotion never means staff acceptance, request/task
satisfaction or client visibility. Replacement creates an immutable version and advances pointers
by compare-and-set. Signed access is one-object/read-only/short-lived but is not represented as
single-use or instantly revocable without implementation evidence. M011 emits typed client-safe
summaries to M008–M010; every command reauthorizes in M011. M065 OCR/extraction, M066 generation and
M067 signature remain separate gated owners.

Link/unlink, replacement and reclassification atomically recompute the document effective
classification ceiling from retained governed versions and active linked purposes. Logical-
document visibility, selected client-visible version and context-link/version visibility use
distinct post-commit events; consumers re-read canonical Postgres because events grant no access.

M012 proposes separate `ClientConversationQueryService` and `StaffConversationQueryService`
boundaries plus `SecureConversationService`, `ConversationInternalNoteService`,
`ConversationLifecycleService`, `ConversationAssignmentService`, `ConversationHandoffService`,
`ConversationReadService`, `MessageRevisionService` and `MessageReferenceService`. Every list,
detail, count, cursor, post, note, assignment, handoff, read-state, revision, redaction or typed-
reference action freezes the complete M007 context/grant/assurance policy and final-fences the
governing account/service/case root, participant, visibility/sensitivity, lifecycle/block and
resource epochs. Client and Staff DTOs are structurally separate; internal notes cannot enter Client
serialization or notification events. Every `Message` is client-visible by invariant and carries
only `authorKind`; private staff content exists solely in the internal-note type/contract/event.
Starts bind actor/canonical root/reason/policy/idempotency and digest before a conversation reference
exists; replies bind actor/conversation/idempotency and any quoted target must resolve to an eligible
current client-visible revision in the same authorized conversation before it enters the digest.
Public replies use a client-writability CAS; internal notes use a private staff-activity CAS. Client
ordering/read/cursors use gap-free client-message sequence and client-last-visible activity only;
staff message/note interleaving uses a separate sequence/version/time that never reaches Client DTO,
ETag, order, error or timing. One Postgres transaction reserves the key, allocates applicable
sequences, encrypts/inserts the initial immutable revision, commits its aggregate/current pointer,
idempotency receipt and outbox/audit. Any encryption/revision/pointer/outbox failure rolls back all
counters/rows/reservation. Same-key/same-digest retries return the original complete receipt;
changed digest conflicts. Read advancement requires a current actor/
participant/page-bound server receipt and a monotonic upper-bounded visible sequence. Cursors are
opaque, authenticated and bound to actor/scope/filter/order/snapshot/auth epochs/expiry. Every
accepted message/note/revision body or derived free-text handoff/translation summary is application-
envelope encrypted before persistence; KMS failure is atomic and leaves no plaintext draft,
rejection, summary, outbox or audit payload.
M011 handles every attachment intent/byte/read, and M013/M014/M023/M067 independently authorize
typed actions. M025 consumes a bounded content-free list projection whose schema cannot represent
body/note/quote/translation/attachment title; staff detail re-reads M012 request-scoped and creates
no M025 content cache. M026 receives only content-free template
requests and future M047–M060 AI remains separately gated. Exact routes and payload limits await a
Build gate; personalized responses are private/no-store and normal operation requires no Redis,
Kafka, WebSocket cluster or external provider.
M018 owns client-level operational notes, M022 owns case-level operational notes and M012 owns only
conversation-local notes, with opaque links/projections
and no cross-mutation/copy. M092 future analytics/report consumption remains off until MSG-018; M097
separately owns required content-free, identifier-free operational/security telemetry under its own
readiness/activation policy. Neither receives transcript/session replay. M076 owns compliance policy
and human-required decisions; M047–M060 AI cannot replace it. M090/M091/M080/M081 retain system
configuration, staff user and role authority; M012 cannot self-grant. M026 may receive only
purpose-bound opaque recipient/event references inside its first-party boundary, never direct
contact PII or protected content/resource IDs. The sole M013 APT-007 exception is one-time management
code delivery: the outbox/port carries only opaque contact and short-TTL vault/delivery refs, and only
the scoped M026 delivery worker may retrieve plaintext for the approved transport. This is separate
from APT-010 reminders and never places plaintext in ordinary events, logs, audit or retries.

M013 proposes audience-separated `AppointmentQueryService`, `AppointmentTypeQueryService`,
`StaffAppointmentQueryService` and Public/Client/Staff availability methods; split
`BookingService.releaseHold|request|confirmPending|cancel|reschedule` plus future APT-008 `reassign`;
`AppointmentRequirementService`; `AttendanceService`; `AppointmentOutcomeService`; read-only
`ScheduleAdminQueryService` and
draft/preview/publish/block/override `ScheduleAdminService`; `ProspectManagementService` code
request/reissue/exchange; `ClientCalendarExportService`; and the M013 summary/timeline projection
ports. Public raw contact/consent enters only the cross-domain `PublicBookingOrchestrator`, which sends
it transiently to M020/M078 reservation and passes only an opaque receipt to M013; the context and
appointment finalize atomically. Public slot reads return bounded opaque receipts, never staff/event/
contact metadata. Commands bind actor/service identity, purpose/session where applicable, the single
access root, type/policy/authorization versions, canonical opaque-only digest, trusted time and
idempotency. Released/invalidated/expired/consumed holds cannot be reused.

`PublicSchedulingFacade`, including its bounded `requestBooking` operation, is the only application
boundary callable by the same-origin Astro Public Scheduling Gateway. `requestBooking` verifies the
external envelope and then invokes `PublicBookingOrchestrator` internally; the orchestrator and M013
domain ports are never Gateway-callable. The Gateway has no DB/provider/CRM credential, and signs each request with a
rotating scoped workload proof bound to environment/issuer/audience/service/method/path/body digest/
timestamp/nonce/key version/`RecoveryEpoch`. The application atomically claims replay state before
work, rejects direct browser/internet/replayed/stale calls, applies `SchedulingAbuseEvidence` controls
and still performs domain/session authorization. Browser mutations require exact Origin and, after
the credential-free bootstrap POST, session-bound CSRF; provider/OAuth ingress uses its separate
authenticated-channel/state proof. Client/Public/Staff DTOs are structurally separate,
private/no-store and final-fenced.

Pending confirmation uses complete owner evidence and either retained capacity or a fresh hold under
APT-006; it never reuses the consumed hold. `CalendarConnectionService`,
`CalendarConnectionQueryService` and provider busy/sync/credential-read contracts require APT-009/
020. External event create/update/outward reconciliation additionally requires APT-014; invitations
or provider mail additionally require coordinated APT-010/014. Scoped idempotent audited delete/
cancel/stop/revoke of previously bound Calendar/Meeting artifacts remains available for gate-off,
rollback and restore, but cannot create/update/rebind/launch. Per-source contracts use independent
coverage/cursors, zero attendees and suppressed provider notifications; Google push `pending_watch`
binds a resource only after the authenticated watch response. `MeetingConnectionService`, separate
`MeetingConnectionQueryService`, `MeetingProvider` and `MeetingLaunchService` are independently gated
by APT-011, store only opaque/vault refs and validate
the initial exact HTTPS provider destination without server fetching/following it. Reconciliation is
idempotent and Postgres remains authority. M024 invokes M013 ports for internal calendar UI;
M003–M006/M012 use the same ports for channel handoffs. Exact HTTP routes/payload limits await a Build
gate and `APT-001`–`APT-020` decisions.

M014 proposes separate `ClientBillingQueryService`, `StaffBillingQueryService` and future PAY-016
`PublicBillingFacade` boundaries over the shared Billing context; M014 owns no portal-local payment
table or direct Stripe calls. `QuoteService` creates/version-controls/sends/supersedes exact
immutable quote versions. `QuoteAcceptanceOrchestrator.accept` CAS-validates one exact quote and, in
one Postgres transaction, records acceptance, invokes M021's
`ServiceOrderService.createOrBindFromAcceptedQuote`, opens exactly one obligation and commits one
composite idempotency receipt; partial outcomes roll back. `ClientCheckoutService.createOrRecover`
binds actor/capability, one service-
order/case root, obligation/quote/price/terms/access/recovery versions, amount/currency, canonical
digest and semantic operation before `PaymentProvider` egress. The exact provider idempotency token
is protected/retrievable or deterministically reproducible by domain/key version; an opaque non-PII
SG operation correlation supports type/account/environment/time-bounded paginated lookup after lost
responses or restore. Provider-key expiry never permits blind reissue; ambiguity quarantines. Same-
key/same-digest retry returns the original complete handoff; changed digest conflicts. Checkout/
receipt/invoice/Customer Portal URLs are transient private/no-store destinations returned only after
final authorization and exact activated HTTPS provider scheme/host/path/bound-object validation;
they are never stored access authority or accepted as generic redirect input.

`PaymentWebhookIngress.verifyAndAccept` accepts only bounded exact raw bytes with a valid environment-
specific Stripe signature, durably inserts one minimal recovery-generation-bound inbox receipt under
composite provider-account/environment/event identity and then permits asynchronous
`PaymentProjectionService.applyAcceptedEvent`. Each event is an invalidation signal: projection
retrieves canonical provider objects, uses processing leases and deduplicates both event identity and
provider-object/fact version, never arrival order, and atomically commits
provider fact, operational journal/allocation, obligation projection, M044 invalidation, audit and
outbox. `PaymentReconciliationService` owns bounded checkpointed mismatch/recovery runs;
`RefundWorkflowService` keeps request, approval, provider submission and observed outcome separate.
`VerifiedPaymentPort` returns only a versioned `confirmed|pending|reversed|unconfirmed` financial
assessment and cannot authorize M021 start or fulfillment.

Every M014 Client/Public/Staff DTO is structurally separate, uses a frozen M007/ADR 004 authorization
snapshot, performs no live provider fan-out and final-fences parent linkage, classification,
visibility/block, financial/resource/access/recovery epochs before body, count, cursor, route key or
destination. Payment/email/provider-customer/receipt possession grants nothing. Missing/stale source
state becomes `unconfirmed|processing|unavailable`, not paid/zero/no-action. Exact routes, DTO limits,
Stripe events and policies await a Build gate plus `PAY-001`–`PAY-020`.

The PAY-016 public capability and provider return handle use separate purposes. GET/HEAD is inert;
only an explicit POST/OTP exchange with exact Origin, Fetch Metadata and CSRF/bootstrap controls may
establish an opaque host-only SameSite session. A clean redirect/history replacement removes token
transport under no-referrer before personalized render/subresources, and edge/app logs, analytics,
errors, caches and service workers exclude it.

M015 application contracts use `ProfileQuery.getSummary|getSection|listBusinesses`,
`ProfileDraftService.startOrResume|saveDraft`, `ProfileChangeService.submitProposal`,
`ProfileCorrectionService.submit`, `ProfileReviewService.accept|partiallyAccept|reject`,
`ProfileVerificationService`, `ProfileConflictService`, `ProfileExportService` and purpose-specific
`ProfileProjection` ports. Exact HTTP routes remain a Build decision.

Every mutation carries actor, profile/resource/purpose, expected aggregate/revision/access epoch,
idempotency key, current external `ProfileRecoveryEpoch` and a server-derived canonical digest.
Same-key/same-digest recovery returns one receipt; same-key/different-digest conflicts. Protected or
low-entropy input uses opaque refs/versions where possible or a domain-separated keyed MAC with key
version—never a raw/bare hash, client-supplied digest, identifier or permission. Authorization,
versions and recovery epoch are rechecked in the transaction.
Private absence and denial share `not_found`; errors never reveal field existence, protected values,
reviewer/security logic or provider evidence.

Consumers request a versioned Basic, Credit, Tax, Home Buying, Business Formation or Business
Funding DTO with ServiceOrder/CaseFile, purpose and consent/grant evidence. There is no full-profile
DTO or route. Client, staff and service serializers are structurally distinct and final-fence
resource, purpose, consent, classification and epochs before body/count/cursor. Forms, documents,
providers and AI use proposal-only ports and cannot verify or mutate current protected facts.
PFL-001–PFL-020 plus a Build gate control exact fields, routes and behavior.

Every profile access snapshot, draft/reveal/export capability and job is epoch-bound. After restore,
all pre-cutover artifacts fail and protected queries remain unavailable until M007/M078 state is
reconciled from non-rolled-back evidence or explicitly reauthorized; the restored database cannot
self-attest current authorization.

M016 proposes one authenticated versioned `AdminDashboardQuery.compose` contract. The server derives
the canonical authorization fingerprint from actor/account, session/auth epoch/assurance, membership,
exact permission/role/team/assignment and resource grants/access epochs, purpose, classification
ceiling/clearance, dashboard/widget/owner-contract/policy versions, normalized filters/period/locale/
IANA zone, source version and recovery generation; then selects allowed widget definitions and calls
typed minimal owner projection ports. The opaque digest is never client-supplied or serialized. The
response contains a page composition state and independently typed widget results with
`complete|partial|stale|unavailable|suppressed|denied`, definition/version, period/IANA time zone,
source/computed timestamps, freshness and coverage. Denied widgets are normally omitted; private
absence/denial and count-suppression cannot reveal a resource or threshold.

`AdminDashboardQuery.refresh` is a query invalidation/recomposition request, not a domain mutation.
Future quick actions call an allowlisted owner command directly after fresh authorization,
expected-version/idempotency validation and audit; M016 exposes no generic command, bulk, export or
impersonation endpoint. Drill-down contracts return only a destination code and opaque bounded
reference/allowlisted filter; the destination reauthorizes. Exact HTTP routes remain `ADM-002` and a
future Build decision.

Snapshot/cache lookup and final serialization require exact canonical fingerprint equality. Missing
or changed purpose, assurance, permission, grant/access epoch, classification or any other dimension
is a miss and fails closed; revocation additionally purges affected entries even with delayed owner
invalidation.

A future `RecentOperationalActivityProjection` is an M077/canonical-owner read port, not a raw audit
or event-stream endpoint. It accepts the full M016 authorization context and bounded cursor/period,
returns allowlisted semantic event code, safe localized parameters, event/source time/version,
freshness/coverage and an optional opaque drill-down reference, and excludes technical/private
events, invalidation payloads and content. Every destination reauthorizes.

M017 proposes the server-only, versioned command/query contract families enumerated exactly in
`docs/modules/m017-crm.md` section 11. That section alone is the exhaustive candidate inventory;
this API authority intentionally does not maintain a second shorthand list that can drift. It includes
all command, query, history, protected-reveal, configuration, preview/execute, status and recovery
families declared there. Opportunity duplicate resolution never invokes canonical Person/Client
merge. Later additions require an approved PRD/ADR change.
The server derives actor/session/membership/permission/
role/team/assignment/grant/purpose/classification context; IDs, role or scope are never accepted as
client authority. Lists authorize before match/count/cursor and return field-minimized DTOs.

`actorContext` is a tagged `HumanActorContext | WorkloadActorContext`, never a loose shared object.
Human context carries the complete session/membership/permission/resource/purpose/classification
fence. Workload context is a closed capability union. Every variant inherits a mandatory signed
envelope containing environment, SG organization, issuer, audience, service, exact method/action,
`iat`/`nbf`/`exp`, signing-key ID/version, recovery epoch and nonce; verifiers/key rings are pinned per
environment + audience + action. Its normal one-use variant additionally binds exact canonical
target/root set, the closed active purpose-binding set and per-binding access epochs, normalized command/payload digest, expected resource versions, idempotency namespace/
key, immutable source receipt, schema/policy/recovery versions, timestamp and nonce. The server
derives all bound values only from that immutable receipt and rejects job/client overrides. It cannot
list/search/count/detail/export/merge or disclose existence. Human-derived jobs bind and revalidate
the original actor/purpose authorization receipt. Browser forgery; target, purpose, payload, key or
version substitution; wrong audience/action; expiry; replay; revoked source; or stale generation
fails closed. Server-derived scoped RLS claims apply, and nonce consumption commits atomically with
reservation, mutation, outbox and audit.

The only pre-binding variant is `LeadHandoffBootstrapCapability`. In addition to the common envelope,
it is bound to one immutable M020 handoff
receipt, exact Person-resolution ref/version, proposed purpose/evidence, `acceptLeadHandoff`, payload
digest, key, epochs and nonce. It can create/reuse only the identity-neutral root plus a `proposed`
binding; it cannot activate contactability/consent, query existence or invoke another action. Its
nonce/reservation/root-and-proposal mutation/outbox/audit commit atomically.

Opportunity and assignment writes use expected versions; retryable creation/transition/conversion/
merge/import/export uses semantic idempotency. Conversion returns independent M018/M021/M022 owner
results (`created|reused|blocked|conflict|unavailable`) and never maps opportunity `won` to payment,
entitlement or service authority. Contact 360 owner projections carry source/version/freshness and
an explicit `complete|partial|stale|unavailable|suppressed|denied|unknown|not_applicable` result
state; unknown/not-applicable cannot become zero, absence or a satisfied prerequisite. Links use only
opaque references and are reauthorized at the destination.

Contact 360 accepts only the versioned closed section registry in the M017 PRD. Every section calls
one typed owner port with exact refs/versions, purpose, classification, current owner grants/access
epochs and freshness budget; it authorizes independently and returns an opaque reauthorized route.
M020 owns the explicit Lead qualification list/detail projection. M017 never infers qualification
from CRM stage, score or tag. Protected contact reveal returns transient values separately from an
opaque M077 audit receipt; M077 receives minimized allowed/denied/failed attempt metadata and no
value or replayable capability.

Optional next-action Task references require the current M023 owner-issued target/purpose/
visibility/classification/access receipt on write and read. Optional Opportunity organization
context similarly requires the current M019 relationship/effective-interval/purpose/
classification/access receipt on create, organization-dependent read/mutation and conversion.
Owner correction, deletion/end, reassignment or revocation invalidates the minimized link and never
falls back to another resource or mutates the owner record.

Each Opportunity carries one immutable exact `CrmPurposeBinding` reference. Relationship next-action
commands must supply the exact binding/version/access epoch; Opportunity commands reuse only that
immutable binding and revalidate its current epoch. No server or client may infer a primary/default
purpose.

Future M017 imports accept only an M011-approved `DocumentVersion`, produce a versioned mapping/
validation/deduplication preview and require a separate apply command. Exports authorize dataset,
rows and fields server-side, require approved reason/assurance, neutralize spreadsheet formulas and
deliver a short-lived private M011 artifact. Exact HTTP routes and schemas remain `CRM-001`–
`CRM-023` plus a Build decision.

Every retryable local M017 mutation uses a server-derived `CrmMutationFingerprint` bound to complete
human/workload actor context, operation namespace/version, target/root refs, expected version,
canonical input/policy/schema versions and recovery generation. Its scoped reservation commits with
the mutation, audit and outbox receipt. Same-key/same-fingerprint returns the original receipt after
a lost response; changed semantics conflict. Cross-owner/preview operations add the stronger
semantic-operation uniqueness contract below.

For conversion, canonical merge, Opportunity duplicate resolution, Opportunity-relation correction,
binding-access-ended remediation, pipeline-version migration execute, import apply, import
compensation, CRM retention disposition apply, legal-hold apply/release, automation action-port
execution, approved-AI-proposal consumption and any reconciliation/resume
step that commands an owner or destructive disposition, the server
atomically reserves the key before
the first effect against a canonical fingerprint of environment, organization, actor/account/session/
auth epoch/assurance/membership, exact permission/role/team/assignment/grant/access epochs, purpose/
classification, operation namespace/version, roots, approved preview ID/digest/use state, normalized
input digest, expected owner/resource/schema/contract/policy versions and `CrmRecoveryEpoch`.
Same-key/same-fingerprint returns or resumes the original durable receipt; same-key/different-
fingerprint conflicts. Key uniqueness includes environment, SG organization, authenticated actor/
approved issuer and operation namespace/version; keys are high entropy, bounded and rate-limited.
The preview is opaque, scope-bound, short-lived and single-use/revocable. A second unique semantic
identity is the recovery-stable tuple `(environment, organization, namespace/version, canonical effect type, ordered canonical
root set, normalized effect digest, applicable expected resource/owner versions, preview-content
digest, schema/contract/policy versions, canonical domain-intent ref/version)`. It
excludes actor, raw key, recovery generation and an equivalent preview instance ID. The server issues
no external journal: the intent is deterministically derived from immutable roots, exact expected
versions, approved transition/plan/request version and normalized effect digest. Lost reservations
reproduce the same identity for reconciliation. A legitimate repeat advances the approved canonical
business/request version after the earlier receipt is terminal; retry/equivalent preview reuses it.
Operation-specific canonicalizers keep distinct inputs on one root. Opportunity resolution binds
both exact Opportunity/purpose-binding versions/epochs, disposition/preservation plan and complete
known downstream owner inventory/version; import compensation binds its plan digest; retention/hold
binds the ordered closed record/version set, disposition, M085 authority/policy/legal/minimum-
retention/downstream/backup-expiry versions and SoD receipt.
Relation correction binds the complete current group/version, normalized acyclic replacement and all
member/binding/owner/conversion versions. Binding-ended remediation binds ended epoch, ordered frozen
children/versions, local-only disposition plan and SoD. Automation/AI consumption binds exact rule/
evaluation or proposal version, target/binding/epoch, closed command digest and expected owner
version; stable steps/reconciliation apply when an owner port is invoked. These
canonicalizers separate distinct effects while admitting only one identical effect across actors/
keys/previews. Deterministic owner-
step IDs derive from this stable tuple; compensation additionally binds its approved plan digest and
exact owner versions. Recovery generation remains in the authorization/request fingerprint only;
after restore the stable identity reconciles against canonical owners/audit/artifact inventory before
any new effect. Owner-enforced digests make ambiguous
responses reconcilable before retry and prevent a second Client/ServiceOrder/Case/merge/Opportunity-
resolution/relation-correction/pipeline-migration/import/retention/automation/AI-consume effect.
Every enhanced execute receives the exact approved plan ID/version/digest/unused state, final closed
scope, current assurance and applicable SoD receipt. Reconcile is read-only over stable ambiguous
step IDs with current scope/recovery epoch. Resume requires an approved recovery plan ID+digest,
complete final scope, only proven-not-started steps, current assurance/SoD and current recovery epoch.
Accepted or ambiguous effects cannot be reissued through a substitute plan or actor.

Canonical operation fingerprints prefer opaque refs/versions/codes. Protected or low-entropy
email/phone/note/query/row values never use an unkeyed digest; unavoidable equality uses a purpose-
and domain-separated keyed MAC with key version/custody outside Postgres/backups/logs/telemetry.
Fingerprint values remain server-only and never enter a client DTO, cursor, error or analytics.

Every M017 list cursor is server-issued, authenticated and opaque. Its MAC/context binds actor/
account/session/auth epoch/assurance/membership, permissions/role/team/assignment/grants/access
epochs, purpose/classification, normalized query/filter/sort and registry versions, `asOf`, schema/
contract version, recovery generation and TTL. Tamper, cross-context replay, revocation, stale epoch
or expiry fails closed without disclosing hidden rows/counts.

Export request is intentionally excluded from cross-actor semantic-operation uniqueness. The server
creates a versioned `CrmExportRequestIntent` owned by the exact actor/account; lost-response
deduplication uses only that actor-scoped key/fingerprint and intent version. Equivalent requests by
different authorized users produce separate jobs/receipts and never share a capability.

`CrmExportService.request` creates a durable generation receipt; it does not return an authoritative
object URL. `CrmExportService.consume(actorContext, exportCapability, expectedVersion)` final-fences
current actor/session/membership/permission/resource/access epoch/purpose/assurance/export status/
recovery generation and streams through a private `no-store` boundary. `revoke` invalidates pending
capabilities. Forwarding, second unauthorized context, scope change, expiry, revocation, restore and
concurrent/disallowed repeated consumption fail closed and are audited.
