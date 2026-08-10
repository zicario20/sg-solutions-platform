# Project Memory

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Active append-only record
- Update rule: append dated events; never delete or rewrite historical entries

## 2026-08-02

- Project Atlas classified as a production-ready, single-organization operational platform.
- Astro approved for the public site and Next.js App Router for the private application.
- Supabase Auth/Postgres/Storage, Drizzle-only migrations, Stripe reliability controls, narrow native scheduling, Sanity public-only content and minimized analytics approved as baseline.
- Code generation remains unauthorized; documentary blueprint work is authorized.

## 2026-08-08

- Canonical definition established: one SG Solutions web platform with Public, Client Portal and Admin/Internal surfaces.
- Modular monolith, central Postgres database, shared primitives and provider adapters established as the architecture baseline.
- Roadmap expanded through Phase 0 and R1–R10; Release 1 — Production Foundation is the first delivery and Business Formation the first complete vertical.
- A 110-module conceptual catalog was registered; registration does not authorize implementation.
- Price policy revised to opt-in publication modes with Product Owner activation, superseding the absolute restriction in Decision 002.
- Implementation remains not started and not authorized; next step is Product Owner documentary review.
- The superseded E1–E3 blueprint, queue and epics were archived intact because they predated R1.4 and the canonical module roadmap. No active executable queue exists.
- The Product Owner authorized an architecture-audit remediation limited to documentation,
  governance, security planning, architecture hardening and scaffold consistency; product behavior
  remains unauthorized.
- Repository governance was made tool-neutral: the root `AGENTS.md` is universal, Codex is the
  architecture/authorized implementation environment, ChatGPT is the independent auditor and the
  Product Owner remains final authority.
- Release 1 was split compatibly into 1A Minimum Real-Client Operations and 1B Operational Maturity;
  R1.1–R1.5 remain workstream tags.
- Critical module PRDs were expanded and security architecture added for authorization inheritance,
  uploads, classification, encryption, backup and recovery. Unresolved business policies were
  surfaced for Product Owner decision rather than invented.
- The Product Owner supplied a detailed M1–M21 requirements corpus. It was analyzed and registered
  as research input. Its business-domain detail is useful, but its older .NET/EF/MinIO/Hangfire
  baseline and divergent M20/M21 numbering do not override the currently approved architecture or
  module catalog. Normalization and Product Owner approval are required before it becomes canonical.
- The Phase 0 pnpm/Turborepo scaffold gained an exact lockfile, package-local TypeScript checks,
  bounded test discovery, a dedicated scaffold-validation command and contract tests proving that
  framework declarations do not introduce unauthorized product routes.
- A read-only Cyber Neo review identified tracked local database credentials and six vulnerable
  transitive dependency advisories. The credentials were removed, exact pnpm overrides were applied
  without changing the approved stack, and follow-up secret/dependency scans returned no findings.
- A real product build was attempted for evidence and stopped because product routes do not yet
  exist. This is the intended Phase 0 boundary; placeholder behavior was not created to conceal it.
- The Product Owner authorized `GENERATE` and the Build gate exclusively for M001 Public Website and
  directed Codex to continue through completion. The approved visual baseline is translated as
  “Financial Clarity,” using the supplied logo intact while rejecting the banner's visual density.
- M001 received a dedicated 21-section PRD and persisted UX/UI execution specification. Dependent
  lead, scheduling, payments, authentication, CRM, Help Center and marketplace behaviors remain in
  their owning modules and are not simulated by M001.
- M001 was implemented as a static-first bilingual Astro public site with 19 Spanish and 19 English
  content routes, operational endpoints, safe CTA fallbacks, self-hosted approved fonts, the exact
  supplied logo, responsive components, SEO projections and Vercel security-header configuration.
- The M001 quality gate passed 38 unit/contract tests and 32 desktop/mobile browser tests. Cyber Neo
  found no exploitable vulnerability or exposed secret; its Low ignore-rule gap and Informational
  JSON-LD hardening observation were corrected with regression tests. The module moved to Product
  Owner acceptance, not Operational or deployed status.
- Fresh post-review evidence superseded the preliminary M001 counts: 44 unit/contract tests and 40
  desktop/mobile browser tests pass, Astro emits 40 static outputs, and independent review findings
  covering CSP navigation, portal fallback, localization, touch targets, structured data and Vercel
  routing were corrected. Cyber Neo follow-up found no exploitable vulnerability or exposed secret.
- The Product Owner authorized `GENERATE` and a bounded Build gate for M002 Help Center, directing
  Codex to continue until completion. The detailed source corpus was normalized against the current
  M002/M061–M064 boundaries: M002 owns public bilingual discovery, search and governed public
  content; private knowledge, RAG, AI/channel consumers and live provider activation remain in their
  separately gated modules.
- M002 was implemented as a static-first bilingual Help Center with a governed 83-record source
  inventory per locale and 77 public records per locale. The public surface exposes 154 detail
  pages, five populated collection types, ten populated categories, minimized local search indexes,
  exact bilingual alternates, stable route manifests and no private/operational data.
- The Product Owner selected the Tradeline Supply FAQ as an editorial source for Tradelines. Decision
  015 records an exact-host/category-scoped provider boundary, third-party disclosure and no
  partnership/endorsement/guarantee interpretation. Eleven bilingual pairs are medium-risk and fail
  closed from public projection after 2026-11-08 unless reviewed; M029/provider integration remains
  unauthorized.
- M002 local quality evidence passed two frozen installs with an unchanged lock hash, a zero-finding
  audit across 901 dependencies, lint, format, 11-package typecheck, 129 tests with 3 deliberate
  skips, import contracts, a 226-page Astro build and 68 desktop/mobile browser tests. Final
  independent/Cyber snapshot review precedes Product Owner acceptance; nothing was deployed.
- The M002 browser gate exposed a Windows teardown defect after all browser actions had completed:
  Playwright could not reliably close the nested `corepack`/pnpm/Astro preview process. A bounded
  Node runner now owns the Astro PID directly, disables telemetry, waits for the health endpoint,
  runs the unchanged Playwright projects and closes the preview with a bounded fallback. The
  previously hanging focused command now exits successfully, and the full 68-test gate completes.
- The frozen-snapshot independent review found that Decision 015 provider disclosure was present on
  Tradelines detail pages but lost when the same provider-derived answer appeared in FAQ, category
  cards and search. The public index now carries only a bounded `provider|null` marker; all aggregate
  surfaces render the same bilingual no-partnership/no-endorsement/no-guarantee boundary, FAQ
  structured data remains aligned and non-provider records are not labeled. Red/green regression
  evidence and the final gate now cover 131 tests plus 74 desktop/mobile browser scenarios.
- The final remediation explicitly names Tradeline Supply on detail, FAQ, card, search and FAQ
  structured-data disclosures while retaining the minimized `provider|null` public-index marker.
  The frozen independent reviewer approved the resulting 86-path candidate with no material
  finding. Cyber Neo reported risk 0, 86/86 candidate paths reviewed, no secret/PII/private URL or
  tracked artifact, and a zero-finding 229-file workspace scan. M002 advanced to PO Acceptance;
  merge and deployment remain Product Owner decisions.

## 2026-08-09

- The Product Owner established architecture-first delivery for modules whose live activation
  depends on the future LLC structure, Stripe, WhatsApp Business, partner agreements or other
  external accounts. Architecture and definitive contracts proceed now; real connections remain
  deferred until prerequisites, controlled verification and explicit approval exist.
- `EXTERNAL_ACTIVATION_REGISTER.md` was created as the durable, secret-free list of business and
  provider activations still pending. ADR 006 separates architecture, local construction and
  external operational readiness so mocks or adapters can never be misreported as live behavior.
- M003 Public Chat entered architecture/design work only. No live provider connection or product
  Build gate was authorized by the deferral decision.
- The M003 PRD and UX/architecture design were normalized against the full Product Owner source,
  including preliminary intake, secure payment-link handoff, authenticated-safe future tools,
  Marketplace, admin/evaluation controls, analytics, performance and provider-disabled fallbacks.
- Independent and Cyber Neo review surfaced and closed gateway/CSRF, classification, transcript,
  provider-readiness, payment-link and evaluation-corpus findings. The final 16-path candidate is
  approved by the independent reviewer and security-clear at risk 0/100 for Product Owner review;
  it remains unapproved for Build or external activation.
- The Product Owner directed Codex to continue with M004 WhatsApp Business. Decision 017 authorizes
  Product/Architecture documentation only; no Build or real provider activation was opened.
- The complete M004 source was normalized away from its obsolete `.NET/Redis` diagram and into the
  approved Next.js/Postgres modular monolith. The candidate reuses M003/M025 conversations,
  separates phone association from identity/resource authorization, uses a durable provider
  inbox/outbox and keeps direct Meta versus approved BSP selection deferred.
- Proposed ADR 008 assigns official provider webhooks to a narrowly scoped `apps/app` integration
  ingress, forbids WhatsApp Web/personal-account automation and preserves the secure portal as the
  initial path for case, payment, document and other client-specific details.
- M004 review closed seven design findings: replayable pre-ACK event data, ambiguous outbound
  acceptance, ingress resource exhaustion, opt-out/outbox concurrency, intake classification and
  provider exposure, stale/reassigned phone bindings and Draft-index wording. The final 14-path
  substantive candidate passed independent review with zero open findings and Cyber Neo at risk
  0/100; it remains pending Product Owner architecture approval and has no Build/activation gate.
- The Product Owner directed Codex to document and independently audit M005, then repeat that process
  for M006 in a separate worktree and stop. Decision 018 authorizes M005 Product/Architecture work
  only; no feature Build or external activation is implied.
- The complete M005 telephone-agent source was normalized away from obsolete `.NET`/Redis assumptions
  into the approved TypeScript/Postgres modular monolith. Durable policy, tools, authorization and
  state remain in the platform; proposed ADR 009 limits M096 to validated real-time media and scoped
  speech adapters with no general database authority.
- Recording/transcription remain disabled, caller ID is never identity, phone payment is excluded,
  client-specific activity defaults to the secure portal and fourteen unresolved business/legal/
  provider decisions are preserved explicitly for the Product Owner.
- M005 review found and closed seven material documentary issues. Cyber CN-001–CN-004 established
  canonical pre-ACK replay, safe single-use media credentials, removed the M096 recovery store and
  defined spontaneous-sensitive-speech suppression. Independent IA-001–IA-003 added atomic human-
  takeover fencing, durable uncertain-transfer reconciliation and exact activation-register scope.
- Final Cyber revalidation covered the post-IA 15-path snapshot at risk 0/100; the final independent
  evidence pass confirmed all review reports/authorities and zero open findings. M005 is ready only
  for Product Owner architecture review; it has no Build or activation gate.
- The Product Owner directed Codex to continue with M006 in a separate worktree and stop after its
  independent audit. Decision 019 authorizes M006 Product/Architecture work only.
- The complete M006 source was normalized away from `.NET`/FluentValidation assumptions into the
  approved Astro/Next/TypeScript modular monolith. The candidate uses immutable form versions, a
  narrow same-origin `apps/www` gateway and domain-owned atomic submission/consent/idempotency before
  generic success. M020 remains lead authority and M078 remains consent authority.
- Release 1A defaults to minimal public data, no public files and no persistent anonymous
  Confidential drafts. Fourteen business/privacy/provider choices remain explicit Product Owner
  decisions; no route, provider or real submission is authorized.
- M006 review found and closed eight material documentary/consistency issues. Cyber CN-001/CN-002
  established exact canonical-origin/trusted-proxy controls and bounded raw parsing before object
  materialization. Independent IA-001–IA-006 separated prohibited-data handling, replaced unkeyed
  checksums with scoped HMAC, added accessible nonce renewal, fenced `risk_review` from M020 and
  synchronized M006/M078/M020 ownership across public channels. GOV-001/GOV-002 aligned nonce
  consumption and the evidence index.
- Final independent review approved the stable candidate with zero open findings; Cyber Neo
  revalidated the post-fence candidate at documentary risk 0/100. M006 remains Registered and is
  ready only for Product Owner architecture review; it has no Build or activation gate.
- The Product Owner directed Codex to continue with M007 in its own worktree. Decision 020 authorizes
  M007 Product/Architecture documentation and independent audit only; no `GENERATE`, Build or
  provider activation was opened.
- The complete M007 source was normalized into an invitation-first client-account architecture on
  the approved Supabase Auth/Next.js/Postgres baseline. Supabase owns identity/credentials;
  Postgres owns business account, membership, application revocation and audit state; ADR 004 and
  M080/M081 remain resource/RBAC authorities.
- Proposed ADR 011 defines explicit identity linking, one account with multiple methods, server-
  mediated PKCE/session handling, private/no-store authenticated routes and a pinned-version
  compatibility gate before any Build. Sixteen unresolved business/security/provider choices remain
  Product Owner decisions and external activation is recorded without credentials.
- Initial M007 review exposed provider automatic-link risk, incomplete lifecycle contracts,
  scanner-prefetch proof consumption, browser-token ambiguity, provider/local convergence gaps,
  origin/proxy and digest weaknesses, state drift, unresolved MFA wording and browser-progress
  ambiguity. The remediated design uses scanner-safe one-time ingress, a closed external-initiator
  matrix, opaque browser handle, envelope-encrypted server vault, fenced refresh/link/step-up
  operations, restricted session-derived RLS and server-authorized private Storage.
- A second independent pass found four specification inconsistencies: anonymous Google initiation,
  overly absolute credential-storage criteria, a legacy shared session graph and MFA enrollment
  start without one-time authorization. All were corrected and revalidated. Final independent
  review returned PASS with zero material findings; Cyber Neo closed CN-001–CN-010 at 0/100.
  M007 remains Registered and is ready only for Product Owner review; no ADR acceptance, Build,
  activation, merge or deployment follows from the reviews.
- The Product Owner directed Codex to continue with M008 in its own worktree based on the audited
  M007 commit. Decision 021 authorizes M008 Product/Architecture documentation and independent audit
  only; no `GENERATE`, Build, route, schema, provider traffic or real dashboard was opened.
- The complete M008 source was normalized into a request-scoped Client Portal Home read model. One
  account/session/membership/context/grant/entitlement/policy authorization snapshot and consistent
  read cut govern typed security/service/case/task/document/signature/appointment/payment/message/
  notification projections, and proposed ADR 012 requires every revocation fence before
  serialization.
- M008 selects one next action with a deterministic, versioned policy and closed source registry.
  An unavailable/missing source that could tie or outrank the tentative result yields `unconfirmed`;
  it can never become a false zero,
  no-action, paid or completed state. Release 1A uses private/no-store personalized responses, no
  monolithic dashboard snapshot and no live provider fan-out.
- Fourteen unresolved M008 business/UX/activation choices remain explicit Product Owner decisions.
  First-round review found incomplete grant/entitlement fencing, inconsistent critical read-cut
  risk, an implicit priority-source set, missing security/signature ports and caller-time ambiguity.
  The candidate now closes those gaps with a complete authorization snapshot, consistent read cut,
  closed source registry, explicit ports and trusted server clock.
- Final independent architecture review returned zero open findings and Cyber Neo returned
  `0/100 — Secure` documentarily. Repository hygiene found only two in-progress report links, closed
  by recording the M008 architecture and security reports. M008 remains Registered with no Build or
  activation authority and awaits Product Owner approval or revision.
- The Product Owner directed Codex to complete M009, then M010 and M011 sequentially in separate
  worktrees, stopping after M011. Decision 022 opens only M009 Product/Architecture documentation
  and read-only independent review from the audited M008 snapshot; no Build or provider activation
  is implied.
- The complete M009 source was normalized into an explicitly granted contracted-service directory
  and detail shell. Every visible item is a real `ServiceOrder`; active operation uses its
  `CaseFile`, accepted service/workflow/pricing versions are preserved and M009 owns no parallel
  service record.
- Proposed ADR 013 maps canonically owned ServiceOrder commercial/activation, Billing/Stripe
  financial and CaseFile/workflow fulfillment subfacts through a deterministic client policy and
  keeps M010–M014 commands/data in typed owning-domain projections under the complete M007/M008
  authorization snapshot. M009 remains documentary and has no route, schema, provider traffic or
  real service data.
- M009 review found and closed canonical state-ownership duplication, a three-to-four-axis
  Product Owner register mismatch and a resource-revocation race. The final candidate uses
  owner-qualified cancellation facts and per-root/child authorization epochs for parent linkage,
  visibility/inheritance, classification, deletion and accepted-version binding. Independent
  review returned zero open findings and Cyber Neo returned documentary risk 0/100.
- Final M009 validation passed two frozen installs with unchanged lock hash, lint/format,
  11-package typecheck, 131 tests with three deliberate skips, import contracts, a 226-page Astro
  build, 263-file zero-finding secret scan, zero-finding lock check and 126 local links with no
  breakage. M009 awaits Product Owner architecture review; no ADR acceptance, Build, merge or
  deployment follows.
- The Product Owner's sequential M009–M011 instruction advanced to M010 only after the clean audited
  M009 commit `e86724e`. Decision 023 authorizes M010 Product/Architecture documentation and
  read-only independent/security review in its own worktree; no route, schema, provider traffic,
  public-event materializer or product Build was opened.
- The complete M010 source was normalized into one read-only process projection beneath an
  explicitly granted M009 service. Canonical ServiceOrder commercial/activation, Billing/Stripe
  financial and CaseFile/accepted-workflow fulfillment facts are mapped through a deterministic
  versioned policy and closed source registry; incomplete critical state fails to `unconfirmed`.
- Proposed ADR 014 defines a nonrecursive authorized service-choice contract, bounded cursor
  pagination, safe bilingual service-instance disambiguation, direct-detail eligibility, one
  request-scoped MVCC snapshot, complete M007–M009 authorization/final fences and a public timeline
  derived only from verified allowlisted source events. Release 1A creates no M010 table, writer,
  materializer, reconciliation job or Inngest workflow.
- M010 review found and closed evidence-index placement, selector ownership, pagination/reachability,
  disambiguation, direct-detail bypass, mixed-read-cut, materialization, event-key/correction,
  owner-handoff and financial-minimization gaps. Independent review returned zero Critical,
  Important or Minor findings; Cyber Neo closed its source-event collision finding and returned
  documentary risk 0/100 with zero open findings.
- Sixteen unresolved M010 policies remain explicit one-to-one `PROC-001`–`PROC-016` Product Owner
  decisions. Until approval, financial output is limited to semantic state, freshness and the M014
  route, and all task/document/message/appointment/billing/signature actions remain with M023,
  M011–M014 and M067 respectively.
- Final M010 validation passed two offline frozen installs with unchanged lock hash, lint/format,
  11-package typecheck, 131 tests with three deliberate skips, import contracts, a 226-page Astro
  build, a 268-file zero-finding secret scan, zero-finding lock check, 134 local Markdown links,
  21 PRD sections, 16/16 decision-register synchronization, Markdown-only scope and
  `git diff --check`. M010 awaits Product Owner architecture review; no ADR acceptance, Build,
  merge or deployment follows.
- The Product Owner's sequential M009–M011 instruction advanced to M011 only after the clean audited
  M010 commit `3439a3c`. Decision 024 authorizes M011 Product/Architecture documentation and
  read-only independent/security review in its own worktree; no route, schema, RLS/Storage policy,
  bucket, scanner/OCR/signature provider, real file or product Build was opened.
- The complete M011 source was normalized into one secure document domain. Bounded upload intents,
  durable quarantine receipts, immutable versions, content/parser validation, checksum, versioned
  malware evidence and reconciled promotion precede any separately authorized review or delivery.
  Safety, promotion, quarantine disposition, operational review, request satisfaction, visibility,
  lifecycle and legal hold remain independent facts.
- Proposed ADR 015 preserves approved Supabase private Storage, M007/ADR 004 grants, Postgres/RLS
  authority and provider abstractions. Context links authorize both sides; Client/Staff DTOs are
  separate; classification/visibility changes use CAS, atomic effective-ceiling recomputation,
  authorization epochs and post-commit outbox/audit. Every transformed/generated/provider-returned
  byte artifact repeats the safety pipeline, and preview never uses the authenticated app origin.
- M011 review found and closed Admin query/mutation gaps, state/event ambiguity, cross-audience
  serialization risk, upload/recovery ordering, classification/version derivation, mobile Admin
  reflow, preview-origin ambiguity, processor-output bypass and transversal ownership drift. Final
  independent architecture/accessibility review returned zero open findings and Cyber Neo returned
  documentary risk 0/100.
- Twenty unresolved M011 policies remain explicit one-to-one `DOC-001`–`DOC-020` Product Owner
  decisions. The candidate awaits Product Owner documentary review. The authorized sequence stops
  after M011; no M012 worktree, Build, merge, deployment or provider activation was opened.
- The Product Owner subsequently authorized M012, M013 and M014 documentary architecture one at a
  time in separate worktrees, with independent/security audit and commit before opening the next,
  then stop after M014. Decision 025 records that sequence; it opens no `GENERATE`, Build, provider,
  merge or deployment authority.
- M012 began from independently audited M011 commit `f58dcfd`. The complete supplied M012 source was
  normalized into one authenticated secure-portal messaging authority over the shared conversation
  kernel. Every conversation has one account/service/case root, and participation/assignment never
  grants resource access.
- Proposed ADR 016 separates client messages from conversation-local internal/compliance notes at
  record, command, permission, event, DTO and UI boundaries. Posts atomically preserve fresh
  authorization, separate gap-free Client/private staff sequences and CAS/time domains, encrypted
  immutable initial revision/current pointer, idempotency receipt and outbox/audit evidence. M011
  retains attachment bytes/access, M025 a content-free unified-inbox projection, M026 notification
  delivery, M047–M060 AI/tool behavior and M076 compliance/human authority.
- M012 Release 1A is human, bounded plain-text messaging with metadata-only authorized search and no
  external provider. Cross-channel continuity, AI responses, translation, richer routing, read/
  typing indicators, analytics and body indexing remain separately gated. Twenty unresolved
  policies are explicit one-to-one `MSG-001`–`MSG-020` Product Owner decisions.
- M012 independent review closed all architecture/authorization/UX ownership findings, including
  MSG-005/007/009 gates, quoted-target authorization, separate Client/staff order/CAS/time domains,
  atomic encrypted initial revisions, M012/M018 note authority, M025 content-free projection,
  M076/M090/M091 governance, M092 product analytics versus M097 operational telemetry and honest
  opaque-reference privacy wording. The final independent pass has zero findings; Cyber Neo is
  `SECURITY-CLEAR` at documentary risk 0/100. No product behavior or provider was activated.
- Final M012 evidence passed two frozen offline installs, lint/format, 11-package typecheck, 20 test
  files/131 tests, import contracts and a 226-page Astro build. The stable candidate had 125 local
  links with zero broken, no introduced secrets/PII/local paths, unchanged lockfile and clean
  whitespace. The authenticated Next.js app remains intentionally empty and no route was invented.
- M013 began from the independently audited M012 commit `4fcbf425`. The complete supplied M013 source
  was normalized into one Postgres appointment authority for versioned types/policies, deterministic
  availability, single-use holds, conflict-safe booking/rescheduling, separate prerequisite/
  attendance/outcome axes and audience-specific Public/Client/Staff projections. M024 retains only
  the internal calendar UI/authorized projection and has no appointment mutation authority.
- Proposed ADR 017 makes Google Calendar a per-source minimized rebuildable projection, keeps Meeting
  secrets behind a just-in-time vault boundary and defines independent activation plus cleanup-only
  teardown gates. Public raw contact/consent reaches M020/M078 only through the internal application
  orchestrator behind `PublicSchedulingFacade`; M013 receives an opaque receipt and the Astro Gateway
  has no CRM, database or provider authority.
- M013 independent review closed facade, booking-audience, hold/requirement lifecycle, timeline,
  Admin/provider-query, Calendar/Meeting gate/teardown, external-busy privacy, restore, reason-code,
  Client-consumer, ownership/sequencing and contrast-accessibility findings. The final pass reported
  zero open findings. Cyber Neo's final post-contrast audits reported zero Critical/High/Medium/Low
  findings and documentary risk 0/100.
- Twenty unresolved M013 policies remain explicit one-to-one `APT-001`–`APT-020` Product Owner
  decisions. The candidate creates no route, schema/RLS policy, OAuth/calendar/meeting configuration,
  notification/payment traffic or real appointment and does not accept ADR 017.
- Final M013 evidence passed lint/format over 143 files, 11-package typecheck, 20 test files/131 tests
  with three deliberate skips, import contracts and a 226-page Astro build. The audited candidate had
  55 local links with zero broken, unchanged lockfile, clean whitespace and zero introduced secrets,
  PII, private URLs, local paths, media, binaries or dependency changes. M014 may open only from the
  resulting clean M013 commit under Decision 025.
- M014 began from the clean independently audited M013 commit `f50b71b`. The complete supplied M014
  source was normalized into a 21-section Client Payments and Billing PRD, responsive branded
  experience and proposed ADR 018 without creating product code, routes, schema/RLS, provider
  configuration, real price, payment or Stripe traffic.
- M014 is a Client/Public/Admin projection/action boundary over one shared Billing bounded context.
  M021 owns ServiceOrder/human approval, M042 catalog, M043 provider integration, M044 verification/
  reconciliation, M045 entitlements and M046 pricing. Quote acceptance, M021 order create-or-bind,
  exactly one obligation and one composite receipt commit atomically.
- The candidate uses immutable integer-minor-unit plus currency snapshots and the already approved
  `public|from|quote|consultation` price vocabulary with independent off-by-default publication.
  Currency/geography remains a PAY-009 decision. Payment, human approval and Case fulfillment remain
  orthogonal and payment/contact/provider relationships grant no identity or access.
- Provider operations retain or deterministically reproduce the exact provider idempotency token and
  bind opaque non-PII correlation. Lost response, restart, restore and provider-key expiry recover by
  bound evidence/bounded lookup; ambiguity quarantines without automatic reissue. Webhooks are signed
  generation-bound invalidation signals followed by canonical provider reads and object/fact dedupe.
- Public entry capability and provider return handle are separate, GET/HEAD-inert and exchanged by
  explicit POST/OTP into a clean host-only session. Every provider destination is validated against
  exact activated HTTPS scheme/host/path/bound-object policy before navigation.
- Independent audit closed price, currency, state-axis, orchestration, idempotency, capability,
  webhook/cutover, canonical-event and catalog-ID findings. The final pass reports zero material
  findings; Cyber Neo's post-remediation/final passes report zero Critical/High/Medium/Low and risk
  0/100. Twenty unresolved policies remain `PAY-001`–`PAY-020` and no Build was opened.
- M014 validation passed lint/format over 143 files, 11-package typecheck, 20 test files/131 tests with
  three deliberate skips, import contracts, direct Astro build of 226 pages, local-link and
  `git diff --check` validation. The lockfile remains unchanged and candidate hygiene scans found no
  introduced secrets, PII, private URLs, local paths, media, binaries or dependency changes.
  Decision 025 authorizes no M015 work after the clean M014 commit.
