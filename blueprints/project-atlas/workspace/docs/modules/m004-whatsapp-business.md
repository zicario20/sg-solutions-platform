# Module PRD — M004 WhatsApp Business

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Surface: External messaging channel; Public acquisition with future Client/Admin projections
- Domain: Communications / Public Acquisition
- Release: R7 target capability; architecture prepared during Phase 0
- Status: Draft for Product Owner approval — architecture only; no Build gate
- Last updated: 2026-08-09
- External readiness: `External activation deferred` in `EXTERNAL_ACTIVATION_REGISTER.md`

This PRD normalizes the complete Product Owner-supplied M004 source into the approved Project Atlas
architecture. It preserves the long-term WhatsApp capability while separating durable architecture,
future local construction and real Meta/authorized-provider activation. Approval of this document
does not authorize application code, a phone number, provider credentials, live messages or release.

## 1. Purpose

Provide SG Solutions with an official, bilingual WhatsApp Business channel for orientation,
follow-up, appointments, approved transactional notifications and human support. WhatsApp is a
channel into the same SG Solutions Platform, not a separate bot, CRM, client portal or professional-
service execution console.

The channel must reuse the M003 conversation/handoff kernel and later feed M025 unified
communications without duplicating people, leads, clients, cases, consent, messages or audit.

## 2. Business value

- Meet prospects and clients in a familiar mobile channel while preserving a professional brand.
- Continue conversations started on the website, forms, appointments or human outreach.
- Convert an explicitly consenting prospect to the canonical lead and appointment flows.
- Reduce missed appointments and missing next actions through approved reminders.
- Give the owner a single auditable queue instead of unmanaged personal-message histories.
- Preserve a secure portal path for documents, payments and case details that do not belong in
  WhatsApp.
- Establish a provider-neutral channel boundary so SG Solutions can activate Meta directly or an
  approved Business Solution Provider without rewriting business logic.

## 3. Scope

### Target capability

- Official WhatsApp Business Platform integration through a replaceable channel adapter.
- Provider webhook verification, durable event ingestion, normalization, deduplication, ordering and
  reconciliation.
- Inbound and outbound text messages, approved interactive actions and delivery/read/failure
  projections.
- Shared conversations, messages and human handoff with M003/M025.
- M018 canonical Person/contact-method association and identity resolution, M020 lead/capture
  duplicate handling and M017 CRM-relationship/opportunity candidate review.
- Spanish and English locale detection, explicit preference and approved copy.
- Public orientation grounded only in current M002 public content.
- Optional preliminary structured intake using the exact M003 allowlist, classified Confidential as
  a complete draft and disabled until its separate WhatsApp/provider activation decision; M006 owns
  form/evidence capture, M078 owns consent and M020 remains the only lead/deduplication authority.
- Appointment availability, booking, cancellation and rescheduling only through M013 receipts; M024 is internal calendar UI only.
- Domain-issued secure links to the portal, payment, document-upload, appointment or approved public
  resource destinations.
- Transactional templates for appointments, payment projections, document requests/receipts,
  generic case-update notices and callback requests.
- Purpose-specific contact consent, opt-in evidence, opt-out, contact policy and frequency controls.
- Human handoff, assignment and safe AI suspension while a person owns the conversation.
- Future inbox administration for channel readiness, templates, failures, consent, assignment and
  audit.
- Media-envelope recognition and a future quarantine/scan handoff to M011; no direct uncontrolled
  download or promotion.
- Minimized analytics, cost/quality projections, audit events and manual recovery paths.

### Current authorized slice

- PRD, architecture/UX design, proposed ADR, data and provider contracts, threat controls,
  acceptance criteria and external-activation checklist.
- No M004 product implementation or provider activation is authorized.

## 4. Explicit out of scope

- WhatsApp Web automation, QR-session libraries, browser emulation, scraping or any unofficial
  client protocol.
- A personal WhatsApp account or a staff member's phone as the system of record.
- A second CRM, contact directory, conversation engine, scheduler, payment ledger or document store.
- Professional tax, credit, legal, lending, mortgage, insurance or investment advice.
- Filing entities or taxes, submitting disputes/applications, signing, applying for products or
  executing another professional service.
- Treating payment as human authorization to start a service.
- Accepting passwords, IdentityIQ credentials, SSN/ITIN, full card data, bank credentials, tax
  returns, credit reports or government IDs in channel text or uncontrolled media.
- Direct case, payment, document or client disclosure based only on a phone number, name, email,
  case number or conversational claim.
- Refunds, price changes, discounts, payment-state mutations or manual financial confirmation.
- Marketing campaigns in the initial activation; campaigns require a separate Product Owner gate.
- Group chats, communities, Status publishing, catalogs/commerce, WhatsApp payments and voice calls.
- Voice/call behavior owned by M005/M096, secure portal messaging owned by M012, unified inbox owned
  by M025 and general notifications owned by M026.
- Live provider provisioning, template submission, credentials, webhook registration or phone-number
  migration during this documentary phase.

## 5. Actors

- New prospect initiating a conversation.
- Existing prospect/contact with a valid channel relationship.
- Client receiving an approved transactional notification or secure portal link.
- Product Owner/authorized human operator.
- Future authorized support or specialist staff.
- WhatsApp Business Platform or approved official provider.
- WhatsApp webhook ingress and outbound dispatcher.
- Shared conversation/handoff service.
- Contact/consent policy service.
- M002 public knowledge adapter.
- Future lead, scheduling, payment, document-link, portal, inbox and notification adapters.
- Audit, job, abuse-control and observability services.

## 6. User journeys

### New prospect asks about a service

1. The provider delivers an inbound event to the verified webhook.
2. The ingress persists one authenticated event receipt before acknowledging it.
3. The processor normalizes the sender endpoint, message and locale without treating the phone as a
   verified client identity.
4. The shared conversation service classifies the public intent and retrieves only current M002
   public knowledge.
5. A concise response identifies automation, preserves material disclosures and offers an
   evaluation, quote, Help Center source or person.
6. Lead creation occurs only after the prospect confirms canonical M006 capture, M078 consent and
   M020 accepts the lead candidate.

### Optional preliminary structured intake — gated

1. Before asking a field, the channel explains the purpose, provider exposure, optional nature,
   retention boundary and secure-portal alternative and records affirmative purpose-specific
   consent.
2. The flow uses reviewed provider-supported structured choices where possible and one M003 schema
   version; arbitrary conversational collection is prohibited.
3. The allowlist is limited to:
   - Credit: goal, state, optional approximate score band, report access, expected purchase and
     general issue category.
   - Taxes: tax year, W-2/1099 availability, state, self-employment, dependents and document
     readiness.
   - Business Formation: formation state, desired name, activity, member count, address/registered-
     agent readiness and goal; no filing or exact sensitive address intake.
   - Business Funding: business type, age band, approximate revenue band, goal, requested-amount
     band and use of funds.
   - Home Buying: state, county, approximate income band, household size, approximate credit band,
     first-home indicator, goal and expected purchase period.
4. Every answer is `Confidential`; the complete draft is structured outside AI/model, RAG,
   moderation, translation, analytics, logs and persistent evaluation datasets. The activated
   WhatsApp provider necessarily transports the selection, so provider terms/DPA, minimization and
   Product Owner approval are prerequisites.
   The canonical interactive payload is written to `PreliminaryIntakeDraft`; the ordinary message
   transcript stores only a bounded `structured_intake_response` marker and opaque draft-event
   reference, never a duplicate answer value. Free-text answers are not promoted as intake.
5. The first-party draft has an explicit TTL/abandonment deletion job and never asks for SSN/ITIN,
   exact account/card/bank/tax values, credentials, documents or free-form Highly Sensitive data.
6. Durable promotion requires the prospect to review/confirm the structured summary, M006 to return
   an evidence-bound submission receipt, M078 to record consent and M020 to return an idempotent lead
   receipt. Without those receipts the conversation store does
   not become a second lead/intake database.
7. Until this gate is approved, M004 offers only the secure portal/form route for preliminary intake.

### Prospect schedules an evaluation

1. The person asks to schedule and confirms locale and IANA time zone.
2. M004 requests public availability from M013; it never invents or holds a slot itself.
3. The canonical scheduler completes the booking transaction.
4. M004 sends confirmation only from a durable appointment receipt.
5. Reminder delivery later re-checks channel policy and consent before dispatch.

### Transactional notification

1. An owning domain emits an approved notification command with subject, purpose, template key and
   opaque resource reference.
2. The contact-policy service verifies the active channel binding, purpose, opt-out and current
   provider-policy/template eligibility.
3. The template renderer resolves a reviewed locale/version and server-owned variable allowlist.
4. The durable outbox dispatches once logically even after retry.
5. Provider delivery/read/failure events update a projection monotonically without changing the
   owning business state.

### Client asks about payment, documents or case status

1. The system treats the message as an unverified channel request unless a separately approved
   high-assurance binding and projection exists.
2. It does not confirm whether a referenced case, invoice or document exists.
3. It offers an approved, short-lived link to the authenticated portal or a human route.
4. A future portal-safe reply may expose only an explicitly approved coarse projection after the
   relevant IAM/resource-grant gate; this is not part of initial activation.

### Secure payment-link handoff

1. An authorized quote/service-order flow asks M043–M045 for a payment link.
2. M004 receives only a durable receipt with an allowlisted redirect reference and expiry.
3. It renders an approved template without amount mutation or card collection.
4. It never confirms payment from a return page or user claim; only the reconciled payment
   projection may produce a later status notification.

### Inbound media

1. The webhook records only bounded media metadata and provider reference.
2. Before M011 media intake is active, the system does not fetch the object and replies with the
   secure portal/upload route.
3. A future approved flow fetches through a server-only adapter into quarantine, applies the
   `FILE_UPLOAD_SECURITY.md` lifecycle and promotes only a clean, authorized document.
4. Media cannot become a client/case document through phone matching or model inference.

### Human handoff

1. The user requests a person or triggers a complaint, payment discrepancy, fraud/legal/risk or
   repeated-no-answer rule.
2. A minimized summary is generated from allowlisted fields and a durable handoff receipt is
   created.
3. The user sees honest queue/availability information only after the owning inbox confirms it.
4. Automated replies stop while the conversation is human-owned.
5. A staff member may return it to automation only through an explicit audited transition.

### Opt-out and re-consent

1. A user sends a supported opt-out phrase in either language or uses an approved preference route.
2. Promotional sends stop immediately and the consent service records withdrawal evidence.
3. The system sends at most the approved confirmation and preserves only legally/operationally
   permitted service communications.
4. Re-enrollment requires new affirmative evidence; staff or AI cannot silently reverse opt-out.

## 7. States and transitions

### Channel connection readiness

`disabled → configured → sandbox_verified → production_verified → active → suspended|retired`

- Readiness is configuration/activation state, not proof of module completion.
- Only an approved activation record may advance beyond `configured`.
- `suspended` fails closed for new outbound work and preserves manual fallback/reconciliation.

### Shared conversation and ownership

Reuse M003/M025 states:

`new → ai_active → human_requested → waiting_for_human → human_active → returned_to_ai → closed`

Control states are `expired` and `restricted`. A provider message cannot bypass or directly mutate
these states. AI is silent while `human_active`.

### Inbound provider event

`received → signature_verified → bounded_normalization → persisted → applied|ignored_duplicate|manual_review`

Terminal failure states are `rejected_invalid`, `quarantined` and `dead_letter`. A transport
acknowledgement is not returned until the authenticated event receipt and a replayable canonical
event—or a protected authenticated-unknown envelope—are durable. It means only that transport data
can be resumed, never that the business action succeeded.

### Outbound message command

`draft → policy_checked → queued → dispatching → provider_accepted|dispatch_unknown → sent|failed|expired|cancelled`

Provider projections may later add `delivered` and `read`. Status application uses a documented
monotonic precedence and provider timestamps/event IDs; delayed callbacks cannot regress a final
state or create a second message. `dispatch_unknown` means network I/O may have reached the provider
but no authoritative receipt was returned. It transitions only through
`reconciliation_required → reconciled_accepted|confirmed_not_sent|manual_review`; it is never an
automatic blind retry.

### Consent/contactability

Each purpose/channel record uses:

`not_requested → granted → withdrawn|expired|superseded`

Inbound initiation may permit a bounded conversational response under current provider policy, but
it does not automatically grant marketing consent. Contactability is derived at send time, not a
permanent boolean.

The channel binding also has an outbound-control fence:

`normal → opt_out_pending → withdrawn|normal_after_review`

A deterministic configured opt-out match writes `opt_out_pending` in the same transaction that
persists the canonical inbound event, before provider acknowledgement. Dispatch for that binding is
serialized behind this fence. Applying withdrawal increments the contact-policy version and
atomically cancels queued promotional commands; clearing a false/ambiguous match requires an
authorized audited review and never grants marketing consent.

### Template lifecycle

`draft → internally_approved → submitted → provider_approved|provider_rejected → paused|disabled|superseded`

The provider is external truth for its approval/delivery eligibility. Postgres stores the reviewed
definition, internal approval and reconciled provider projection. A provider-approved template can
still be blocked by SG Solutions policy or consent.

### Contact-channel binding

`unlinked → candidate_match → linked_prospect|linked_client → verification_due → reverified|suspended`

Any linked state may move to `reassignment_suspected → suspended|reverified` or `revoked`.

The binding associates a channel endpoint with a person/contact after an approved process. It is not
a resource grant or authenticated portal session. Linking/merging requires audit and cannot expose a
match to the external sender. Inbound control of a number may establish current endpoint possession
for public conversation, but it does not re-prove the linked client's identity. Client-associated or
transactional use requires an approved verification method and freshness policy; stale, failed,
wrong-person or reassignment signals suspend protected outbound use until revalidation.

## 8. Business rules

- Only the official WhatsApp Business Platform or an authorized compatible provider may be used.
- Provider-specific formats stop at the adapter; the domain consumes canonical commands/events.
- Postgres owns conversations, consent, outbox/inbox receipts and internal operational state. The
  provider owns external account/template and delivery state; projections are reconciled.
- Every inbound provider event and outbound command is idempotent and safe under duplicate,
  delayed and out-of-order delivery.
- The backend, never an LLM, decides whether an outbound message is allowed inside the current
  conversational window or requires an eligible approved template.
- Provider-policy parameters are versioned/configured and revalidated at activation; they are not
  copied as an unchangeable constant from documentation.
- A user-started conversation is not marketing consent. Transactional, service and marketing
  purposes remain separate.
- The system checks consent/contact policy immediately before every outbound attempt and retry.
- Outbound dispatch acquires the channel-binding policy fence immediately before network I/O and
  verifies the current policy version captured by the command. A pending/withdrawn or stale version
  cancels/blocks the applicable send; a worker cannot race around a persisted opt-out.
- Deterministic opt-out control events have priority over ordinary messages and outbound work for the
  same binding. Withdrawal atomically cancels queued promotional commands and blocks their retries;
  service/transactional exceptions still require an explicit current policy decision.
- A phone number match may link a contact candidate but never authenticates a client, grants case
  access or proves ownership of a resource.
- A historical opt-in or successful delivery is not permanent proof that the same person still owns
  the endpoint. Every client-associated/transactional send performs a freshness/trust decision using
  approved verification evidence, expiry and reassignment/failure signals.
- A stale or `verification_due|reassignment_suspected|suspended` binding cannot receive appointment,
  payment, document, case, service-relationship or secure deep-link content. The system uses a
  separately verified portal/channel task to revalidate; it does not send a revealing revalidation
  message to the questionable number.
- Sensitive or individualized status is sent through the authenticated portal. Initial WhatsApp
  activation may send only generic notices such as “an update is available.”
- An inbound unverified sender receives only the generic portal entry route. A resource-specific
  deep link may be initiated only by an owning domain for an authorized channel binding; it remains
  short-lived and still requires portal authentication/current resource authorization at use time.
- Leads, appointments, payments, document receipts and handoffs exist only after the owning service
  returns a durable receipt.
- Stripe remains financial authority. M004 cannot create arbitrary amounts, infer payment, issue
  refunds or authorize service work.
- Links are server-resolved from allowlisted destination keys, HTTPS, scoped, expiring where
  sensitive and never accepted from model/user/provider text as trusted destinations.
- The public assistant uses only current M002 public content and preserves source/disclosure
  material. It does not browse freely or use private knowledge.
- Preliminary intake is disabled by default. When separately approved, it uses only the M003 field
  allowlist as structured `Confidential` data, remains outside every AI/moderation/translation/
  analytics path, avoids duplicate values in the ordinary transcript and promotes only through M006
  evidence capture, M078 consent and an M020 durable lead receipt.
- Template variables use typed allowlists; no free-form substitution may introduce Highly
  Sensitive content or unapproved URLs.
- Opt-out is processed before other automation and cannot be overridden by AI.
- Campaign marketing is disabled until a separately recorded Product Owner decision approves
  purpose, audience, copy, frequency, schedule and applicable legal/provider review.
- Delivery/read receipts are channel telemetry, not evidence that a person understood, consented or
  completed a business action.
- Test doubles may validate contracts only. No mock adapter can be enabled in production or display
  simulated provider success as real.

### Initial canonical intent taxonomy

Reuse M003 locale-neutral intents and add channel-control intents:

`general_information`, `credit_service`, `credit_monitoring`, `tradelines`, `tax_service`,
`business_formation`, `ein_service`, `business_funding`, `home_buying`, `marketplace_product`,
`appointment`, `payment_question`, `document_question`, `case_status`, `technical_support`,
`complaint`, `human_request`, `contact_preference`, `opt_out`, `other`.

Intent is routing metadata, never authorization, eligibility or consent.

## 9. Authorization rules

- Provider webhook access is unauthenticated user traffic but must pass provider-specific challenge,
  signature and replay/deduplication controls before persistence or processing.
- A channel endpoint/phone association is not Supabase identity and does not satisfy client
  authentication, MFA, internal role or resource access.
- Public/prospect interactions may access only public knowledge and bounded public actions.
- Client/case/payment/document queries require a separately approved authenticated projection plus
  current delegated grant. Initial M004 sends a portal link instead.
- Internal operators require Supabase identity, internal role, communications permission and
  inbox/assignment scope. Broad searches, exports and template/policy administration need elevated
  permission.
- Internal notes, risk flags, audit evidence, prompts, provider secrets and staff-only messages are
  never inherited into client/channel visibility.
- Human messages use an authorized server command and cannot call a provider directly from the
  browser.
- Automated tools use an explicit registry, schema-validated inputs, server-side authorization and
  least privilege. The model has no generic database, browser, network or provider tool.
- Domain services enforce authorization before I/O; Postgres RLS and relevant Storage policies
  provide defense in depth.
- Consent grant/withdrawal, contact linking, conversation assignment, template approval, channel
  activation and sensitive link creation are audited.

## 10. Data requirements

M004 reuses `Person`, `Consent`, `Message`, `Appointment`, `AuditEvent` and the shared conversation/
handoff records. It adds channel projections; it does not create `WhatsAppClient`, `WhatsAppLead` or
a parallel transcript model.

### ChannelConnection

Opaque ID, channel kind, provider adapter key, external business-account/phone identifiers as
Confidential references, display metadata, locale/country capabilities, readiness, credential
reference (never value), policy/config version, verified/suspended timestamps and correlation data.

### ContactChannelBinding

Opaque ID, person/contact reference when linked, channel, normalized endpoint represented under
approved protection, provider participant reference, locale, linkage state/method/evidence,
consent references, last inbound/outbound timestamps, blocked flag and version. Public responses
never reveal whether a candidate match exists. The binding also stores `contactPolicyVersion` and
an outbound-control state (`normal|opt_out_pending|withdrawn`) used as the dispatch fence; verification
method/evidence reference, `endpointVerifiedAt`, `verificationExpiresAt`, last successful inbound,
delivery/failure/wrong-person signals, reassignment-risk reason and revalidation/suspension times.

### ProviderEventReceipt and replayable event inbox

Opaque ID, connection, provider event ID/hash, event type, signature-verification result, received/
persisted/processed timestamps, canonical outcome/reason, retry/dead-letter state and correlation ID.
The same pre-acknowledgement transaction persists each supported event as a schema-versioned,
replayable canonical envelope containing only the validated fields required for later processing.

An authenticated event that cannot be safely normalized may enter a separately isolated raw-
envelope quarantine only when that path is enabled. It is classified **Highly Sensitive by default**,
encrypted under the approved application protection boundary, byte-bounded, checksummed, access-
restricted, excluded from telemetry and subject to an explicit short TTL, deletion and legal-hold
policy. It cannot be processed automatically until an adapter/schema review approves it. Invalid-
signature bodies are never retained; only bounded metadata such as size, body hash, time and reason
may be recorded. No transport acknowledgement is returned for a valid supported event unless its
canonical envelope is durable and replayable.

### ChannelMessageProjection

Shared Message ID, conversation, direction, channel, sender/recipient endpoint references, canonical
message type, reviewed text body where permitted, provider message reference, template/version,
delivery state/timestamps, reply/context reference, policy decision, error code, idempotency key and
classification. Provider payloads and URLs are not the view model. An approved structured-intake
answer is represented here only by message type, field key and opaque draft-event reference; its
value exists once in `PreliminaryIntakeDraft` and is not copied into the general transcript.

### MessageTemplateDefinition

Stable key, purpose/category, locale, internal version, approved copy/components, typed variables,
destination allowlist, internal approval actor/time, provider template reference/status/version,
effective/superseded timestamps and required disclosure/consent policy.

### OutboundMessageCommand

Opaque command ID, subject/channel binding, purpose, template or bounded session-message reference,
locale, server-resolved variables, owning-domain receipt/resource reference, policy snapshot,
scheduled/expiry time, idempotency key, attempts, current state and manual-recovery reference.

### OutboundDispatchAttempt

Opaque attempt ID, outbound command, adapter/connection, stable client reference when supported,
provider-idempotency capability snapshot, expected consent/policy version, started/completed
timestamps, request digest, bounded response/result code, provider message reference when known and
outcome (`accepted|confirmed_not_sent|dispatch_unknown|reconciled|manual_review`). The attempt is
durable before external I/O. No request body, phone number, message body, token or secure URL enters
the audit/telemetry projection.

### MediaEnvelope

Provider media reference, claimed/validated type when fetched, declared/actual bytes, checksum,
quarantine/scan state, conversation reference, authorized target reference, expiry and rejection
reason. No public URL, original filename in storage key or automatic case association.

### PreliminaryIntakeDraft — optional gated projection

Conversation ID, contact/channel binding when authorized, service key, M003 schema version, locale,
allowlisted answer keys/enum values, consent evidence, completion state, created/updated/expiry time
and optional M006 submission/M020 promotion receipt references linked to M078 consent evidence. The
whole draft is `Confidential`, not a collection of
independently Public values. It is first-party, purpose-limited, excluded from model/moderation/
translation/RAG/telemetry/evaluation and deleted on abandonment/expiry unless a confirmed promotion
receipt transfers ownership to the lead domain.

### Data classification

| Data | Class | Boundary |
|---|---|---|
| Approved public FAQ/service copy and public link keys | Public | M002/public projection only |
| Channel/template technical configuration without identifiers | Internal | Approved config/Postgres |
| Phone/contact endpoint, consent evidence, conversation metadata, message body, appointment notice, handoff summary | Confidential | First-party Postgres/private provider under approved purpose; excluded from general telemetry |
| Preliminary intake answer or complete draft | Confidential | Gated reviewed structured choices; first-party TTL store plus unavoidable activated WhatsApp transport; never AI/RAG/moderation/translation/analytics/evaluation |
| Provider credentials/tokens and any accidentally submitted SSN, tax, credit, bank, identity or document content | Highly Sensitive | Secrets store or reject/quarantine; never normal message persistence, analytics, logs, prompts or Sanity |

Full card data, CVV, passwords, access tokens, SSN/ITIN, bank credentials, tax documents, credit
reports and government IDs are prohibited from ordinary message persistence. Exact message,
provider-raw-payload, media and consent retention require Product Owner/legal decisions before live
activation.

## 11. API or service contracts

### Provider-neutral ports

- `MessagingChannelProvider.verifyChallenge(request) → ChallengeDecision`.
- `MessagingChannelProvider.verifyWebhook(rawBody, headers) → VerifiedProviderEnvelope`.
- `MessagingChannelProvider.normalizeEvent(envelope) → CanonicalChannelEvents[]`.
- `MessagingChannelProvider.send(command, idempotencyKey) → ProviderSendReceipt`.
- `MessagingChannelProvider.capabilities() → { clientReference, providerIdempotency,
  messageLookup, statusReconciliation, media }`; an adapter cannot imply deduplication it does not
  provide.
- `MessagingChannelProvider.reconcileDispatch(stableClientRef|providerRef) → DispatchResolution`.
- `MessagingChannelProvider.fetchMedia(mediaRef) → bounded stream + metadata` only after policy and
  M011 authorization.
- `MessagingChannelProvider.getReadiness() → ProviderReadiness`.
- `MessagingChannelProvider.reconcileTemplates(cursor)` and `reconcileMessages(range)`.

The domain never accepts provider payload objects. A direct Meta adapter and an approved BSP adapter
may implement the same contract. A test fake exists only inside contract tests.

### Domain/application ports

- `InboundChannelEventService.receive(verifiedEnvelope) → DurableEventReceipt` persists the receipt
  plus replayable canonical envelope atomically before acknowledgement.
- `InboundChannelEventService.apply(receiptId, idempotencyKey) → ApplyOutcome`.
- `ConversationService.acceptChannelMessage(context, message, expectedVersion)`.
- `OutboundMessageService.request(command, idempotencyKey) → OutboundReceipt`.
- `OutboundMessageService.dispatch(commandId)` persists an attempt before network I/O and moves an
  ambiguous timeout to `dispatch_unknown`, never directly back to `queued`.
- `OutboundMessageService.resolveUnknown(attemptId) → reconciled result|manual review`.
- `ContactPolicyService.canContact(subject, purpose, channel, at, policyContext) → Decision`.
- `ConsentService.recordGrant|withdraw(verifiedSubject, purpose, channel, evidence)`.
- `ContactPolicyFence.flagPendingOptOut|applyWithdrawal|resolveAmbiguous` serializes on the channel
  binding, increments policy version and atomically cancels affected queued commands.
- `ContactChannelService.resolveCandidate|link|suspend` without external match disclosure.
- `ChannelEndpointTrustService.evaluate(binding, purpose, at) → current|verification_due|
  reassignment_suspected|suspended` using approved freshness and evidence policy.
- `ContactChannelService.revalidate(binding, verifiedSubject, evidence)|markWrongPerson|
  markReassignmentRisk|revoke`; ordinary inbound traffic cannot silently revalidate client identity.
- `TemplateService.create|approveInternal|supersede|syncProjection`.
- `HumanHandoffPort.enqueue(conversationProjection, reason, idempotencyKey)`.
- `LeadIntakePort.createFromChannel(structuredCapture, schemaVersion, consentEvidence,
  idempotencyKey) → PromotionReceipt`; accepts only the M003 allowlist and transfers ownership only
  after user-confirmed structured summary.
- `PublicSchedulingPort.listAvailability|book|cancel|reschedule` through canonical receipts.
- `PaymentActionPort.createSecurePaymentLink(authzContext, payableRef, idempotencyKey)`.
- `PortalLinkPort.createAuthorizedLink(actorContext, destinationKey, resourceGrant, expiry)`.
- `DocumentIntakePort.requestQuarantineUpload|acceptProviderMedia` only after M011 activation.
- `AuditPort.record(minimizedEvent)`.

### Webhook/runtime boundary

Provider-specific server-to-server routes live in `apps/app` under a narrowly scoped integration
ingress. They bypass interactive Supabase login middleware only to apply provider challenge/
signature controls. They read a bounded untouched raw request body, verify and normalize supported
events, atomically persist the receipt plus replayable canonical envelope, return a bounded
acknowledgement and defer business side effects to durable jobs. Authenticated unknown envelopes use
the protected quarantine above; persistence of metadata alone is never treated as recoverable
receipt of a supported event.

Each adapter exposes an ingress manifest with exact allowed methods, media types/content encodings,
maximum raw bytes, read/total deadlines, concurrent-request budget and rate policy. The gateway
enforces the smaller of its platform hard ceiling and the activated adapter limit **while streaming
and before buffering/parsing/signature work**. Unsupported method, media type/encoding, oversized,
timed-out and over-budget requests fail with bounded `405`, `415`, `413`, timeout or `429` behavior
compatible with the provider's current retry contract. IP allowlisting may be defense in depth but
never replaces signature verification. These values must be verified against current official
provider documentation during activation; no handler has an unbounded default.

Domain/application contracts live in shared workspace packages; handlers and provider adapters are
infrastructure. No separate microservice is justified for the initial architecture.

### Public response/error contract

The provider receives only required acknowledgement/challenge fields. User-visible messages contain
approved text, bounded interactive actions and trusted link references. Errors expose no provider
detail, account ID, signature reason, secret, stack trace, internal resource existence or matching
result.

## 12. Events and background jobs

### Domain events

`channel_event_received`, `channel_event_rejected`, `channel_message_accepted`,
`channel_message_rejected`, `channel_message_queued`, `channel_message_provider_accepted`,
`channel_message_sent`, `channel_message_delivered`, `channel_message_read`,
`channel_message_failed`, `channel_conversation_started`, `channel_intent_selected`,
`channel_handoff_requested`, `channel_handoff_queued`, `channel_opt_in_recorded`,
`channel_opt_out_recorded`, `channel_template_projection_changed`, `channel_binding_linked`,
`channel_media_rejected` and `channel_reconciliation_required`.

Events use opaque identifiers, channel, locale, purpose, status/reason, timing bucket, policy/
template version and correlation ID. They exclude phone numbers, message/media content, contact
details, prompts, raw provider payloads, case/payment/document content and secrets.

### Background jobs

- Apply persisted inbound receipts and reconcile stuck events.
- Prioritize deterministic opt-out control events per channel binding; no ordinary/outbound work for
  that binding crosses a persisted `opt_out_pending` fence.
- Dispatch policy-approved outbox commands with bounded retry and the same idempotency key.
- Reconcile `dispatch_unknown` attempts using declared adapter capabilities; if acceptance cannot be
  proved or disproved, expire/cancel safely or require manual review rather than resend blindly.
- Process delayed/out-of-order delivery events without state regression.
- Reconcile provider template/message projections and identify gaps.
- Expire commands, conversation windows, session drafts and media envelopes under approved policy.
- Expire/erase abandoned preliminary-intake drafts under the approved short TTL; an M006 submission
  receipt transfers only the confirmed allowlisted projection, M078 records consent and M020 alone
  performs lead promotion.
- Retry approved media fetch/scan only while quarantine authorization remains valid.
- Deliver handoff/operator notifications after M025/M026 activation.
- Monitor credential/channel health using minimized status only.
- Evaluate binding freshness and provider/wrong-person/reassignment signals; suspend expired or risky
  bindings and create a revalidation task on a separately verified surface.
- Route exhausted work to a durable manual-recovery queue.

Inngest may coordinate later, but Postgres owns every durable job/outbox/inbox state. Each job has an
idempotency key, maximum attempts, timeout, next retry, terminal reason and manual recovery action.

## 13. Error states and recovery

| Failure | External/user behavior | Durable recovery |
|---|---|---|
| Invalid challenge/signature | Generic rejection; no processing | Bounded security event; no raw body in logs |
| Unsupported method/type/encoding or oversized body | Bounded rejection before parse/signature work | `405/415/413`-class reason metadata only; no body retention |
| Webhook read/concurrency/rate budget exhausted | Bounded timeout/`429` behavior | Preserve valid-provider retry compatibility, circuit protection and alerting |
| Duplicate event/message | At most one visible/business outcome | Return prior receipt or ignore duplicate by provider ID/hash |
| Delayed/out-of-order status | No regressed user state | Apply monotonic transition; reconciliation verifies provider projection |
| Unknown event/schema version | Safe acknowledgement only when provider retry would not help | Quarantine/manual review; adapter update without domain mutation |
| Provider unavailable/quota before any request bytes are sent | Honest unavailable/fallback route | Circuit breaker and bounded retry from a durable attempt |
| Provider may have accepted but response was lost | Do not claim success or resend | `dispatch_unknown`; reconcile by stable reference/status or require manual review |
| Expired/revoked credential | No outbound send or false success | Suspend connection, alert owner, rotate through activation runbook |
| Template rejected/paused | No unapproved send | Block command, select no fallback template automatically, manual review |
| Consent/opt-out conflict | Do not send | Mark policy denial and audit reason; never retry unchanged |
| Opt-out races queued/in-flight dispatch | Do not send if network I/O has not begun; never retry affected command | Per-binding lock/fence, policy-version check and atomic queued-command cancellation; ambiguous already-started attempt reconciles |
| Contact match ambiguity | Generic response without disclosure | Candidate/manual linking queue; no automatic client merge |
| Binding stale, wrong person or reassignment suspected | Send no relationship-revealing transactional content | Suspend protected outbound use; revalidate through separately verified portal/channel and audit outcome |
| CRM unavailable | Do not claim lead/client update | Preserve accepted channel/conversation receipt; retry handoff |
| Scheduler unavailable/conflict | Do not claim booking | Offer approved fallback; canonical scheduler returns fresh options |
| Payment projection unavailable | Do not confirm or create arbitrary link | Secure portal/human fallback; payment domain reconciles |
| Inbox unavailable | Do not claim a person was notified | Preserve handoff request; verified alternate contact route |
| AI/knowledge unavailable | No fabricated answer | M002 deterministic navigation or human/contact fallback |
| Media unsupported/unsafe | Do not fetch/promote; explain secure route | Stable rejection/quarantine reason and M011/manual action |
| Audit persistence unavailable | Sensitive mutation cannot report success | Fail closed or durable outbox under audit policy |

Manual recovery must use authorized commands and audit. It never requires editing Postgres/Supabase
tables from a dashboard or marking provider/payment/document state manually as verified.

## 14. Security and privacy requirements

- Treat every webhook, message, media object, provider response and model output as untrusted.
- Enforce adapter-declared method, media type/encoding, raw-byte ceiling, bounded streaming read,
  read/total timeout, concurrency and rate budget before buffering/parsing. There is no unbounded
  webhook body or worker admission path.
- Verify provider challenge and notification authenticity using the adapter's current official
  mechanism before processing; verify over untouched raw bytes where required.
- Persist and deduplicate provider event IDs plus a replayable canonical envelope before
  acknowledgement/side effects; use replay controls appropriate to the provider protocol and
  reconcile missed callbacks.
- Treat the transient verified-event inbox as Confidential or Highly Sensitive according to its
  highest field. Protect any enabled raw-envelope quarantine with encryption, strict access, byte
  limits, checksum, short TTL, deletion/legal hold and no telemetry; never retain invalid-signature
  bodies.
- Validate schemas, event types, identifiers, Unicode, lengths, interactive payloads and media
  metadata server-side with reject-unknown behavior.
- Keep app secrets, access tokens, phone/account identifiers and signing material in approved secret
  stores; never repository, browser, logs or documentation.
- Enforce least-privilege tokens, rotation, revocation and connection suspension runbooks.
- Reject or redirect attempts to provide Highly Sensitive data before ordinary persistence or model
  use. Do not echo rejected content.
- Keep an enabled preliminary-intake draft structured and first-party, classify the complete draft
  Confidential, exclude it from AI/model/RAG/moderation/translation/telemetry/evaluation and enforce
  consent, field allowlist, TTL/deletion, M006 evidence capture, M078 consent and M020 lead receipt.
  Provider transport remains
  an explicit activation/privacy decision, not an assertion that the fields are non-sensitive.
  Map approved interactive values into the draft and retain only a bounded marker/reference in the
  ordinary transcript; free text cannot silently become structured intake.
- Never place phone numbers, message/media bodies, prompts, contact data, raw provider payloads,
  template variables or secure links in Sentry, OTel, PostHog, application logs or audit payloads.
- Use a transactional inbox/outbox, idempotency and optimistic concurrency for exactly-once logical
  effects over at-least-once delivery.
- Persist each outbound attempt before I/O and record the adapter's actual idempotency/reconciliation
  capability. A timeout after possible acceptance enters `dispatch_unknown`; it cannot be retried
  until reconciliation proves no send or an authorized operator chooses a documented safe action.
- Serialize inbound opt-out and outbound dispatch per channel binding. A deterministic opt-out sets
  `opt_out_pending` before acknowledgement; the dispatcher checks the latest policy version/fence
  under the same lock immediately before I/O, and withdrawal atomically cancels queued promotional
  commands and retries.
- Re-evaluate endpoint ownership freshness/trust at send time. Historical consent, phone match,
  inbound possession or delivery alone cannot authorize client-associated content; stale/wrong-
  person/reassignment signals fail closed and require separately authenticated revalidation.
- Render only reviewed text and provider-supported typed components; no arbitrary HTML, Markdown,
  commands or model/provider-created URLs.
- Resolve all links server-side through an exact-host/path allowlist and short-lived resource grant
  where authentication is required.
- Treat message text as data, not instruction or permission. Prompt injection cannot expand tools,
  disclose policy/prompts, mark payment, access another client or execute a service.
- Do not fetch media until policy authorizes it. Future media follows quarantine, content-based MIME,
  size, checksum, malware scan, private promotion, retention and audit in
  `FILE_UPLOAD_SECURITY.md`; HEIC remains excluded until explicitly approved.
- Staff access to Confidential messages/media, export, contact linking and provider administration is
  permission-scoped and audited.
- Real transcripts/messages cannot be copied into fixtures, developer/agent chats, tickets,
  persistent evaluation datasets or external model comparisons.
- Provider activation requires a provider-specific threat review, current policy/terms validation,
  Cyber Neo review, controlled sandbox/production evidence and Product Owner approval.

## 15. UX and accessibility requirements

M004 does not control WhatsApp's native visual design. SG Solutions' experience is expressed through
approved display identity, concise bilingual copy, consistent terminology, trustworthy links and
honest automation/handoff states.

- Identify SG Solutions and automated assistance at the start of an automated conversation.
- Never impersonate a human, use artificial typing claims or promise an unconfirmed queue position.
- Keep one clear purpose per message and at most a small number of relevant actions.
- Prefer provider-supported accessible text/buttons/lists; every action has descriptive text and a
  text fallback.
- Use short paragraphs, explicit dates, local time plus named time zone and unambiguous payment/
  appointment/document states.
- Do not rely on emoji, color or icon alone to communicate success, warning or required action.
- Preserve the user's language and allow an explicit change without mixing languages.
- Human handoff is always available through a clear text command/action.
- Error messages state what happened, what was not completed and the next safe action.
- Secure-link messages state the destination and expiry without exposing protected details.
- Opt-out instructions are discoverable and processed even when automation is otherwise disabled.
- The future Admin inbox follows the existing Manrope/Inter, navy/cobalt/cyan/green/gold, light-first,
  WCAG 2.2 AA and reduced-motion system. It distinguishes unread, waiting, assigned, human-owned,
  failed and restricted states using text plus visual cues.
- Inbox tables/queues support keyboard navigation, accessible labels, visible focus, readable
  timestamps/zones and 200% zoom without horizontal information loss.

## 16. Bilingual requirements

- Every greeting, limitation, consent notice, opt-in/out confirmation, template, quick action,
  validation, error, fallback, handoff and secure-link message requires reviewed Spanish/English
  parity.
- Locale keys remain stable and provider-neutral; provider template identifiers map to an approved
  internal locale/version.
- Automatic language detection may suggest an initial locale but cannot override an explicit choice.
- One outbound message uses one language unless quoting user-supplied text for a human operator.
- High-risk, financial, consent, privacy and legal copy is not published through raw machine
  translation.
- Dates, currency and time zones are localized without changing the underlying canonical value.
- If a provider template is approved in one language but not the other, the unavailable locale fails
  closed to an approved alternate channel; it never silently sends the wrong language.

## 17. Acceptance criteria

### Architecture acceptance

- M004 is one provider-neutral channel adapter over shared conversation, contact, consent, message,
  appointment, payment-link, handoff and audit primitives.
- The PRD distinguishes phone/channel association from identity, role and resource authorization.
- Webhook ingress, durable inbox/outbox, idempotency, ordering, provider readiness, templates,
  consent, media, fallbacks and reconciliation are implementation-ready.
- Runtime ownership is explicit and compatible with Next.js, Postgres, Drizzle and Inngest.
- The target capability preserves every safe function in the Product Owner source and normalizes the
  obsolete `.NET/Redis` diagram to the approved stack.
- External accounts, number, templates and policy decisions are registered separately.

### Future local Build acceptance

- Contract tests prove an official adapter can normalize inbound/outbound/status/template events
  without leaking provider types into the domain.
- Oversized, unsupported-type/encoding, slow-body, concurrency-exhaustion and rate-budget tests
  prove rejection occurs before unbounded buffering or expensive parsing and preserves legitimate
  provider retry behavior.
- Duplicated and out-of-order events create one logical message/outcome and never regress state.
- “Provider accepted, response lost” produces `dispatch_unknown`, no duplicate send and a
  reconciliation/manual-review outcome under both idempotent and non-idempotent adapter contracts.
- A process crash after provider acknowledgement can replay every supported accepted event from the
  durable canonical envelope without the original HTTP request or hidden raw payload assumption.
- Opt-out blocks subsequent promotional sends and retry paths; re-consent requires new evidence.
- A simultaneous supported `STOP`/opt-out event and queued dispatch cannot send after the durable
  opt-out fence; race/property tests cover dispatch, retry and withdrawal ordering.
- A phone-number claim or candidate match never reveals client/case/payment/document existence.
- Expired verification, wrong-person reports, provider invalid/reassignment signals and a recycled-
  number fixture suspend protected sends; old consent/binding cannot disclose the SG relationship.
- Public answers use only current M002 content and the approved M003 policy/handoff kernel.
- Leads, bookings, payment links and handoffs display success only from durable owning-service
  receipts.
- Provider-disabled mode exposes honest manual alternatives and no simulated provider success.
- Media remains unfetched until M011 is active; later media passes quarantine/scan/promotion and
  authorization tests.
- Spanish/English, accessibility, permission, prompt-injection, PII/secret rejection, rate, retry,
  recovery and telemetry-minimization tests pass.
- When optional intake is disabled, no intake field is requested in WhatsApp. When separately
  enabled, positive/negative tests prove exact M003 field allowlist, structured UX, consent/provider
  notice, single-copy draft storage, marker-only transcript, no AI/telemetry/evaluation exposure,
  TTL deletion, M006 evidence capture, M078 consent and receipt-only M020 lead promotion.
- Test doubles are test-only and impossible to select in a production configuration.

### External activation acceptance

- An approved official provider route, institutional account, WABA/number and ownership/recovery are
  recorded without secrets.
- Current provider terms, conversation/template rules, categories, opt-in/out behavior and bilingual
  templates are reviewed and controlled-test verified.
- Credentials, challenge/signature, webhook, retry, reconciliation, monitoring, suspension,
  fallback, cost and incident runbooks pass independent security review.
- Production test messages prove inbound, outbound, duplicate, delayed status, opt-out, template,
  failure and manual recovery behavior without real client sensitive data.
- The Product Owner approves activation; only then may the connection advance toward Operational.

## 18. Negative acceptance criteria

- No WhatsApp Web, QR session, unofficial library, personal account or browser automation.
- No provider payload/type in domain contracts and no direct provider call from UI/model/business
  modules.
- No phone/email/case-number match grants identity, case access or client status.
- No historical opt-in, delivery receipt or old binding bypasses current endpoint-freshness/trust
  checks for client-associated or transactional content.
- No message, template or retry bypasses current contact policy, opt-out or provider eligibility.
- No fake delivery, lead, booking, payment, document, handoff or human-availability success.
- No payment-state mutation, refund, price change, discount or service-start authorization.
- No raw provider payload, phone, message/media body, prompt, secure link or Highly Sensitive data in
  telemetry, logs, audit, fixtures or evaluation datasets.
- No preliminary-intake value enters AI, RAG, moderation, translation, analytics, logs, fixtures or
  evaluation datasets, and no intake is enabled without its Product Owner/provider/privacy gate.
- No inbound media is downloaded or promoted before authorization, quarantine and scan.
- No model/user/provider-supplied arbitrary URL or command is executed.
- No AI response continues while a human owns the conversation.
- No marketing activation is inferred from user initiation, service consent or M004 architecture
  approval.
- No runtime mock or local contract test is described as a live external connection.
- No M004 code, provider account, number, template approval, merge, deployment or Operational state
  is inferred from approval of this PRD.

## 19. Dependencies

### Required for architecture

M002 public Help Center, M003 shared conversation/handoff design, M006 form/evidence capture, M078
consent, M020 lead/deduplication, M011 secure documents, M013 scheduling, M017 CRM, M025 unified
communications, M026 notifications, M041
provider abstraction, M043–M045 payments/entitlements, M060 compliance review, M075 human-in-the-
loop, M077 audit, M078 consent, M080/M081 IAM/RBAC, M082 PII, M084 integration security, M085
retention, M092 analytics and M097 observability.

### Required before future local Build

Approved M004 PRD/design and ADR 008, explicit `GENERATE`/Build gate, approved channel data model,
consent/contact policy contract, shared conversation boundary, threat model, test strategy and
executable implementation plan.

### Required only for external activation

Meta Business/approved provider account, WABA, institutional phone number, verified display identity,
credentials/secret store, current webhook/template configuration, approved templates and copy,
support destination, DPA/terms, budget, sandbox/production tests and Product Owner approval. These
are tracked in `EXTERNAL_ACTIVATION_REGISTER.md` and do not block architecture approval.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Unofficial automation causes suspension or data exposure | Official provider-only contract; no WhatsApp Web/QR path |
| Phone matching becomes authorization | Separate binding from Supabase identity/resource grants; portal-safe links |
| Duplicate/out-of-order webhooks corrupt state | Verified durable inbox, idempotency, monotonic transitions and reconciliation |
| Consent or provider-window violation | Purpose-specific consent and send-time versioned policy decision in backend |
| Sensitive information enters channel/provider | Upfront copy, pre-persistence rejection, portal redirect and no direct media fetch |
| Template drift between SG and provider | Internal version plus provider projection, typed variables and fail-closed locale/state |
| Fake success during outages | Durable receipts, readiness state and honest manual fallback |
| AI executes or overpromises | M003 policy, fixed tool registry, authorization and human handoff |
| Human/AI race | Shared ownership state, optimistic concurrency and idempotency |
| Provider lock-in | Canonical ports/events; provider types stop at adapter |
| Token/webhook compromise | Secret store, least privilege, signature, rotation, suspension and incident runbook |
| Excessive transcript/media retention | Purpose limitation, explicit retention decisions, quarantine expiry and deletion audit |
| Cross-channel duplicate contacts | Candidate matching with no public disclosure and audited human merge |
| Marketing spam/reputation harm | Campaigns disabled initially, opt-out first, frequency/quiet-hours decision and audit |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: choose direct Meta Cloud API or an approved Business Solution
  Provider for first activation after account, cost, support, portability and data-term review.]
- [NEEDS PRODUCT OWNER DECISION: approve the institutional WhatsApp number, display name, ownership,
  recovery and coexistence plan with M005/M096 voice/SMS before registration.]
- [NEEDS PRODUCT OWNER DECISION: approve WhatsApp contact, service and marketing consent/disclosure
  copy plus recognized opt-out/re-consent behavior after applicable legal review.]
- [NEEDS PRODUCT OWNER DECISION: approve exact retention/deletion/legal-hold periods for message
  bodies, provider receipts, contact bindings and media quarantine before live traffic.]
- [NEEDS PRODUCT OWNER DECISION: approve which bilingual templates and typed variables may be
  submitted first; example text in the original source is conceptual, not approved production copy.]
- [NEEDS PRODUCT OWNER DECISION: define staffed hours, inbox destination, escalation owners and any
  response-time language before promising human availability.]
- [NEEDS PRODUCT OWNER DECISION: decide whether initial activation rejects all inbound media or
  enables the M011 quarantine handoff for PDF/JPEG/PNG after its security gate.]
- [NEEDS PRODUCT OWNER DECISION: approve appointment/reminder timing, quiet hours, frequency caps and
  time-zone policy before automated outbound scheduling.]
- [NEEDS PRODUCT OWNER DECISION: approve whether any coarse authenticated client status may ever be
  returned directly in WhatsApp; initial architecture uses secure portal links only.]
- [NEEDS PRODUCT OWNER DECISION: separately authorize any promotional campaign phase, audience,
  cadence, copy and disclosures; marketing remains disabled by default.]
- [NEEDS PRODUCT OWNER DECISION: approve or reject preliminary structured intake over WhatsApp,
  including exact M003 fields, provider/DPA exposure, bilingual notice/consent, TTL/deletion and
  secure-portal alternative; intake remains disabled until this activation gate closes.]
- [NEEDS PRODUCT OWNER DECISION: approve endpoint-verification methods, freshness interval,
  revalidation cadence and wrong-person/reassigned-number response before any client-associated or
  transactional WhatsApp send; stale bindings fail closed until then.]

These questions block only affected Build or activation behavior. They do not require inventing
answers to approve the provider-neutral architecture.

## Delivery and activation record

- Architecture: candidate prepared for Product Owner review on 2026-08-09.
- Local implementation: not authorized and not started.
- External activation: deferred; see `EXTERNAL_ACTIVATION_REGISTER.md`.
- Operational status: not eligible.
