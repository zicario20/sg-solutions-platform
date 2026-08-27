# Changelog

- Owner: Release Manager role, initially the Product Owner
- Status: Active
- Update rule: add one dated entry for every released checkpoint; never include secrets or client data

## Unreleased

- Completed the M043 Stripe Payments controlled technical foundation: typed provider-boundary
  contracts, fail-closed Stripe adapter, server-owned checkout planning from M042/M046 snapshots,
  raw-byte signature verification with rotation support, M044 verification candidates, refund
  approval staging, reconciliation/audit models, RLS deny-by-default schema and authored-only
  migration 0053. Stripe, webhooks, checkout, refunds, subscriptions, migrations and deployment
  remain disabled pending Product Owner acceptance and activation evidence.

- Completed the provider-disabled M042 Service Catalog technical implementation across all four
  specification parts: canonical registry/version/surface contracts, commercial and workflow
  references, channel/CTA gates, service-order snapshots, change/deprecation controls,
  governance/AI safeguards, quality/drift/recovery contracts and authored-only RLS migration
  0052. No service was published, no provider/payment/workflow was activated and no migration or
  deployment was performed.

- Completed a repository-wide M005-M019 provider-disabled technical reconciliation: repaired bounded M006 attribution validation, aligned stale M005/M007/M008/M010 contracts, synchronized module maturity status and added the provider/future-connection inventory. The audited matrix passed 136 files and 436 tests; no provider, persistence, deployment or operational activation occurred.

- Built and locally verified the provider-disabled M003 Public Chat on its isolated branch: bilingual
  accessible UI, same-origin Astro gateway, hardened anonymous session/CSRF/rate-limit boundary,
  M002-grounded deterministic orientation, metadata-only persistence, Drizzle/RLS, HMAC-bound
  idempotency and safe handoff/fallback behavior. External activation, deployment and release remain
  deferred pending Product Owner decisions.
- Closed the exact M003 completion gates after a follow-up audit corrected one behavior-neutral
  Astro import-order assist; independent review and the complete quality/build/browser regressions
  pass with the approved architecture and provider-disabled scope unchanged.

- Recorded Decision 028: bounded sequential `GENERATE` for M003–M005 with provider activation,
  credentials, live traffic and production release still deferred.
- Documentary architecture baseline prepared.
- Added canonical product definition, release horizons, dependency map, module status model and the complete conceptual module catalog.
- Aligned the roadmap around Release 1 — Production Foundation and Business Formation as the first complete vertical.
- Added governed price publication modes and preserved the superseded historical decision.
- Archived the incomplete E1–E3 plan as non-executable history and replaced the bundle root blueprint with a documentary index.
- Added a repository-root Phase 0 guard and removed the active task queue.
- No application implementation existed before Decision 013; M001 is now the only implemented
  product surface and remains pending Product Owner acceptance and deployment.
- Consolidated universal governance in the repository-root `AGENTS.md` and removed tool-specific
  project authority/workflows.
- Clarified Product Owner, Codex architect/implementer and ChatGPT independent-auditor roles.
- Added source-of-truth, data-classification, upload-security and backup/recovery architecture.
- Added authorization-inheritance and encryption ADRs and hardened private-storage guidance.
- Expanded the ten critical Release 1 module PRDs with implementation contracts and explicit Product
  Owner decision markers.
- Split Release 1 into compatible 1A minimum-operations and 1B operational-maturity slices.
- Clarified that the repository/tooling scaffold is not implemented product behavior.
- Added a non-authoritative intake analysis for the Product Owner's detailed M1–M21 requirements,
  including compatibility findings, canonical-PRD mapping and decisions required before adoption.
- Added the reproducible pnpm lockfile, package-local TypeScript configuration, bounded Vitest
  discovery, scaffold validation and framework declarations that add no product routes.
- Removed embedded local test-database credentials and pinned corrected transitive `esbuild`,
  `postcss` and `sharp` versions after a read-only Cyber Neo dependency review.
- Authorized and started the bounded M001 Public Website build with a complete module PRD and
  persisted “Financial Clarity” UX/UI execution specification.
- Completed the bounded M001 implementation: 38 bilingual content routes, operational static
  endpoints, exact approved logo use, responsive accessible presentation, localized SEO, honest CTA
  fallbacks and restrictive Vercel deployment headers.
- Added M001 unit, contract, accessibility, visual and browser regression coverage; all current
  quality checks pass and Cyber Neo has no open finding after preventive hardening.
- Added M001 UX/accessibility and security reviews, activation/rollback runbook and Phase Completion
  Report; the module is at Product Owner acceptance and has not been deployed.
- Closed independent-review findings for CSP-compatible navigation, honest portal fallback, fully
  typed bilingual chrome, localized 404 handling, 44-by-44 interaction targets and factual Schema.
- Kept Vercel configuration on its high-level routing properties; the SSG `404.html` uses a small
  same-origin progressive enhancement to display English recovery copy on unknown `/en/` paths.
- Implemented the bounded M002 bilingual Help Center with 77 public records per locale, static
  search, five populated collection types, ten populated categories, 154 detail pages, stable route
  manifests, bilingual alternates, SEO data, accessible feedback states and a constrained future
  Sanity boundary.
- Added eleven neutral Tradelines FAQ pairs from the Product Owner-selected Tradeline Supply source.
  References are exact-host, category-scoped external-provider sources with no implied partnership,
  endorsement or guarantee; medium-risk records fail closed after their review date.
- Added M002 unit/contract/browser regression coverage, UX/accessibility and security reviews,
  activation/rollback runbook and completion report. Local validation passes; M002 is not deployed
  or Operational and no later module was authorized.
- Replaced Playwright's nested Windows preview-process lifecycle with a bounded repository runner
  that owns one Astro process, disables telemetry, verifies readiness and closes that exact process
  after desktop/mobile browser validation.
- Preserved the Decision 015 external-provider boundary on every aggregate surface that displays
  Tradelines answers and aligned FAQ structured data with the same visible bilingual disclosure.
- Added the M003 provider-neutral Public Chat architecture, same-origin Astro gateway proposal,
  deferred-activation register and independent/security review evidence without opening a Build
  gate.
- Added the M004 official provider-neutral WhatsApp architecture, proposed Next.js integration
  ingress, consent/template/durable-delivery boundaries and a detailed deferred activation checklist;
  no account, number, credentials, live message or product implementation was created.
- Added the M005 provider-neutral bilingual Voice Agent PRD, proposed M096 specialized media-runtime
  boundary and deferred activation decisions. No provider/runtime dependency, account, number,
  recording, transcript, real call or product implementation was created.
- Closed M005 independent/Cyber findings covering durable webhook replay, media credentials,
  protected speech, gateway isolation, human-takeover races, uncertain transfers and activation-
  register scope. Final documentary reviews have zero open findings; Build remains unauthorized.
- Added the M006 bilingual Public Forms PRD, proposed immutable form registry/same-origin Astro
  gateway boundary, consent/lead separation and deferred activation decisions. No form route, table,
  cookie, provider, submission traffic or product behavior was created.
- Closed all M006 independent/Cyber findings covering canonical origin/proxy trust, bounded parsing,
  prohibited-data zero persistence, scoped HMAC, accessible nonce renewal, atomic risk-review lead
  fencing and cross-channel M006/M078/M020 ownership. Final documentary reviews have zero open
  findings; Build remains unauthorized.
- Added the M007 invitation-first Client Authentication and Account PRD, branded bilingual UX
  design, proposed identity-linking/server-session ADR and detailed activation register. No auth
  route, database table, RLS/Storage policy, Supabase/Google/email/MFA configuration, account,
  session or product behavior was created.
- Added a repository-root LF `.gitattributes` contract after a new Windows worktree reproduced
  tracked files as CRLF and failed the otherwise unchanged Biome baseline; normalization restored a
  clean full scaffold validation without changing product behavior or dependency versions.
- Closed all M007 independent/Cyber findings covering provider auto-link containment, typed
  invitation/OAuth/email/MFA/account contracts, scanner-safe proof ingress, opaque-cookie/encrypted-
  vault boundaries, identity/session convergence, refresh and step-up replay fencing, canonical
  origin/proxy trust, scoped HMAC, RLS/Storage context integrity, break-glass minimum controls and
  shared state/acceptance consistency. Final documentary reviews have zero open findings and Cyber
  Neo risk 0/100; Build remains unauthorized.
- Added the M008 Client Dashboard PRD, responsive branded Client Home design and proposed ADR 012.
  The independently reviewed candidate uses one complete authorization snapshot, a consistent read
  cut, typed owning-domain projections, a closed priority-source registry, deterministic priority,
  per-section freshness and private/no-store responses. Final review has zero open findings and
  Cyber Neo documentary risk 0/100; it creates no route, schema, provider traffic, personalized
  cache or product behavior.
- Registered fourteen M008 Product Owner/activation decisions so public status copy, priority
  thresholds, financial/staff details, freshness, contexts, preferences, recommendations, support
  projection, analytics and support claims cannot be silently invented during a future Build.
- Recorded the M008 independent architecture and security reports. Initial grant/entitlement fence,
  read-consistency, source-completeness, security/signature-port and trusted-clock gaps were closed;
  repository hygiene and lockfile checks passed without product or dependency changes.
- Added the M009 Mis servicios PRD, responsive branded service-directory/detail design and proposed
  ADR 013. The candidate uses explicit service/case grants, accepted definition/workflow versions,
  canonically owned commercial/financial/activation/fulfillment subfacts, typed owning-module
  summaries and private/no-store responses; it creates no route, schema, provider traffic or
  product behavior.
- Closed M009 independent/Cyber findings for canonical state ownership, four-axis Product Owner
  decision synchronization and per-resource authorization epochs. Final reviews have zero open
  findings, Cyber Neo documentary risk is 0/100 and full scaffold/build/hygiene validation passes;
  Build remains unauthorized.
- Added the M010 Estado de mi proceso PRD, responsive branded process-status design and proposed
  ADR 014. The candidate is a request-scoped read-only projection over explicitly granted M009
  services, one consistent Postgres snapshot, accepted workflow versions, deterministic public
  status and allowlisted real source events; it creates no route, schema, event materializer,
  provider traffic or product behavior.
- Closed M010 independent/Cyber findings covering nonrecursive service selection, bounded cursor
  pagination, safe service disambiguation, direct-detail eligibility, MVCC consistency, public-event
  identity/corrections, Release 1A non-materialization, exact owning-module handoffs and financial
  minimization. Final reviews have zero open findings and Cyber Neo documentary risk is 0/100;
  sixteen Build/live policies remain explicit Product Owner decisions.
- Added the M011 Portal de documentos PRD, responsive branded Client/Admin design and proposed ADR
  015. The candidate defines one document authority over Postgres state and approved Supabase
  private Storage bytes; it adds no route, table, RLS/Storage policy, bucket, provider or real file.
- Closed M011 architecture/security findings for durable upload ordering, independent safety/
  review/visibility/disposition axes, immutable versions, audience-specific DTOs, atomic
  classification/visibility/context transitions, credentialless preview, new-byte revalidation,
  Admin mobile accessibility, M077/M085 ownership and fail-closed recovery. Final independent
  review has zero findings and Cyber Neo documentary risk is 0/100.
- Registered twenty unresolved M011 Build/live policies one-to-one as `DOC-001`–`DOC-020` and
  stopped the authorized module sequence after M011; no M012 worktree or gate was opened.
- Recorded Decision 025 and opened only the isolated M012 documentary worktree from the clean
  audited M011 commit; M013/M014 remain sequentially gated and no product Build was opened.
- Added the M012 Mensajería segura PRD, responsive branded Client/Staff design and proposed ADR 016.
  The candidate defines authenticated account/service/case conversations, structurally separate
  public messages and internal notes, separate Client/staff order/version domains, atomic encrypted
  immutable revisions/current pointers/idempotency receipts, typed owner
  references and human/AI handoff without creating a route, table/RLS policy, provider, AI,
  notification or real message.
- Registered twenty unresolved M012 Build/live policies one-to-one as `MSG-001`–`MSG-020`; M011
  retains attachment bytes/access, M025 content-free unified-inbox projection, M026 notifications,
  M047–M060 AI behavior and M076 compliance/human decisions.
- Closed M012 independent architecture findings covering attachment/note gates, priority/tags,
  quoted targets, dual Client/staff order and CAS/time domains, immutable note revisions, M018 note
  ownership, M025 content-free projection, M076/M090/M091 authority, M092/M097 separation, opaque
  notification references and atomic encrypted initial revisions. Final independent review has zero
  open findings and Cyber Neo is `SECURITY-CLEAR` at documentary risk `0/100`.
- Final M012 validation passed two frozen offline installs, lint, format, 11-package typecheck,
  20 test files/131 tests, import contracts, a 226-page Astro build, 125 local links and
  `git diff --check`; the lockfile remained unchanged and candidate secret/PII scans were clear.
- Added the M013 Client Appointments PRD, responsive Public/Client/Admin design and proposed ADR 017.
  The candidate defines one Postgres appointment/availability authority, audience-separated booking,
  conflict-safe holds and rescheduling, typed prerequisite/attendance/outcome axes and minimized
  Google/Meeting projections without creating a route, table/RLS policy, provider configuration or
  real appointment.
- Registered twenty unresolved M013 Build/live policies one-to-one as `APT-001`–`APT-020`, including
  complete Calendar/Meeting activation and teardown, external-event copy, retention, abuse, analytics,
  reminders, modality and AI-tool gates.
- Closed M013 independent architecture/security findings covering facade-only public ingress,
  Client/Staff booking contracts, timeline provenance, hold/requirement commands, M013/M024 ownership,
  provider query/gate/teardown boundaries, RecoveryEpoch, external-busy privacy, free-text exclusion,
  client projection truth and accessible contrast. Final independent review has zero findings and
  Cyber Neo documentary risk is `0/100`; Build remains unauthorized.
- Final M013 candidate validation passed lint/format, 11-package typecheck, 20 test files/131 tests,
  import contracts, a 226-page Astro build, 55 candidate-local links and `git diff --check`; the
  lockfile remained unchanged and post-contrast secret/PII/supply-chain scans were clear.
- Added the M014 Client Payments and Billing PRD, branded responsive Client/Public/Admin design and
  proposed ADR 018. The candidate defines one shared Billing context, immutable money/obligation
  snapshots, atomic quote/order/obligation acceptance, separate external/internal authorities,
  recoverable provider idempotency/correlation, generation-bound webhook invalidations and safe
  browser capability/handoff boundaries without creating product behavior or Stripe traffic.
- Registered twenty unresolved M014 Build/live policies one-to-one as `PAY-001`–`PAY-020`. Price
  presentation uses the approved `public|from|quote|consultation` vocabulary with independent off-by-
  default publication, while currency/geography remains fail-closed until PAY-009.
- Closed independent architecture/security findings covering price/currency authority, orthogonal
  commercial/financial/approval/fulfillment axes, atomic M021 orchestration, exact provider-token
  recovery, correlation lookup and quarantine, webhook replay/cutover, capability transport, browser
  destination validation, canonical `billing.*` events and catalog dependency IDs. Final independent
  review has zero open material findings and Cyber Neo risk is `0/100`.
- Final M014 validation passed lint/format over 143 files, 11-package typecheck, 20 test files/131
  tests, import contracts, a 226-page direct Astro build, local-link and `git diff --check` validation;
  the lockfile remained unchanged and secrets/PII/supply-chain scans were clear. Build and all live
  payment activation remain unauthorized.
- Added the M015 Financial and Business Profile PRD, branded responsive Client/Admin design and
  proposed ADR 019. The candidate defines reusable purpose-bound facts, immutable revisions,
  provenance, orthogonal quality axes, corrections/conflicts and minimized service DTOs without
  creating a route, schema/RLS policy, KMS/provider/AI connection or real profile data.
- Registered twenty unresolved M015 Build/live policies one-to-one as `PFL-001`–`PFL-020`. M007 owns
  identity/session/grants, M018 owns Person/Household/Client relationships, M019 owns Organization/
  business relationships and M015 only consumes their freshly authorized projections.
- Closed independent architecture/security findings covering state-axis conflation, domain-owner
  drift, stale authorization, keyed-MAC lifecycle, exact `profile.*` events, conditional relation
  scope and post-restore revocation. Final independent review is PASS with zero findings and Cyber
  Neo is security-clear at documentary risk `0/100`.
- Final M015 validation passed lint/format over 143 files, 11-package typecheck, 20 test files/131
  tests, import contracts, a 226-page Astro build, 179 active-workspace local Markdown links with zero
  broken (`workspace/**/*.md`, excluding `node_modules` and `archive`) and `git diff --check`; two
  frozen offline lockfile-only installs preserved the lock hash. No product source, dependency or
  lockfile changed, and Build remains unauthorized.
- Added the M016 Administrative Dashboard PRD, branded responsive Admin design and proposed ADR 020.
  The candidate defines one read-oriented server-side aggregation/BFF with per-widget authorization,
  explicit coverage/freshness/failure semantics, deterministic priority and owner-module drill-down;
  it creates no route, schema/RLS policy, real widget/metric, provider connection or product behavior.
- Registered twenty unresolved M016 Build/live policies one-to-one as `ADM-001`–`ADM-020`. M016 owns
  composition/preferences/disposable snapshots only; canonical CRM/client/case/task/document/
  communication/appointment/payment/approval/risk/reporting/observability state and commands remain
  in their owner modules.
- Closed independent architecture/security findings covering complete authorization-fingerprint
  cache provenance, alert/count and analytics/quality gate separation, minimized future recent
  activity, advisory `complete` semantics and conditional impersonation controls. Final independent
  review has zero open P0–P3 findings and Cyber Neo is security-clear at documentary risk `0/100`.
- M016 final validation passed lint/format over 143 files, 11-package typecheck, 20 test files/131
  tests, import contracts, a 226-page Astro build, 186 active-workspace local links across 150
  Markdown files with zero broken and `git diff --check`; two frozen offline lockfile-only installs
  preserved the lock hash. The intentionally route-less Next.js scaffold has no applicable product
  build yet. No product source, dependency or lockfile changed, and Build remains unauthorized.
- Added the M017 CRM PRD, branded responsive Admin design and proposed ADR 021. The candidate defines
  one identity-neutral commercial relationship root, stable versioned purpose bindings,
  Opportunities, immutable Pipeline/Stage and relation/history boundaries, typed owner projections,
  recoverable conversion/merge/import/export and governed metadata without creating product behavior.
- Registered 23 unresolved M017 Build/live policies one-to-one as `CRM-001`–`CRM-023`. M018 owns
  Person/Household/formal Client/contact methods, M019 Organization relationships, M020 Lead and
  qualification, M021/M022/M023 Order/Case/Task and M077/M078 audit/consent; M017 duplicates none.
- Closed independent architecture/security findings covering per-purpose isolation, Task and
  organization-link receipts, Contact 360/M020 qualification, protected reveal/M077, definition and
  saved-view lifecycle, Opportunity duplicate preservation, high-risk idempotency/recovery and
  retention/restore. Final independent review has zero P0–P3 and Cyber Neo is security-clear at
  documentary risk `0/100`.
- M017 final validation passed lint/format over 143 files, 11-package typecheck, 20 passing test
  files/131 tests with three deliberate skips, import contracts, a 226-page Astro build, 188 active-
  workspace local links across 155 Markdown files with zero broken and `git diff --check`; two
  frozen offline lockfile-only installs preserved the lock hash. No product source, dependency or
  lockfile changed, and Build remains unauthorized.
- Added the M018 Client Management PRD, branded responsive Admin design and proposed ADR 022. The
  candidate defines canonical Person/contact-method/basic Household and formal Client lifecycle,
  assignments, scoped representatives, restrictions, onboarding/offboarding, operational notes and
  a closed source-aware Client 360 without creating product behavior.
- Registered 23 unresolved M018 Build/live policies one-to-one as `CLM-001`–`CLM-023`. Organization,
  ServiceOrder, CaseFile, Task, Document, Billing, Appointment, Communication, Consent, account/grant,
  profile and audit truth remain with their canonical owners; M018 composes only typed minimized
  projections and publishes typed party/client handoff ports.
- Closed independent architecture/security findings covering owner boundaries, lifecycle axes,
  section authorization/freshness, next actions, household isolation, onboarding/offboarding,
  restriction effects, note redaction, temporary access, high-risk recovery and exact dependency
  direction. Final independent review has zero P0–P3 findings and Cyber Neo is security-clear at
  documentary risk `0/100`.
- M018 validation passed Biome over 143 files, 11-package typecheck, 20 passing test
  files/131 tests with three deliberate skips, import contracts, a 226-page Astro build and 193
  active local links across 162 Markdown files with zero broken. Two frozen offline lockfile-only
  installs preserved the lock hash. No product source, dependency or lockfile changed, and Build
  remains unauthorized.
# Unreleased

- Hardened the controlled M031 bookkeeping build with context-fenced entity/case setup, idempotent book replay, authored entity referential constraints, an internal-ledger-only disabled integration contract, and safer bilingual client/admin status surfaces. No accounting provider, bank connection, external synchronization, tax filing, payment, export, migration execution or deployment was activated.
- Added review-only M031 contracts for opening balances, adjusting entries, merchant/rule categorization, client questions, financial comparisons, tax mapping/handoff and client report packaging. None can auto-post, decide tax deductibility, file, export or activate a provider.

- Added the provider-disabled M017 CRM technical baseline: purpose- and permission-scoped commercial
  workspace contracts, version-checked pipeline validation, minimized source projections,
  duplicate-review-only behavior, PII/content rejection, fail-closed Admin route/API and bilingual
  responsive internal UI. No CRM records, migrations, merges, conversions, providers or activation
  were introduced.

- Expanded M012 secure messaging from its initial private shell to a durable PostgreSQL/RLS adapter,
  authenticated inbox and detail APIs, AES-256-GCM message-body sealing, M011 opaque-document
  references, client/resource authorization and audit isolation. External delivery remains disabled.

- Added M011 secure document portal core: typed document contracts, fail-closed quarantine lifecycle,
  immutable versions, legal-hold soft-delete protection, server-only metadata schema, bilingual
  client document surface and provider-disabled private API posture.

- M013 adds the internal appointment core, authorization-bound conflict-safe holds, capacity
  serialization, idempotent booking, atomic rescheduling, version-fenced cancellation, client
  scheduling APIs/UI, immutable schedule revisions and provider-neutral outbox contracts. Calendar,
  notifications, payments and public booking remain unactivated.
- Added the M015 provider-disabled financial and business profile foundation, including typed purpose-specific projections, correction proposals, deterministic preliminary calculations, protected bilingual profile guidance and focused isolation tests.
- Expanded M015 with the Product Owner-approved Package B self-service slice: a disabled-by-default,
  personal-context-only workflow for predefined general goals, a visible notice/version receipt,
  private API/RLS persistence and client-safe Spanish/English portal UI. It collects no free text,
  financial, credit, tax, business, identity or document data.

- Expanded M015 with provider-disabled C1 home-buying financial proposals: a fail-closed data
  protector boundary, ciphertext-only PostgreSQL schema, personal-context API contract and bilingual
  gated client form. The only allowed values are self-reported monthly gross income and recurring
  monthly debt in USD/monthly cadence; DTI is preliminary and non-decisional.

- Added the provider-disabled M018 Client Management technical baseline: ClientRelationship and
  lifecycle contracts, representative-proposal safeguards, minimized 360 projections, PII/account
  field rejection, fail-closed Admin route/API and bilingual responsive internal UI. No client records,
  migrations, access grants, owner actions, organization behavior or provider activation was added.

- Added the provider-disabled M019 Organization Management technical baseline: organization and
  relationship contracts, reauthentication-fenced lifecycle policy, formation safeguards, sensitive
  identifier rejection, fail-closed Admin route/API and bilingual responsive UI. No organization,
  filing, compliance, ownership, provider or client-access behavior was activated.

- Recorded Product Owner acceptance of M016-M019 as provider-disabled technical foundations. Real
  administrator, CRM, client and organization operations remain deferred to their canonical owners.

# M039 - CreditCardBroker controlled foundation

- Added source-controlled, provider-disabled CreditCardBroker contracts, authored schema/migration and focused tests. No external provider behavior is enabled.

# M040 - Partner Management controlled foundation

- Added central Partner Registry contracts, provider-disabled gate, authored schema/migration and focused tests. No external partner capability is enabled.

## 2026-08-26

- Added M041 provider-abstraction controlled foundation, including versioned canonical provider contracts, provider metadata schema and migration, disabled adapter and routing guards, endpoint and secret-reference validation, focused tests, documentation and audit evidence. No external provider was enabled.

## 2026-08-26

- Added M042 Service Catalog controlled foundation across service registry/versioning, configuration references, publication readiness, discovery projections, governance controls, Drizzle schema and migration 0050. No public service publication, price, checkout, workflow, provider or partner activation occurred.

## 2026-08-26

### Added
- Controlled M044 payment-verification foundation with provider-neutral contracts, deterministic verification engine, rule traces, sufficiency records, human-start gates, manual-review queue, overrides, audit/outbox records, and safe M043 evidence mapping.
- Deny-by-default M044 PostgreSQL schema and authored-only migration `0054_m044_payment_verification_controlled_foundation.sql`.
- Provider-disabled configuration, M044 architecture/module/runbook documentation, and focused verification tests.

### Security
- Kept all provider ingress and M045/M068 handoffs disabled, prohibited AI payment decisions, and prevented payment verification from granting entitlements or starting workflows.

## Unreleased

### Added
- M046 controlled pricing, discounts, and promotions foundation: versioned pricing
  contracts, deterministic integer-minor-unit calculation, profiles/price books/rules,
  external-fee separation, promotion reservation, quotes/schedules, immutable snapshots,
  governed projections, fail-closed runtime controls, RLS schema, and authored-only
  migration `0056_m046_pricing_controlled_foundation.sql`.

### Changed
- M042 commercial profiles now require an M046 pricing-profile reference and version as
  a pair, and the legacy catalog price calculation delegates to `@atlas/pricing`.

### Security
- Kept every M046 runtime integration disabled. No live price, checkout, payment,
  provider, refund, entitlement, workflow, migration, or deployment behavior was added.

<!-- M045_SERVICE_ENTITLEMENTS_CHANGELOG -->
### Added
- M045 controlled service-entitlements foundation with deterministic scoped decisions,
  explicit deny precedence, temporary grants, quota/idempotency contracts, client-safe
  views, RLS schema, and provider-disabled runtime controls.

### Added
- M047 controlled Internal AI Hub foundation with versioned internal workspaces, agents/manifests, model/prompt/tool policy, scoped knowledge/context, evaluation/release gates, run/handoff/approval contracts, deny-by-default RLS schema, and authored-only migration `0057_m047_internal_ai_hub_controlled_foundation.sql`.

### Security
- Kept Ollama/Qwen, cloud providers, tools, jobs, egress, memory automation, supervisor delegation, public/client AI UI, migrations, and deployment disabled. M047 rejects mutable references, sensitive egress, private-reasoning storage, unsafe tool scope, and release with open blocking findings.

## 2026-08-26

- Added M048 Supervisor Agent controlled foundation. Routing, planning, execution controls, governance, persistence, audit chain, and tests are present; runtime execution remains disabled pending Product Owner approval.

## 2026-08-27

- Added M049 Reception Agent controlled foundation with deterministic bilingual public-intent
  classification, digest/reference-only records, prepared lead/link/handoff requests, M047 manifest
  binding, M048 supervisor-envelope conversion, provider-disabled runtime, RLS schema, authored-only
  migration 0059_m049_reception_agent_controlled_foundation.sql, focused tests, and runbook.
- No raw sensitive public content, provider call, CRM write, appointment, link issuance, payment
  access, follow-up, handoff dispatch, migration execution, deployment, or product activation was added.

## 2026-08-27 - M050 Intake Agent

- Added the provider-disabled M050 structured intake foundation.
- Added intake contracts, collection gates, safe normalization, conditional-cycle detection, completion/readiness assessment, and scoped handoff preparation.
- Added additive database schema and unexecuted migration 0060.
- Added M050 module, architecture, and runbook documentation plus focused tests.

## M051 Scheduler Agent

- Added a provider-disabled scheduler-agent foundation with explicit timezone resolution, prepared
  booking requests, deterministic precondition assessment, client-safe human handoffs, schema, and
  non-executed migration preparation.

## M052 Customer Support Agent

- Added a provider-disabled authenticated support foundation with ownership gating, client-safe
  unknown/stale status handling, explicit routing, prepared support-case drafts, minimized handoffs,
  schema, and a non-executed migration.

## Unreleased

### Added

- M053 Credit Specialist Agent controlled foundation with authorization gates, reference-only report
  objects, evidence candidates, dispute-readiness guards, non-dispatching handoffs, and disabled
  runtime controls.

## Unreleased

### Added

- M054 Tax Specialist Agent controlled foundation with tax-authorization gates, reference-only source
  records, review candidates, filing-readiness controls, non-dispatching handoffs, and disabled
  runtime flags.

## Unreleased

### Added

- M055 Business Formation Agent controlled foundation with formation authorization gates,
  reference-only source records, non-conclusive candidates, filing-readiness controls,
  non-dispatching handoffs, and disabled runtime flags.
