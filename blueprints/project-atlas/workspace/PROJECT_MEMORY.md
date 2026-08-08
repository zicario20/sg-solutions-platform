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
