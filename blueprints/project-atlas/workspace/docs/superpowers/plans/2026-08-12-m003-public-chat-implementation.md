# M003 Public Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete provider-disabled M003 Public Chat as a secure, bilingual, accessible and production-quality extension of the existing Astro public site.

**Architecture:** Static marketing and Help Center pages remain prerendered while narrowly scoped Astro on-demand endpoints own the same-origin HTTP/session boundary. Focused validation, domain and database modules own policy, conversation state and persistence; the UI consumes only visitor-safe response projections. M002 is the only knowledge authority and deterministic orientation is the only active response adapter until a model provider receives a separate activation decision.

**Tech Stack:** TypeScript, Astro 7, Astro Vercel adapter, Tailwind CSS 4, Zod 4, Drizzle ORM/Postgres, Supabase-compatible RLS, Vitest, Playwright and axe-core.

## Global Constraints

- Decision 028 authorizes M003 Build only; provider credentials, model traffic, real client data, deployment and `Operational` status remain prohibited.
- Follow strict red-green-refactor: no production behavior is written until its focused test has failed for the expected missing behavior.
- Preserve Manrope/Inter and the approved navy/cobalt/cyan/green/gold/light token system; no component-level raw brand hex values.
- Spanish and English must have complete, reviewed interface strings and equivalent behavior.
- WCAG 2.2 AA, 44×44 CSS-pixel targets, keyboard operation, 200% zoom, reduced motion and mobile-first presentation are mandatory.
- M002 published/current projections are the only source of public facts and links.
- Message bodies, prompts, contact data and sensitive values never enter logs, analytics, traces, Sanity or test fixtures.
- Durable production transcript bodies stay disabled until the Product Owner approves retention/legal policy.
- Every public mutation requires exact Origin/Fetch Metadata validation, a host-only HttpOnly session cookie and a session-bound CSRF token.
- Drizzle schema and generated migrations are the only schema authority; all public tables enable RLS and deny direct anonymous/client access.
- Disabled/unavailable external adapters fail closed and never fabricate handoff, lead, booking or provider success.

---

### Task 1: Approve the runtime boundary and make channel readiness executable

**Files:**
- Modify: `docs/adr/007-public-chat-gateway-runtime.md`
- Modify: `DECISIONS.md`
- Modify: `apps/www/package.json`
- Modify: `apps/www/astro.config.mjs`
- Create: `packages/config/src/public-chat.ts`
- Modify: `packages/config/src/index.ts`
- Create: `tests/m003/public-chat-config.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `ChatRuntimeState = "disabled" | "local" | "staging" | "activation_ready" | "operational"`.
- Produces: `readPublicChatConfig(env): PublicChatConfig` with `enabled`, `runtimeState`, `canonicalOrigin`, `sessionTtlSeconds`, `maxMessageCharacters`, `transcriptPersistence` and `modelMode`.
- Produces: an Astro hybrid/server configuration whose normal pages remain prerendered and whose chat endpoints opt out with `prerender = false`.

- [ ] **Step 1: Write the failing configuration tests**

```ts
it("keeps public chat disabled when configuration is absent", () => {
  expect(readPublicChatConfig({})).toMatchObject({
    enabled: false,
    runtimeState: "disabled",
    modelMode: "disabled",
    transcriptPersistence: "metadata_only",
  });
});

it("refuses operational state without an explicit activation acknowledgement", () => {
  expect(() =>
    readPublicChatConfig({ PUBLIC_CHAT_STATE: "operational", PUBLIC_CHAT_ENABLED: "true" }),
  ).toThrowError("PUBLIC_CHAT_OPERATIONAL_APPROVAL is required");
});
```

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-config.test.ts` and verify RED**

Expected: module resolution fails because `packages/config/src/public-chat.ts` does not exist.

- [ ] **Step 3: Implement the closed readiness parser and export it**

Use an explicit state allowlist, boolean parser and positive bounded integer parser. `local` and
`staging` may enable deterministic chat; `activation_ready` and `operational` require explicit
approval variables. `transcriptPersistence` remains `metadata_only` for this gate.

- [ ] **Step 4: Pin the Astro Vercel adapter compatible with `astro@7.1.6`**

Registry metadata captured on 2026-08-12 reports `@astrojs/vercel@11.0.5` with peer dependency
`astro@^7.0.0`. Run `corepack pnpm --filter @atlas/www add @astrojs/vercel@11.0.5 --save-exact`.
Configure the official adapter and on-demand output without changing the existing site URL,
redirects or Tailwind. The lockfile may change only for this adapter and its required transitives.

- [ ] **Step 5: Approve ADR 007 and record the written specification acceptance**

Change ADR 007 to `Accepted — Decision 029` and append Decision 029 stating that the Product Owner's
“Si todo está aprobado” accepts the persisted specification and same-origin runtime. Preserve every
external-activation exclusion.

- [ ] **Step 6: Run the focused test, typecheck and static route build; verify GREEN**

Run `vitest run tests/m003/public-chat-config.test.ts`, `turbo run typecheck` and
`corepack pnpm --filter @atlas/www build`. Expected: pass; existing content routes remain generated.

- [ ] **Step 7: Commit**

```powershell
git add docs/adr/007-public-chat-gateway-runtime.md DECISIONS.md apps/www/package.json apps/www/astro.config.mjs packages/config/src pnpm-lock.yaml tests/m003/public-chat-config.test.ts
git commit -m "build(m003): establish public chat runtime gate"
```

### Task 2: Validate message and gateway inputs before any side effect

**Files:**
- Create: `packages/validation/src/public-chat.ts`
- Modify: `packages/validation/src/index.ts`
- Create: `tests/m003/public-chat-validation.test.ts`

**Interfaces:**
- Produces: `ChatLocale`, `StartConversationInput`, `AcceptMessageInput`, `HandoffInput`.
- Produces: `parseStartConversation`, `parseChatMessage`, `parseHandoffRequest`.
- Produces: `inspectProhibitedChatContent(text): { allowed: true; normalized: string } | { allowed: false; reason: SensitiveReason }`.

- [ ] **Step 1: Write failing table-driven validation tests**

Use hand-authored fixtures proving: `es|en` only; notice acknowledgement must be `true`; messages
normalize Unicode/line endings; blank, control-character and over-2,000-character input fails;
SSN/ITIN, payment-card-like, bank-routing/account, API-key/password and HTML/script fixtures return
only a bounded reason and never echo the input.

```ts
expect(parseChatMessage({ text: "  ¿Cómo funciona?\r\n", idempotencyKey: "msg_1234567890" }))
  .toEqual({ text: "¿Cómo funciona?", idempotencyKey: "msg_1234567890" });
expect(inspectProhibitedChatContent("123-45-6789")).toEqual({
  allowed: false,
  reason: "government_identifier",
});
```

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-validation.test.ts` and verify RED**

Expected: missing public-chat validation exports.

- [ ] **Step 3: Implement Zod schemas and deterministic sensitive-content inspection**

Reject before returning normalized content. Export only bounded reason enums. Never implement a
redacted copy or a value-bearing error object.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run `vitest run tests/m003/public-chat-validation.test.ts`. Expected: all validation and negative
fixtures pass with no console output.

- [ ] **Step 5: Commit**

```powershell
git add packages/validation/src tests/m003/public-chat-validation.test.ts
git commit -m "feat(m003): validate public chat input"
```

### Task 3: Implement the conversation aggregate and fail-closed provider ports

**Files:**
- Create: `packages/domain/src/public-chat/contracts.ts`
- Create: `packages/domain/src/public-chat/state-machine.ts`
- Create: `packages/domain/src/public-chat/providers.ts`
- Create: `packages/domain/src/public-chat/service.ts`
- Create: `packages/domain/src/public-chat/index.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `tests/m003/public-chat-domain.test.ts`

**Interfaces:**
- Produces: `ConversationStatus`, `ChatActor`, `PublicCitation`, `PublicChatProjection`, `ChatCommandResult`.
- Produces: `ConversationRepository`, `PublicKnowledgeProvider`, `ModerationProvider`, `ChatModelProvider`, `HumanHandoffPort`, `AuditPort`, `Clock`, `IdFactory`.
- Produces: `createConversationService(dependencies)` with `start`, `get`, `acceptMessage`, `requestHandoff` and `close`.
- Produces: `DisabledChatModelProvider`, `DeterministicModerationProvider`, `UnavailableHandoffPort`.

- [ ] **Step 1: Write failing state and authorization tests**

Prove the literal state graph, optimistic versions, session ownership, revoked/expired rejection,
idempotent message replay, one accepted result per key, automation suspension during human states,
close idempotency and minimized audit payloads. The mutation each test catches must be named in the
test title.

```ts
it("rejects a valid conversation id when the session hash belongs to another visitor", async () => {
  const result = await service.get({ conversationId: "con_1", sessionHash: "other" });
  expect(result).toEqual({ ok: false, code: "not_found" });
});
```

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-domain.test.ts` and verify RED**

Expected: missing conversation-service implementation.

- [ ] **Step 3: Implement minimal aggregate, repository ports and disabled adapters**

Use discriminated unions for every public result. The service accepts already validated input,
checks repository ownership before transitions, records only reason/version/opaque references in
the audit port and never exposes raw dependency errors.

- [ ] **Step 4: Add failing tests for sensitive, moderation, knowledge and handoff failure paths**

Prove rejected content never reaches repository/provider/audit text; unavailable moderation/model
returns a navigation/human-safe status; handoff shows `queued` only after a durable receipt; a
failed receipt leaves status unconfirmed.

- [ ] **Step 5: Implement the smallest passing policy paths and verify GREEN**

Run `vitest run tests/m003/public-chat-domain.test.ts`. Expected: all transitions, isolation,
idempotency and fail-closed paths pass.

- [ ] **Step 6: Commit**

```powershell
git add packages/domain/src tests/m003/public-chat-domain.test.ts
git commit -m "feat(m003): add secure conversation kernel"
```

### Task 4: Ground deterministic orientation exclusively in current M002 content

**Files:**
- Create: `apps/www/src/lib/public-chat/m002-knowledge-provider.ts`
- Create: `apps/www/src/lib/public-chat/deterministic-orientation.ts`
- Create: `apps/www/src/content/public-chat.ts`
- Create: `tests/m003/public-chat-knowledge.test.ts`

**Interfaces:**
- Produces: `createM002KnowledgeProvider(records, now)` implementing `PublicKnowledgeProvider`.
- Produces: `createDeterministicOrientationProvider(knowledge)` implementing `ChatModelProvider`.
- Produces: `PUBLIC_CHAT_COPY.es|en` with equivalent notices, quick actions, errors and handoff copy.

- [ ] **Step 1: Write failing knowledge-boundary tests**

Prove only `published`, current and locale-matching records return; stale/private/draft records and
arbitrary URLs do not. Prove citations use server-resolved IDs/path/title and that zero matches
returns Help Center navigation without invented facts.

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-knowledge.test.ts` and verify RED**

Expected: missing provider and orientation modules.

- [ ] **Step 3: Implement the M002 adapter using existing `buildSearchIndex` and `searchHelp`**

Return at most three results and re-resolve every citation from the current record set. Construct
orientation text from reviewed locale copy plus returned record titles/summaries/disclosures; do
not accept model-created URLs or raw HTML.

- [ ] **Step 4: Add bilingual parity and disclosure tests**

Use literal expected Spanish/English action keys and verify provider disclosures remain attached to
Tradeline records in both locales.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run `vitest run tests/m003/public-chat-knowledge.test.ts tests/m002/help-security.test.ts`. Expected:
M003 grounding and existing M002 security remain green.

- [ ] **Step 6: Commit**

```powershell
git add apps/www/src/lib/public-chat apps/www/src/content/public-chat.ts tests/m003/public-chat-knowledge.test.ts
git commit -m "feat(m003): ground chat in help center content"
```

### Task 5: Add Drizzle schema, RLS and a Postgres repository

**Files:**
- Create: `packages/database/src/schema.ts`
- Create: `packages/database/src/public-chat-repository.ts`
- Modify: `packages/database/src/index.ts`
- Modify: `packages/database/drizzle.config.ts`
- Create: `tests/m003/public-chat-schema.test.ts`
- Create: `tests/m003/public-chat-repository.test.ts`
- Create: `drizzle/0000_public_chat_foundation.sql`
- Create: `drizzle/meta/0000_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:**
- Produces: `publicChatSessions`, `publicChatConversations`, `publicChatMessages`, `publicChatCitations`, `publicChatHandoffs`, `publicChatIdempotency` and `publicChatAuditEvents`.
- Produces: `createPostgresConversationRepository(client, options)` implementing `ConversationRepository`.
- Persists message bodies only when `options.transcriptPersistence === "approved"`; Decision 028 passes `metadata_only`.

- [ ] **Step 1: Write failing executable schema-contract tests**

Assert Drizzle table objects expose opaque primary keys, conversation versions, hashed session/CSRF
values, unique `(conversation_id,idempotency_key)` constraints, nullable body storage, bounded reason
fields and indexes for expiry/reconciliation. Assert each table declares RLS.

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-schema.test.ts` and verify RED**

Expected: `packages/database/src/schema.ts` is absent.

- [ ] **Step 3: Implement the Drizzle schema and generate the migration**

Make `dbCredentials` conditional for schema generation but keep migration execution fail-fast when
`DIRECT_DATABASE_URL` is absent. Run `corepack pnpm db:generate`. Inspect generated SQL and add
Drizzle-managed policies denying `anon`/`authenticated` direct access while granting only the
server-side gateway role; enable and force RLS in the migration.

- [ ] **Step 4: Write failing repository behavior tests against a transaction-capable fake client**

Prove compare-and-swap version updates, duplicate-key replay, cross-session `not_found`, metadata-
only body omission, handoff receipt persistence and minimized audit rows. The fake records SQL
effects but assertions target repository results and durable row state, not mock call counts.

- [ ] **Step 5: Implement the repository and verify GREEN**

Run `vitest run tests/m003/public-chat-schema.test.ts tests/m003/public-chat-repository.test.ts` and
`turbo run typecheck`. Expected: pass with body persistence disabled.

- [ ] **Step 6: Commit**

```powershell
git add packages/database/src packages/database/drizzle.config.ts drizzle tests/m003/public-chat-schema.test.ts tests/m003/public-chat-repository.test.ts
git commit -m "feat(m003): persist chat metadata with RLS"
```

### Task 6: Implement the same-origin gateway, session cookie, CSRF and rate limits

**Files:**
- Create: `apps/www/src/lib/public-chat/session-security.ts`
- Create: `apps/www/src/lib/public-chat/http-responses.ts`
- Create: `apps/www/src/lib/public-chat/runtime.ts`
- Create: `apps/www/src/lib/public-chat/handlers.ts`
- Create: `apps/www/src/pages/api/public/chat/bootstrap.ts`
- Create: `apps/www/src/pages/api/public/chat/conversations/index.ts`
- Create: `apps/www/src/pages/api/public/chat/conversations/[id]/index.ts`
- Create: `apps/www/src/pages/api/public/chat/conversations/[id]/messages.ts`
- Create: `apps/www/src/pages/api/public/chat/conversations/[id]/handoff.ts`
- Create: `apps/www/src/pages/api/public/chat/conversations/[id]/close.ts`
- Modify: `apps/www/package.json`
- Create: `tests/m003/public-chat-gateway.test.ts`

**Interfaces:**
- Produces: `createBootstrapHandler`, `createConversationHandlers` operating on Web `Request/Response`.
- Cookie: `__Host-atlas_public_chat=...; Secure; HttpOnly; Path=/; SameSite=Lax` with no `Domain`.
- Header: `x-atlas-chat-csrf`, bound to the cookie session and retained only in page memory.
- Public errors: versioned `{ ok:false, code, correlationId }` without raw error or input.

- [ ] **Step 1: Write failing hostile-request and cookie tests**

Cover exact canonical Origin, hostile origin, sibling subdomain, missing/wrong CSRF, disallowed Fetch
Metadata, credentialed CORS preflight, malformed JSON, excessive body length, revoked/expired cookie,
stale version, duplicate idempotency and bounded 429 responses. Inspect literal response fields and
`Set-Cookie`; never assert private helper text.

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-gateway.test.ts` and verify RED**

Expected: missing handler modules.

- [ ] **Step 3: Implement crypto/session helpers and request guards**

Use Web Crypto for 256-bit opaque values and SHA-256 hashes, constant-time comparison for fixed-size
digests, `crypto.randomUUID()` correlation IDs and JSON content-type enforcement. Bootstrap is GET
and returns the in-memory CSRF token while setting the HttpOnly cookie; every mutation thereafter
requires the bound header.

- [ ] **Step 4: Implement handlers and Astro route adapters**

Routes contain only HTTP translation and `export const prerender = false`. Domain errors map to
stable status codes. Apply session plus privacy-preserving request-bucket rate limits; no exact IP is
persisted or logged.

- [ ] **Step 5: Run gateway, domain and security tests; verify GREEN**

Run `vitest run tests/m003/public-chat-gateway.test.ts tests/m003/public-chat-domain.test.ts`.
Expected: all positive and hostile paths pass with zero leaked bodies/errors.

- [ ] **Step 6: Commit**

```powershell
git add apps/www/src/lib/public-chat apps/www/src/pages/api/public/chat apps/www/package.json tests/m003/public-chat-gateway.test.ts
git commit -m "feat(m003): expose protected public chat gateway"
```

### Task 7: Build the polished bilingual chat experience

**Files:**
- Create: `apps/www/src/components/chat/ChatExperience.astro`
- Create: `apps/www/src/components/chat/ChatLauncher.astro`
- Create: `apps/www/src/components/chat/ChatPanel.astro`
- Create: `apps/www/src/components/chat/ChatTranscript.astro`
- Create: `apps/www/src/components/chat/ChatComposer.astro`
- Create: `apps/www/src/components/chat/ChatSources.astro`
- Create: `apps/www/src/scripts/public-chat.ts`
- Create: `apps/www/src/styles/public-chat.css`
- Create: `apps/www/src/pages/chat.astro`
- Create: `apps/www/src/pages/en/chat.astro`
- Modify: `apps/www/src/layouts/BaseLayout.astro`
- Create: `tests/m003/public-chat-ui.test.ts`
- Create: `tests/e2e/m003-public-chat.spec.ts`

**Interfaces:**
- Produces: launcher/panel/full-page view with identical `data-public-chat-*` behavior hooks.
- Consumes: bootstrap and conversation gateway projections only.
- Browser state: CSRF token and transcript stay in memory; neither localStorage nor analytics receives them.

- [ ] **Step 1: Write failing UI structure and bilingual-copy tests**

Render both locales and assert automated identity, limitation/privacy notice, language control,
persistent human action, Help Center fallback, 44px launcher contract, dialog labels, live regions,
full-page links and absence when config is `disabled`.

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-ui.test.ts` and verify RED**

Expected: missing chat components/routes.

- [ ] **Step 3: Implement components using existing semantic design tokens**

Desktop panel uses a restrained elevated card; narrow screens use a safe-area near-full-screen sheet.
Use a native dialog-compatible region with predictable focus entry/return, visible close, text labels
for status and no color-only meaning. Add subtle one-time entrance only when reduced motion is not set.

- [ ] **Step 4: Write failing browser journeys**

Test Spanish and English open/start/send/source/close paths, keyboard-only focus return, polite live
announcement, 200% zoom without horizontal overflow, mobile viewport, reduced-motion style, network
failure recovery and the full-page fallback. Intercept the first-party API with complete versioned
fixtures; do not mock the rendered component.

- [ ] **Step 5: Implement browser controller and integrate in `BaseLayout`**

Lazy-load behavior after open/intent, use `textContent` for all dynamic text, resolve only server
citations/actions, disable duplicate sends while pending and recover without losing confirmed local
messages. Render `ChatExperience` only when `readPublicChatConfig` enables local/staging chat.

- [ ] **Step 6: Run unit, E2E and axe tests; verify GREEN**

Run `vitest run tests/m003/public-chat-ui.test.ts`, then start Astro and run
`playwright test tests/e2e/m003-public-chat.spec.ts`. Expected: both locales, desktop/mobile,
keyboard, reduced motion and axe scan pass.

- [ ] **Step 7: Commit**

```powershell
git add apps/www/src/components/chat apps/www/src/scripts/public-chat.ts apps/www/src/styles/public-chat.css apps/www/src/pages/chat.astro apps/www/src/pages/en/chat.astro apps/www/src/layouts/BaseLayout.astro tests/m003/public-chat-ui.test.ts tests/e2e/m003-public-chat.spec.ts
git commit -m "feat(m003): add accessible bilingual chat experience"
```

### Task 8: Add minimized telemetry, expiry/reconciliation and operational evidence

**Files:**
- Create: `packages/observability/src/public-chat.ts`
- Modify: `packages/observability/src/index.ts`
- Create: `packages/domain/src/public-chat/jobs.ts`
- Modify: `packages/domain/src/public-chat/index.ts`
- Create: `tests/m003/public-chat-observability.test.ts`
- Create: `tests/m003/public-chat-jobs.test.ts`
- Modify: `apps/www/vercel.json`

**Interfaces:**
- Produces: `recordPublicChatMetric(event)` accepting only event name, opaque correlation ID, locale, state, reason and bounded timing bucket.
- Produces: `expirePublicChatSessions` and `reconcilePendingHandoffs` with idempotency keys, retry caps and manual-recovery results.

- [ ] **Step 1: Write failing telemetry allowlist tests**

Pass objects containing `text`, `email`, `phone`, `prompt`, `ip`, `providerPayload` and transcript
fields and prove they are rejected rather than silently serialized. Prove approved bounded events
contain no user content.

- [ ] **Step 2: Run `vitest run tests/m003/public-chat-observability.test.ts` and verify RED**

Expected: missing safe telemetry projection.

- [ ] **Step 3: Implement the closed telemetry projection**

Use an exact-key parser; no rest/spread of request/domain objects. Keep PostHog transport disabled
until its separate activation gate.

- [ ] **Step 4: Write failing expiry and reconciliation tests**

Prove expired sessions revoke access, pending handoffs retry no more than the configured cap,
ambiguous receipts stay pending, manual recovery is surfaced and repeated jobs do not duplicate
effects.

- [ ] **Step 5: Implement Inngest-compatible job functions and security headers**

Keep durable state in the repository. Add API `Cache-Control: no-store` and CSP/connect policy that
remains same-origin only. No job logs message content.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run `vitest run tests/m003/public-chat-observability.test.ts tests/m003/public-chat-jobs.test.ts`.
Expected: allowlist, expiry, retry and recovery behaviors pass.

- [ ] **Step 7: Commit**

```powershell
git add packages/observability/src packages/domain/src/public-chat apps/www/vercel.json tests/m003/public-chat-observability.test.ts tests/m003/public-chat-jobs.test.ts
git commit -m "feat(m003): harden chat operations and telemetry"
```

### Task 9: Complete verification, independent audits and the PCR

**Files:**
- Create: `docs/phases/M003-PHASE-COMPLETION-REPORT.md`
- Create: `docs/reviews/M003-CODE-REVIEW.md`
- Create: `docs/reviews/M003-SECURITY-BUILD-REVIEW.md`
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `CHANGELOG.md`
- Modify: `ROADMAP.md`
- Modify: `docs/modules/m003-public-chat.md`
- Modify: `docs/roadmap/MODULE_CATALOG.md`
- Modify: `EXTERNAL_ACTIVATION_REGISTER.md`

**Interfaces:**
- Produces: a frozen, reproducible completion report whose evidence authorizes M004 worktree creation but not M003 activation or deployment.

- [ ] **Step 1: Run dependency and migration reproducibility checks**

Run two clean `corepack pnpm install --frozen-lockfile` checks and verify the SHA-256 of
`pnpm-lock.yaml` is unchanged. Generate Drizzle SQL again in a disposable comparison location and
prove there is no schema drift. Do not connect to production.

- [ ] **Step 2: Run the complete quality suite**

Run lint, format check, 11-package typecheck, all Vitest tests, import contracts, full Astro build,
M001/M002/M003 Playwright suites, axe, `git diff --check`, secret/local-path/media scan and public-link
validation. Record exact commands, counts and results.

- [ ] **Step 3: Perform independent code review and remediate via TDD**

The independent reviewer reads AGENTS, PRD, ADR 007, design, this plan and complete diff. Every
material finding receives a failing regression test before correction, then full revalidation.

- [ ] **Step 4: Perform read-only Cyber Neo review and remediate via TDD**

Scan SCA, SAST, secrets, session/CSRF, authorization/RLS, injection, PII leakage, telemetry,
dependencies and deployment configuration. Cyber Neo writes only its report and never modifies the
target repository.

- [ ] **Step 5: Write the PCR and synchronize current/history documents**

State exactly what is implemented, which provider/live behaviors remain disabled, rollback path,
tests, risks and remaining Product Owner activation decisions. Mark M003 `Build complete — external
activation deferred`; make M004 the next authorized Build only after both audits are clean.

- [ ] **Step 6: Re-run final frozen-snapshot verification and commit**

```powershell
git add docs/phases/M003-PHASE-COMPLETION-REPORT.md docs/reviews/M003-CODE-REVIEW.md docs/reviews/M003-SECURITY-BUILD-REVIEW.md PROJECT_STATE.md PROJECT_MEMORY.md CHANGELOG.md ROADMAP.md docs/modules/m003-public-chat.md docs/roadmap/MODULE_CATALOG.md EXTERNAL_ACTIVATION_REGISTER.md
git commit -m "docs(m003): close public chat build"
```

Expected final state: clean worktree; no push, merge, live provider, real data, deployment or public
production activation; exact M003 commit ready to seed the isolated M004 worktree.
