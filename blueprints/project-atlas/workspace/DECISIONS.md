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

## 2026-08-09 — Decision 016

Decision: adopt an architecture-first, external-activation-later strategy for M003 and every future
module affected by missing SG Solutions business readiness, provider accounts or partner agreements.
Architecture, definitive domain/provider contracts, security controls, fallbacks and authorized local
tests may be completed now; live connections are activated only when their prerequisites exist and
the Product Owner approves them.

Reason: SG Solutions does not yet have its final LLC structure, Stripe account, WhatsApp Business
setup or partner agreements. Those facts should not force disposable implementations or prevent a
coherent final architecture, but neither may the repository pretend those integrations are working.

Impact: `EXTERNAL_ACTIVATION_REGISTER.md` becomes the living authority for deferred connections and
activation evidence. M003 architecture work is authorized; its live model/provider, CRM, scheduling
and channel connections remain deferred. Architecture approval and local verification never imply
`Operational` status, and no Build gate or production activation is implied by this decision.

## 2026-08-09 — Decision 017

Decision: authorize Product/Architecture documentation for M004 WhatsApp Business using the complete
Product Owner-supplied M004 source, normalized to the approved TypeScript modular-monolith baseline
and ADR 006. M004 will use only an official provider through a provider-neutral channel adapter,
reuse the M003/M025 conversation kernel and keep real account/number/template activation deferred.

Reason: the Product Owner explicitly instructed Codex to continue with Module 4 after establishing
that architecture and definitive contracts should be completed before unavailable external accounts
and business connections are activated.

Impact: Codex may prepare the M004 PRD, UX/architecture design, proposed ADR, activation checklist,
security boundaries and independent documentary reviews. This decision does not authorize
`GENERATE`, product code, WhatsApp Web automation, a live Meta/BSP account, credentials, number
registration, template submission, external messages, merge, deployment or Operational status.

## 2026-08-09 — Decision 018

Decision: authorize Product/Architecture documentation and independent documentary audit for M005
Voice Agent, followed by M006 in its own worktree. M005 must normalize the complete Product
Owner-supplied source to the approved TypeScript modular-monolith baseline, keep business policy and
durable state in the platform, and treat M096 as a proposed narrow real-time media boundary.

Reason: the Product Owner explicitly instructed Codex to continue through M005, audit it, then move
to M006 in a separate worktree and stop after M006 is independently audited.

Impact: Codex may prepare the M005 PRD, experience/architecture design, proposed ADR 009, activation
checklist, consistency updates and read-only independent/security reviews. This decision does not
approve ADR 009, resolve its business/legal/provider choices, authorize `GENERATE`, add a runtime or
dependency, activate a telephony/speech/model provider, create an account or number, process real
calls, enable recording/transcription, merge, deploy or declare the module Operational.

## 2026-08-09 — Decision 019

Decision: authorize Product/Architecture documentation and independent documentary audit for M006
Public Forms in its own worktree after M005 closure. M006 must normalize the full Product Owner
source to the approved Astro/Next/TypeScript modular-monolith baseline and remain the public capture
boundary, not a second CRM or private specialist-intake system.

Reason: the Product Owner instructed Codex to continue from the independently audited M005 snapshot,
complete and audit M006 in a separate worktree, then stop.

Impact: Codex may prepare the M006 PRD, design, proposed ADR 010, activation decisions, authority
updates and read-only independent/security reviews. This decision does not approve ADR 010, exact
form fields/copy/policy, `GENERATE`, code, tables, public routes, provider accounts, real submissions,
email/CRM/calendar/payment/analytics/partner connections, cookies, merge, deployment or Operational
status.

## 2026-08-09 — Decision 020

Decision: authorize Product/Architecture documentation and independent documentary audit for M007
Client Authentication and Account in its own worktree after M006 closure. M007 must normalize the
complete Product Owner source to the approved Supabase Auth, Next.js, Postgres domain/RLS/Storage
architecture and preserve the separation of identity, account status, membership, role,
entitlement and resource access.

Reason: the Product Owner explicitly directed Codex to continue with Module 7 after approving the
same isolated architecture/audit workflow for M004–M006.

Impact: Codex may prepare the M007 PRD, account/authentication UX design, proposed ADR 011, external-
activation checklist, authority updates and read-only independent/security reviews. This decision
does not approve ADR 011, resolve session/MFA/retention/linking business policy, authorize
`GENERATE`, create routes, tables, RLS/Storage policies, Supabase/Google/email/MFA configuration,
credentials, real accounts or sessions, merge, deployment or Operational status.

## 2026-08-09 — Decision 021

Decision: authorize Product/Architecture documentation and independent documentary audit for M008
Client Dashboard in its own worktree based on the independently audited M007 snapshot. M008 must be
the Client Portal Home, reuse M007/ADR 004 authorization and owning-domain projections, select one
deterministic next action and remain a read model rather than a new source of truth.

Reason: the Product Owner explicitly directed Codex to continue with Module 8 after establishing the
same isolated architecture/design/audit workflow for M004–M007.

Impact: Codex may prepare the M008 PRD, responsive branded UX/UI design, proposed ADR 012, deferred
decision checklist, authority updates and read-only independent/security reviews. This decision
does not approve ADR 012 or any unresolved business policy, authorize `GENERATE`, create the
`/client` route, schemas/RLS policies, cache, provider connection, real client dashboard, merge,
deployment or Operational status. M008 must not duplicate M009–M014 behavior or infer unavailable
  payment, appointment, document, task or case state.

## 2026-08-09 — Decision 022

Decision: authorize Product/Architecture documentation and independent documentary audit for M009
Mis servicios in its own worktree based on the independently audited M008 snapshot. M009 must be the
authorized contracted-service directory and detail shell, reuse real `ServiceOrder`/`CaseFile`
records and M007/M008 authorization, and keep M010–M014 behavior in their owning modules.

Reason: the Product Owner explicitly instructed Codex to complete M009, then only after its audited
commit continue to M010 and M011 in separate sequential worktrees.

Impact: Codex may prepare the M009 PRD, responsive branded UX/UI design, proposed ADR 013, deferred
decision checklist, authority updates and read-only independent/security reviews. This decision
does not approve ADR 013 or unresolved business policy, authorize `GENERATE`, create a route,
schema/RLS/Storage policy, service record, provider connection, real portal behavior, merge,
deployment or Operational status. M010 and M011 remain unopened until M009 is independently audited,
validated and committed.

## 2026-08-09 — Decision 023

Decision: authorize Product/Architecture documentation and independent documentary audit for M010
Estado de mi proceso in its own worktree based on the independently audited M009 commit. M010 must
remain a read-only projection of canonically owned ServiceOrder, Billing and CaseFile/workflow facts,
reuse the M007–M009 authorization boundary and expose only governed client-safe milestones, next
actions, blockers and public timeline events.

Reason: the Product Owner explicitly instructed Codex to complete M009, then M010 and M011 one at a
time in separate worktrees, with an audit before opening the next module.

Impact: Codex may prepare the M010 PRD, responsive branded UX/UI design, proposed ADR 014, deferred
decision checklist, authority updates and read-only independent/security reviews. This decision
does not approve ADR 014 or unresolved business policy, authorize `GENERATE`, create a route,
schema/RLS policy, public-event projection, provider connection, real process data, merge,
deployment or Operational status. M011 remains unopened until M010 is independently audited,
validated and committed.

## 2026-08-09 — Decision 024

Decision: authorize Product/Architecture documentation and independent documentary audit for M011
Portal de documentos in its own worktree based on the independently audited M010 commit. M011 must
be the single document-domain owner, use approved Supabase private Storage, preserve explicit
case/document authorization and separate upload safety, operational review, visibility, version
and retention/hold facts.

Reason: the Product Owner explicitly instructed Codex to complete M009, then M010 and M011 one at a
time in separate worktrees, audit each module and stop after M011.

Impact: Codex may prepare the M011 PRD, responsive branded UX/UI design, proposed ADR 015, deferred
decision checklist, authority updates and read-only independent/security reviews. This decision
does not approve ADR 015 or unresolved business/legal/provider policy, authorize `GENERATE`, create
a route, schema/RLS/Storage policy, bucket, scanner/OCR/signature provider, real file or document
record, merge, deployment or Operational status. Work stops after M011 documentary closure unless
the Product Owner gives a new instruction.

## 2026-08-09 — Decision 025

Decision: authorize Product/Architecture documentation and independent documentary audit for M012
Mensajería segura, then M013 Citas del cliente and M014 Pagos y facturación del cliente, strictly
one at a time in separate worktrees. M012 begins from the clean independently audited M011 commit;
each later worktree may open only after the preceding module is audited, validated and committed.

Reason: the Product Owner explicitly instructed Codex to complete M012, then M013 and M014 in that
order, using an isolated worktree and independent audit for each, and to stop after M014.

Impact: for M012, Codex may normalize the complete supplied source into its PRD, responsive branded
UX/UI design, proposed ADR 016, MSG-001–MSG-020 decision register, authority updates and read-only
independent/security reviews. Equivalent documentary scope is authorized later for M013 and M014
only after their predecessor gates close. This decision does not approve any ADR or unresolved
business/legal/provider policy, authorize `GENERATE`, product code, routes, schema/RLS/Storage
policies, real messages/appointments/payments, AI, Google/Stripe/notification/channel activation,
merge, deployment or Operational status. Work stops after the clean audited M014 commit unless the
Product Owner gives a new instruction.

## 2026-08-12 — Decision 026

Decision: authorize Product/Architecture documentation and independent documentary audit for M015
Financial and Business Profile in its own worktree based on the independently audited M014 commit.
M015 must normalize the complete Product Owner-supplied source, remain the reusable purpose-bound
profile fact/provenance/revision authority and preserve canonical ownership in M007, M011 and
M017–M022 plus the specialist service domains.

Reason: the Product Owner explicitly instructed Codex to implement Module 15 and continue until it
is complete. The repository's universal Phase 0 gate still requires the exact token `GENERATE` and a
recorded Build decision before product code; therefore this instruction authorizes completion of the
same architecture/design/audit workflow used for M003–M014, not executable product behavior.

Impact: Codex may prepare the M015 implementation-ready PRD, responsive branded UX/UI design,
proposed ADR 019, PFL-001–PFL-020 decision register, cross-document authority updates and read-only
independent/security reviews. This decision does not approve ADR 019 or unresolved business/legal/
data policy, authorize `GENERATE`, routes, schemas/migrations/RLS, encryption keys, providers, AI,
real profile data, merge, deployment or Operational status. Any M015 Build requires a separate
Product Owner decision after the PRD/design/ADR and affected PFL gates are approved.

## 2026-08-12 — Decision 027

Decision: authorize Product/Architecture documentation and independent documentary audit for M016
Administrative Dashboard, then M017 CRM and M018 Client Management, strictly one at a time in
separate worktrees. M016 begins from independently audited M015 commit
`015ab3ba95bf828456a6f95b59ad4d3932b8af5a`; each later worktree may open only after the preceding
module is audited, remediated, validated and committed.

Reason: the Product Owner explicitly authorized executing M016, M017 and M018 in sequence with the
same worktree, design, independent-audit and security-audit operating method used for the prior
modules, and instructed Codex not to stop before all three documentary candidates are complete. The
universal Phase 0 gate still requires the exact token `GENERATE` plus a recorded Build decision
before product code.

Impact: for M016, Codex may normalize the complete supplied source into its implementation-ready
PRD, responsive branded Admin UX/UI design, proposed ADR 020, `ADM-001`–`ADM-020` decision register,
authority updates and read-only independent/security reviews. Equivalent documentary scope is
authorized later for M017 and M018 only after their predecessor gates close. This decision does not
approve any proposed ADR or unresolved business/legal/data policy, authorize `GENERATE`, routes,
schemas/migrations/RLS, real clients/leads/dashboard behavior, providers, AI, merge, deployment or
Operational status. Work stops after the clean audited M018 commit unless the Product Owner gives a
new instruction.

## 2026-08-12 — Decision 028

Decision: authorize `GENERATE` and a bounded local/staging Build gate for M003 Public Chat, followed
by M004 WhatsApp Business and M005 Voice Agent, strictly one module at a time in separate worktrees.
Each module requires TDD, responsive bilingual UX/UI, Drizzle-controlled schema changes, enforced
authorization, complete validation, independent code review, read-only Cyber Neo review and a
separate clean commit before its successor may begin.

Provider direction: M004 will implement a direct Meta Cloud API adapter; M005 will implement a
Twilio telephony adapter. AI, moderation, STT and TTS remain replaceable ports with deterministic,
fail-closed disabled modes. Public WhatsApp and telephone entry points remain hidden until their
respective activation flags and external gates are separately approved.

Reason: the Product Owner clarified that these modules must be real production-quality code—not
documentation alone—and explicitly confirmed the proposed provider and inactive-channel design.
The goal is to complete construction now while postponing only business-account setup and live
connections until SG Solutions is ready to operate them.

Impact: code, tests, Drizzle migrations, RLS/Storage policies where applicable, synthetic contract
tests and inactive adapters/configuration may be created for M003–M005. This decision does not
invent or approve unresolved business/legal policy; activate Meta/Twilio/model providers; authorize
real accounts, credentials, numbers, templates, webhooks, live traffic, real client data,
production deployment, default-branch merge or `Operational` status. Unresolved affected behavior
must remain disabled or fail closed. No M006 or later Build is authorized by this decision.

## 2026-08-12 — Decision 029

Decision: the Product Owner’s “Si todo está aprobado” accepts the persisted M003 Public Chat written
specification and ADR 007 same-origin Astro runtime.

Reason: M003 requires one approved first-party runtime boundary before the public chat gateway can
be built and tested without introducing cross-origin cookie, CORS or CSRF ambiguity.

Impact: the bounded M003 Build may configure the approved Astro/Vercel runtime and provider-neutral,
fail-closed local/staging code under Decision 028. This decision does not select or activate a model
or other provider, authorize credentials, model traffic, real client data, public channel
activation, deployment, production release or `Operational` status. All external-activation
exclusions in Decision 028 and `EXTERNAL_ACTIVATION_REGISTER.md` remain in force.
