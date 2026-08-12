# Module PRD — M012 Mensajería segura

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture candidate; no Build gate
- Surface: Client Portal `/client/messages` and service-scoped views; M025-owned Admin
  communications surface
- Workstream: R1.5 Client Portal & Launch, with compatible R7 channel extensions
- Release target: Release 1A human secure-messaging core; compatible Release 1B operational maturity
- Source: complete Product Owner-supplied M012 corpus, normalized to the approved stack
- Related catalog modules: M012; consumes M002–M005/M007–M011/M013–M014/M017–M018/M021–M026/
  M047–M060/M065/M076–M085/M090–M092/M097
- Proposed ADR: ADR 016

This PRD defines SG Solutions' authenticated secure-messaging capability inside the modular
monolith. It does not authorize code, routes, schema/RLS policies, providers, AI/model access,
notifications, real messages, merge, deployment or `GENERATE`.

## 1. Purpose

Give authenticated clients and explicitly authorized SG Solutions staff one professional,
case-aware channel for questions and follow-up that are unsuitable for public chat or ordinary
email. Every conversation has an authorized purpose, participants, governing context, visibility,
sensitivity and durable history.

M012 is the canonical owner of secure-portal conversation policy, client/staff messages,
conversation-local private notes, participation, read evidence, handoff state and typed references.
It reuses the shared conversation kernel established by M003/M004, contributes authorized portal
items to the future M025 unified inbox and does not duplicate CRM, cases, tasks, documents,
scheduling, billing, notifications, audit or AI authorities.

Conversation-local notes are M012 records bound to one conversation. M018 owns only client-level
`ClientOperationalNote`; M022 owns case-level `CaseOperationalNote`; M017 owns `CrmInternalNote`.
No service can create, revise, redact or delete another note type; integration is limited to an
opaque typed link or authorized projection and never dual-writes/copies protected content or
inherits client visibility.

## 2. Business value

- Replace scattered sensitive email with an authenticated, case-linked communication path.
- Keep clients informed without exposing internal notes, operational jargon or unrelated records.
- Preserve one durable transcript and clear responsibility for follow-up.
- Let staff create typed tasks/document requests/appointment/payment handoffs without treating
  free text as an operational command.
- Support Spanish and English while preserving the author's original message.
- Prepare safe human/AI and portal/external-channel handoffs without activating them prematurely.
- Reduce BOLA/IDOR, stored-XSS, phishing-link, attachment, notification and telemetry leakage risk.
- Reuse one `Message`/conversation language across services rather than creating vertical-specific
  tax, credit, business-formation, funding or home-buying inboxes.

## 3. Scope

### Release 1A architecture

- Authenticated client conversation list and detail beneath `/client/messages`.
- Account-support conversations with deliberately narrow account context and service/case
  conversations beneath an explicit M009/M010 authorized root.
- Human client-to-staff and staff-to-client plain-text messages with bounded content, idempotent
  submission, server-assigned order and durable receipts.
- Separate lifecycle, response-responsibility, sensitivity, participant and message-state axes.
- Explicit participants and assignments; neither is an authorization grant.
- Distinct public-reply and internal-note command paths, DTOs, controls and visual treatments.
- Typed resource references to M011 documents, M013 appointments, M014 billing and M023 tasks;
  every destination reauthorizes and a reference grants nothing.
- M011-governed attachment intents, quarantine/status references and secure-document handoffs only
  after MSG-007 and applicable DOC gates are active. Until then M012 renders no attachment action
  and never requests an upload intent. M012 never stores authoritative attachment bytes.
- Client request for human support, staff assignment/escalation and manual recovery.
- Client-safe unread state and optional per-participant read evidence without claiming human
  comprehension or external-channel delivery.
- M026 notification-event handoff with content-free template data: only purpose-bound opaque
  recipient/event references inside the first-party boundary, with no direct contact PII, protected
  content or business-resource identifiers. Portal remains authoritative when delivery fails.
- M077 minimized audit evidence and M085 retention/legal-hold references.
- Private/no-store projections, no portal session replay/autocapture and no message bodies in logs,
  traces, Sentry, PostHog, URLs, push/email subjects or browser persistence.
- Bilingual WCAG 2.2 AA responsive design for Client and scoped Staff workflows.

### Compatible Release 1B extensions

- Approved templates, routing queues, priorities, operating-hours indicators and response metrics.
- M025 unified inbox projections over portal, public chat, WhatsApp, phone and future email while
  preserving channel-specific transport facts and authorization.
- Approved AI-assisted FAQ/status explanation and handoff through M047–M060, with a clearly named
  virtual assistant and no autonomous operational authority.
- Approved translation assistance that preserves the original, provenance and reviewer evidence.
- Governed message search, redaction, export and richer retention workflows.
- Typing/presence indicators, client-visible read receipts and richer notification channels only
  after privacy and accuracy decisions.
- Authorized cross-channel continuity using verified identity/contact bindings and purpose-specific
  consent; no automatic copying of protected portal content to external channels.

Release 1A uses the durable conversation identifiers, sequence rules, authorization epochs,
visibility model, content revisions, typed references and outbox contracts that Release 1B extends.
A disposable chat table or provider-specific transcript is prohibited.

## 4. Explicit out of scope

- A second CRM, M025 unified inbox, social network, consumer chat app or per-service messenger.
- Public/prospect chat behavior owned by M003, WhatsApp transport owned by M004, voice owned by
  M005/M096 or general notification delivery owned by M026.
- Client access based on email, phone, CRM relationship, participant row, guessed identifier,
  payment, message link, cookie claim or external-channel identity alone.
- Letting any message, attachment, AI answer or transcript execute a filing, dispute, application,
  payment/refund, price change, service approval, case transition, signature or grant change.
- Card numbers, passwords, authentication secrets, IdentityIQ credentials or other prohibited
  secrets in message content.
- Raw HTML, arbitrary Markdown/embeds, executable links, inline third-party media, public
  attachments or storage keys.
- Direct message attachments that bypass M011 quarantine, validation, scan, promotion and current
  document authorization.
- Client visibility into internal/compliance notes, hidden participants, staff-only assignments,
  risk signals, AI prompts/reasoning, raw audit events or provider payloads.
- Full-text body search, AI/RAG ingestion, translation, transcript export, body analytics or
  retention periods until their policies are approved.
- Automatic transcript merging across public chat, WhatsApp, calls or email based solely on
  matching contact data.
- Published SLA, guaranteed response time, 24/7 staffing or named specialist availability before
  SG Solutions approves and can operate that policy.
- Production WebSocket/real-time infrastructure, Redis, provider accounts, notifications, email,
  SMS, WhatsApp or model connections in this documentary phase.

## 5. Actors

### Authorized client

Has a valid M007 application session/membership plus current access to the conversation's account,
service or case scope. May list/read client-visible messages, post a bounded reply, initiate an
allowed reason, request human help and start an M011 attachment handoff. The client cannot choose
staff, change grants or see internal activity.

### Authorized representative

Future actor within an approved personal, household or business context. Relationship or
participation alone grants nothing; exact delegated evidence, expiry and revocation remain MSG-003.

### Support Agent

May handle authorized account-support or assigned queue items, reply publicly, request structured
work from owning modules and escalate. Role permission without resource/inbox scope is insufficient.

### Authorized specialist

May participate only where service discipline, assignment, case grant, sensitivity and assurance
allow. Specialization does not grant organization-wide transcript search.

### Compliance Reviewer or security responder

May access specifically routed/high-risk evidence under role, purpose, resource scope and assurance.
M076 owns compliance policy/classification/escalation and human-required decisions. This actor does
not automatically receive every conversation or unrestricted export.

### Administrator

May manage approved M012 policy/template configuration through the M090-owned configuration
boundary. It cannot create/assign roles (M080/M081/M091), widen its own transcript scope or gain
universal content access merely from administration. Break-glass requires separate authority,
reason, step-up and audit.

### AI service identity

Future M047–M060 actor with a narrow tool/context allowlist and explicit identity in the thread,
subordinate to M076 and human-required compliance authority. It
cannot read internal notes, broad transcript history, unapproved attachments or another context,
and it cannot change business state.

### System worker

Processes one authorized event or reconciliation unit through a scoped service identity. Inngest
may coordinate it but cannot create authoritative message, read, handoff or notification state
without the Postgres transition.

## 6. User journeys

### 6.1 Client starts a service conversation

1. The client enters from M009/M010 using one opaque authorized service reference.
2. M012 builds a fresh M007 context/grant/assurance snapshot and resolves the canonical
   ServiceOrder/CaseFile server-side.
3. The client selects one approved reason and enters plain text; M012 shows prohibited-data and
   secure-document guidance.
4. The command binds actor, canonical governing root, reason/purpose, locale, policy version and an
   initiation idempotency key to one canonical digest before a conversation reference exists.
5. In one transaction M012 reserves the unique actor/root/reason/idempotency namespace,
   reauthorizes, creates the client-visible conversation/participant records, assigns client-message
   and staff-activity sequence `1`, encrypts/persists the initial `MessageRevision`, points the
   Message aggregate to it and writes idempotency receipt plus audit/outbox evidence. The same
   key/digest returns the same
   conversation; reuse with different content returns conflict.
6. Only after commit does the client receive an accepted receipt and see the message.
7. Routing is manual/default queue until MSG-009 is approved; no unstaffed response promise appears.

### 6.2 Client replies safely

1. The detail query reauthorizes the opaque conversation reference and governing scope.
2. The server returns only client-visible messages and typed references, ordered by durable
   gap-free client-message sequence rather than browser time or staff activity order.
3. The client submits text with an idempotency key and expected client-writability version.
4. M012 rechecks participant status, lifecycle, block state, grant epoch, limits and current policy.
5. Duplicate retry with the same key and content returns the prior receipt; key reuse with different
   content returns `409 idempotency_conflict`.
6. Revocation or close/block conflict returns a safe generic recovery without accepting the reply.

### 6.3 Staff replies versus adds an internal note

1. Staff opens the M025-owned scoped communications view or a case-scoped M012 detail.
2. The page identifies the exact client, governing context, audience and current responsibility.
3. `Reply to client` is available under its own policy. `Add internal note` remains absent until
   MSG-005 is approved/active; gate-off renders no note body/control/service call and never falls
   back to a generic message visibility flag.
4. When MSG-005 is active, public reply and internal note use separate controls, forms and service
   commands. A public reply preview names the audience and excludes internal fields; an internal
   note uses a distinct warning treatment and never emits a client-notification event.
5. Each command reauthorizes, uses expected-version compare-and-set and records minimized evidence.

### 6.4 Message references a document

1. This flow exists only after MSG-007 and every applicable M011 DOC gate are approved and active.
   Until then there is no attachment UI, preflight or intent/API call.
2. The client or staff selects `Attach securely` or a typed document action.
3. M012 requests a purpose-bound M011 upload/reference intent; it never accepts bytes itself.
4. The message may contain a non-authoritative `attachment processing` placeholder linked by an
   opaque reference.
5. M011 independently runs quarantine, type/parser validation, checksum, scan and promotion.
6. M012 shows only M011's client-safe state. Preview/download reauthorizes in M011; failed/unsafe
   bytes never become accessible from the conversation.

### 6.5 Human handoff

1. The client explicitly requests a person or a policy detects an approved escalation reason.
2. M012 commits the handoff request, responsibility transition and bounded summary evidence. Any
   free-text summary is a derived protected artifact encrypted before persistence; KMS failure
   leaves the handoff pending with structured reason/evidence only and creates no plaintext copy.
3. An authorized queue accepts through expected-version compare-and-set; AI sending is suspended.
4. A human response or resolution is recorded without replacing the original transcript.
5. Returning to AI, when later approved, requires explicit staff action and no pending human work.

### 6.6 Safe partial failure

- A message is never shown as sent before durable Postgres acceptance.
- A committed message remains available in the portal if M026 delivery fails; notification retries
  do not duplicate the message.
- M011 outage lets the client send text without falsely accepting an attachment.
- AI outage preserves human messaging and Help Center handoff.
- M025 projection outage does not erase M012 state; staff use a scoped manual recovery queue.
- Authorization/grant uncertainty fails closed without confirming whether a conversation exists.

## 7. States and transitions

M012 does not use one overloaded `status`.

### Conversation lifecycle

`open → resolved → closed → archived`

- `open` may receive messages when all other policies allow.
- `resolved` records an outcome but may still allow an approved reopen/reply window.
- `closed` rejects ordinary writes unless MSG-002 permits a reopen command.
- `archived` is a presentation/disposition state, not deletion.
- `blocked` is an orthogonal contact/security restriction; it does not erase history.

### Response responsibility

`new → waiting_for_staff|waiting_for_client|waiting_for_human|human_active|ai_active|escalated`

Only one active responsibility value applies at a time. `handoff_requested` is a durable handoff
record/transition, not a competing lifecycle value. AI cannot remain active after human acceptance.

### Message acceptance/content

`accepted → published → redacted|withdrawn`

- `accepted` means a durable authorized command committed.
- `published` means available to its permitted audience in M012; it does not mean read.
- Editing creates an immutable `MessageRevision`; it never overwrites prior content.
- Redaction/withdrawal replaces the audience projection with a tombstone while retaining governed
  evidence under M085/legal hold.
- Validation/rate-limit/authorization failures create no accepted message.

### Delivery projection

Portal: `available|unavailable`.

External channel delivery, when separately activated, remains adapter-owned:
`queued|sent|delivered|failed|unknown`, with provider reconciliation. `Delivered` never means read.

### Read evidence

Each participant has `lastReadClientMessageSequence` plus evidence time/version. Advancement requires a
server-issued receipt bound to actor, participant, conversation, authorization epoch and the exact
authorized page that was returned. The submitted sequence must be no greater than both the highest
client-visible sequence in that receipt and the current client-message sequence. Advancement is
monotonic, idempotent and transactional; it never decreases, accepts a staff-activity/internal-note
sequence or survives revocation. It means the authorized client reported/rendered through that sequence under
the approved contract, not that a human understood it. Client-visible staff-read indicators remain
MSG-016.

### Participant and assignment

Participant: `invited|active|left|revoked`.

Assignment: `unassigned|queued|assigned|accepted|released|completed`.

Neither record grants resource access. Resource revocation immediately invalidates derived access
even if participant/assignment remains historically present.

### Attachment reference

`requested → uploading → processing → available|rejected|expired|removed`

These are M012 client-safe projections of M011 authority. M012 cannot set `available` from an upload
callback or scanner claim independently.

## 8. Business rules

1. Every conversation has exactly one governing scope: account support, ServiceOrder or CaseFile.
   Optional typed resource references never replace that root.
2. Account support may discuss account/portal use only. Access to service, document, appointment or
   billing detail requires that owning resource's current grant.
3. A conversation participant describes involvement and cannot authorize a read or write alone.
4. Conversation and message public references are opaque; internal IDs never enter URLs, copy,
   telemetry or notifications.
5. Message text is plain text in Release 1A. Rendering uses text nodes; raw HTML, active Markdown,
   embeds, scripts and browser-generated previews are prohibited.
6. Internal secure links are typed resource references. Free-text URLs do not become authority and
   follow the approved link policy; redirects and `javascript:`, `data:`, file or custom schemes are
   rejected.
7. Ordering has two independent server-assigned counters. `clientMessageSequence` is gap-free over
   client-visible `Message` records and is the only order/read counter serialized to clients.
   `staffActivitySequence` orders both messages and internal notes for authorized staff but never
   appears in Client DTOs, counts, cursors or timing. A public message increments/records both in one
   transaction; a note increments only staff activity. Client time and provider time are evidence.
8. Posting is idempotent. Starting uses a unique actor/governing-root/reason/idempotency namespace;
   replying uses actor/conversation/idempotency. Each binds a canonical command digest and policy
   version. Replay returns the same outcome and changed-payload reuse conflicts. The initial
   reservation, aggregate, applicable counters, encrypted initial revision/current pointer,
   idempotency receipt and audit/outbox commit are one transaction. Any encryption, revision insert,
   pointer or outbox failure rolls back all rows/counters/reservation.
9. An optional `replyToRef` is resolved before commit and included in the canonical digest. It must
   identify an eligible, current, client-visible revision in the same conversation and authorized
   result set. Cross-client/context/thread, internal-note, redacted, withdrawn or otherwise
   ineligible targets fail with the normalized unavailable response and never reveal an excerpt.
10. CAS domains are separate. Public replies use `expectedClientWritabilityVersion` plus fresh
    lifecycle/block/grant epochs; internal notes use `expectedStaffActivityVersion`. A note-only
    commit cannot invalidate, reorder or observably change an otherwise authorized client reply.
    Lifecycle/block/revoke still increments/fences the client-writability domain and aborts it.
    Other state/participant/assignment/revision/redaction mutations use their exact version axis.
11. A message is not a command to M011/M013/M014/M023/M067. Structured actions call the owning
    service and retain a typed origin reference; text such as “mark paid” changes nothing.
12. An M011 attachment/document reference is not available until current M011 facts and grants say
    so. M012 stores no duplicate bytes, signed URLs, scanner verdicts or storage keys.
13. `ReplyToClient` and `AddInternalNote` use different contracts, permissions, DTOs, outbox events
     and UI components. A generic visibility parameter supplied by the browser is prohibited.
14. Internal notes never inherit client visibility, emit client message notifications, enter public
    AI context or cross into external channel adapters.
15. Message edits create revisions and preserve author/time/reason. Whether clients may edit and the
    window/eligible states remain MSG-004; Release 1A fails closed without it.
16. Delete is never an unqualified hard delete. Withdraw, redact, archive, legal hold and authorized
    purge are distinct operations under M085.
17. A notification is best-effort discovery only. Portal state is authoritative and no notification
    body includes subject, message text, document name, amount, case/service ID or sensitive status.
18. Help Center suggestions never block a client's permitted contact action or claim to resolve the
    issue.
19. AI and automated tags/summaries are labeled suggestions/evidence. They cannot resolve, close,
    assign, change priority, publish, create business state or answer outside approved policy.
    Priority bands/ties/change authority, tag taxonomy and human/rule/AI-suggestion acceptance remain
    MSG-009; no tag or priority activates before that gate.
20. A handoff summary never replaces the original transcript; facts versus unverified statements
    remain separate and provenance is retained.
21. Cross-channel continuity requires an approved identity/contact binding, purpose, consent and
    explicit link. Matching phone/email or similar content does not merge transcripts.
22. M025 owns the cross-channel inbox/list/assignment projection. M012 owns secure-portal content and
    commands and exposes bounded ports; it does not create another omnichannel store.
23. Search authorizes before matching and pagination/counts. Release 1A permits metadata/status
    filters only; body search remains disabled until MSG-017 solves encrypted-index privacy.
24. Retention, export, redaction and legal hold use policy references and audited authority. No exact
    period or purge promise is invented in this PRD.
25. Inngest coordinates bounded retries only. Postgres, transactional outbox/inbox and owner-domain
    state remain durable authority.

## 9. Authorization rules

### Decision inputs

Every list/detail/post/read/reply/note/assign/handoff/close/reopen/redact/export/reference action
uses a fresh server-side snapshot containing:

- Supabase identity plus M007 application session/family, account and membership status;
- active personal/household/business context and assurance/step-up evidence;
- role/permission and inbox/team assignment scope;
- explicit account-support, ServiceOrder, CaseFile or direct conversation grant and direct denies;
- participant status, conversation root, client visibility, sensitivity and inheritance block;
- lifecycle/block/hold state, policy versions and trusted server time;
- conversation/participant/grant/authorization epochs and expected command version.

Email, phone, contact/client relation, CRM assignment, payment, entitlement, participant row,
conversation ID, message link, external endpoint or prior successful access grants nothing.

### Inheritance

- An explicit active case grant may inherit to an ordinary `client_visible` secure conversation
  rooted in that case under ADR 004.
- Account-support conversations require active account membership plus an explicit purpose-bound
  conversation grant created atomically after policy authorization; they cannot expose case data.
- Internal notes, compliance-only content, staff drafts, security conversations,
  `inheritance_blocked` and designated Highly Sensitive conversations never inherit ordinary client
  visibility.
- Typed child references do not inherit conversation access. Each M011/M013/M014/M023 target
  independently authorizes its route/action.
- Revoking the root grant or direct-denying the conversation advances authorization epochs and
  blocks new list/detail/message/read/download actions predictably.

### Enforcement

- Domain authorization runs before queries/writes; restricted Postgres RLS enforces the same actor
  context. User traffic never uses owner, `service_role` or `BYPASSRLS`.
- Client and Staff queries use separate allowlisted DTOs and query paths. Internal/compliance fields
  never enter a Client DTO, cache, count, cursor or serializer input.
- List counts, search matches, unread counts and cursors are computed after authorization. No hidden
  conversation changes timing, total or continuation metadata visible to the caller.
- Immediately before serialization or commit, a final fence rechecks session/context/grant,
  participant, root link, visibility/sensitivity/assurance, lifecycle/block and resource epochs.
- Unauthorized/unknown private resources return one normalized no-existence response; error detail
  does not reveal whether another client has the conversation.
- Sensitive staff read/export/redaction/break-glass operations require exact purpose, step-up and
  minimized audit evidence.

## 10. Data requirements

These are conceptual domain records only; Drizzle remains the future schema authority after Build.

### `Conversation`

Opaque/public reference, type, governing-scope type/reference, client/data-owner reference,
subject-key or protected subject, locale, lifecycle, responsibility, priority, sensitivity,
client-visible flag, inheritance block, assignment summary reference, client-message sequence,
client-writability version, client-last-visible-activity time, staff-activity sequence, staff-
activity version/time, structural aggregate version, authorization epoch, policy versions and
timestamps. Client DTO/list/order/cursor/ETag exposes only client-visible sequence/version/time;
generic/staff timestamps never enter Client output.

### `ConversationParticipant`

Conversation, participant type, identity/contact/service-account reference, purpose/role,
participant state, effective interval, grant evidence reference and version. It is never an access
grant by itself.

### `Message`

Conversation, immutable sender identity, `authorKind` (`client|staff|system`), allowlisted
client-visible message type, gap-free client-message sequence, staff-activity sequence, original
locale, current-revision reference, eligible reply-to reference, durable acceptance state,
idempotency digest, policy version and timestamps. Every
`Message` is client-visible by invariant; there is no `staff_message` audience and no generic
visibility switch. System messages must use approved client-visible type keys. Staff-only or
compliance content exists exclusively as `ConversationInternalNote`.

### `MessageRevision`

Message, revision number, protected content envelope/reference, content classification, author,
reason, supersedes reference, created time and redaction/tombstone evidence. Revisions are immutable.

### `ConversationInternalNote`

Separate conversation-local staff note aggregate with note type, author, permission scope, staff-
activity sequence, current-revision reference, version and timestamps. Body exists only in immutable
`ConversationInternalNoteRevision` records; the aggregate has no body/envelope column. It never
serializes through a client message DTO.

### `ConversationInternalNoteRevision`

Internal note, immutable revision number, protected content envelope/reference, author, reason,
supersedes reference, policy/classification, created time and redaction/tombstone evidence. MSG-005
gates who may revise/redact; before approval notes are immutable and no revision command/event is
available.

### `MessageResourceReference`

Message, typed owner (`document|document_request|task|appointment|invoice|payment|service|case|help`),
opaque owner reference, presentation key, relationship and created evidence. It grants nothing and
never stores a signed URL or provider payload.

### `MessageAttachmentReference`

Message, M011 upload/document/version opaque references, intended purpose and client-safe status.
M011 retains safety, classification, bytes, visibility and download authority.

### `ConversationAssignment`

Conversation, target team/user/queue, state, assigning actor, reason code, expected version,
effective interval and timestamps.

### `ConversationHandoff`

Conversation, from/to handler class/reference, reason, bounded summary artifact reference, requested/
accepted/completed times, state and policy version. Summary content follows the conversation class
and never replaces original messages. Prefer structured reason/pointer evidence; any derived free-
text summary uses the same envelope-encryption-before-persistence, failure and no-plaintext rules as
message bodies.

### `ParticipantReadState`

Conversation, participant, last-read client-message sequence, evidence timestamp/source and version. It contains
no tracking pixel, browser fingerprint or cross-channel inference.

### `ConversationTagAssignment`

Conversation, approved tag key, source (`rule|human|ai_suggestion`), actor/model evidence, accepted
state and timestamp. AI suggestions cannot change operational state without human/rule acceptance.

### Protected content and minimization

- Standard portal messages are at least Confidential; tax, credit, identity, banking, security and
  legal content may be Highly Sensitive under `DATA_CLASSIFICATION.md`.
- Every accepted message/note/revision body and derived free-text handoff/translation summary uses
  ADR 005 application-level envelope encryption from
  ingress, with opaque key references and versioned authenticated encryption. Unexpected SSN/ITIN,
  tax, banking or identity text therefore never depends on later classification to gain this
  boundary. Plaintext is not persisted in temporary/draft/rejected records, outbox, audit, logs or
  backups. KMS/encryption failure rejects the write and never degrades to managed-at-rest only.
- Subject, snippet and search metadata are minimized and cannot duplicate sensitive message bodies.
- No full payment-card data is ever accepted or stored; prohibited-secret detection triggers safe
  client guidance and restricted incident handling without echoing the secret.

## 11. API or service contracts

Exact HTTP routes/payload limits await a Build gate. Provider-neutral domain contracts are:

- `ClientConversationQueryService.list(actor, context?, filter, cursor, locale)`.
- `ClientConversationQueryService.get(actor, conversationRef, cursor?, locale)`.
- `StaffConversationQueryService.list(actor, authorizedInboxScope, filter, cursor, locale)` feeds
  M025 and returns no broad/global transcript by default.
- `StaffConversationQueryService.get(actor, conversationRef, cursor?, locale)` uses a staff DTO
  separate from Client.
- `SecureConversationService.start(actor, governingContext, reasonKey, firstMessage,
  initiationIdempotencyKey)` uses an actor/root/reason namespace before `conversationRef` exists.
- `SecureConversationService.reply(actor, conversationRef, plainText, replyToRef?,
  expectedClientWritabilityVersion, idempotencyKey)`; reply target is same-conversation, current,
  client-visible and eligible before its reference/revision enters the digest.
- `ConversationInternalNoteService.add(actor, conversationRef, noteType, plainText,
  expectedStaffActivityVersion, idempotencyKey)` is a separate MSG-005-gated command with no client-audience
  argument. `ConversationInternalNoteRevisionService.revise|redact` creates immutable successors and
  is also absent until its MSG-005 policy is active. Add commits note aggregate, staff sequence,
  encrypted initial note revision/current pointer, receipt and audit/outbox atomically.
- `ConversationLifecycleService.resolve|close|reopen|block` with exact permission, reason and CAS.
- `ConversationAssignmentService.assign|accept|release` with team/user scope and CAS.
- `ConversationHandoffService.request|accept|complete|returnToAI` with explicit handler transition.
- `ConversationReadService.advance(actor, conversationRef, lastRenderedSequence,
  authorizedPageReceipt, expectedVersion)` validates the server-issued page receipt, current grant/
  epoch and upper bounds, then applies monotonic `max` only in the gap-free client-message domain;
  staff-activity/internal-note sequence values are invalid.
- `MessageRevisionService.revise|withdraw|redact` with policy, immutable successor and audit evidence.
- `MessageReferenceService.attachTypedReference(actor, messageRef, ownerRef, expectedVersion)` calls
  no owner mutation and creates no grant.
- `M011DocumentMessagingPort.requestAttachmentIntent|resolveClientSafeAttachment`.
- `M013SchedulingMessagingPort.getSafeHandoff`, `M014BillingMessagingPort.getSafeHandoff` and
  `M023TaskMessagingPort.createFromAuthorizedOrigin` remain owner-provided ports.
- `M025UnifiedInboxPort.projectSecureConversation` is a content-free list projection whose schema
  cannot represent body, note, quote, translation, attachment title/filename or protected subject.
  M025 staff detail calls `StaffConversationQueryService.get` request-scoped with fresh authorization
  and cannot persist/cache the returned protected content.
- `M026NotificationPort.request(templateKey, locale, opaqueRecipientRef, eventRef)` accepts only the
  two purpose-bound opaque references inside the first-party notification boundary and no email,
  phone, name, message text, subject, document name, amount, protected status or owner identifier.

### Command envelope

Every mutation requires an authenticated actor from the session, server-derived context, stable
idempotency key, expected exact client/staff/lifecycle domain version where applicable, allowlisted schema, trusted time and
correlation reference. Actor IDs, roles, visibility, sensitivity and owner references supplied by
the browser are advisory or rejected; the server derives authority.

Every pagination cursor is opaque and authenticated by the server. It is bound to actor/account,
authorized context or conversation, normalized filter/order, snapshot/last sequence, policy and
authorization epochs, and bounded expiry. Tampering, cross-scope replay, changed filters,
revocation or expiry returns the same normalized unavailable/invalid response without counts or
existence leakage.

### Error contract

- `400 message_validation_failed` — generic field guidance without reflecting unsafe content.
- `401 authentication_required` — safe sign-in recovery.
- `404 conversation_unavailable` — normalized unknown/unauthorized response.
- `409 conversation_changed|conversation_not_writable|idempotency_conflict` — reload/recovery.
- `413 message_or_attachment_too_large` — approved bilingual limit guidance.
- `422 prohibited_content_detected|attachment_unavailable` — safe remediation without echo.
- `429 message_rate_limited` — accessible retry guidance, no account enumeration.
- `503 messaging_temporarily_unavailable` — manual/help fallback; never false success.

## 12. Events and background jobs

### Canonical M012 events

- `secure_conversation.created|responsibility_changed|resolved|closed|reopened|blocked`
- `secure_message.accepted|published|revision_created|withdrawn|redacted`
- `secure_message.read_state_advanced`
- `secure_message.reference_added|attachment_state_changed`
- `secure_internal_note.added|revision_created|redacted`
- `secure_conversation.assigned|assignment_released`
- `secure_conversation.handoff_requested|handoff_accepted|handoff_completed`

Each event is post-commit, schema/versioned, idempotent and contains purpose-bound opaque event/
resource references, transition codes and correlation/policy versions, but no direct contact PII,
body, note, subject, filename, URL, amount, protected business identifier or provider payload.
Opaque references remain pseudonymous identifiers and stay inside their allowlisted first-party
consumer boundary. Consumers re-read canonical state; events grant no access. Internal-note
revision/redaction events do not exist until the applicable MSG-005 authority is active.

### Owner integrations

- M011 emits its own attachment/document facts; M012 projects only after an authorized canonical
  reread.
- M013/M014/M023 emit their owner facts; M012 may add a client-safe typed reference but cannot
  rewrite appointment/payment/task state.
- M026 requests notification from the committed M012 event; delivery failure never rolls back or
  duplicates the message.
- M077 records minimized audit evidence; general logs never contain transcript content.
- M025 consumes only a bounded content-free secure-conversation list projection. Authorized staff
  detail reads remain request-scoped M012 queries and leave no M025 body/note cache or copy.
- M092 may later consume approved minimized analytics facts only after MSG-018. Independently, M097
  may carry required content-free, identifier-free operational/security signals under its own
  baseline/readiness/activation policy even while MSG-018 is off. Neither receives transcript
  content, session replay or a parallel M012 data store.

### Jobs

Notification delivery request/retry, assignment escalation, stale-unanswered detection, retention/
redaction/export orchestration and future channel/AI reconciliation use stable resource/version/
policy idempotency keys, bounded attempts/backoff, dead/manual recovery state and transactional
outbox evidence. Inngest owns coordination only.

Release 1A needs no Redis, event bus, WebSocket cluster or message-search index. A real-time delivery
mechanism may later optimize freshness but never becomes the message source of truth.

## 13. Error states and recovery

| Condition | Durable behavior | Client/staff recovery |
|---|---|---|
| Network fails before receipt | Unknown locally; idempotency lookup resolves | Retry same key; never create a second message |
| Commit succeeds, response lost | Original receipt recoverable | Same key returns accepted message reference |
| Conversation changed concurrently | No write on stale version | Reload authorized thread and retry intentionally |
| Grant/session revoked while open | Final fence returns no content/write | Safe portal entry/sign-in; no existence detail |
| Duplicate or out-of-order callback | Inbox/idempotency deduplicates | Reconcile; no state regression |
| Notification provider unavailable | Message remains published in portal | Bounded retry/manual notification; no duplicate |
| M011 unavailable | No attachment accepted/available claim | Send text or retry secure attachment later |
| Attachment unsafe/uncertain | M011 remains rejection/quarantine authority | Safe generic reason and replacement/support path |
| AI unavailable or disallowed | No AI response/action | Human queue and Help Center remain available |
| M025 projection unavailable | M012 state retained | Scoped manual recovery queue/reconciliation |
| Translation unavailable | Original remains authoritative | Staff responds in original language or handoff |
| Encrypted content/key unavailable | Fail closed; no blank/garbled body | Restricted recovery task and incident process |
| Retention/hold conflict | Destruction blocked | Escalate to authorized governance reviewer |
| Prohibited secret/card content | Do not echo in errors/logs; restrict handling | In-product safe guidance and security/compliance path |

All errors use one normalized external contract and a separate minimized internal correlation code.
Authorization, decryption, classification or policy errors never fail open.

## 14. Security and privacy requirements

### Access control and isolation

- Test BOLA/IDOR across client, representative, business context, case, conversation, message,
  attachment, cursor, unread count, search, export and direct route.
- Participant, assignment and staff role never replace resource authorization.
- Client/Staff/Internal-note serializers are structurally separate and have cross-audience negative
  tests. Internal/compliance fields cannot exist in a Client DTO type.
- Counts/search/cursors happen after authorization; direct detail and every typed reference recheck.
- Final fences close session/grant/participant/resource-change races before body or write result.

### Content and browser safety

- Release 1A is plain text only with Unicode normalization, scalar/line/byte bounds and control-
  character handling. Render as text; never use unsanitized HTML.
- URLs use a server-approved `https`/typed-link policy, IDN normalization and phishing-safe display;
  no automatic unfurl or server fetch prevents SSRF/tracking.
- Apply CSRF defense to cookie-authenticated mutations, strict origin/host validation, SameSite/
  Secure/HttpOnly session controls and rate/abuse limits.
- No message body in route/query/fragment, HTML metadata, service worker, offline cache, clipboard
  automation, browser notification, email subject or preview.

### Attachments

- M011 performs exact upload authorization, quarantine, content/parser limits, SHA-256, versioned
  malware scan, promotion and access. M012 never trusts filename/MIME/scan claim from the client.
- Message attachment links use opaque typed references, never storage keys or signed URLs. Preview/
  download happens in M011 with fresh authorization and audit.

### AI and prompt injection

- User content is untrusted data, never system instruction or permission. It cannot reveal prompts,
  select tools, expand scope, alter payments/cases/grants or cause browser/provider operations.
- AI context excludes internal notes, compliance data, unrelated transcript, unapproved attachment
  content, secrets and raw provider payloads. Retrieval is purpose/grant/classification filtered.
- Tool calls require an allowlisted operation, current authorization and human approval where the
  owner module requires it. AI output is clearly identified and carries source/evaluation evidence.
- Human acceptance atomically disables AI sending; race tests prove only the winning handler can
  publish.

### Encryption, telemetry and retention

- TLS is required. Managed encryption at rest plus ADR 005 application envelope encryption applies
  to every accepted message/note/revision body before persistence; keys live in approved KMS/secret
  custody, not rows or source. Encryption/KMS failure is fail-closed, and plaintext input is never
  staged in a durable draft, rejection record, outbox, audit event or backup.
- No message/note body, subject, filename, signed URL, identity/tax/credit/payment detail or DOM
  capture in logs, traces, Sentry, PostHog, analytics, AI history or developer tools.
- Restricted M077 audit/incident evidence may use approved opaque actor/resource references, result,
  trusted time and correlation. M097 operational/security telemetry contains no actor, resource,
  client or business reference—opaque or direct—and may use only ephemeral non-business trace
  correlation allowed by its baseline. Its schema rejects M077 reference-bearing payloads.
- M085 policy owns retention/legal hold; redaction/export/purge requires exact authority and restore
  behavior. Backup copies do not justify an immediate-erasure promise.

### Threats that Build review must cover

Stored/reflected/DOM XSS; CSRF; BOLA/IDOR; role/participant spoofing; horizontal/vertical privilege
escalation; internal-note leakage; free-text-to-command confusion; prompt/tool injection; malicious
link/phishing/open redirect; SSRF through previews; file-upload bypass; resource exhaustion;
enumeration through search/counts/errors/timing; race conditions; duplicate/out-of-order events;
message spoofing/edit erasure; notification/telemetry leakage; cryptographic/key failure; retention/
restore exposure and supply-chain/provider compromise.

## 15. UX and accessibility requirements

The experience must feel like secure case correspondence, not a social feed.

- The Client navigation keeps `Messages` as one of nine maximum primary areas.
- Desktop supports a calm list/detail layout; tablet and mobile use explicit list-to-thread routes.
- Every thread identifies subject, authorized service/context, current responsibility, last update
  and one next action without exposing internal assignment or risk data.
- After MSG-005 activates, compose distinguishes `Send to SG Solutions` from staff-only `Add internal
  note` using separate controls, labels, keyboard order, confirmation and color/text treatment;
  before then the note action/body/service call is absent.
- After MSG-007 and applicable DOC gates activate, attachment says `Attach securely` and shows M011
  states separately from message state; before then no attachment UI or intent call exists.
- Delivery/read/status uses text and icon, never color alone or a false real-time guarantee.
- New-message announcements are polite and batched; focus never jumps while typing.
- Composer supports keyboard, screen readers, 200% zoom, 320px reflow, 44px targets, error summary,
  character/limit guidance and explicit send confirmation when policy requires.
- No infinite-scroll-only transcript. Cursor pagination provides reachable older messages, current
  position and focus restoration.
- Reduced motion preserves meaning. Light mode ships first; dark tokens remain unpublished.
- Autosave/server drafts are absent until policy approval; the browser does not persist protected
  drafts. Unsaved local text is cleared on context/grant/session change.

The full responsive specification is
`docs/superpowers/specs/2026-08-09-m012-secure-messaging-design.md`.

## 16. Bilingual requirements

- Navigation, reason codes, lifecycle/responsibility labels, errors, recovery, attachment states,
  templates, notifications, handoff and accessibility text require paired Spanish/English keys.
- User-authored messages remain immutable in their original language.
- Assisted translation, when approved, is a separate labeled artifact with provider/model/version,
  reviewer, source-message reference and confidence/limitations; it never overwrites the original.
- A missing critical locale key suppresses the action or uses an explicit safe fallback; it does
  not silently mix languages for privacy, consent or security instructions.
- Locale formatting applies to dates/times; client-message/staff-activity sequences and evidence
  remain locale-neutral.

## 17. Acceptance criteria

- [ ] One M012 secure-portal conversation authority reuses the shared conversation kernel and feeds,
  but does not duplicate, M025 unified inbox.
- [ ] A client lists/reads/posts only within a fresh authenticated, granted governing context.
- [ ] Account-support scope cannot reveal service/case/document/payment/appointment data.
- [ ] Client and Staff DTOs are allowlisted separately; internal/compliance notes are unrepresentable
  in Client output and notification payloads.
- [ ] Public reply and internal note use separate services, permissions, events and controls.
- [ ] Every `Message` is client-visible by type; `authorKind` cannot represent private staff content,
  and internal notes are unrepresentable in Message/Client DTO/event/notification contracts.
- [ ] Idempotent start/reply plus the client-message/staff-activity sequences and CAS handle lost responses, concurrent duplicate
  starts, retries and out-of-order facts without duplicate conversations or messages.
- [ ] Failure injection at encryption, initial revision insert, current-pointer update or outbox rolls
  back aggregate, counters, key reservation and receipt; retry yields exactly one complete message or
  note with one current immutable revision.
- [ ] Read advancement proves a current authorized page receipt, is upper-bounded/monotonic and
  cannot accept staff activity/internal notes, future sequence, revocation or another participant.
- [ ] Concurrent note/reply pagination is deterministic for staff while Client history/read/count/
  cursor remains gap-free and reveals no hidden-note count, gap or timing.
- [ ] A concurrent hidden-note write and authorized client reply can both commit in separate version
  domains; note-only activity changes no Client order, last-activity time, cursor, ETag/version,
  response/error or observable timing, while close/block/revoke still aborts the reply.
- [ ] Opaque authenticated cursors reject tamper, cross-client/context/thread replay, changed filters,
  expiry and authorization-epoch changes without revealing existence.
- [ ] Revocation/participant/block/close changes final-fence before body/count/cursor/write receipt.
- [ ] Attachments use M011 end to end; M012 stores no bytes, object keys or signed URLs and never
  exposes an uncertain/unsafe object.
- [ ] Typed task/document/appointment/billing links grant nothing and every owner reauthorizes.
- [ ] A quoted reply resolves to an eligible current client-visible revision in the same authorized
  conversation, is digest-bound and rejects cross-client/context/thread, internal, redacted or
  withdrawn targets without excerpt/existence leakage.
- [ ] M012 conversation, M017 CRM, M018 client and M022 case notes remain separate authorities with
      typed links/projections only; no service mutates, copies or grants visibility to another.
- [ ] M025 projection/event schemas cannot represent body/note/quote/translation/attachment title;
  authorized staff detail re-reads M012 and leaves no M025 protected-content copy/cache.
- [ ] AI is absent in Release 1A unless its separate gate is approved; any future AI is identified,
  bounded, prompt-injection-resistant and subordinate to human/owner-domain authority.
- [ ] Portal message remains durable when notifications, M025 projection or AI fail.
- [ ] Plain text/link handling prevents stored XSS, open redirect, SSRF/unfurl and active embeds.
- [ ] Bodies/notes/subjects/protected refs are absent from logs, traces, analytics and browser cache.
- [ ] MSG-018 off yields zero M092/PostHog product analytics while M097 may still receive only its
  required content-free, identifier-free operational/security signals; neither gets transcript,
  DOM/session replay or a parallel M012 data store.
- [ ] M012 policy/template administration cannot create/assign M080/M081/M091 roles, widen transcript
  access or self-grant content scope.
- [ ] No AI/service identity grants compliance-note access, approves/redacts/exports protected
  content or replaces a human-required M076 decision.
- [ ] Every accepted body is envelope-encrypted before persistence; ordinary and unexpected-PII
  messages leave no plaintext in database fields, outbox, audit, logs, errors or backup artifacts,
  and KMS failure yields no durable partial write.
- [ ] Handoff prefers structured reason/pointers; any derived free-text summary with ordinary or
  unexpected PII is envelope-encrypted before persistence and KMS failure creates no plaintext or
  falsely complete handoff evidence.
- [ ] English/Spanish client/staff flows pass keyboard, screen-reader, 320px, 200% zoom, contrast and
  reduced-motion review.
- [ ] Search, retention, export, redaction and encryption follow approved policies and fail closed.
- [ ] Tests cover cross-client/context BOLA, participant removal, internal-note serialization,
  attachment authorization, prompt/tool injection, idempotency, races and safe errors.

## 18. Negative acceptance criteria

- No message, AI text or participant record changes payment, case, task, appointment, document,
  service, signature, grant or approval state by implication.
- No client payload, count, cursor, search result, cache or notification contains an internal note,
  hidden conversation or another client's metadata.
- No `Message` field or browser parameter can express private/staff-only visibility; author identity
  never substitutes for audience authorization.
- No `replyToRef` from another client/context/thread, an internal note or an ineligible revision is
  accepted or reflected in an error/quote.
- No M025 projection, event or cache contains transcript/notes/quotes/translations/attachment titles,
  even when an authorized staff member may request-scoped read them from M012.
- No raw HTML/Markdown/embed, scriptable link, arbitrary redirect/unfurl or public attachment URL.
- No message is labeled `sent`, `delivered` or `read` without the exact durable fact defined here.
- No future, decreasing, cross-participant, revoked or staff-activity sequence advances Client read
  state, and no tampered/replayed cursor crosses its bound query or authorization epoch.
- No note-only commit changes a Client list/detail version, last-visible-activity timestamp, order,
  cursor, error or timing, and no note aggregate stores a duplicate mutable body.
- No message/note can be accepted or receive a sequence/receipt without its encrypted initial
  immutable revision and current pointer committed in the same transaction.
- No upload bypasses M011 or becomes staff/client accessible while safety/promotion is uncertain.
- No AI continues after human takeover, uses internal notes, treats user text as permission or
  silently publishes unapproved advice/action.
- No automatic merge from public chat/WhatsApp/email/call into a secure conversation by email/phone.
- No external notification includes message body, subject, document name, financial amount or
  sensitive status.
- No full-text search or analytics index receives decrypted transcript content without MSG-017/
  MSG-018 approval and independent security evidence.
- No accepted or rejected plaintext message/note body is durably staged before encryption, and no
  KMS failure falls back to database-at-rest encryption alone.
- No handoff/translation/AI summary or other derived transcript text bypasses the same encryption,
  minimization, telemetry, search, retention and backup controls as its protected source.
- No hard delete, export, transcript sharing or retention promise exists without M085/legal policy.
- No separate secure-messaging microservice, database, Redis/event bus or provider-specific domain
  is introduced merely because the source diagram mentioned it.

## 19. Dependencies

- M007/ADRs 004 and 011 for identity, session, membership, context, grants and assurance.
- M009/M010 for authorized service/process roots and owning-route handoffs.
- M011/ADR 015 for attachment/document lifecycle and byte access.
- M013 scheduling, M014 billing, M023 tasks and M067 signature for typed owner actions.
- M017 for CRM relationship/opportunity and M018/M021/M022 for canonical client, service-order and
  case context. M017 owns CRM notes, M018 client notes, M022 case notes and M012 conversation-local
  notes; note families link only by typed opaque projection and never copy bodies/visibility.
- M025 for unified communications inbox/assignment projection and M026 for delivery/preferences.
- M002 for approved public help; M003–M005 for channel-specific kernels/adapters and handoff context.
- M047–M060 for AI/model/prompt/tool/evaluation behavior; M060 remains subordinate to M076 policy
  and human-required compliance authority. M012 only gates conversation access.
- M090 owns system configuration and M091 staff user/role administration; M012 contributes only
  approved domain policy/template configuration and cannot administer roles.
- M077 audit, M078 consent, M080/M081 IAM/RBAC, M082 PII, M083 secrets, M084 integration security,
  M085 retention/deletion and M098 backup/recovery.
- M092 owns reports/product analytics consumption and is gated by MSG-018. M097 separately owns
  required redacted operational/security observability under its own readiness/activation policy;
  no transcript/protected identifier/session replay enters either.
- M076 owns compliance policy, classification, escalation and human-required decisions.
- Design system, i18n, data classification, encryption, observability minimization and manual
  incident/recovery procedures.

M012 architecture requires no live model, WhatsApp, email, SMS, notification or external messaging
provider. External activation follows ADR 006 and `EXTERNAL_ACTIVATION_REGISTER.md`.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Cross-client/cross-context transcript access | Explicit root grant, participant + sensitivity checks, RLS, final epochs, BOLA tests |
| Internal note accidentally sent to client | Separate record/command/DTO/event/UI; no browser visibility parameter |
| Stored XSS or malicious links | Plain text, output encoding, strict link policy, no unfurl/embed |
| Free text executes operations | Typed owner services only; messages/events grant no business authority |
| Attachment compromises system | Full M011 quarantine/scan/promotion and independent access |
| Duplicate/out-of-order messages or notes | Idempotency digest, separate client/staff sequences and CAS, inbox/outbox reconciliation |
| AI leaks or acts | Minimum authorized context, no internal notes, tool allowlist, human takeover CAS |
| Notification leaks PII | Content-free M026 template request and payload contract tests |
| Encryption blocks search/recovery | Metadata-only R1A search; KMS/backup runbooks; explicit MSG-017 gate |
| Transcript retained too long or erased improperly | M085 policy reference, legal hold, tombstones, governed purge/restore |
| Omnichannel duplication | M025 projection authority; explicit verified link, no contact-only merge |
| False responsiveness/read claims | Durable portal receipt semantics and Product Owner-gated read/SLA copy |
| Solo operation overload | Narrow human queue, honest no-SLA copy, manual recovery, phased routing |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve Release 1A conversation types/reason keys, which account/
  service/case contexts clients may initiate from and whether staff-only initiation is also allowed.]
- [NEEDS PRODUCT OWNER DECISION: approve lifecycle/responsibility transitions, client close/reopen
  rights, inactivity handling and whether any conversation auto-closes.]
- [NEEDS PRODUCT OWNER DECISION: approve participant/delegated-representative rules, evidence,
  expiry, notifications and revocation behavior; default is only the directly invited client.]
- [NEEDS PRODUCT OWNER DECISION: approve whether clients/staff may edit or withdraw messages, the
  time window, ineligible content and required revision/reason evidence; default is immutable.]
- [NEEDS PRODUCT OWNER DECISION: approve conversation-local internal/compliance note types, roles,
  reauth, revision/redaction and any two-person controls.]
- [NEEDS PRODUCT OWNER DECISION: approve text byte/character/line limits, send/creation rate limits,
  spam thresholds, retry guidance and free-text external-link policy; default is bounded plain text
  and non-clickable/unavailable unapproved links.]
- [NEEDS PRODUCT OWNER DECISION: approve M012 attachment purposes/counts and M011 policies that may
  be invoked; default is no attachment until the applicable DOC gates are active.]
- [NEEDS PRODUCT OWNER DECISION: approve sensitivity categories, classification mapping, direct
  grants, step-up and roles for security/tax/credit/identity/legal conversations.]
- [NEEDS PRODUCT OWNER DECISION: approve Release 1A queues, staff roles, routing/assignment,
  priority bands/ties/default/change authority, tag taxonomy and human/rule/AI-suggestion acceptance,
  escalation owners, conflict-of-interest handling and manual recovery.]
- [NEEDS PRODUCT OWNER DECISION: approve whether/when AI may answer authenticated clients, approved
  knowledge/tools, context/redaction, evaluation thresholds, two-failure handoff and human-return
  rules; default is human messaging only.]
- [NEEDS PRODUCT OWNER DECISION: approve bilingual message templates, variables, approvers,
  versioning, expiration and which templates may be sent without case-specific review.]
- [NEEDS PRODUCT OWNER DECISION: approve assisted translation provider/data classes, human review,
  provenance, retention and restricted terms; default is original-language text only.]
- [NEEDS PRODUCT OWNER DECISION: approve M012 notification events, mandatory/optional channels,
  preferences, quiet hours, timing and content-free/direct-contact-PII-free ES/EN copy with only
  purpose-bound opaque recipient/event references inside the first-party boundary.]
- [NEEDS PRODUCT OWNER DECISION: approve staffed hours, first-response/resolution objectives,
  escalation timers and any public SLA; default is no time promise.]
- [NEEDS PRODUCT OWNER DECISION: approve retention, legal hold, redaction, withdrawal, export,
  authorized deletion and backup-expiry rules with Illinois/legal review.]
- [NEEDS PRODUCT OWNER DECISION: approve client-visible staff read receipts, typing/presence
  indicators and their privacy/accuracy semantics; default is hidden.]
- [NEEDS PRODUCT OWNER DECISION: approve metadata and body-search fields, indexing/encryption
  design, roles, retention and no-cross-client tests; default is authorized metadata filters only.]
- [NEEDS PRODUCT OWNER DECISION: approve M092/PostHog product-analytics/reporting metrics, viewers,
  event fields and retention, with proof of zero protected content, identifier, DOM or session replay;
  this does not govern separately controlled M097 operational/security telemetry.]
- [NEEDS PRODUCT OWNER DECISION: approve cross-channel linking among portal, public chat, WhatsApp,
  calls and email, including identity evidence, consent, copy rules and unlink/revocation.]
- [NEEDS PRODUCT OWNER DECISION: approve abuse/contact blocking, complaint/security escalation,
  threat handling, appeal/review, channel scope and incident evidence.]

Approval of this PRD, ADR 016 and MSG-001–MSG-020 still would not authorize product implementation
or external activation. A separate Product Owner `GENERATE`/Build gate remains mandatory.
