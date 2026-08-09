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
