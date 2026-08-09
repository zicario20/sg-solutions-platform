# ADR 008: Official provider-neutral WhatsApp channel adapter

- Status: Proposed for Product Owner approval
- Date: 2026-08-09
- Owner: Codex Architecture Agent
- Scope: M004 WhatsApp Business

## Context

M004 must support WhatsApp orientation, follow-up, templates, appointments, secure links,
notifications and human handoff. The Product Owner-supplied source correctly prohibits WhatsApp Web
automation and provider coupling, but its older `.NET/Redis` diagram conflicts with the approved
pnpm/Astro/Next/Supabase baseline. The architecture must also avoid duplicating the M003 conversation
kernel, M017/M020 contact/lead records and M025 unified inbox.

SG Solutions does not yet have its final WhatsApp Business account, institutional number, approved
templates or provider agreement. ADR 006 permits durable architecture now while external activation
remains separately gated.

## Proposed decision

M004 will be an **official provider-neutral channel adapter** inside the modular monolith:

1. Shared conversation, message, handoff, contact, consent and audit rules remain provider-neutral
   and reusable with M003/M025.
2. Provider-specific server-to-server webhook handlers live under a narrowly scoped integration
   ingress in Next.js `apps/app`. They authenticate the provider challenge/callback, perform bounded
   normalization and atomically persist one event receipt plus a replayable canonical envelope
   before acknowledgement/domain processing. Authenticated unknown events may use a separately
   encrypted, byte-bounded, short-lived and access-restricted quarantine; invalid-signature bodies
   are never retained.
3. Postgres owns operational conversation, contact, consent, inbox/outbox and recovery state. The
   provider owns its external account, template and delivery state; Postgres stores reconciled
   projections.
4. Inbound/outbound delivery uses a transactional inbox/outbox, stable idempotency keys, monotonic
   status transitions, bounded retries and reconciliation because provider events may repeat or
   arrive out of order.
5. Every outbound attempt is durable before network I/O and records the adapter's real provider-
   idempotency/lookup capabilities. If the provider may have accepted a message but the response is
   lost, the attempt enters `dispatch_unknown`; it is reconciled or manually resolved and never
   retried blindly.
6. A direct Meta Cloud API adapter or an approved Business Solution Provider adapter may implement
   the canonical port after Product Owner selection. Provider types never enter domain contracts.
7. Test fakes are allowed only in contract tests and cannot be selected in production.
8. WhatsApp Web, QR-session libraries, personal-account automation, browser emulation and unofficial
   protocols are prohibited.
9. A phone/contact binding is not authentication, authorization or a resource grant. Initial client-
   specific requests use the secure portal; any later direct projection requires its own approved
   IAM/resource-access boundary.
10. Inbound media is not fetched before the M011 quarantine/scan path is authorized. A provider media
   reference alone never becomes a Document.
11. Consent withdrawal and outbound dispatch are serialized per channel binding. A deterministic
   opt-out match persists an `opt_out_pending` fence before acknowledgement; each outbound command
   carries an expected contact-policy version and rechecks it under the same lock immediately before
   I/O. Withdrawal increments the version and atomically cancels affected queued promotional work.
12. Preliminary intake over WhatsApp is disabled by default. A future Product Owner gate may enable
   only the M003 structured field allowlist as a first-party, TTL-bound `Confidential` draft with
   explicit provider-exposure consent, no AI/moderation/translation/telemetry/evaluation use and
   evidence capture through M006, consent through M078 and receipt-only lead promotion through M020.
13. A contact-channel binding is time-bounded evidence, not permanent endpoint ownership. Protected
   transactional sends re-evaluate approved verification evidence/freshness and provider/wrong-
   person/reassignment signals. Stale or suspicious bindings are suspended and may be revalidated
   only through a separately authenticated surface; inbound possession alone does not re-prove
   client identity.

## Runtime boundary

The M003 browser gateway stays same-origin in Astro `apps/www` under ADR 007. M004 callbacks are
provider-to-server traffic and belong to `apps/app`, where the future internal communications and
administration surfaces live. The integration route does not require an interactive Supabase
session; it fails closed on provider challenge/signature verification and has no general unauthenticated
application access.

Before buffering/parsing, each provider route enforces an adapter ingress manifest: exact methods,
media types/content encodings, maximum raw bytes, streaming read/total deadlines, concurrency and
rate budget. The platform hard ceiling and current official provider contract are both applied, with
the stricter control winning. IP allowlists are optional defense in depth and never replace the
official challenge/signature. No route has an unbounded raw-body or concurrency default.

Domain/application ports live in shared workspace packages. Provider handlers/adapters are
infrastructure. No separate messaging microservice is justified initially; extraction would need a
new ADR demonstrating an approved scale, security, deployment or failure-isolation boundary.

## Consequences

### Positive

- M004 reuses one conversation/contact/consent model and can feed M025 without migration by copy.
- Provider selection and account activation can occur later without disposable domain logic.
- Duplicate/out-of-order delivery and outages have explicit durable recovery.
- Identity, sensitive documents and financial authority remain in their owning domains.
- The current TypeScript monorepo baseline remains intact.

### Costs and constraints

- The team must maintain adapter contract tests against evolving official provider behavior.
- Live template/window/delivery tests cannot finish until an account and number exist.
- Exactly-once transport is not assumed; logical idempotency and reconciliation add state and
  operational work.
- Direct WhatsApp case details remain unavailable until a separately approved high-assurance
  authorization design exists.

## Rejected alternatives

- **Direct provider calls from CRM, model or UI:** spreads secrets/payload formats and bypasses
  policy, authorization and idempotency.
- **Independent WhatsApp bot/database:** duplicates shared platform primitives and cross-channel
  history.
- **WhatsApp Web/personal account automation:** unofficial, fragile and incompatible with the
  security/audit baseline.
- **Use Astro M003 gateway for provider callbacks:** mixes browser session/CSRF ownership with
  server-to-server integration ingress and future internal inbox operations.
- **Create a standalone messaging microservice now:** no demonstrated scale, runtime or isolation
  requirement.
- **Wait for Meta credentials before designing:** conflicts with ADR 006 and risks later disposable
  integration work.

## Approval effect

Approval fixes the M004 channel/provider/runtime boundary for implementation planning. It does not
select direct Meta versus a BSP, authorize `GENERATE`, create a provider account, register a number,
submit templates, add credentials, enable live traffic, merge or deploy.
