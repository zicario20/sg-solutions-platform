# Module PRD — M005 Agente telefónico y recepción de llamadas

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Surface: Public communications channel with future Client/Admin projections
- Domain: Communications / Voice / Public Acquisition
- Release: R7 target capability; architecture prepared during Phase 0
- Status: Build authorized by Decision 028 — queued after clean M004 closure
- Last updated: 2026-08-12
- External readiness: `External activation deferred` in `EXTERNAL_ACTIVATION_REGISTER.md`

This PRD normalizes the complete Product Owner-supplied M005 source into the approved Project Atlas
architecture. It preserves M005 as a professional bilingual virtual receptionist and separates it
from M096 Voice Gateway infrastructure. It replaces the source document's obsolete `.NET/Redis`
assumption with the approved TypeScript modular monolith plus a narrowly justified specialized voice
runtime. Decision 028 authorizes bounded local/staging construction after M004; it does not
authorize a phone number, provider credentials, recording, live calls, deployment or release.

## 1. Purpose

Provide SG Solutions with a bilingual telephone reception channel that answers or safely routes
calls, explains public services, captures minimal preliminary information, creates canonical lead or
callback receipts, coordinates appointments, takes messages and transfers to an authorized person.

The agent is an automated receptionist. It is not a tax, credit, legal, lending, mortgage or business
formation professional; it does not execute services, make eligibility decisions or exercise human
approval. M005 owns the voice-channel experience and call orchestration. M096 owns the specialized
media gateway/runtime. M003, M004 and M025 own shared conversation and inbox concepts.

## 2. Business value

- Give every caller a professional first response without requiring the owner to answer every call.
- Detect Spanish or English and route the caller without forcing a long IVR tree.
- Convert missed calls into auditable leads, appointments, messages or callback tasks.
- Keep public information consistent with the governed M002 Help Center.
- Let verified clients reach a secure next step without exposing case data to an unverified caller.
- Preserve human control for complaints, sensitive matters and every professional service action.
- Keep the business operational when a model, speech provider, CRM projection or local GPU is down.
- Establish provider-neutral ports so telephony, STT, model and TTS vendors can change without
  rewriting CRM, scheduling, consent, case or audit logic.
- Unify call outcomes with M025 instead of leaving recordings and notes in provider dashboards or a
  personal phone.

## 3. Scope

### Target capability

- Official inbound business calls through a replaceable `TelephonyProvider`.
- Future outbound calls behind a separate consent, policy and Product Owner activation gate.
- Provider request verification, bounded webhook ingress, durable call-event inbox, normalization,
  deduplication, ordering and reconciliation.
- A cloud-reachable M096 Voice Gateway for bidirectional audio, turn detection, STT, controlled
  orchestration and TTS.
- Provider-neutral `SpeechToTextProvider`, `VoiceModelProvider` and `TextToSpeechProvider` ports.
- Deterministic greeting, automated-assistant disclosure, language selection and caller intent.
- Public service orientation grounded only in approved, current M002 content.
- Minimal M006-compatible preliminary intake and M020 lead/callback receipt creation.
- M013 appointment availability, booking, cancellation and rescheduling through authoritative
  scheduling receipts.
- Human transfer, voicemail, callback request and after-hours flows.
- Call, participant, transfer, verification, outcome and quality projections in the shared platform.
- Configurable recording capability that remains disabled until legal/operational policy is
  approved and activated.
- Configurable transcription and structured post-call summary with facts, unconfirmed statements,
  actions, pending work and provenance separated.
- Secure client-verification boundary and a conservative portal-first default for client-specific
  status.
- Read-only payment-status projection from M043–M045; no card capture, payment mutation or refund.
- M025 shared inbox projection and authorized operator review.
- M026-mediated follow-up links or confirmations over a separately consented channel.
- DTMF fallback for language, bounded menu selection and transfer confirmation; no card collection.
- Approved business-hours, holiday, destination and degraded-mode configuration.
- Minimized audit, observability, cost and quality signals without audio, transcript or PII leakage.
- Synthetic evaluation and training mode; real calls cannot become training data by default.

### Current authorized slice

- Product/Architecture PRD, UX/conversation design, proposed ADR, provider and domain contracts,
  threat controls, test obligations, decision markers and external-activation checklist.
- No M005 or M096 executable behavior or provider activation is authorized.

## 4. Explicit out of scope

- A separate CRM, contact store, scheduler, inbox, payment ledger, case system or Help Center.
- Direct database access from the Voice Gateway or any speech/model provider.
- A general AI Hub tool surface or access to specialist-agent skills.
- Filing an entity, requesting an EIN, preparing/presenting taxes, disputing credit, applying for a
  loan/card/mortgage, signing, sharing partner data or executing browser automation.
- Legal, tax, credit, lending, real-estate, insurance or investment advice tailored during a call.
- Guarantees, approvals, eligibility decisions, rate quotes or definitive program recommendations.
- Treating Caller ID, name, email, address, birth date or knowledge of a service as authentication.
- Asking for or retaining SSN/ITIN, government ID, account numbers, tax documents, credit reports,
  passwords, IdentityIQ credentials, full payment-card data or bank credentials.
- Accepting payment-card data by voice or DTMF; a future compliant payment IVR requires its own ADR
  and Product Owner gate.
- Payment/refund/price/discount/service-start mutation or treating payment as human authorization.
- Arbitrary transfer destinations, arbitrary URLs, provider commands or model-selected tools.
- Hidden automation identity, impersonation of an employee or unapproved human name/credential.
- Psychological profiling, diagnosis or permanent emotion scoring. A coarse, ephemeral frustration
  signal may only request human escalation and cannot affect service eligibility.
- Automatic emergency response, law-enforcement contact or crisis counseling beyond approved copy
  and human/emergency-service direction.
- Recording or transcribing live calls before the applicable notice, consent, retention, access and
  legal-review gates close.
- Depending on a residential connection, homelab, owner desktop or GPU node for call availability.
- Publishing or promising a phone number, staffed hours, response time or call recording before
  Product Owner approval.

## 5. Actors

- New prospect calling SG Solutions.
- Existing prospect or contact whose phone association is not identity proof.
- Client requesting a secure next step or, in a later approved slice, a coarse verified projection.
- Product Owner and future authorized internal operators.
- Future support/specialist staff receiving a transfer or callback task.
- Official telephony provider and carrier network.
- M096 Voice Gateway and provider adapters.
- Reception Agent policy/orchestration runtime.
- M002 public knowledge adapter.
- M006 form/evidence capture, M078 consent and M020 lead/deduplication services.
- M013 scheduling services; M024 is internal calendar UI only.
- M018 canonical Person/Client/contact methods, M017 CRM relationship/opportunity and M025 inbox
  services.
- M026 follow-up notification service.
- M043–M045 read-only payment/status and secure-link services.
- M077 audit, M078 consent and M080/M081 identity/authorization services.
- Observability, abuse-control, reconciliation and incident-response operators.

## 6. User journeys

### New prospect asks about a service

1. The telephony provider sends a verified inbound-call event.
2. In one transaction before acknowledgement, ingress persists a durable receipt plus a versioned,
   replayable canonical envelope and claims the provider event's stable deduplication key.
3. The platform creates one call/conversation projection without treating Caller ID as verified
   identity.
4. The agent discloses that it is SG Solutions' automated reception assistant and offers Spanish or
   English.
5. It asks one question at a time, classifies the broad service and retrieves current public M002
   content.
6. If the caller wants follow-up, the agent captures only the M006 public allowlist, confirms each
   contact value and records purpose-specific contact consent.
7. M006 records the confirmed capture, M078 records applicable consent and M020 returns the generic
   idempotent lead or callback receipt; the voice agent never writes a lead directly.
8. The agent offers a real appointment only through the scheduling port or records preferred times
   when scheduling is unavailable.
9. It summarizes the next step and stores a minimized call outcome. Recording/transcript behavior
   follows the active approved policy.

### Existing caller asks for case information

1. A normalized phone endpoint produces only a contact candidate.
2. The agent does not reveal whether the number belongs to a client or whether a case exists.
3. It explains that personal information requires secure verification.
4. The default flow sends or explains a generic portal route through an already consented channel.
5. A later approved direct-status slice may invoke `VoiceVerificationService` using a method that is
   independent of Caller ID and valid only for the current call/session.
6. The domain service, not the model or gateway, returns an allowlisted projection or a generic
   denial.
7. Any ambiguity, failure or sensitive request triggers portal, human transfer or callback without
   revealing hidden state.

### Appointment request

1. The agent establishes service category, locale and caller IANA time zone.
2. `SchedulingPort` returns bounded real slots or an unavailable receipt.
3. The agent offers no more than a small approved number of slots.
4. The caller selects and confirms a slot and contact destination.
5. The scheduling service performs concurrency-safe booking and returns the authoritative receipt.
6. M026 may send confirmation through a separately permitted channel.
7. The call summary references the appointment; it does not duplicate scheduling truth.

### Human transfer

1. Caller request, complaint, fraud concern, legal threat, repeated misunderstanding, professional
   advice request, unsafe situation or policy block creates a handoff reason.
2. The platform selects only a configured allowlisted queue/destination.
3. A warm-transfer attempt provides a minimized internal summary to the authorized recipient.
4. If the destination answers, ownership moves to the human and the agent stops responding.
5. If it fails, the caller is offered voicemail, callback or another approved route.
6. Transfer attempts and outcomes are durable and auditable.

### After-hours or degraded call

1. The platform evaluates approved business-hours/holiday/emergency configuration.
2. The agent states the correct availability without promising an unapproved response time.
3. It may provide public information, create a callback receipt or request preferred appointment
   times.
4. If speech/model components fail, deterministic prerecorded prompts and DTMF provide a bounded
   route to voicemail/callback.
5. If the platform domain is unavailable, the gateway persists no intake or business recovery
   envelope. It uses an approved provider-level bilingual transfer/voicemail/static fallback or
   directs the caller to a verified public contact route; otherwise it ends honestly. It never
   claims that a lead, callback, booking or payment lookup succeeded.

### Recording/transcription notice

1. Before any recording/transcription begins, the platform resolves jurisdiction and active policy
   conservatively using available call metadata; uncertainty fails closed.
2. The approved bilingual notice is played and consent/evidence is captured when required.
3. If authorization is absent or withdrawn, recording/transcription is disabled or stopped and the
   call continues in the approved non-recorded mode when possible.
4. Sensitive-input moments pause supported recording/transcription; the agent directs protected
   data to the portal instead of collecting it.
5. Access, retention, legal hold and deletion follow the approved policy and produce audit evidence.

## 7. States and transitions

### Voice call lifecycle

`offered → ringing → answered → active → transferring|voicemail|completing → completed`

Terminal alternatives: `rejected`, `missed`, `busy`, `failed`, `abandoned`, `cancelled`.

- Provider events may repeat or arrive out of order; monotonic domain transitions and reconciliation
  decide the projection.
- A provider terminal event cannot reopen a completed call without a new call identifier.
- `active → transferring` records intent, not a successful human connection.

### Media session

`not_started → authorizing → connected → degraded|reconnecting → closed|failed`

- Only one current media-session owner may produce assistant audio for a call.
- Reconnect requires the existing call correlation and a fresh bounded authorization token.
- Raw audio frames are ephemeral unless an approved recording policy explicitly creates a recording
  artifact.

### Conversation ownership

`automated → handoff_requested → human_pending → human_owned → automated_resumable|closed`

- The automated agent must stop speaking/tool execution at `human_owned`.
- Resumption requires an explicit authorized action and a new ownership version.
- Every tool command and gateway milestone carries the expected ownership and call-state versions.
  The domain compares them atomically with any mutation and outbox write; stale work has no business
  side effect.
- Entering `human_owned` increments ownership/authorization versions and revokes outstanding agent
  capabilities. Already-dispatched uncertain effects enter reconciliation and are never blindly
  dispatched again.

### Verification

`not_requested → challenge_pending → verified|failed|expired|locked`

- Verification is scoped to one caller/contact, purpose and call session.
- Attempt limits and expiry are backend policy; neither the provider nor model can reset them.
- Caller ID match never enters `verified`.

### Recording/transcription policy

`disabled → notice_pending → permitted|declined|not_permitted → active|paused → stopped → retained|deleted|legal_hold`

- There is no automatic transition from `answered` to `active` recording.
- Withdrawal or policy uncertainty stops further capture; previously collected data follows the
  approved deletion/hold rules.

### Transfer

`requested → destination_selected → dispatch_pending → dialing|transfer_unknown`

`dialing → connected|no_answer|busy|failed → completed|fallback`

`transfer_unknown → reconciling → confirmed_connected|confirmed_not_sent|manual_review`

- A durable attempt exists before provider dispatch. A timeout never returns directly to
  `dispatch_pending` and never causes a blind retry.
- `confirmed_connected` atomically changes ownership to `human_owned`. `confirmed_not_sent` permits
  a new idempotency key only after capability-aware provider lookup; unsupported or ambiguous lookup
  terminates in `manual_review`.

### Post-call processing

`queued → transcript_ready|transcript_unavailable → summary_pending → review_required|ready → synced|failed`

- Summary failure does not change authoritative call, appointment, lead or transfer outcomes.
- Low-confidence or sensitive summaries require authorized review.

## 8. Business rules

- The assistant identifies itself as automated at the beginning and when asked.
- It acts as receptionist: orientation, routing, minimal intake, scheduling, messages and transfers.
- It asks one question at a time, uses short responses and confirms important contact/action values.
- The caller can request a human at any time; policy may still route to callback/voicemail when no
  person is available.
- Public answers come only from active M002 sources; no source means no invented answer.
- The model receives only tools allowed for the current call state and purpose. Prohibited tools are
  absent from the runtime registry, not merely discouraged in a prompt.
- M006 owns form/evidence capture, M078 owns consent and M020 alone owns lead creation/
  deduplication. M005 owns the voice receipt and call outcome.
- M013 owns availability and appointments. M024 only presents the internal calendar UI; M005 never invents slots or booking success.
- M043–M045 owns payment state. M005 may receive a coarse read-only projection only after the
  applicable authorization policy; it cannot alter money or service authorization.
- Phone recognition creates a candidate relationship only. It never confirms client status or
  grants resource access.
- The initial architecture uses the portal for client-specific information. Direct voice status is
  disabled until a Product Owner decision closes its projection/verification policy.
- Sensitive information is redirected to the secure portal; the agent does not repeat protected
  values back to the caller.
- Transfer destinations and outbound links are server-controlled allowlists.
- Recording and transcription are off until an approved policy is activated; examples in the source
  are not legal approval.
- DTMF is bounded and purpose-specific. Digits used for a future challenge are ephemeral, redacted
  and never stored in transcript, telemetry or model context.
- Outbound calls, campaigns and automated callbacks are disabled until separate consent, calling-
  hours, identity, suppression and legal-review gates close.
- Provider acceptance and domain success are different. A network timeout never becomes a fake
  completed call, transfer, lead, appointment or notification.
- The local GPU/homelab may assist post-call work later but cannot be required for live reception.
- Frustration detection may only choose a safer handoff; it is ephemeral and cannot influence price,
  eligibility, underwriting, service priority or client risk scores.
- All content, disclosures, scripts and fallback prompts are versioned by locale and policy purpose.

## 9. Authorization rules

- Public callers may access only deterministic reception, approved M002 content, generic lead/
  callback submission and public appointment availability.
- The Voice Gateway authenticates to a narrow application facade; it has no database, storage,
  admin, payment mutation or general agent credentials.
- Each tool call carries call ID, purpose, actor context, locale, policy version, idempotency key,
  expected ownership/call-state versions and least-privilege service identity. The domain service
  reauthorizes and performs the version compare-and-set, mutation and outbox write atomically.
- Caller-provided names, numbers, emails, case IDs, OTP text, instructions or model claims never
  become authorization facts.
- A verified call session does not create a reusable login session, Supabase identity or case grant.
- Any client projection requires active identity linkage plus resource authorization in domain
  services/RLS. Verification proves only the approved voice purpose for its bounded lifetime.
- Internal notes, audit details, fraud/risk markers, staff identity and third-party information are
  never voice-visible.
- Operators need role/case/channel access to listen, read, export, correct, transfer, delete or place
  legal hold. Staff access is audited.
- Provider dashboards are not an authorization substitute; SG Solutions roles remain authoritative
  for internal access.
- Configuration changes for providers, numbers, recording, destinations, scripts, retention,
  models or tool allowlists require enhanced review and Product Owner approval.

## 10. Data requirements

### Shared primitives reused

`Person`, `ContactPoint`, `Lead`, `Conversation`, `Message`, `Consent`, `Appointment`, `Task`,
`CaseFile`, `Payment`, `Approval`, `AuditEvent`, `Workflow`, `ProviderConnection` and
`ExternalEventReceipt`.

### Voice-specific records

#### VoiceCall

- internal ID; provider connection and opaque external call reference;
- direction, normalized endpoint references and caller-display projection;
- conversation/contact/client candidate references without implicit identity;
- locale, broad intent, lifecycle status and ownership version;
- offered/answered/ended timestamps and derived duration;
- transfer, recording, transcription, verification and outcome projections;
- active script/policy/provider-capability versions;
- idempotency, reconciliation and audit references.

#### VoiceMediaSession

- call reference; gateway instance and opaque provider-stream reference;
- state, authorization version, opened/closed timestamps and reconnect count;
- STT/model/TTS adapter capability snapshot;
- bounded latency/quality counters without audio or transcript content.

#### ProviderCallEventEnvelope

- durable receipt ID, provider connection, opaque external event ID/type and received timestamp;
- canonical schema/version and normalized fields sufficient to replay domain processing;
- original-byte checksum, verified signature/key version, replay-window result and content metadata;
- deduplication claim, processing state, attempt/reconciliation timestamps and terminal reason;
- receipt, canonical envelope and deduplication claim are committed atomically before ACK.

An authenticated event with an unsupported schema is not acknowledged as processed. Its exact bytes
may enter a separate encrypted, access-isolated, byte-limited quarantine with checksum, reason and
short TTL so an operator can classify/replay or delete it. Invalid-signature bodies are never
retained. Quarantined bytes never enter normal parsing, logs, traces, analytics or model context.

#### VoiceParticipant

- call reference; participant type; authorized contact/user/queue reference;
- redacted endpoint reference; joined/left timestamps and ownership role.

#### VoiceTranscriptSegment

- call reference; speaker type; relative time range; locale;
- encrypted/redacted text or protected storage reference when policy permits;
- confidence and review flags; capture-policy/evidence version;
- deletion/hold lifecycle. No unrestricted plaintext telemetry copy.

#### VoiceRecording

- call reference; private-storage object reference; checksum and duration;
- notice/consent/policy/jurisdiction evidence references;
- encryption class, quarantine/accepted state, retention and legal-hold fields;
- created/deleted timestamps and access-audit linkage.

#### VoiceSummary

- call reference; confirmed facts; caller statements not independently confirmed;
- actions confirmed by authoritative receipts; pending actions; risk/escalation flags;
- source transcript/segment version; model adapter/model-policy version;
- confidence, review status, reviewer and correction history.

#### VoiceTransfer

- call, expected ownership/call-state versions and allowlisted destination references;
- type, reason, provider-capability snapshot, dispatch-attempt ID and idempotency key;
- opaque provider transfer/reference ID and request/response checksums without sensitive payload;
- requested, persisted, dispatched, dialed, reconciled, connected and completed timestamps;
- state, attempt count, lookup result, terminal evidence, manual-review owner and fallback receipt.

#### VoiceVerification

- call, claimed contact and verification-purpose references;
- method, challenge reference, state, attempts and policy version;
- verified/expiry/lock timestamps; no reusable secret or OTP value.

### Classification

- Public: approved greeting, service and Help Center content.
- Internal: provider health, non-identifying quality/cost aggregates.
- Confidential: caller contact data, call metadata, consent, transcript, voicemail, summary and
  callback details.
- Highly Sensitive: any approved recording/segment containing protected client, financial, tax,
  credit or identity data; such capture should be prevented and otherwise isolated/redacted.

### Prohibited persistence

Full card/bank/account/SSN/ITIN/password/credential values; raw OTP; arbitrary DTMF sequences; raw
audio outside an approved recording artifact; provider secrets; prompts/tools in general logs; and
unredacted content in analytics, traces, fixtures or training data.

## 11. API or service contracts

Contracts are conceptual until a separate Build gate approves executable types.

### Provider and gateway ports

- `TelephonyProvider.acceptInbound(event) → AuthenticatedCallEventReceipt`
- `TelephonyProvider.startTransfer(command, idempotencyKey) → TransferDispatchReceipt`
- `TelephonyProvider.endCall(command, idempotencyKey) → CallTerminationReceipt`
- `TelephonyProvider.lookupExternalState(externalCallRef) → ProviderCallProjection`
- `SpeechToTextProvider.open(sessionPolicy) → StreamingTranscriptPort`
- `VoiceModelProvider.respond(turnContext, allowedTools) → BoundedVoiceTurn`
- `TextToSpeechProvider.synthesize(approvedText, voicePolicy) → AudioStreamPort`
- `VoiceGatewaySession.authorize(callRef, tokenMetadata) → SessionCapability`
- `VoiceGatewaySession.reportMilestone(event, idempotencyKey) → DurableReceipt`

### Application/domain ports

- `ReceptionPolicyService.begin(callContext) → ReceptionPolicySnapshot`
- `ReceptionPolicyService.allowedTools(callState) → TypedToolManifest`
- `PublicKnowledgePort.search(locale, query, at) → ApprovedKnowledgeResult`
- `PreliminaryIntakePort.capture(callRef, structuredFields, consentRef) → DraftReceipt`
- `LeadCapturePort.promote(draftRef, idempotencyKey) → GenericLeadReceipt`
- `SchedulingPort.getAvailability(request) → SlotProjection`
- `SchedulingPort.book(command, idempotencyKey) → BookingReceipt`
- `SchedulingPort.reschedule(command, idempotencyKey) → BookingReceipt`
- `SchedulingPort.cancel(command, idempotencyKey) → CancellationReceipt`
- `VoiceVerificationService.begin(callRef, purpose) → ChallengeReceipt`
- `VoiceVerificationService.verify(callRef, response) → VerificationDecision`
- `SafeClientProjectionPort.get(callRef, verifiedContext, purpose) → AllowlistedProjection|Denied`
- `PaymentProjectionPort.getStatus(authorizedRef) → CoarsePaymentProjection|Denied`
- `HandoffService.request(callRef, reason, destinationClass) → HandoffReceipt`
- `CallbackService.create(callRef, preference, consentRef) → CallbackReceipt`
- `NotificationPort.sendFollowUp(domainIssuedLink, purpose, channel) → DispatchReceipt`
- `VoiceSummaryService.create(callRef, sourceVersion) → SummaryReceipt`

### Contract rules

- Provider payloads and SDK types stop at adapter boundaries.
- Provider webhook acknowledgement follows only an atomic durable receipt, versioned replayable
  canonical envelope and deduplication claim. Crash-after-ACK recovery never depends on the original
  request remaining available.
- Authenticated unsupported-schema events enter the bounded encrypted quarantine and a manual
  classification route; invalid-signature bodies are rejected without retention.
- Every mutating command is idempotent and returns a receipt; spoken confirmation follows only an
  authoritative receipt.
- Every command/milestone carries expected ownership and call-state versions. Domain authorization,
  compare-and-set mutation and outbox write form one atomic unit; handoff increments/revokes the
  version so stale agent work cannot commit after human takeover.
- Tool input is schema-validated and policy-constrained; free text cannot select method, URL,
  resource, staff destination, payment value or privilege.
- Domain results contain only the smallest voice-safe projection and generic denial reasons.
- Secure links are generated server-side, single-purpose, short-lived and reauthorize at destination.
- A provider/model timeout with uncertain side effects enters an explicit `unknown` state and is
  reconciled; it is not blindly retried.

## 12. Events and background jobs

### Durable events

- `voice.call.received`
- `voice.call.answered`
- `voice.language.selected`
- `voice.intent.classified`
- `voice.intake.draft_recorded`
- `voice.lead.receipt_recorded`
- `voice.verification.started|verified|failed|expired|locked`
- `voice.appointment.receipt_recorded`
- `voice.handoff.requested|dispatch_persisted|dispatch_unknown|reconciling|connected|failed`
- `voice.handoff.confirmed_not_sent|manual_review`
- `voice.voicemail.recorded`
- `voice.callback.requested`
- `voice.recording.notice_presented|started|paused|stopped`
- `voice.transcript.available|failed`
- `voice.summary.ready|review_required|failed`
- `voice.call.completed|failed|abandoned`
- `voice.fallback.activated`
- `voice.provider.reconciliation_required|resolved`

### Background jobs

- Normalize and process durable provider events after acknowledgement.
- Reconcile duplicate, delayed, missing and out-of-order call/transfer status.
- Reconcile acknowledged provider envelopes after crash/restart without the original HTTP request.
- Perform allowed post-call transcription/redaction/summary only under current policy.
- Retry M025 inbox projection and M026 notifications without duplicating business actions.
- Apply retention/deletion/legal-hold transitions for audio, transcripts, summaries and voicemail.
- Aggregate content-free quality, latency, failure and cost metrics.
- Detect stale active calls/media sessions and request operator reconciliation.

Every job has a stable idempotency key, durable Postgres state, bounded retries, terminal failure and
manual-recovery route. Inngest coordinates work but never owns call or business truth.

## 13. Error states and recovery

| Failure | Safe behavior | Durable recovery |
|---|---|---|
| Invalid provider signature/challenge | Reject before parsing/use; disclose nothing | Security metric and bounded metadata only |
| Oversized/unsupported provider request | Reject before buffering/expensive work | Rate/abuse observation; no raw body retention |
| Duplicate/out-of-order call event | Return bounded acknowledgement after durable dedupe | Monotonic projection and reconciliation |
| Media WebSocket loss | Stop tool/audio ownership; use bounded reconnect or provider fallback | Fresh session token and call-state reconciliation |
| STT unavailable/low confidence | Do not infer words; repeat, DTMF, transfer or voicemail | Quality event and optional authorized post-call process |
| Model unavailable/slow | Deterministic approved prompt; transfer/callback | Provider fallback or manual task; no invented result |
| TTS unavailable | Approved prerecorded prompt; transfer/voicemail | Alert and provider fallback |
| CRM/lead/domain service unavailable | Do not persist intake in M096; use approved provider transfer/voicemail/static fallback or verified public contact route | Provider event reconciliation or human follow-up only when an authoritative receipt later exists; never say a lead/callback exists prematurely |
| Scheduling unavailable/conflict | Collect preferred times or callback | Reconcile task; never invent booking |
| Payment projection unavailable | State that status cannot be verified; direct to portal/human | Reconciliation task; no financial claim |
| Human destination unavailable | Voicemail/callback/alternate approved queue | Durable transfer failure and callback task |
| Recording policy uncertain | Recording/transcription remains off | Policy/operator review; call may continue safely |
| Verification service unavailable | No personalized disclosure | Portal or human route; no fallback to Caller ID/KBA |
| Summary/transcription failure | Preserve authoritative call receipts only | Retry bounded post-call job or manual summary |
| Provider state uncertain after command | Mark `dispatch_unknown`/`transfer_unknown` | Provider lookup/reconciliation; no blind duplicate action |
| Human takeover races an agent command | Reject a stale ownership/call-state version atomically | Reconcile an already-dispatched external effect; never commit/redispatch stale domain work |
| Homelab/GPU unavailable | Continue cloud reception or deterministic fallback | Queue non-urgent post-call work |

Recovery UI must show truthfully what is confirmed, pending, unknown or failed and the authorized
manual action. Operators cannot edit provider facts without an audited correction event.

## 14. Security and privacy requirements

- Official provider only; no caller-ID spoofing trust, personal-number automation or unofficial
  telecom control path.
- Exact provider request verification over original bytes and trusted proxy configuration.
- Before buffering/parsing/signature work, enforce method, content type/encoding, raw byte, streaming
  deadline, total deadline, concurrency and rate limits.
- WSS/HTTPS, short-lived call/session credentials, issuer/audience/call/provider-stream/
  authorization-version binding, replay protection and key rotation. Each credential has a
  high-entropy `jti`/nonce and is consumed atomically once during upgrade before any audio frame is
  accepted. Reconnect requires a new token; simultaneous/replayed use fails closed and is audited.
- Carry the media credential in a provider-supported protected header or WebSocket subprotocol. If
  an approved provider supports only a query parameter, use an opaque one-time value and configure
  proxy/access/application/error telemetry to redact the complete parameter before activation.
  Neither form may appear in URLs copied to business records, diagnostics or client-visible output.
- Service-to-service calls use least-privilege identity and typed purpose/tool scopes.
- No Voice Gateway database/storage/general-admin credentials.
- The agent warns callers not to speak payment-card, bank, SSN/ITIN, password or credential values
  and never requests them. DTMF is disabled except for exact menu/challenge states and never accepts
  card input.
- A deterministic sensitive-pattern detector/redactor runs immediately after STT and before model
  context, transcript/summary persistence, tool calls or telemetry. A suspected segment is discarded
  from those downstream paths, records only a content-free reason code and triggers a safe response
  without echo. If this boundary or provider no-retention/no-training controls cannot be assured,
  the flow fails closed to portal/human and formal PCI/privacy impact review is required before
  activation. Redaction is defense in depth, not permission to ask.
- Recording/transcription defaults off. Activation requires approved notice/consent, jurisdictional
  analysis, pause/withdrawal, access, retention, deletion, legal-hold and incident procedures.
- Audio/transcripts/voicemails are private, encrypted, access-controlled and excluded from Sanity,
  PostHog, general Sentry context and unbounded logs/traces.
- Model/STT/TTS providers receive only permitted data under reviewed terms, region, retention and
  no-training controls. Provider reuse of data is not assumed safe.
- Caller content is untrusted data. It cannot modify system instructions, tool registry, policy,
  destination, identity, authorization, price or financial state.
- Output is bounded, checked for prohibited promises/data and rendered through approved templates
  when communicating domain state.
- Transfer destinations, follow-up domains, webhook destinations and model/provider endpoints are
  configuration allowlists controlled outside prompts.
- Cross-client, caller-ID spoof, OTP replay, prompt injection, arbitrary destination, recording-
  bypass, provider-replay, crash-after-ACK, concurrent media-token replay and spontaneous-sensitive-
  speech zero-persistence tests are mandatory after Build.
- Handoff race tests pause commands before authorization, before commit and after uncertain provider
  dispatch; only the current ownership version may mutate state and no transfer may duplicate.
- Security incidents can disable model tools, recording, outbound calls, a provider adapter or the
  complete automated agent while retaining manual call handling.

## 15. UX and accessibility requirements

- Identify SG Solutions and the automated reception role in the opening.
- Offer clear Spanish/English choice and accept spoken or DTMF selection.
- Use short sentences, one question at a time and explicit confirmation for names, contact details,
  dates, times, amounts and intended next actions.
- Support interruption/barge-in, repeat, slower speech and correction without punishing the caller.
- Do not read long articles, privacy policies, raw URLs, identifiers or technical errors aloud.
- Never use silence as confirmation. Explain when a lookup may take time and offer callback/human
  alternatives.
- After two low-confidence turns, narrow to approved choices; after the configured terminal limit,
  transfer, voicemail or callback rather than looping.
- DTMF fallback remains short, with announced choices and a path to human help.
- Confirm IANA time zone and local date/time when scheduling; do not rely on ambiguous “tomorrow” or
  daylight-saving assumptions.
- Callers using relay services, speech differences, accents, noisy environments or slower response
  must receive equal fallback and human options.
- The agent must not infer competence, eligibility or urgency from accent, fluency, disability,
  emotional tone or background noise.
- Admin review surfaces require keyboard support, visible focus, accessible transcripts, captions/
  text alternatives and no audio-only critical information.
- Reduced-motion settings apply to future call-admin visualization; audio experiences avoid sudden,
  excessive or deceptive sound effects.

## 16. Bilingual requirements

- Spanish and English greetings, disclosure, consent, recording notice, transfer, error, voicemail,
  callback and closing scripts are separately reviewed/versioned.
- Language selection is explicit or high-confidence; uncertain detection asks rather than guesses.
- The call remains in the chosen language until the caller changes it.
- Tool schemas and domain enums stay in English; public labels and speech are localized.
- Financial/legal terms, promises, consent meaning and emergency copy cannot be improvised by machine
  translation.
- An answer/source unavailable in the selected locale triggers human/help-link fallback rather than
  a lower-quality hidden-language response.
- Transcripts retain observed language per segment; summaries use the operator's selected locale and
  preserve original facts without translating identifiers.
- English and Spanish flows must have functional parity, including opt-out, recording choice,
  verification, transfer and fallback.

## 17. Acceptance criteria

Architecture acceptance now requires:

1. M005 is documented as a voice channel/reception capability, not an independent CRM or specialist.
2. M005 and M096 responsibilities are separated with typed least-privilege contracts.
3. The specialized Voice Gateway is justified by real-time media/runtime isolation without turning
   the full platform into microservices.
4. Provider, STT, model and TTS types stop at adapters.
5. Caller ID is never identity and the initial client-specific path is portal-first.
6. Tool allowlists exclude every professional, financial-mutation and browser-automation action.
7. Lead, schedule, payment, conversation/inbox, consent and audit authority remain in owning modules.
8. Call/media/verification/recording/transfer/post-call states and recovery are explicit.
   Human takeover uses atomic ownership fencing and uncertain transfers use durable reconciliation.
9. Provider ingress, replay, idempotency, out-of-order events and uncertain dispatch are controlled.
   The durable canonical envelope can replay after crash without the original request.
10. Recording/transcription defaults off until approved policy and activation evidence exist.
11. Audio/transcript/PII are excluded from general logs, analytics and training.
    Spontaneously spoken protected values are suppressed before model, persistence, tools and
    telemetry or the call fails closed.
12. Bilingual, interruption, DTMF, disability and human-handoff expectations are testable.
13. Cloud reception has safe fallbacks and never depends on homelab/GPU.
14. External activation prerequisites and unresolved business policy are explicitly registered.
15. No product code, account, number, credentials, live call, merge, deployment or Operational claim
    is created by the documentary package.

Future Build acceptance additionally requires executed contract, concurrency, security,
conversation, provider-sandbox, accessibility, resilience and recovery evidence under an explicit
Build gate. External activation additionally requires the evidence in the activation register.

## 18. Negative acceptance criteria

- No `.NET`, Redis, Twilio/Pipecat SDK or Python runtime is added to the current product scaffold by
  this documentary phase.
- No personal number, Northwest number, Twilio trial number or shared WhatsApp number is assumed or
  published.
- No provider account, secret, API key, auth token, webhook URL or private endpoint is committed.
- No call, recording, transcript, voicemail, contact, appointment, payment or case data is real.
- No recording/transcription is enabled by default or described as legally approved.
- No Caller ID/contact match returns client status or resource access.
- No SSN, ITIN, card, bank, account, password, credential, tax document, credit report or government
  ID is requested or retained in voice/DTMF; negative tests demonstrate zero downstream
  persistence/propagation when a caller speaks a protected value spontaneously.
- No arbitrary transfer destination, phone number, URL, prompt or tool is accepted from caller/model.
- No payment, refund, price, discount, service-start, filing, dispute, application or signature
  action is available.
- No appointment/lead/transfer/payment/human-availability success is spoken without an authoritative
  receipt.
- No transcript, audio, phone number, PII, prompt, tool input/output or provider payload enters
  general telemetry, analytics, fixtures or evaluation data.
- No real recording/transcript is used for model training without a separate explicit consent and
  governance decision.
- No emotion signal becomes a durable client attribute or commercial decision input.
- No local GPU, homelab or owner desktop is required for live call handling.
- No outbound calling or campaign is enabled through architecture approval.
- No mock/simulator is described as a live connection or Operational evidence.

## 19. Dependencies

### Required for architecture

M002 public Help Center; M003/M004 conversation/channel patterns; M006 preliminary form/evidence
capture; M078 consent; M020 lead/capture deduplication; M013 scheduling; M018 canonical Person/
Client/contact methods; M017 CRM relationship/opportunity;
M025 unified communications; M026
notifications; M041 provider abstraction; M043–M045 payment projections; M048/M049 Reception Agent;
M060 compliance review; M075 human-in-the-loop; M077 audit; M078 consent; M080/M081 IAM/RBAC; M082
PII; M084 integration security; M085 retention; M092 analytics; M096 Voice Gateway; M097
observability; M098 backup/recovery; M099 deployment.

### Required before future local Build

Approved M005 PRD/design and ADR 009, explicit `GENERATE`/Build gate, approved M005/M096 split,
recording-disabled development mode, synthetic call corpus, provider contracts, service identity/
tool policy, threat model, test strategy and executable implementation plan.

### Required only for external activation

Institutional number/ownership/portability plan; official telephony account; approved provider,
STT/model/TTS choices; verified business identity/caller ID; credentials/secret store; public voice
gateway deployment; approved greetings/disclosures/recording/legal policy; human destinations and
hours; budget/SLO; sandbox and controlled real-call tests; incident/runbooks; Product Owner approval.

These prerequisites are tracked in `EXTERNAL_ACTIVATION_REGISTER.md`. Their absence does not block
provider-neutral architecture approval.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Caller ID spoof/recycled number reveals client data | Caller ID is candidate-only; portal-first and bounded independent verification |
| Recording violates consent/jurisdiction policy | Default off; policy engine, notice/evidence, withdrawal, legal review and fail closed |
| Voice prompt injection invokes privileged work | Typed state-specific tool registry; domain reauthorization; no specialist tools |
| Arbitrary transfer creates toll fraud/data exposure | Allowlisted destinations, rate/cost limits, authorization and anomaly alerts |
| Duplicate/out-of-order provider events corrupt call state | Durable inbox, stable keys, monotonic state and reconciliation |
| Tool finishes after human takeover | Expected ownership/call-state versions, atomic compare-and-set and capability revocation |
| Transfer timeout causes duplicate human calls | Pre-dispatch attempt, `transfer_unknown`, capability-aware lookup and no blind retry |
| Media session hijack/replay | One-call ephemeral token, audience/session binding, WSS and single owner |
| Audio/transcript leaks through telemetry/model vendors | Minimization, encryption, redaction, no general logging and reviewed provider terms |
| Model hallucination creates false promise | M002 grounding, short templates, output policy and human fallback |
| STT error changes identity/action | Confirm critical values, confidence gates and authoritative receipts |
| Human/agent speak or act concurrently | Versioned conversation ownership and immediate tool/audio suspension |
| Provider outage causes missed calls | Carrier/manual voicemail, callback route, alert and honest degraded mode |
| Home infrastructure causes downtime | Cloud-first public gateway; local nodes only for optional post-call work |
| Cost/latency grows unpredictably | Bounded turns/tools, deterministic prompts, capability budgets and metrics |
| Emotional/crisis handling causes harm | Narrow approved scripts, no diagnosis, human/emergency direction and policy gate |
| Real calls contaminate training/evals | Synthetic default; separate consent/governance for any real-data use |
| Provider lock-in | Canonical ports/events and capability tests at adapters |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: choose the first official telephony provider and institutional
  number strategy—new provider number, porting or forwarding—after ownership, portability,
  WhatsApp/SMS coexistence, caller-ID, cost and recovery review.]
- [NEEDS PRODUCT OWNER DECISION: approve whether any calls may be recorded/transcribed and the exact
  bilingual notice, consent/withdrawal, jurisdiction, pause, access and legal-review policy; default
  remains recording/transcription off.]
- [NEEDS PRODUCT OWNER DECISION: approve retention, deletion and legal-hold periods for call metadata,
  provider-event quarantine, audio, transcripts, voicemails, summaries and verification evidence.]
- [NEEDS PRODUCT OWNER DECISION: choose STT, live voice-model and TTS providers after latency,
  bilingual quality, DPA/terms, region, retention/no-training, availability, cost and fallback review.]
- [NEEDS PRODUCT OWNER DECISION: approve the bilingual assistant identity, voice/personality,
  greeting, disclosure, voicemail and closing copy; examples are conceptual only.]
- [NEEDS PRODUCT OWNER DECISION: define business hours, holidays, staffed destinations, transfer
  queues, escalation owners and response-time language before human availability is promised.]
- [NEEDS PRODUCT OWNER DECISION: approve voice verification methods, purpose, attempt limits, expiry,
  lockout and recovery; direct client-specific status remains disabled meanwhile.]
- [NEEDS PRODUCT OWNER DECISION: approve whether any coarse case, payment, document or task status
  may be spoken after verification; the initial architecture uses the secure portal only.]
- [NEEDS PRODUCT OWNER DECISION: approve outbound-call/callback scope, consent evidence, suppression,
  calling windows, cadence, identity copy and applicable legal review; outbound automation remains
  disabled.]
- [NEEDS PRODUCT OWNER DECISION: approve emergency, self-harm, medical crisis, fraud, threats, abuse
  and legal-threat scripts/escalation policy after appropriate review; the agent must not improvise.]
- [NEEDS PRODUCT OWNER DECISION: set measurable latency, availability, bilingual transcription/
  comprehension, handoff-success and cost budgets before provider selection or production claims.]
- [NEEDS PRODUCT OWNER DECISION: approve whether any real call audio/transcript may be used for QA or
  training and its consent, minimization, redaction, access and deletion rules; synthetic-only is the
  default.]
- [NEEDS PRODUCT OWNER DECISION: approve the minimal M006 preliminary-intake fields that may be asked
  by voice, their consent/TTL and confirmation rules; no sensitive field is eligible.]
- [NEEDS PRODUCT OWNER DECISION: confirm that payment by phone remains excluded and any future
  compliant payment-IVR capability requires its own PRD/ADR/gate.]

These decisions block only their affected Build or activation behavior. They do not require
invented answers to approve the provider-neutral architecture.

## Delivery and activation record

- Architecture: independently reviewed candidate completed on 2026-08-09.
- Local implementation: authorized by Decision 028 only after clean, audited M004 closure.
- External activation: deferred; see `EXTERNAL_ACTIVATION_REGISTER.md`.
- Operational status: not eligible.
