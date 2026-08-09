# Decisions

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Active decision record
- Update rule: append numbered, dated decisions with reason and impact; never delete history

## 2026-08-02 — Decision 001

Decision: Project Atlas serves only SG Solutions and its clients; multi-tenancy and white-label are excluded.

Reason: no commercial licensing requirement exists and premature tenancy would multiply authorization complexity.

Impact: one organization context, internal roles and explicit client resource grants.

## 2026-08-02 — Decision 002 (historical; superseded by Decision 005)

Decision histórica: se prohibió publicar precios de servicios.

Reason: services require personalized evaluation.

Impact at the time: the system used quotes, deposits, one-time payments, plans, invoices and service-linked subscriptions. Decision 005 later replaced the absolute restriction with governed publication modes.

## 2026-08-02 — Decision 003

Decision: adopt local role-specific skills: Superpowers for implementation and correction, UI/UX Pro Max for design, and Cyber Neo for security auditing.

Reason: role-specific workflows preserve design quality, test discipline and independent security review without allowing one agent to self-certify.

Impact: visual work requires a persisted design handoff; implementation requires isolated planning, TDD and fresh verification; Cyber Neo remains strictly read-only and a separate corrector fixes confirmed findings. Missing required skill availability blocks its phase. Skills never override approved product documentation or Product Owner authority.

## 2026-08-08 — Decision 004

Decision: define SG Solutions Platform as one professional web application with Public Website, Client Portal and Admin/Internal surfaces. `Project Atlas` and `SG Solutions Operating System` remain internal names/metaphors only.

Reason: the product must be understandable as one operating platform for SG Solutions, not a third-party SaaS, real operating system, collection of applications or microservice estate.

Impact: routes are logically `/`, `/client` and `/admin`; the approved Astro plus Next physical split remains. The catalog registers conceptual modules without granting implementation authority. Multi-tenancy and white-label remain excluded.

## 2026-08-08 — Decision 005 (supersedes Decision 002)

Decision: include a price engine from foundation with modes `public`, `from`, `quote` and `consultation`. Publication is off by default and the Product Owner activates each public price. Partner rates/prices require source, effective date and disclosures.

Reason: SG Solutions needs flexible service merchandising without treating every service as fixed-price or exposing unapproved amounts.

Impact: Decision 002 remains historical but its absolute prohibition is superseded. Quotes and consultations remain default options; public display is an explicit per-service decision.

## 2026-08-08 — Decision 006

Decision: adopt a modular monolith with one transactional database, shared business primitives and provider adapters. Business Formation is the first complete vertical; cloud-first precedes later hybrid infrastructure.

Reason: common operations require transactional consistency and reuse, while vertical extensions preserve domain clarity. Premature services or local infrastructure would add operational cost without evidence.

Impact: a microservice requires an ADR proving a scale, security, deployment, hardware, failure-isolation or runtime boundary. Stripe remains external financial authority; Postgres remains operational truth; AI and payment confirmation never replace required human authority.

## 2026-08-08 — Decision 007

Decision: archive the E1–E3 blueprint, task queue and epics as superseded, non-executable history. No active `tasks.json` will exist until approved module PRDs, the applicable Build gate and explicit Product Owner authorization permit a new executable queue.

Reason: the E1–E3 sequence predates and is incomplete against the approved R1.1–R1.5 roadmap. In particular, it did not deliver R1.4 Business Formation with EIN, business compliance and electronic signature, nor govern the canonical M001–M110 catalog.

Impact: the bundle root contains a documentary index only. Historical files live under `../archive/pre-roadmap-2026-08-02/` and must not be executed. The next step remains Product Owner review of the documentary roadmap.

## 2026-08-08 — Decision 008

Decision: make the repository-root `AGENTS.md` the universal governance entry point. Codex with the
architecture skill is the architect; separately scoped Codex agents implement authorized work;
ChatGPT is the independent auditor; the Product Owner is final authority. Remove tool-specific
project governance and mandatory tool-specific workflows.

Reason: permanent responsibilities and authority must remain stable across tools and sessions.

Impact: no tool-specific project file can redefine scope, roles, architecture or workflow. The
workspace `AGENTS.md` is only a path adapter to the root contract.

## 2026-08-08 — Decision 009

Decision: adopt secure case-based authorization inheritance under ADR 004. Client membership links
identity but grants no case access; active case grants inherit only to client-visible children.
Internal resources never inherit, Highly Sensitive documents may require additional access and any
resource may block inheritance.

Reason: per-resource grants for every ordinary item are operationally brittle, while email/client-
status access is unsafe.

Impact: domain services, RLS and Storage policies implement the same revocable model and require
cross-client, block-inheritance and revocation tests.

## 2026-08-08 — Decision 010

Decision: establish four data classes, a quarantine/scan/promote upload lifecycle, application-level
envelope encryption for selected Highly Sensitive fields and a documented backup/restore program.

Reason: managed storage encryption and private buckets alone do not define a complete security or
recovery architecture.

Impact: `DATA_CLASSIFICATION.md`, `FILE_UPLOAD_SECURITY.md`, `BACKUP_AND_RECOVERY.md` and ADRs
003/005 govern implementation. KMS vendor, detailed retention and some upload limits remain explicit
Product Owner decisions before Build.

## 2026-08-08 — Decision 011

Decision: preserve Release 1 — Production Foundation while delivering it as Release 1A — Minimum
Real-Client Operations followed by Release 1B — Operational Maturity. Existing R1.1–R1.5 labels are
capability workstreams spanning the slices.

Reason: the foundation must reach real clients sooner without producing disposable implementations
or destabilizing the 110-module catalog.

Impact: 1A uses final primitives and security boundaries with narrower behavior; 1B extends them
compatibly and completes the Business Formation vertical.

## 2026-08-08 — Decision 012

Decision: treat `corepack pnpm scaffold:validate` as the Phase 0 executable acceptance gate while
keeping `corepack pnpm build` as the future real-product build. Pin audited vulnerable transitive
packages through exact pnpm workspace overrides without changing the approved stack.

Reason: Phase 0 needs reproducible tooling evidence without creating unauthorized placeholder
routes, and known dependency advisories must not remain in the checked-in lock graph.

Impact: the lockfile pins corrected `esbuild`, `postcss` and `sharp` releases; tracked examples contain
no embedded database credentials; the real Next/Astro build becomes applicable only after the
Product Owner authorizes product routes through `GENERATE` and the relevant Build gate.

## 2026-08-08 — Decision 013

Decision: authorize `GENERATE` and a bounded Build gate for M001 Public Website. Codex must continue
until the M001 implementation, verification evidence, independent review and PCR are complete. The
approved “Financial Clarity” execution direction applies the existing Manrope/Inter and navy,
cobalt, cyan, green, gold and light-surface baseline while preserving the supplied SG Solutions logo
without modification.

Reason: the Product Owner explicitly instructed Codex to begin with Module 1 and not stop until it is
complete, then supplied the company logo as required visual context.

Impact: M001 may create the Astro public routes, presentation components, bilingual content layer,
SEO/accessibility behavior, tests and deployment-facing public configuration. It may not implement
M002/M003/M006/M007/M013/M017/M043 behavior or invent contact facts, legal approval, testimonials,
prices or provider integrations. Every other module remains gated.

## 2026-08-08 — Decision 014

Decision: authorize `GENERATE` and a bounded Build gate for M002 Help Center and Frequently Asked
Questions. M002 extends the verified M001 Astro surface with governed bilingual public knowledge,
search, discovery, freshness, SEO/accessibility, minimized feedback contracts, tests and a
Sanity-compatible public-content boundary.

Reason: the Product Owner explicitly instructed Codex to begin Module 2 and continue until it is
complete, after confirming that the original M1–M21 requirements corpus remains the intended input.

Impact: M002 may replace the duplicated M001 FAQ source with a canonical Help Center, create public
content routes and progressive search/feedback behavior, and prepare allowlisted interfaces for
Sanity and future consumers. It may not implement private knowledge, RAG, AI answers, chat,
WhatsApp, telephony, portal/CRM lookup, live CMS credentials, individualized advice or unapproved
analytics transport. M003–M110 remain gated unless separately authorized.

## 2026-08-08 — Decision 015

Decision: authorize the Tradeline Supply public FAQ and linked explanatory pages as a category-
scoped editorial source for eleven neutral bilingual Tradelines topics in M002. The source is
classified as `provider`, is permitted only on `tradelines` records and must use the exact
`tradelinesupply.com` host. It is not an official government source.

Reason: the Product Owner explicitly requested that the empty Tradelines category be populated from
that FAQ while M002 was still inside its approved Build gate.

Impact: the pages must identify Tradeline Supply as an external provider source and state that the
citation does not imply an SG Solutions partnership, endorsement or guarantee. No provider price,
ordering process, refund term, contact fact, affiliate claim or universal outcome is adopted. These
records are medium-risk, expire from public projection after 2026-11-08 unless reviewed, and do not
authorize the M029 Tradelines service, a provider integration or a commercial relationship.
