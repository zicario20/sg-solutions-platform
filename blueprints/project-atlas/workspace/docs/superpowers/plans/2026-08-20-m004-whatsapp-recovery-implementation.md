# M004 WhatsApp Business Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the provider-disabled local/staging foundation for the official WhatsApp Business
channel so Project Atlas can verify canonical inbound/outbound behavior, consent fences,
idempotency, recovery and the inactive direct Meta Cloud API adapter without credentials, live
messages, real client data, provider activation or production claims.

**Architecture:** Extract a provider-neutral `communications` kernel from the completed M003 public
chat implementation, preserving all M003 behavior through compatibility adapters and migration
tests. M003 and M004 then use one canonical Conversation, Participant, Message, Handoff and Audit
record family; M004 does not create a parallel transcript. Next.js `apps/app` owns server-to-server
webhook ingress. Postgres owns minimized channel, inbox, outbox, policy and recovery projections
through Drizzle migrations and RLS. The direct Meta adapter remains infrastructure behind canonical
ports. Public orientation may reuse M002 knowledge and M003 safety concepts, but M004 does not
duplicate CRM, people, leads, scheduling, payments, documents, audit or unified-inbox authority. All
unapproved provider, retention, consent, template, media, client-status, marketing and intake
behavior fails closed.

**Tech Stack:** TypeScript 6, Next.js 16 App Router route handlers, pnpm/Turborepo, Zod 4, Drizzle
ORM/Postgres, Inngest-compatible pure job contracts, Vitest, Playwright only where a browser surface
exists, Web Crypto/Node crypto, Biome.

**Spec:** `docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md`

**Recovery rule:** Port candidate commits or files only after task-scoped review. A cherry-pick is a transport mechanism, not acceptance evidence; failing or obsolete slices are rewritten against the clean M003 base.

## Global Constraints

- Authority: Decisions 028 and 030, M004 PRD, approved M004 design and ADR 008.
- Work only in `codex/m004-whatsapp-recovery`, based on
  `1187f6ac4859679216290048df9964f269ac765d`.
- Build local/staging behavior only. Do not activate Meta, create an account/number/template,
  introduce credentials, send live traffic, use real client data, merge, push, deploy or claim
  `Operational`.
- Direct Meta Cloud API is the first adapter; do not add an archived/unofficial SDK, WhatsApp Web,
  browser automation, QR session or personal-account path.
- Provider-specific payloads stop in infrastructure. Domain contracts contain canonical channel
  types only.
- A phone/contact binding is not identity, authentication, consent or resource authorization.
- Never expose client, case, payment, document or appointment detail over WhatsApp in this gate.
  Only public content, generic safe routing and secure portal fallback are eligible.
- Marketing, preliminary intake, inbound-media download, templates requiring provider approval and
  human-availability promises remain disabled by unresolved WA decisions.
- No fake lead, booking, payment, document, handoff, delivery or provider success. Success requires a
  durable owning-service/provider receipt; otherwise return an honest unavailable/manual path.
- Store no credentials, tokens, phone numbers, raw provider payloads, secure URLs or sensitive text
  in logs, telemetry, audit payloads, fixtures or reports.
- Invalid-signature bodies are never retained. Authenticated unsupported payloads are not retained
  because the encrypted quarantine/KMS and retention gates are unresolved.
- Accepted synthetic/local text is rejected before persistence when the M003 prohibited-content
  detector identifies SSN/ITIN, card, bank, password/credential or equivalent protected data.
- The database may retain only minimized supported canonical envelopes under the provider-disabled
  gate. Production persistence remains blocked by WA-006 and ADR 005/KMS decisions where applicable.
- Inbound acknowledgement follows durable receipt + canonical envelope persistence.
- Outbound command and attempt are durable before network I/O. Ambiguous I/O becomes
  `dispatch_unknown`; never blind-retry it.
- Opt-out wins over send: persist `opt_out_pending` before acknowledgement and recheck the current
  policy version/fence under the same binding lock immediately before I/O.
- Every task follows RED → GREEN → refactor and focused tests. Immediately before every task commit,
  the implementer runs `corepack pnpm test` once, then self-reviews; after commit an independent
  task-scoped reviewer audits the exact diff. A focused failure never permits the full suite to be
  skipped.
- Cyber Neo remains read-only and is required for the final security gate.

---

## Task 1: Add fail-closed M004 runtime configuration

**Files:**

- Create: `packages/config/src/whatsapp.ts`
- Modify: `packages/config/src/index.ts`
- Modify: `.env.example`
- Modify: `turbo.json`
- Test: `tests/m004/whatsapp-config.test.ts`
- Test: `tests/contract/production-gate.test.ts`

**Contract:**

```ts
export type WhatsAppRuntimeState = "disabled" | "local" | "staging";

export type WhatsAppProvider = "meta_cloud";

export type WhatsAppConfig = {
  enabled: boolean;
  runtimeState: WhatsAppRuntimeState;
  provider: WhatsAppProvider;
  graphApiVersion: string | null;
  webhookMaxBytes: number;
  webhookReadTimeoutMilliseconds: number;
  webhookTotalTimeoutMilliseconds: number;
  webhookConcurrencyLimit: number;
  webhookRateLimitPerMinute: number;
  mediaDownloadEnabled: false;
  marketingEnabled: false;
  preliminaryIntakeEnabled: false;
  providerTrafficAllowed: false;
};

export function readWhatsAppConfig(
  env: Readonly<Record<string, string | undefined>>,
): WhatsAppConfig;
```

Rules:

- `enabled` may be true only for provider-disabled `local|staging` application behavior.
- `providerTrafficAllowed` is a literal `false` in this Build. No environment variable, approval
  boolean or release file can turn provider I/O on. A future Product Owner activation decision must
  explicitly extend this contract and the route wiring under a new reviewed change.
- `WHATSAPP_PROVIDER` accepts only `meta_cloud`; test fakes are dependency-injected, never selected by
  environment.
- The Graph API version is explicit, matches `^v[1-9][0-9]*\.[0-9]+$`, and has no guessed production
  default. It may be absent only when disabled.
- Secrets and account/number IDs are not part of `WhatsAppConfig`; a server-only credential resolver
  owns them later.
- Add documented names only, with empty values and comments, to `.env.example`; never add examples
  resembling real secrets/IDs.

- [ ] Write failing config tests for disabled defaults, local/staging enablement, unsupported
  provider/version, all numeric bounds, impossible test-adapter selection, rejection of
  activation/operational states and proof that provider traffic cannot be enabled.
- [ ] Run `corepack pnpm exec vitest run tests/m004/whatsapp-config.test.ts` and record RED evidence.
- [ ] Implement the smallest validated config reader and export it.
- [ ] Extend production-gate assertions so every current release configuration keeps provider
  traffic disabled; keep that test skipped unless `RELEASE_GATE=true`.
- [ ] Run the focused config/contract tests and record GREEN evidence.
- [ ] Run `corepack pnpm typecheck`, `corepack pnpm test`, self-review and commit.

## Task 2: Extract the canonical communications kernel from M003

**Files:**

- Create: `packages/domain/src/communications/contracts.ts`
- Create: `packages/domain/src/communications/state-machines.ts`
- Create: `packages/domain/src/communications/index.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/domain/src/public-chat/contracts.ts`
- Modify: `packages/domain/src/public-chat/state-machine.ts`
- Modify: `packages/domain/src/public-chat/service.ts`
- Test: `tests/m004/communications-contracts.test.ts`
- Test: `tests/m003/public-chat-domain.test.ts`

**Canonical types:**

```ts
export type ChannelKind = "public_web" | "whatsapp";
export type ChannelLocale = "es" | "en";
export type ChannelConnectionState =
  | "disabled" | "configured" | "sandbox_verified" | "production_verified"
  | "active" | "suspended" | "retired";
export type ProviderEventState =
  | "received" | "signature_verified" | "bounded_normalization" | "persisted" | "applied"
  | "ignored_duplicate" | "manual_review" | "rejected_invalid" | "quarantined"
  | "dead_letter";
export type OutboundCommandState =
  | "draft" | "policy_checked" | "queued" | "dispatching" | "provider_accepted"
  | "dispatch_unknown" | "reconciliation_required" | "reconciled_accepted"
  | "confirmed_not_sent" | "sent" | "delivered" | "read" | "failed"
  | "expired" | "cancelled" | "manual_review";
export type ContactPolicyState =
  | "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
export type ContactPurpose = "conversational" | "transactional" | "service" | "marketing";
export type ContactConsentState =
  | "not_requested" | "granted" | "withdrawn" | "expired" | "superseded";
export type TemplateLifecycleState =
  | "draft" | "internally_approved" | "submitted" | "provider_approved"
  | "provider_rejected" | "paused" | "disabled" | "superseded";
export type ConversationOwnershipState =
  | "new" | "ai_active" | "human_requested" | "waiting_for_human" | "human_active"
  | "returned_to_ai" | "closed" | "expired" | "restricted";
export type BindingTrustState =
  | "unlinked" | "candidate_match" | "linked_prospect" | "linked_client"
  | "verification_due" | "reverified" | "reassignment_suspected" | "suspended" | "revoked";
```

Create canonical `InboundChannelEvent`, `OutboundMessageCommand`, `OutboundDispatchAttempt`,
`ChannelContactPolicy`, `ContactChannelBinding`, `ChannelConversation`, `ChannelMessage`,
`ChannelParticipant`, `ChannelHandoffReceipt`, `CanonicalMediaReference`, `DomainReceipt`,
`ProviderCapabilitySnapshot`, `MessageTemplateProjection` and minimized `ChannelAuditEvent`.
No type may contain `Meta`, `Waba`, Graph API payloads, raw phone numbers, credentials, client/case
facts, arbitrary URLs or payment state.

This is an extraction, not a rewrite: M003's public types remain exported as compatibility aliases or
bounded wrappers over the canonical kernel. M003 state transitions, visitor-safe projection,
idempotency, session ownership and tests must remain behaviorally unchanged. Shared state cannot
depend on a public-chat session; that association belongs to an M003 participant binding.

State machines must expose pure transition functions for connection, inbound receipt, conversation
ownership, outbound command, consent, policy fence, template and binding lifecycles; monotonic
delivery precedence; and explicit terminal-state checks. `quarantined` exists in the contract but is
unreachable while the KMS/quarantine gate is off. Unknown/regressive callbacks return a result code,
not an exception-driven mutation.

- [ ] Write table-driven RED tests for every allowed and forbidden transition, duplicate event
  semantics, out-of-order status precedence and terminal-state behavior. Add an exhaustive M003
  equivalence matrix proving every `new|ai_active|human_requested|waiting_for_human|human_active|
  returned_to_ai|closed|expired|restricted` transition produces the same result before and after
  extraction.
- [ ] Run the focused test and record RED evidence.
- [ ] Implement contracts/state machines with exhaustive unions and `assertNever`-style compile-time
  coverage where useful.
- [ ] Add contract tests proving serialized domain values contain no provider-specific field names.
- [ ] Run focused tests, the complete M003 domain regression and domain typecheck; record GREEN
  evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 3: Add M004 validation, bilingual safe copy and deterministic channel controls

**Files:**

- Create: `packages/validation/src/whatsapp.ts`
- Modify: `packages/validation/src/index.ts`
- Create: `packages/domain/src/communications/channel-policy.ts`
- Test: `tests/m004/whatsapp-validation.test.ts`
- Test: `tests/m004/channel-policy.test.ts`

**Required behavior:**

- Validate canonical IDs, event IDs, message IDs, correlation IDs, locales, timestamps, bounded text,
  button/list reply IDs and provider-neutral media metadata.
- Reuse `inspectProhibitedChatContent` before accepted text persistence/provider/AI calls.
- Normalize Unicode with NFKC only for control detection; do not rewrite retained user content.
- Define an injected `OptOutMatcher`/versioned lexicon contract that is disabled when no approved
  WA-004 policy exists. Synthetic tests may inject clearly labelled fixture commands to prove exact
  matching, Unicode normalization and ambiguity handling, but no fixture list becomes production
  consent/legal policy. Ambiguous text routes to manual review without changing consent.
- Define a versioned `ChannelCopyCatalog` contract with ES/EN keys for automated identity,
  sensitive-data refusal, unsupported media, portal fallback, provider unavailable, human
  unavailable, opt-out receipt and re-consent guidance. The runtime catalog is empty/fail-closed
  while WA-004 is unresolved. Tests use an explicitly synthetic bilingual catalog; those fixture
  strings are never described as reviewed or production copy and cannot be selected by environment.
- `evaluateOutboundPolicy` is a pure fail-closed decision over purpose, binding trust/freshness,
  consent reference, contact-policy version/fence, connection readiness, template eligibility,
  owning-domain receipt and destination key. Marketing always denies in this gate.
- Re-consent cannot be inferred from inbound text. The policy evaluator accepts only a current
  consent-evidence receipt from the future M078 authority; missing evidence denies the send.
- Add commands/contracts for `grantConsentFromReceipt`, `withdrawContact`,
  `resolveAmbiguousOptOutFromReceipt`, `suspendBinding` and `revalidateBindingFromReceipt`. Only
  typed, durable receipts from the separately authorized owner can grant, clear or revalidate;
  inbound possession/text is insufficient.

- [ ] Write RED tests for prohibited content variants, synthetic Unicode control terms, false
  positives, empty runtime copy/lexicon, unsupported interactive/media input, locale parity, receipt-
  gated grant/re-consent/revalidation and all policy-denial reasons.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement parsers, control detection, copy catalog and pure policy evaluator.
- [ ] Prove no protected input is echoed in any rejection or audit reason.
- [ ] Run focused tests plus validation/domain typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 4: Extend the shared kernel with canonical inbox/outbox application behavior

**Files:**

- Create: `packages/domain/src/communications/repository.ts`
- Create: `packages/domain/src/communications/service.ts`
- Create: `packages/domain/src/communications/memory-repository.ts`
- Modify: `packages/domain/src/communications/index.ts`
- Test: `tests/m004/communications-service.test.ts`
- Test: `tests/m004/communications-concurrency.test.ts`

**Repository/application contracts:**

```ts
export interface CommunicationsRepository {
  acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult>;
  claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult>;
  completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict">;
  createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult>;
  claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult>;
  markDispatchOutcome(input: MarkDispatchOutcomeCommand): Promise<"completed" | "conflict">;
  applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult>;
  grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult>;
  withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult>;
  resolveAmbiguousOptOutFromReceipt(input: ResolveOptOutCommand): Promise<ConsentChangeResult>;
  suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
  revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
  reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
  findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
}

export interface MessageTemplateService {
  registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult>;
  recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult>;
  applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult>;
  evaluateEligibility(input: EvaluateTemplateEligibility): Promise<TemplateEligibilityResult>;
}
```

Template copy/variables in this Build are synthetic test definitions only. Runtime registration
fails closed while WA-004/WA-005 are unresolved; the lifecycle service exists so activation extends
the same state/ports rather than replacing them.

The repository must atomically:

- deduplicate inbound events by connection + provider event identity/body digest;
- persist one replayable supported canonical envelope before acknowledgement;
- establish `opt_out_pending` in the same accepted-event transaction;
- create commands with canonical fingerprint/idempotency key and policy version;
- serialize withdraw versus dispatch claim for one binding;
- persist an attempt before any provider invocation;
- enforce lease ownership/version for completion;
- keep ambiguous dispatch durable and non-retryable until reconciliation;
- apply monotonic statuses exactly once.
- keep consent evidence/version history and require a new owning-authority receipt for grant or
  re-consent after withdrawal;
- suspend stale/wrong-person/reassignment bindings and clear suspension only with a separately
  authenticated revalidation receipt;
- apply monotonic template projections without treating provider approval as SG policy approval.

The service uses ports for clock, IDs, keyed digests, public knowledge, handoff and destination
resolution. `EndpointDigestKeyResolver` returns an active server-only key + version for new digests
and a bounded approved set of prior versions for comparison/rotation; missing or unavailable keys
fail closed. Endpoint keys are domain-separated from webhook, idempotency, encryption and rate-limit
keys, never enter persistence/logs, and cannot be selected from browser-visible config. Disabled
owning services return explicit unavailable/manual results. Do not fabricate receipts.

This task extends the extracted shared kernel. It must reuse the Task 2 canonical Conversation,
Participant, Message, Handoff and Audit entities. It must not create `WhatsAppConversation`, a second
transcript repository or an M004-only ownership state machine.

- [ ] Write RED service tests covering accepted inbound, duplicate/replay, body mismatch, opt-out
  priority, stale policy version, simultaneous withdrawal/dispatch, ambiguous attempt, delayed
  statuses, consent grant/re-consent receipts, ambiguous opt-out review, expired/reassigned binding,
  template reconciliation, provider-disabled fallback, absent handoff receipt and prohibited text.
- [ ] Cover endpoint-digest active/prior key rotation, missing key, wrong purpose/version and proof
  that stored/output values cannot reveal the key or raw endpoint.
- [ ] Include a deterministic concurrency harness that controls the lock boundary rather than a
  flaky timing loop.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement the memory repository as the executable reference contract and the application
  service with bounded provider/handoff/knowledge timeouts.
- [ ] Run focused tests plus domain typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 5: Implement the inactive direct Meta Cloud API adapter and webhook verifier

**Files:**

- Create: `apps/app/src/lib/whatsapp/meta-contracts.ts`
- Create: `apps/app/src/lib/whatsapp/meta-webhook.ts`
- Create: `apps/app/src/lib/whatsapp/meta-adapter.ts`
- Create: `apps/app/src/lib/whatsapp/credentials.ts`
- Modify: `apps/app/package.json`
- Test: `tests/m004/meta-webhook.test.ts`
- Test: `tests/m004/meta-adapter.test.ts`

**Infrastructure contracts:**

```ts
export interface MetaCredentialResolver {
  resolveVerificationSecret(connectionId: string): Promise<{ appSecret: string; verifyToken: string }>;
  resolveDispatchSecret(connectionId: string): Promise<{
    accessToken: string;
    phoneNumberId: string;
    graphApiVersion: string;
  }>;
}

export interface WhatsAppProviderAdapter {
  capabilities(): ProviderCapabilitySnapshot;
  normalizeVerifiedEvent(raw: Uint8Array, context: VerifiedWebhookContext):
    Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope>;
  dispatch(command: ProviderDispatchCommand, signal: AbortSignal): Promise<ProviderDispatchResult>;
  reconcile(attempt: ProviderReconciliationQuery, signal: AbortSignal):
    Promise<ProviderReconciliationResult>;
  reconcileMessages(query: ProviderMessageReconciliationQuery, signal: AbortSignal):
    Promise<ProviderMessageReconciliationResult>;
  reconcileTemplates(query: ProviderTemplateReconciliationQuery, signal: AbortSignal):
    Promise<ProviderTemplateReconciliationResult>;
}
```

The adapter also exposes an immutable `ProviderCapabilitySnapshot` covering request idempotency,
message lookup/reconciliation, supported inbound/status/media kinds and template projection. The
domain persists the snapshot on each attempt; it never assumes a provider capability from adapter
name alone. Template normalization/reconciliation maps provider reference, locale, category,
components, status, version and provider timestamp into `MessageTemplateProjection` without putting
provider payload types in domain contracts.

Rules:

- Verify `hub.mode`, exact configured verify token and bounded challenge for GET.
- Verify `X-Hub-Signature-256=sha256=...` over untouched raw POST bytes using HMAC-SHA256 and
  constant-time comparison before JSON parsing/persistence.
- Strictly normalize supported text, interactive reply, status and media-reference metadata into
  canonical types. Reject schema ambiguity and multiple-account/connection mismatch.
- Strictly normalize template status/projection callbacks needed for provider reconciliation; an
  unknown or regressive template projection goes to manual review and cannot activate a template.
- Invalid-signature content is not returned, logged or retained.
- Authenticated unsupported events return a minimized unsupported result and are not quarantined in
  this gate.
- Dispatch uses injected `fetch`, exact `https://graph.facebook.com/{version}/{phoneNumberId}/messages`,
  bearer auth, JSON allowlist and an AbortSignal. No adapter logs request/response bodies or tokens.
- Lost/ambiguous response returns `dispatch_unknown`; HTTP rejection known before acceptance returns
  a bounded failure. The adapter never manufactures delivery.
- Reconciliation returns `unsupported` until a current official lookup contract is activation-
  reviewed; ambiguous sends therefore require manual review, not resend.
- The production credential resolver is a fail-closed interface only in this gate. Test fixtures use
  synthetic values isolated to tests; no fake adapter is environment-selectable.

- [ ] Write official-contract-shaped synthetic RED tests for GET verification, valid/invalid/malformed
  signature, byte fidelity, supported/unknown payloads, connection mismatch, capability snapshots,
  template projection/reconciliation, outbound URL/body/header, abort, accepted, rejected and
  ambiguous outcomes.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement without adding a WhatsApp SDK or new network dependency.
- [ ] Prove error/log projections contain no credential, phone, body or raw payload.
- [ ] Run focused tests, app typecheck and dependency audit; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 6: Add the bounded Next.js webhook ingress

**Files:**

- Create: `apps/app/src/lib/whatsapp/ingress.ts`
- Create: `apps/app/src/lib/whatsapp/runtime.ts`
- Create: `apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts`
- Test: `tests/m004/whatsapp-ingress.test.ts`
- Modify: `tests/contract/module-resolution.ts`

**Boundary:**

- GET supports provider challenge only; POST supports callbacks only; all other methods return 405.
- Validate connection ID before credential lookup.
- Enforce exact supported content type, reject unsupported content encoding, declared and streamed raw
  size, read timeout, total timeout, concurrency semaphore and rate budget before parsing.
- POST signature verification occurs before JSON normalization or persistence.
- Return 200 only after `acceptInbound` durably commits receipt + replayable canonical envelope.
- Duplicate supported events acknowledge idempotently; retryable durability/dependency failure returns
  a bounded 5xx; invalid auth/payload uses bounded 4xx with no reflected data.
- The exported App Router runtime always uses the Build config where `providerTrafficAllowed` is
  literal false and returns fail-closed before challenge/credential lookup/body read. No current
  environment can activate it. A non-exported dependency-injected handler factory is the sole path
  used by synthetic contract/integration tests. It does not read `NEXT_PUBLIC_*` values.
- Responses are `no-store`, correlation IDs are opaque and security telemetry is minimized.

- [ ] Write RED tests with a controlled ReadableStream for oversize, slow read, timeout, concurrency,
  rate exhaustion, malformed UTF-8/JSON, invalid signature, repository failure, duplicate and durable
  success. Separately prove the real route cannot reach credential, parser, repository or adapter
  code in `disabled`, `local` or `staging` configuration.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement pure ingress handler factory first, then the thin App Router adapter.
- [ ] Add module-resolution coverage for server imports.
- [ ] Run focused tests, app typecheck and `corepack pnpm --filter @atlas/app build`; record GREEN
  evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 7: Add Drizzle schema, forward migrations and restricted runtime role

**Files:**

- Modify: `packages/database/src/schema.ts`
- Create: Drizzle custom role bootstrap `drizzle/0006_m004_communications_role_bootstrap.sql`
- Create: generated structural `drizzle/0007_*.sql`
- Create: Drizzle custom data migration `drizzle/0008_m004_communications_backfill.sql`
- Modify: generated `drizzle/meta/_journal.json`
- Create: generated `drizzle/meta/0006_snapshot.json`
- Create: generated `drizzle/meta/0007_snapshot.json`
- Create: generated `drizzle/meta/0008_snapshot.json`
- Create: `packages/database/scripts/provision-communications-runtime.ts`
- Create: `packages/database/scripts/validate-communications-runtime.ts`
- Create: provider-neutral persistence record and validator
  `packages/database/src/communication-event-envelope.ts`
- Create: exhaustive Meta-contract transformation
  `apps/app/src/lib/whatsapp/provider-envelope-persistence.ts`
- Create: `packages/database/src/communication-contact-evidence.ts`
- Modify: `packages/database/package.json`
- Modify: `package.json`
- Test: `tests/m004/communications-schema.test.ts`
- Test: `tests/m004/communications-envelope-codec.test.ts`
- Test: `tests/m004/communications-contact-evidence.test.ts`

**Tables:**

- `communication_channel_connections`
- `communication_contact_bindings`
- `communication_contact_policies`
- `communication_contact_evidence_events`
- `communication_conversations`
- `communication_participants`
- `public_chat_conversation_sessions`
- `communication_messages`
- `communication_provider_event_receipts`
- `communication_event_envelopes`
- `communication_message_templates`
- `communication_outbound_commands`
- `communication_dispatch_attempts`
- `communication_handoffs`
- `communication_audit_events`

The migration replaces the transcript-like M003 tables rather than adding parallel records:

- backfill `public_chat_conversations` into `communication_conversations`;
- backfill public-session ownership into `public_chat_conversation_sessions` plus a canonical
  participant;
- backfill `public_chat_messages`, `public_chat_handoffs` and `public_chat_audit_events` into their
  canonical communication tables preserving opaque IDs, ordering, states, timestamps and audit
  sequence;
- leave the existing M003 read/write path intact through this preparatory task. Task 8 updates M003
  citations/idempotency foreign keys and the M003 Postgres store, then removes the superseded tables
  only after forward-migration and repository parity prove the cutover safe.

M003 sessions, rate limits, citations, idempotency commands and public-chat-specific projections
remain M003-owned. The migration must be compatible with an empty database and a populated synthetic
0005 database; no manual dashboard changes are allowed.

Data rules:

- Use opaque IDs; no raw phone, credential, token, arbitrary URL or provider raw payload column.
- Endpoint comparison uses a keyed digest plus key version. The digest is not authorization and not
  decryptable contact data.
- Supported event envelopes contain deterministic typed allowlisted fields for every real
  `CanonicalProviderEnvelope` variant plus schema/body-retention markers; no raw provider payload
  or sender endpoint is retained. The Meta boundary replaces sender endpoints with an authorized
  binding reference and transforms provider contracts exhaustively; the database package owns only
  the provider-neutral persistence record and strict validator. The codec must round-trip every
  supported safe projection, while real traffic remains activation-blocked by WA-006.
- Message body persistence is explicitly controlled and defaults metadata-only outside the synthetic
  local test gate. Any future retained body is Confidential and requires the approved retention path.
- Every state/version/locale/purpose/direction has a CHECK constraint. Every idempotency/fingerprint,
  provider event identity, message reference and ordinal invariant has a UNIQUE constraint/index.
- All tables enable/force RLS. Canonical Conversation/Participant/Message/Handoff/Audit tables use
  separate least-privilege policies for `atlas_public_chat_gateway` and
  `atlas_communications_gateway`; M003 can access only `channel_kind='public_web'` rows linked to its
  own public session, while M004 can access only its communications-runtime scope. M004-only channel,
  inbox, outbox, binding, policy, template and provider projections grant only
  `atlas_communications_gateway`. `anon`, `authenticated`, `public` and migration principals have no
  runtime DML.
- Use a non-superuser, non-`BYPASSRLS` runtime login that may `SET ROLE atlas_communications_gateway`;
  migration/admin credentials remain separate.
- Generate every migration and snapshot/journal entry with Drizzle. Custom 0006 idempotently
  bootstraps the cluster-global gateway role, structural 0007 treats that role as existing, and
  custom 0008 owns data-copy/parity/security SQL. Do not hand-edit snapshots/journal or mutate
  schema through the Supabase dashboard.

- [ ] Write RED schema tests for table inventory, prohibited columns, constraints, indexes, RLS,
  policy role, fresh migration, populated upgrade-from-0005 semantics and M003 count/order/state/
  foreign-key parity. Include positive/negative RLS tests for both runtime roles and cross-channel/
  cross-session denial.
- [ ] Run focused tests and record RED evidence.
- [ ] Generate custom 0006 role bootstrap, structural 0007 with old/new tables present, then custom
  0008 backfill/parity gate. Inspect all SQL/snapshots and add idempotent runtime scripts. Do not
  change M003 read/write paths or drop old tables in this task.
- [ ] Run schema tests, database typecheck and `git diff --check`; record GREEN evidence.
- [ ] If a disposable Postgres runtime is available, apply 0000→0008 fresh and 0000→0005→0008
  upgrade, then prove runtime queries succeed only through the restricted role. If unavailable, keep
  the integration test skipped honestly and mark real execution as a closure blocker rather than
  claiming evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 8: Implement the Postgres communications repository

**Files:**

- Create: `packages/database/src/postgres-communications-store.ts`
- Create: `packages/database/src/communications-repository.ts`
- Modify: `packages/database/src/index.ts`
- Modify: `packages/database/src/schema.ts`
- Modify: `packages/database/src/postgres-public-chat-store.ts`
- Modify: `packages/database/src/public-chat-repository.ts`
- Create: Drizzle custom parity/FK cutover `drizzle/0009_m004_communications_cutover_guard.sql`
- Create: generated structural removal `drizzle/0010_*.sql`
- Modify: generated `drizzle/meta/_journal.json`
- Create: generated `drizzle/meta/0009_snapshot.json`
- Create: generated `drizzle/meta/0010_snapshot.json`
- Test: `tests/m004/communications-repository.test.ts`
- Test: `tests/m004/communications-postgres.integration.test.ts`
- Test: `tests/m003/public-chat-postgres.integration.test.ts`

**Requirements:**

- Mirror the Task 4 memory contract; memory and Postgres implementations must pass one shared
  repository conformance suite.
- Keep M003 public chat behavior on the same canonical Conversation/Participant/Message/Handoff/Audit
  tables through an M003 compatibility adapter; no read/write path may continue using superseded
  transcript tables.
- Generate 0009 with `drizzle-kit generate --custom --name m004_communications_cutover_guard`. It
  proves migrated count, IDs, ordinals, states, audit sequence and references match, changes M003
  citation/idempotency foreign keys to canonical targets and aborts on any mismatch. Then change the
  final schema to canonical-only and generate 0010 structurally with Drizzle to remove superseded
  tables. Never hand-edit snapshots/journal.
- Every request executes in a transaction that proves the current login is non-superuser,
  non-`BYPASSRLS`, a member of `atlas_communications_gateway`, and sets only that role locally.
- Accept inbound atomically with deduplication and opt-out fence.
- Claim/lease inbox and outbox work with `FOR UPDATE SKIP LOCKED`, bounded lease and owner token hash.
- Dispatch claim locks the binding/policy row and rechecks expected policy version immediately before
  returning permission to perform I/O.
- Completion requires active lease and optimistic version. Crash/expired lease remains recoverable.
- Store only minimized result codes/digests; no raw request/response/phone/token/body in attempts,
  audit or telemetry.
- Integration test runs only when `M004_POSTGRES_INTEGRATION_URL` is explicitly supplied and must use
  the restricted runtime principal.

- [ ] Extract the shared conformance cases and run them against an intentionally incomplete Postgres
  adapter to capture RED evidence.
- [ ] Implement the minimal store/repository transaction paths.
- [ ] Generate/inspect custom 0009 plus structural 0010, run memory + Postgres contract tests, and
  execute both 0000→0010 fresh and populated 0000→0005→0010 upgrade when a disposable runtime is
  available. Report skipped
  evidence honestly otherwise and do not close M004 without the real migration gate.
- [ ] Run database/domain typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 9: Add inbound application, outbox dispatch and reconciliation jobs

**Files:**

- Create: `packages/domain/src/communications/jobs.ts`
- Create: `apps/app/src/lib/whatsapp/jobs.ts`
- Test: `tests/m004/whatsapp-inbound-processing.test.ts`
- Test: `tests/m004/whatsapp-dispatch.test.ts`
- Test: `tests/m004/whatsapp-reconciliation.test.ts`

**Jobs:**

```ts
export async function processInboundChannelEvent(input: ProcessInboundInput): Promise<JobResult>;
export async function dispatchOutboundMessage(input: DispatchOutboundInput): Promise<JobResult>;
export async function reconcileUnknownDispatch(input: ReconcileDispatchInput): Promise<JobResult>;
export async function reconcileMessageTemplate(input: ReconcileTemplateInput): Promise<JobResult>;
export async function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult>;
```

Requirements:

- Pure application functions own idempotency/job keys, lease acquisition, bounded retries and manual
  recovery; Inngest registration is a thin optional adapter and is not business-state authority.
- Process opt-out before public orientation. Public answers use only current M002 knowledge through
  a provider-neutral port and the M003 prohibited-content/handoff policy concepts. Each answer
  preserves the current M002 source/version/review/disclosure receipt; stale, unknown or disclosure-
  incomplete content fails closed.
- `case_status|payment_question|document_question` never query protected systems in this gate; they
  return the generic secure portal path.
- Appointments, leads, payments, documents and handoffs require their owning module receipt. Missing
  integration returns an honest manual/unavailable result. A receipt is validated for owner domain,
  operation, resource binding, idempotency identity, result, issued/expiry time and correlation; a
  missing, wrong-domain, wrong-resource, expired or duplicate-mismatch receipt cannot display
  success.
- Preliminary intake remains structurally off: no intent, interactive payload or free-text path may
  ask an M003 intake field, create a draft or persist a field value. The only response is the safe
  public/portal/manual route supplied by the synthetic test catalog.
- Media event processing records metadata and returns the safe upload-portal path without fetching.
- Dispatch re-evaluates policy under the repository lock, creates an attempt, calls the adapter with
  a bounded timeout and commits accepted/known failure/unknown exactly once.
- `dispatch_unknown` goes only to reconciliation/manual review; no automatic resend.
- Template reconciliation applies only monotonic provider projections from a capability-declared
  adapter. Provider approval never bypasses SG internal approval, consent or send-time policy.
- Wrong-person, reassignment and provider invalid-recipient signals suspend the binding. Revalidation
  or re-consent requires a durable receipt from the separately authorized identity/consent owner;
  inbound possession or text alone cannot clear suspension or restore consent.
- A notification/marketing scheduler does not exist in this gate.

- [ ] Write RED tests for duplicate/crash replay, stale lease, opt-out race, protected intent,
  disabled owning service, media no-fetch, provider timeout, accepted-response-loss, template
  reconciliation, expired verification, wrong-person/reassigned-number suspension, failed
  text-based re-consent and recovery. Add positive/negative M002 provenance/disclosure tests,
  valid/invalid owning-domain receipt tests for lead/booking/payment-link/handoff, and exhaustive
  intake-disabled tests proving zero question/draft/transcript value.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement pure jobs and the inactive Next/Inngest adapter boundary.
- [ ] Run focused tests plus domain/app typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 10: Add minimized observability and security contract coverage

**Files:**

- Create: `packages/observability/src/communications.ts`
- Modify: `packages/observability/src/index.ts`
- Test: `tests/m004/whatsapp-observability.test.ts`
- Test: `tests/m004/whatsapp-security.test.ts`

**Allowed telemetry:**

```ts
export type CommunicationsTelemetryEvent = {
  operation: "webhook" | "inbound_job" | "dispatch" | "reconciliation";
  result: string;
  correlationId: string;
  connectionState?: ChannelConnectionState;
  durationBucket?: "lt_100ms" | "lt_500ms" | "lt_2s" | "gte_2s";
};
```

No event accepts arbitrary attributes. Redaction tests must seed marker strings representing phone,
token, message, media ID, provider payload, secure URL and protected identifier, then prove they are
absent from logs/events/errors/audit projections.

Security tests cover signature timing-safe behavior, invalid-signature no-persistence, rate/resource
limits, provider/account confusion, replay, prompt injection as data, contact-match non-disclosure,
no media fetch, no fake adapter in production config and fail-closed dependency/telemetry failure.

- [ ] Write RED observability/security tests.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement exact-schema observability with safe failure.
- [ ] Run focused tests, lint and typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.

## Task 11: Execute end-to-end provider-disabled scaffold validation

**Files:**

- Create: `tests/support/run-m004-integration.mjs`
- Create: `tests/m004/whatsapp-route.integration.test.ts`
- Modify: `package.json`
- Modify: `turbo.json`

The integration harness must start `apps/app` in a deterministic local/staging provider-disabled
configuration and use only synthetic non-sensitive fixtures. It proves:

- disabled runtime rejects callbacks honestly;
- configured synthetic dependency injection verifies challenge/signature and durably acknowledges
  one event;
- duplicate event produces one logical effect;
- opt-out beats a queued send;
- provider adapter is never called without the explicit controlled test dependency;
- protected/status/media paths return safe portal/manual alternatives;
- no network call reaches Meta or another external host;
- all responses are bounded/no-store and contain no sensitive fixture markers.

This is an API/integration test, not a fake chat UI. M004 has no new public/client/admin visual
surface in this gate; M025 owns the future Admin inbox. UI/UX Pro Max is therefore not used to invent
an unauthorized screen.

- [ ] Write the failing integration test/harness and record RED evidence.
- [ ] Implement only the wiring needed to exercise the real route/application/repository boundary.
- [ ] Run `corepack pnpm test:m004`, app build, full unit suite and M001–M003 regression suites.
- [ ] Record exact pass/skip counts, verify no external request, self-review and commit.

## Task 12: Close M004 documentation, independent audits and repository state

**Files:**

- Create: `docs/runbooks/M004-WHATSAPP-BUSINESS-RUNBOOK.md`
- Create: `docs/reviews/M004-CODE-REVIEW.md`
- Create: `docs/reviews/M004-SECURITY-BUILD-REVIEW.md`
- Create: `docs/phases/M004-PHASE-COMPLETION-REPORT.md`
- Modify: `docs/modules/m004-whatsapp-business.md`
- Modify: `docs/adr/008-whatsapp-channel-adapter.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DATA_CLASSIFICATION.md`
- Modify: `SECURITY.md`
- Modify: `EXTERNAL_ACTIVATION_REGISTER.md`
- Modify: `ROADMAP.md`
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `CHANGELOG.md`
- Modify: `README.md`

Closure rules:

- Complete the runbook for disabled/configured states, secrets by name only, suspension, replay,
  reconciliation, opt-out, incident response, unresolved deletion-policy gates and manual fallback.
- Run a whole-branch independent code/architecture review by an agent that did not implement the
  module. Resolve every Critical/Important finding with regression evidence and re-review.
- Run Cyber Neo read-only over the frozen candidate. Cyber Neo writes only its external report and
  never edits the repository. After review, the implementer may add a sanitized evidence summary to
  `M004-SECURITY-BUILD-REVIEW.md`; a separate reviewer verifies that summary. Resolve blocker/high
  findings or record a real Product Owner blocker; do not lower severity to close the phase.
- Execute fresh commands: frozen install twice, audit, lint, format check, typecheck, unit tests,
  M004 integration, M001–M003 regressions, app/www builds, contract imports and `git diff --check`.
- If disposable Postgres is available, execute fresh and upgrade migrations plus restricted-role
  integration. If it is not, do not claim database Build verification and do not close M004 as
  Build complete.
- Search for secrets/local paths/real data, provider activation claims, fake-success claims,
  `Operational`, unofficial WhatsApp approaches and unresolved checkboxes/placeholders.
- PCR status is `Build complete — provider disabled; PO Acceptance pending` only when all required
  evidence passes. Otherwise use `PARTIAL` with exact blockers.
- Keep WA-002–WA-014 unresolved, and list each affected disabled behavior. Do not invent any Product
  Owner/legal policy.
- Freeze and audit an implementation candidate commit. Record that candidate SHA and its executed
  evidence in a later documentation commit. The documentation commit cannot record its own SHA;
  report its exact SHA externally after `git show --check` and a clean-tree proof, then obtain a
  final read-only documentary audit over that exact head.
- Do not merge, push, deploy or activate. M005 remains blocked until M004 closure and Product Owner
  direction.

- [ ] Create the runbook and documentation drafts from executed evidence, not planned claims.
- [ ] Perform independent whole-branch review and fix/re-review loop.
- [ ] Perform Cyber Neo read-only review and fix/re-review loop.
- [ ] Run the complete verification matrix and record exact outputs.
- [ ] Synchronize all source-of-truth documents and create the PCR/reviews.
- [ ] Commit the frozen implementation candidate, record its SHA in the later documentary closure
  commit, then verify/report the documentary head SHA externally and obtain final read-only audit.

## Final Definition of Done

M004 is locally complete only when the branch contains a clean, independently reviewed,
provider-disabled implementation that satisfies all current local Build acceptance and negative
acceptance criteria, preserves every external gate, passes the full validation matrix including
real fresh/upgrade Postgres evidence, and records a truthful PCR. It is not deployed, provider
activated, merged, accepted by the Product Owner or `Operational` merely because this plan completes.
