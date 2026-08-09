# ADR 009 — Voice Gateway specialized runtime boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; not approved for Build or activation
- Date: 2026-08-09
- Scope: M005 Voice Agent and M096 Voice Gateway

## Context

M005 needs a bilingual telephone experience while Project Atlas remains a TypeScript modular
monolith deployed cloud-first. Real-time provider media streams require long-lived bidirectional
connections, low-latency speech orchestration, interruption handling and failure isolation that do
not belong in Astro prerendering or ordinary Next.js request handlers. The original source mentions
specific runtimes and providers, but none is approved or installed.

The system must not create an independent voice CRM, make caller ID an identity source, place
durable business state in a media service or make a home GPU an availability dependency.

## Decision proposed

Keep M005 conversation policy, durable call state, business tools, authorization, consent, audit,
lead/scheduling/handoff behavior and provider ports inside the approved TypeScript domain and
Postgres architecture.

Permit M096 to become a separately deployable, cloud-hosted specialized Voice Gateway only when a
future Build gate approves it. Its responsibility is limited to:

- validating official telephony-provider call/media ingress;
- holding an ephemeral one-call media session;
- coordinating approved STT, voice-model and TTS adapters;
- handling audio buffering, turn-taking and interruption;
- invoking a narrow authenticated application facade; and
- emitting authenticated, idempotent milestones for durable domain processing.

The gateway has no general Postgres, Supabase service-role, Storage, Stripe or Sanity credentials.
It owns no durable client, lead, case, appointment, message, payment, consent or audit state. Exact
runtime, libraries, provider, region and deployment topology remain Product Owner decisions after
measured evaluation; this ADR adds no dependency.

Every gateway command and milestone carries expected call-state and ownership versions. Domain
authorization, version comparison, mutation and outbox write are atomic. Human takeover increments
the version and invalidates outstanding agent capabilities. A transfer is persisted before provider
dispatch; uncertain outcomes enter capability-aware lookup and manual reconciliation, never a blind
retry.

Recording and transcription are disabled until separately approved. Caller ID is always an
untrusted routing hint. Client-specific information follows explicit verification and domain/RLS
authorization; the initial safe path is the authenticated portal.

Provider callbacks are acknowledged only after one transaction records a durable receipt,
versioned replayable canonical envelope and deduplication claim. Invalid-signature bodies are not
retained; authenticated unsupported schemas may enter a bounded encrypted isolated quarantine with
checksum, reason and TTL. M096 stores no durable intake or recovery envelope during a platform
outage; it uses an approved provider-level transfer/voicemail/static fallback and claims no business
action.

## Rationale

This is a justified extraction boundary under the existing modular-monolith rule because it has a
specialized real-time runtime, different connection lifetime, independent failure/latency profile
and narrow security perimeter. It does not imply a microservice per module or shift business logic
out of the monolith.

Provider-neutral ports preserve competition and prevent carrier, STT, model or TTS payloads from
entering business modules. Short-lived audience-bound credentials and a small application facade
limit the impact of a gateway compromise.

## Consequences

- M005 and M096 must be designed and reviewed together but retain distinct ownership.
- The platform must support transactional inbox/outbox processing and reconciliation for provider
  and gateway milestones.
- Handoff/transfer tests must prove atomic ownership fencing and no duplicate dispatch across timeout,
  crash and human-takeover races.
- The gateway must degrade to provider-level bilingual voicemail/callback behavior when application
  or speech providers are unavailable.
- Observability uses metadata allowlists; audio and transcript content are excluded from normal
  logs, traces and analytics.
- Cloud availability is the baseline. M093–M095 can only provide optional, proven-safe capacity.
- Deployment, secrets, scaling, SLOs and data processing agreements need later decisions and review.

## Alternatives rejected

1. **All voice behavior in Astro/Next handlers:** unsuitable for long-lived media and weakens
   failure isolation.
2. **Standalone vendor-owned voice application:** duplicates SG Solutions state and policy and
   creates unsafe provider lock-in.
3. **Home-hosted gateway as the primary path:** cannot meet the business availability boundary.
4. **Vendor SDK calls inside each domain module:** leaks provider semantics and credentials.
5. **Delay architecture until accounts exist:** credentials are not needed to define safe contracts;
   external activation remains a separate gate under ADR 006.

## Security conditions

- Verify callbacks over exact original bytes before parsing or side effects.
- Persist the canonical replay envelope and dedupe claim atomically before ACK; test crash/replay
  without the original request. Quarantine only authenticated unknown schemas, never invalid bodies.
- Enforce replay, size, content-type, duration, concurrency and rate bounds.
- Use encrypted provider media and single-use credentials bound to issuer, audience, call, provider
  stream and authorization version. Consume a high-entropy nonce atomically before frames. Prefer a
  protected header/subprotocol; if query transport is provider-mandated, redact it at every proxy,
  access-log, error and trace boundary and issue a new token for reconnect.
- Reauthorize every application command and schema-validate model/tool input and output.
- Treat caller speech/transcripts as untrusted data, never instructions.
- Never solicit card/protected credentials. Run deterministic detection/redaction immediately after
  STT and before model, transcript, summary, tools or telemetry; retain only a reason code and never
  echo the value. Fail closed to portal/human and require PCI/privacy impact review if this boundary
  or provider no-retention/no-training cannot be proven.
- Fail closed on recording, verification, policy or authorization uncertainty.
- Complete independent security review before any sandbox or production traffic.

## Approval and supersession

This ADR is an architecture candidate. Product Owner approval would authorize the decision only,
not implementation, provider activation or deployment. A future change to make the gateway own
business state, use home infrastructure as the primary path or select a binding runtime/provider
requires a superseding ADR and Product Owner approval.
