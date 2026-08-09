# M004 Security Architecture Review

- Module: M004 WhatsApp Business
- Reviewer: Cyber Neo, strictly read-only
- Security approver: Product Owner
- Status: Security-clear for Product Owner architecture review
- Date: 2026-08-09
- Scope: 14/14 substantive documentary paths plus applicable security authorities
- Final risk score: **0/100 — Secure** for the reviewed documentary scope

## Final result

Open findings: 0 Critical, 0 High, 0 Medium and 0 Low. This result covers documentation and proposed
architecture only. It does not validate executable behavior, provider configuration, DPA, webhooks,
concurrency, RLS, live traffic or deployment; it does not authorize Build or external activation.

## Cyber findings closed

| ID | Initial severity | Initial issue | Resolution |
|---|---|---|---|
| CN-001 | Medium | A receipt could be acknowledged without enough durable data to resume processing. | Supported events persist a versioned replayable canonical envelope atomically before ACK. Authenticated unknown raw data uses protected quarantine; invalid-signature bodies are not retained. |
| CN-002 | Medium | A timeout after possible provider acceptance could trigger a duplicate blind retry. | Durable attempts, adapter capability snapshots, `dispatch_unknown`, reconciliation/manual review and no blind resend. |
| CN-003 | Medium | The webhook did not bound resources before buffering/parsing/signature work. | Adapter manifests bound methods, types/encodings, streaming bytes, deadlines, concurrency and rate before expensive work. |
| CN-004 | Medium | A persisted opt-out could race with queued/dispatching promotional work. | `opt_out_pending`, contact-policy version and per-binding lock/fence serialize withdrawal and dispatch; queued promotional work/retries cancel atomically. |

## Additional independent-review security closures confirmed

- Preliminary intake exactly follows the M003 allowlist, is `Confidential`, structured and stored
  once, excludes every AI/moderation/translation/telemetry/evaluation path, expires/deletes and
  promotes only through M006/M020. It is disabled pending WA-013 provider/privacy approval.
- Contact binding records verification/freshness/expiry and wrong-person/reassignment signals.
  Protected sends re-evaluate trust; stale or suspicious bindings suspend and require separately
  authenticated revalidation under WA-014.

## Controls confirmed

- Phone/contact association does not create identity, authentication, resource grant or client data
  access.
- Initial client-specific requests use generic/authenticated portal paths; deep links reauthorize.
- Consent purposes remain separate; marketing is disabled and opt-out has priority.
- Bilingual templates are typed, versioned, internally reviewed and reconciled with provider state.
- Links are server-owned, allowlisted and scoped; model/user/provider text is never permission.
- Media is not fetched before M011 and later follows quarantine/scan/promotion.
- Secrets, message/media bodies, phone numbers, prompts and provider payloads are absent from general
  telemetry and audit content.
- Provider activation remains explicitly deferred with manual fallbacks and no simulated success.

## Hygiene evidence

- Substantive candidate coverage: 14/14 paths; 0 omitted.
- Secrets, credentials, realistic tokens/account/phone values and PII: 0.
- Local absolute paths, private URLs, URL userinfo and real raw provider payloads: 0.
- Candidate/tracked generated artifacts: 0.
- False Build/provider/live-message/deployment/Operational claims: 0.
- Product Owner markers: 12 genuine decisions; no invented policy/value.
- `git diff --check`, final whitespace and conflict-marker checks: pass.

## Controls requiring future executable evidence

- Official provider challenge/signature and ingress resource enforcement.
- Replay/crash recovery, duplicate/out-of-order callbacks and canonical-envelope deletion.
- `dispatch_unknown` behavior for adapters with/without provider lookup/idempotency.
- Opt-out/send concurrency and stale-policy cancellation.
- Cross-client authorization, deep-link reauthorization and recycled-number suspension.
- Preliminary-intake single-copy/TTL/provider-exposure and zero-telemetry assertions.
- Secret rotation, template synchronization, provider outage, reconciliation and incident runbooks.
- Runtime Cyber Neo, SCA/SAST/DAST and independent implementation review after a future Build gate.
