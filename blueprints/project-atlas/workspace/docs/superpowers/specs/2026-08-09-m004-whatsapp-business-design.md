# M004 WhatsApp Business — Architecture and UX Design

- Date: 2026-08-09
- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Draft for Product Owner review
- Build authorization: None
- External activation: Deferred

## Decision summary

M004 will be an official WhatsApp Business channel adapter over the existing SG Solutions
conversation, consent, contact, scheduling, payment-link, handoff and audit boundaries. It will not
be a separate bot or CRM, and it will not use WhatsApp Web automation.

The architecture separates:

1. **Channel experience:** approved bilingual text, interactive actions, templates, delivery state
   and human handoff in WhatsApp.
2. **Shared communications domain:** conversation ownership, messages, consent/contact policy,
   receipts, assignment and audit reused with M003/M025.
3. **Provider infrastructure:** verified webhook ingress, official provider adapter, durable
   inbox/outbox, reconciliation, credentials and external readiness.

Real Meta/approved-provider activation remains deferred until SG Solutions has its institutional
account, number, templates, agreements, secrets and controlled evidence.

## Approaches considered

### 1. Independent WhatsApp bot with direct Meta logic

Rejected. It would duplicate conversations, contacts, consent, handoff and CRM state while coupling
business rules to one provider's payloads.

### 2. Third-party automation or WhatsApp Web session

Rejected. QR/browser-session automation, personal accounts and unofficial libraries create
suspension, security, continuity and audit risk and violate the approved source requirements.

### 3. Official channel adapter over the shared communication kernel — selected

The provider-specific edge authenticates and normalizes events. Shared domain services decide
identity context, consent, conversation ownership, allowed action and durable outcome. A direct Meta
adapter or approved BSP adapter can be activated later without changing the core.

This is the only approach compatible with the modular monolith, provider abstraction and
architecture-first activation policy.

## System shape

```text
WhatsApp user
  ↕
Official WhatsApp Business Platform / approved BSP
  ↕ signed callbacks + official send API
Next.js integration ingress in apps/app
  ├─ bounded streaming/method/type/deadline/concurrency gate
  ├─ provider challenge/signature verification
  ├─ durable ProviderEvent inbox
  ├─ provider payload normalization
  └─ bounded acknowledgement
       ↓
Shared communications application/domain
  ├─ Conversation + Message + Handoff
  ├─ Person/contact-channel binding
  ├─ Consent + ContactPolicy
  ├─ template/purpose policy
  ├─ M002 PublicKnowledgeProvider
  ├─ LeadIntakePort → M006 capture / M078 consent / M020 lead
  ├─ M013 SchedulingPort (M024 is internal calendar UI only)
  ├─ M043–M045 Payment/secure-link ports
  ├─ M011 DocumentIntakePort (later)
  ├─ M025 InboxPort (later)
  └─ Audit/observability ports
       ↓
Postgres
  ├─ operational conversation/contact/consent state
  ├─ durable event inbox and outbound outbox
  └─ reconciled provider projections

Inngest (future authorized runtime)
  └─ dispatch, retries, expiry and reconciliation; never business truth
```

The server-to-server webhook belongs in `apps/app`, not the Astro browser-facing M003 gateway. It
uses a narrowly exempted integration route that does not require an interactive Supabase session;
its authentication is the official provider challenge/signature contract. Business contracts
remain shared and provider-neutral. No separate service is justified initially.

## Shared versus M004-owned responsibilities

| Concern | Authority |
|---|---|
| Conversation/message/handoff ownership | Shared M003/M025 communications kernel |
| Person, lead, client and duplicate handling | M017/M020/Client domain |
| Consent evidence and contactability | M078 plus M006 channel-purpose policy |
| Appointment truth | M013 Postgres scheduler; M024 projects internal UI only |
| Financial truth and payment link | M043–M045 / Stripe projection |
| Document truth and media acceptance | M011 Document Center |
| Public answer content | M002 public published projection |
| External account/template/delivery state | Official provider, reconciled to Postgres |
| Webhook normalization and channel delivery | M004 adapter/inbox/outbox |
| Internal unified inbox | M025, consuming shared M004 conversations |

M004 owns channel transport and provider projections. It does not create `WhatsAppClient`,
`WhatsAppLead`, `WhatsAppAppointment`, `WhatsAppPayment` or a second case/document model.

## Experience design

### Automated opening

- Identify SG Solutions and state that the response is automated.
- Use the person's explicit language, with one concise limitations/privacy message.
- Offer a small set of high-value actions: services, evaluation, existing appointment, Help Center
  and a person.
- Do not imitate human typing, staff presence or response-time guarantees.

### Orientation conversation

- One purpose per message and short paragraphs suitable for a mobile chat.
- Up to a few provider-supported buttons/list actions plus a text fallback.
- M002 source links use approved exact destinations; no generated arbitrary URL.
- A low-confidence intent asks one bounded clarification, then offers human help.

### Optional preliminary intake — separate activation gate

- Disabled by default; the safe path is the structured web/portal form.
- If the Product Owner later approves WhatsApp intake, it uses only the exact M003 per-service field
  allowlist and provider-supported structured choices, never arbitrary free-text questioning.
- The complete draft is `Confidential`, first-party and short-lived. It is excluded from AI/model,
  RAG, moderation, translation, analytics, logs, fixtures and persistent evaluation.
- Approved interactive answers are stored once in the structured draft. The ordinary transcript
  keeps only a bounded response marker/opaque reference; free-text replies are not promoted.
- The activated WhatsApp provider necessarily transports each selection; approved terms/DPA,
  bilingual purpose/provider notice, consent, TTL/deletion and secure alternative are prerequisites.
- The prospect reviews the summary; only M006 evidence capture plus M078 consent and an M020
  idempotent promotion receipt create durable lead intake. Abandonment/expiry deletes the draft.

### Appointment flow

- Confirm named time zone before booking.
- Show only scheduler-provided availability and confirmation receipts.
- Cancellation/reschedule messages clearly say whether the action succeeded.
- Reminder timing/cadence remains configurable and Product Owner-gated.

### Payment/document/case flow

- A phone number is not a client login.
- Initial activation sends generic notices and a secure portal link; it does not reveal detailed
  status in WhatsApp.
- An unverified inbound sender receives only the generic portal entry route. A resource deep link is
  domain-initiated for an authorized binding, short-lived and still reauthorizes inside the portal.
- Payment links come only from the payment domain; card entry stays on Stripe-hosted UI.
- Inbound files are not fetched before the M011 quarantine path is active. The safe default is a
  portal upload link.

### Human handoff

- “Hablar con una persona / Talk to a person” remains available.
- Confirmation appears only after a durable inbox receipt.
- Honest hours/expectation copy is shown only after the Product Owner approves it.
- Automated replies stop while a human owns the conversation.
- If the inbox is unavailable, the message says no handoff was confirmed and gives an approved
  alternate route.

### Opt-out and errors

- Opt-out is processed before normal automation and receives a short approved confirmation.
- Errors say what did not happen and what safe action is available.
- Provider, CRM, calendar, payment, inbox and AI outages never produce fake success.

### Future Admin inbox

- Reuse the SG Solutions design system: Manrope/Inter, approved light-first tokens, accessible state
  labels and reduced motion.
- Queue views distinguish new, waiting, assigned, human-owned, failed, restricted and closed using
  text plus color/icon.
- Operators can take/return ownership, reply, apply a template, tag, link through an authorized
  workflow, create a task and request review. Provider raw payloads and secrets are not exposed.

## State and delivery design

### Durable inbound path

```text
receive raw callback
→ verify official challenge/signature
→ bounded parse/normalize supported event
→ atomically persist unique receipt + replayable canonical envelope
→ acknowledge transport
→ validate contact/conversation/policy context
→ apply once or route to manual review
→ record minimized audit/result
```

An authenticated event that cannot be normalized uses a separately isolated, encrypted, byte-
bounded raw-envelope quarantine with maximum classification, checksum, restricted access, short TTL
and approved deletion/legal-hold policy. Invalid-signature bodies are never retained. The system
never acknowledges a supported event after persisting metadata that is insufficient to replay it.

Before buffering, parsing or signature work, an adapter ingress manifest limits method,
Content-Type/content encoding, raw bytes, streaming read/total deadline, concurrency and rate. The
platform applies the stricter of its hard ceiling and the current provider contract; unsupported or
exhausted requests receive bounded `405/415/413/429`-class handling. IP allowlists are optional
defense in depth, never provider authentication.

### Durable outbound path

```text
owning domain issues notification intent
→ resolve subject/channel binding
→ check consent + purpose + opt-out + provider policy
→ resolve approved locale/template and server-owned variables
→ persist outbox command
→ persist dispatch attempt + adapter capability snapshot before I/O
→ dispatch through active official adapter
→ store provider receipt or mark dispatch_unknown
→ apply delivery/read/failure callbacks monotonically
→ reconcile unknown/gaps or open manual recovery; never blind resend
```

The provider may deliver events repeatedly and out of order. Unique provider IDs, stable idempotency
keys, versioned transitions and reconciliation produce exactly-once logical effects without claiming
exactly-once transport.

Provider request idempotency is an adapter capability, not an assumption. If a request may have
been accepted but its response is lost, the attempt enters `dispatch_unknown`. The system uses a
stable client reference/provider lookup when supported; otherwise it requires manual review or safe
expiry and does not retry blindly.

## Identity and authorization design

- A normalized phone endpoint can create a candidate contact association, not an authenticated
  client session.
- Matching is never disclosed to the sender and cannot merge people automatically in an ambiguous
  case.
- Channel bindings record verification method/evidence, verified/expiry times and failure/wrong-
  person/reassignment signals. Client-associated sends re-evaluate freshness at send time.
- Inbound control of a number may support public conversation but does not silently revalidate the
  linked client's identity. A stale or suspicious binding is suspended and revalidated only through
  a separately authenticated portal/channel; no relationship-revealing prompt is sent to the
  questionable number.
- Direct client/case/payment/document queries require Supabase identity plus domain resource grants
  through a separately approved projection. Initial M004 redirects to the authenticated portal.
- Provider callbacks are authenticated by the provider protocol, not by interactive staff/client
  auth.
- Staff replies and administration require Supabase identity, communications permission and inbox
  scope; high-risk actions receive audit and enhanced review.

## Consent and template design

- Consent is granular by channel and purpose: conversational response, service/transactional and
  marketing are not interchangeable.
- A customer-initiated message does not silently create marketing permission.
- Contact policy is re-evaluated before every initial send and retry under a per-binding policy
  fence. Each outbox command carries the expected policy version.
- A deterministic supported opt-out match writes `opt_out_pending` with the canonical inbound event
  before acknowledgement. It takes priority for that binding; applying withdrawal increments policy
  version and atomically cancels queued promotional commands/retries.
- Dispatch obtains the same binding lock immediately before provider I/O. Pending/withdrawn or stale
  policy blocks the send. An ambiguous control message goes to audited review and cannot create
  consent.
- Template definitions are reviewed, bilingual, versioned and typed internally; provider approval
  is a reconciled external projection.
- A provider-approved template can still be blocked by SG policy, opt-out, locale or resource
  authorization.
- Marketing remains disabled until a separate Product Owner decision.

## Media design

- The normal webhook stores only bounded media envelope data; it does not expose a public media URL.
- Before M011 activation, no media fetch occurs and the user receives a secure-upload route.
- A later fetch writes only to quarantine and uses the smaller of provider and SG Solutions limits.
- Current SG policy accepts PDF/JPEG/PNG only after content validation and clean malware verdict;
  HEIC, archives, executables and unsupported/encrypted content fail closed unless the upload policy
  is later amended.
- Promotion requires an authorized conversation/person/case target and cannot be inferred from a
  phone match.

## Security design

- Verify signatures over the untouched body where the selected provider protocol requires it.
- Bound method, content type/encoding, streaming bytes, read/total time, concurrency and rate before
  buffering/parsing; reject unsupported/compressed/oversized/slow input without retaining its body.
- Persist the authenticated event before side effects; deduplicate/reconcile every callback.
- Persist the receipt and replayable canonical envelope in one pre-acknowledgement transaction. An
  enabled authenticated-unknown raw quarantine is Highly Sensitive by default, encrypted,
  byte-bounded, access-restricted and short-lived; invalid-signature bodies are not retained.
- Provider credentials and account identifiers remain server-side in approved stores with rotation,
  revocation and suspension runbooks.
- Validate schemas, event types, lengths, Unicode, interactive payloads and media metadata.
- Reject secrets/Highly Sensitive content before ordinary persistence, model use or telemetry; do
  not echo it.
- Message/media bodies, phone numbers, raw payloads, template variables, prompts and secure links are
  absent from logs, Sentry, OTel, PostHog and audit payloads.
- Optional intake uses the M003 structured allowlist, is Confidential as a complete draft and is
  excluded from every AI/moderation/translation/telemetry/evaluation path; it remains disabled until
  provider/privacy consent and TTL/deletion are approved.
- Links resolve from server-owned keys through exact allowlists and scoped expiration.
- User/model/provider text is never permission or an executable command.
- Contract fakes are test-only and cannot be configured in production.
- Provider activation requires current official-policy validation because external rules evolve.

## Failure and recovery design

- **Meta/provider unavailable:** suspend outbound dispatch, retain outbox, show verified alternate
  web/email/portal route and reconcile later.
- **Ambiguous send timeout:** retain `dispatch_unknown`, show no success, reconcile by declared
  adapter capability and never automatically resend.
- **Credential invalid:** fail closed, suspend connection, alert the owner and follow rotation
  runbook.
- **Template unavailable:** do not choose a semantically different template; manual review.
- **Consent denied/withdrawn:** permanent policy denial for that attempt; no retry until new evidence.
- **STOP races dispatch:** per-binding fence and policy-version check block not-yet-sent work;
  withdrawal cancels queued promotional commands atomically and an already-ambiguous provider
  attempt follows `dispatch_unknown` reconciliation without resend.
- **Contact ambiguous:** public response remains generic; staff resolves candidate linkage.
- **Binding stale/reassigned/wrong person:** suppress protected transactional content, suspend the
  binding and create revalidation work on a separately verified surface.
- **Dependency unavailable:** never claim lead, booking, payment, document or handoff success without
  a durable receipt.
- **Unknown provider event:** quarantine/manual review without mutating business state.
- **Audit unavailable:** sensitive mutations fail closed or remain pending under the durable audit
  outbox contract.

## Testing strategy for a future Build gate

- Provider contract tests for challenge, signature, inbound normalization, outbound requests,
  templates, statuses and media envelopes.
- Ingress resource tests for oversized, unsupported/compressed, slow-stream, concurrency and rate
  exhaustion before parsing/signature CPU work.
- Duplicate, delayed, out-of-order, replay and retry tests proving one logical outcome.
- “Provider accepted + response lost” tests for adapters with and without provider idempotency/
  lookup support, proving no blind duplicate send.
- Crash-after-ack tests proving every supported event resumes from its canonical envelope without
  the original request; quarantine expiry/access tests for authenticated unknown envelopes.
- Identity/authorization tests proving phone/contact match does not reveal or grant resources.
- Recycled-number/freshness tests proving old consent, prior delivery or inbound possession cannot
  bypass expiry, wrong-person/reassignment suspension or separately authenticated revalidation.
- Consent tests for separate purposes, opt-out priority, retry-time checks and re-consent.
- Optional-intake tests for disabled-by-default behavior, exact field allowlist, consent/provider
  notice, single-copy structured values plus marker-only transcript, TTL deletion, forbidden Highly
  Sensitive/free-text promotion, zero AI/telemetry/evaluation exposure and receipt-only promotion.
- Concurrency/property tests for simultaneous supported opt-out versus queued/dispatching/retrying
  commands, proving the durable fence prevents post-withdrawal promotional sends.
- Template tests for locale parity, version, typed variables, blocked state and allowlisted links.
- Security tests for malformed payloads, invalid signature, secret/PII rejection, prompt injection,
  rate limits, media policy and telemetry redaction.
- Failure-injection tests for provider, CRM, scheduler, payment, inbox, AI and audit outages.
- Spanish/English conversation, accessibility and future Admin inbox keyboard/zoom tests.
- Production configuration test proving no test fake can be selected.
- Controlled activation test with synthetic/non-sensitive accounts before real client traffic.

## Delivery slices without rework

1. **Architecture approval:** PRD, this design, ADR 008, contracts, threat boundaries and activation
   checklist.
2. **Shared/local Build (future gate):** canonical channel domain, durable inbox/outbox, consent,
   templates, provider contract tests and honest disabled/manual mode. No live-message claims.
3. **Official adapter activation:** account/number, secrets, webhook, current policy and controlled
   sandbox/production evidence.
4. **Operational adapters:** leads, scheduling, inbox and generic transactional notifications as
   their owning modules become active.
5. **Secure extensions:** portal-safe status and M011 media handoff after independent IAM/document
   review.
6. **Optional intelligence/marketing:** bounded AI and separately approved campaigns only after
   consent, evaluation, cost and compliance gates.

Every slice extends the same contracts. None is `Operational` merely because an adapter compiles or
a local fake passes.

## Approval boundary

Product Owner approval accepts this provider-neutral M004 architecture, the normalized PRD and
proposed ADR 008. It does not choose the provider/number, approve final templates or legal copy,
authorize `GENERATE`, enable media, activate marketing, add credentials, merge, deploy or send a
live message.
