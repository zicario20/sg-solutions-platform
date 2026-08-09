# Module PRD — M010 Estado de mi proceso

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture candidate; no Build gate
- Surface: Client Portal `/client/processes` landing and
  `/client/services/[publicServiceRef]/process` detail
- Workstream: R1.5 Client Portal & Launch
- Release target: Release 1A minimum real-client process visibility with compatible Release 1B extensions
- Source: complete Product Owner-supplied M010 corpus, normalized to the approved stack
- Related catalog modules: M010; consumes M007–M009/M011–M014/M018/M021–M026/M043–M045/M067/M077–M081
- Proposed ADR: ADR 014

This PRD defines a read-only, client-safe projection of one authorized service process. It does not
authorize product code, routes, database schema, RLS or Storage policies, external-provider
traffic, merge, deployment or `GENERATE`.

## 1. Purpose

Give an authenticated and explicitly authorized client a truthful answer to five questions for one
real SG Solutions service relationship:

1. What is the current client-safe state?
2. What has actually happened?
3. What is the next required step?
4. Who is responsible for that step?
5. Is anything blocking progress or awaiting an external party?

M010 is the detailed process view. M008 owns the portal summary and one global priority action;
M009 owns the service directory/detail shell. M010 neither stores a second case status nor exposes
the internal workflow, staff notes, provider payloads or raw audit history.

## 2. Business value

- Reduce uncertainty and repetitive status calls without revealing internal operations.
- Show factual progress, responsibilities and blockers instead of invented percentages or dates.
- Preserve the distinction between commercial acceptance, payment, human activation and service
  fulfillment.
- Give clients a reliable path to the owning document, task, appointment, message or payment flow.
- Make delays and external dependencies understandable without guaranteeing third-party outcomes.
- Create one reusable process projection for every service vertical rather than bespoke timelines.
- Preserve an audit trail from every public event to a real, authorized source event.

## 3. Scope

### Release 1A architecture

- Authenticated process route beneath one authorized M009 service reference.
- A top-level `Estado de procesos` landing that server-side consumes M009's nonrecursive
  `AuthorizedServiceChoicePort` and handles zero, one or several process choices without browser
  filtering, hidden counts or an inferred/default last service.
- One current public process state, explanation, last-confirmed time and factual source status.
- One deterministic next action with responsible-party category and canonical owning route when
  applicable.
- Real, named, version-bound client-visible milestones; no arbitrary percentage.
- Bounded client-visible blockers, required client tasks and external dependencies.
- Bounded document, payment, signature, appointment, secure-conversation and deliverable-
  availability summaries owned by M011–M014/M067 and the governing case/service domains.
- A chronological client-safe public timeline derived from allowlisted real domain events.
- Bounded snapshot-consistent cursor pagination with an accessible `Load more` control.
- Explicit fresh, stale, unavailable, unconfirmed, corrected and empty presentation.
- Complete M007/M009 authorization snapshot, consistent core read cut, per-resource authorization
  epochs and final response fence.
- Private/no-store personalized responses and no browser-side provider fan-out.
- Responsive bilingual WCAG 2.2 AA design using the approved SG Solutions visual system.
- Manual support and owning-module recovery paths when a source cannot be confirmed.

### Compatible Release 1B extensions

- Richer approved timeline filters, grouping and navigation over the same bounded cursor contract.
- Richer provider/external-dependency history with verified provenance.
- Approved estimate ranges and due-date explanations by service/jurisdiction.
- Governed delay explanations, escalation paths and staff/partner attribution.
- More service-specific milestone vocabularies without changing the shared contract.
- Contextual AI explanation of already authorized structured facts, with deterministic fallback.
- Approved process subscriptions/notifications and richer operational reporting.

Release 1A must use the durable identifiers, grants, policy versions, event provenance and owning
domain contracts that Release 1B extends. A disposable timeline or portal-owned process table is
prohibited.

## 4. Explicit out of scope

- M008 dashboard aggregation or cross-service priority selection.
- M009 service directory, public service catalog or commercial order editing.
- Creating or changing a `ServiceOrder`, `CaseFile`, workflow, milestone, task or blocker.
- Completing a task, uploading/downloading a document/deliverable, sending a message, booking,
  rescheduling/cancelling, paying/refunding or signing; M023, M011, M012, M013, M014 and M067 own
  those commands respectively.
- Raw internal workflow states, internal tasks, notes, strategy, risk scores, approval rationale,
  employee performance, provider diagnostics or raw audit events.
- A client-editable status, progress percentage, expected completion date or responsible person.
- Treating Stripe payment as human approval or automatic service execution.
- Treating an email, CRM/client relationship, participant link, payment or route reference as an
  access grant.
- Live Stripe, Google, Storage, partner, Sanity or AI calls during normal rendering.
- AI-selected states, milestones, blockers, estimates, priorities or routes.
- Guaranteed duration, approval, credit improvement, funding, tax, home-buying or partner outcome.
- A complete Calendly, project-management or case-administration interface.
- Multi-tenant, white-label, native mobile or microservice architecture.
- Final public mappings, copy, time estimates, SLA or support policy without Product Owner approval.

## 5. Actors

### Active client

Has a valid M007 application session and membership plus an explicit active grant to the governing
`ServiceOrder` or `CaseFile`. Identity or membership alone is insufficient.

### Authorized representative

May later view a granted process in an approved personal, household or business context. A
participant relationship describes involvement but never grants access by itself.

### Owner or authorized staff

Operates the case through owning Admin modules and deliberately marks facts/events as eligible for
client projection. Staff cannot edit an M010 timeline entry as an untraceable free-standing fact.

### External party

A lender, agency, bureau, taxing authority, partner or other third party represented only by an
approved public category/name and last-confirmed state. Its identity and detail are minimized.

### Client process query service

Composes a request-scoped, typed, field-allowlisted projection. It owns no mutable commercial,
financial, case, task, document, appointment, message or provider state.

### Public process projection policy

A deterministic, versioned policy maps allowlisted source states/events to approved public codes
and bilingual copy keys. It is not an LLM and has no mutation authority.

### AI assistant

May later explain already authorized structured output with approved knowledge. It cannot retrieve
hidden facts, decide state, invent a date, alter progress or execute a command.

## 6. User journeys

### Open process status from My Services

1. The client follows M009's canonical route using an opaque `publicServiceRef`.
2. The server derives actor, active context and trusted time from the M007 session.
3. The service reauthorizes the `ServiceOrder`, governing `CaseFile` and requested process view.
4. Before any process/timeline read or metadata, the service resolves the same closed
   `ProcessEligibilityPolicySnapshot` as the landing and validates the accepted service/workflow
   binding. Ineligible or missing policy fails generically.
5. Core commercial/activation/financial/fulfillment facts are read from one consistent cut.
6. Registered owning-domain ports return bounded summaries under the same authorization snapshot.
7. The deterministic policy selects the public state, milestones, blockers and next action.
8. The final fence revalidates authorization, eligibility-policy and every resource epoch.
9. The page shows current state, next step, timeline and available owning-module actions.

### Enter from the top-level Process Status navigation

1. The server derives the current M007 actor/context and requests a bounded process-choice
   projection through M009's `AuthorizedServiceChoicePort` using the closed approved
   `ProcessEligibilityPolicySnapshot`.
2. With zero authorized process choices, the landing shows a truthful safe empty state plus My
   Services/support; it does not disclose hidden totals or names.
3. With one authorized choice, the landing shows one explicit `View process` choice; it does not
   silently redirect or persist an inferred default.
4. With several choices, the landing shows an accessible server-filtered selector/list containing
   only opaque authorized eligible references and approved display labels. If more authorized
   eligible choices exist,
   `Load more` follows the M009 page-limit decision and retrieves the next authorized page; no total
   or silent truncation appears.
5. If two authorized eligible choices have the same service/context label, each also needs a Product Owner-
   approved bilingual safe instance disambiguator. Without one, the ambiguous controls are not
   rendered; the landing fails closed to My Services/support without exposing an internal ID.
6. Selecting a choice navigates to the detail route, which independently reauthorizes the service,
   context and governing case before reading process facts.
7. Context changes rebuild the choices under a new snapshot. A revoked/hidden choice disappears
   before counts, selection state, history or timing can reveal it.

### Understand the next step

1. M010 receives structured eligible actions from the case/workflow and registered owners.
2. The closed priority policy selects one action or returns `unconfirmed` if a critical source is
   unavailable.
3. The UI names the responsible-party category and explains why the action matters.
4. If the client can act, a canonical route key sends the client to the owning module.
5. That module reauthorizes and executes its own command; the route key is not a capability.

### Review the public timeline

1. The query returns only `PublicProcessEvent` projections derived from real source events.
2. Entries are ordered by occurrence time with stable tie-breaking and bounded pagination.
3. Corrections appear as governed correction/supersession entries; history is not silently edited.
4. Technical/internal events and unauthorized existence are absent before counts and cursors.

### Encounter a delayed external dependency

1. The UI displays the approved external-party category, factual last-confirmed state and date.
2. It avoids promises and distinguishes SG Solutions work from third-party response time.
3. An expired or unavailable source is labeled stale/unconfirmed and offers a support path.
4. No provider call is made from the browser to refresh the page.

### Return after access is revoked

1. A revoked/expired session or resource grant fails before any protected query result is emitted.
2. A change detected during assembly invalidates the entire response at the final fence.
3. No cached timeline, count, route metadata or stale last-confirmed fact is shown.

## 7. States and transitions

### Canonical authority dimensions

M010 does not own one overloaded domain state. It reads the same four independent subfacts defined
by M009/ADR 013:

| Dimension | Authority | Examples of source facts |
|---|---|---|
| Commercial | `ServiceOrder` | accepted, order pending, order cancelled |
| Human activation | `ServiceOrder`; linked `Approval` is evidence | pending review, approved to start, declined/on hold |
| Financial | Billing/Postgres reconciled projection; Stripe is external transaction authority | payment pending/confirmed/cancelled, refund, dispute |
| Fulfillment | `CaseFile` and accepted workflow version | intake, waiting, active milestone, completed, case cancelled |

No dimension overwrites another. `payment_confirmed` does not imply `approved_to_start` or
`in_progress`; cancellation of the order, payment and case remain owner-qualified facts while
refund/dispute coexist independently.

### Proposed client presentation vocabulary

The following is a candidate code vocabulary, not approved business copy:

- `not_started`
- `waiting_for_payment`
- `waiting_for_client`
- `under_review`
- `approved_to_start`
- `in_progress`
- `waiting_for_external_party`
- `action_required`
- `on_hold`
- `completed`
- `cancelled`
- `refunded`
- `unconfirmed`

`ClientProcessStatusPolicy` maps a valid four-dimension input plus accepted workflow version to one
presentation code and explanation key. The mapping is closed and versioned. Unknown state,
unregistered source, impossible combination or missing critical input fails closed to
`unconfirmed`; the internal code never reaches the client.

### Milestone state

A public milestone is `upcoming`, `current`, `completed`, `blocked`, `skipped` or `unconfirmed` only
when the accepted workflow version defines and permits that public state. Completion requires a
real source transition. Reordering or correcting milestones creates a versioned/superseding fact;
it does not rewrite prior history silently.

### Public event state

A public event is `active`, `corrected`, `superseded` or `retracted`. Its source event remains
immutable. Corrections append an event linked to the prior public projection and retain provenance.

### Transition constraints

- Owning domains perform transitions; M010 only recomputes the projection.
- Every transition records actor/category, source version, trusted time and audit evidence.
- Out-of-order/duplicate source events are idempotently reconciled before projection.
- A terminal public state does not erase independent refund, dispute or reopened-case facts.
- Reopening, restarting or moving backward requires an owning-domain transition and approved public
  mapping; the UI cannot infer it from dates or missing milestones.
- Client timeline ordering does not grant transition authority.

## 8. Business rules

1. Every M010 process belongs to one real M009 `ServiceOrder`; operational progress normally belongs
   to its governing `CaseFile`.
2. The accepted service definition and workflow/milestone version govern the client's process;
   current catalog edits cannot rewrite history.
3. The current state, next action, blockers and timeline must be derived from real structured facts.
4. No progress percentage appears unless an approved service-specific policy proves it meaningful;
   Release 1A defaults to named milestones.
5. A date is labeled as factual, due, estimated or last-confirmed. Estimated dates require approved
   provenance, freshness and disclaimer and never imply a guarantee.
6. One closed `ProcessSourceRegistry` identifies every source that can change current state, next
   action or a blocking condition.
7. Every registered Postgres source capable of changing state, milestone, next action or blocker
   executes in the same read-only MVCC request snapshot and transaction-local restricted RLS actor
   context. Parallel execution is allowed only when the same snapshot can be proven.
8. If a missing/stale registered source could change the result, the affected result is
   `unconfirmed`; absence never means complete, paid or no blocker.
9. The M008 priority policy remains authoritative for the portal's global next action. M010 may
   select the process-local action using the same priority semantics, never a conflicting policy.
10. A public event must reference a real source event and an approved mapping-policy version.
11. Raw `AuditEvent` is never a client timeline record.
12. External dependency states include source/provenance and `lastConfirmedAt`; no partner outcome
    is guaranteed.
13. Internal notes, technical events, unapproved reasons and hidden resources are excluded before
    counts, pagination, summaries and telemetry.
14. Client actions always hand off to an owning route that performs fresh authorization and
    command validation.
15. Normal render uses current Postgres operational projections; it does not fan out to providers.
16. Personalized process output is private/no-store in Release 1A. Only versioned public static
    dictionaries may use shared caching.

## 9. Authorization rules

- M007 identity/session and membership establish who is acting, not what they may see.
- An explicit active grant to the `ServiceOrder` or governing `CaseFile` is required under ADR 004
  and ADR 013.
- A case grant may inherit only to client-visible child resources; internal resources never
  inherit, an inheritance block/explicit denial wins, and Highly Sensitive resources may require
  an additional grant and assurance step.
- Email, phone, `Client`, CRM relationship, `ServiceParticipant`, payment, entitlement or guessed
  reference never grants process access.
- M045 entitlements can narrow an action within an already visible process but cannot create
  visibility or human approval.
- The server derives actor, active context, grant set, assurance, policy version and trusted time;
  the browser supplies none as authority.
- Every owning-domain port authorizes before I/O and uses the restricted session-derived RLS
  context. User-facing reads prohibit `service_role`, owner and `BYPASSRLS`.
- One frozen `AuthorizationSnapshot` covers account, session family, membership, context, root and
  child grants, entitlements, assurance and security-policy versions.
- Each serialized root/child carries an authorization epoch covering parent linkage, visibility,
  inheritance/deny, classification/assurance, tombstone/deletion and accepted-definition binding.
- Immediately before serialization, all fences and resource epochs are revalidated. Any mismatch
  discards the complete response before body, counts, cursors, timing distinctions or route
  metadata are emitted.
- Unauthorized references return a resource-hiding 404 after authentication; clients cannot infer
  existence through counts, filters, cursors, latency or error wording.
- Every owning action and download reauthorizes independently; a public reference or route key is
  not a capability token.

## 10. Data requirements

M010 introduces conceptual projections, not approved tables.

### `ClientProcessProjection`

- opaque `publicServiceRef` and `publicProcessRef`;
- accepted service/workflow/milestone definition versions;
- server-validated `processEligibilityPolicyVersion` bound to those accepted versions;
- current public status code, copy key and mapping-policy version;
- four owner-qualified source subfacts with only allowlisted public fields;
- `asOf`, freshness outcome and trusted response time;
- current milestone and bounded milestone list;
- next-action projection and responsible-party category;
- bounded blockers/external dependencies;
- bounded public task/document/payment/signature/appointment summaries;
- bounded secure-conversation and deliverable-availability summaries without content or access
  capabilities;
- bounded public timeline page and opaque cursor;
- authorization snapshot/policy versions retained server-side, never exposed as secrets.

The timeline cursor is an opaque authenticated token or server-held reference bound to the target
process aggregate/context, timeline snapshot watermark, process-eligibility/mapping-policy versions,
last stable sort tuple and expiry. Every page request performs fresh authorization, eligibility and
final fencing. A tampered,
expired, cross-process/context or incompatible-version cursor returns a generic restart outcome
without revealing whether another target exists. The cursor is not a capability.

### `ClientProcessLandingProjection`

- current approved context label/reference only when authorized;
- paginated zero/one/many presentation outcome without a hidden-resource total;
- authorized process choices from the M009 root-selection port: opaque service reference, approved
  display name/context label, optional approved safe instance-disambiguator copy key and root
  authorization epoch;
- server-only accepted service-definition/workflow version binding and
  `processEligibilityPolicyVersion` proving eligibility was applied before ordering/pagination;
- source/policy/freshness versions and final-fence evidence retained server-side;
- opaque landing `nextCursor` and `hasMore`, bound to the authorized context/snapshot and root sort
  watermark; no exact total;
- no client-side filtering input, remembered service default, internal identifier or hidden count.

Release 1A's default Billing summary is limited to an owner-qualified semantic obligation/payment
state, freshness and canonical M014 route. It contains no invoice/public provider reference,
amount, balance, deposit, due amount/date, payment method, receipt, refund amount/method/date or
other transaction detail until PROC-010 is approved.

If two choices would have the same accessible service/context label, the server requires a distinct
approved bilingual instance-disambiguator copy key for each. A date/period/public reference is not
assumed safe merely because it is available. Without approved unique labels, the ambiguous controls
are suppressed and the landing returns a generic My Services/support recovery, not internal IDs.

### `PublicProcessEvent`

- opaque public event reference;
- immutable `sourceEventId`, source owner/type and source version held server-side;
- verified `SourceEventKey` = producer namespace + aggregate type + aggregate ID + source event ID;
- public event code and bilingual copy key;
- accepted service/workflow version and mapping-policy version;
- `occurredAt`, `recordedAt` and optional factual `effectiveAt`;
- public actor category, never unnecessary staff identity;
- resource scope, visibility/classification and authorization epoch;
- correction/supersession/retraction link, expected chain version and reason code when approved;
- target process aggregate key binding the same ServiceOrder, governing CaseFile, context and
  accepted workflow version;
- idempotency identity `(targetProcessAggregateKey, SourceEventKey, mappingPolicyVersion)` if
  materialized;
- provenance/audit reference retained outside the client DTO.

### `PublicMilestoneProjection`

- stable milestone-definition key and accepted workflow version;
- public label/copy keys, state, sequence and factual timestamps;
- source version, `asOf`, visibility and correction metadata;
- no percent or forecast unless separately approved.

### `ProcessBlockerProjection`

- opaque blocker reference, approved public category and copy key;
- owning domain, responsible-party category and severity/priority policy key;
- created/due/last-confirmed times when approved;
- owning route key when client action is permitted;
- no internal reason, note, score or provider payload.

### `ExternalDependencyProjection`

- approved public party category and optional approved display name;
- factual public state, provenance/source category and `lastConfirmedAt`;
- optional approved estimate range with source, jurisdiction, unit, calculated/expiry times and
  disclaimer key;
- stale/unconfirmed outcome and support route.

### Data minimization

Exclude staff notes, raw audit records, internal identifiers/statuses, provider IDs/payloads,
storage keys/URLs, document names/content, payment instruments, tax/credit details, prompts/model
output, risk scores and unrelated household/business data. Persisted materialized projections are
out of Release 1A and require a separate ADR.

## 11. API or service contracts

Conceptual application contracts; names and routes are not Build authority.

### `ClientProcessQueryService.getLanding`

Input: session-derived actor, active/requested context, locale and optional opaque landing cursor.

Output: `ClientProcessLandingProjection` built server-side only from M009's nonrecursive
`AuthorizedServiceChoicePort`. M010 resolves a closed Product Owner-approved
`ProcessEligibilityPolicySnapshot`; the port applies its accepted service-definition/workflow
criteria together with authorization before ordering/pagination. The base-selection call cannot invoke
`ClientServicesQueryService.list|getDetail`, an M010 query/port or any child summary/status/timeline
aggregator. It does not query a parallel process directory or infer a last/default service. Zero,
one and many choices are distinct safe presentation outcomes. Pagination reuses the Product Owner-
gated M009/MYSVC-004 limit contract, exposes only `hasMore`/opaque `nextCursor` and keeps every
authorized choice reachable without a total. The cursor is authenticated and bound to context,
authorization snapshot, eligibility-policy version, root sort watermark and expiry; tamper,
revocation, context/policy change or incompatible snapshot returns a generic landing restart. Every choice is bound to the same
authorization snapshot/resource epoch and the final fence runs before any choice,
count-equivalent metadata or route is emitted.

### `ClientProcessQueryService.getProcess`

Input: session-derived actor, opaque `publicServiceRef`, locale and optional bounded timeline cursor.

Output: `ClientProcessProjection` with one core-consistent process view and section-scoped
`fresh|empty|stale|unavailable` envelopes.

Contract:

- authorize and freeze the complete snapshot before domain reads;
- resolve the same server-side `ProcessEligibilityPolicySnapshot` used by landing and validate the
  root's accepted service-definition/workflow binding before any process/timeline read, count,
  cursor or route metadata;
- read every Postgres fact that can affect current state, milestone, next action or blocker from one
  read-only MVCC request snapshot with the transaction-local restricted RLS actor context;
- permit parallel critical-port reads only when the implementation proves they share that snapshot;
  otherwise return `unconfirmed` rather than a definitive state/action/blocker;
- allow separately timed `asOf` envelopes only for registered noncritical summaries that cannot
  alter status, milestone, action or blocker under the policy;
- query only the closed `ProcessSourceRegistry` through typed field-allowlisted ports;
- bind every fragment to the same authorization snapshot and source/policy versions;
- bind timeline pagination to a stable authorized snapshot watermark and deterministic
  `(occurredAt, recordedAt, publicEventRef)` ordering; a later correction/version change causes a
  generic restart rather than mixed pages;
- run deterministic public-state, milestone, local-action and event policies;
- final-fence every authorization/resource epoch plus eligibility-policy/accepted-version binding
  before serializing any output;
- return private/no-store response metadata and safe localized recovery codes;
- never return raw rows, arbitrary URLs, provider payloads or technical errors.

### Owning-domain query ports

- `ServiceOrderProcessPort.getCommercialAndActivationFacts`
- `CaseProcessPort.getFulfillmentAndMilestones`
- `TaskProcessPort.listClientRequirements`
- `DocumentProcessPort.getRequirementSummary`
- `BillingProcessPort.getFinancialSummary`
- `SchedulingProcessPort.getAppointmentSummary`
- `SignatureProcessPort.getSignatureSummary`
- `MessageProcessPort.getConversationAvailability`
- `DeliverableProcessPort.getDeliverableAvailability`
- `ExternalDependencyPort.listConfirmedDependencies`
- `PublicProcessEventPort.listTimeline`

Each returns a bounded typed projection plus source version, authorization epoch, classification,
`asOf` and outcome. A trustworthy `empty` result requires an authorized successful query.
The Billing port's Release 1A default field allowlist is only semantic obligation/payment state,
freshness and M014 route key; unavailable/unconfirmed never maps to paid or no obligation.

### Command and route ownership matrix

| Summary/action | Owning module | M010 authority |
|---|---|---|
| Client task | M023 Task Management | Summary + canonical handoff only |
| Document requirement or deliverable access | M011 Document Portal | Availability + canonical handoff only |
| Secure conversation | M012 Secure Messaging | Availability/unread state + canonical handoff only |
| Appointment | M013 Client Appointments | Summary + canonical handoff only |
| Invoice/payment/refund | M014 Client Billing | Summary + canonical handoff only |
| Signature/evidence | M067 Electronic Signature | Requirement/state + canonical handoff only |

Every destination performs fresh authorization, grant/assurance, concurrency and audit checks. M010
never invokes a command through the summary port.

### Route behavior

- Candidate landing: `GET /client/processes`; candidate detail:
  `GET /client/services/[publicServiceRef]/process`, both rendered server-first.
- Unauthenticated: stable 401/session recovery.
- Authenticated but absent/unauthorized: resource-hiding 404.
- Granted but ineligible, missing policy or changed accepted/policy version: the same normalized
  hidden/unavailable contract, with no process read or label/count/cursor/timing disclosure.
- Changed authorization or stale concurrency fence: safe retry/session result, no partial body.
- Rate/resource limit: localized 429 with retry behavior, no hidden-count leakage.
- Invalid/expired/tampered/cross-scope timeline cursor: generic restart from the first newly
  authorized page, with no target-existence disclosure.
- Dependency failure: section-scoped generic recovery; critical-source failure makes overall state
  or action `unconfirmed`.

## 12. Events and background jobs

### Consumed source events

- `service_order.accepted|changed|cancelled`
- `service_activation.reviewed|approved|held|declined`
- `case.created|state_changed|milestone_changed|completed|reopened|cancelled`
- `task.client_requirement_changed`
- `document.requested|accepted|rejected|expired`
- `invoice.updated`, `payment.updated`, `refund.updated`, `dispute.updated`
- `appointment.confirmed|changed|cancelled|completed|no_show`
- `signature.requested|completed|declined|expired`
- approved external-dependency and client-visibility events

Exact names remain architecture contracts until Build. Every producer owns its durable state in
Postgres and publishes through an outbox/equivalent atomic boundary.

### Release 1A request-scoped event derivation

`PublicProcessEventPort.listTimeline` reads a bounded, stable authorized cut of durable owner-domain
events/state and maps it in request scope through the pinned `PublicProcessEventPolicy`. It:

- validates source type/version and public allowlist;
- verifies producer namespace, aggregate type/ID, source event ID and target process binding;
- applies current resource authorization/visibility/classification before mapping;
- preserves the producer/aggregate-scoped `SourceEventKey`, mapping version and correction chain;
- treats exact duplicates deterministically and rejects same-key/different-content collisions;
- validates correction/retraction scope, expected chain version and acyclic links;
- orders and paginates the derived result under the stable snapshot watermark;
- returns no raw owner event, audit event, provider payload or unapproved public projection.

Release 1A creates no M010 projection table, writer, outbox consumer, materialization job,
reconciliation job or rebuild job. Duplicate/out-of-order source facts are interpreted against the
same durable owner state; configuration/integrity failures return `unconfirmed` and create only the
approved minimized operational evidence/manual issue in the owning audit/operations boundary.

### Future materialization and jobs — separately gated

A future persisted public-event projection, reconciliation/rebuild worker, Inngest function or
quarantine store requires a separate ADR, Product Owner approval and Build gate defining schema,
writer ownership, migration/backfill, idempotency/collision storage, retention/deletion,
authorization invalidation, correction chains, retries/timeouts, manual recovery, rollback and
deterministic rebuild evidence. Inngest may then coordinate work but can never own durable business
or public-event truth. This future design cannot be inferred from the conditional materialization
identity in ADR 014.

## 13. Error states and recovery

| Condition | Client-safe behavior | Recovery |
|---|---|---|
| Expired/revoked session | No protected response | M007 sign-in/recovery |
| Unauthorized/unknown reference | Resource-hiding 404 | Return to My Services/support |
| Grant or resource epoch changes during read | Discard complete response | Safe retry after fresh authorization |
| Critical source unavailable/stale | `unconfirmed`; no definitive action/state | Refresh, reconciliation and support |
| Optional section unavailable | Preserve valid sections; label unavailable | Section retry/support |
| Last-confirmed noncritical source allowed stale | Show explicit `asOf`; disable risky action | Reconciliation/refresh |
| Stripe/reconciliation unavailable | Financial fact unknown/unconfirmed | M014 support/reconciliation; never mark paid |
| External provider unavailable | Last confirmed only if current authorization passes | Manual follow-up; no live browser call |
| Unknown internal state/event | Do not expose code; reject mapping | Configuration incident/manual mapping review |
| Duplicate/out-of-order event | Idempotent request interpretation | Recompute from durable Postgres facts |
| Timeline correction | Append corrected/superseding entry | Preserve provenance and audit |
| Cursor/version invalid | Restart authorized timeline page | No count/existence leakage |
| Locale entry missing | Safe generic parity-reviewed fallback | Translation issue; do not mix critical copy |
| AI unavailable/unsafe | Deterministic structured explanation | Human support; no state change |

Stale output is never shown if current authorization cannot be confirmed. Error responses and
latency must not reveal hidden resources or internal/provider details.

## 14. Security and privacy requirements

- Threat-model BOLA/IDOR, cross-context access, revocation during assembly, hidden-count/cursor
  inference, timeline poisoning, event spoofing, stale financial claims, route-key misuse, cache
  leakage and telemetry disclosure.
- Enforce authorization in domain services and Postgres RLS; the UI is not a security boundary.
- Use opaque public references and strict allowlisted parsers, sort keys, cursors and route keys.
- Verify event producer, schema/version, resource ownership, visibility and idempotency before
  public projection.
- Never derive a public timeline directly from user-supplied prose or raw provider webhooks.
- Keep personalized HTML/RSC/data private and `no-store`; prohibit ISR/shared CDN, service-worker
  offline caches, localStorage and sessionStorage for process data.
- Strip protected portal state from browser history/back-forward restoration after sign-out or
  context change as supported by the approved shell.
- No signed Storage URL, document content/name, payment instrument, provider secret/ID, internal
  note/status or sensitive free text enters the DTO.
- Logs, traces, Sentry and PostHog use stable operation/result codes, correlation IDs and timings;
  they exclude client/service references where not required, event copy, document/payment details,
  notes and route parameters containing protected identifiers.
- PostHog autocapture/session replay remains disabled in authenticated surfaces.
- Apply bounded list sizes, cursor signing/validation, per-port timeouts and actor/session/IP-aware
  abuse controls without making hidden-resource timing distinguishable.
- Corrections, retractions, staff access and support inspection produce minimized audit events.
- An AI receives only explicitly authorized, minimized structured facts after separate approval; no
  raw timeline, document, tax, credit or financial content is sent by default.
- Complete enhanced independent security review before acceptance or Build.

## 15. UX and accessibility requirements

### Information hierarchy

The first viewport answers, in order:

1. service and active context;
2. current client-safe state and last-confirmed time;
3. one next step and responsible party;
4. blockers or waiting reason;
5. milestone progress.

Timeline and supporting summaries follow. The client does not need to understand case IDs, module
numbers, internal roles or provider terminology.

### Responsive behavior

- Desktop: process header and timeline occupy the main column; a sticky-but-non-obstructive side
  card presents next action, blockers and support.
- Tablet: columns collapse based on available content width; the next-action card precedes the
  timeline.
- Mobile: one linear flow—service, status, next action, blockers, milestones, timeline, supporting
  summaries—with no horizontal timeline or data table.
- Reflow works from 320 CSS px through 200% zoom without loss or two-dimensional scrolling.

### Accessibility

- WCAG 2.2 AA, semantic headings/landmarks/lists and valid reading order.
- Status is expressed with text and icon semantics, never color alone.
- Current milestone uses `aria-current="step"` or equivalent semantic markup; completed items are
  not announced as buttons.
- Timeline is an ordered list with visible dates and descriptive event headings.
- Every interactive target is at least 44×44 CSS px where applicable and keyboard reachable.
- Focus is visible; focus moves predictably after route/section recovery.
- Errors and asynchronous section changes use appropriate live-region behavior without repeated
  announcements.
- Reduced motion removes nonessential transitions; no parallax, auto-advancing progress or animated
  percentages.
- Dates, ranges and amounts include unambiguous localized text for assistive technology.

### Visual system

Use Manrope headings, Inter body/control text, navy `#0A2540`, cobalt `#0B63CE`, cyan `#00A3E0`,
green `#2E7D32`, gold `#B7791F` and surface `#F7F9FC`. Green is reserved for confirmed positive
facts; gold signals attention but never substitutes for text. Light-first; dark tokens remain
unpublished in Release 1A. Motion is subtle and functional.

## 16. Bilingual requirements

- Every system-owned heading, status, milestone, event, blocker, action, responsible-party label,
  date qualifier, disclaimer, error and recovery message has English/Spanish parity.
- Public projections store stable semantic codes/copy keys, not a Spanish or English sentence as
  business state.
- Critical instructions never silently mix languages. A missing translation uses an approved safe
  generic fallback or suppresses the affected action while preserving support.
- Translation review verifies the same obligation, uncertainty and no-guarantee meaning in both
  languages; literal translation is insufficient.
- Dates, times, currencies and number ranges use the selected locale and IANA time zone while
  preserving the same underlying instant/value.
- User-authored text is not auto-translated without future consent and policy; unreviewed free text
  is not projected into the public timeline in Release 1A.
- Screen-reader accessible names and error announcements require parity, not only visible copy.

## 17. Acceptance criteria

### Functional/architecture

- [ ] One explicitly granted service process can be viewed through a typed request-scoped
  projection; an ungranted process is absent before count/cursor/empty-state logic.
- [ ] The top-level landing proves zero/one/many authorized-choice behavior, uses only M009's
  nonrecursive `AuthorizedServiceChoicePort` server-side and never restores or infers a hidden,
  revoked or cross-context choice/default.
- [ ] Landing pagination tests cover M009 page limit N−1/N/N+1 and multiple pages; every authorized
  eligible choice is reachable through opaque continuation while no exact/hidden total or silently
  truncated result is exposed.
- [ ] Mixed eligible/ineligible accepted service/workflow versions across page boundaries prove
  eligibility is applied before order/pagination; zero/one/many and `hasMore` describe only eligible
  authorized choices without leaking ineligible labels/counts/timing.
- [ ] Missing/unapproved/changed eligibility policy or a cursor bound to another policy version
  fails to a generic unavailable/restart outcome before choices or metadata.
- [ ] Direct detail URL tests prove the same eligibility policy/binding as landing: eligible works;
  ineligible/missing policy fails before any process read/metadata; a policy or accepted-version
  change during assembly fails the final fence with no label/count/cursor/timing leak.
- [ ] Tampered/expired landing cursors, grant revocation, context switch and back-forward restoration
  return a generic restart and expose no hidden name, count, route or timing distinction.
- [ ] Two or more authorized eligible choices with the same service/context label require unique approved
  bilingual safe instance labels; absent/duplicate disambiguators fail closed to My Services/
  support with no internal ID, opaque reference text or wrong-process control.
- [ ] A dependency-DAG/spy contract fails if landing base selection calls
  `ClientServicesQueryService.list|getDetail`, M010 itself or any child status/summary/timeline port.
- [ ] Core commercial, human-activation, financial and fulfillment facts retain their canonical
  owners and are read consistently.
- [ ] Concurrent Case/Task/Document/Billing source tests prove every Postgres input capable of
  changing status, milestone, action or blocker shares one MVCC request snapshot/RLS actor; when a
  common cut cannot be proven, no definitive result is returned.
- [ ] Separately timed `asOf` envelopes are accepted only for policy-registered noncritical
  summaries that cannot alter status, milestone, next action or blocker.
- [ ] The deterministic versioned policy handles the approved state matrix and fails closed for an
  unknown, impossible or incomplete combination.
- [ ] Named milestones are bound to the accepted workflow version; catalog edits do not rewrite an
  existing client's process.
- [ ] One process-local next action follows the M008 priority semantics and every owning route
  reauthorizes independently.
- [ ] Every timeline item traces to a real source event plus mapping-policy version; duplicate,
  out-of-order, corrected and retracted events are deterministic.
- [ ] Timeline pagination is bounded, snapshot-consistent and deterministic; tampered, expired,
  cross-process/context or incompatible-policy cursors fail to a generic restart and grant/
  visibility changes cannot survive the final fence.
- [ ] The verified producer/aggregate-scoped `SourceEventKey` keeps reused source IDs distinct;
  exact duplicates are idempotent and same-key/different-content collisions are rejected to
  `unconfirmed` plus a minimized owning audit/operations issue, without a Release 1A quarantine
  store or overwrite.
- [ ] Correction/retraction tests reject cross-process/context/owner/workflow targets, self-links,
  cycles, missing targets and stale expected versions without revealing target existence; a
  deterministic request-scoped recomputation preserves every valid independent chain.
- [ ] Every active critical source is registered; missing/stale sources produce `unconfirmed`, not
  a false complete/paid/no-action result.
- [ ] No normal render calls Stripe, Google, Storage, a partner, Sanity or an AI provider.
- [ ] Message/deliverable summaries contain only approved availability/count-or-state fields,
  freshness and canonical route keys; owning routes reauthorize and unavailable is never empty.
- [ ] Billing DTO allowlist tests permit only owner-qualified semantic obligation/payment state,
  freshness and canonical M014 route until PROC-010 approval; unavailable/unconfirmed never becomes
  paid/no obligation.
- [ ] Contract tests map Task→M023, Document/deliverable→M011, Message→M012, Appointment→M013,
  Billing→M014 and Signature→M067 and prove M010 cannot call their command ports.
- [ ] Release 1A uses no monolithic mutable M010 process/timeline truth.
- [ ] Release 1A has no M010 projection table, writer, materialization/reconciliation/rebuild job or
  Inngest function; timeline events are derived request-scoped from a stable authorized owner cut.
- [ ] An architecture/build gate test fails any M010 materializer, projection migration or writer
  unless a separate approved ADR and Build decision exist.

### Authorization/security

- [ ] Domain and RLS tests prove explicit root access, permitted inheritance, internal-child
  exclusion, explicit deny/block precedence and Highly Sensitive assurance.
- [ ] Adversarial delayed-port tests change session, membership, context, grants, entitlements,
  assurance, visibility, classification, parent linkage, accepted-definition binding and
  tombstone state; every mismatch discards all response metadata/body.
- [ ] Hidden resources cannot be inferred from status codes, totals, cursors, filters, latency,
  telemetry or route metadata.
- [ ] Landing tests cover zero/one/many, multiple contexts, revoked/hidden services, opaque
  selection and back/forward restoration without hidden name/count/timing disclosure.
- [ ] Personalized output is absent from shared/offline/browser storage and protected state cannot
  be restored after sign-out/context switch.
- [ ] Logs/traces/errors/analytics contain no protected process content or forbidden identifiers.

### UX/accessibility/bilingual

- [ ] At 320px, tablet and desktop, the status, next step, responsible party and blocker remain
  understandable without horizontal scrolling.
- [ ] Keyboard, screen reader, visible focus, 200% zoom, reduced motion and semantic timeline/
  milestone tests pass.
- [ ] English/Spanish parity tests cover every state, uncertainty, correction, error and date/
  estimate disclaimer.
- [ ] Loading, empty, partial, stale, unavailable, unconfirmed, corrected and terminal states have
  truthful distinct presentations.

## 18. Negative acceptance criteria

- [ ] No email, CRM/client relationship, participant, payment, entitlement or URL guess grants
  access.
- [ ] No internal state code, staff note/task, approval rationale, risk score, raw audit event,
  provider payload/error or hidden resource appears in client output.
- [ ] No payment fact is represented as permission to begin or proof of fulfillment.
- [ ] No missing source is rendered as no blocker, complete, paid, current or empty.
- [ ] No arbitrary percentage, AI-generated state, unsupported deadline, SLA or outcome guarantee
  is displayed.
- [ ] No timeline entry exists without real source provenance and an approved mapping version.
- [ ] No correction mutates or erases the immutable source event/history.
- [ ] No correction/retraction crosses producer aggregate, ServiceOrder, governing CaseFile,
  context or accepted workflow, creates a cycle or succeeds with a stale chain version.
- [ ] No public event or milestone is created from user-supplied free text alone.
- [ ] No route key, cursor or opaque reference is treated as authorization.
- [ ] No direct detail URL bypasses Release 1A service/workflow eligibility or uses landing/UI
  filtering as enforcement.
- [ ] No browser-side process selector filters an unscoped service collection or persists a
  last/default service across session, grant or context changes.
- [ ] No internal ID, raw opaque reference, unapproved date/period or sensitive service fact is used
  as a visible/accessibility disambiguator.
- [ ] No authenticated process response is stored in ISR/CDN/shared cache, service worker,
  localStorage or sessionStorage.
- [ ] No normal render depends on a live external provider.
- [ ] No command for documents, tasks, payments, signatures, appointments, messages or case status
  is owned by M010.
- [ ] No message body, subject/free text, attachment, participant detail, deliverable filename/
  content, storage key, signed URL or download capability appears in an M010 projection.
- [ ] No invoice/reference, amount, balance, deposit, due amount/date, payment method, receipt,
  refund amount/method/date or transaction detail appears before PROC-010 approval.

## 19. Dependencies

- M007 Identity and Account plus ADR 004/011 authorization/session model.
- M008 dashboard aggregation/priority/freshness and proposed ADR 012.
- M009 ServiceOrder/CaseFile/version boundary and proposed ADR 013.
- M011 Documents/deliverables, M012 Secure Messaging, M013 Scheduling, M014 Billing, M067 Signatures
  and their typed client projections.
- M021 Service Orders, M022 Cases, M023 Tasks and M068 Workflow Engine as owning state domains.
- M077 audit provenance, M078 consent where communications/analytics apply, M080/M081 IAM/RBAC.
- Approved service catalog/workflow/milestone versions and bilingual content governance.
- Postgres/RLS restricted read context, outbox/idempotent job patterns and Inngest coordination.
- Portal design system, i18n, observability redaction and human support route.

M010 does not require live provider credentials to finish architecture. Real source data, workflow
mappings, copy and providers remain separately gated.

## 20. Risks

| Risk | Impact | Architectural control |
|---|---|---|
| BOLA/IDOR or cross-context leak | Client sees another process | Explicit grants, RLS, opaque refs, final epoch fence |
| Second mutable process truth | Contradictory status | Projection only; owners remain ServiceOrder/Billing/Case/workflow |
| False reassurance on partial failure | Missed obligation | Closed source registry and `unconfirmed` fail-closed result |
| Raw timeline leaks internal data | Privacy/legal harm | Public event allowlist, typed DTO, provenance and negative tests |
| Event duplication/reordering | Wrong chronology | Idempotency, immutable source, deterministic request-scoped recomputation |
| Current catalog rewrites history | Contract/progress mismatch | Accepted definition/workflow version binding |
| Stale payment/partner state | Misleading client action | Reconciled Postgres facts, freshness budgets, no live browser fan-out |
| Invented estimate or percentage | False promise | Named milestones; approved provenance/disclaimer only |
| Route/cursor used as capability | Unauthorized command/read | Reauthorize owning route; signed/validated opaque cursor |
| Personalized cache leakage | Cross-client exposure | Dynamic private/no-store and sign-out/context-switch cleanup |
| Translation semantic drift | Different obligations by language | Stable codes, parity and semantic review |
| Overloaded mobile experience | Client cannot find next step | Progressive disclosure and next-action-first linear mobile layout |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the public M010 status vocabulary, four-dimension mapping
  matrix and semantically equivalent English/Spanish copy.]
- [NEEDS PRODUCT OWNER DECISION: approve which Release 1A service types and accepted milestone sets
  are eligible for the detailed process view.]
- [NEEDS PRODUCT OWNER DECISION: approve the public timeline event/reason allowlist, correction/
  retraction presentation and client-visible retention window.]
- [NEEDS PRODUCT OWNER DECISION: approve responsible-party categories and whether any staff or
  partner display name may be shown.]
- [NEEDS PRODUCT OWNER DECISION: approve the process-local next-action source priority, tie rules
  and conflict handling consistent with M008.]
- [NEEDS PRODUCT OWNER DECISION: approve public blocker categories, severity/priority labels and
  how much reason detail may be displayed.]
- [NEEDS PRODUCT OWNER DECISION: approve which factual deadlines or estimate ranges may appear,
  their sources, freshness/expiry rules and required disclaimers.]
- [NEEDS PRODUCT OWNER DECISION: approve delay/on-hold language, client escalation route and any
  service-response expectation; default is no SLA promise.]
- [NEEDS PRODUCT OWNER DECISION: approve completed, cancelled, reopened and restarted process
  history/visibility rules.]
- [NEEDS PRODUCT OWNER DECISION: approve which payment, invoice and refund fields may appear in M010
  versus only M014, including references, amounts, balance, deposit, due date, method, receipt and
  refund details.]
- [NEEDS PRODUCT OWNER DECISION: approve which partner/external-party names, states and provenance
  may be client-visible.]
- [NEEDS PRODUCT OWNER DECISION: approve task due/overdue labels, client priority and completed-task
  history shown in M010.]
- [NEEDS PRODUCT OWNER DECISION: approve public document, deliverable, secure-conversation,
  signature and appointment summary fields and route handoffs.]
- [NEEDS PRODUCT OWNER DECISION: approve contextual Help Center/AI explanation scope and the exact
  human-support fallback.]
- [NEEDS PRODUCT OWNER DECISION: approve M010 analytics events, viewers, retention and per-source
  freshness/staleness thresholds.]
- [NEEDS PRODUCT OWNER DECISION: approve the bilingual safe service-instance disambiguator fields/
  copy used when two authorized process choices share the same service and context label.]
