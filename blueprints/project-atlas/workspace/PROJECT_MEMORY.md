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
