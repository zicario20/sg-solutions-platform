# ADR 016 — Secure messaging content, visibility, ordering and handoff boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; no Build authority
- Date: 2026-08-09
- Extends: ADRs 004–005 and proposed ADRs 007–015; does not supersede them
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M012 must let authenticated clients exchange sensitive case correspondence with staff without
turning a conversation ID, participant row, external phone/email or prior access into authorization.
It must also prevent a staff-only note from crossing into a client reply, preserve message evidence
under edits/redaction, handle duplicate/reordered submissions and attach documents without bypassing
M011.

The source asks for a unified internal inbox and continuity with public chat, WhatsApp, voice and
future email. M025 remains the catalog owner of the unified communications inbox; M003–M005 own their
channel-specific behavior. M012 therefore needs one secure-portal authority that reuses the shared
conversation kernel and feeds M025 without creating a second CRM, transcript store or channel
provider authority.

## Decision proposed

### 1. M012 owns authenticated secure-portal content; M025 owns omnichannel projection

M012 owns secure conversation policy, participants, client/staff messages, conversation-local
internal notes, message revisions, read evidence, responsibility/handoff state and typed resource
references in Postgres. M025 later owns only the cross-channel staff inbox/list/assignment
projection. That schema cannot represent body, note, quote, translation, attachment title or
protected subject. Authorized staff detail calls M012 request-scoped with fresh authorization and
M025 never persists/caches protected content.
M003/M004/M005 own public-chat, WhatsApp and voice transport/session facts respectively.

All channels reuse compatible `Conversation`/`Message` vocabulary and provider-neutral ports, but
an anonymous/public/external transcript never becomes an authenticated secure conversation merely
because email, phone or content matches. Cross-channel linking requires approved identity evidence,
purpose, consent and an explicit audited link. The link grants no client/case access and never copies
protected portal content to an external channel by default.

### 2. Governing context and resource grants remain separate from participation

Each M012 conversation has exactly one governing account-support, ServiceOrder or CaseFile scope.
An active M007 identity/membership plus current resource authorization is required on every list,
detail and command. A participant or assignment is additional conversation policy, not an access
grant.

ADR 004 inheritance may reach an ordinary client-visible case conversation only from an explicit
case grant. Account-support conversations receive a purpose-bound direct conversation grant after
policy authorization and cannot expose case/service data. Internal/compliance notes, security or
Highly Sensitive conversations and inheritance-blocked resources fail closed under their exact
grant/assurance policy.

Domain services authorize before I/O; restricted RLS mirrors scope. Client and Staff query paths use
separate allowlisted DTOs. A final fence rechecks session, membership, context, root grant,
participant, visibility, sensitivity/assurance, lifecycle/block and authorization epochs before
body/count/cursor serialization or write receipt.

### 3. Public messages and internal notes are different types and commands

`ReplyToClient` creates only a client-visible `Message`; every `Message` is client-visible by type
and records `authorKind`, never an audience that can mean staff-only. Allowlisted system messages
are also client-visible. `AddInternalNote` creates only a `ConversationInternalNote`. They use
separate services, permissions, DTOs, events and UI controls. No generic browser-supplied
`visibility` or `audience` field may switch one into the other.

Client serializers never accept an internal-note type as input, and notification/channel adapters
never receive internal-note events. Compliance-only notes require their own exact permission and
scope. This structural split is the primary defense against accidental publication; color or hidden
frontend controls are not the boundary.

M012 owns only conversation-local notes; M018 owns client/case operational notes. Neither service
can create, revise, redact, delete, copy or derive client visibility for the other's type. A typed
opaque link/authorized projection is the only integration. The note aggregate has no body column;
body exists only in immutable note revisions. All note creation/revision UI, commands and events are
absent until MSG-005 activates their exact policy.

### 4. Durable acceptance and ordering are server-authoritative

Starting a conversation reserves a stable actor/canonical-root/reason/idempotency namespace and
canonical digest before a conversation reference exists. Replies use actor/conversation/
idempotency. An optional reply target is digest-bound and must resolve to an eligible current client-
visible revision in the same authorized conversation; internal, redacted, withdrawn or cross-scope
targets fail uniformly. Public replies use a client-writability CAS plus current lifecycle/block/
grant epochs; notes use a separate staff-activity CAS. A note-only write cannot invalidate or
observably alter a permitted client reply.

Ordering uses gap-free `clientMessageSequence` for Client messages/read/count/cursors and private
`staffActivitySequence` for authorized staff interleaving of messages/notes. A public message records
both; a note records only staff activity. Client DTOs expose only client-writability version and
client-last-visible-activity time; staff sequence/version/time and generic timestamps never affect
Client order, cursor, ETag, error or timing. In one Postgres transaction M012 reserves the key where
needed, reauthorizes, allocates applicable sequences, encrypts/persists the initial immutable
message/note revision, persists its aggregate/current pointer and idempotency receipt, then writes
outbox/audit evidence. Encryption, revision, pointer or outbox failure rolls back every row, counter
and key reservation. Only that complete commit yields `accepted`.

Retrying the same key/digest returns the original receipt. Reusing the key with a different digest
returns conflict. Client/provider time is evidence only. External callbacks enter a verified
transactional inbox, deduplicate and reconcile without regressing either sequence or state.

Conversation lifecycle, response responsibility, message acceptance/content, adapter delivery,
participant, assignment, read evidence and legal hold remain separate axes. Portal availability is
not external `delivered`; `read` evidence is not proof of comprehension.

### 5. Content is immutable by default; revisions and redaction preserve evidence

Release 1A messages are bounded plain text. Raw HTML, active Markdown, embeds and automatic URL
unfurl/server fetch are prohibited. Rendering uses escaped text and typed internal resource links.
Free-text URL policy remains MSG-006.

A later approved edit creates an immutable `MessageRevision`; it never overwrites prior content.
Withdraw/redact changes the audience projection to a tombstone and records authority/reason while
M085 retention and legal hold govern eventual destruction. The default before MSG-004/MSG-015 is no
client edit, withdraw, export or hard delete.

Standard messages are at least Confidential, but free text may unexpectedly contain Highly
Sensitive identity, tax, banking or credit data. Therefore every accepted message, internal note,
revision body and derived free-text handoff/translation summary enters the ADR 005 application-level
envelope-encryption boundary before durable persistence. Structured reason/pointer evidence is
preferred for handoff. Plaintext is never placed in drafts, rejected-input records, outbox/audit,
logs or backups; KMS failure rejects atomically and cannot fall back to managed-at-rest encryption.
Search metadata is minimized and body indexing remains disabled until MSG-017 establishes a secure
design.

Read advancement accepts only a server-issued page receipt bound to actor, participant,
conversation, authorization epoch and the exact visible page. The reported sequence is bounded by
that receipt and current client-message sequence, advances monotonically and never accepts staff-
activity/internal-note values.
Pagination cursors are server-authenticated opaque capabilities bound to actor/account, authorized
scope, filter/order, snapshot/last sequence, policy/auth epochs and bounded expiry.

### 6. Attachments and resource links remain owner-authorized

Before MSG-007 and applicable DOC gates activate, M012 exposes no attachment UI, preflight or upload-
intent call. After activation, M012 never receives authoritative file bytes, storage paths or signed URLs. It obtains a
purpose-bound M011 upload/reference intent, stores only opaque typed references and projects M011's
client-safe state. Every upload follows M011 authorization, quarantine, content/parser validation,
checksum, malware scan and promotion. Preview/download executes in M011 after fresh authorization.

Similarly, task, appointment, billing, service, case, help and signature links are typed references
only. M023/M013/M014/M009/M010/M002/M067 independently authorize every read/action. A message such as
“mark paid” or a link record cannot mutate an owner domain.

### 7. Human/AI responsibility uses a single-writer transition

Human handoff is durable Postgres state with expected-version compare-and-set. Human acceptance
atomically changes the responsibility owner and disables AI publication. Any concurrent AI output
must recheck the winning responsibility/version before publish and is discarded if a human won.

Future AI receives only the minimum authorized, purpose-bound context; internal notes, unrelated
history, unapproved documents and secrets are excluded. User content is untrusted data, never a
system instruction, permission or tool selection. AI cannot change payments, cases, grants,
documents, appointments, tasks, approvals or filings. M047–M060 own AI/model/tool/evaluation
behavior; M060 remains subordinate to M076 policy and human-required compliance decisions. M012
only enforces conversation access and handoff.

### 8. Notifications, analytics and logs cannot carry transcript content

M012 emits schema-versioned post-commit events with purpose-bound opaque references and transition
codes only; these remain pseudonymous identifiers inside one allowlisted first-party boundary. M026
may send content-free discovery copy such as “You have a new message in SG Solutions.” It receives
only the opaque recipient/event refs required for that delivery and no email, phone, name, body,
subject, filename, amount, protected business-resource identifier or sensitive status. Delivery
failure cannot roll back or duplicate the message.

Message/note bodies, subjects, typed protected references, attachments and decrypted content are
prohibited from application logs, audit payloads, traces, Sentry, PostHog, session replay, browser
notifications, HTML metadata, URLs, service workers and offline/shared caches. M077 receives
minimized who/what/when/result/correlation evidence, not transcript content.
M092/PostHog product analytics remains off until MSG-018. M097 may independently carry required
content-free, identifier-free operational/security signals under its own readiness/activation
policy; neither M092 nor M097 becomes a transcript store or receives session replay.

### 9. Postgres/outbox is durable authority; real-time delivery is optional

Postgres owns conversation/message/handoff state. Inngest coordinates bounded retry and
reconciliation jobs but cannot publish a message, mark read, assign, resolve or change responsibility
without the canonical transition. M025, notifications, adapters and future real-time mechanisms are
rebuildable projections/transport.

Release 1A requires no Redis, Kafka, event sourcing, WebSocket cluster or separate messaging
microservice. A future real-time transport may improve freshness after an ADR/Build gate, but polling
or server refresh can operate over the same durable contracts.

### 10. Retention, restore and incident handling fail closed

M085 owns policy periods/legal hold; M012 owns authorized message/note lifecycle commands and
references the applicable policy. Redaction/export/purge needs exact purpose, permission, step-up,
CAS and audit evidence. Restore reconciles transcript revisions, root links, grants, participant/
responsibility state, classification, authorization epochs and key availability before serving
content. Missing key/policy/grant evidence makes content unavailable and creates a restricted
recovery task; it never falls back to plaintext or broad access.

## Consequences

- The model is more explicit than a chat table, but prevents participation, visibility, delivery,
  read state and lifecycle from overwriting each other.
- Structural separation of client messages and internal notes materially reduces accidental
  disclosure risk and simplifies negative serialization tests.
- Separate client-message/staff-activity sequences and idempotency make retries/reordering recoverable without distributed messaging
  infrastructure.
- M011 and every typed owner retain exact authority, so conversation UX cannot silently execute
  operations.
- Encryption and minimization constrain Release 1A body search; metadata filters and scoped manual
  workflows are the safe default.
- M025 can later unify channels without migrating secure content into a provider-specific store.
- Many operating policies remain explicit MSG-001–MSG-020 Product Owner decisions.

## Rejected alternatives

- **Separate messaging application/database:** fragments identity, grants, audit and case context.
- **M012-owned omnichannel inbox:** duplicates M025 and channel-specific transport authority.
- **Participant row as authorization:** enables horizontal access after root-grant revocation.
- **One `status` for conversation/message/delivery/read:** creates false and regressive state.
- **Mutable message body:** destroys evidence and makes concurrent edits/redaction ambiguous.
- **Generic message with a visibility toggle:** permits internal-note publication through UI/API
  confusion.
- **Direct attachment bytes or public URLs:** bypasses M011 and current authorization.
- **Email/phone matching to merge transcripts:** confuses contactability with verified identity.
- **AI as active handler by default:** invents policy and can leak or execute outside authority.
- **Message event as business command:** allows free text to change payments/cases/tasks/approvals.
- **Transcript body in search/analytics/logs:** expands sensitive-data exposure and conflicts with
  encryption/minimization.
- **Kafka/Redis/WebSocket as initial truth:** adds unnecessary distributed failure modes.

## Verification required before acceptance/Build

- Product Owner resolves applicable MSG-001–MSG-020 decisions and accepts or revises this ADR.
- Threat review covers BOLA/IDOR, Client/Internal serialization, XSS/links/CSRF, attachment bypass,
  notification leakage, prompt/tool injection, handoff race, idempotency/ordering, encryption/search,
  retention/restore and cross-channel linking.
- Contract tests prove separate client/staff/internal-note DTOs and command/event namespaces.
- M025 projection/event schemas reject protected content fields; an authorized detail read leaves no
  M025 transcript/note/quote/translation/attachment-title copy or cache.
- Contract tests prove same-conversation eligible reply targets, M012/M018 note ownership and
  MSG-005/MSG-007 gate-off absence of controls/service calls.
- Concurrency tests cover simultaneous posts, duplicate initial-conversation starts and lost
  responses, idempotency key reuse, close/revoke/participant/block during read/write,
  forged/future/decreasing read advances, cursor tamper/cross-scope replay, human-versus-AI takeover
  and out-of-order adapter facts.
- A concurrent hidden note and client reply use separate CAS/order domains; both may commit without
  Client-visible note gaps, order/time/cursor/ETag/error/timing change, while close/block/revoke still
  fences the reply.
- Encryption tests prove ordinary/unexpected-PII bodies and derived handoff/translation summaries
  never persist in plaintext and KMS failure leaves no partial conversation, message, summary,
  outbox or audit record.
- Failure injection at encryption, initial revision insert, current-pointer update and outbox proves
  no accepted aggregate/counter/receipt exists without exactly one complete immutable revision.
- M011 tests prove no attachment is accessible from M012 before canonical safe promotion and current
  authorization; signed URLs/keys never enter M012.
- RLS/domain parity and normalized no-existence tests cover list/detail/count/cursor/search/read-state.
- Operations runbooks cover unavailable messaging, key/decryption failure, notification outage,
  abusive contact, accidental sensitive disclosure, legal hold/export and restore.

This proposed ADR does not authorize implementation, providers, AI, real messages, merge,
deployment or production use.
