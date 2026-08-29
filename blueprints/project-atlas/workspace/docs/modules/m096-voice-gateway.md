# M096 - Voice Gateway

## Implementation status

Controlled foundation implemented. Product Owner acceptance, provider activation, runtime certification and production deployment remain pending.

## Scope delivered

- Provider-neutral gateway, provider, call-session, capture, workload-pack and transfer contracts.
- Permission registry and explicit runtime-disabled switches.
- Drizzle persistence preparation for gateway, provider profile, call request, capture control and transfer request metadata.
- Contract tests for caller authentication, capture consent, transfer verification and provider credential boundaries.

## Boundaries

- M096 is transport and media orchestration only; it is not M005 Phone Agent, M049 Reception, M025 communications truth, M078 consent, M081 authorization or M083 secrets.
- Caller ID, DTMF, audio and transcription never authenticate a caller or grant business context.
- Recording and transcription remain disabled. Unknown consent is review-required and never enables capture.
- A transfer request is not a completed transfer; target-leg verification remains false until a future approved runtime implements it.

## Disabled capabilities

No provider connection, number provisioning, SIP/WebRTC signaling, PSTN call, media stream, STT/TTS, recording, transcription, transfer, failover, workload handoff or telemetry is active.

## Activation prerequisites

Product Owner approval, M078 consent policy resolution, M081/M082 authorization and data controls, M083 secret references, M084 provider trust evidence, M093 network readiness, M097 telemetry controls, sandbox verification, rollback runbook and independent security review are required before activation.
