# M005 Voice Agent: Provider-disabled Design

- Status: Build-authorized, provider-disabled foundation only
- Authority: Product Owner M005 source, PROJECT_CONTEXT.md, Decision 033
- Code: English. Caller experience: Spanish and English.

## Boundary

M005 is an automated virtual receptionist for inbound calls. It may identify language/purpose, provide approved general information, create/update a lead, request an appointment action, take a message, request callback/transfer and record a bounded outcome. It is never a specialist, lender, broker, tax adviser, payment processor, signer, browser worker or internal-agent launcher.

This build has no live number, provider account, webhook, media stream, recording, transcription, cloud STT/model/TTS traffic, real caller data, deployment or Operational claim. Mock providers and synthetic signed fixtures are the only executable channel.

## Architecture

```text
Inactive telephony provider -> proof adapter -> FastAPI Voice Gateway
                                             |
                                             v
                             TypeScript Voice Operations Facade
                                             |
                             domain + Drizzle/Postgres + owner modules
```

The TypeScript modular monolith owns durable state, authorization, policy, idempotency, audit events and CRM/calendar/inbox integrations. The FastAPI service only translates voice protocols, orchestrates ephemeral sessions and invokes provider ports. It never accesses Postgres, Redis, Drizzle, payment mutation, raw case data or generic tools. M096 is a later real-time-media boundary, not a second backend.

The gateway calls only `VoiceOperationsFacade` with a short-lived service credential scoped to call and command. The facade verifies audience, expiry, nonce, call binding and idempotency. Caller ID is a lookup hint only; personalized information requires a current platform verification record.

## Durable state and ports

M005 owns `VoiceCall`, `VoiceInteraction`, `VoiceVerificationAttempt`, `VoiceEscalation`, `VoiceCallbackRequest` and metadata-only `VoiceArtifact`. Each has immutable call/correlation IDs, provider-neutral reference, version, timestamps and provenance. Recording/transcript artifacts are disabled by default.

M005 only references Contact, Lead, Conversation, Appointment, CaseFile, ServiceOrder, Task, payment and consent owners. Lifecycle is `received -> greeting -> language_selected -> routing -> active -> handoff | voicemail | callback_pending | completed | failed`; verification, transfer, provider delivery and recording stay independent.

Ports are `TelephonyProvider`, `SpeechToTextProvider`, `VoiceModelProvider` and `TextToSpeechProvider`, all bounded by locale, deadline, cancellation and normalized failure. Twilio/Telnyx/SIP are inactive adapters; mocks are deterministic.

## Admission, policy and recovery

Provider adapters validate their own cryptographic proof before parsing a payload or reaching the facade, using trusted canonical public configuration. Proof is insufficient unless provider connection, account and number bindings are active. Media additionally needs a short-lived, one-time, call-bound platform ticket. Provider-disabled mode rejects external admission before parsing.

The receptionist says it is virtual, begins bilingually, asks one short question at a time, confirms durable changes and offers interruption/silence/DTMF/human/voicemail fallback. Allowed prospect commands are lookup, lead, approved knowledge, availability, appointment, callback/message, transfer and approved link. Verified-client commands are safe status, read-only payment projection, missing-document summary, next appointment, secure message and portal link. The facade applies authorization, purpose and idempotency.

The registry excludes filings, EIN/tax/dispute/loan/card actions, refunds, payment mutation, pricing changes, service approval, signing, partner sharing, browser work, raw database access and internal-agent execution. Stripe is read-only and minimized.

After two misunderstood turns, offer constrained options; after three, create a safe transfer/message/callback. Provider, media or facade failure stops further action. Telemetry includes only IDs, operation, outcome, locale, duration bucket, redaction marker and failure class; never phone, audio, transcript, code, financial, document or case content.

## Activation prerequisites

Before external activation, the Product Owner must approve number/routing, provider contract/account, recording/caller-notice/retention policy, roster/hours, bilingual scripts/knowledge, verification policy, credential rotation, runbooks, staging proof, legal review where required and EXTERNAL_ACTIVATION_REGISTER evidence.

## Acceptance

WHEN a valid synthetic mock call arrives, THE SYSTEM SHALL create one idempotent session, offer the bilingual flow and persist only allowed metadata.

WHEN a provider is disabled, malformed, unconfigured, replayed or mismatched, THE SYSTEM SHALL reject it before business processing.

WHEN a caller requests sensitive or professional action, THE SYSTEM SHALL reveal nothing personalized without valid verification and create only a safe handoff, message or callback outcome.

