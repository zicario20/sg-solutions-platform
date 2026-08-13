# M003–M005 Production Build Design

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Authorization: Decision 028
- Status: Approved conversational direction; persisted specification awaiting Product Owner review
- Scope: M003 Public Chat, then M004 WhatsApp Business, then M005 Voice Agent

## Outcome

Build three real, production-quality communication capabilities without activating real providers.
Each module is independently testable, secure by default and designed to become operational through
configuration and external onboarding rather than replacement.

## Build and activation states

Every channel uses explicit states: `disabled`, `local`, `staging`, `activation_ready` and
`operational`. Construction may reach `activation_ready`; only the Product Owner may authorize
`operational`. Disabled adapters fail closed, never fabricate provider acceptance and emit no public
entry point. Secrets and real customer data are prohibited during this build.

## M003 — Public Chat

M003 provides an accessible, responsive ES/EN chat on the public site. It clearly identifies itself
as automated, answers from approved M002 content, helps select a service, captures only minimal
authorized intake, creates a handoff or lead receipt after explicit action and always offers a human
path. It does not provide professional advice, authenticate clients or expose case/payment status.

The public Astro surface calls a narrow same-origin gateway. The modular-monolith domain owns
session/conversation state, consent evidence, policy decisions, handoff receipts and audit events.
Drizzle is the schema authority and Postgres/RLS enforce access. Model, moderation and translation
are replaceable ports; deterministic fixtures provide local behavior. Transcript bodies remain
ephemeral unless the unresolved retention gate is approved; durable metadata is minimized.

## M004 — WhatsApp Business

M004 reuses the M003 conversation and handoff kernel through a direct Meta Cloud API adapter. It
adds cryptographically verified webhooks, durable inbox/outbox receipts, deduplication, ordering,
opt-in/opt-out, bilingual template metadata, bounded retries, reconciliation and manual recovery.
Webhook acknowledgement is separate from business acceptance. Inbound media, campaigns, detailed
intake and client-specific status remain disabled pending their explicit gates.

The adapter is tested against synthetic Meta payloads and signatures. No Meta account, number,
credential, template submission or live webhook is required to complete construction. The public
WhatsApp CTA remains absent while its activation flag is disabled.

## M005 — Voice Agent

M005 implements a bounded bilingual receptionist over a Twilio telephony adapter and the narrow
M096 real-time voice boundary. A deterministic call simulator and replaceable STT, model and TTS
ports support local testing. The state machine covers greeting, automated-identity disclosure,
language selection, public orientation, minimal message/callback intake, appointment-port calls,
human transfer, safe fallback and closure.

Caller ID is not identity. Recording and transcript retention are off. Client-specific information,
professional advice, sensitive intake, payment by phone and autonomous filings are excluded. Real
numbers, credentials, calls and deployment remain deferred. The public telephone CTA remains absent
while its activation flag is disabled.

## Repository boundaries

- Shared domain contracts live in focused packages, never a generic catch-all package.
- Public presentation belongs to `apps/www`; authenticated/internal projections remain outside this
  build unless a module contract requires a typed port.
- Durable business state belongs to Postgres; provider delivery state is reconciled through receipts.
- Inngest may coordinate retries and reconciliation but never becomes business-state authority.
- External SDKs are confined to adapters; domain services depend on provider-neutral interfaces.
- Telemetry uses allowlists and excludes message bodies, recordings, identifiers and sensitive data.

## Failure and recovery

Invalid input, missing consent, disabled configuration and unresolved policy fail closed. Duplicate
or reordered events are idempotent. Provider ambiguity remains pending until reconciliation; it is
never converted to success by assumption. Operators receive a bounded manual-recovery path and every
material state change produces a minimized audit event.

## Delivery sequence and evidence

For each module: approve the written plan, write failing tests first, implement the smallest passing
slice, run lint/format/type/test/build and migration/RLS checks, perform independent code review,
remediate findings, perform read-only Cyber Neo review, revalidate, update documentation/PCR and
commit. Only then may the next worktree open from that exact clean commit.

## Non-goals

This design does not activate providers, deploy production, create live business accounts, approve
legal copy, resolve retention policy, import real data, merge to the default branch or authorize
M006 and later modules. Unresolved Product Owner decisions remain explicit and their behavior stays
disabled.

## Rollback

Channel flags can disable presentation and transport independently. Migrations must be additive and
forward-compatible; rollback disables new paths before any schema reversal. No rollback may erase
audit evidence or reinterpret an ambiguous external effect as absent.
