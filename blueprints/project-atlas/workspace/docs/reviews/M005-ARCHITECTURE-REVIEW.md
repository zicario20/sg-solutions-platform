# M005 Voice Agent — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `7bfcfbf513415e9f7a9629c6c1e0ce5d7b8a7c23`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer read the current M005 worktree authorities and all changed/untracked Markdown paths,
including the PRD, architecture/experience design, ADR 009, state, roadmap, decisions, dependency
map, external activation register, indexes and security evidence.

The final candidate preserves:

- 21 required PRD sections;
- 14 explicit Product Owner decisions mirrored by 14 `VOICE-*` activation rows;
- Draft/Registered status with no `GENERATE`, Build, provider or deployment authorization;
- the approved TypeScript/Postgres modular-monolith baseline;
- M005 ownership of reception/domain policy and M096 ownership only of ephemeral real-time media;
- Product Owner as final authority, Codex as architect and independent reviewers as auditors.

## Findings and closure

### IA-001 — human takeover lacked an atomic ownership fence — Closed

Initial risk: a tool command authorized immediately before human takeover could complete after the
agent entered `human_owned`, because ownership version was not part of the atomic mutation contract.

Closure:

- every command and gateway milestone carries expected ownership and call-state versions;
- domain authorization, compare-and-set, mutation and outbox write are one atomic unit;
- human takeover increments/revokes the authorization version;
- stale work has no business side effect;
- already-dispatched uncertain effects enter reconciliation instead of being repeated; and
- future tests pause work before authorization, before commit and after uncertain dispatch.

The independent reviewer confirmed consistent coverage in the PRD, design and ADR 009.

### IA-002 — transfer uncertainty missing from state/data authority — Closed

Initial risk: recovery mentioned `transfer_unknown`, but neither the transfer state graph nor
`VoiceTransfer` record could represent an uncertain provider dispatch safely.

Closure:

- a durable attempt with expected versions, provider capability, idempotency and opaque provider
  reference is recorded before dispatch;
- the state model includes `transfer_unknown → reconciling → confirmed_connected |
  confirmed_not_sent | manual_review`;
- provider lookup is capability-aware;
- only proven `confirmed_not_sent` may use a new idempotency key; ambiguity is manual review; and
- confirmed human connection performs the atomic ownership transition.

No blind retry or duplicate transfer is permitted.

### IA-003 — activation rows did not mirror canonical scope — Closed

`VOICE-003` now covers metadata, provider-event quarantine, audio, voicemail, transcript, summary
and verification evidence, including retention/hold/backup/delete testing. `VOICE-013` now blocks
asking, STT/model transmission, processing and persistence until its allowlist, purpose, consent,
TTL, provider terms and zero-propagation tests are approved.

### GOV-001 — security evidence preceded IA remediation — Closed

After IA-001/002 changed security-sensitive contracts, Cyber Neo re-reviewed the complete current
15-path snapshot. `M005-SECURITY-REVIEW.md` now records the post-remediation 786/335/118-line
PRD/design/ADR snapshot and final `SECURITY-CLEAR` risk `0/100` verdict.

## Consistency checks

- M005 is one capability in SG Solutions Platform, not a separate CRM or product.
- M096 has no general database/business-state authority or outage recovery store.
- Caller ID never authenticates or grants client access.
- Provider events are durable/replayable before ACK and unknown authenticated schemas are quarantined.
- Recording/transcription and outbound automation remain disabled.
- Professional decisions, payment capture and sensitive-data collection remain excluded.
- Missing legal, business and provider choices remain explicit Product Owner decisions.
- No approved stack component or business scope was replaced.
- Indexes and authority files point to the same candidate status.

## Verification snapshot

The independent review reported 15 candidate paths and 2,480 lines before the final report metadata
update. At that snapshot, the PRD had 786 lines, design 335, ADR 118 and the initial security report
137. It passed `git diff --check`, resolved 68 local Markdown links and found no trailing whitespace,
conflict marker, secret-like value or local absolute path.

## Limitations

This was a documentary review. It did not validate a telephony provider, real signatures, WebSocket
sessions, multi-instance ownership fencing, speech redaction, RLS, concurrency or recording law.
The source corpus was normalized by the architecture agent before this review; the reviewer audited
the canonical candidate and authorities, not a provider account or runtime. Build and controlled
activation require new evidence and Product Owner authorization.

The independent reviewer did not modify the repository. The Product Owner remains the final
architecture authority.
