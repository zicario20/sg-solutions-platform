# M005 Voice Agent — architecture and experience design

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Draft for Product Owner review
- Date: 2026-08-09
- Gate: Product/Architecture documentation only; no `GENERATE`, Build, provider activation or deployment
- Related module: `M005 Agente telefónico`
- Related infrastructure: `M096 Voice Gateway`

## 1. Outcome

M005 will provide a bilingual telephone reception experience for SG Solutions. It may orient a
caller, identify a general service intent, collect a minimal preliminary intake, create or update a
lead through approved domain services, offer appointment slots, take a message and transfer to an
authorized human destination. It does not perform professional services or grant access to client
information merely because a telephone number matches a record.

The design keeps business state and policy inside the approved TypeScript modular monolith. A
narrow, separately deployable M096 Voice Gateway is justified only for real-time carrier media,
speech and audio orchestration. It receives no general database credentials and owns no client,
lead, appointment, payment or case state.

## 2. Approaches considered

### Selected: shared domain plus specialized real-time gateway

The official telephony provider terminates the call and sends signed events and a time-limited media
stream to M096. The gateway validates the session, coordinates approved STT/voice-model/TTS
providers and invokes a small application facade. Durable call facts, tools, consent, handoff and
audit remain in Postgres and domain services.

This approach preserves the modular monolith while recognizing a real specialized-runtime,
long-lived-connection and failure-isolation boundary.

### Rejected: independent voice CRM

A self-contained voice bot with its own leads, contacts, scheduling and transcripts would duplicate
M020, M013/M024, M025 and shared primitives. It would make channel data a competing source of truth
and create unsafe authorization drift.

### Rejected: route live audio through ordinary Astro/Next request handlers

The public applications are not the correct owner for long-lived bidirectional audio, interruption
handling and low-latency speech sessions. They may expose administrative and application facades,
but they must not become an accidental real-time media server.

### Rejected: make the home lab or GPU node mandatory

The business telephone must remain available when local hardware, home internet or power is down.
M093–M095 may later perform optional post-call or overflow work only after an ADR, measured need and
safe cloud fallback.

## 3. System boundary

```text
Caller
  ↕ PSTN / approved official provider
Provider call control + signed events
  ↕ WSS media stream / HTTPS callbacks
M096 Voice Gateway (specialized cloud boundary)
  ├─ request validation and bounded provider normalization
  ├─ ephemeral media session and interruption control
  ├─ approved STT / voice model / TTS adapters
  └─ short-lived scoped application token
         ↕ narrow typed commands and projections
apps/app integration facade + shared domain packages
  ├─ ReceptionPolicy and tool allowlist
  ├─ M006/M020 lead capture
  ├─ M013/M024 scheduling
  ├─ M025 unified conversation/handoff
  ├─ M026 notification/link delivery
  ├─ M077 audit
  └─ Postgres durable operational state
         ↕ durable jobs
       Inngest
```

The provider owns external call and delivery state. Postgres owns operational state. The gateway
owns only the active media session and ephemeral audio buffers. Inngest coordinates post-call jobs
but is never the state authority.

## 4. M005 and M096 responsibility split

| Concern | M005 Voice Agent | M096 Voice Gateway |
|---|---|---|
| Caller journeys, bilingual copy and limits | Owns | Executes approved instructions |
| Business-hours, handoff and tool policy | Owns | Consumes scoped projection |
| Lead, appointment, callback and audit writes | Domain services own | Invokes typed facade only |
| Call and conversation durable state | Owns in Postgres | Emits authenticated milestones |
| Provider signature and media protocol | Defines contract | Owns implementation boundary |
| Audio buffering, barge-in and turn timing | Defines SLOs | Owns ephemeral runtime behavior |
| STT/model/TTS selection | Product Owner gate and provider ports | Hosts approved adapters |
| Recording/transcription decision | Policy owner; disabled by default | Must fail closed to policy |
| Client authorization | Domain/RLS only | Never grants access |
| Secrets | References approved secret handles | Receives only required scoped secrets |

## 5. Trust boundaries

### Provider ingress

- Validate provider signatures over the exact original bytes before parsing or side effects.
- Enforce request size, header count, timestamp/replay window and content-type bounds before normal
  application parsing.
- In one transaction before acknowledgement, persist a durable receipt, versioned replayable
  canonical envelope and stable provider-event deduplication claim. The envelope contains enough
  normalized data to replay after a crash without the original request.
- Invalid-signature bodies are never retained. Authenticated unsupported-schema bytes enter only an
  encrypted, isolated, size-limited quarantine with checksum, reason and short TTL; they never enter
  normal processing, logs, traces, analytics or model context.
- Treat duplicated, delayed and out-of-order callbacks as normal.
- Never place raw provider payloads in ordinary logs or tracing.

### Media session

- Accept only provider-originated encrypted media sessions associated with a validated call.
- Mint one-call, short-lived credentials bound to issuer, audience, call, provider stream and
  authorization version. A high-entropy `jti`/nonce is atomically consumed once during WebSocket
  upgrade before frames; reject reuse, simultaneous use and expiry, and require a new token for
  reconnect.
- Prefer a protected provider header or WebSocket subprotocol. If an approved provider only permits
  an opaque query token, redact that full parameter at proxy, access-log, application, error and
  trace boundaries; it must never be copied to a business record or client-visible URL.
- Bound audio duration, buffer size, concurrent sessions, silence and inactivity.
- The gateway has no general Postgres, Storage, Stripe, Sanity or Supabase service-role credential.
- A gateway compromise must not expose arbitrary application tools.

### Application facade

- Every command/milestone carries call identity, actor type, purpose, locale, tool id, idempotency
  key and expected ownership/call-state versions.
- The facade reauthorizes the command; gateway authentication is not business authorization.
- Authorization, version compare-and-set, domain mutation and outbox write are atomic. Human
  takeover increments/revokes the ownership/authorization version so stale agent work cannot
  commit; already-dispatched uncertain effects go to reconciliation, never blind redispatch.
- Tools use explicit typed inputs and outputs, strict timeouts and rate limits.
- Only safe projections may return to the voice session; internal notes and raw documents never do.

## 6. Deterministic and model responsibilities

The model may classify language and intent, summarize caller-provided information, select from an
allowed next-step set and phrase an approved answer grounded in the public Help Center. It may not
invent a tool, URL, policy, eligibility outcome, professional conclusion or client status.

Deterministic code owns consent state, recording state, verification, field validation, rate limits,
available slots, booking, transfer destinations, link templates, state transitions, tool execution,
audit and error recovery. Every tool call is schema validated before and after execution.

## 7. Caller identity and client information

A caller telephone number is a routing hint, not Supabase identity, client membership or a resource
grant. A matching contact may help locate a verification candidate but never exposes a record.

Release behavior before a verification policy is approved is public orientation only. The safe
path for any client-specific activity is an expiring link delivered to a previously approved
channel and completed in the authenticated portal. If a future voice verification method is
approved, the domain still evaluates the exact purpose and minimum safe projection.

## 8. Conversation orchestration

The reception state machine is explicit:

1. acknowledge the call and identify SG Solutions;
2. offer Spanish or English and support DTMF language selection;
3. state applicable automation/recording disclosure before collection;
4. classify public orientation, new-lead, scheduling, message, transfer or verified-status intent;
5. execute only the allowed journey and confirm critical captured facts;
6. recap the next step without promising an outcome;
7. persist final state and hand off post-call work durably.

Free-form caller text is untrusted data. It never becomes a system instruction, tool name, URL,
destination, query fragment or provider parameter.

## 9. Preliminary intake

Voice intake reuses the M006 form schema and M020 lead service. It does not create a parallel voice
lead model. Only an approved minimal field allowlist may be asked, and sensitive values—SSN, EIN,
account numbers, payment-card data, passwords, tax-document content and complete credit data—are
prohibited.

The caller hears a short purpose statement. Important values are read back for confirmation. The
submission carries the form/version, locale, source=`voice`, consent evidence and call correlation.
Potential duplicates create review candidates; they never overwrite a client silently.

The opening and every sensitive transition warn the caller not to speak payment-card, bank,
SSN/ITIN, password or credential values. Exact DTMF menus do not accept card input. A deterministic
detector/redactor runs immediately after STT and before model context, transcript/summary
persistence, tools or telemetry. Suspected content is discarded from every downstream path, only a
content-free reason code remains and the agent redirects without echoing it. If the boundary or
provider no-retention/no-training controls cannot be guaranteed, the agent fails closed to the
portal/human and activation requires formal PCI/privacy impact review.

## 10. Scheduling

The voice channel calls the internal scheduling engine; it never writes Google Calendar directly.
The engine returns a small set of normalized IANA-zone options. The agent reads date, local time,
zone, appointment type and channel back to the caller before a concurrency-safe booking command.

On a conflict the agent requests fresh slots. On provider or synchronization uncertainty it creates
a callback task rather than claiming a booking. Cancellation and rescheduling require the approved
identity/purpose path and reuse M013/M024 rules.

## 11. Human transfer and message fallback

Transfer destinations are configuration identifiers, never model-generated telephone numbers. The
policy considers business hours, locale, queue availability, caller request, attempt count and
risk. The caller receives an honest statement before transfer.

If transfer fails, the system offers voicemail or an audited callback request. It preserves the
conversation correlation and a minimized summary but never claims that a person received or
accepted the case. Emergency services are not represented as an SG Solutions service; approved
crisis language remains a Product Owner/legal-policy decision.

Before provider dispatch, the platform persists a `VoiceTransfer` attempt with idempotency,
provider-capability and expected ownership/call-state versions. A timeout enters
`transfer_unknown → reconciling → confirmed_connected|confirmed_not_sent|manual_review`. Provider
lookup decides the next state when supported; ambiguity goes to a human and never triggers a blind
retry. Confirmed connection atomically changes ownership to the human and invalidates every
outstanding agent capability.

## 12. Recording, transcription and summaries

Recording and transcription are separate governed capabilities, both disabled by default. A
provider or model default may not silently enable either. Activation requires jurisdiction-aware
notice/consent, purpose, retention, access, deletion, legal-hold and training-use decisions.

If enabled later, audio first enters a restricted quarantine-like state. Transcript segments carry
confidence, language, speaker and source version; they are not authoritative client facts until
confirmed. Summaries are model output, visibly labeled and linked to the source call. Internal users
can correct a summary without erasing the original audit history.

## 13. Payment boundary

The agent may explain public payment options and arrange delivery of a server-generated secure
Stripe link through an approved written channel. It must never collect card data, accept spoken
payment credentials, call Stripe directly, assert a payment succeeded from caller speech or expose
invoice details without the approved authenticated projection. Stripe remains external financial
truth and Postgres remains operational truth.

## 14. Latency and degradation

Concrete latency and availability budgets require Product Owner approval and provider evaluation.
The architecture nevertheless defines deterministic degradation and gives M096 no durable business
recovery store:

- STT degradation: offer DTMF/menu choices or a callback;
- model timeout: repeat a fixed safe prompt once, then hand off or take a message;
- TTS failure: use a preapproved minimal prompt or provider fallback;
- application-facade timeout: do not repeat a potentially successful write without the same
  idempotency key; offer follow-up rather than claim success;
- scheduling uncertainty: create callback work, not an appointment;
- transfer failure: voicemail/callback route;
- gateway unavailable: provider-level static bilingual fallback and voicemail.
- domain unavailable: provider-level allowlisted transfer/voicemail/static message or a verified
  public contact route; M096 stores no intake, transcript or recovery envelope and claims no action.

Circuit breakers isolate failing speech/model providers. Recovery never depends solely on replaying
ephemeral audio.

## 15. Durable events and jobs

Provider and gateway events enter a transactional inbox. The durable receipt, versioned replayable
canonical envelope and dedupe claim commit atomically before ACK; acknowledged work can replay after
a crash without the HTTP request. Authenticated unknown schemas use the bounded encrypted quarantine,
while invalid-signature bodies are discarded. Domain transitions and outgoing commands use outbox
records. Recommended normalized events include `voice.call.started`,
`voice.language.selected`, `voice.consent.recorded`, `voice.intent.classified`,
`voice.tool.requested`, `voice.tool.completed`, `voice.transfer.requested`,
`voice.transfer.completed`, `voice.call.ended` and `voice.post_call.completed`.

Post-call summary, lead handoff, notification and reconciliation jobs carry stable idempotency keys,
bounded retries and a manual recovery destination. They read durable Postgres state instead of
relying on the Inngest event body as truth.

## 16. Observability and privacy

Operational telemetry may include opaque call id, provider event id hash, stage, latency bucket,
locale, non-sensitive intent class, tool name, outcome code and retry count. It excludes audio,
transcript text, phone/email, intake values, client/case/payment data and model prompts containing
caller text.

Sentry and OpenTelemetry apply allowlists and redaction before export. PostHog receives at most
aggregate operational events after analytics policy approval. Authorized staff downloads or playback
of future recordings create explicit audit events.

## 17. Future administrative UX

The internal platform may later expose call status, locale, safe summary, handoff outcome, associated
lead, callback task and provider-health state. Audio/transcript controls remain hidden unless the
recording gate is approved and the user has the exact permission.

The screen must support keyboard navigation, logical focus, accessible status text, 44-by-44 targets,
WCAG 2.2 AA contrast, reduced motion, bilingual labels and clear “AI-generated”/“unverified” states.
No color alone communicates outcome.

## 18. Test and evaluation strategy

Before Build, contract fixtures must cover valid/invalid/replayed signatures, duplicate and
out-of-order events, expired media tokens and schema violations. Future implementation requires
state-machine, authorization, idempotency, retry, transfer, scheduling-conflict, redaction and
negative-tool tests.

Voice evaluation uses synthetic callers by default and covers Spanish/English, code-switching,
accents, noise, silence, interruption, ambiguous intent, hostile prompt injection, unsupported
professional questions, attempts to reveal another client, spoken card data, latency and every
fallback. It also pauses agent commands around human takeover and transfer timeouts to prove stale
work cannot commit and uncertain dispatch cannot duplicate a call. Real recordings are excluded
until their separate approval.

## 19. Activation sequence

1. Product Owner approves this PRD/ADR and resolves only decisions needed for the target slice.
2. A future explicit `GENERATE` and Build gate authorizes implementation.
3. Implement provider-neutral contracts, domain state and synthetic contract tests.
4. Implement M096 behind local/synthetic provider fixtures.
5. Independently review security, privacy, authorization and failure recovery.
6. Select accounts/providers and approve legal/consent/retention policy.
7. Configure secrets and a controlled sandbox; validate real signatures and media behavior.
8. Conduct bilingual synthetic and authorized test calls with rollback/kill switch.
9. Obtain Product Owner activation approval and record non-sensitive evidence.

No architectural document, mock, test double or disabled adapter makes the telephone channel
Operational.

## 20. Decisions required

The canonical decision markers are in `docs/modules/m005-voice-agent.md` and mirrored as activation
items `VOICE-001` through `VOICE-014`. Unresolved choices do not authorize an agent to invent a
business, legal, provider or retention policy.

## 21. Design acceptance

This design is ready for Product Owner architecture review when the module PRD, ADR 009, dependency
map, external activation register and independent architecture/security reviews agree on the same
boundary and have no open material inconsistency. It still does not authorize product code.
