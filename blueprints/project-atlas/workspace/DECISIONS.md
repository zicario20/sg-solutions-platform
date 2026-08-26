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

## 2026-08-20 — Decision 030

Decision: recover the canonical module sequence from M004 WhatsApp Business. The recovery branch
starts from the last clean independently reviewed M003 commit
`1187f6ac4859679216290048df9964f269ac765d` and may selectively port evidence-backed work from
`codex/m004-whatsapp-build` commit `68ffa205abc03a0ae84b7599b0e0af7f26f47eec`. M004 and every
successor must use a separate worktree and close implementation, verification, architecture review,
read-only Cyber Neo review and Product Owner acceptance before the next module begins.

Reason: the transferred repository contains valuable M004 work but also stale worktree metadata,
incomplete executable validation and later out-of-gate prototypes. The Product Owner selected the
safe recovery option instead of treating the transferred tree as completed or rebuilding all M004
work without evidence.

Impact: Decision 028 remains the applicable `GENERATE` and provider-disabled local/staging Build
gate for M004. Recovery may reuse the communications kernel, fail-closed policies, inactive Meta
adapter, bounded webhook ingress, canonical persistence, migrations and tests only after review in
the new M004 worktree. No credential, live account, phone number, template, provider traffic,
deployment, default-branch merge or `Operational` claim is authorized. M005 and later modules remain
blocked until M004 closes and the Product Owner approves advancement.

## 2026-08-20 — Decision 031

Decision: adopt the Product Owner-supplied CRM Dashboard and Analytics Overview brief and visual
reference as future approved design input distributed across M016 Administrative Dashboard, M017
CRM, M020 Lead Management and M092 Reports and Analytics. The reference establishes an executive,
dense, responsive dark-premium direction adapted to the SG Solutions design system; it is not a
pixel-for-pixel copy or authority to introduce duplicate routes, fabricated data or a second system
of record.

Reason: the Product Owner wants the future administrative experience to answer operational business
questions about acquisition, conversion, services, verified revenue, cases, activity, geography and
AI effectiveness using real platform data.

Impact: M016 owns the administrative Overview composition, M017 the CRM workflow and pipeline,
M020 lead lifecycle facts and M092 advanced analytics and metric definitions. Production widgets
must use authorized backend aggregations over canonical records; demo fixtures are development/test
only. Verified payments are the only revenue authority, RBAC applies in UI and backend, sensitive
data is excluded, Power BI remains optional and deferred, and unavailable instrumentation produces
honest empty states rather than invented metrics. This decision does not authorize early CRM code or
allow M016/M017/M020/M092 to begin before their sequential module gates.

## 2026-08-20 — Decision 032

Decision: the Product Owner accepts M004 WhatsApp Business in its completed provider-disabled scope
and explicitly prohibits opening or starting module 39.

Reason: M004's isolated implementation and scoped evidence may close its provider-disabled module
scope without treating deferred external, business or release prerequisites as completed. The Product
Owner has not authorized the next module.

Impact: M004 remains provider-disabled and is not authorized for merge, deployment, Meta/provider
activation, credentials, live traffic, phone/number or template setup, or `Operational` status.
Disposable PostgreSQL validation, migration-ledger attestation, pinned Node `24.18.1` validation and
business/legal/provider prerequisites remain deferred release/activation blockers. No module 39
worktree, implementation, planning execution or successor gate may open from this decision.

## 2026-08-20 — Decision 033

Decision: authorize a bounded `GENERATE` Build gate for M005 Voice Agent in its isolated worktree.
The scope is provider-disabled only: TypeScript domain/persistence and scoped Voice Operations Facade;
Python/FastAPI Voice Gateway scaffold; provider ports and mock adapters; synthetic proof/media-ticket
handling; allowlisted bilingual Reception Agent policy; transfer/voicemail/callback recovery;
metadata-only observability; focused tests; independent architecture/security review and closure docs.

Reason: the Product Owner instructed Codex to restart at Module 5 and continue to completion while
preserving architecture-first external activation. M004 provider-disabled scope is accepted. The
Decision 032 prohibition on Module 39 remains absolute and unrelated.

Impact: M005 may create code, migrations, local mock fixtures and provider-neutral configuration in
`codex/m005-voice-agent`, but no live telephony/speech/model connection is permitted. The gateway
has no direct database/cache access; durable work passes through a scoped platform facade. Accounts,
number routing, credentials, webhooks, media streams, real calls, cloud STT/model/TTS, recording,
transcription, real caller data, activation, deployment, default-branch merge and Operational status
remain prohibited pending Product Owner activation approval and EXTERNAL_ACTIVATION_REGISTER evidence.
## 2026-08-20 — Decision 034 — M005 provider-disabled acceptance

Decision: The Product Owner formally accepts M005 Voice Agent in its provider-disabled scope at current head `4c6177c`.

Impact: External activation, a shared durable nonce backend, live PostgreSQL/RLS/migration-ledger evidence, provider credentials and numbers, legal recording/consent/retention approvals, merge, deployment and release remain blocked or pending. This acceptance does not authorize starting M006.
## Decision 034 — M006 Public Forms provider-disabled Build gate

- Date: 2026-08-20
- Owner: Product Owner
- Status: Approved for isolated implementation
- Scope: M006 may build only in `codex/m006-public-forms-rebuild` from accepted M005 head `b8db282`.

M006 may add the reusable ES/EN public-form engine, same-origin Astro admission gateway, restricted
application facade, TypeScript domain/validation contracts, Drizzle/Postgres persistence/RLS,
ephemeral encrypted drafts, consent evidence, privacy-preserving abuse controls, accessible renderer,
staff synthetic preview, observability and mock/synthetic owner ports. It must reuse the existing
public Website conventions and establish no parallel CRM, consent, scheduling, payment, channel,
upload or analytics authority.

No live provider, deployment, activation, real notification, appointment/slot, Stripe Checkout,
payment state, upload, sensitive intake, external CAPTCHA, persistent marketing recovery, service
start, merge or release is authorized. Product/legal disclosure text, service policy, retention
durations, provider accounts and external endpoints remain governed by their owner decisions.

## 2026-08-21 — Decision 035 — M006 provider-disabled Product Owner acceptance

Decision: the Product Owner formally accepts M006 Public Forms in its completed provider-disabled
scope at head `6b3518a`.

Reason: after M006 reached its documented acceptance gate, the Product Owner immediately supplied
M007 and had previously authorized sequential continuation without stopping. The Product Owner now
directs that this progression be recorded as the formal M006 acceptance signal.

Impact: M006 is accepted only as a provider-disabled implementation. This acceptance does not
authorize default-branch merge, deployment, release, live PostgreSQL, provider/API activation,
credentials, CRM/calendar/Stripe/channel traffic, sensitive uploads, service start or an
`Operational` claim. All migration/RLS/grant/role, trusted distributed admission, pinned-runtime,
KMS, legal/consent/retention, provider, contract and deployment gates remain blocked or pending.

## 2026-08-21 - Decision 036 - M007 provider-disabled Build gate

Decision: approve ADR 011 and authorize an isolated provider-disabled Build for M007 Authentication
and Client Account in `codex/m007-auth-account-rebuild` from accepted M006 base `3bbf8ef`.

Reason: the Product Owner supplied and approved the complete M007 specification and directed the
Architecture Agent to design this Build. Brownfield audit confirms `packages/auth` and Supabase Auth
are the existing identity foundation; a second user or password system is prohibited.

Impact: M007 may add local code, focused tests, Drizzle migrations, forced-RLS contracts, official
provider adapters in disabled composition, synthetic fixtures and accessible ES/EN client/admin UI.
Supabase Auth remains credential authority; no local password hash table is authorized. All access
decisions remain backend-authoritative.

This gate does not authorize real Supabase/Google/email/OTP/MFA accounts, credentials, network
traffic, production KMS/PostgreSQL evidence, automatic grants from contact matches, merge,
deployment, release or `Operational` status. Missing provider, legal, retention, risk, recovery and
infrastructure decisions remain disabled or fail closed. Sequential TDD, independent architecture
review, read-only Cyber Neo review and Product Owner acceptance are required before M008.

## 2026-08-21 - Decision 037 - M007 provider-disabled Product Owner acceptance

Decision: the Product Owner formally accepts M007 Authentication and Client Account in its
completed provider-disabled scope at documentary head `e66bd6f` on
`codex/m007-auth-account-rebuild`.

Reason: after receiving the M007 completion evidence and acceptance-ready closure, the Product
Owner responded, "Excelente haz el push". The Product Owner now directs that message to be recorded
as the formal acceptance signal for the prepared provider-disabled module scope.

Impact: M007 is accepted only as a provider-disabled implementation. This acceptance does not
authorize or claim default-branch merge, push completion, deployment, release, live PostgreSQL or
RLS validation, provider/API activation, credentials, KMS, external traffic or `Operational`
status. Migrations `0023`-`0035`, the authorized disposable-PostgreSQL RLS harness, Supabase/Google
OAuth/JWKS/email/OTP/CRM integrations, legal/retention policy, pinned Node validation and all
deployment/release gates remain blocked or pending.


## 2026-08-21 - Decision 038 - M008 provider-disabled Build gate

Decision: accept ADR 012 and authorize an isolated provider-disabled Build for M008 Client
Dashboard in `codex/m008-client-dashboard-rebuild` from accepted M007 base `3c1bd4e`.

Reason: the Product Owner supplied and approved the complete M008 specification and directed a
brownfield architecture audit. The repository has one Next.js authenticated surface, M007 IAM and
session controls, shared UI/i18n/design tokens and historical M008 documents, but no `/client` home
or implemented dashboard aggregation service.

Impact: M008 may add one `@atlas/dashboard` read model, typed client projections, deterministic
priority, context/resource/entitlement fences, explicit freshness/partial failure, disabled private
cache contracts, safe analytics, a fail-closed aggregate route and accessible responsive ES/EN UI.
Synthetic owner ports are test-only; configured ports return `unavailable` until their owners are
separately authorized.

This gate does not authorize real client data, live PostgreSQL/RLS, providers, Stripe/calendar/
storage/messaging/CRM traffic, fabricated business state, service execution, shared personalized
cache, credentials/KMS, merge, deployment, release or Operational status. Sequential focused TDD,
independent architecture review, read-only Cyber Neo, documentation closure and Product Owner
acceptance are required before M009 implementation.

## 2026-08-21 - Decision 039 - M008 provider-disabled Product Owner acceptance

Decision: the Product Owner formally accepts M008 Client Dashboard in its completed
provider-disabled scope at commit `09c9403` on `codex/m008-client-dashboard-rebuild`.

Reason: after M008 completion and audit evidence was presented, the Product Owner directed its push
and subsequently identified `09c9403` explicitly as the accepted M008 base for M009.

Impact: M008 is accepted only in provider-disabled scope. Migration `0036`, live PostgreSQL/RLS,
owner/provider integrations, rate-HMAC/trusted-proxy topology, full build/typecheck, visual runtime
review, credentials, legal/privacy/retention policy, merge, deployment, release and `Operational`
status remain blocked or pending.

## 2026-08-21 - Decision 040 - M009 provider-disabled Build gate

Decision: accept ADR 013 and authorize the isolated provider-disabled M009 Mis Servicios Build in
`codex/m009-my-services-rebuild` at
`D:\SG Solutions\SG Solutions\.worktrees\m009-my-services`, from accepted M008 base `09c9403`.

Reason: the Product Owner supplied and approved the complete M009 specification, identified the
accepted base and instructed the Architecture Agent to audit M001-M008 and produce an executable
provider-disabled architecture that reuses `/client/services` and M008 without inventing services
or data.

Impact: M009 may add one `@atlas/client-services` read-model package, minimized list/detail DTOs,
deterministic status synthesis, explicit service grants, unseeded Drizzle schema/migration contracts,
disabled Postgres and owner adapters, M007/M008 authorization/admission reuse, API/SSR route
composition, an M008 summary adapter, accessible ES/EN UI, metadata-only observability and
synthetic-only focused tests. Configured owners remain unavailable until separately activated.

This gate does not authorize service definitions, seed data, real client/service records, live
PostgreSQL/RLS, Stripe/Calendar/Storage/CRM/partner/AI traffic, credentials, payment or workflow
commands, service activation, fabricated state, shared personalized cache, merge, deployment,
release or `Operational` status. Deferred commercial, cancellation, renewal, participant, support,
analytics and freshness policies remain disabled. Independent architecture review, read-only Cyber
Neo review and Product Owner acceptance are required before M010 implementation.

## Decision 041 - Product Owner acceptance of M009 at commit 6667872

- Date: 2026-08-23
- Status: Accepted
- Owner: Product Owner
- Scope: M009 Mis Servicios

The Product Owner accepts provider-disabled M009 at commit 6667872 as M010 base. This does not
authorize providers, production data, merge, deployment or release. Static architecture/security
reviews had zero open Critical/Important findings. Final automated rerun remains NO VALIDADO
because pnpm failed EPERM; this decision does not turn it into passing evidence.

## Decision 042 - Accept ADR 014 and open provider-disabled M010 Build

- Date: 2026-08-23
- Status: Accepted
- Owner: Product Owner
- Base/worktree: M009 6667872 / .worktrees/m010-process-status

The Product Owner accepts ADR 014 and authorizes M010 under the approved specification, PRD,
2026-08-23 design and plan. M010 is a request-scoped read-only projection for one authorized M009
ServiceOrder and must reuse M007 context/authorization, M008 priority and M009 refs/eligibility/
fences.

Allowed: engine, existing routes, deterministic policies, source registry, truthful failures,
ES/EN accessible UI and tests. Not allowed: parallel catalog; mutable M010 truth; M010 schema,
writer, materializer or job; invented data; providers; payment-driven start; AI decisions; merge,
deployment or release. Concrete mappings stay disabled. M011 remains blocked.
# 2026-08-23 — M011 secure document core Build decisions

- Product Owner approved initial content-validated PDF, JPEG and PNG uploads up to 25 MiB.
- Self-hosted ClamAV is the initial malware-scanning direction; a timeout, failure or unavailable
  scanner remains quarantined and never promotes.
- MinIO/S3-compatible private storage remains behind the M011 storage boundary. Object keys are
  opaque and no bucket, public URL or credential is committed.
- Legal hold, archive and soft-delete state are implemented. Automatic physical purge and retention
  windows remain `[NEEDS PRODUCT OWNER DECISION: approved legal retention schedule and purge authority]`.
- M011 completion evidence is implementation-level only. Product Owner acceptance, real migrations,
  RLS role verification, storage provisioning, ClamAV activation and deployment remain separate gates.

## Decision 043 - M013 client appointments completion boundary

- Date: 2026-08-23
- Status: Accepted by Product Owner in provider-disabled scope
- Owner: Product Owner
- Scope: M013 Client Appointments

The Product Owner directed completion of M013's own scheduling authority. M013 therefore owns durable
appointment records, availability derivation, holds, conflict-safe booking, reprogramming,
cancellation, client-safe projection, schedule audit and post-commit provider-neutral handoffs.
M024 owns the staff calendar workspace, M026 delivery, M014 payments, M003-M006 channel entry points
and M041 concrete provider adapters. None of those future modules may replace or bypass M013's
capacity and authorization authority. This records no provider activation, database migration,
deployment or production operation.

## Decision 044 - M014 client payments and billing completion boundary

- Date: 2026-08-23
- Status: Accepted by Product Owner in provider-disabled scope
- Owner: Product Owner
- Scope: M014 Client Payments and Billing

M014 owns the provider-neutral financial boundary: immutable server-owned money obligations,
financial history, signed provider-event admission, idempotency, reconciliation-ready records and
client-safe billing projections. Payment confirmation is a financial prerequisite only and cannot
authorize service start; human internal approval remains a distinct M021-owned fact. M042/M046 own
catalog and pricing policy, while future provider activation, migrations, Stripe traffic, invoices,
refunds, disputes, tax, external-payment review and production operation remain separate gates.
## Decision 045 - M015 provider-disabled foundation

- Date: 2026-08-23
- Status: Implemented foundation; Product Owner operational activation pending
- M015 may provide typed, purpose-bound contracts and a protected guidance surface before the canonical Client/Organization, consent, audit, encryption and RLS owners are activated.
- The foundation stores no profile values, creates no schema with weak ownership references and fails closed unless a future approved repository supplies exact client, context, epoch, purpose and consent evidence.

## Decision 046 - M015 Package B self-service goals

- Date: 2026-08-23
- Status: Approved by Product Owner; deployment remains disabled by default
- Package B permits only client-owned, allowlisted general goal codes and reviewable goal proposals in
  the active M007 personal portal context.
- It excludes personal identity, address, household, financial, credit, tax, business, document,
  provider, external notification and AI data. No submitted goal starts a service.

## Decision 047 — M015 Package C direction approved; policy values pending

- Date: 2026-08-23
- Authority: Product Owner
- Status: approved architectural direction; not a sensitive-data activation

The Product Owner approved proceeding toward M015 Package C. This authorizes preparation of the
purpose-bound sensitive-profile slice only after the applicable PFL policy values are explicitly
recorded. It does not authorize any real sensitive field, KMS key custody, retention schedule,
staff-access matrix, relationship model, provider import, AI access, notification, analytics,
migration, deployment or feature-flag activation.
## Decision 048 — M015 C1 home-buying financial proposal baseline

- Date: 2026-08-23
- Authority: Product Owner
- Status: approved provider-disabled implementation baseline

The first sensitive M015 slice is limited to self-reported monthly gross income and recurring monthly
debt in USD/monthly cadence for home_buying_preparation. Submissions are immutable, unverified
proposals and may produce only a preliminary DTI; they never produce eligibility, underwriting,
lender, affordability, approval or service-start results. All other sensitive M015 categories remain
disabled. Ciphertext persistence requires an approved KMS adapter and real RLS/audit/retention
evidence; the default runtime fails closed.

## Decision 049 - M016 Administrative Dashboard provider-disabled Build

- Date: 2026-08-24
- Authority: Product Owner
- Base/worktree: M015 `0dfa6dc` / `.worktrees/m016-admin-dashboard-build`
- Status: implementation authorized; acceptance pending

M016 may add a dedicated read-only administrative dashboard contract, deterministic priority policy,
per-widget authorization boundary, provider-disabled aggregation runtime, safe route/API posture and
bilingual accessible UI. Every widget remains a minimized projection with explicit evidence state;
missing owners must be unavailable, never zero. The dashboard cannot own CRM, client, case, payment,
document, appointment, communication, approval, provider or audit truth and cannot issue sensitive
commands.

This gate excludes real staff/client data, database migrations, RLS activation, provider calls,
background jobs, saved-view persistence, exports, impersonation, realtime, deployment, merge,
release and Operational status. Architecture and security closure plus Product Owner acceptance are
required before M017.

## Decision 050 - M017 CRM provider-disabled Build

- Date: 2026-08-24
- Authority: Product Owner
- Base/worktree: M016 `4384d8c` / `.worktrees/m017-crm-build`
- Status: implementation authorized; acceptance pending

M017 may add a dedicated, internal CRM commercial-workspace contract with exact permission and
purpose-binding fences, version-checked pipeline transition validation, minimized relationship,
opportunity, activity and duplicate-candidate projections, a provider-disabled fail-closed route/API
posture and bilingual accessible UI. Duplicate review is review-only; no automatic identity merge,
client activation, conversion, payment confirmation or service start is permitted.

This gate excludes canonical Person/Client/Organization/Lead/ServiceOrder/CaseFile/Task ownership,
database migrations, RLS activation, CRM records, commands, assignments, imports/exports, AI,
marketing, provider calls, real staff/client data, deployment, merge, release and Operational status.
Product Owner acceptance remains required before M018.

## Decision 051 - M018 Client Management provider-disabled Build

- Date: 2026-08-24
- Authority: Product Owner
- Base/worktree: M017 `be2794b` / `.worktrees/m018-client-management-build`
- Status: implementation authorized; acceptance pending

M018 may add a typed ClientRelationship and lifecycle policy, minimized sectioned Client 360
projections, representative-proposal controls, a provider-disabled fail-closed Admin route/API posture
and bilingual accessible UI. A User/account, CRM relationship, service, payment or invitation never
becomes a client relationship, client state or representative access grant by implication.

This gate excludes schema/migrations, real Person/Household/Client data, RLS activation, actual
assignments/representatives/restrictions/notes, owner commands, organization management, imports,
exports, AI, providers, deployment, merge, release and Operational status. Product Owner acceptance
remains required before M019.

## Decision 052 - M019 Organization Management provider-disabled Build

- Date: 2026-08-24
- Authority: Product Owner
- Base/worktree: M018 `6017ef4` / `.worktrees/m019-organization-management-build`
- Status: implementation authorized; acceptance pending

M019 may add a typed Organization and person-organization relationship boundary, state policy guarded
by reauthentication and version evidence, minimized authorized projections, a provider-disabled
fail-closed Admin route/API posture and bilingual accessible UI. Ownership, role, relationship or
organization state never grants portal/client access by implication.

This gate excludes schema/migrations, real organization data, ownership, registered agents, filings,
compliance records, EIN requests, client access grants, CRM/client/profile duplication, owner commands,
imports, exports, AI, providers, deployment, merge, release and Operational status. Product Owner
acceptance remains required before M020.

## Decision 056 - M019 provider-disabled foundation acceptance

- Date: 2026-08-24
- Authority: Product Owner
- Status: accepted foundation; operational activation pending

The Product Owner accepts M016-M019 as provider-disabled technical foundations. For M019 this
approves the bounded contract, UI, route and safe fail-closed posture only. It does not approve
canonical organization data, ownership, representatives, registered agents, filings, compliance,
client access, CRM integration or operational activation.

## Decision 057 - M021 commercial module decomposition

- Date: 2026-08-25
- Owner: Product Owner
- Decision: M020 remains Leads. M021 combines Service Orders/Catalog/Commercial Workflows (M021A) and Marketplace/Partners/Referrals (M021B) as complementary parts of one commercial module.
- Status: Provider-disabled technical foundation in progress; no external provider, payment, referral, deployment or operational activation is authorized by this decision.

## Decision 058 - M022-M026 provider-disabled foundation sequence

- Date: 2026-08-25
- Owner: Product Owner
- Status: implementation foundations in progress; Product Owner final acceptance pending

The Product Owner authorized sequential work for M022 through M026. M022 composes M006 rather than creating a second form engine. M023 supplies central task policy, M024 human approval policy, M025 a disabled AI control plane and M026 provider/operations gating. All external providers, persistence activation, migrations, production deployment and operational execution remain disabled pending separate approvals.

## Decision 059 - M027-M030 provider-disabled foundation sequence

- Date: 2026-08-25
- Owner: Product Owner
- Status: implementation foundations in progress; Product Owner final acceptance pending

The Product Owner authorized the sequential M027 governance, M028 analytics, M029 tradeline and M030 tax foundations. These packages are policy and safety boundaries only. They must fail closed and may not execute legal/privacy disposition, provider referral, tradeline placement, tax calculation, e-file submission, payment, migration or deployment without a separate approved activation gate.

## Decision 060 - M031 bookkeeping provider-disabled foundation

- Date: 2026-08-25
- Owner: Product Owner
- Status: implementation foundation in progress; Product Owner final acceptance pending

The Product Owner authorized M031 Bookkeeping and Accounting. The provider-disabled foundation may validate ledger mechanics and readiness policies only. It may not connect a bank, use QuickBooks/Xero, retain financial records, automatically classify/post/reconcile transactions, calculate tax, submit a filing, initiate payment, run a migration or deploy without separate approvals.

## Decision 061 - M031 controlled bookkeeping Build Gate

- Date: 2026-08-25
- Authority: Product Owner
- Status: implementation authorized; operational/provider activation remains pending

The Product Owner authorized the controlled internal implementation of M031 after the provider-disabled foundation. This Build Gate permits Drizzle-owned schema and migrations, PostgreSQL repositories, authenticated internal/client projections, controlled ledger commands, audit/outbox evidence and focused testing in the isolated M031 branch. It does not authorize a bank feed, QuickBooks, Xero, external accounting synchronization, provider credential, automatic classification/posting/reconciliation, tax calculation, tax filing, payment initiation, external financial export, production deployment, merge or release. All provider-facing capabilities remain disabled and fail closed.

## Decision 062 - M007 purpose-bound bookkeeping close-review delegation

- Date: 2026-08-25
- Authority: Product Owner
- Status: implementation authorized; operational acceptance pending

The Product Owner approves an M007-issued, revocable delegation solely for
`bookkeeping_period_close_review`. A delegation binds one reviewer, one accounting entity, the
client-owned context, owner and reviewer authorization/policy epochs, an explicit expiry and an
immutable grant identifier. It is additive to, and never replaces, the reviewer's AAL2 role
permission. M031 must verify it transactionally before approving a close. It grants no general
client-data access, posting, payment, tax, provider, export or external-execution capability.

## 2026-08-25 - M032 business formation controlled boundary

**Decision:** Business Formation must use deterministic, versioned requirements and readiness
rules; filing is a provider-adapter action that remains disabled until a separately approved
activation. Payment, approval, signature, documents, and a permitted filing method are distinct
preconditions. AI may explain or prepare review material only and cannot select an entity, approve,
price, sign, or file. The persistence gateway uses RLS and immutable filing-outcome records.

**Rationale:** Formation has legal, financial, privacy, and operational consequences. A
provider-disabled boundary preserves future integrations without allowing an unreviewed UI, model,
or payment event to create external legal effects.

## Decision — 2026-08-25 — M034 Controlled Compliance Foundation

The Product Owner authorized the controlled technical foundation for M034 — Business Compliance.

Decision:

- Compliance requirements must be effective-dated, source-backed, jurisdiction-aware and versioned before they can drive an obligation or deadline.
- The application may organize compliance work, calculate deterministic deadlines from approved rules, create reminders, prepare filing packages and preserve evidence.
- Provider filing execution, regulator submission, government-portal automation and legal conclusions remain disabled by default. A payment, reminder, prepared package or client action never authorizes a filing.
- Compliance completion requires human-gated evidence. Ownership-reporting requests require professional review and cannot be automatically classified as a filing outcome.
- Existing Organization Management remains the shared organization system of record; the M034 client projection is a minimal safe summary rather than a duplicate organization, document or calendar interface.
- Changes to requirements must use a new version and produce impact analysis for active obligations. Existing work retains its compliance snapshot.

Status: controlled foundation implemented. Provider enablement, legal/compliance approval, verified source operations, jurisdiction-specific configuration, migrations, live integrations and production activation remain pending Product Owner approval.

## Decision — 2026-08-25 — M035 Business Funding Controlled Foundation

The Product Owner authorized the controlled technical foundation for M035 — Business Funding.

Decision:

- M035 is a preparation, education, document-packaging, comparison and referral domain. It is not a lender, underwriting authority, guarantor or external-application executor.
- Funding profiles, financial profiles, product versions, screening rules, matches, packages, consents, provider outcomes and lifecycle records preserve source lineage and immutable versions where material.
- Preliminary screening and matching are explainable indicators only. They must not represent approval, expected rate, expected amount, term or funding result.
- Provider-originated decisions, offers and funding confirmation require verified external evidence. Client selection records an internal choice only; it does not accept a provider contract.
- Provider status remains disabled by default. Provider data sharing, application submission, credit pull, offer retrieval and funding confirmation integrations remain fail-closed until approved activation evidence exists.
- Commission recognition remains separate from client payments and requires partner reconciliation.
- AI may create grounded drafts only. It may not publish recommendations, submit applications, change outcomes, accept offers or mark funding as confirmed.

Status: controlled foundation implemented. Provider onboarding, jurisdiction-specific rules, agreements, disclosures, human approval roles, live adapters, migrations, security/compliance reviews and production activation remain pending Product Owner approval.

## 2026-08-25 - M036 Home Buying Assistance controlled foundation

**Decision:** Home Buying Assistance is implemented as a controlled education, readiness, coordination, and evidence-tracking domain. It is not a lender, mortgage broker, real-estate broker, title agent, escrow provider, underwriting engine, or closing authority.

**Controls:** Program content must be source-backed and reviewed; readiness and matching remain preliminary; externally reported milestones require verified evidence; lender referrals and external data sharing fail closed while providers are disabled; AI cannot decide eligibility, rank lenders, submit applications, create offers, or direct wire activity.

**Status:** Technical foundation implemented. Provider activation, operational policies, external integrations, and production release remain pending Product Owner authorization.
## 2026-08-25 - M037 Financial Marketplace controlled foundation

**Decision:** The existing Marketplace package is the single Marketplace foundation. It is extended with provider-identified catalog content, versioning, source freshness, scoped consent, deterministic referral journeys, verified conversions, and commission lifecycle controls. Marketplace products remain distinct from SG Solutions services and client billing.

**Controls:** Providers are disabled by default and cannot be enabled through application configuration. Referral submission, redirect, data sharing, provider credentials, webhooks, and integrations fail closed. Personalization requires scoped consent and excludes protected or sensitive factors. Commission recognition requires a verified provider conversion plus a contract reference and versioned calculation rule.

**Status:** Technical foundation implemented. No partner is connected, activated, or operational. Product Owner authorization is required before any provider activation.
## 2026-08-25 - M038 Recommendation Engine controlled foundation

**Decision:** Recommendation Engine is an explainable, policy-driven, source-backed ranking layer. It receives immutable candidates and eligibility results from authoritative domain modules and must not duplicate, override, or infer eligibility, underwriting, provider terms, external approvals, or client decisions.

**Controls:** Unknown hard constraints fail closed. Published policies require human approval and source lineage. Compensation, commission, protected-trait, and sensitive features are excluded from organic ranking. Personalization requires scoped consent and is cleared on withdrawal. Specialist review preserves the original candidate set. AI is limited to grounded explanations that require human review and cannot change policies, rankings, eligibility, providers, referrals, or external state.

**Status:** Technical foundation implemented. No live personalized recommendations, experiments, AI provider, external candidate feed, provider action, or production release is enabled.
## 2026-08-25 - M039 CreditCardBroker controlled foundation

The Product Owner authorized an M039 provider-disabled technical foundation. CreditCardBroker is represented only as an external affiliate/network adapter under M037; advertisers remain distinct and M038 retains ranking authority. No credentials, API, JavaScript, feed, CTA, redirect, referral, application, data sharing, webhook, commission feed, deployment or activation is authorized.

## 2026-08-25 - M040 Partner Management controlled foundation

The Product Owner authorized M040 as a provider-disabled central Partner Registry foundation. M035, M036, M037 and M039 must reuse Partner IDs rather than create separate partner sources of truth. Portal access, referrals, routing, integrations, data sharing, webhooks, payments, settlements, production migration and activation remain unauthorized pending a separate Product Owner decision and security/compliance evidence.

## 2026-08-26 - M041 Provider Abstraction controlled foundation

The Product Owner authorized M041 as a provider-disabled technical foundation. Provider records are technically distinct from M040 partner records. Canonical provider interfaces, adapter contracts, secret-reference configuration, endpoint allowlists, conservative status normalization, idempotency controls and persistence models may be implemented without activating any external provider. Live adapters, routing, failover, webhooks, polling, file exchange, credentials, provider production configuration and external calls require a separate Product Owner activation decision with security, legal, testing, monitoring and rollback evidence.

## 2026-08-26 - M042 Service Catalog controlled foundation

The Product Owner authorized implementation of M042 from the approved four-part specification. M042 extends the canonical commercial-catalog bounded context with versioned service definitions, commercial/document/intake/workflow references, discovery/publication readiness, surface projections and governance controls. It does not activate service publication, checkout, pricing, forms, workflows, documents, appointments, providers, partners, RLS deployment or production behavior. AI remains unable to approve, publish, retire, change prices, workflows or disclosures.
