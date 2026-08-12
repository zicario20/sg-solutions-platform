# M018 Client Management — documentary completion plan

> Plan owner: Codex Architecture Agent
>
> Final approver: Product Owner
> Authorization: Decision 027; Product/Architecture documentation only; no Build gate

**Goal:** Convert the complete Product Owner M018 source into an implementation-ready, branded,
secure and auditable Client Management specification without implementing product behavior.

**Architecture:** Keep M018 inside the approved modular monolith. M018 owns canonical natural-person
and household identity, contact methods, the formal client relationship and its lifecycle,
assignments, scoped representatives, client-level flags/restrictions, onboarding/offboarding and
client-level operational notes. It composes M017 CRM, M019 Organization, M021 ServiceOrder, M022
CaseFile, M023 Task, M011 Document, M014 Billing, M013 Appointment, M012/M025 Communication, M078
Consent and M007 portal/security facts through typed minimized owner ports. It never copies their
records or treats a 360 view as a new source of truth.

**Approved baseline:** pnpm/Turborepo, Astro public site, Next.js authenticated app, Supabase Auth /
Postgres / private Storage, Drizzle-only migrations, Sanity public content, Inngest coordination and
strictly minimized observability. No dependency, route, schema, provider or runtime change is in
scope.

---

## Task 1 — Normalize the complete source

**Create:**

- `docs/modules/m018-client-management.md`
- `docs/superpowers/specs/2026-08-12-m018-client-management-design.md`
- `docs/adr/022-client-party-lifecycle-representation-and-aggregate-boundary.md`

**Modify:**

- `docs/modules/client-case-management.md`
- `docs/modules/m017-crm.md`
- `docs/adr/021-party-crm-opportunity-conversion-and-merge-boundary.md`
- `docs/adr/README.md`

Requirements: preserve every source capability; assign Release 1A, 1B or Future; include the 21
required PRD sections; use `[NEEDS PRODUCT OWNER DECISION: ...]` instead of inventing policy. Keep
Person/Household/Client lifecycle in M018 while Organization, Lead, ServiceOrder, CaseFile, Task,
documents, billing, appointments, communications, consent and identity/session state remain owned by
their modules.

## Task 2 — Synchronize repository authorities

**Modify:**

- `MASTER_PRD.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`
- `API.md`, `DATABASE.md`, `DATA_CLASSIFICATION.md`, `SECURITY.md`,
  `BACKUP_AND_RECOVERY.md`
- `ROADMAP.md`, `docs/roadmap/MODULE_CATALOG.md`,
  `docs/roadmap/DEPENDENCY_MAP.md`
- `EXTERNAL_ACTIVATION_REGISTER.md`
- `docs/research/MODULES_01_21_INTAKE_REVIEW.md`

Requirements: make M018 ownership consistent everywhere; register every Product Owner/activation
decision; preserve the 110-module roadmap; distinguish documentary completion from product
implementation.

## Task 3 — Independent review and security audit

**Create:**

- `docs/reviews/M018-ARCHITECTURE-REVIEW.md`
- `docs/reviews/M018-SECURITY-REVIEW.md`

Inspect complete source coverage, domain ownership, identity resolution, client lifecycle,
representative delegation/revocation, per-section authorization, purpose limitation, aggregation,
partial failure, notes, exports, impersonation, retention/deletion, AI boundaries and recovery.
Remediate every confirmed P0–P3/material security finding and re-review.

## Task 4 — Final evidence and isolated commit

**Modify:**

- `CHANGELOG.md`
- `PROJECT_MEMORY.md`
- `PROJECT_STATE.md`

Run Biome, 11-package typecheck, Vitest, import contracts, Astro build, active Markdown-link check,
two frozen offline lockfile-only installations with unchanged lock hash and `git diff --check`.
Confirm no product source, dependency, provider, secret or real customer data changed. Commit only
to `codex/m018-client-management`; do not push or merge.
