# M005 Voice Agent — Security Architecture Review

- Reviewer: Cyber Neo read-only security auditor
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Scope: documentary M005/M096 candidate only
- Final verdict: `SECURITY-CLEAR for Product Owner documentary review`
- Final score: `0/100 — Secure` for the reviewed documentary scope
- Runtime/provider assurance: not assessed and not implied

## Reviewed candidate

Cyber Neo reviewed all 15 current changed or untracked Markdown paths in the M005 worktree against
base `7bfcfbf513415e9f7a9629c6c1e0ce5d7b8a7c23`. The substantive sources were the 21-section M005 PRD,
M005 design, proposed ADR 009, architecture/state/roadmap/decision authorities, dependency map,
external activation register and their indexes.

At the final review snapshot:

- M005 PRD: 786 lines;
- M005 design: 335 lines;
- ADR 009: 118 lines;
- Product Owner decision markers: 14;
- `VOICE-*` activation rows: 14;
- open Critical/High/Medium/Low findings: 0/0/0/0.

## Initial findings and remediation

### CN-001 — canonical provider-event replay before ACK — Closed

Initial risk: the PRD required a replayable event but the design described only a minimal receipt,
so a crash after acknowledgement could lose the material needed to reconstruct processing.

Remediation:

- receipt, versioned replayable canonical envelope and stable deduplication claim commit atomically
  before acknowledgement;
- the normalized envelope is sufficient to replay without the original HTTP request;
- exact original-byte checksum and verification metadata are retained without putting raw payloads
  in normal telemetry;
- authenticated unknown schemas may enter only an encrypted, isolated, byte-limited quarantine with
  checksum, reason and short TTL;
- invalid-signature bodies are never retained; and
- future Build tests must cover crash-after-ACK and replay without the original request.

Cyber Neo confirmed the same rule in the PRD, design and ADR 009.

### CN-002 — WebSocket media-token transport and consumption — Closed

Initial risk: a short-lived audience-bound token was defined without specifying its safe transport
or atomic consumption, allowing an implementation to leak a bearer token in query/access logs.

Remediation:

- credentials bind issuer, audience, call, provider stream and authorization version;
- a high-entropy `jti`/nonce is atomically consumed once during upgrade before audio frames;
- replay, expiry and simultaneous use fail closed and reconnect requires a new token;
- protected provider header or WebSocket subprotocol is preferred; and
- if a selected provider permits only an opaque query token, proxy, access, application, error and
  trace layers redact the complete value and never copy it to business/client URLs.

Cyber Neo confirmed the contract is consistent across the PRD, design and ADR.

### CN-003 — M096 recovery-envelope state authority — Closed

Initial risk: a proposed `VoiceRecoveryEnvelope` would have created an undefined durable,
Confidential-data store inside the otherwise ephemeral M096 gateway.

Remediation selected: no durable recovery store in M096.

- The entity, resume job and lead-service recovery path were removed.
- During domain outage, M096 persists no intake, transcript or business recovery envelope.
- The call uses an approved provider-level transfer, voicemail or static bilingual fallback, or a
  verified public contact route, and claims no lead/callback/booking action.
- `VOICE-006` requires provider fallback evidence before activation.

Cyber Neo confirmed no residual `VoiceRecoveryEnvelope` or parallel route remains.

### CN-004 — spontaneously spoken protected data — Closed

Initial risk: the agent would not ask for card/protected data, but a caller could speak it before a
recording/transcript/model policy handled it.

Remediation:

- the agent warns callers and never solicits those values;
- DTMF is disabled outside exact approved menu/challenge states and accepts no card input;
- a deterministic detector/redactor runs immediately after STT and before model context,
  transcript/summary persistence, tools and telemetry;
- suspected content is discarded downstream, is never echoed and leaves only a content-free reason
  code;
- speech/model providers require reviewed no-retention/no-training controls; and
- if the boundary cannot be assured, the flow fails closed to portal/human and requires formal
  PCI/privacy impact review before activation.

Future negative tests must demonstrate zero downstream persistence and propagation.

## Confirmed controls

- Exact-byte provider verification and bounds before parsing or expensive work.
- Durable deduplication, out-of-order handling, uncertain-state reconciliation and no blind retry.
- No general Postgres, Supabase service-role, Storage, Stripe or Sanity credential in M096.
- Reauthorization and typed allowlist for every tool call.
- Caller ID is only a routing hint and never identity or a resource grant.
- Caller speech is untrusted data and cannot select tools, destinations, URLs or policy.
- Recording and transcription are off until explicit policy and activation evidence exist.
- Transfer destinations and follow-up domains are configuration allowlists.
- Outbound calls are disabled pending separate consent/legal/business policy.
- Audio/transcript/PII are prohibited from general logs, traces, analytics, fixtures and training.
- Cloud/provider fallback does not depend on homelab or the optional GPU node.

## Independent hygiene scan

A separate read-only Cyber Neo hygiene reviewer scanned the same 14/14 paths and 2,318 initial
candidate lines. It found:

- no secrets, tokens, credentials, account/phone data, personal data or raw provider payloads;
- no private/loopback URLs or local absolute paths;
- no generated build/test/log artifacts;
- no conflict markers or trailing whitespace;
- no false implementation, provider-activation or Operational claims;
- 67 local Markdown links checked with none broken; and
- `git diff --check` passed, apart from informational Windows LF/CRLF warnings.

The scan also confirmed that all external rows remained deferred and no missing business policy was
silently resolved.

## Limitations

This report records documentary review, not executed runtime assurance. It did not validate a
carrier sandbox, callback signatures, multi-instance nonce consumption, WebSocket handshakes,
speech DLP/redaction, model-provider data handling, recording consent law, PCI scope, RLS, real
concurrency or provider availability. Those require an explicit Build gate, independent review,
contract/failure-injection tests and controlled external activation.

Cyber Neo did not modify the repository. Codex applied the documented remediation and recorded this
report; the Product Owner remains the final decision authority.

## Final post-architecture revalidation

After the independent architecture reviewer identified human-takeover fencing, uncertain-transfer
state and activation-register scope gaps, Codex remediated the PRD, design, ADR and register. Cyber
Neo then reviewed the full current 15-path snapshot and reconfirmed `SECURITY-CLEAR`, risk `0/100`,
with no Critical, High, Medium or Low issue.

The final pass explicitly confirmed:

- atomic expected ownership/call-state fencing, agent-capability revocation and stale-work rejection;
- durable pre-dispatch transfer attempts, `transfer_unknown` reconciliation/manual review and no
  blind retries;
- complete `VOICE-003` retention scope and `VOICE-013` ask/transmit/process/persist gate; and
- no regression in CN-001 through CN-004.

It covered 15/15 candidate paths, found no secret/private URL/local-path pattern and passed
`git diff --check`. This remains documentary evidence only.
