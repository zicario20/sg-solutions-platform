# M004 Independent Architecture Review

- Module: M004 WhatsApp Business
- Reviewer: Independent review agent; not the author
- Review owner: Product Owner
- Status: Approved for Product Owner review
- Date: 2026-08-09
- Candidate: branch `codex/m004-whatsapp-business`, base HEAD `80a5698`
- Scope: 14 substantive documentary paths; M004 PRD 895 lines; design 377 lines; ADR 008 122 lines

## Verdict

**Approved — zero open findings.** The provider-neutral M004 architecture is ready for Product
Owner documentary review. This verdict does not approve the product requirement, open a Build gate,
select/activate a provider, add credentials, send live messages, merge, deploy or grant
`Operational` status.

## Evidence reviewed

- Root `AGENTS.md`, product/source authorities, Project State, Roadmap, Decisions and Architecture.
- Registered M004 scope and the available M1–M21 intake review/hash record.
- M003 conversation/intake boundary, M011 upload security, M017/M020 contact/lead ownership, M025
  unified communications, M041 provider abstraction and M043–M045 payment authority.
- M004 normalized PRD, UX/architecture design, proposed ADR 008 and activation register WA-001–014.
- Data classification, consent, authorization, audit, security and observability authorities.
- The complete 14-path documentary diff, local links, whitespace and conflict-marker checks.

## Findings closed

### IA-001 — High: preliminary intake classification and provider boundary

The initial candidate called M003 fields non-sensitive without a WhatsApp-specific boundary. The
final PRD now:

- reproduces the exact M003 per-service allowlist;
- classifies each answer and the complete draft `Confidential`;
- uses provider-supported structured choices and rejects free-text promotion;
- stores each value once in `PreliminaryIntakeDraft`, with a marker/reference-only transcript;
- excludes values from AI, RAG, moderation, translation, telemetry, logs, fixtures and evaluation;
- requires purpose/provider notice, consent, TTL/deletion and terms/DPA review;
- promotes only through an idempotent M006/M020 receipt;
- remains disabled until Product Owner decision WA-013.

### IA-002 — Medium: stale or reassigned phone binding

The final design treats a binding as time-bounded evidence, not permanent ownership. It stores
verification method/evidence, verification/expiry timestamps and wrong-person/provider/reassignment
signals; re-evaluates trust at send time; fails closed for protected transactional content; and
requires separately authenticated revalidation. WA-014 leaves exact method, freshness and cadence to
the Product Owner. Negative tests cover expired and recycled numbers.

### IA-003 — Low: Draft specifications described as approved

The documentation index now states that each specification header is authoritative. `Draft for
Product Owner review` is not approval; an approved design still needs a separate Build gate.

## Architecture consistency retained

- M004 is an official adapter over shared conversation/contact/consent/message primitives, not a
  separate bot/CRM/service.
- Phone/contact binding remains separate from Supabase identity, authorization and resource grants.
- Provider ingress uses bounded, verified, replayable event persistence before acknowledgement.
- Ambiguous outbound acceptance uses `dispatch_unknown` and no blind retry.
- Opt-out is transactionally fenced against queued/dispatching promotional work.
- Media fails closed until the M011 quarantine/scan path is authorized.
- Stripe/payment, appointment, document and handoff state remains owned by source domains.
- The Next.js/Postgres/Drizzle/Inngest design matches the approved baseline and creates no
  microservice or `.NET/Redis` dependency.

## Verification

- 14/14 substantive paths reviewed; 0 omitted.
- PRD: 895 lines and 21 required sections.
- Design: 377 lines; ADR 008: 122 lines.
- Product Owner markers: 12 genuine unresolved decisions; no invented value/policy.
- `git diff --check`: pass; LF/CRLF notices are informational only.
- Local links, final whitespace and conflict markers: clean.

## Remaining gates

- Product Owner approves or revises the M004 PRD/design and proposed ADR 008.
- Product Owner resolves each affected WA-001–WA-014 decision when its behavior is needed.
- Product Owner separately authorizes `GENERATE` and a bounded Build gate before code.
- Provider/account/number/template/security/runbook evidence is required before external activation.

The supplied M1–M21 attachment was outside the worktree during the independent run, so the reviewer
used its checked-in intake review/hash and normalized authorities rather than certifying literal file
identity. The Codex Architecture Agent read the full M004 source during preparation.
