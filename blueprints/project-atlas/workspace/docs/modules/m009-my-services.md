# Module PRD — M009 Mis servicios

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture candidate; no Build gate
- Surface: Client Portal `/client/services`
- Workstream: R1.5 Client Portal & Launch
- Release target: Release 1A minimum service workspace with compatible Release 1B extensions
- Source: complete Product Owner-supplied M009 corpus, normalized to the approved stack
- Related catalog modules: M009; consumes M007/M008/M010–M014/M018/M021–M026/M042–M046/M067/M077/M080–M081
- Proposed ADR: ADR 013

This PRD defines the client-facing service directory and service-detail shell. It does not authorize
product code, routes, database schema, RLS or Storage policies, external-provider traffic, merge,
deployment or `GENERATE`.

## 1. Purpose

Give an authenticated, explicitly authorized client one dependable place to understand every real
SG Solutions service relationship that the client is allowed to see.

The module answers:

1. Which services are mine?
2. Which are waiting for me, active, completed, cancelled or otherwise unavailable?
3. What is the current client-safe stage and next step?
4. Which owning portal area contains the related documents, tasks, payments, appointments,
   messages, timeline and deliverables?

M009 is not the public catalog, a second CRM, a case-management system or a place where the browser
changes operational state. Every displayed service is backed by a real `ServiceOrder`; active work
normally also has a `CaseFile`.

## 2. Business value

- Give clients transparent service orientation without revealing staff operations.
- Reduce repetitive status questions and navigation friction.
- Keep paid, approved-to-start and in-progress meanings factually separate.
- Provide one reusable service workspace for personal, household and business contexts.
- Prevent service verticals from building duplicate client, payment, task or document portals.
- Create a durable Release 1A foundation that Release 1B can extend with richer timelines,
  recurring services, renewals and governed cancellation requests.
- Keep SG Solutions services visibly distinct from partner products and referrals.

## 3. Scope

### Release 1A architecture

- Authenticated route family rooted at `/client/services`.
- A bounded directory of only explicitly authorized real `ServiceOrder` records.
- Simple status/action filters and server-side search over authorized public references and approved
  display labels.
- Client-safe cards with service name, context, public presentation state, current real milestone,
  next-step outcome, last verified time and one details action.
- A service-detail shell with overview, next step and real named milestone progress.
- Bounded client-safe summaries that link to the owning task, document, payment, appointment,
  message and process-status modules.
- Client-safe agreement/deliverable availability without implementing signature or document access.
- Explicit complete, empty, partial, stale, unavailable, cancelled and refunded presentation.
- One frozen authorization context plus root/child resource epochs and a final revocation fence for
  each directory/detail response.
- Versioned service definition, public-status and public-milestone projections.
- Private/no-store personalized responses and no browser provider fan-out.
- Responsive, bilingual and WCAG 2.2 AA experience using the approved brand system.
- Minimized, optional operational telemetry only after Product Owner approval.

### Compatible Release 1B extensions

- Approved advanced filters, ordering and pagination for larger service histories.
- Richer M010 timeline/status integration and more owning-module summary cards.
- Recurring-service and renewal presentation after catalog/billing policy approval.
- Governed cancellation or change-request initiation that creates an internal review request.
- Approved service participant/delegated-representative contexts.
- Partner-referral status in a clearly separate related-products region.
- Authorized downloadable deliverables through M011 and signatures through M067.
- A separately governed support projection for authorized staff.

Release 1B must extend the same identifiers, grants, service-order snapshots, status policy and
query contracts. A duplicate service table or disposable Release 1A portal is prohibited.

## 4. Explicit out of scope

- Public service discovery, public pricing or checkout merchandising; M001/M042/M046 own them.
- Creating a service merely because a person viewed content, asked a question, began a form or was
  recommended a product.
- Creating, editing, approving, starting, completing, cancelling or refunding a `ServiceOrder`.
- Editing a case, milestone, task, document, payment, appointment, message or deliverable.
- M010's complete process-status and timeline experience.
- M011 upload, preview, scan, download, retention or deletion behavior.
- M012 message bodies, attachments or send behavior.
- M013 booking, rescheduling or cancellation behavior.
- M014 checkout, invoice, receipt, refund or dispute behavior.
- Internal notes, staff tasks, approval rationale, risk scores, provider errors, prompts, agent
  output, legal strategy or raw audit events.
- Automatic service execution after a payment event.
- Fabricated progress percentages, completion dates, outcome guarantees or approval promises.
- An AI-selected status, milestone, next action, entitlement or route.
- Cross-sell or partner application inside the primary service list in Release 1A.
- Multi-tenant, white-label, native mobile or microservice architecture.
- Final status copy, cancellation/refund policy, renewal rules or support promises without Product
  Owner approval.

## 5. Actors

### Active client

Has an active M007 account/session/membership and an explicit active grant to the service order,
case or permitted resource. Membership or matching email alone grants nothing.

### Client with several contexts

May have personal, household or business relationships. Only one authorized context is active in a
request. Context switching remains gated until the M007 delegation policy is approved.

### Authorized service participant

May be a spouse, business member or authorized representative. A `ServiceParticipant` relationship
describes participation but never substitutes for an explicit access grant.

### Owner or authorized staff

Creates and operates service orders/cases through their owning Admin modules. Staff publishes
client-safe facts through versioned mappings; staff never edits an M009 card directly.

### Client services query service

Composes minimized projections from owning domains under one authorization snapshot. It owns no
business or provider state and cannot broaden access.

### AI assistant

May later explain an already authorized status or route using approved content. It cannot infer or
change state, select access, execute a service, promise an outcome or retrieve hidden records.

## 6. User journeys

### View my services

1. The client opens `/client/services` through an active M007 application session.
2. The server derives the actor and validates the requested/default context.
3. The query service freezes account, session, membership, context, grant, entitlement and policy
   versions, every serialized resource authorization epoch and trusted server time.
4. The directory query returns only service-order projections the actor is allowed to know exist.
5. Cards show factual client-safe status, milestone, next-step outcome and bounded obligations.
6. The server revalidates every authorization fence before serialization.

### Open one service

1. The client follows an opaque, canonical service reference.
2. The server reauthorizes the service order and applicable case; a guessed or unauthorized
   reference returns a resource-hiding 404.
3. Core order/case/milestone facts are read from one consistent request cut.
4. Typed child ports return bounded authorized summaries for tasks, documents, payments,
   appointments, messages and deliverables.
5. The detail shell displays only the sections that apply and links to owning routes.

### Follow the next step

1. M009 receives a deterministic client-action projection from the owning workflow/M008 policy.
2. The page explains the step and links to the canonical owning module.
3. The destination reauthorizes and performs any permitted action.
4. M009 does not optimistically change status; a later query reflects committed domain state.

### Payment received but service not approved

1. The financial projection states that payment is confirmed.
2. The activation projection remains `pending_internal_review` until an authorized human approves.
3. Client copy explicitly says the team is reviewing the service before work begins.
4. No entitlement, milestone or case transition is inferred from the return URL or browser state.

### Partial dependency failure

1. Core service identity and authorization remain valid, but a child summary is unavailable.
2. The failed region says that its information cannot be confirmed; it never displays zero.
3. If the missing source could affect the next step, next step becomes `unconfirmed` under ADR 012.
4. Other authorized, fresh sections remain usable after the final revocation fence.

### Cancelled or refunded service

1. The service remains in history if the client is still authorized to see it.
2. Cancellation, refund and fulfillment facts are displayed on separate axes.
3. M009 shows an approved public reason/status and support path without internal dispute/risk notes.

### No services or no filter results

An empty account state appears only after an authorized successful query proves zero visible
service orders. A filter-empty state preserves the service count boundary and offers clear/reset
actions without implying that other hidden resources exist.

## 7. States and transitions

M009 does not own service transitions. It presents four canonical subfacts plus a versioned
client-facing synthesis.

### Commercial relationship dimension

`ServiceOrder` owns the accepted relationship, immutable accepted
definition/scope/workflow/pricing binding and commercial lifecycle. Exact commercial lifecycle
codes remain a Product Owner decision; any cancellation is explicitly `order_cancelled` in the
policy input and is never inferred from payment or case state.

### Financial dimension

Billing/Postgres owns the reconciled obligation/transaction projection while Stripe remains the
external transaction authority. Candidate subfacts are `quote_pending`, `payment_pending`,
`processing`, `paid`, `partially_paid`, `payment_cancelled`, `refunded`, `partially_refunded` and
`disputed`. They may coexist where the owning billing contract allows; none starts or cancels work.

### Human activation dimension

`ServiceOrder` owns the current human activation subfact. Candidate values are `not_submitted`,
`pending_internal_review`, `approved_to_start`, `declined` and `withdrawn`; a linked `Approval`
record is evidence/audit and not a competing current status.

Only an authorized owning-domain command may change this dimension. `paid` does not imply
`approved_to_start`.

### Fulfillment dimension

`CaseFile` and its approved workflow own fulfillment, milestones and next action. Candidate facts
are `not_started`, `active`, `waiting_for_client`, `waiting_for_external`, `on_hold`, `completed`
and `case_cancelled`. A preliminary authorized ServiceOrder may have no `CaseFile`; M009 represents
that absence without fabricating operational state.

Exact workflow transitions are service-definition/version specific and belong to M021/M022 and the
vertical module. M009 never hardcodes them in a component.

### Milestone presentation

Each versioned service workflow may publish an ordered subset of real milestones with
`not_started`, `current`, `completed`, `blocked` or `not_applicable`. Nonlinear workflows use named
status instead of false sequence/progress.

### M009 request/section states

- Request: `received → authorized → assembling → complete|partial` or `unauthenticated|not_found|
  policy_changed|temporarily_unavailable`.
- Section: `loading → fresh|empty|stale|unavailable`.
- Next step: `required|upcoming|informational|none|unconfirmed`.
- Service history presentation: `active|waiting|completed|cancelled|refunded|on_hold`, derived by an
  approved versioned policy and never stored as a competing truth.

## 8. Business rules

1. A visible service must reference a persisted real `ServiceOrder`.
2. Work in progress normally also references a real `CaseFile`; M009 does not fabricate one.
3. Interest, public-form activity, chat intent and marketplace recommendations are not contracted
   services.
4. `ServiceOrder` owns the commercial lifecycle/accepted binding and current human activation
   outcome; Billing/Postgres owns the reconciled financial projection while Stripe owns external
   transaction state; `CaseFile` and its approved workflow own fulfillment, milestones and next
   actions. Linked `Approval` is evidence/audit, not a second activation status.
5. The service order captures the accepted service-definition/workflow/pricing versions so later
   catalog edits cannot rewrite what the client bought.
6. A versioned mapping synthesizes client-facing status from structured commercial, financial,
   activation and fulfillment subfacts. It cannot mutate those facts.
7. `paid`, `approved_to_start` and `in_progress` are never synonyms.
8. `order_cancelled`, `payment_cancelled` and `case_cancelled` are owner-qualified; refund and
   chargeback/dispute remain separate subfacts and no axis erases another.
9. Client progress uses real public milestones or named stages. Arbitrary percentages and dates are
   prohibited.
10. M009 shows one service-specific next step generated by an owning workflow rule. An LLM may only
    explain the selected safe result.
11. Cards remain concise. Full actions and histories live in the owning detail/portal modules.
12. A section displays `empty` only after its authorized source proves zero applicable items.
13. A missing critical source never becomes zero, complete, paid, accepted or no-action.
14. Internal tasks, notes, approval rationale, risk, technical failures and hidden milestones are
    excluded before aggregation and from totals/timing differences.
15. Services may be personal, household or business scoped, but the user sees only the currently
    authorized context.
16. A participant record grants no access by itself.
17. SG Solutions services and partner/referral products are visually and semantically separate.
18. Partner status is shown only when supplied by the authoritative approved adapter; unknown is
    represented honestly.
19. Service actions use allowlisted internal route keys. Browser/provider URLs are not accepted as
    navigation authority.
20. M009 does not confirm a cancellation, renewal, refund, signature or deliverable until the
    owning domain reports the authoritative state.
21. Display in M009 never grants an entitlement, case access or capability.

## 9. Authorization rules

- M007 resolves an active account, application session and membership before M009 runs.
- The server derives actor/context; browser identifiers are untrusted requests.
- Directory visibility requires an explicit active grant to the `ServiceOrder` or its approved
  governing `CaseFile`, according to ADR 004 and proposed ADR 013. Client membership alone is
  insufficient.
- A participant/client/contact/email/payment relationship never grants read access.
- Case inheritance reaches only client-visible descendants. Internal notes and staff tasks never
  inherit; Highly Sensitive documents may require additional explicit access.
- M045 entitlements may narrow actions available inside an authorized service but cannot create
  resource visibility or replace human approval.
- Every owning-domain port authorizes before I/O; Postgres RLS applies the same scope with a
  session-derived restricted role. User routes never use `service_role`, owner or `BYPASSRLS`.
- List totals, filters and empty states are calculated after authorization and cannot reveal hidden
  orders or contexts.
- The complete authorization snapshot includes account, session family, membership, context,
  service/case/resource grant set, entitlement set, assurance and policy versions. For every
  serialized root/child it also includes a resource authorization epoch covering parent
  ServiceOrder/Case/context linkage, client-visible/internal state, inheritance block/explicit
  denial, classification/assurance requirement, tombstone/deletion state and accepted-definition
  binding. All fences and epochs are revalidated before serialization; any mismatch discards the
  complete directory/detail response before body, counts, cursors or route metadata are emitted.
- Detail children inherit only when the resource is client-visible and within the active granted
  case/service scope; a child-level inheritance block or explicit denial wins.
- Highly Sensitive document/payment summaries use generic obligations unless policy permits
  particular metadata and required assurance is present.
- Unauthorized/private resources use non-enumerating 404 behavior; operational denial remains
  distinguishable to authorized audit systems only.
- Every mutation, download and provider handoff occurs in its owning module and reauthorizes there.

## 10. Data requirements

### Core source records

- `ServiceOrder`: opaque ID/public reference, client/context linkage, service-definition version,
  immutable commercial snapshot/binding, commercial lifecycle, current human activation outcome,
  linked Approval evidence reference, assigned-team reference, lifecycle timestamps and optimistic
  version. It does not own financial transactions or case fulfillment.
- `ServiceDefinitionVersion`: stable code, category, approved localized display keys, included/
  excluded scope, workflow/milestone version, required-document-set version, billing type and active
  publication state.
- `CaseFile`: service-order link, current operational state, approved public projection, current
  milestone, client-safe next-action reference and version.
- Billing client projection: reconciled obligation/payment/payment-cancellation/refund/dispute
  subfacts linked to the order; raw Stripe payloads remain outside M009.
- Approval evidence: actor, outcome, reason-key visibility and version linked to the order; internal
  rationale remains excluded and does not create a second activation status.
- `ServiceStatusHistory`: internal transition reference, mapped public event/message key,
  visibility, actor type, reason code and timestamp; protected details remain excluded.
- `ServiceMilestone`: definition/version, state, public visibility/order and lifecycle timestamps.
- `ServiceDeliverable`: definition, document reference, status/version, visibility and delivery/
  revocation timestamps.
- `ServiceParticipant`: role and relationship only; not an authorization grant.

These are conceptual contracts, not authorization to add database tables or columns. A future Build
must reuse existing primitives and Drizzle-only schema authority.

### Client directory projection

`ClientServiceListProjection` contains:

- schema/policy versions, generated time, locale and safe IANA display zone;
- opaque active-context reference and approved label;
- bounded authorized `ClientServiceCard[]`;
- filter/search outcome and cursor metadata that reveal no hidden records;
- complete/partial freshness outcome.

Each card contains only approved service display key, public reference, context label, synthesized
public presentation code, current real public milestone, safe next-step state, bounded obligation
indicators, last verified timestamp and allowlisted details route key.

### Client detail projection

`ClientServiceDetailProjection` contains:

- the same schema/policy/context/freshness envelope;
- one minimized service header and status explanation;
- `ClientMilestoneProjection[]` from the accepted workflow version;
- one deterministic next-step projection;
- bounded typed summaries for tasks, documents, payments, appointments, messages, timeline,
  agreements and deliverables;
- per-section outcome and canonical owning route key.

It excludes raw provider payloads, object keys, permanent/signed URLs, internal IDs, staff notes,
private milestones, risk/approval rationale, message/document content and hidden-resource counts.

## 11. API or service contracts

Provider-neutral application contracts:

- `ClientServicesQueryService.list(actor, requestedContextRef?, filter, query, cursor, locale) →
  ClientServiceListProjection`.
- `ClientServicesQueryService.getDetail(actor, publicServiceRef, requestedContextRef?, locale) →
  ClientServiceDetailProjection | NotFound`.
- `AuthorizedServiceChoicePort.listProcessChoices(actor, authorizationSnapshot, context, locale,
  processEligibilityPolicySnapshot, opaqueCursor?) → AuthorizedServiceChoicePage` is the M009-owned
  nonrecursive root-selection port for M010. The immutable, server-derived policy snapshot contains
  a closed approved version and accepted service-definition/workflow eligibility criteria. The port
  applies authorization and eligibility before ordering/pagination without calling M010. It returns
  only opaque authorized eligible service references, approved display/context labels,
  an optional Product Owner-approved safe instance-disambiguator copy key, each root authorization
  epoch, accepted definition/workflow version binding retained server-side and opaque
  `nextCursor`/`hasMore` without a total. Every page/cursor uses
  the same authorized snapshot/context contract and all authorized choices remain reachable. Page
  limits reuse MYSVC-004 and the cursor binds the eligibility-policy version; limits are not
  invented by M010. The port never calls
  `ClientServicesQueryService.list|getDetail`, M010 or any child-summary/status/timeline aggregator.
- `ServiceOrderClientProjectionPort.getList|getHeader` returns field-allowlisted results bound to the
  same authorization snapshot, per-resource authorization epoch and consistent read cut.
- `CaseClientProjectionPort.getStatus|getMilestones|getNextAction` owns operational state.
- `Task|Document|Billing|Scheduling|Messaging|DeliverableClientProjectionPort.getSummary` returns a
  closed `fresh|empty|stale|unavailable` envelope with source version, authorization snapshot
  reference and authorization epoch for every serialized resource.
- `ServiceStatusPolicy.synthesize(commercial, financial, activation, fulfillment, policyVersion) →
  ClientServicePresentationCode`.
- `CanonicalPortalRouteResolver.resolve(allowlistedRouteKey, opaqueResourceRef) → internal route`.

Trusted time, actor, grant/entitlement versions and policy versions are always server-derived. Exact
HTTP routes, payloads and pagination limits require PRD/Build approval. Private errors use stable
400/401/404/409/429 and generic 5xx recovery without revealing resource existence or providers.

## 12. Events and background jobs

M009 owns no business-state event and no independent workflow. It consumes durable events such as:

- `service_order.created|updated|approved|cancelled`;
- `case.opened|status_changed|next_action_changed|closed`;
- `task.created|completed`, `document_request.published|satisfied`,
  `document_review.accepted|correction_requested|rejected`,
  `document.client_visible_version_changed`, `payment.updated`,
  `appointment.client_projection_changed`, `message.created`, `deliverable.ready|revoked`;
- `grant.created|revoked`, `entitlement.changed` and `policy.updated`.

Release 1A recomputes request-scoped projections. A later materialized projection requires a
separate reviewed decision with classification, invalidation, rebuild, TTL and revocation behavior.
Any projection refresh, notification or reconciliation job is idempotent, retry-bounded and
manually recoverable; Inngest coordinates execution but Postgres remains durable truth.

## 13. Error states and recovery

- **Expired/revoked session:** clear personalized content and use M007's neutral sign-in/recovery.
- **Unauthorized/unknown service:** return non-enumerating 404; do not say whether it exists.
- **Context changed during query:** discard the response and reauthorize from a new request.
- **Grant/entitlement/policy or resource authorization epoch changed:** final fence fails; discard
  the entire response and return a safe retry/session outcome. This includes visibility,
  inheritance, classification, parent linkage, tombstone and accepted-definition changes.
- **Core order/case read unavailable:** no service detail is fabricated; show bounded temporary
  unavailability and human support.
- **Child projection unavailable:** label only that section unavailable; never show zero/complete.
- **Critical next-action source unavailable:** use `unconfirmed`, refresh and support.
- **Stale noncritical summary:** show `asOf`, disable freshness-sensitive action and route to owner.
- **Payment mismatch:** show reconciliation/manual-review state, not success or failure inferred by
  M009.
- **Definition/version missing:** treat as configuration incident; do not substitute current public
  catalog terms for an accepted historical contract.
- **Service merged/rekeyed:** resolve through a server-owned alias/tombstone, reauthorize the target
  and audit; do not expose redirect internals.
- **Locale key missing:** critical action/status copy fails closed to unavailable, not silent mixed
  language.
- **Rate limit/dependency timeout:** bounded retry with idempotent GET semantics and a human path.

## 14. Security and privacy requirements

- Threat-model BOLA/IDOR, cross-context list leakage, hidden counts, stale/revoked grants, parameter
  tampering, malicious search input, cache confusion and child-summary timing differences.
- Use opaque nonsequential public references; opacity supplements but never replaces authorization.
- Use one complete authorization snapshot and final account/session/membership/context/grant/
  entitlement/policy plus per-resource authorization-epoch fence per response.
- Enforce server/domain authorization plus RLS; client code and middleware visibility are not
  controls.
- Private HTML/RSC/data is `private, no-store`; no ISR, CDN/shared cache, service-worker cache,
  localStorage or sessionStorage contains service projections.
- No provider credentials, signed URLs, raw Stripe/Google/Storage objects or internal error payloads
  reach the browser.
- Browser prefetch cannot execute mutations or mint download/payment capabilities.
- CSRF protection applies to all future mutations; M009 query routes remain side-effect free.
- Search/filter input is schema-allowlisted, normalized, length-bounded and rate-limited; returned
  text is output-encoded.
- Page titles, URLs, notifications and browser history omit sensitive service/client details.
- Logs/traces/Sentry/PostHog use opaque correlation, operation, result, policy version and latency
  only. Portal DOM/session replay/autocapture is prohibited.
- Staff reads/exports and every sensitive owning-module action generate minimized M077 evidence.
- Independent architecture, accessibility and Cyber Neo review are required before Build/release.

## 15. UX and accessibility requirements

- `Mis servicios` is one of the nine canonical Client Portal destinations.
- The directory separates active/action-needed service relationships from completed/cancelled
  history without hiding records behind a technical taxonomy.
- Cards contain one explicit `Ver servicio` action; the whole card is not an ambiguous control.
- Detail first shows service identity, factual status, next step and progress, then bounded owning-
  module summaries through progressive disclosure.
- Desktop may use two-column cards; tablet adapts by content width; mobile uses one column and a
  filter drawer/sheet. Ordinary content reflows at 320 CSS pixels without two-dimensional scroll.
- At 200% zoom, sticky navigation never hides focus, messages or primary actions.
- Every state has text/icon/shape; color alone never conveys payment, completion or urgency.
- Named milestone progress uses semantic ordered-list markup and current/completed text. If a
  workflow is nonlinear or not approved, no progress bar appears.
- All controls have visible focus and at least 44×44 CSS pixel targets except legitimate inline
  links. Keyboard order follows visual order.
- Loading skeletons do not announce fake status; dynamic results use appropriate live regions.
- Empty, no-filter-results, partial, stale, unavailable, cancelled and refunded states each have a
  factual next action.
- Motion is subtle, optional and removed under `prefers-reduced-motion`.
- Exact approved SG Solutions logo is used in the portal shell, never redrawn or recolored.

## 16. Bilingual requirements

- Navigation, filters, status/action labels, milestones, tasks, document/payment/appointment/
  message summaries, errors, empty states, help and disclosures require English/Spanish key parity.
- Stable codes and event data remain locale-neutral; translated labels are never persisted as
  workflow truth.
- Service-definition versions reference approved bilingual display/copy versions.
- Critical copy cannot silently fall back to another language. It returns a safe unavailable state
  when semantic parity is missing.
- Personal/business names, public references, original filenames and user-authored text are not
  machine-translated.
- Dates, IANA time zones, numbers and money use locale-aware formatting without changing source
  values.
- Layouts tolerate Spanish/English text expansion without truncating action meaning.

## 17. Acceptance criteria

1. The directory contains only real, authorized `ServiceOrder` projections.
2. Interest, recommendations and public catalog items never appear as contracted services.
3. A guessed service/context reference cannot reveal existence, counts or details.
4. One complete authorization snapshot, every serialized resource authorization epoch and the final
   revocation fence govern every response; any mismatch leaks no body, count, cursor, timing or route
   metadata.
5. A service detail uses `ServiceOrder` plus the applicable `CaseFile`; no duplicate portal-owned
   entity is created.
6. Commercial, financial, human-activation and fulfillment subfacts preserve their canonical
   owners.
7. Client presentation status is deterministic, versioned and derived only from authoritative
   facts.
8. Payment confirmed never implies approved-to-start or in-progress.
9. Progress uses approved real milestones or named state and never an arbitrary percentage.
10. Internal notes, staff tasks, risk, provider errors and hidden milestones are absent from DTOs.
11. Every child summary is bounded, client-safe and links to the owning module.
12. A missing source never appears as zero, complete, paid, accepted or no-action.
13. SG Solutions services remain separate from partner/referral products.
14. Directory/detail/loading/empty/partial/stale/unavailable/cancelled/refunded states work at 320px,
    200% zoom, keyboard and screen reader.
15. English and Spanish semantics and key sets match.
16. Personalized output is absent from shared/browser/offline cache and sensitive telemetry.
17. Future Build tests include same-client allow, cross-client/context deny, revocation races,
    source failures, four-axis state combinations/owner-substitution attempts,
    definition-version integrity and concurrent
    visibility, inheritance, classification, reparenting, tombstone/deletion and root-reassignment
    changes.
18. No product code, route, schema, provider connection or live service record exists from this
    documentary phase.

## 18. Negative acceptance criteria

- No service card from a lead, abandoned form, chat topic, recommendation or public page view.
- No `CreditClient`, `TaxClient`, `FundingClient` or other vertical duplicate of shared primitives.
- No authorization from email, phone, `clientId`, participant row, payment or route knowledge.
- No browser-side joins across domain/provider APIs and no browser-provided status/amount/context.
- No direct database/Storage/provider access from client components.
- No raw internal status, provider state, staff note, risk, prompt, tool output or audit event.
- No arbitrary progress percentage, countdown, expected completion date or guaranteed outcome.
- No payment-return page or webhook arrival directly starts a sensitive service.
- No permanent/signed document URL, message body, attachment name or full payment method in M009.
- No entire-card click as the only way to open a service and no hover/color/motion-only meaning.
- No partner offer presented as an SG Solutions contracted service.
- No client cancellation/refund/renewal action until the owning policy and review workflow are
  explicitly approved.
- No claim that an unavailable source has no items.
- No implementation or activation implied by PRD/design/review completion.

## 19. Dependencies

- M007, proposed ADR 011 and ADR 004 for session, context, resource grants and revocation.
- M008/proposed ADR 012 for portal shell, deterministic next-action policy and shared freshness
  semantics.
- M010 for complete process status/timeline and public-event presentation.
- M011–M014 for documents, messages, appointments and payments.
- M018/M021/M022/M023 for client, service order, case, task and internal operational truth.
- M025/M026 for communications and notifications.
- M042/M046 for versioned service definition, scope and pricing snapshot.
- M043/M044 for Stripe/reconciled financial facts; M045 for entitlements.
- M067 for signature/deliverable evidence.
- M077 for audit; M080/M081 for IAM/RBAC.
- M086–M088, design tokens, i18n, observability minimization and approved portal navigation.
- Postgres/Drizzle and owning-domain client projection ports.

Missing dependencies do not become simulated features. Release 1A omits or marks unavailable every
unimplemented owning capability.

## 20. Risks

| Risk | Control |
|---|---|
| Cross-client/context service leakage | Explicit service/case grant, RLS, complete authorization snapshot, final fence and adversarial tests. |
| Duplicate state or payment interpreted as service start | Canonical commercial/financial/activation/fulfillment ownership and versioned public synthesis. |
| Catalog edits rewrite an accepted service | Immutable service-definition/workflow/pricing version snapshot. |
| Client status diverges from operation | Owning-domain projections, no portal write authority and deterministic mapping. |
| Missing child source looks complete | Closed result envelopes, explicit unavailable state and ADR 012 `unconfirmed` rule. |
| Internal details leak through summaries/counts | Field allowlists, post-authorization counts, negative serialization/timing tests. |
| M009 duplicates M010–M014 | Detail-shell ownership matrix and canonical-route handoffs. |
| Partner offer appears to be SG service | Separate region, provider/disclosure provenance and no Release 1A cross-sell. |
| Long histories overload UI/query | Bounded server pagination, progressive disclosure and approved limits. |
| Personalized cache/telemetry leak | Private/no-store, no browser persistence/autocapture and redaction tests. |
| Translation changes obligations | Stable codes, versioned bilingual copy and fail-closed critical parity. |
| Cancellation/renewal promises invent policy | Deferred controls and Product Owner decision markers. |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the client-facing M009 status vocabulary, the mapping from
  commercial/financial/activation/fulfillment combinations—including coexistence of
  order/payment/case cancellation, refund and dispute—and exact bilingual wording, coordinated with
  M008 and M010.]
- [NEEDS PRODUCT OWNER DECISION: approve which preliminary states—quote sent, payment pending or
  paid pending review—appear in `Mis servicios` before a `CaseFile` exists.]
- [NEEDS PRODUCT OWNER DECISION: approve the Release 1A service types that may appear and their
  versioned public milestone sets.]
- [NEEDS PRODUCT OWNER DECISION: approve default card ordering, filter set, search fields, page size
  and maximum service/timeline/summary previews after UX testing.]
- [NEEDS PRODUCT OWNER DECISION: approve which price, deposit, balance, invoice and refund details
  are visible in M009 versus only in M014.]
- [NEEDS PRODUCT OWNER DECISION: approve whether a responsible team or named staff member/contact is
  client-visible and under what availability/reassignment policy.]
- [NEEDS PRODUCT OWNER DECISION: approve cancellation/change-request eligibility, who reviews it,
  required reasons and client-facing outcomes.]
- [NEEDS PRODUCT OWNER DECISION: approve recurring-service, renewal, auto-renewal, reminder and
  cancellation policy before those controls enter Release 1B.]
- [NEEDS PRODUCT OWNER DECISION: approve deliverable/agreement visibility, revocation and retention
  wording before M011/M067 enable access.]
- [NEEDS PRODUCT OWNER DECISION: approve which client-safe timeline events and public reason codes
  appear in the M009 preview versus M010.]
- [NEEDS PRODUCT OWNER DECISION: approve spouse/household/business-member/authorized-representative
  participation and delegation/revocation policy.]
- [NEEDS PRODUCT OWNER DECISION: approve whether and how partner-referral status may appear, with
  disclosure, source freshness and no-guarantee language.]
- [NEEDS PRODUCT OWNER DECISION: approve support channels, service hours and any response-time
  wording; no promise is assumed.]
- [NEEDS PRODUCT OWNER DECISION: approve M009 analytics events, retention, viewers and the final
  minimized allowlist.]
- [NEEDS PRODUCT OWNER DECISION: approve per-section freshness/staleness budgets and bilingual
  partial/unconfirmed recovery copy.]

### Reference basis

- [Client Portal umbrella](client-portal.md) defines the nine-area portal and delegated-access
  baseline.
- [M008 Client Dashboard](m008-client-dashboard.md) and proposed ADR 012 define the shared complete
  authorization snapshot, deterministic next-action and fail-closed freshness semantics.
- [Client and Case Management](client-case-management.md) owns `ServiceOrder`, `CaseFile`, tasks and
  operational transitions.
- [Billing](billing.md) preserves Stripe/Postgres authority and payment-versus-human-approval
  separation.
- [Authorization inheritance ADR](../adr/004-authorization-inheritance.md) governs case/resource
  visibility and revocation.
- [Data Classification](../../DATA_CLASSIFICATION.md) governs portal data, telemetry and retention.
