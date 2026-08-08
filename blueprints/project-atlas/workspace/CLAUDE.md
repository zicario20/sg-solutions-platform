# Project Atlas

- Owner: Product Architect
- Status: Active agent contract
- Update rule: synchronize with architecture, commands and launch policy changes

Production-ready operating platform for SG Solutions LLC: one organization, public acquisition site,
private operations app and explicitly delegated client portal.

## Commands

| Task | Command |
|---|---|
| Install | `corepack pnpm install --frozen-lockfile` |
| Skill preflight | `corepack pnpm skills:preflight` |
| Dev | `corepack pnpm dev` |
| Build | `corepack pnpm build` |
| Typecheck | `corepack pnpm typecheck` |
| Lint / format | `corepack pnpm lint` · `corepack pnpm format` |
| Unit/integration | `corepack pnpm test` · one file: `corepack pnpm exec vitest run tests/unit/tokens.test.ts` |
| E2E | `corepack pnpm test:e2e` · one file: `corepack pnpm exec playwright test tests/e2e/client-portal.spec.ts` |
| DB service | `docker compose up -d --wait postgres` |
| DB migrate | `DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate` |
| DB generate | `DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:generate` |
| DB seed | `corepack pnpm db:seed` |

**Gate:** `corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm build && corepack pnpm test:e2e` must pass.

## Stack

Astro public site · Next.js App Router private app · TypeScript/Node · Tailwind + Radix/shadcn ·
Supabase Postgres/Auth/Storage · Drizzle · Stripe · Sanity public CMS · Inngest · Vercel.

## Read before work

1. `PROJECT_CONTEXT.md` and `PROJECT_STATE.md`.
2. The relevant approved PRD under `docs/modules/`.
3. Applicable ADRs and path-scoped rules.
4. The active documentary blueprint and roadmap authorities. The former E1–E3 queue exists only under `../archive/pre-roadmap-2026-08-02/` as non-executable history.

No product code may be written before the module PRD is approved. Approved documentation prevails
over code and chat until the Product Owner approves a documented change.

Current restriction: Phase 0 documentary review only. No executable task queue exists. A future queue may be derived from approved PRDs only after an explicit Build gate and Product Owner authorization.

## Required local skills and preflight

| Phase | Required source | Gate |
|---|---|---|
| Architecture/PRD | `the-architect-main/` | Approved module PRD and applicable ADRs exist. |
| Visual design | `ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/` | Stack is detected; `design-system/project-atlas/MASTER.md` and any page override are persisted before UI code. |
| Implementation/correction | `superpowers-main/` | A plan exists under `docs/superpowers/plans/`; isolated baseline is clean; TDD and verification rules are active. |
| Security audit | `cyber-neo-main/skills/cyber-neo/` | Audit is read-only and performed by an agent other than the implementer/corrector. |

Before a phase, confirm its local path exists and read its `SKILL.md`. If it is unavailable, stop that phase and report the blocker; do not improvise a silent substitute. Skills never override the PRD, ADRs, `AGENTS.md` or Product Owner decisions, and product tests/builds must not depend on a skill runtime.

## Architecture

Public visitor → Astro form → Next `/api/v1/leads` → domain service → Drizzle/Postgres. Staff/client
request → Next server boundary → Supabase identity → domain authorization → RLS → data/Storage.
Stripe, Google, Sanity and Inngest are adapters around domain services; none owns operational state.

| Layer | May import | Must never |
|---|---|---|
| `apps/*` | named packages | Open DB connection or duplicate domain rules |
| `packages/ui` | tokens, validation types | domain/database/server code |
| `packages/domain` | validation, database ports | Next, Astro or UI |
| `packages/database` | Drizzle, Postgres | apps or provider UI SDKs |
| `packages/auth` | Supabase identity, domain actor types | infer resource access from email |

No package named `shared`. Relative TypeScript imports include `.ts`; cross-package imports use
`@atlas/*`; each package manifest exports its canonical `src/index.ts` entry.

## Sources of truth

| Concern | Authority |
|---|---|
| Identity | Supabase Auth |
| Business authorization | Domain permission map + Postgres RLS + Storage policies |
| Schema/migrations | `packages/database/src/schema.ts` + generated Drizzle migrations |
| Operational/payment state | Postgres; Stripe is authoritative for external financial state |
| Public content | Sanity only |
| Jobs | Postgres durable rows; Inngest only coordinates |
| Current status | `PROJECT_STATE.md` |
| History | append-only `PROJECT_MEMORY.md` |
| Important decisions | `DECISIONS.md` and `docs/adr/` |

## Code rules

1. Server-first; `"use client"` only on the smallest interactive leaf.
2. Validate every boundary with Zod; reject unknown write fields.
3. Domain services take an actor and authorize before I/O.
4. Client email association grants nothing; case/document/invoice/appointment grants are explicit.
5. Money is integer minor units plus currency; times are UTC instants plus IANA zone.
6. Every mutation, webhook and job is idempotent; provider events may repeat and arrive out of order.
7. Generated migration filenames belong to Drizzle; do not invent or hand-edit them.
8. No component exceeds 300 lines; split by responsibility.
9. No new dependency without rationale, source verification and lockfile update.

## Design system

Headings Manrope; body Inter. Primary `#0A2540`, action `#0B63CE`, accent `#00A3E0`, success
`#2E7D32`, gold `#B7791F`, surface `#F7F9FC`, ink `#102033`. Cyan/gold are not normal body text on
white. Spacing: 4/8/12/16/24/32/48/64px. Radius: 10px controls, 16px cards. Motion: 150–240ms,
transform/opacity only, reduced-motion compliant. WCAG 2.2 AA, mobile-first, 320px reflow.

Existing logos require vectorization and responsive production lockups before release.

## Sensitive data

Never send documents, SSN/IDs, tax data, bank statements, credit reports, case notes, portal free
text or raw request bodies to logs, Sentry, PostHog or traces. Sentry keeps `sendDefaultPii:false`;
portal autocapture/session replay are off. Storage is private and uses short-lived signed URLs.

## Multi-agent workflow

Required order: approved PRD/architecture -> UI/UX Pro Max handoff when visual -> Superpowers plan -> isolated red-green-refactor implementation -> automated gates -> independent code audit -> Cyber Neo audit when security-sensitive -> correction -> retest/re-audit -> Product Owner gate.

Cyber Neo is mandatory for auth/RLS/Storage, Stripe/webhooks, documents or sensitive client/tax/credit data, migrations, CI/deploy, telemetry and AI access to client data. It may write only its external report, never inside the target project. It must not run application code, install or update packages, apply fixes, or reproduce secret values. It supplements but does not replace legal or compliance review.

1. Implementer works in an isolated branch/PR and does not self-audit.
2. CI passes fully.
3. Independent auditor performs a read-only first review against PRD, rules, security and tests.
4. Corrector addresses each material finding and adds regression tests.
5. A separate re-audit passes before merge.
6. Product Owner approves auth, payment, DB, security, architecture, production and destructive work.

## Deferred rules

| File | Applies to |
|---|---|
| `.claude/rules/database.md` | database, schema, migrations |
| `.claude/rules/security.md` | auth, domain services, API, Storage |
| `.claude/rules/payments.md` | Stripe, billing, jobs |
| `.claude/rules/ui.md` | app/public UI and tokens |
| `.claude/rules/documentation.md` | root/docs markdown |

## Non-negotiable

1. Never change production schema or RLS manually in Supabase dashboard.
2. Never infer client resource access from an email match or hidden UI.
3. Never put private operational data in Sanity or sensitive payloads in telemetry.
4. Never write product code without an approved module PRD.
5. Never merge without CI, independent audit, correction and re-audit.
6. Never commit secrets, `.env`, production data or generated build output.
7. Never mark a task done with a failing gate or missing PCR/state updates.
