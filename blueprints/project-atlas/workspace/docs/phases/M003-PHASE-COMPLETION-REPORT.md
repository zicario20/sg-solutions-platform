# Phase Completion Report — M003 Public Chat

## Status

- State: `PO Acceptance pending`
- Build maturity: provider-disabled local/staging Build verified
- Date: 2026-08-13
- Version: `0.1.0-alpha.23`
- Responsible: Codex Architecture/Implementation Agent; independently audited
- Branch: `codex/m003-public-chat-build`
- Explicit exclusion: no merge, push, deployment, provider activation, real data or `Operational`
  claim

## Objective

Deliver the first production-quality, provider-neutral public orientation chat slice on the Astro
site. It must be bilingual, accessible, grounded only in M002 public knowledge, secure by default,
honest when external providers/human queues are unavailable and compatible with later adapters.

## Functionality implemented

- Floating and full-page Spanish/English chat experiences with consent-first notice, focus control,
  reduced motion, mobile/zoom support, governed citations and human/contact fallback.
- Same-origin Astro gateway with exact Origin/Fetch Metadata checks, synchronizer CSRF, opaque
  `__Host-` cookie, revocation/expiry, bounded public errors and minimized security telemetry.
- Provider-neutral conversation domain, explicit state machine, optimistic concurrency, durable
  metadata/handoff/audit contracts and a deterministic M002-only orientation adapter.
- Idempotent start and command handling bound to canonical payloads by independent server-only HMAC
  fingerprints; mismatched kind/payload conflicts without storing recoverable input.
- Sensitive-input rejection before knowledge/model work, including bounded SSN/ITIN variants,
  payment cards, accounts, credentials, markup and unsafe control characters.
- Metadata-only transcript persistence, same-document locale switching and truthful recovery when a
  lost response body cannot be reconstructed.
- Forced-RLS Drizzle schema, least-privilege gateway role, distributed privacy-preserving rate
  limits, bounded cleanup, expiry/reconciliation jobs and preactivation migration guards.

## Files and schema

Created migration/evidence artifacts include Drizzle migrations `0003`–`0005`, their snapshots,
this PCR, M003 code/security build reviews and the M003 runbook. Product code changes are confined
to the M003 public surface and shared config/domain/database/validation boundaries. Tests cover
config, validation, domain, repository, schema, gateway, jobs, UI and desktop/mobile browser flows.

New schema facts:

- `public_chat_idempotency.command_kind`
- `public_chat_idempotency.command_fingerprint`
- `public_chat_conversations.start_idempotency_key`
- `public_chat_conversations.start_fingerprint`
- unique `(session_id, start_idempotency_key)`

Drizzle remains the only schema/migration authority. Migrations 0003–0005 fail closed if their
preactivation tables contain rows because prior command semantics cannot be reconstructed safely.

## APIs and UI

Implemented same-origin endpoints cover bootstrap, start, get, message, language, resume transfer,
handoff and close. Start/message/language/handoff/close are idempotent where durable mutation occurs.
The UI never exposes the anonymous session secret, database credentials, raw provider error or a
false success receipt.

## Security and privacy

- No durable transcript body under the approved interim; no prompt/body/sensitive value enters
  analytics, traces or general logs.
- HMAC fingerprint and network-bucket secrets are separate and server-only.
- Restriction/close revoke sessions; terminal states block further actions.
- RLS is enabled and forced; direct Public/anon/authenticated table access is revoked.
- External providers remain disabled and no production credentials were added.

## Validation evidence

Fresh focused evidence on 2026-08-13:

- Complete Vitest suite: `31` files passed, `1` deliberately skipped; `345` tests passed and `3`
  deliberately skipped, including the real PostgreSQL runtime integration.
- Direct TypeScript checks: domain, database and Astro public app passed.
- Astro/Vercel public build plus M003 Playwright/axe desktop and mobile: `28/28` passed, including
  the final lost-start/language regression.
- M001/M002 browser regression: `74/74` passed after the test server was corrected to serve the
  localized prerendered 404 documents.
- Biome lint and format: `203` files passed; 11 direct TypeScript projects and import contracts
  passed. Two frozen installs preserved lock hash
  `EC8CF9C5D8E6078B32445819DBBD84FC34E06FCAF30F103F154732C39DD97FC1`.
- `pnpm audit --json`: `0` vulnerabilities across `943` dependencies.
- Final full repository gates and audit results are recorded in the linked build-review documents.

Completion-audit follow-up on 2026-08-13:

- A fresh execution of the repository's exact `format:check` gate identified one import-order assist
  in `apps/www/astro.config.mjs`. The two imports were reordered without changing the exported Astro
  configuration, adapter or Vite plugins; independent review classified the correction as
  mechanical and passed it with no material finding.
- After that correction, frozen install twice, Biome lint/format over `203` files, all `11` package
  typechecks, import contracts, the provider-disabled Vitest suite (`344` passed, `4` deliberately
  skipped), the Astro/Vercel Build plus M003 E2E (`28/28`), and the M001/M002 regression (`74/74`)
  all passed again. The fourth Vitest skip is the real PostgreSQL integration because its temporary
  runtime was securely removed after the fresh/upgrade evidence above was captured; it does not
  supersede that executed database proof.
- A fresh supply-chain query again reported `0` vulnerabilities across `943` dependencies, and the
  lockfile hash remained unchanged.

PostgreSQL 17.11 was executed locally from a temporary loopback-only validation runtime. A fresh
database applied Drizzle migrations `0000` through `0005`, reported eight `public_chat_*` tables and
validated `atlas_public_chat_runtime` as a non-superuser/non-`BYPASSRLS` principal with access only
through the gateway role. A separate upgrade rehearsal applied `0000`–`0002`, then `0003`–`0005`,
verified `command_kind` and `command_fingerprint`, and repeated the restricted-principal validation.
No production database, production credential or external service was used.

## Accessibility, performance and SEO

Desktop/mobile automated WCAG A/AA checks pass, including keyboard/focus behavior, 320px layout,
zoom-like scaling and reduced motion. Chat assets do not change the canonical public content/SEO
authority; normal content routes remain prerendered while only the bounded API is dynamic.

## Risks and limitations

- CHAT-001–CHAT-007 remain unresolved live-policy/provider decisions.
- No transcript can resume with bodies after reload/browser close under `metadata_only`.
- Human handoff has no staffed destination and truthfully falls back to contact.
- Deterministic public orientation is not a live generative model.
- Production/staging migration execution and restore evidence remain activation/release gates; the
  local PostgreSQL fresh and upgrade rehearsals are complete.
- Whole-monorepo build remains unsuitable because `apps/app` is an intentionally empty scaffold;
  the validated acceptance build is the public Astro app.

## Pending work and next dependency

Product Owner acceptance and merge/deployment decisions remain separate. M004 may begin only from
the clean audited M003 closure commit under Decision 028. External activation requires the relevant
CHAT decisions, contracts, secrets, staging database proof, observability/reconciliation and a new
security/production gate.

## Final checklist

- [x] Authorized scope implemented without provider activation.
- [x] Focused tests, type checks and desktop/mobile browser checks pass.
- [x] Metadata-only privacy and safe failure paths are explicit.
- [x] Drizzle migrations and rollback/incident runbook exist.
- [x] Independent code/security review requested after final code freeze.
- [x] Documentation synchronized without claiming `Operational`.
- [ ] Product Owner acceptance.
- [x] Fresh `0000→0005`, upgrade `0002→0005` and restricted runtime-principal PostgreSQL rehearsals.
- [ ] Merge, deployment and external activation (separate future gates).
