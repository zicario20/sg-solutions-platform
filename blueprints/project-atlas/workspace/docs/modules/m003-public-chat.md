# Module PRD — M003 Public Chat and Orientation Assistant

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Surface: Public; shared conversation kernel prepared for later Client/Admin adapters
- Domain: Public Acquisition / Communications
- Release: R7 target capability with an architecture slice prepared during current discovery
- Status: Draft for Product Owner approval — architecture only; no Build gate
- Last updated: 2026-08-09
- External readiness: `External activation deferred` in `EXTERNAL_ACTIVATION_REGISTER.md`

This PRD normalizes the Product Owner-supplied M003 source requirements to the approved Project
Atlas architecture. It preserves the full target capability while separating provider-neutral
architecture from live account activation. Approval of this document advances the Product gate; it
does not authorize code, credentials, provider traffic or production release.

## 1. Purpose

Provide a bilingual, clearly identified automated orientation channel on the SG Solutions public
website. It helps a visitor understand services, find approved Help Center information, choose a
safe next step and request a human without pretending to deliver professional services.

The shared conversation kernel must support later adapters for authenticated client support and the
internal unified inbox, but M003 itself never grants portal access or direct access to operational
records.

## 2. Business value

- Answer common questions at the moment a prospect is considering a service.
- Route visitors to the appropriate service, public resource, evaluation, quote or human contact.
- Reduce repetitive intake while preserving human authority and honest limitations.
- Create a governed path from conversation to lead or appointment only after explicit user action.
- Establish reusable conversation, handoff, consent and provider contracts for future channels.
- Keep public AI grounded in the approved M002 Help Center instead of uncontrolled web knowledge.

## 3. Scope

### Architecture and behavior target

- Responsive public chat launcher, panel and full-page accessibility fallback on the Astro website.
- Spanish and English UI with explicit language control and bounded automatic language suggestion.
- Anonymous conversation session with an opaque, revocable session credential.
- Text-message exchange, service/intent routing and approved quick actions.
- Retrieval only from current, public, published M002 Help Center projections.
- Source links and a visible distinction between retrieved guidance and navigation actions.
- Model-provider, moderation-provider and public-knowledge interfaces with fail-closed adapters.
- Deterministic guided-assistant mode when no live model is enabled; it must be labeled accurately
  and may only search/rank approved public content and show predefined next actions.
- Human handoff request and durable handoff state prepared for M025 unified communications.
- Optional conversion to lead/contact through M006 capture, M078 consent and M020 lead contracts
  after separate contact and marketing-consent capture; anonymous chat use alone does not imply
  marketing consent.
- Optional appointment handoff through the M013 scheduling contract when activated; M024 is internal calendar UI only.
- Bounded preliminary intake schemas for Credit, Taxes, Business Formation, Business Funding and
  Home Buying. Session answers remain drafts until the visitor confirms a structured M006 capture
  submission and its applicable M078 consent actions.
- Future read-only authenticated tools for safe case progress, pending client tasks, missing-
  document counts, next appointment and payment projection; each remains owned and authorized by
  its source domain.
- Future read-only Marketplace discovery for approved offers, disclosures and interest/referral
  handoff without automatic application or data sharing.
- Future internal administration and evaluation surfaces for configuration, conversation review,
  intent correction and test datasets; corrections never train or publish automatically.
- Rate limiting, abuse controls, prompt-injection defenses, PII/secret rejection, audit and
  minimized analytics contracts.
- Conversation closure, expiry, safe recovery and provider-readiness states.
- Architecture for later authenticated context through a separate trusted gateway; no public
  endpoint may accept a claimed client identity or resource ID as proof of access.

### Current authorized slice

- PRD, UX/architecture design, contracts, states, threats, acceptance criteria and deferred
  activation record.
- No M003 application code until the Product Owner separately approves `GENERATE` and a Build gate.

## 4. Explicit out of scope

- Professional tax, credit, legal, lending, mortgage, insurance or investment advice.
- Preparing, submitting or signing filings, disputes, applications, contracts or other services.
- Approving credit, loans, mortgages, products, refunds, eligibility, prices or outcomes.
- Marking a payment confirmed or altering a case, task, document, appointment or entitlement.
- Accepting card numbers, SSN/ITIN, bank credentials, passwords, tax documents, credit reports or
  file attachments in public chat.
- Direct browser, model or provider access to Postgres, Supabase service credentials or private
  Storage.
- Authenticated case/payment/document status before M007, portal projection and relevant domain
  authorization contracts are implemented and independently reviewed.
- Live WhatsApp, telephony, SMS, social-media or email channel behavior owned by M004, M005,
  M025–M026 and M096.
- A complete contact-center product, general-purpose web-search bot or autonomous agent platform.
- Production model, moderation, CRM, scheduling or notification connections before their activation
  gates close.

## 5. Actors

- Anonymous public visitor.
- Identified prospect who explicitly submits contact information.
- Existing client using the public website without authenticated portal context.
- Future authenticated client using a separate portal adapter.
- SG Solutions human operator receiving a handoff.
- Product Owner or delegated content/compliance reviewer.
- Public Chat Gateway.
- Conversation domain service.
- M002 public knowledge adapter.
- Future model, moderation, lead, scheduling, inbox and notification adapters.
- Abuse-control, audit and observability services.

## 6. User journeys

### General orientation

1. The visitor opens the chat, sees that it is automated, selects or confirms a language and reads
   the short privacy/limitations notice.
2. The visitor asks a general question.
3. The gateway validates and moderates the message before any model or knowledge call.
4. The assistant returns a concise answer grounded in current M002 content, provides source links
   and offers a small number of relevant next actions.

### Service discovery

1. The visitor selects or describes a need.
2. The service maps the message to one of the approved intents with a confidence band.
3. Low confidence triggers a clarifying choice, not a fabricated answer.
4. The visitor receives a neutral explanation and an evaluation/quote/help option.

### Lead conversion

1. The visitor chooses to be contacted.
2. Chat opens the canonical M006 structured capture step, separate from message text.
3. Required contact-use notice and optional marketing consent are presented distinctly.
4. After validated submission, M006 returns a generic receipt while M020 handles the lead candidate;
   M003 displays that receipt without claiming assignment or response time that is not confirmed.

### Appointment handoff

1. The visitor selects “Schedule an evaluation.”
2. M003 requests only public availability from the scheduling contract.
3. The visitor completes the canonical booking flow; M003 does not hold a slot itself.
4. The chat shows confirmed details only from the scheduler response.

### Secure payment-link handoff

1. A visitor or authenticated client requests to pay an authorized quote/service order.
2. M003 sends only the opaque payable reference and caller authorization context to the M043–M045
   payment domain; it never accepts an amount, price, discount or destination URL from chat text.
3. The payment domain verifies ownership/access, approved price, payable state and activation, then
   returns an idempotent, expiring payment-link receipt.
4. M003 renders only the owning domain's allowlisted secure link and never asks for card data.
5. Payment success is displayed only after the read-only reconciled payment projection confirms it.
   A receipt is shown only through an authenticated/authorized link from the owning domain.

### Human handoff

1. A visitor asks for a person, reports a complaint, repeats an unresolved question or triggers a
   policy rule.
2. The conversation enters `human_requested` and then `waiting_for_human` only after a durable
   handoff receipt exists.
3. The visitor sees honest availability and fallback options.
4. A future authorized operator may accept the handoff; AI is suspended while `human_active`.

### Sensitive-data attempt

1. The visitor enters a prohibited secret or highly sensitive identifier.
2. Client-side hints and server-side validation reject the message before persistence/provider use.
3. The UI explains what not to send and points to the future secure portal or a human route.
4. The audit records only a reason code and correlation ID, never the rejected content.

### Preliminary intake

1. After identifying a service, the assistant offers a short optional intake and explains its
   purpose.
2. It asks only the approved, non-secret fields for that vertical and allows “prefer not to answer.”
3. Answers stay in the current session until the visitor requests contact and confirms the
   structured summary.
4. M006 owns form validation/evidence capture, M078 owns consent, and M020 owns duplicate handling
   and durable lead creation. M003 displays success only from its receipt.

Approved preliminary fields are:

- Credit: goal, state, optional approximate score band, report access, expected purchase and general
  issue category.
- Taxes: tax year, W-2/1099 availability, state, self-employment, dependents and document readiness.
- Business Formation: formation state, desired name, activity, member count, address/registered-
  agent readiness and goal. The chat never files the entity.
- Business Funding: business type, age band, approximate revenue band, goal, requested amount band
  and use of funds. The chat never promises approval.
- Home Buying: state, county, approximate income band, household size, approximate credit band,
  first-home indicator, goal and expected purchase period. The chat never determines eligibility.

### Provider outage

1. The model, knowledge or moderation provider is unavailable.
2. The service fails closed for generated answers and does not invent success.
3. Approved deterministic navigation, Help Center search and human/contact fallbacks remain usable.

## 7. States and transitions

### Conversation state

`new → ai_active → human_requested → waiting_for_human → human_active → returned_to_ai → closed`

Additional terminal/control states are `expired` and `restricted`.

- `new → ai_active`: notice acknowledged and the first valid message is accepted.
- `ai_active → human_requested`: visitor or policy requests human review.
- `human_requested → waiting_for_human`: handoff service returns a durable receipt.
- `waiting_for_human → human_active`: an authorized operator accepts the handoff.
- `human_active → returned_to_ai`: operator explicitly releases the session and the visitor agrees
  to resume automated assistance.
- Any active state may become `closed` by the visitor/operator or `expired` after the approved
  inactivity period.
- Abuse/moderation policy may move an active conversation to `restricted`; only a policy-authorized
  action may restore it.
- The assistant may not respond while `human_active`.

Every transition uses optimistic concurrency (`version`) and an idempotency key. Illegal or stale
transitions fail without mutating the conversation.

### Identity context

`anonymous` may become `identified_prospect` only through validated M006 capture. It may become
`authenticated_client` only through the future trusted portal gateway after Supabase Auth and
domain authorization. Email matching, user statements or model inference never change identity.

### Message state

`received → validated → moderated → accepted → responding → answered|failed|handoff_required`

Rejected messages record only a bounded reason code. Provider retry never creates a second visible
answer for the same message/idempotency key.

### Provider readiness

`disabled → configured → sandbox_verified → production_verified → active → suspended|retired`

Provider readiness is operational configuration, not conversation or module state. `disabled`
selects the safe deterministic/fallback path.

## 8. Business rules

- The assistant always identifies itself as automated and never claims to be a person.
- It provides general orientation, not professional services or individualized decisions.
- It never guarantees score changes, approvals, funding, tax outcomes, home eligibility, price,
  timing or results.
- Only public, published and current M002 records may ground public answers.
- The system may summarize approved content but must preserve material limitations, source identity
  and no-partnership disclosures.
- The assistant asks at most one necessary clarifying question before offering bounded choices or a
  human route.
- Marketing consent is optional, purpose-specific and separate from chat-processing notice.
- A lead, appointment or handoff exists only after its owning service returns a durable receipt.
- Payment status comes only from the approved Stripe/payment projection; M003 cannot infer or alter
  it.
- A public visitor is never treated as an authenticated client because they know an email, case
  number or other identifier.
- Human handoff suspends AI responses until an authorized return transition.
- The application must expose provider/fallback readiness honestly; no fake typing, booking,
  submission or human-presence success.
- Conversation message input is limited to 2,000 Unicode characters and plain text in the initial
  design. Limits remain server-enforced and configuration-controlled.
- Preliminary intake uses progressive structured choices where possible. It does not request exact
  SSN, account numbers, credentials, tax amounts, card data or document uploads.
- A persistent summary, lead link, contact link, client link, case link, service/order link,
  appointment link or outcome is created only by its owning service and only after applicable
  identity/consent checks.
- A payment link requires an authorized quote/service order and approved price. M003 cannot provide
  an arbitrary amount, alter price, add a discount, build a Stripe URL, infer payment success or
  expose a receipt without the payment domain's authorization.
- Future Marketplace results may show only active approved offers and disclosures. The chat never
  declares one “best,” guarantees approval, applies without consent or shares data automatically.

### Approved intent taxonomy

`general_information`, `credit_service`, `credit_monitoring`, `tradelines`, `tax_service`,
`business_formation`, `ein_service`, `business_funding`, `home_buying`, `marketplace_product`,
`appointment`, `payment_question`, `document_question`, `case_status`, `technical_support`,
`complaint`, `human_request`, `other`.

Intent is routing metadata, not evidence of eligibility or permission.

## 9. Authorization rules

- Anonymous access is limited to public knowledge, public actions and the visitor's own opaque chat
  session.
- Public session credentials are high-entropy, scoped, short-lived, revocable and never accepted in
  query strings or analytics.
- Conversation reads/writes require the valid session credential plus server authorization; knowing
  a conversation ID is insufficient.
- Internal operators require Supabase identity, an internal role and assigned/inbox scope.
- Authenticated client context requires identity, delegated resource access and a portal-safe domain
  projection. M003 never queries operational tables directly.
- Internal notes, audit evidence, model prompts, risk signals and staff-only messages never become
  client/public visible by inheritance.
- Provider credentials remain server-side and provider calls receive only the minimum allowlisted
  context.
- RLS, domain services and future Storage policies enforce the same boundary; UI hiding is not an
  authorization control.

## 10. Data requirements

### Conversation

Opaque ID, version, surface, actor context, locale, status, selected intent, consent-snapshot
reference, public-session credential hash, provider mode, created/updated/last-activity timestamps,
handoff/close/expiry timestamps, minimal risk flags and correlation ID.

### ConversationMessage

Opaque ID, conversation ID, actor type (`visitor|assistant|human|system`), locale, plain-text body,
state, public-source citations, model/provider reference, policy version, created timestamp,
idempotency key and error/rejection reason code. Message bodies are `Confidential`; they never enter
analytics, traces, general logs or Sanity.

### ConversationHandoff

Opaque ID, conversation ID, reason code, requested/queued/accepted/closed timestamps, assigned
operator reference when authorized, status, source channel, fallback offered and correlation ID.

### ChatConsent

Conversation ID, notice version, purpose, locale, affirmative action, timestamp and optional M078
consent-record reference. Marketing consent is a separate purpose/record.

### Derived routing data

Intent, confidence band (`high|medium|low|unknown`), selected service key, knowledge record IDs and
next-action key. Derived metadata does not contain raw message content.

### PreliminaryIntakeDraft

Conversation ID, service key, schema version, locale, allowlisted answer keys, completion state and
updated timestamp. It is session-scoped by default. Promotion to durable lead/intake data requires
the confirmed M006 capture command, M078 consent evidence and M020 lead handoff; the conversation
repository does not become a second CRM.

### Operational linkage projection

Optional opaque references returned by owning domains: lead, contact, client, case, service order,
appointment and referral interest; plus summary, outcome and assigned-operator reference where
authorized. Public projections never expose raw internal IDs.

### Prohibited persistence

Full payment-card data, CVV, credentials, access tokens, SSN/ITIN, bank account/routing data, tax
documents, credit reports, government IDs and rejected sensitive input. The public chat has no file
object or attachment schema.

Exact retention and deletion periods remain a Product Owner/legal decision. Until approved, Build
cannot enable durable production transcript retention.

### Data classification matrix

| Record/field group | Class | Storage and provider boundary |
|---|---|---|
| Public source IDs, published citations and approved CTA keys | Public | May use public projection; never mixed with transcript text in analytics |
| Provider/channel readiness, policy version and non-sensitive feature configuration | Internal | Approved configuration store/Postgres; staff least privilege |
| Conversation metadata and session linkage | Confidential | First-party Postgres only; opaque IDs in telemetry |
| Message body and approved first-party transcript | Confidential | Purpose-specific M003 store only; never Sanity, analytics, traces, logs, tickets or developer/agent chats |
| Handoff summary, assignment and operator message | Confidential | First-party Postgres; assigned staff/inbox scope and audited access |
| Consent evidence and lead/contact/client/case/service/payment linkages | Confidential | Owning domain/Postgres; public view receives only a safe receipt |
| Preliminary intake values, including approximate score/income/revenue/amount bands, dependents and household size | Confidential as a complete draft | Structured UI outside the free-text prompt; no analytics/logs/traces/model provider; session TTL and deletion apply |
| Payment/case/task/document/appointment projection | Confidential, or higher if source data requires | Read-only safe projection from owning domain; no raw operational record or caching in public chat |
| Evaluation result metadata: status, reason code, evaluator, policy/model version and opaque references | Internal unless linked payload raises the class | Store bounded metadata only; reference authorized transcript rather than copy content |
| First-party evaluation view of a real response | Confidential | Resolve an authorized transcript reference at view time; do not copy the body into the evaluation record |
| Persistent evaluation dataset or external model-comparison payload | Public or Internal only | Approved public/synthetic or policy-verified de-identified corpus; raw conversation/intake content prohibited |
| SSN/ITIN, full bank/card/account values, tax/credit documents, credentials and government IDs | Highly Sensitive and prohibited in M003 public chat | Reject before persistence/provider use; reason code only |

Mixed records inherit the highest class. Preliminary intake is collected through structured
controls outside the model prompt. Its values are not sent to model, moderation or translation
providers. Before lead/contact promotion it is session-scoped and deleted on expiry/abandonment
under the approved retention policy. If future scope introduces any Highly Sensitive field, M003
must reject it or obtain a new threat/ADR 005 boundary and Product Owner approval; it may not silently
upgrade this draft.

The canonical first-party M003 transcript is the only proposed purpose-specific exception to the
general prohibition on copying Confidential content into chat histories. It requires explicit
notice/consent, approved retention/legal hold/deletion, least-privilege access, audit and Product
Owner acceptance. Production body retention remains disabled until those decisions are closed.

## 11. API or service contracts

All commands accept a correlation ID, idempotency key where mutating and an authenticated caller or
opaque public-session context. Responses are versioned discriminated unions; they never return raw
provider errors.

### Public gateway

- `POST /api/public/chat/conversations` creates a bounded session after notice acknowledgment.
- `POST /api/public/chat/conversations/{id}/messages` validates, moderates and routes one message.
- `GET /api/public/chat/conversations/{id}` returns the visitor-safe transcript projection.
- `POST /api/public/chat/conversations/{id}/handoff` requests human assistance idempotently.
- `POST /api/public/chat/conversations/{id}/close` closes the visitor's session idempotently.

The gateway is implemented by Astro on-demand server routes in `apps/www` under the same public
origin, as proposed by ADR 007. Marketing/Help Center pages remain prerendered. It rejects
credentialed cross-origin calls and stores the session token in a host-only
`__Host-atlas_public_chat` cookie with `Secure`, `HttpOnly`, `Path=/`, no `Domain` and explicit
`SameSite=Lax`. Every unsafe method validates the exact canonical `Origin`, Fetch Metadata when
available and a synchronizer CSRF token bound to the session and held only in page memory. API
bodies never accept role, client, case or permission claims.

Session secrets are high-entropy and hashed at rest, rotate when identity/context is elevated or a
human accepts handoff, expire under the approved policy and revoke on close/restriction. Negative
contracts cover hostile origins and sibling subdomains, absent/invalid CSRF tokens, replay, stale
versions and revoked cookies.

### Domain ports

- `ConversationService.start(context, noticeVersion, locale)`.
- `ConversationService.acceptMessage(context, conversationId, text, idempotencyKey)`.
- `ConversationService.requestHandoff(context, conversationId, reason, idempotencyKey)`.
- `ConversationService.close(context, conversationId, idempotencyKey)`.
- `PublicKnowledgeProvider.search(locale, query, filters) → PublicKnowledgeResult[]`.
- `PublicKnowledgeProvider.getByIds(locale, ids) → current public records only`.
- `ChatModelProvider.respond(policyContext, groundedContext, message) → structured response`.
- `ModerationProvider.classify(message) → allow|clarify|handoff|reject + reason code`.
- `TranslationProvider.translateApprovedDraft(sourceLocale, targetLocale, contentRef)` is optional and
  limited to a review workflow; it cannot publish or supply final high-risk copy automatically.
- `MessagingProvider.sendAuthorizedHumanMessage(context, message, idempotencyKey)` is available only
  after M025/channel activation and never to the public model as a generic tool.
- `NotificationProvider.notifyOperator(handoffReceipt, idempotencyKey)` emits an internal notice
  after an accepted handoff receipt; notification failure does not change handoff truth.
- `LeadIntakePort.createFromChat(structuredCapture, consentEvidence, idempotencyKey)`.
- `PublicSchedulingPort.listAvailability(type, locale, zone)` and canonical booking handoff.
- `HumanHandoffPort.enqueue(conversationProjection, reason, idempotencyKey)`.
- `ClientStatusQueryPort.getSafeCaseStatus(authzContext, caseGrant)`.
- `ClientStatusQueryPort.getPendingClientTasks(authzContext, caseGrant)`.
- `ClientStatusQueryPort.getMissingDocumentSummary(authzContext, caseGrant)`.
- `ClientStatusQueryPort.getNextAppointment(authzContext, caseGrant)`.
- `PaymentStatusQueryPort.getServiceOrderPaymentStatus(authzContext, serviceOrderGrant)`.
- `PaymentActionPort.createSecurePaymentLink(authzContext, payableRef, idempotencyKey) →
  PaymentLinkReceipt { receiptId, approvedRedirectRef, expiresAt }`.
- `PaymentReceiptQueryPort.getAuthorizedReceiptLink(authzContext, paymentGrant) →
  AuthorizedReceiptLink`.
- `MarketplaceDiscoveryPort.listApprovedOffers(publicContext, filters)`.
- `MarketplaceDiscoveryPort.recordInterest(consentContext, offerId, idempotencyKey)`.
- `AuditPort.record(minimizedEvent)`.

`ChatModelProvider` has no generic database, network, browser or arbitrary tool capability. Tool
access uses a fixed server-side registry with schema-validated inputs, authorization before I/O and
read-only public knowledge in the initial public scope.

### Response contract

The visitor response contains only message text, locale, bounded citations, next-action keys,
handoff state and a public error/status code. It excludes prompts, chain of thought, policy details,
confidence scores, staff identity, provider secrets and operational record identifiers.

## 12. Events and background jobs

### Domain events

`chat_opened`, `chat_conversation_started` (`chat_started` analytics projection),
`chat_message_accepted`, `chat_message_rejected`, `language_detected`,
`chat_response_completed`, `chat_response_failed`, `chat_intent_selected`,
`chat_handoff_requested`, `chat_handoff_queued`, `chat_handoff_accepted`,
`chat_handoff_closed`, `chat_conversation_closed`, `chat_conversation_expired`,
`chat_lead_receipt_linked` and `chat_booking_receipt_linked`.

Events carry opaque IDs, locale, reason/status codes, provider mode, timing bucket and policy
version. They exclude message bodies, contact details, exact IP addresses, case/payment/document
content and model prompts.

The minimized analytics projection may emit the source-required names `chat_opened`, `chat_started`,
`language_detected`, `intent_classified`, `faq_answered`, `lead_created`, `appointment_offered`,
`appointment_booked`, `payment_link_shared`, `human_handoff_requested`,
`human_handoff_completed`, `chat_closed`, `chat_abandoned` and `no_answer_found`. Receipt-dependent
events are emitted only after the owning service confirms the result. PostHog transport remains
disabled until M092 consent/minimization activation; event names do not imply vendor delivery.

### Background jobs

- Expire inactive sessions and schedule approved transcript deletion.
- Deliver handoff/operator notifications after M025/M026 activation.
- Retry transient provider/handoff operations with bounded attempts and the same idempotency key.
- Reconcile stuck `responding` or `human_requested` states.
- Re-evaluate provider health and switch to safe fallback without changing business state.

Inngest may coordinate these jobs later, but Postgres owns durable state. Every job has an
idempotency key, maximum attempts, dead-letter/manual recovery path and auditable result.

### Administration and training contracts

Future authorized internal users may enable/disable the channel, configure approved greeting and
quick actions, select an activated provider/model, set technical limits, configure handoff routes,
review failures, inspect scoped conversations, correct intent labels and execute evaluation
datasets. Support hours, retention, legal notices and model selection remain Product Owner-controlled
configuration where this PRD marks a decision.

An evaluation record may mark a response correct/incorrect, assign a bounded reason, propose an
approved answer/FAQ or intent example and compare model outputs. Bounded result metadata is
`Internal`; it references the authorized transcript rather than copying it. A first-party reviewer
may resolve that reference under the transcript's `Confidential` access, retention, deletion and
audit controls. Persistent evaluation datasets and external model comparisons use only approved
public/synthetic content or material verified as de-identified under an explicit policy; raw
conversation bodies and every preliminary-intake value are prohibited. External comparison also
requires an activated provider/DPA and approved corpus. No correction automatically fine-tunes a
model, updates prompts, publishes M002 content or changes a production policy; those actions follow
their own review/approval workflow.

## 13. Error states and recovery

| Failure | User-visible behavior | Durable/recovery behavior |
|---|---|---|
| Invalid/oversized message | Explain the limit without echoing sensitive text | Reject before provider call; bounded reason only |
| Suspected secret/Highly Sensitive data | Ask user not to send it and offer secure/human path | Do not persist body; audit reason code only |
| Moderation unavailable | No generated answer | Fail closed; offer Help Center/human/contact fallback |
| Knowledge unavailable/stale | No unsupported factual answer | Use navigation-only fallback; alert/reconcile later |
| Model unavailable/timeout | Honest temporary-unavailable state | Deterministic public search or human path; bounded retry |
| Duplicate message/request | One visible result | Idempotency record returns prior result |
| Stale state/concurrent transition | Ask user to refresh/retry | Optimistic-concurrency conflict; no partial transition |
| Handoff adapter unavailable | Do not say a person was notified | Keep `human_requested`; show alternate contact path |
| Lead/booking service unavailable | Do not claim submission/booking | Preserve chat; redirect to honest fallback |
| Payment-link/status provider unavailable | Do not create a link or confirm payment | Keep payable state unchanged; offer retry/human path and reconcile through M043–M045 |
| Session expired/revoked | Explain and offer a new session | No old transcript access; retain/delete per policy |
| Abuse threshold reached | Bounded restriction message | Rate limit/restrict with privacy-preserving evidence |
| Two consecutive unresolved/failed attempts | Offer human assistance and alternate routes | Record bounded failure count; do not keep generating guesses |

Manual recovery must never require editing production tables from the Supabase dashboard.

### Performance and availability behavior

- Chat assets are lazy-loaded on intent/idle and may not block M001 content, navigation or Core Web
  Vitals budgets.
- Opening the panel immediately renders a local accessible state; network/model work never blocks
  the page thread.
- Every provider call has a bounded timeout, circuit-breaker/readiness state and deterministic
  fallback. A timeout never holds the composer indefinitely.
- A bounded queue preserves accepted work without duplicate messages. Session recovery uses the
  opaque session credential and last confirmed version.
- Safe progressive rendering is permitted only after the response contract and output policy can
  validate emitted chunks. Otherwise the response is buffered and validated before display; raw
  unreviewed model tokens are never streamed merely to appear faster.
- Typing/progress indicators reflect actual processing and stop on timeout, cancellation, handoff or
  error.

## 14. Security and privacy requirements

- Treat all visitor, knowledge and provider output as untrusted input.
- Validate Unicode, length, control characters and schemas on the server.
- Detect and reject common secrets/highly sensitive identifiers before persistence or model calls;
  client-side detection is convenience only.
- Use output encoding and allowlisted Markdown/text rendering; no arbitrary HTML, scripts or model-
  supplied URLs.
- Resolve citations from trusted record IDs through M002; never render a model-created URL directly.
- Enforce the exact ADR 007 cookie/Origin/CSRF contract; CORS or `SameSite` alone is never treated as
  CSRF protection.
- Enforce per-session and privacy-preserving network/device rate limits with configurable thresholds;
  do not retain raw IP addresses in normal analytics.
- Separate system policy from knowledge and user text; delimit context and ignore instructions that
  request secrets, role changes, policy disclosure or unapproved tools.
- Tool calls use explicit schemas, allowlists, authorization and least privilege before execution.
- Never place message bodies, prompts, contact data or provider responses in Sentry, OTel, PostHog,
  application logs or audit payloads.
- Record model/provider/policy versions and result codes for accountability without chain of thought.
- Encrypt in transit and rely on managed encryption at rest; any future Highly Sensitive chat field
  requires a new threat review and ADR 005 boundary, not an `_encrypted` name.
- Staff transcript access requires business need, assigned role/scope and an audit event.
- Security-sensitive implementation requires Cyber Neo and independent review; live activation also
  requires provider-specific threat/runbook validation.

## 15. UX and accessibility requirements

- The launcher has an accessible name, visible focus, 44×44 CSS px minimum target and does not
  obstruct primary content, cookie controls or mobile navigation.
- The panel uses a real dialog/region pattern selected during implementation testing, predictable
  focus entry/return and no keyboard trap.
- A full-page chat route provides an alternative to the floating panel and supports deep links.
- The automated identity, privacy boundary and human option are visible before the first message.
- Messages use semantic groups, text labels and timestamps/statuses; color is never the only signal.
- New responses announce politely without repeatedly moving focus. Errors use assertive announcement
  only when action is blocked.
- Quick replies are real buttons, remain keyboard accessible and never replace free-text/human paths.
- Typing/progress states are truthful; no artificial human typing or fake queue position.
- The design reuses approved Manrope/Inter, navy/cobalt/cyan/green/gold tokens, generous whitespace
  and subtle motion. Reduced motion removes nonessential transitions.
- Support 320, 375, 768, 1024, 1280 and 1440 px, 200% zoom, high contrast, screen readers and touch.
- At 320 px the panel becomes a safe near-full-screen sheet without horizontal overflow.
- The next action is always clear: continue, open source, schedule, request contact, ask human or
  close.

## 16. Bilingual requirements

- Spanish and English have complete UI strings, notices, validation, errors, fallbacks, quick
  actions, citations and handoff states.
- The visitor may change language at any time; the choice persists for that conversation.
- Automatic detection only suggests or initializes locale. It never overrides an explicit choice.
- A response uses one locale; source records must match it or show an explicit unavailable state.
- High-risk or policy copy cannot use raw machine translation in production.
- Intent keys remain locale-neutral; locale-specific phrasing/synonyms live in reviewed resources.
- URLs and Help Center citations preserve the selected locale and valid alternates.

## 17. Acceptance criteria

### Architecture acceptance

- The PRD defines public, future portal and internal boundaries without treating them as separate
  products or granting public access to operational data.
- Conversation, message, handoff, consent, provider-readiness and identity transitions are explicit.
- Provider ports, APIs, events, jobs, security, fallbacks and activation gates are implementation-
  ready and align with Astro/Next/Supabase/Drizzle/Inngest.
- M002 is the sole public knowledge source; no private RAG or arbitrary web retrieval is implied.
- Every missing account/agreement is represented in `EXTERNAL_ACTIVATION_REGISTER.md`.

### Future Build acceptance

- Both locales can start, use, close and safely recover a chat session on desktop/mobile.
- The assistant is clearly automated and constrained to orientation.
- Public answers cite current M002 content and preserve material disclosures.
- Low-confidence, sensitive, prohibited, complaint and human-request cases take their defined safe
  paths.
- Duplicate submissions and retries produce one durable visible result.
- No handoff, lead or booking success is displayed without an owning-service receipt.
- Session isolation, authorization, rate limiting, injection tests, PII/secret rejection, audit
  minimization, accessibility and reduced motion pass.
- Provider-disabled mode works honestly without pretending that a live AI is connected.
- Existing M001/M002 routes, search, SEO, build and browser tests remain green.
- Preliminary intake asks only the approved service-specific fields, remains optional and creates no
  durable lead until the visitor confirms the M006 submission and its M078 consent actions; M020
  then owns lead creation/deduplication.
- Once their separately gated adapters exist, lead creation, booking, authenticated safe status,
  read-only payment status and approved Marketplace discovery pass contract tests and preserve the
  owning module's authorization and receipts.
- Internal administration/evaluation requires an approved staff role; corrections neither publish
  nor train automatically.
- When M043–M045 are active, an authorized payable can produce one expiring/idempotent payment-link
  receipt and an authenticated receipt link; disabled/unavailable/unauthorized states produce no
  link, no price mutation and no payment-success claim.

### External activation acceptance

- Selected provider accounts, contractual prerequisites and Product Owner approval are recorded.
- Secrets, webhook/OAuth controls, sandbox/production tests, observability, reconciliation, fallback
  and runbook pass independent security review.
- Only after this evidence may the applicable connection and eventually the module become
  `Operational`.

## 18. Negative acceptance criteria

- No message body, prompt, PII, secret or transcript appears in analytics, traces or general logs.
- No user can read or mutate another conversation by changing an ID.
- No email/case-number claim produces authenticated context or client data.
- No AI or deterministic fallback invents facts, sources, appointment slots, leads, payments,
  human availability or partner relationships.
- No model-supplied URL, HTML, script or arbitrary tool call reaches the browser or backend.
- No prohibited sensitive value is persisted or sent to a model/provider after rejection.
- No AI response continues while a human owns the conversation.
- No default marketing opt-in, bundled consent or undocumented retention.
- No card field, arbitrary price/discount, model-generated payment URL, unauthenticated receipt or
  payment-link success without the M043–M045 durable receipt.
- No real conversation body or preliminary-intake value is ever copied into a test fixture,
  developer/agent chat or persistent evaluation dataset.
- No preliminary-intake value or raw conversation body is ever sent in an external model-comparison
  payload under M003; those comparisons use only approved public/synthetic or policy-verified
  de-identified material.
- No M003 code or external connection is inferred from architecture approval alone.

## 19. Dependencies

### Required for architecture

M001 public website/design foundation, M002 public Help Center, M006 form/evidence-capture contract,
M020 lead/deduplication, M025 communications boundary, M041 provider abstraction, M060 compliance-
review boundary, M064 source
governance, M075 human-in-the-loop, M077 audit, M078 consent, M080/M081 IAM/RBAC, M082 PII
protection, M084 integration security, M085 retention, M037–M041 Marketplace, M043–M045 payment
projection and M097 observability.

### Required before future local Build behavior

Approved M003 PRD/design, explicit `GENERATE`/Build gate, accepted retention interim, conversation
data/RLS design, UI handoff, threat model and executable plan.

### Required only for external activation

Selected model/moderation provider, production Supabase/runtime configuration, configured
CRM/lead/scheduling/inbox/notification adapters, provider accounts and Product Owner approval. These
are tracked in `EXTERNAL_ACTIVATION_REGISTER.md` and do not block architecture completion.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Individualized or guaranteed advice | Grounded public-only knowledge, fixed policy, citations, refusal/handoff and eval suite |
| Prompt injection/tool abuse | Context separation, tool allowlist, strict schemas, authorization and no arbitrary network/database tool |
| Sensitive-data leakage | Upfront warnings, pre-persistence rejection, minimized provider context and telemetry redaction |
| Cross-session access | Opaque scoped credentials, domain authorization, RLS and negative isolation tests |
| Hallucinated source/partner claim | Server-resolved M002 citation IDs and preserved provider disclosures |
| Fake operational state | Durable receipts, readiness flags and external activation register |
| Human/AI race | Explicit state ownership, optimistic concurrency and idempotency |
| Provider outage/cost spike | Disabled/deterministic mode, budgets/rate limits, circuit breaker and human fallback |
| Abuse/spam | Layered rate limits, moderation, progressive challenge and restriction state |
| Translation drift | Paired reviewed policy copy and bilingual evaluation corpus |
| Transcript over-retention | Purpose limitation, configurable expiry and Product Owner/legal retention decision before production |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the purpose-specific first-party M003 transcript exception
  and its exact retention/deletion/legal-hold period after Illinois/legal review; durable production
  transcript bodies remain disabled until decided.]
- [NEEDS PRODUCT OWNER DECISION: approve the public privacy/automated-assistant notice and separate
  contact/marketing consent copy before production.]
- [NEEDS PRODUCT OWNER DECISION: define staffed support hours, handoff destinations and any response-
  time language before displaying human availability.]
- [NEEDS PRODUCT OWNER DECISION: select and approve the production model and moderation provider,
  budget and data-processing terms before external activation.]
- [NEEDS PRODUCT OWNER DECISION: decide whether anonymous visitors may resume a transcript on the
  same device after closing the browser; cross-device resume is excluded without authentication.]
- [NEEDS PRODUCT OWNER DECISION: approve which authenticated client status questions enter the first
  portal-chat release after M007/client-portal authorization is available.]

These questions block only the affected live behavior or activation. They do not block approval of
the provider-neutral architecture in this PRD.

## Delivery and activation record

- Architecture: draft completed for Product Owner review on 2026-08-09.
- Local implementation: not authorized and not started.
- External activation: deferred; see `EXTERNAL_ACTIVATION_REGISTER.md`.
- Operational status: not eligible.
